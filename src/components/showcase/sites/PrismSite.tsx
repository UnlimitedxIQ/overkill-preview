"use client";

import { Particles } from "../Particles";

const DASHBOARD_METRICS = [
  { label: "MRR", value: "$48.2k", delta: "+12.3%", color: "#a855f7", up: true },
  { label: "Active Users", value: "12,847", delta: "+8.1%", color: "#c084fc", up: true },
  { label: "Latency", value: "23ms", delta: "-14%", color: "#22d3ee", up: false },
  { label: "Uptime", value: "99.98%", delta: "", color: "#4ade80", up: true },
];

const DASHBOARD_ACTIVITY = [
  { dot: "#a855f7", text: "v2.4.1 deployed to production", time: "2m ago", tag: "deploy" },
  { dot: "#22d3ee", text: "OAuth scope migration complete", time: "5m ago", tag: "auth" },
  { dot: "#4ade80", text: "Auto-scaled to 12 instances", time: "8m ago", tag: "infra" },
  { dot: "#f59e0b", text: "Rate limit threshold adjusted", time: "14m ago", tag: "config" },
  { dot: "#ec4899", text: "SSL certificates rotated", time: "1h ago", tag: "security" },
];

const SIDEBAR_ICONS = [
  { color: "#a855f7", label: "Home" },
  { color: "#22d3ee", label: "Analytics" },
  { color: "#4ade80", label: "Deploy" },
  { color: "#f59e0b", label: "Settings" },
  { color: "#ec4899", label: "Team" },
  { color: "#818cf8", label: "Logs" },
];

