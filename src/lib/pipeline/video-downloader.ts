import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

import type { VideoAsset } from "./types";

// ---------------------------------------------------------------------------
// YouTube ID extraction
// ---------------------------------------------------------------------------

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // bare ID
  ];
  for (const pat of patterns) {
    const match = url.match(pat);
    if (match) return match[1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Run a command and return stdout
// ---------------------------------------------------------------------------

function run(
  cmd: string,
  args: string[],
  timeoutMs = 60_000,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
    });
  });
}

// ---------------------------------------------------------------------------
// Search YouTube for a background video
// ---------------------------------------------------------------------------

const GOOD_KEYWORDS = ["background", "loop", "4k", "cinematic", "ambient", "motion", "abstract", "dark"];

export async function searchYouTubeBackground(
  query: string,
): Promise<{ id: string; title: string } | null> {
  console.log(`[video] Searching YouTube: "${query}"`);

  const { stdout } = await run("yt-dlp", [
    `ytsearch5:${query}`,
    "--get-title",
    "--get-id",
    "--no-download",
    "--no-warnings",
  ], 30_000);

  const lines = stdout.trim().split("\n").filter(Boolean);
  if (lines.length < 2) {
    console.warn("[video] No search results found");
    return null;
  }

  // Parse interleaved title/id pairs
  const results: { title: string; id: string; score: number }[] = [];
  for (let i = 0; i < lines.length - 1; i += 2) {
    const title = lines[i].trim();
    const id = lines[i + 1].trim();
    if (!id || id.length !== 11) continue;

    // Score by keyword matches in title
    const lowerTitle = title.toLowerCase();
    const score = GOOD_KEYWORDS.reduce(
      (s, kw) => s + (lowerTitle.includes(kw) ? 1 : 0),
      0,
    );
    results.push({ title, id, score });
  }

  if (results.length === 0) return null;

  // Pick highest-scoring result
  results.sort((a, b) => b.score - a.score);
  const best = results[0];
  console.log(`[video] Best match: "${best.title}" (${best.id}, score: ${best.score})`);
  return { id: best.id, title: best.title };
}

// ---------------------------------------------------------------------------
// Download a 30-second clip from YouTube
// ---------------------------------------------------------------------------

export async function downloadVideoClip(
  youtubeId: string,
  outputDir?: string,
  source: "youtube-search" | "user-provided" = "youtube-search",
): Promise<VideoAsset> {
  const dir = outputDir ?? path.join(os.tmpdir(), "overkill-video");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const outputPath = path.join(dir, "hero-bg.mp4");
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;

  console.log(`[video] Downloading 30s clip from ${url}...`);

  // Get title first
  let title = youtubeId;
  try {
    const { stdout } = await run("yt-dlp", ["--get-title", "--no-download", url], 15_000);
    title = stdout.trim() || youtubeId;
  } catch {
    // Keep ID as title
  }

  // Try downloading with --download-sections for a 30s clip
  try {
    await run(
      "yt-dlp",
      [
        "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
        "--download-sections", "*0-30",
        "--merge-output-format", "mp4",
        "-o", outputPath,
        "--no-warnings",
        "--force-overwrites",
        url,
      ],
      120_000,
    );
  } catch {
    console.log("[video] --download-sections failed, downloading full then clipping with ffmpeg...");

    const fullPath = path.join(dir, "hero-full.mp4");

    // Download full video
    await run(
      "yt-dlp",
      [
        "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", fullPath,
        "--no-warnings",
        "--force-overwrites",
        url,
      ],
      180_000,
    );

    // Clip to 30s with ffmpeg
    await run(
      "ffmpeg",
      ["-y", "-ss", "0", "-t", "30", "-i", fullPath, "-c", "copy", outputPath],
      30_000,
    );

    // Clean up full file
    try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error(`Video download failed — ${outputPath} not found`);
  }

  const stat = fs.statSync(outputPath);
  console.log(`[video] Downloaded: ${(stat.size / 1024 / 1024).toFixed(1)}MB → ${outputPath}`);

  return {
    localPath: outputPath,
    filename: "hero-bg.mp4",
    durationSec: 30,
    source,
    youtubeId,
    youtubeTitle: title,
  };
}
