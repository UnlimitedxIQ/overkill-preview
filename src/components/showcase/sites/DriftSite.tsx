"use client";

import { Particles } from "../Particles";

const DRIFT_EVENTS = [
  { title: "NIGHTDRIVE VOL. VII", date: "Mar 28, 2026", venue: "Downtown LA" },
  { title: "FREQUENCY", date: "Apr 12, 2026", venue: "Miami Beach" },
];

const DRIFT_CITIES = ["LOS ANGELES", "MIAMI", "BERLIN", "TOKYO", "SEOUL", "IBIZA"];

export function DriftSite() {
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Nightdrive video background */}
      <video
        autoPlay loop muted playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/nightdrive-bg.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay with magenta tint at edges */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 40%, rgba(255,45,123,0.08) 100%)",
        }}
      />
      <Particles color="#ff2d7b" />

      <div className="relative z-20 flex items-center h-full px-10 sm:px-16 pt-20 pb-16">
        {/* Left side content */}
        <div className="w-full sm:w-[55%] flex flex-col justify-center">
          {/* Tagline */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="h-[1px] w-0"
              style={{
                background: "linear-gradient(to right, #ff2d7b, transparent)",
                animation: "nexus-line-expand 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s forwards",
              }}
            />
            <span
              className="text-[11px] tracking-[0.3em] text-white/30 uppercase drift-fade-in"
              style={{ fontWeight: 500 }}
            >
              Live Events — Los Angeles
            </span>
          </div>

          {/* Headline */}
          <h1 className="flex flex-col gap-0 mb-6">
            <span
              className="block text-6xl sm:text-7xl font-extrabold tracking-[-0.03em] leading-[0.95] text-white drift-headline-reveal"
              style={{ animationDelay: "0.3s" }}
            >
              FEEL THE
            </span>
            <span
              className="block text-6xl sm:text-7xl font-extrabold tracking-[-0.03em] leading-[0.95] drift-headline-reveal"
              style={{
                animationDelay: "0.5s",
                background: "linear-gradient(135deg, #ffffff 0%, #ff2d7b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              FREQUENCY
            </span>
          </h1>

          {/* Subtext */}
          <p
            className="text-[15px] text-white/35 max-w-[420px] leading-relaxed mb-8 drift-fade-in"
            style={{ letterSpacing: "0.01em", animationDelay: "0.7s" }}
          >
            Curated nightdrive experiences for those who move after dark.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-4 drift-fade-in" style={{ animationDelay: "0.9s" }}>
            <div
              className="site-btn px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ff2d7b, #ff6ba0)",
                color: "#050505",
                boxShadow: "0 0 20px rgba(255,45,123,0.2), 0 4px 12px rgba(0,0,0,0.3)",
                ["--btn-glow" as string]: "rgba(255,45,123,0.4)",
              }}
            >
              <span className="site-btn-shine" />
              Get tickets
            </div>
            <span className="text-sm text-white/25 font-medium">or</span>
            <span className="site-btn-link text-sm text-[#ff2d7b]/60 font-medium underline underline-offset-4 decoration-[#ff2d7b]/20">
              View lineup
            </span>
          </div>

          {/* Est. year */}
          <p className="text-[10px] text-white/10 tracking-[0.4em] uppercase mt-10 drift-fade-in" style={{ animationDelay: "1.1s" }}>
            Est. 2025
          </p>
        </div>

        {/* Right side — floating event cards */}
        <div className="hidden sm:flex w-[45%] flex-col items-end justify-center gap-5 relative pr-12">
          {DRIFT_EVENTS.map((event, i) => (
            <div
              key={event.title}
              className="w-72 backdrop-blur-2xl border rounded-xl p-5"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
                borderColor: "rgba(255,45,123,0.15)",
                animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${1 + i * 0.5}s`,
                boxShadow: "0 15px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <p className="text-lg font-bold text-white tracking-tight mb-1">{event.title}</p>
              <p className="text-[11px] text-white/30 mb-3">
                {event.date} · {event.venue}
              </p>
              {/* CSS equalizer bars */}
              <div className="flex items-end gap-[3px] h-6">
                {Array.from({ length: 16 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex-1 rounded-t-sm"
                    style={{
                      background: "linear-gradient(to top, #ff2d7b, #ff6ba0)",
                      opacity: 0.3 + Math.random() * 0.5,
                      animation: `drift-bar-pulse ${0.4 + (j % 5) * 0.15}s ease-in-out infinite alternate`,
                      animationDelay: `${j * 0.05}s`,
                      height: `${30 + (j * 17) % 70}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="absolute bottom-0 left-0 right-0 z-30 py-3 overflow-hidden" style={{ borderTop: "1px solid rgba(255,45,123,0.08)" }}>
        <div className="drift-marquee whitespace-nowrap flex">
          {Array.from({ length: 4 }).map((_, rep) => (
            <span key={rep} className="inline-flex items-center">
              {DRIFT_CITIES.map((city) => (
                <span key={`${rep}-${city}`} className="text-[13px] text-white/[0.08] font-semibold tracking-[0.2em] uppercase mx-8">
                  {city}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
