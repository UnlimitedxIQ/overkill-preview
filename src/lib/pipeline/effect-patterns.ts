// ---------------------------------------------------------------------------
// Vanilla JS effect patterns extracted from 3d-immersive skill
// These get injected into the executor prompt so it can copy-paste real code
// instead of inventing simpler versions
// ---------------------------------------------------------------------------

export const EFFECT_PATTERNS = `
## CODE PATTERNS — Copy and adapt these. Do NOT invent simpler versions.

### Custom Cursor (GSAP quickTo — smooth, mix-blend-mode difference)
HTML:
  <div class="ok-cursor" style="position:fixed;top:0;left:0;width:40px;height:40px;border:1px solid #fff;border-radius:50%;z-index:10000;pointer-events:none;mix-blend-mode:difference;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0"></div>
  <div class="ok-cursor-dot" style="position:fixed;top:0;left:0;width:6px;height:6px;background:#fff;border-radius:50%;z-index:10000;pointer-events:none;mix-blend-mode:difference"></div>

CSS:
  body.cursor-active, body.cursor-active * { cursor: none !important; }
  @media (pointer: coarse) { .ok-cursor, .ok-cursor-dot { display: none !important; } }

JS:
  (function() {
    if ('ontouchstart' in window || !window.matchMedia('(pointer: fine)').matches) return;
    var outer = document.querySelector('.ok-cursor');
    var dot = document.querySelector('.ok-cursor-dot');
    if (!outer || !dot) return;
    document.body.classList.add('cursor-active');
    var xO = gsap.quickTo(outer, 'x', { duration: 0.35, ease: 'power3' });
    var yO = gsap.quickTo(outer, 'y', { duration: 0.35, ease: 'power3' });
    var xD = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
    var yD = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
    window.addEventListener('mousemove', function(e) {
      xO(e.clientX - 20); yO(e.clientY - 20);
      xD(e.clientX - 3); yD(e.clientY - 3);
    });
    document.addEventListener('mouseover', function(e) {
      var t = e.target.closest('[data-cursor]');
      if (!t) return;
      var type = t.getAttribute('data-cursor');
      if (type === 'expand') gsap.to(outer, { width: 80, height: 80, duration: 0.3 });
      else if (type && type.startsWith('text:')) {
        outer.textContent = type.slice(5);
        gsap.to(outer, { width: 100, height: 100, fontSize: 14, duration: 0.3 });
      }
    });
    document.addEventListener('mouseout', function(e) {
      var t = e.target.closest('[data-cursor]');
      if (!t) return;
      outer.textContent = '';
      gsap.to(outer, { width: 40, height: 40, fontSize: 0, duration: 0.3 });
    });
  })();

Usage: Add data-cursor="expand" to cards, data-cursor="text:SHOP" to CTAs, data-cursor="text:VIEW" to links.

### Magnetic Button (cursor-following translate + radial shine + glow)
JS (apply to all elements with class 'ok-magnetic'):
  document.querySelectorAll('.ok-magnetic').forEach(function(btn) {
    var strength = parseInt(btn.dataset.strength || '12');
    var glowColor = btn.dataset.glow || 'rgba(200,80,10,0.4)';
    btn.addEventListener('mousemove', function(e) {
      var rect = btn.getBoundingClientRect();
      var dx = (e.clientX - rect.left - rect.width/2) / (rect.width/2);
      var dy = (e.clientY - rect.top - rect.height/2) / (rect.height/2);
      btn.style.transform = 'translate(' + (dx*strength) + 'px,' + (dy*strength) + 'px) scale(1.03)';
      btn.style.boxShadow = '0 0 30px ' + glowColor;
      var gx = ((e.clientX - rect.left) / rect.width * 100);
      var gy = ((e.clientY - rect.top) / rect.height * 100);
      btn.style.background = 'radial-gradient(circle at '+gx+'% '+gy+'%, rgba(255,255,255,0.15) 0%, transparent 60%), ' + (btn.dataset.bg || 'var(--accent)');
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.transform = 'translate(0,0) scale(1)';
      btn.style.boxShadow = '';
      btn.style.background = btn.dataset.bg || '';
    });
    btn.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s';
  });

Usage: <a class="ok-magnetic" data-strength="12" data-glow="rgba(200,80,10,0.4)">SHOP NOW</a>

### Cursor Mask / Spotlight Reveal (CSS mask-image follows cursor)
CSS:
  .ok-mask-container { position: relative; overflow: hidden; }
  .ok-mask-default { position: relative; z-index: 1; }
  .ok-mask-reveal {
    position: absolute; inset: 0; z-index: 2;
    mask-image: radial-gradient(circle 120px at var(--mx, -200px) var(--my, -200px), black, transparent);
    -webkit-mask-image: radial-gradient(circle 120px at var(--mx, -200px) var(--my, -200px), black, transparent);
  }

JS:
  document.querySelectorAll('.ok-mask-container').forEach(function(el) {
    el.addEventListener('mousemove', function(e) {
      var rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });

Usage: Wrap hero section — default layer shows dark/muted version, reveal layer shows bright/full version.

### Film Grain (animated SVG seed — NOT static)
JS:
  (function() {
    var turb = document.querySelector('#ok-grain-turb');
    if (!turb || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var seed = 0;
    (function tick() { turb.setAttribute('seed', String(++seed % 100)); requestAnimationFrame(tick); })();
  })();

HTML:
  <svg class="ok-grain" style="position:fixed;inset:0;width:100%;height:100%;z-index:9999;pointer-events:none;opacity:0.04;mix-blend-mode:overlay">
    <filter id="ok-grain-filter"><feTurbulence id="ok-grain-turb" type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter>
    <rect width="100%" height="100%" filter="url(#ok-grain-filter)"/>
  </svg>

### Card Tilt (CSS perspective — no JS needed for basic version)
CSS:
  .ok-card { perspective: 800px; }
  .ok-card-inner {
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    transform-style: preserve-3d;
  }
  .ok-card:hover .ok-card-inner {
    transform: rotateY(5deg) rotateX(-3deg) translateZ(20px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(var(--accent-rgb), 0.15);
  }

### Split Text Reveal (GSAP per-character stagger)
CSS for hero headings: text-wrap: balance; overflow-wrap: normal; word-break: keep-all; font-size: clamp(48px, 8vw, 120px);
JS:
  function splitText(selector) {
    var el = document.querySelector(selector);
    if (!el) return;
    var text = el.textContent;
    el.innerHTML = text.split('').map(function(ch) {
      return ch === ' ' ? ' ' : '<span class="ok-char" style="display:inline-block;opacity:0;transform:translateY(40px) rotateX(-90deg)">' + ch + '</span>';
    }).join('');
    gsap.to(selector + ' .ok-char', {
      opacity: 1, y: 0, rotateX: 0,
      stagger: 0.025, duration: 0.8, ease: 'back.out(1.7)',
      delay: 0.3
    });
  }

### Scroll Reveal (GSAP ScrollTrigger entrance — use for ALL sections)
JS:
  gsap.utils.toArray('.ok-reveal').forEach(function(el) {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
    });
  });

CSS fallback (add to stylesheet): @media (prefers-reduced-motion: reduce) { .ok-reveal { opacity: 1 !important; transform: none !important; } }
NOTE: Initial state is opacity:0. ScrollTrigger reveals on scroll. The CSS fallback ensures content is visible for users with reduced-motion preference.
`;