export function PrismSite() {
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <video autoPlay loop muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/tier3-bg.mp4" type="video/mp4" />
      </video>
      {/* Neutral dark overlay for text readability */}
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)" }} />
      <Particles color="#c084fc" />

      <div className="relative z-20 flex items-center h-full px-8 sm:px-14 pt-20 pb-16">
        {/* Left: Hero copy */}
        <div className="w-full sm:w-[46%] flex flex-col justify-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm mb-6 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-white/50 font-medium tracking-wide">
              Trusted by 10,000+ engineering teams
            </span>
          </div>

          <h1 className="text-5xl sm:text-[3.5rem] font-extrabold tracking-[-0.03em] leading-[1.05] text-white mb-5">
            <span className="block">Ship faster.</span>
            <span
              className="block"
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Break nothing.
            </span>
          </h1>

          <p className="text-[15px] text-white/40 max-w-[360px] leading-relaxed mb-8" style={{ letterSpacing: "0.01em" }}>
            The developer platform that combines AI-powered workflows, real-time observability, and zero-downtime deploys.
          </p>

          {/* Social proof row */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {[
                "from-purple-400 to-violet-500",
                "from-pink-400 to-rose-500",
                "from-cyan-400 to-blue-500",
                "from-emerald-400 to-green-500",
                "from-amber-400 to-orange-500",
                "from-indigo-400 to-purple-500",
              ].map((grad, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full border-[2.5px] border-black/90 bg-gradient-to-br ${grad}`}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                />
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="text-[10px]" style={{ color: "#facc15" }}>&#9733;</span>
                ))}
                <span className="text-[10px] text-white/50 font-semibold ml-1">4.9</span>
              </div>
              <span className="text-[10px] text-white/30">from 2,847 reviews on G2</span>
            </div>
          </div>
        </div>

        {/* Right: Dashboard mockup */}
        <div className="hidden sm:flex w-[54%] justify-center items-center relative">
          {/* Main dashboard card */}
          <div
            className="w-[380px] backdrop-blur-2xl border rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
              borderColor: "rgba(255,255,255,0.1)",
              transform: "perspective(1200px) rotateY(-6deg) rotateX(2deg)",
              animation: "float 5s ease-in-out infinite",
              animationDelay: "0.5s",
              boxShadow: "0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" style={{ opacity: 0.7 }} />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" style={{ opacity: 0.7 }} />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" style={{ opacity: 0.7 }} />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-8 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-[8px] text-white/20 font-mono">app.prism.dev/dashboard</span>
                </div>
              </div>
              <div className="w-12" />
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="w-11 border-r border-white/[0.06] flex flex-col items-center py-3 gap-2.5" style={{ background: "rgba(255,255,255,0.015)" }}>
                <div className="w-5 h-5 rounded-lg mb-1" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", opacity: 0.8 }} />
                <div className="w-6 h-[1px] bg-white/[0.06] mb-1" />
                {SIDEBAR_ICONS.map((item, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: i === 0 ? "rgba(168,85,247,0.15)" : "transparent",
                      border: i === 0 ? "1px solid rgba(168,85,247,0.2)" : "1px solid transparent",
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color, opacity: i === 0 ? 0.8 : 0.25 }} />
                  </div>
                ))}
              </div>

              {/* Main content area */}
              <div className="flex-1 min-w-0">
                {/* Search bar */}
                <div className="mx-3 mt-3 mb-2.5 px-3 py-[6px] rounded-lg border border-white/[0.06] flex items-center gap-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <svg className="w-2.5 h-2.5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-[8px] text-white/15 font-medium">Search anything...</span>
                  <span className="ml-auto text-[7px] text-white/10 font-mono px-1 py-0.5 rounded border border-white/[0.06] bg-white/[0.02]">/</span>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-1.5 px-3">
                  {DASHBOARD_METRICS.map((m) => (
                    <div key={m.label} className="rounded-lg p-2 border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[7px] text-white/30 font-medium uppercase tracking-wider">{m.label}</p>
                        {m.delta && (
                          <span className="text-[7px] font-medium px-1 py-0.5 rounded-full" style={{
                            color: m.up ? "#4ade80" : "#22d3ee",
                            backgroundColor: m.up ? "rgba(74,222,128,0.08)" : "rgba(34,211,238,0.08)",
                          }}>
                            {m.delta}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold tracking-tight" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue chart area */}
                <div className="px-3 pt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8px] text-white/30 font-medium">Revenue trend</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] text-white/15">7d</span>
                      <span className="text-[7px] text-purple-400/60 font-medium">30d</span>
                      <span className="text-[7px] text-white/15">90d</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-[3px] h-14">
                    {[28, 42, 35, 58, 45, 52, 72, 48, 65, 78, 55, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          background: i === 11
                            ? "linear-gradient(to top, #a855f7, #c084fc)"
                            : "linear-gradient(to top, rgba(168,85,247,0.3), rgba(192,132,252,0.5))",
                          opacity: i === 11 ? 1 : 0.4 + (h / 250),
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Line chart */}
                <div className="px-3 pt-2 pb-1">
                  <svg viewBox="0 0 240 28" className="w-full h-5 overflow-visible">
                    <defs>
                      <linearGradient id="prismLineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,22 C20,20 30,18 50,16 C70,14 80,19 100,14 C120,9 130,11 150,8 C170,5 190,7 210,4 L240,3" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.5" />
                    <path d="M0,22 C20,20 30,18 50,16 C70,14 80,19 100,14 C120,9 130,11 150,8 C170,5 190,7 210,4 L240,3 L240,28 L0,28 Z" fill="url(#prismLineGrad)" />
                    <circle cx="240" cy="3" r="2" fill="#a855f7" opacity="0.8" />
                    <circle cx="240" cy="3" r="4" fill="#a855f7" opacity="0.15" />
                  </svg>
                </div>

                {/* Activity feed */}
                <div className="px-3 pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8px] text-white/30 font-medium">Activity</span>
                    <span className="text-[7px] text-white/15">View all</span>
                  </div>
                  <div className="space-y-[5px]">
                    {DASHBOARD_ACTIVITY.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 py-[2px]">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.dot, boxShadow: `0 0 4px ${a.dot}40` }} />
                        <span className="text-[8px] text-white/30 truncate flex-1">{a.text}</span>
                        <span className="text-[6px] text-white/10 font-mono px-1 py-0.5 rounded border border-white/[0.04] bg-white/[0.02] flex-shrink-0">{a.tag}</span>
                        <span className="text-[7px] text-white/15 flex-shrink-0 tabular-nums">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating notification card */}
          <div
            className="absolute -top-4 -right-4 w-56 backdrop-blur-2xl border rounded-xl p-3.5"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
              borderColor: "rgba(255,255,255,0.1)",
              animation: "float 4s ease-in-out infinite",
              animationDelay: "1.2s",
              boxShadow: "0 15px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.15)" }}>
                <span className="text-[9px]" style={{ color: "#4ade80" }}>&#10003;</span>
              </div>
              <span className="text-[9px] text-white/40 font-medium">Just now</span>
            </div>
            <p className="text-[11px] text-white/70 font-semibold tracking-tight">Deploy successful</p>
            <p className="text-[8px] text-white/25 mt-1 leading-relaxed">
              production &middot; 847ms build &middot; 0 errors
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="h-[3px] flex-1 rounded-full bg-green-400/30 overflow-hidden">
                <div className="h-full w-full bg-green-400/60 rounded-full" />
              </div>
              <span className="text-[7px] text-green-400/50 font-medium">100%</span>
            </div>
          </div>

          {/* Floating metrics pill */}
          <div
            className="absolute -bottom-3 -left-2 backdrop-blur-2xl border rounded-xl px-3.5 py-2.5"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
              borderColor: "rgba(255,255,255,0.1)",
              animation: "float 4.5s ease-in-out infinite",
              animationDelay: "2s",
              boxShadow: "0 15px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[7px] text-white/25 uppercase tracking-wider font-medium">Requests/s</span>
                <span className="text-sm font-bold text-cyan-400/80 tracking-tight">24.8k</span>
              </div>
              <div className="w-[1px] h-6 bg-white/[0.06]" />
              <div className="flex flex-col">
                <span className="text-[7px] text-white/25 uppercase tracking-wider font-medium">P99 Latency</span>
                <span className="text-sm font-bold text-emerald-400/80 tracking-tight">12ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom social proof bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 py-3.5 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-center gap-10">
          <span className="text-[9px] text-white/15 font-medium tracking-wide">TRUSTED BY</span>
          {["Stripe", "Vercel", "Linear", "Notion", "Figma", "Raycast"].map((co) => (
            <span key={co} className="text-[12px] text-white/[0.12] font-semibold tracking-[0.15em] uppercase">{co}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
