"use client";

export function BasicNexus() {
  return (
    <div className="w-full h-full overflow-hidden flex flex-col" style={{ background: "#f8f9fa", fontFamily: "system-ui, -apple-system, sans-serif", color: "#333" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#4A90D9]" />
          <span className="text-sm font-semibold text-gray-700 tracking-wide">nexus</span>
        </div>
        <div className="flex gap-5">
          {["Home", "Services", "Work", "About", "Contact"].map((l) => (
            <span key={l} className="text-[11px] text-gray-500">{l}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-8 py-8 text-center" style={{ background: "linear-gradient(180deg, #e8eef5 0%, #f8f9fa 100%)" }}>
        <p className="text-[10px] text-[#4A90D9] uppercase tracking-widest mb-3 font-medium">Digital Agency</p>
        <h1 className="text-3xl font-semibold text-gray-800 mb-3 leading-tight">We Build Digital Worlds</h1>
        <p className="text-sm text-gray-500 max-w-md mb-5 leading-relaxed">
          Crafting websites and digital experiences for forward-thinking brands. Let&apos;s build something together.
        </p>
        <div className="px-6 py-2.5 bg-[#4A90D9] text-white text-xs rounded">
          Get Started
        </div>
        <p className="text-[9px] text-gray-400 mt-4">Trusted by 50+ clients worldwide</p>
      </div>

      {/* Services grid */}
      <div className="px-8 pb-5 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 text-center">Our Services</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Web Design", icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="14" rx="2" />
                <path d="M3 9h18M8 21h8M12 17v4" />
              </svg>
            )},
            { name: "Development", icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.5">
                <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" />
              </svg>
            )},
            { name: "Branding", icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a4.5 4.5 0 000 9 4.5 4.5 0 010 9" />
              </svg>
            )},
          ].map((s) => (
            <div key={s.name} className="bg-white border border-gray-200 rounded px-3 py-4 text-center">
              <div className="w-8 h-8 rounded bg-blue-50 mx-auto mb-2 flex items-center justify-center">
                {s.icon}
              </div>
              <p className="text-[11px] font-medium text-gray-700">{s.name}</p>
              <p className="text-[9px] text-gray-400 mt-1">Professional solutions for your business needs.</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Work */}
      <div className="px-8 pb-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 text-center">Recent Work</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "E-commerce", color: "#dbeafe" },
            { label: "SaaS Dashboard", color: "#e0e7ff" },
            { label: "Brand Identity", color: "#ede9fe" },
          ].map((p) => (
            <div key={p.label} className="rounded overflow-hidden">
              <div className="h-12 flex items-center justify-center" style={{ background: p.color }}>
                <span className="text-[8px] text-gray-500 font-medium">{p.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="px-8 pb-4">
        <div className="bg-white border border-gray-200 rounded px-4 py-3 text-center">
          <p className="text-[10px] text-gray-500 italic leading-relaxed">&ldquo;Nexus delivered our website on time and on budget. Great team to work with.&rdquo;</p>
          <p className="text-[9px] text-gray-400 mt-1">&mdash; Sarah M., Marketing Director</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-2 bg-white border-t border-gray-200 text-center">
        <p className="text-[9px] text-gray-400">&copy; 2024 Nexus Agency. All rights reserved.</p>
      </div>
    </div>
  );
}
