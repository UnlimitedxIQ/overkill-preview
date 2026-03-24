"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MagneticButton } from "../MagneticButton";

function FloatingLeaf({ index }: { index: number }) {
  const size = 4 + (index % 5) * 2;
  const startX = 5 + (index * 13.7) % 90;
  const delay = index * 1.1;
  const duration = 8 + (index % 4) * 3;
  const drift = (index % 2 === 0 ? 1 : -1) * (20 + (index % 3) * 15);

  return (
    <div
      className="absolute rounded-full opacity-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}%`,
        top: "-2%",
        background: `radial-gradient(circle, ${
          index % 3 === 0 ? "#C62828" : index % 3 === 1 ? "#D44C2D" : "#E8B86D"
        }, transparent)`,
        animation: `leaf-fall ${duration}s ease-in-out ${delay}s infinite`,
        ["--drift" as string]: `${drift}px`,
      }}
    />
  );
}

export function CheckoutSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 0.8;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      sessionStorage.setItem("overkill_scrape", JSON.stringify(data));
      sessionStorage.setItem("overkill_url", cleanUrl);
      router.push("/transform");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden select-none bg-[#0D0A08]">
      {/* ── Video background ── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.7 }}
      >
        <source src="/japanese-autumn-bg.mp4" type="video/mp4" />
      </video>

      {/* Lighter gradient overlay — lets video breathe */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 45%, rgba(13,10,8,0.15) 0%, rgba(13,10,8,0.5) 80%),
            linear-gradient(to bottom, rgba(13,10,8,0.2) 0%, rgba(13,10,8,0.35) 50%, rgba(13,10,8,0.75) 100%)
          `,
        }}
      />

      {/* Floating autumn leaves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
        {Array.from({ length: 12 }).map((_, i) => (
          <FloatingLeaf key={i} index={i} />
        ))}
      </div>

      {/* Subtle horizontal ink line */}
      <div
        className="absolute top-[40%] left-[10%] right-[10%] h-px z-[1]"
        style={{
          background: "linear-gradient(to right, transparent, rgba(198,40,40,0.12), rgba(232,184,109,0.15), rgba(198,40,40,0.12), transparent)",
        }}
      />

      {/* Logo is rendered in ShowcaseSites as a fixed element */}

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Japanese character accent */}
        <div
          className="absolute top-8 right-8 text-[120px] font-light leading-none pointer-events-none select-none"
          style={{
            color: "rgba(198,40,40,0.06)",
            fontFamily: "serif",
            writingMode: "vertical-rl",
          }}
        >
          過剰
        </div>

        {/* Thin decorative rule */}
        <div className="flex items-center gap-6 mb-8">
          <div
            className="h-px w-12 sm:w-20"
            style={{ background: "linear-gradient(to right, transparent, #C62828)" }}
          />
          <div className="w-1.5 h-1.5 rounded-full bg-[#C62828]/40" />
          <div
            className="h-px w-12 sm:w-20"
            style={{ background: "linear-gradient(to left, transparent, #C62828)" }}
          />
        </div>

        {/* Price — understated, refined */}
        <p
          className="text-xs sm:text-sm font-mono tracking-[0.4em] uppercase mb-8"
          style={{
            color: "#E8B86D",
            textShadow: "0 0 20px rgba(232,184,109,0.25)",
          }}
        >
          $1.99 per page
        </p>

        {/* Headline — serif warmth */}
        <h2
          className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-center leading-[1.1] mb-3"
          style={{
            color: "#F5E6D0",
            fontFamily: "var(--font-syne), system-ui, sans-serif",
            fontWeight: 300,
            textShadow: "0 2px 30px rgba(0,0,0,0.6), 0 0 80px rgba(232,184,109,0.1)",
          }}
        >
          Your website deserves this.
        </h2>

        <p
          className="text-sm sm:text-base text-center mb-10 max-w-md leading-relaxed"
          style={{ color: "rgba(245,230,208,0.35)" }}
        >
          Paste your URL. Pick your upgrades. Get a{" "}
          <span style={{ color: "rgba(245,230,208,0.6)", fontWeight: 500 }}>$50k website</span>{" "}
          experience.
        </p>

        {/* URL Input — functional form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl mb-10">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md transition-all duration-300"
            style={{
              borderColor: error ? "rgba(239,68,68,0.4)" : "rgba(198,40,40,0.2)",
              background: "rgba(245,230,208,0.03)",
              boxShadow: "0 0 80px -20px rgba(198,40,40,0.15), 0 0 30px -10px rgba(232,184,109,0.1), inset 0 1px 0 rgba(232,184,109,0.04)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(245,230,208,0.2)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your website URL..."
              disabled={loading}
              className="flex-1 bg-transparent py-2 text-sm sm:text-base font-mono tracking-wide outline-none disabled:opacity-50"
              style={{ color: "#F5E6D0", caretColor: "#E8B86D" }}
            />
            <MagneticButton
              type="submit"
              disabled={loading || !url.trim()}
              strength={8}
              glowColor="rgba(198,40,40,0.5)"
              className="px-5 py-2 rounded-xl text-sm font-bold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #C62828, #D44C2D)",
                color: "#F5E6D0",
                boxShadow: "0 0 20px rgba(198,40,40,0.25), 0 2px 8px rgba(0,0,0,0.4)",
              }}
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
          {error && (
            <p className="text-center text-sm mt-3 text-red-400">{error}</p>
          )}
          {!error && (
            <p
              className="text-center text-[11px] mt-3 tracking-wide"
              style={{ color: "rgba(245,230,208,0.12)" }}
            >
              Works with any website · No account needed · All features included
            </p>
          )}
        </form>

        {/* Steps — minimal, warm */}
        <div className="flex items-center gap-6 sm:gap-10 mb-10">
          {[
            { n: "01", t: "Paste URL" },
            { n: "02", t: "Pick effects" },
            { n: "03", t: "Download" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <span
                className="text-xl sm:text-2xl font-bold font-mono"
                style={{ color: "rgba(198,40,40,0.2)" }}
              >
                {s.n}
              </span>
              <span className="text-xs sm:text-sm font-medium" style={{ color: "rgba(245,230,208,0.45)" }}>
                {s.t}
              </span>
              {i < 2 && (
                <span className="ml-3 hidden sm:inline" style={{ color: "rgba(245,230,208,0.1)" }}>
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Feature pills — all premium effects */}
        <div className="flex flex-wrap justify-center gap-2 w-full max-w-3xl">
          {[
            { icon: "◆", label: "3D Backgrounds" },
            { icon: "▦", label: "Film Grain" },
            { icon: "⊛", label: "Custom Cursors" },
            { icon: "◎", label: "Magnetic Buttons" },
            { icon: "◇", label: "Glassmorphism" },
            { icon: "≋", label: "Smooth Scroll" },
            { icon: "⊞", label: "Split-text Anim" },
            { icon: "⇋", label: "Parallax Layers" },
            { icon: "▸", label: "Preloader" },
            { icon: "↕", label: "Scroll Progress" },
            { icon: "◫", label: "Card Tilt" },
            { icon: "⟐", label: "Radial Shine" },
            { icon: "⬡", label: "Elastic Easing" },
            { icon: "◉", label: "Focus Rings" },
            { icon: "△", label: "Back to Top" },
            { icon: "⊿", label: "Responsive" },
          ].map((f) => (
            <MagneticButton
              key={f.label}
              strength={5}
              glowColor="rgba(198,40,40,0.3)"
              className="px-3 py-1.5 rounded-full text-[11px] tracking-wide backdrop-blur-sm cursor-default flex items-center gap-1.5"
              style={{
                border: "1px solid rgba(198,40,40,0.1)",
                background: "rgba(198,40,40,0.04)",
                color: "rgba(245,230,208,0.35)",
              }}
            >
              <span style={{ color: "rgba(198,40,40,0.4)", fontSize: "10px" }}>{f.icon}</span>
              {f.label}
            </MagneticButton>
          ))}
        </div>

        {/* Footer */}
        <p
          className="mt-12 text-[10px] font-mono tracking-wider"
          style={{ color: "rgba(245,230,208,0.06)" }}
        >
          © 2026 Overkill · Every feature · No tiers
        </p>
      </div>
    </section>
  );
}
