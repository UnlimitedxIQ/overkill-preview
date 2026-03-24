"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  features: Set<string>;
  videoUrl: string;
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
  if (!url.trim()) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Demo preview video
const DEMO_VIDEO_ID = "MUztVYnj0-Y";

export function VisualEffectsDemo({ features, videoUrl }: Props) {
  const bg3d = features.has("3d-background");
  const grain = features.has("film-grain");
  const tilt = features.has("card-tilt");
  const preloader = features.has("preloader");
  const videoBg = features.has("video-background");

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardTransform, setCardTransform] = useState("perspective(600px) rotateX(0deg) rotateY(0deg)");
  const [loaderKey, setLoaderKey] = useState(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tilt || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setCardTransform(`perspective(600px) rotateY(${x * 20}deg) rotateX(${y * -20}deg)`);
    },
    [tilt]
  );

  const handleMouseLeave = useCallback(() => {
    setCardTransform("perspective(600px) rotateX(0deg) rotateY(0deg)");
  }, []);

  const replayLoader = useCallback(() => {
    setLoaderKey((k) => k + 1);
  }, []);

  // Use demo video for preview, user's URL is for the actual transform
  const previewVideoId = extractYouTubeId(videoUrl) ?? DEMO_VIDEO_ID;

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 relative overflow-hidden rounded-xl">
      {/* Video background — cropped to fill container */}
      {videoBg && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1&mute=1&loop=1&playlist=${previewVideoId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&vq=hd2160`}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            aria-hidden
            style={{
              border: "none",
              position: "absolute",
              top: "50%",
              left: "50%",
              /* 16:9 aspect ratio — oversized so it always covers the square container */
              width: "177.78vh",
              height: "100vh",
              minWidth: "100%",
              minHeight: "100%",
              transform: "translate(-50%, -50%)",
            }}
          />
          {/* Dark overlay so card is still readable */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Animated gradient background */}
      {bg3d && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.5), rgba(120,50,220,0.4), rgba(201,168,76,0.3), rgba(50,120,240,0.4))",
            backgroundSize: "300% 300%",
            animation: "gradient-shift 5s ease infinite",
            opacity: videoBg ? 0.4 : 0.7,
            zIndex: videoBg ? 1 : 0,
          }}
        />
      )}

      {/* Film grain overlay — CSS noise texture */}
      {grain && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl z-[1] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
            opacity: 0.08,
          }}
        />
      )}

      {/* The card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative z-10 w-64 p-6 rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg-card)]"
        style={{
          transform: cardTransform,
          transition: tilt
            ? "transform 0.1s ease-out"
            : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Preloader bar */}
        {preloader && (
          <div key={loaderKey} className="mb-4">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, var(--ok-gold), var(--ok-gold-light))",
                  animation: "loader-fill 2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                }}
              />
            </div>
            <p className="text-[10px] text-[var(--ok-muted)] mt-1 font-[family-name:var(--font-geist-mono)]">
              Loading experience...
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{
              background: "linear-gradient(135deg, var(--ok-gold), var(--ok-gold-light))",
            }}
          >
            O
          </div>
          <div>
            <p className="text-sm font-semibold">Overkill Card</p>
            <p className="text-[11px] text-[var(--ok-muted)]">Premium component</p>
          </div>
        </div>

        <p className="text-xs text-[var(--ok-muted)] leading-relaxed">
          {videoBg
            ? "Video background plays behind your hero section. Add your YouTube URL in the sidebar."
            : "Toggle features to see gradient backgrounds, film grain, perspective tilt, and loading animations."
          }
        </p>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-3">
        {preloader && (
          <button
            onClick={replayLoader}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-[var(--ok-gold)]/25
                       text-[var(--ok-gold)] hover:bg-[var(--ok-gold)]/10 transition-all
                       font-[family-name:var(--font-geist-mono)]"
          >
            Replay Loader
          </button>
        )}
        {tilt && (
          <span className="text-[11px] text-[var(--ok-muted)] font-[family-name:var(--font-geist-mono)]">
            Hover card to tilt
          </span>
        )}
      </div>

      {!bg3d && !grain && !tilt && !preloader && !videoBg && (
        <div className="relative z-10 text-[11px] text-[var(--ok-muted)] font-[family-name:var(--font-geist-mono)] opacity-50">
          Enable a feature to see it in action
        </div>
      )}
    </div>
  );
}
