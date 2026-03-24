"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

interface SitePreviewCellProps {
  children: ReactNode;
  label: string;
  accent: string;
}

export function SitePreviewCell({ children, label, accent }: SitePreviewCellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(w / 1920);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden group"
      style={{
        border: `1px solid rgba(255,255,255,0.08)`,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none rounded-xl"
        style={{
          boxShadow: `inset 0 0 0 1px ${accent}40, 0 0 30px -10px ${accent}30`,
        }}
      />

      {/* Scaled site content */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "100%",
          paddingBottom: `${(1080 / 1920) * 100}%`,
        }}
      >
        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: "1920px",
            height: "1080px",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>

      {/* Label bar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}60` }}
        />
        <span className="text-[10px] font-mono tracking-wider text-white/50 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
