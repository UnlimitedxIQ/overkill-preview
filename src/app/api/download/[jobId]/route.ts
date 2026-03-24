import { NextRequest, NextResponse } from "next/server";

import { getJob } from "@/lib/jobs";
import { zipStore } from "@/lib/process-job";

// ---------------------------------------------------------------------------
// GET /api/download/[jobId]
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

  if (job.status !== "completed") {
    return NextResponse.json(
      { error: `Job is not ready. Current status: ${job.status}` },
      { status: 409 },
    );
  }

  const zipBase64 = zipStore.get(jobId);
  if (!zipBase64) {
    return NextResponse.json(
      { error: "Download file not found. It may have expired." },
      { status: 404 },
    );
  }

  const zipBuffer = Buffer.from(zipBase64, "base64");

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        'attachment; filename="overkill-transformation.zip"',
      "Content-Length": String(zipBuffer.length),
    },
  });
}
