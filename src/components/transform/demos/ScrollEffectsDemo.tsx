"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  features: Set<string>;
}

export function ScrollEffectsDemo({ features }: Props) {
  const smooth = features.has("smooth-scroll");
  const progress = features.has("scroll-progress");
  const parallax = features.has("parallax");
  const backToTop = features.has("back-to-top");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
    setScrollPercent(Math.min(1, Math.max(0, pct)));
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  }, [smooth]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Scroll progress bar */}
      {progress && (
        <div className="absolute top-0 left-0 right-0 z-10 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{
              width: `${scrollPercent * 100}%`,
              background: "linear-gradient(90deg, var(--ok-gold), var(--ok-gold-light))",
            }}
          />
        </div>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto rounded-lg px-4 py-6"
        style={{
          scrollBehavior: smooth ? "smooth" : "auto",
          overscrollBehavior: "contain",
        }}
      >
        {/* Parallax layer (background) */}
        {parallax && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              transform: `translateY(${scrollPercent * -40}px)`,
              transition: "transform 0.1s ease-out",
              background: "radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.3) 0%, transparent 60%)",
            }}
          />
        )}

        <div className="relative space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Scroll Down</h3>
            <p className="text-sm text-[var(--ok-muted)] leading-relaxed">
              This mini-container demonstrates scroll effects. Try scrolling through
              the content and watch the features react in real-time.
            </p>
          </div>

          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[var(--ok-border)] bg-white/[0.02]"
              style={
                parallax
                  ? {
                      transform: `translateY(${scrollPercent * (i * -8)}px)`,
                      transition: "transform 0.15s ease-out",
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, rgba(201,168,76,${0.2 + i * 0.15}), rgba(201,168,76,${0.05 + i * 0.1}))`,
                  }}
                />
                <span className="text-sm font-medium">Section {i}</span>
              </div>
              <p className="text-xs text-[var(--ok-muted)] leading-relaxed">
                {i === 1 && "Premium interactions make your site feel alive. Every scroll, every hover tells a story."}
                {i === 2 && "Parallax creates depth — elements moving at different speeds trick the brain into seeing 3D space."}
                {i === 3 && "The scroll progress bar gives users a sense of position, reducing cognitive load on long pages."}
              </p>
            </div>
          ))}

          {/* Extra padding for scroll room */}
          <div className="h-16" />
        </div>
      </div>

      {/* Back to top */}
      {backToTop && scrollPercent > 0.15 && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center
                     bg-[var(--ok-gold)]/15 border border-[var(--ok-gold)]/30 text-[var(--ok-gold)]
                     hover:bg-[var(--ok-gold)]/25 transition-all"
          style={{
            animation: "fade-in 0.2s ease-out",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* Hints */}
      <div className="pt-2 text-center text-[11px] text-[var(--ok-muted)] font-[family-name:var(--font-geist-mono)]">
        {!smooth && !progress && !parallax && !backToTop ? (
          <span className="opacity-50">Enable a feature to see it in action</span>
        ) : (
          <span>Scroll the container above</span>
        )}
      </div>
    </div>
  );
}
