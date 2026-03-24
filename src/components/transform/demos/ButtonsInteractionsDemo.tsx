"use client";

import { useCallback, useEffect, useRef } from "react";
import { MagneticButton } from "@/components/MagneticButton";

interface Props {
  features: Set<string>;
}

export function ButtonsInteractionsDemo({ features }: Props) {
  const magnetic = features.has("magnetic-buttons");
  const cursor = features.has("custom-cursor");
  const focus = features.has("focus-rings");
  const glass = features.has("glass-buttons");

  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Direct DOM cursor — no React re-renders on mousemove
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !cursor) return;

    const cursorEl = cursorRef.current;
    if (!cursorEl) return;

    cursorEl.style.opacity = "0";

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cursorEl.style.transform = `translate(${x - 12}px, ${y - 12}px)`;
      cursorEl.style.opacity = "1";
    };

    const onLeave = () => {
      cursorEl.style.opacity = "0";
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
    };
  }, [cursor]);

  const buttonContent = (
    <span className="relative z-10 flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
      Get Started
    </span>
  );

  // Glass style applied when glass-buttons is ON
  const glassStyle: React.CSSProperties = glass
    ? {
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
        color: "var(--ok-text)",
      }
    : {
        background: "linear-gradient(135deg, var(--ok-gold), var(--ok-gold-light))",
        color: "#050505",
      };

  return (
    <div
      ref={containerRef}
      className="relative h-full flex flex-col items-center justify-center gap-6"
      style={{ cursor: cursor ? "none" : "default" }}
    >
      {/* Custom cursor — positioned via ref, no re-renders */}
      {cursor && (
        <div
          ref={cursorRef}
          className="pointer-events-none absolute top-0 left-0 z-50 will-change-transform"
          style={{ opacity: 0 }}
        >
          <div
            className="w-6 h-6 rounded-full"
            style={{
              background: "radial-gradient(circle, var(--ok-gold) 30%, rgba(201,168,76,0.4) 60%, transparent 80%)",
              boxShadow: "0 0 16px rgba(201,168,76,0.5)",
            }}
          />
        </div>
      )}

      {/* The demo button */}
      {magnetic ? (
        <MagneticButton
          strength={10}
          glowColor={glass ? "rgba(255,255,255,0.15)" : "rgba(201,168,76,0.5)"}
          className={`
            px-8 py-4 rounded-xl font-semibold text-sm tracking-wide
            ${focus ? "focus-visible:animate-[ring-pulse_1.5s_ease-in-out_infinite] outline-none" : ""}
          `}
          style={glassStyle}
        >
          {buttonContent}
        </MagneticButton>
      ) : (
        <button
          className={`
            px-8 py-4 rounded-xl font-semibold text-sm tracking-wide
            transition-all duration-200 hover:scale-105
            ${focus ? "focus-visible:animate-[ring-pulse_1.5s_ease-in-out_infinite] outline-none" : ""}
          `}
          style={glassStyle}
        >
          {buttonContent}
        </button>
      )}

      {/* Secondary glass button preview */}
      {glass && (
        <button
          className="px-5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
            color: "var(--ok-muted)",
          }}
        >
          Learn More
        </button>
      )}

      {/* Hints */}
      <div className="flex flex-col items-center gap-1.5 text-[11px] text-[var(--ok-muted)] font-[family-name:var(--font-geist-mono)]">
        {magnetic && <span>Hover the button — it follows your cursor</span>}
        {cursor && <span>Gold cursor tracks your mouse</span>}
        {glass && <span>Frosted glass with backdrop blur</span>}
        {focus && <span>Press Tab to see focus ring</span>}
        {!magnetic && !cursor && !focus && !glass && (
          <span className="opacity-50">Enable a feature to see it in action</span>
        )}
      </div>
    </div>
  );
}
