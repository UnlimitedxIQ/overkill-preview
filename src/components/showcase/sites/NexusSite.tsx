"use client";

import { Particles } from "../Particles";

const NEXUS_STATS = [
  { value: "237+", label: "Projects Delivered", icon: "\u25C6" },
  { value: "4.9", label: "Client Rating", icon: "\u2605" },
  { value: "12\u00D7", label: "Awwwards Honors", icon: "\u25B2" },
];

const CLIENT_LOGOS_LIST = ["NIKE", "APPLE", "SPOTIFY", "TESLA", "NETFLIX", "GOOGLE", "META", "STRIPE", "AIRBNB", "FIGMA"];

export function NexusSite() {
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Video background with slight zoom for cinematic feel */}
      <video
        autoPlay loop muted playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ transform: "scale(1.05)" }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      {/* Neutral dark overlay */}
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 100%)" }} />

      <Particles color="#22d3ee" />

      <div className="relative z-20 flex items-center h-full px-10 sm:px-16 pt-20 pb-16">
        {/* Left side content */}
        <div className="w-full sm:w-[55%] flex flex-col justify-center">
          {/* Tagline with expanding cyan accent line */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[1px] nexus-line-expand" style={{ background: "linear-gradient(to right, #22d3ee, transparent)" }} />
            <span
              className="text-[11px] tracking-[0.3em] text-white/30 uppercase nexus-fade-in"
              style={{ fontWeight: 500, animationDelay: "0.1s" }}
            >
              Digital Atelier — San Francisco
            </span>
          </div>

          {/* Two-line stacked headline */}
          <h1 className="flex flex-col gap-0 mb-6">
            <span
              className="block text-6xl sm:text-7xl font-extrabold tracking-[-0.03em] leading-[0.95] text-white nexus-headline-reveal"
              style={{ animationDelay: "0.3s" }}
            >
              WE BUILD
            </span>
            <span
              className="block text-6xl sm:text-7xl font-extrabold tracking-[-0.03em] leading-[0.95] nexus-headline-reveal"
              style={{
                animationDelay: "0.5s",
                background: "linear-gradient(135deg, #22d3ee 0%, #67e8f9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              DIGITAL WORLDS
            </span>
          </h1>

          {/* Subtext */}
          <p
            className="text-[15px] text-white/35 max-w-[420px] leading-relaxed mb-8 nexus-fade-in"
            style={{ letterSpacing: "0.01em", animationDelay: "0.7s" }}
          >
            Award-winning studio crafting immersive digital experiences for brands that dare to be unforgettable.
          </p>

          {/* CTA row */}
          <div className="flex items-center gap-4 nexus-fade-in" style={{ animationDelay: "0.9s" }}>
            <div
              className="site-btn px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
                color: "#050505",
                boxShadow: "0 0 20px rgba(34,211,238,0.2), 0 4px 12px rgba(0,0,0,0.3)",
                ["--btn-glow" as string]: "rgba(34,211,238,0.4)",
              }}
            >
              <span className="site-btn-shine" />
              View our work
            </div>
            <span className="text-sm text-white/25 font-medium">or</span>
            <span className="site-btn-link text-sm text-cyan-300/50 font-medium underline underline-offset-4 decoration-cyan-300/20">
              Book a call
            </span>
          </div>

          {/* Est. year */}
          <p className="text-[10px] text-white/10 tracking-[0.4em] uppercase mt-10 nexus-fade-in" style={{ animationDelay: "1.1s" }}>
            Est. 2019
          </p>
        </div>

        {/* Right side — floating stat cards */}
        <div className="hidden sm:flex w-[45%] flex-col items-end justify-center gap-4 relative pr-12">
          {NEXUS_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="w-64 backdrop-blur-2xl border rounded-xl p-4 nexus-card-reveal"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
                borderColor: "rgba(34,211,238,0.12)",
                animationDelay: `${0.8 + i * 0.15}s`,
                animation: `nexus-card-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.8 + i * 0.15}s forwards, nexus-float ${4 + i * 0.5}s ease-in-out infinite ${1.5 + i * 0.3}s`,
                opacity: 0,
                boxShadow: "0 15px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" style={{ color: "#22d3ee", opacity: 0.5, filter: "drop-shadow(0 0 4px rgba(34,211,238,0.3))" }}>{stat.icon}</span>
                <div>
                  <p className="text-2xl font-bold text-white tracking-tight" style={{ textShadow: "0 0 20px rgba(34,211,238,0.15)" }}>{stat.value}</p>
                  <p className="text-[10px] text-white/25 tracking-wider uppercase">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="absolute bottom-0 left-0 right-0 z-30 py-3 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="nexus-marquee whitespace-nowrap flex">
          {Array.from({ length: 4 }).map((_, rep) => (
            <span key={rep} className="inline-flex items-center">
              {CLIENT_LOGOS_LIST.map((logo) => (
                <span key={`${rep}-${logo}`} className="text-[13px] text-white/[0.08] font-semibold tracking-[0.2em] uppercase mx-8">{logo}</span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
