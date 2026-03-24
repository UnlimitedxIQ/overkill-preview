import { NextRequest, NextResponse } from "next/server";
import { createJob } from "@/lib/jobs";
import { processJob } from "@/lib/process-job";
import crypto from "crypto";

/**
 * Free preview endpoint — creates a job and starts processing without payment.
 * This bypasses Stripe and processes directly. For testing / MVP use.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pages, features, themeDirection, email } = body;

    // Validate input
    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: "At least one page URL is required" },
        { status: 400 },
      );
    }

    if (pages.length > 5) {
      return NextResponse.json(
        { error: "Free preview limited to 5 pages" },
        { status: 400 },
      );
    }

    if (!Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: "At least one feature is required" },
        { status: 400 },
      );
    }

    // Generate a unique job ID (preview_ prefix to distinguish from Stripe jobs)
    const jobId = `preview_${crypto.randomUUID()}`;

    // Create the job
    createJob({
      id: jobId,
      pages,
      features,
      themeDirection: themeDirection || undefined,
      email: email || "preview@overkill.dev",
    });

    console.log(
      `[transform-preview] Created preview job ${jobId}: ${pages.length} page(s)`,
    );

    // Start processing in the background (fire-and-forget)
    processJob(jobId).catch((err) => {
      console.error(`[transform-preview] Job ${jobId} failed:`, err);
    });

    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("[transform-preview] Error:", err);
    return NextResponse.json(
      { error: "Failed to start transformation" },
      { status: 500 },
    );
  }
}
