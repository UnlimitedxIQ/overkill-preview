"use client";

import { useRef, useEffect, useState } from "react";

interface ScrollOverlay {
  /** Scroll progress (0-1) at which this overlay appears */
  start: number;
  /** Scroll progress (0-1) at which this overlay disappears */
  end: number;
  /** Content to render */
  content: React.ReactNode;
}

interface ScrollVideoProps {
  /** Path to the MP4 video */
  src: string;
  /** Text overlays that appear at specific scroll positions */
  overlays?: ScrollOverlay[];
  /** Poster image while video loads */
  poster?: string;
  /** Number of viewport heights to scroll through (default 5) */
  scrollPages?: number;
}

export function ScrollVideo({
  src,
  overlays = [],
  poster,
  scrollPages = 5,
}: ScrollVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    // Wait for video metadata to load
    const onMetadataLoaded = () => {
      const handleScroll = () => {
        const rect = container.getBoundingClientRect();
        const scrollableHeight = container.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const p = Math.max(0, Math.min(1, scrolled / scrollableHeight));
        setProgress(p);

        // Scrub video to match scroll position
        if (video.duration && Number.isFinite(video.duration)) {
          video.currentTime = p * video.duration;
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    };

    if (video.readyState >= 1) {
      const cleanup = onMetadataLoaded();
      return cleanup;
    }

    const handler = () => {
      const cleanup = onMetadataLoaded();
      // Store cleanup for later
      (video as any)._scrollCleanup = cleanup;
    };
    video.addEventListener("loadedmetadata", handler);
    return () => {
      video.removeEventListener("loadedmetadata", handler);
      (video as any)._scrollCleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="scroll-video-container"
      style={{ height: `${scrollPages * 100}vh` }}
    >
      <div className="scroll-video-sticky">
        {/* Video */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-[5]" />

        {/* Scroll-triggered overlays */}
        {overlays.map((overlay, i) => {
          const isVisible = progress >= overlay.start && progress <= overlay.end;
          // Fade in/out near edges
          const fadeRange = 0.05;
          let opacity = 0;
          if (isVisible) {
            const fadeInEnd = overlay.start + fadeRange;
            const fadeOutStart = overlay.end - fadeRange;
            if (progress < fadeInEnd) {
              opacity = (progress - overlay.start) / fadeRange;
            } else if (progress > fadeOutStart) {
              opacity = (overlay.end - progress) / fadeRange;
            } else {
              opacity = 1;
            }
          }

          return (
            <div
              key={i}
              className="scroll-overlay"
              style={{ opacity, transition: "opacity 0.15s ease" }}
            >
              <div className="scroll-overlay-text">{overlay.content}</div>
            </div>
          );
        })}

        {/* Scroll progress bar at bottom */}
        <div className="absolute bottom-0 left-0 h-[2px] z-20 bg-gradient-to-r from-[var(--ok-gold)] via-[var(--ok-gold-light)] to-[var(--ok-gold)]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Placeholder for when the Veo 3 video hasn't been generated yet.
 * Shows an animated gradient that morphs as you scroll.
 */
export function ScrollVideoPlaceholder({
  overlays = [],
  scrollPages = 5,
}: Omit<ScrollVideoProps, "src">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const scrollableHeight = container.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      setProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Interpolate from overkill (rich) to bare (grey)
  const overkillHue = 43; // gold
  const bareHue = 0;
  const saturation = 70 - progress * 65; // 70% → 5%
  const lightness = 15 + progress * 60; // 15% → 75%
  const grain = progress * 0.15; // no grain → full grain

  return (
    <div
      ref={containerRef}
      className="scroll-video-container"
      style={{ height: `${scrollPages * 100}vh` }}
    >
      <div className="scroll-video-sticky">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 transition-all duration-100"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%,
                hsl(${overkillHue}, ${saturation}%, ${lightness}%) 0%,
                hsl(${overkillHue + 20}, ${Math.max(saturation - 20, 0)}%, ${Math.max(lightness - 10, 5)}%) 50%,
                hsl(0, 0%, ${5 + progress * 85}%) 100%)
            `,
          }}
        />

        {/* Film grain that increases with scroll */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[3]" style={{ opacity: 0.04 + grain }}>
          <filter id="placeholderGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#placeholderGrain)" />
        </svg>

        {/* "Overkill" effects that fade out as you scroll */}
        <div className="absolute inset-0 z-[2] pointer-events-none" style={{ opacity: 1 - progress }}>
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-[var(--ok-gold)] animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-[var(--ok-gold-light)] animate-pulse delay-300" />
          <div className="absolute bottom-1/3 left-1/2 w-1 h-1 rounded-full bg-[var(--ok-gold)] animate-pulse delay-700" />
          <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 rounded-full bg-[var(--ok-gold-light)]/60 animate-pulse delay-500" />
        </div>

        {/* Gradient overlay for text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none z-[5]" />

        {/* Scroll-triggered overlays */}
        {overlays.map((overlay, i) => {
          const isVisible = progress >= overlay.start && progress <= overlay.end;
          const fadeRange = 0.05;
          let opacity = 0;
          if (isVisible) {
            const fadeInEnd = overlay.start + fadeRange;
            const fadeOutStart = overlay.end - fadeRange;
            if (progress < fadeInEnd) {
              opacity = (progress - overlay.start) / fadeRange;
            } else if (progress > fadeOutStart) {
              opacity = (overlay.end - progress) / fadeRange;
            } else {
              opacity = 1;
            }
          }

          return (
            <div
              key={i}
              className="scroll-overlay"
              style={{ opacity, transition: "opacity 0.15s ease" }}
            >
              <div className="scroll-overlay-text">{overlay.content}</div>
            </div>
          );
        })}

        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-[2px] z-20 bg-gradient-to-r from-[var(--ok-gold)] via-[var(--ok-gold-light)] to-[var(--ok-gold)]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
