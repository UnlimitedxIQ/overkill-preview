"use client";

export function BasicAura() {
  return (
    <div className="w-full h-full overflow-hidden flex flex-col" style={{ background: "#fafaf7", fontFamily: "system-ui, -apple-system, sans-serif", color: "#333" }}>
      {/* Promo banner */}
      <div className="px-4 py-1.5 bg-[#8a7968] text-center">
        <p className="text-[9px] text-white tracking-wider uppercase">Free shipping on orders over $200</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <span className="text-sm font-medium text-gray-600 tracking-[0.15em] uppercase" style={{ fontFamily: "Georgia, serif" }}>Aura</span>
        <div className="flex gap-5">
          {["Shop", "Collections", "About", "Contact"].map((l) => (
            <span key={l} className="text-[11px] text-gray-500">{l}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-8 py-8 text-center" style={{ background: "linear-gradient(180deg, #f5f0eb 0%, #fafaf7 100%)" }}>
        <p className="text-[10px] text-[#8a7968] uppercase tracking-widest mb-3">Autumn / Winter</p>
        <h1 className="text-3xl font-light text-gray-700 mb-2 tracking-wide" style={{ fontFamily: "Georgia, serif" }}>The Art of Presence</h1>
        <div className="w-12 h-px bg-[#c4b5a5] mb-3" />
        <p className="text-sm text-gray-500 max-w-sm mb-5 leading-relaxed">
          Timeless pieces for the modern wardrobe. Discover our latest collection.
        </p>
        <div className="px-6 py-2 border border-[#8a7968] text-[#8a7968] text-xs uppercase tracking-wider">
          Shop Now
        </div>
      </div>

      {/* Product grid */}
      <div className="px-8 pb-5 flex-1">
        <div className="grid grid-cols-3 gap-3">
          {/* Cashmere Coat — mountain landscape */}
          <div className="text-center">
            <div className="aspect-[3/4] rounded mb-2 overflow-hidden" style={{ background: "#d4c5b5" }}>
              <svg viewBox="0 0 120 160" className="w-full h-full">
                <defs>
                  <linearGradient id="sky-a" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8d5c4" />
                    <stop offset="100%" stopColor="#d4c5b5" />
                  </linearGradient>
                </defs>
                <rect width="120" height="160" fill="url(#sky-a)" />
                <circle cx="90" cy="35" r="14" fill="#f0e0cc" opacity="0.8" />
                <polygon points="10,110 40,50 70,110" fill="#b8a494" />
                <polygon points="50,110 85,40 120,110" fill="#a89484" />
                <polygon points="25,110 55,65 85,110" fill="#c4b4a4" />
                <rect y="110" width="120" height="50" fill="#8a7968" opacity="0.3" />
                <ellipse cx="30" cy="125" rx="18" ry="6" fill="#9a8a78" opacity="0.3" />
                <ellipse cx="85" cy="130" rx="14" ry="5" fill="#9a8a78" opacity="0.25" />
              </svg>
            </div>
            <p className="text-[10px] text-gray-600">Cashmere Coat</p>
            <p className="text-[10px] text-gray-400">$389.00</p>
          </div>
          {/* Silk Blouse — botanical leaves */}
          <div className="text-center">
            <div className="aspect-[3/4] rounded mb-2 overflow-hidden" style={{ background: "#e8ddd0" }}>
              <svg viewBox="0 0 120 160" className="w-full h-full">
                <rect width="120" height="160" fill="#e8ddd0" />
                <g opacity="0.45">
                  <ellipse cx="60" cy="80" rx="30" ry="50" fill="#b5c4a8" transform="rotate(-15 60 80)" />
                  <line x1="60" y1="30" x2="60" y2="130" stroke="#8a9a78" strokeWidth="1" />
                  <ellipse cx="45" cy="60" rx="18" ry="8" fill="#c4d4b4" transform="rotate(-30 45 60)" />
                  <ellipse cx="75" cy="70" rx="18" ry="8" fill="#c4d4b4" transform="rotate(25 75 70)" />
                  <ellipse cx="48" cy="95" rx="16" ry="7" fill="#c4d4b4" transform="rotate(-20 48 95)" />
                  <ellipse cx="72" cy="105" rx="16" ry="7" fill="#c4d4b4" transform="rotate(30 72 105)" />
                </g>
                <g opacity="0.25">
                  <ellipse cx="20" cy="30" rx="14" ry="22" fill="#a8b898" transform="rotate(10 20 30)" />
                  <ellipse cx="100" cy="140" rx="16" ry="24" fill="#a8b898" transform="rotate(-10 100 140)" />
                </g>
              </svg>
            </div>
            <p className="text-[10px] text-gray-600">Silk Blouse</p>
            <p className="text-[10px] text-gray-400">$189.00</p>
          </div>
          {/* Wool Trousers — abstract wave/textile */}
          <div className="text-center">
            <div className="aspect-[3/4] rounded mb-2 overflow-hidden" style={{ background: "#c9b8a8" }}>
              <svg viewBox="0 0 120 160" className="w-full h-full">
                <rect width="120" height="160" fill="#c9b8a8" />
                <path d="M0,30 Q30,15 60,30 T120,30" fill="none" stroke="#b8a090" strokeWidth="2" opacity="0.5" />
                <path d="M0,50 Q30,35 60,50 T120,50" fill="none" stroke="#b8a090" strokeWidth="2" opacity="0.45" />
                <path d="M0,70 Q30,55 60,70 T120,70" fill="none" stroke="#b8a090" strokeWidth="2" opacity="0.4" />
                <path d="M0,90 Q30,75 60,90 T120,90" fill="none" stroke="#b8a090" strokeWidth="2" opacity="0.35" />
                <path d="M0,110 Q30,95 60,110 T120,110" fill="none" stroke="#b8a090" strokeWidth="2" opacity="0.3" />
                <path d="M0,130 Q30,115 60,130 T120,130" fill="none" stroke="#b8a090" strokeWidth="2" opacity="0.25" />
                <path d="M0,150 Q30,135 60,150 T120,150" fill="none" stroke="#b8a090" strokeWidth="2" opacity="0.2" />
                <circle cx="35" cy="80" r="20" fill="#d4c0b0" opacity="0.3" />
                <circle cx="85" cy="60" r="15" fill="#d4c0b0" opacity="0.25" />
              </svg>
            </div>
            <p className="text-[10px] text-gray-600">Wool Trousers</p>
            <p className="text-[10px] text-gray-400">$249.00</p>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="px-8 pb-4">
        <div className="bg-white border border-gray-200 rounded px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-gray-600">Join Our Newsletter</p>
            <p className="text-[9px] text-gray-400">Get 10% off your first order</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 border border-gray-200 rounded text-[9px] text-gray-400 bg-gray-50 w-24">your@email.com</div>
            <div className="px-3 py-1 bg-[#8a7968] text-white text-[9px] rounded">Subscribe</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-2 bg-white border-t border-gray-200 text-center">
        <p className="text-[9px] text-gray-400">Paris &middot; New York &middot; Tokyo</p>
      </div>
    </div>
  );
}
