"use client";

import { Particles } from "../Particles";

export function AuraSite() {
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Video background */}
      <video
        autoPlay loop muted playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/tier2-bg.mp4" type="video/mp4" />
      </video>
      {/* Editorial dark overlay */}
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)" }} />

      <Particles color="#C9A84C" />

      {/* Centered editorial content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6">
        <p
          className="text-[10px] tracking-[0.5em] text-white/20 uppercase mb-10 aura-fade-in"
          style={{ fontWeight: 400, animationDelay: "0.3s" }}
        >
          Autumn / Winter 2026
        </p>

        <h1 className="flex flex-col items-center gap-0">
          <span
            className="block text-6xl sm:text-[5.5rem] font-extralight leading-none text-white/90 uppercase aura-fade-in"
            style={{ fontWeight: 200, letterSpacing: "0.12em", animationDelay: "0.6s" }}
          >
            THE ART OF
          </span>

          {/* Animated gold rule */}
          <span
            className="block mx-auto my-5 sm:my-7 h-[1px] aura-rule-glow"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.5) 25%, rgba(201,168,76,0.85) 50%, rgba(201,168,76,0.5) 75%, transparent 100%)",
              width: 0,
              animation:
                "aura-rule-expand 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1s forwards",
            }}
          />

          <span
            className="block text-7xl sm:text-[6.5rem] font-extralight leading-none text-white uppercase aura-fade-in"
            style={{ fontWeight: 100, letterSpacing: "0.2em", animationDelay: "1.4s" }}
          >
            PRESENCE
          </span>
        </h1>

        <p
          className="text-[10px] tracking-[0.4em] text-white/15 uppercase mt-14 aura-fade-in"
          style={{ fontWeight: 300, animationDelay: "2s" }}
        >
          An editorial collection
        </p>
      </div>

      {/* Refined bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-10 sm:px-16 py-5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span
          className="text-[9px] tracking-[0.35em] text-white/20 uppercase"
          style={{ fontWeight: 300 }}
        >
          Paris
          <span className="text-white/10 mx-3">|</span>
          Tokyo
          <span className="text-white/10 mx-3">|</span>
          New York
        </span>
        <span
          className="text-[9px] tracking-[0.35em] text-white/15 uppercase absolute left-1/2 -translate-x-1/2 aura-scroll-pulse"
          style={{ fontWeight: 300 }}
        >
          Scroll to explore
        </span>
        <span
          className="text-[9px] tracking-[0.3em] text-white/15 uppercase"
          style={{ fontWeight: 300 }}
        >
          @AURA
        </span>
      </div>
    </div>
  );
}
