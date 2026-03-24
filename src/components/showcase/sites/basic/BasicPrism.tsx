"use client";

export function BasicPrism() {
  return (
    <div className="w-full h-full overflow-hidden flex flex-col" style={{ background: "#f8f9fa", fontFamily: "system-ui, -apple-system, sans-serif", color: "#333" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <span className="text-sm font-bold text-gray-700">Prism</span>
        <div className="flex items-center gap-5">
          {["Features", "Pricing", "Docs", "Blog"].map((l) => (
            <span key={l} className="text-[11px] text-gray-500">{l}</span>
          ))}
          <div className="px-3 py-1.5 bg-[#0066FF] text-white text-[10px] rounded font-medium">
            Get Started
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-8 py-8 text-center" style={{ background: "linear-gradient(180deg, #eef3ff 0%, #f8f9fa 100%)" }}>
        <div className="px-3 py-1 bg-blue-50 text-[#0066FF] text-[10px] rounded-full mb-4 border border-blue-100">
          Trusted by 10,000+ teams
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3 leading-tight">
          Ship faster.<br />Break nothing.
        </h1>
        <p className="text-sm text-gray-500 max-w-md mb-5 leading-relaxed">
          The developer platform for CI/CD, monitoring, and zero-downtime deployments.
        </p>
        <div className="flex gap-3">
          <div className="px-5 py-2.5 bg-[#0066FF] text-white text-xs rounded font-medium">
            Start Free Trial
          </div>
          <div className="px-5 py-2.5 border border-gray-300 text-gray-600 text-xs rounded">
            View Demo
          </div>
        </div>
      </div>

      {/* Dashboard mockup */}
      <div className="px-8 pb-4">
        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <div className="flex-1 bg-gray-100 rounded h-3 ml-2" />
          </div>
          <div className="flex gap-2">
            <div className="w-16 bg-gray-50 rounded p-1.5 space-y-1.5">
              {[1,2,3,4].map(i => <div key={i} className="h-1.5 bg-gray-200 rounded" />)}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-[#eef3ff] rounded" />
                <div className="flex-1 h-10 bg-[#e8f5e9] rounded" />
                <div className="flex-1 h-10 bg-[#fff3e0] rounded" />
              </div>
              <div className="h-12 bg-gray-50 rounded border border-gray-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Trusted by */}
      <div className="px-8 pb-3">
        <p className="text-[9px] text-gray-400 text-center mb-2">Trusted by teams at</p>
        <div className="flex items-center justify-center gap-5">
          {["Acme", "Globex", "Initech", "Hooli", "Weyland"].map((name) => (
            <span key={name} className="text-[10px] font-semibold text-gray-300 tracking-wide">{name}</span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-8 pb-5 flex-1">
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: "CI/CD Pipeline", desc: "Automated builds and deployments", icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            )},
            { title: "Monitoring", desc: "Real-time metrics and alerts", icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="1.5">
                <path d="M3 20h18M6 16v4M10 12v8M14 8v12M18 4v16" />
              </svg>
            )},
            { title: "Team Mgmt", desc: "Role-based access control", icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="1.5">
                <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                <path d="M16 3a4 4 0 010 8M21 21v-2a4 4 0 00-3-3.87" />
              </svg>
            )},
          ].map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded px-3 py-3">
              <div className="w-7 h-7 rounded bg-blue-50 mb-2 flex items-center justify-center">
                {f.icon}
              </div>
              <p className="text-[11px] font-medium text-gray-700">{f.title}</p>
              <p className="text-[9px] text-gray-400 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-2 bg-white border-t border-gray-200 text-center">
        <p className="text-[9px] text-gray-400">&copy; 2024 Prism Inc. All rights reserved.</p>
      </div>
    </div>
  );
}
