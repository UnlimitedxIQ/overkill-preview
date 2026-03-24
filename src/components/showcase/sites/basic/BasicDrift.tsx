"use client";

export function BasicDrift() {
  return (
    <div className="w-full h-full overflow-hidden flex flex-col" style={{ background: "#f8f9fa", fontFamily: "system-ui, -apple-system, sans-serif", color: "#333" }}>
      {/* Header - dark for events vibe */}
      <div className="flex items-center justify-between px-6 py-3" style={{ background: "#1a1a2e" }}>
        <span className="text-sm font-semibold text-white">Drift Events</span>
        <div className="flex gap-5">
          {["Events", "Artists", "Venues", "Tickets"].map((l) => (
            <span key={l} className="text-[11px] text-gray-400">{l}</span>
          ))}
        </div>
      </div>

      {/* Hero - dark band */}
      <div className="flex flex-col items-center justify-center px-8 py-8 text-center" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #2d2d44 100%)" }}>
        <p className="text-[10px] text-[#ff6b6b] uppercase tracking-widest mb-3 font-medium">Live Music & Events</p>
        <h1 className="text-3xl font-semibold text-white mb-3 leading-tight">
          Feel the Frequency
        </h1>
        <p className="text-sm text-gray-400 max-w-md mb-5 leading-relaxed">
          Curated live events and nightlife experiences in cities worldwide.
        </p>
        <div className="px-6 py-2.5 text-white text-xs rounded font-medium" style={{ background: "#ff6b6b" }}>
          Browse Events
        </div>
      </div>

      {/* Featured Artist */}
      <div className="px-8 pt-5 pb-3">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded px-4 py-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#1a1a2e" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Featured Artist</p>
            <p className="text-[11px] font-medium text-gray-700">DJ Lumina &mdash; Residency at Drift LA</p>
          </div>
        </div>
      </div>

      {/* Event list */}
      <div className="px-8 pb-5 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">Upcoming Events</p>
        <div className="space-y-2">
          {[
            { name: "Nightdrive Vol. VII", date: "Mar 28, 2026", loc: "Downtown LA", status: "AVAILABLE", statusColor: "#22c55e" },
            { name: "Frequency", date: "Apr 12, 2026", loc: "Miami Beach", status: "SELLING FAST", statusColor: "#f59e0b" },
            { name: "Pulse", date: "May 3, 2026", loc: "Berlin", status: "SOLD OUT", statusColor: "#ef4444" },
          ].map((e) => (
            <div key={e.name} className="flex items-center justify-between bg-white border border-gray-200 rounded px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: e.statusColor }} />
                <div>
                  <p className="text-[11px] font-medium text-gray-700">{e.name}</p>
                  <p className="text-[9px] text-gray-400">{e.date} &middot; {e.loc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-medium px-1.5 py-0.5 rounded" style={{ color: e.statusColor, background: `${e.statusColor}15` }}>{e.status}</span>
                {e.status !== "SOLD OUT" && <span className="text-[10px] text-[#ff6b6b] underline">Buy Tickets</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Venues */}
      <div className="px-8 pb-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Popular Venues</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "The Echo", city: "Los Angeles" },
            { name: "Warehouse 9", city: "Miami" },
            { name: "Club Void", city: "Berlin" },
          ].map((v) => (
            <div key={v.name} className="rounded overflow-hidden relative h-14 flex items-end" style={{ background: "#1a1a2e" }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="relative px-2 pb-1.5">
                <p className="text-[9px] font-medium text-white">{v.name}</p>
                <p className="text-[7px] text-gray-400">{v.city}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-2 border-t border-gray-200 text-center" style={{ background: "#1a1a2e" }}>
        <p className="text-[9px] text-gray-500">Los Angeles &middot; Miami &middot; Berlin &middot; Tokyo</p>
      </div>
    </div>
  );
}
