// ---------------------------------------------------------------------------
// Deterministic animated SVG preloader — no AI needed
// ---------------------------------------------------------------------------

interface PreloaderOptions {
  brandName: string;
  accentColor: string;
  baseColor: string;
  displayFont: string;
  variant?: "tachometer" | "text-draw" | "counter";
}

// ---------------------------------------------------------------------------
// Tachometer preloader — perfect for automotive / racing brands
// ---------------------------------------------------------------------------

function buildTachometer(opts: PreloaderOptions): {
  html: string;
  css: string;
  js: string;
} {
  const html = `
<div id="ok-preloader">
  <div class="ok-preloader__inner">
    <svg class="ok-preloader__tacho" viewBox="0 0 200 120" fill="none">
      <!-- Tachometer arc -->
      <path class="ok-preloader__arc-bg" d="M 20 110 A 80 80 0 0 1 180 110" stroke="rgba(255,255,255,0.1)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path class="ok-preloader__arc-fill" d="M 20 110 A 80 80 0 0 1 180 110" stroke="${opts.accentColor}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="251" stroke-dashoffset="251"/>
      <!-- Needle -->
      <line class="ok-preloader__needle" x1="100" y1="110" x2="100" y2="35" stroke="${opts.accentColor}" stroke-width="2.5" stroke-linecap="round" transform="rotate(-90, 100, 110)"/>
      <!-- Center dot -->
      <circle cx="100" cy="110" r="6" fill="${opts.accentColor}"/>
      <!-- RPM markers -->
      <text x="30" y="105" fill="rgba(255,255,255,0.3)" font-size="8" font-family="${opts.displayFont}, sans-serif">0</text>
      <text x="165" y="105" fill="rgba(255,255,255,0.3)" font-size="8" font-family="${opts.displayFont}, sans-serif">R</text>
    </svg>
    <div class="ok-preloader__brand">${opts.brandName.toUpperCase()}</div>
    <div class="ok-preloader__pct">0%</div>
  </div>
</div>`;

  const css = `
#ok-preloader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: ${opts.baseColor};
  display: flex;
  align-items: center;
  justify-content: center;
}
.ok-preloader__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.ok-preloader__tacho {
  width: 180px;
  height: auto;
}
.ok-preloader__brand {
  font-family: '${opts.displayFont}', Oswald, Impact, sans-serif;
  font-size: clamp(20px, 4vw, 36px);
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.9);
}
.ok-preloader__pct {
  font-family: '${opts.displayFont}', Oswald, sans-serif;
  font-size: 14px;
  letter-spacing: 0.3em;
  color: rgba(255,255,255,0.4);
}`;

  const js = `
// ── Tachometer Preloader ──
(function() {
  var progress = 0;
  var arcFill = document.querySelector('.ok-preloader__arc-fill');
  var needle = document.querySelector('.ok-preloader__needle');
  var pctEl = document.querySelector('.ok-preloader__pct');
  var totalDash = 251;
  var interval = setInterval(function() {
    progress += Math.random() * 8 + 2;
    if (progress >= 100) { progress = 100; clearInterval(interval); }
    // Arc fill
    if (arcFill) arcFill.setAttribute('stroke-dashoffset', String(totalDash - (totalDash * progress / 100)));
    // Needle rotation: -90 (start) to +90 (end)
    if (needle) needle.setAttribute('transform', 'rotate(' + (-90 + progress * 1.8) + ', 100, 110)');
    // Percentage
    if (pctEl) pctEl.textContent = Math.floor(progress) + '%';
    if (progress >= 100) {
      setTimeout(function() {
        var preloader = document.getElementById('ok-preloader');
        if (preloader && window.gsap) {
          gsap.to(preloader, {
            yPercent: -100, duration: 0.8, ease: 'power4.inOut',
            onComplete: function() { preloader.style.display = 'none'; }
          });
        } else if (preloader) {
          preloader.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
          preloader.style.transform = 'translateY(-100%)';
          setTimeout(function() { preloader.style.display = 'none'; }, 600);
        }
      }, 400);
    }
  }, 50);
})();`;

  return { html, css, js };
}

// ---------------------------------------------------------------------------
// Text-draw preloader — elegant, works for any brand
// ---------------------------------------------------------------------------

function buildTextDraw(opts: PreloaderOptions): {
  html: string;
  css: string;
  js: string;
} {
  const html = `
<div id="ok-preloader">
  <div class="ok-preloader__inner">
    <div class="ok-preloader__brand">${opts.brandName.toUpperCase()}</div>
    <div class="ok-preloader__bar">
      <div class="ok-preloader__fill"></div>
    </div>
    <div class="ok-preloader__pct">0%</div>
  </div>
</div>`;

  const css = `
#ok-preloader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: ${opts.baseColor};
  display: flex;
  align-items: center;
  justify-content: center;
}
.ok-preloader__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.ok-preloader__brand {
  font-family: '${opts.displayFont}', Oswald, Impact, sans-serif;
  font-size: clamp(24px, 5vw, 56px);
  letter-spacing: 0.15em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255,255,255,0.3);
  animation: ok-preloader-fill-text 1.8s ease forwards;
}
@keyframes ok-preloader-fill-text {
  to { color: rgba(255,255,255,0.95); -webkit-text-stroke: 1px transparent; }
}
.ok-preloader__bar {
  width: 200px;
  height: 2px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}
.ok-preloader__fill {
  width: 0%;
  height: 100%;
  background: ${opts.accentColor};
  transition: width 0.08s linear;
}
.ok-preloader__pct {
  font-family: Oswald, sans-serif;
  font-size: 12px;
  letter-spacing: 0.3em;
  color: rgba(255,255,255,0.35);
}`;

  const js = `
// ── Text-Draw Preloader ──
(function() {
  var progress = 0;
  var fill = document.querySelector('.ok-preloader__fill');
  var pct = document.querySelector('.ok-preloader__pct');
  var interval = setInterval(function() {
    progress += Math.random() * 10 + 3;
    if (progress >= 100) { progress = 100; clearInterval(interval); }
    if (fill) fill.style.width = progress + '%';
    if (pct) pct.textContent = Math.floor(progress) + '%';
    if (progress >= 100) {
      setTimeout(function() {
        var preloader = document.getElementById('ok-preloader');
        if (preloader && window.gsap) {
          gsap.to(preloader, {
            yPercent: -100, duration: 0.8, ease: 'power4.inOut',
            onComplete: function() { preloader.style.display = 'none'; }
          });
        } else if (preloader) {
          preloader.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
          preloader.style.transform = 'translateY(-100%)';
          setTimeout(function() { preloader.style.display = 'none'; }, 600);
        }
      }, 300);
    }
  }, 60);
})();`;

  return { html, css, js };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildPreloader(opts: PreloaderOptions): {
  html: string;
  css: string;
  js: string;
} {
  // Auto-select variant based on brand archetype keywords
  const variant = opts.variant ??
    (opts.brandName.toLowerCase().match(/racing|motor|auto|speed|turbo|drift/)
      ? "tachometer"
      : "text-draw");

  switch (variant) {
    case "tachometer":
      return buildTachometer(opts);
    case "text-draw":
    case "counter":
    default:
      return buildTextDraw(opts);
  }
}
