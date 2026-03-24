import { NextRequest, NextResponse } from "next/server";

import { getJob } from "@/lib/jobs";

// ---------------------------------------------------------------------------
// GET /api/status/[jobId]
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json(
      { error: "Missing jobId parameter." },
      { status: 400 },
    );
  }

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "Job not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    stage: job.stage,
    pages: job.pages.map((p) => ({
      url: p.url,
      status: p.status,
      previewUrl: p.previewUrl,
    })),
    progress: job.progress,
    downloadUrl:
      job.status === "completed" ? `/api/download/${job.id}` : undefined,
  });
}
