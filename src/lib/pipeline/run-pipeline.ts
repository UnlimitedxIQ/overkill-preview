import Anthropic from "@anthropic-ai/sdk";

import { runExecutor, runExecutorRevision } from "./executor";
import { runPlanner } from "./planner";
import { runReviewer } from "./reviewer";
import type {
  BuildOutput,
  PipelineCallbacks,
  PipelineInput,
  PipelineResult,
  ReviewVerdict,
  VideoAsset,
} from "./types";
import {
  downloadVideoClip,
  extractYouTubeId,
  searchYouTubeBackground,
} from "./video-downloader";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_REVISIONS = 2;

// ---------------------------------------------------------------------------
// Pipeline orchestrator
// ---------------------------------------------------------------------------

export async function runPipeline(
  input: PipelineInput,
  callbacks: PipelineCallbacks,
): Promise<PipelineResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
  }

  const client = new Anthropic({ apiKey });
  const reviewHistory: ReviewVerdict[] = [];
  let revisionCount = 0;

  // ── Stage 1: Planning + Site Mapping ───────────────────────────────────
  callbacks.onStageChange("planning", "Analyzing site and generating design spec...");
  callbacks.onProgress(5);

  console.log(`[pipeline] Stage 1: Planning — ${input.url}`);
  const spec = await runPlanner(client, input);
  callbacks.onProgress(25);

  console.log(
    `[pipeline] Planner complete — site type: ${spec.analysis.siteType}, ` +
      `palette: ${spec.analysis.colorPalette.join(", ")}, ` +
      `site map: ${spec.siteMap.links.length} links, ${spec.siteMap.images.length} images`,
  );

  // ── Stage 1.5: Video Download ─────────────────────────────────────────
  let videoAsset: VideoAsset | undefined;
  try {
    if (input.heroVideoUrl) {
      // User provided a YouTube URL
      const id = extractYouTubeId(input.heroVideoUrl);
      if (id) {
        callbacks.onStageChange("planning", "Downloading hero video...");
        videoAsset = await downloadVideoClip(id, undefined, "user-provided");
      }
    } else {
      // Check if planner generated a video query
      const heroStep = spec.buildSteps.find(
        (s) => s.section.toLowerCase().includes("hero"),
      );
      if (heroStep?.videoQuery) {
        callbacks.onStageChange("planning", "Finding hero background video...");
        const result = await searchYouTubeBackground(heroStep.videoQuery);
        if (result) {
          callbacks.onStageChange("planning", "Downloading hero video...");
          videoAsset = await downloadVideoClip(result.id);
        }
      }
    }

    if (videoAsset) {
      spec.videoAsset = videoAsset;
      console.log(`[pipeline] Video ready: ${videoAsset.youtubeTitle} (${videoAsset.youtubeId})`);
    }
  } catch (err) {
    console.warn(
      "[pipeline] Video download failed (continuing without video):",
      err instanceof Error ? err.message : err,
    );
  }

  callbacks.onProgress(28);

  // ── Stage 2: Building ──────────────────────────────────────────────────
  callbacks.onStageChange("building", "Building transformed site from spec...");
  callbacks.onProgress(30);

  console.log("[pipeline] Stage 2: Building");
  let output: BuildOutput = await runExecutor(client, input, spec);
  callbacks.onProgress(60);

  console.log("[pipeline] Build complete — entering review loop");

  // ── Stage 3: Review loop ───────────────────────────────────────────────
  while (revisionCount <= MAX_REVISIONS) {
    callbacks.onStageChange("reviewing", `QA review pass ${revisionCount + 1}...`);
    callbacks.onProgress(60 + revisionCount * 10);

    console.log(`[pipeline] Stage 3: Review pass ${revisionCount + 1}`);
    const verdict = await runReviewer(client, input, spec, output);
    reviewHistory.push(verdict);

    console.log(
      `[pipeline] Review verdict: ${verdict.approved ? "APPROVED" : "REJECTED"} — ` +
        `${verdict.issues.length} issue(s): ${verdict.summary}`,
    );

    if (verdict.approved) {
      console.log("[pipeline] Approved — exiting review loop");
      break;
    }

    if (revisionCount >= MAX_REVISIONS) {
      console.warn(
        `[pipeline] Max revisions (${MAX_REVISIONS}) reached — delivering as-is`,
      );
      break;
    }

    // ── Revision ───────────────────────────────────────────────────────
    revisionCount++;
    callbacks.onStageChange("revising", `Fixing ${verdict.issues.filter((i) => i.severity !== "minor").length} issue(s)...`);
    callbacks.onProgress(70 + revisionCount * 5);

    console.log(`[pipeline] Revision ${revisionCount}: Fixing issues`);
    output = await runExecutorRevision(client, input, spec, output, verdict);

    console.log(`[pipeline] Revision ${revisionCount} complete`);
  }

  callbacks.onProgress(90);
  console.log(
    `[pipeline] Pipeline complete — ${revisionCount} revision(s), ` +
      `${reviewHistory.length} review(s)`,
  );

  return { output, spec, reviewHistory, revisionCount, videoAsset };
}
