import * as cheerio from "cheerio";

import { getJob, updateJob } from "@/lib/jobs";
import { packageTransformation } from "@/lib/package";
import { runPipeline } from "@/lib/pipeline/run-pipeline";
import type { BuildOutput, VideoAsset } from "@/lib/pipeline/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch a page and return raw HTML. */
async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Overkill/1.0; +https://overkill.dev)",
      Accept: "text/html",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: status ${response.status}`);
  }

  return response.text();
}

/** Extract CSS from inline <style> tags and linked <link rel="stylesheet"> elements. */
async function extractCss(
  html: string,
  baseUrl: string,
): Promise<string> {
  const $ = cheerio.load(html);
  const cssParts: string[] = [];

  // Inline <style> tags
  $("style").each((_, el) => {
    const content = $(el).text().trim();
    if (content) cssParts.push(content);
  });

  // Linked stylesheets — fetch each one
  const linkPromises: Promise<void>[] = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let resolvedUrl: string;
    try {
      resolvedUrl = new URL(href, baseUrl).toString();
    } catch {
      return;
    }

    linkPromises.push(
      fetch(resolvedUrl, {
        headers: { "User-Agent": "Overkill/1.0" },
        signal: AbortSignal.timeout(10_000),
      })
        .then((res) => (res.ok ? res.text() : ""))
        .then((text) => {
          if (text.trim()) cssParts.push(`/* From ${resolvedUrl} */\n${text}`);
        })
        .catch(() => {
          // Silently skip unreachable stylesheets
        }),
    );
  });

  await Promise.all(linkPromises);

  return cssParts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Job processing orchestrator
// ---------------------------------------------------------------------------

export async function processJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) {
    console.error(`[process-job] Job ${jobId} not found.`);
    return;
  }

  console.log(
    `[process-job] Starting job ${jobId}: ${job.pages.length} page(s), features: ${job.features.join(", ")}`,
  );

  const pageResults: { url: string; html: string; css: string; js: string }[] =
    [];
  let jobVideoAsset: VideoAsset | undefined;

  for (let i = 0; i < job.pages.length; i++) {
    const page = job.pages[i];
    const pageIndex = i;

    // Mark page as processing
    const updatedPages = job.pages.map((p, idx) =>
      idx === pageIndex ? { ...p, status: "processing" as const } : p,
    );
    updateJob(jobId, {
      pages: updatedPages,
      progress: Math.round((pageIndex / job.pages.length) * 100),
    });

    try {
      console.log(`[process-job] Fetching page: ${page.url}`);
      const html = await fetchPageHtml(page.url);

      console.log(`[process-job] Extracting CSS from: ${page.url}`);
      const css = await extractCss(html, page.url);

      const $ = cheerio.load(html);
      const title = $("title").first().text().trim() || page.url;

      console.log(`[process-job] Running pipeline for: ${page.url}`);
      let result: BuildOutput;
      let pageVideoAsset: VideoAsset | undefined;
      try {
        const pipelineResult = await runPipeline(
          {
            html,
            css,
            url: page.url,
            title,
            features: job.features,
            themeDirection: job.themeDirection,
          },
          {
            onStageChange: (stage) => {
              updateJob(jobId, { stage });
            },
            onProgress: (pageProgress) => {
              const base = (pageIndex / job.pages.length) * 100;
              const weight = 100 / job.pages.length;
              updateJob(jobId, {
                progress: Math.round(base + (pageProgress / 100) * weight),
              });
            },
          },
        );
        result = pipelineResult.output;
        pageVideoAsset = pipelineResult.videoAsset;
      } catch (transformErr) {
        console.error(
          `[process-job] Pipeline failed for ${page.url}:`,
          transformErr instanceof Error
            ? transformErr.message
            : transformErr,
        );
        // Mark page as failed but continue with other pages
        const failedPages = (getJob(jobId)?.pages ?? job.pages).map(
          (p, idx) =>
            idx === pageIndex ? { ...p, status: "failed" as const } : p,
        );
        updateJob(jobId, { pages: failedPages });
        continue;
      }

      pageResults.push({
        url: page.url,
        html: result.html,
        css: result.css,
        js: result.js,
      });

      if (pageVideoAsset && !jobVideoAsset) {
        jobVideoAsset = pageVideoAsset;
      }

      // Mark page as completed
      const completedPages = (getJob(jobId)?.pages ?? job.pages).map(
        (p, idx) =>
          idx === pageIndex ? { ...p, status: "completed" as const } : p,
      );
      updateJob(jobId, { pages: completedPages });

      console.log(`[process-job] Page complete: ${page.url}`);
    } catch (err) {
      console.error(
        `[process-job] Failed to process ${page.url}:`,
        err instanceof Error ? err.message : err,
      );
      const errorPages = (getJob(jobId)?.pages ?? job.pages).map((p, idx) =>
        idx === pageIndex ? { ...p, status: "failed" as const } : p,
      );
      updateJob(jobId, { pages: errorPages });
    }
  }

  // Package results if we have any successful pages
  if (pageResults.length === 0) {
    console.error(`[process-job] All pages failed for job ${jobId}.`);
    updateJob(jobId, { status: "failed", progress: 100 });
    return;
  }

  try {
    console.log(`[process-job] Packaging ${pageResults.length} page(s)...`);
    const zipBuffer = await packageTransformation(pageResults, jobVideoAsset);

    // Store ZIP as base64 in the job (temporary — will use Vercel Blob later)
    const zipBase64 = zipBuffer.toString("base64");

    updateJob(jobId, {
      status: "completed",
      progress: 100,
      // Store download data on the job. The Job type doesn't have these fields
      // yet, so we cast. The download route will read them.
    } as Record<string, unknown>);

    // Store the ZIP data separately since the Job type is fixed
    zipStore.set(jobId, zipBase64);

    console.log(
      `[process-job] Job ${jobId} complete. ZIP size: ${zipBuffer.length} bytes.`,
    );
  } catch (err) {
    console.error(
      `[process-job] Packaging failed for job ${jobId}:`,
      err instanceof Error ? err.message : err,
    );
    updateJob(jobId, { status: "failed", progress: 100 });
  }
}

// ---------------------------------------------------------------------------
// Temporary ZIP storage (in-memory, will be replaced with Vercel Blob)
// ---------------------------------------------------------------------------

export const zipStore = new Map<string, string>();
