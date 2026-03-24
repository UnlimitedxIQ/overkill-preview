"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MagneticButton } from "@/components/MagneticButton";

interface PageStatus {
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  previewUrl?: string;
}

interface JobStatus {
  id: string;
  status: "processing" | "completed" | "failed";
  pages: PageStatus[];
  progress: number;
  downloadUrl?: string;
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--ok-gold)] border-t-transparent rounded-full" />
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  );
}

function StatusContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for status
  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/status/${sessionId}`);
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = await res.json();
        setJob(data);

        // Stop polling when done
        if (data.status === "completed" || data.status === "failed") return;
      } catch (err: any) {
        setError(err.message);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--ok-muted)]">No session found. Start from the homepage.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <a href="/" className="text-sm text-[var(--ok-gold)] hover:underline">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  const completedCount = job?.pages.filter((p) => p.status === "completed").length ?? 0;
  const totalCount = job?.pages.length ?? 0;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">
            {job?.status === "completed" ? (
              <>
                <span className="text-[var(--ok-gold)]">Done.</span> Your site is overkilled.
              </>
            ) : (
              <>
                Transforming your site<span className="animate-pulse">...</span>
              </>
            )}
          </h1>
          <p className="text-[var(--ok-muted)] text-sm">
            {job?.status === "completed"
              ? "Preview your pages below, then download."
              : `${completedCount} of ${totalCount} pages complete`}
          </p>
        </div>

        {/* Progress bar */}
        {job && job.status !== "completed" && (
          <div className="w-full h-1 bg-[var(--ok-border)] rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--ok-gold)] to-[var(--ok-gold-light)] rounded-full transition-all duration-500"
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        )}

        {/* Page list */}
        <div className="space-y-3 mb-10">
          {job?.pages.map((page, i) => (
            <div
              key={page.url}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--ok-border)] bg-[var(--ok-bg-card)]"
            >
              {/* Status indicator */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                {page.status === "completed" ? (
                  <span className="text-[var(--ok-gold)] text-lg">✓</span>
                ) : page.status === "processing" ? (
                  <div className="w-5 h-5 border-2 border-[var(--ok-gold)] border-t-transparent rounded-full animate-spin" />
                ) : page.status === "failed" ? (
                  <span className="text-red-400 text-lg">✕</span>
                ) : (
                  <span className="text-[var(--ok-muted)] text-sm">{i + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {new URL(page.url).pathname || "/"}
                </p>
                <p className="text-xs text-[var(--ok-muted)] capitalize">
                  {page.status}
                </p>
              </div>

              {page.previewUrl && (
                <MagneticButton
                  strength={6}
                  glowColor="rgba(201,168,76,0.3)"
                  className="px-3 py-1 rounded-lg text-xs text-[var(--ok-gold)] border border-[var(--ok-gold)]/20"
                  onClick={() => window.open(page.previewUrl, "_blank")}
                >
                  Preview
                </MagneticButton>
              )}
            </div>
          ))}
        </div>

        {/* Download button */}
        {job?.status === "completed" && job.downloadUrl && (
          <div className="text-center">
            <MagneticButton
              strength={12}
              glowColor="rgba(201,168,76,0.5)"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm tracking-wide bg-[var(--ok-gold)] text-[#050505]"
              onClick={() => { window.location.href = job.downloadUrl!; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download All Files
            </MagneticButton>
            <p className="text-xs text-[var(--ok-muted)] mt-3">
              ZIP file with transformed HTML, CSS, and JS. Download link also sent to your email.
            </p>
          </div>
        )}

        {/* Waiting state */}
        {!job && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 border-2 border-[var(--ok-gold)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--ok-muted)]">
              Confirming payment...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
