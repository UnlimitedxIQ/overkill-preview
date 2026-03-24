"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagneticButton } from "./MagneticButton";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client-side validation
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) {
      cleanUrl = "https://" + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to scan website");
      }

      const data = await res.json();

      // Store scrape results in sessionStorage and navigate
      sessionStorage.setItem("overkill_scrape", JSON.stringify(data));
      sessionStorage.setItem("overkill_url", cleanUrl);
      router.push("/transform");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="url-input-glow rounded-2xl bg-[var(--ok-bg-card)] p-1.5">
        <div className="flex items-center gap-3">
          {/* URL icon */}
          <div className="pl-4 text-[var(--ok-muted)]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your website URL..."
            className="flex-1 bg-transparent py-4 text-base text-[var(--ok-text)] placeholder:text-[var(--ok-muted)] outline-none font-[family-name:var(--font-geist-sans)]"
            disabled={loading}
          />

          <MagneticButton
            type="submit"
            disabled={loading || !url.trim()}
            strength={10}
            glowColor="rgba(201,168,76,0.5)"
            className="px-6 py-3 rounded-xl font-semibold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--ok-gold)] text-[#050505]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="3" fill="none"
                    strokeDasharray="60" strokeDashoffset="20"
                  />
                </svg>
                Scanning...
              </span>
            ) : (
              "Overkill it"
            )}
          </MagneticButton>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
