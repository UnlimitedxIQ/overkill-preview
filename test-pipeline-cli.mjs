/**
 * test-pipeline-cli.mjs
 *
 * Runs the Overkill pipeline stages using Claude CLI (subscription-based).
 * Usage: node test-pipeline-cli.mjs [url] [features]
 * Example: node test-pipeline-cli.mjs https://britainracing.com/ "custom-cursor,film-grain,scroll-progress"
 */

import { spawnSync, execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";
import * as https from "https";
import * as http from "http";

// ── Config ────────────────────────────────────────────────────────────────────

const TARGET_URL = process.argv[2] || "https://britainracing.com/";
const FEATURES = (process.argv[3] || "custom-cursor,film-grain,scroll-progress,split-text").split(",");
const THEME_DIRECTION = process.argv[4] || "";
const OUT_DIR = `${tmpdir()}/overkill-test`;
const MAX_HTML = 60_000;
const MAX_CSS = 30_000;

// ── Feature instructions (copied from transform.ts) ──────────────────────────

const FEATURE_INSTRUCTIONS = {
  "custom-cursor": "Add a custom cursor element (div.overkill-cursor) with mix-blend-mode:difference. Show context-aware labels on interactive elements (buttons get 'Click', links get 'View', images get 'Explore'). CRITICAL: use `body.custom-cursor-active, body.custom-cursor-active * { cursor: none !important; }` to hide the native cursor on ALL elements. Track mouse with GSAP quickTo for smooth follow. Only activate on non-touch devices (matchMedia pointer:fine).",
  "3d-background": "Add an animated gradient background to the hero/first section using CSS. Use a multi-stop radial gradient with CSS @keyframes that shifts background-position over 15s infinite loop. Colors should complement the existing palette. Add a subtle noise texture overlay using SVG feTurbulence for depth.",
  "film-grain": "Add an SVG film grain overlay: fixed position, inset 0, pointer-events none, z-index 9999. Use <svg> with <filter><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#grain)'/></svg>. Set opacity to 0.04. Add a subtle CSS animation that shifts the SVG transform every 0.5s for movement.",
  "magnetic-buttons": "Make all <button> and <a class containing 'btn' or 'button'> elements magnetic. On mousemove within 80px, translate the button toward the cursor using GSAP quickTo. On mouseleave, spring back to origin. Use GSAP with ease: 'elastic.out(1, 0.3)'. Add a subtle scale(1.05) on hover.",
  "split-text": "Split hero heading (h1, or first h2 if no h1) into individual characters wrapped in <span>. Use GSAP to animate each character from opacity:0, y:40, rotateX:-90 to full visibility with stagger: 0.03 and ease: 'back.out(1.7)'. Trigger on page load after any preloader completes.",
  "scroll-progress": "Add a 2px-tall fixed bar at the very top of the viewport (z-index 10000). Style with a gradient (left to right, brand colors or purple to pink to orange). Width starts at 0% and tracks scroll position (scrollY / (docHeight - windowHeight) * 100%). Animate width change with requestAnimationFrame for smoothness.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(stage, msg) {
  console.log(`\x1b[36m[${stage}]\x1b[0m ${msg}`);
}

function err(stage, msg) {
  console.error(`\x1b[31m[${stage} ERROR]\x1b[0m ${msg}`);
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; OverkillBot/1.0)" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// ── Site mapper (vanilla JS, no TypeScript needed) ────────────────────────────

async function mapSite(html, baseUrl) {
  // Dynamic import cheerio
  const { load } = await import("cheerio");
  const $ = load(html);

  const links = [];
  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href") ?? "";
    const text = $el.text().trim().slice(0, 80) || $el.attr("aria-label") || "";
    let resolvedHref = href;
    try {
      if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        resolvedHref = new URL(href, baseUrl).toString();
      }
    } catch {}
    const location = getLocation($, $el);
    if (text || href) links.push({ text, href: resolvedHref, location });
  });

  const images = [];
  $("img[src], img[srcset], source[srcset]").each((_, el) => {
    const $el = $(el);
    let src = $el.attr("src") ?? "";
    const srcset = $el.attr("srcset") ?? "";
    const alt = $el.attr("alt") ?? "";
    if (srcset) {
      const parts = srcset.split(",").map(s => s.trim());
      const last = parts[parts.length - 1];
      if (last) src = last.split(/\s+/)[0] ?? src;
    }
    try {
      if (src && !src.startsWith("data:")) src = new URL(src, baseUrl).toString();
    } catch {}
    const location = getLocation($, $el);
    if (src) images.push({ src, alt, location });
  });
  const uniqueImages = [...new Map(images.map(i => [i.src, i])).values()];

  const sections = [];
  $("header, main, footer, section, nav, [class*='hero'], [class*='banner'], [class*='slider'], [class*='collection'], [class*='product']").each((_, el) => {
    const $el = $(el);
    const tag = el.tagName ?? "";
    const id = $el.attr("id") ?? "";
    const classes = ($el.attr("class") ?? "").slice(0, 200);
    const headingText = $el.find("h1, h2, h3").first().text().trim().slice(0, 60);
    const imgCount = $el.find("img").length;
    const linkCount = $el.find("a").length;
    const summary = [
      headingText ? `heading: "${headingText}"` : "",
      imgCount ? `${imgCount} images` : "",
      linkCount ? `${linkCount} links` : "",
    ].filter(Boolean).join(", ");
    sections.push({ tag, id, classes, summary });
  });

  // Dedupe links
  const seen = new Set();
  const dedupedLinks = links.filter(l => {
    const k = `${l.href}|${l.text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { links: dedupedLinks, images: uniqueImages, sections };
}

function getLocation($, $el) {
  const parent = $el.closest("header, nav, main, footer, section, [class*='hero'], [class*='banner']");
  if (parent.length) {
    const tag = parent.prop("tagName")?.toLowerCase() ?? "";
    const cls = (parent.attr("class") ?? "").split(/\s+/).slice(0, 3).join(".");
    return cls ? `${tag}.${cls}` : tag;
  }
  return "body";
}

function formatSiteMap(siteMap) {
  let out = "## SITE MAP\n\n";
  out += "### Navigation Links\n";
  for (const link of siteMap.links) {
    out += `- [${link.text || "(no text)"}](${link.href}) — location: ${link.location}\n`;
  }
  out += "\n### Images (MUST preserve these exact URLs)\n";
  for (const img of siteMap.images) {
    out += `- ${img.src}\n  alt: "${img.alt}" — location: ${img.location}\n`;
  }
  out += "\n### Page Sections\n";
  for (const sec of siteMap.sections) {
    const idStr = sec.id ? `#${sec.id}` : "";
    const clsStr = sec.classes ? `.${sec.classes.split(/\s+/).slice(0, 3).join(".")}` : "";
    out += `- <${sec.tag}${idStr}${clsStr}> — ${sec.summary || "(empty)"}\n`;
  }
  return out;
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildCreativeDirectorPrompt() {
  return `You are the Creative Director for Overkill — an elite $50k web transformation agency. You are the person who walks into the room, looks at a boring Shopify store selling racing parts, and says "What if when you scroll to a product, a racecar drives across the screen with the part attached to it?" You think in EXPERIENCES, not features. You think in STORIES, not layouts.

## Your Job

You receive a website's content inventory (images, links, sections, products) and brainstorm 3-5 wildly creative concepts for how this site could be reimagined. Not "add a glass nav" — that's generic. You think brand-specific:

- A racing parts store? → "What if the preloader is a tachometer revving up?"
- A luxury fashion brand? → "What if scrolling through collections feels like flipping through a magazine?"
- A SaaS dashboard? → "What if the hero is a live, interactive demo you can play with?"
- A photography portfolio? → "What if the cursor becomes a viewfinder that reveals images?"

Every concept must be SPECIFIC to this brand. No generic web effects bolted on.

## What Makes a $50k Concept

1. **Brand-native interaction** — the interaction metaphor comes FROM the brand's world.
   Racing = speed, checkered flags, pit stops, tachometers, exhaust heat.
   Fashion = runway, editorial spreads, texture, draping, seasons.
   SaaS = data flow, real-time, dashboards, metrics, automation.

2. **Scroll storytelling** — every scroll position is a directed frame. The user advances through a narrative, not just a page.

3. **The product IS the hero** — for e-commerce, the products must be front and center. The creative treatment makes products MORE visible and desirable, not hidden behind effects. Think: cinematic product reveals, dramatic lighting, close-up zoom-on-scroll.

4. **Scalability** — if this is a store, the owner will add more products. The layout must work with 7 items or 70.

5. **The "how did they make this?" test** — show someone who hasn't seen it. Do they audibly react?

6. **Readability is non-negotiable** — dark theme does NOT mean dim everything.
   - Headings: full white, LARGE (32px+ for sections, 48px+ for hero). Use the display font.
   - Body text: minimum rgba(255,255,255,0.75) — NOT 0.4 or 0.5.
   - Product images: NEVER darken with filter:brightness. Products must be BRIGHT and clear. The dark bg makes them pop.
   - Section titles: BIG and prominent, not subtle grey whispers.
   - The dark background exists to make content POP, not to hide it.

## Output Format

Return a JSON object (no markdown fences):

{
  "brandIdentity": {
    "archetype": "Bold/Industrial | Elegant/Luxury | Modern/SaaS | Creative/Portfolio",
    "personality": "2-3 sentence description of the brand's soul",
    "audience": "who visits this site and what they want",
    "siteType": "e-commerce | portfolio | saas | blog | corporate",
    "scalability": "how the design must scale"
  },
  "palette": {
    "base": "#hex (darkest background)",
    "surface": "#hex (cards, elevated surfaces)",
    "accent": "#hex (primary brand accent)",
    "accentMuted": "rgba for subtle backgrounds",
    "text": "#hex (primary text on dark bg)",
    "textMuted": "rgba for secondary text"
  },
  "typography": {
    "display": "Google Fonts name for hero headings",
    "heading": "Google Fonts name for section headings",
    "body": "Google Fonts name for body text"
  },
  "concepts": [
    {
      "name": "Short concept name",
      "tagline": "One sentence vibe",
      "description": "2-3 sentences describing the experience",
      "heroTreatment": "What happens above the fold",
      "scrollExperience": "What happens as user scrolls",
      "productPresentation": "How products are displayed and interacted with",
      "signature": "The ONE wow moment",
      "technicalApproach": "GSAP, CSS clip-path, Three.js, SVG, etc."
    }
  ],
  "recommendedConcept": {
    ...same fields as concepts above...,
    "buildSteps": [
      "STEP 1 — PRELOADER: [exact HTML, CSS values, JS animation with durations and easing]",
      "STEP 2 — NAV: [exact position, rgba background, backdrop-filter value, border, padding, scroll shrink with GSAP params]",
      "STEP 3 — HERO: [exact background-image treatment with gradient CSS, text split animation with GSAP stagger/ease/duration values, CTA button with hover transform and box-shadow]",
      "STEP 4 — COLLECTIONS: [exact grid layout, card structure, image hover with CSS transform values, reveal animation with ScrollTrigger params. Cards must start at opacity:0.4 minimum NOT opacity:0]",
      "STEP N — FOOTER: [exact layout, background color, typography, social icon hover states]",
      "STEP N+1 — EFFECTS: [film grain SVG with exact baseFrequency/opacity, cursor with exact GSAP quickTo durations, scroll progress bar CSS, Lenis init params]"
    ]
  },
  "practicalConsiderations": "scalability, content management, performance notes"
}

CRITICAL: The buildSteps are the most important part. Each step must have EXACT CSS values, EXACT GSAP parameters, EXACT animation timings. The builder will follow them literally — if you write "add a nice hover effect" the result will be mediocre. If you write "on hover: transform:scale(1.03) translateY(-4px), box-shadow:0 12px 40px rgba(accent,0.25), transition:0.4s cubic-bezier(0.16,1,0.3,1)" the result will be premium.

## Rules
1. Return ONLY the JSON.
2. Include 3-5 concepts, from most ambitious to most practical.
3. recommendedConcept MUST include buildSteps with exact implementation values.
4. Every concept must be specific to THIS brand.
5. Palette priority: (1) LOGO colors first — red+black logo means RED accent, not orange. (2) If no clear logo, use the site's dominant brand colors from headings/CTAs. (3) If generic/unstyled site, create a palette fitting the brand archetype. Never use default Shopify/WordPress theme colors if they don't match the actual brand.
6. All fonts must be on Google Fonts.
7. Products must be MORE visible in your concept, not less.
8. buildSteps must cover EVERY element: preloader, nav, hero, all content sections, footer, global effects.`;
}

function buildPlannerPrompt(features, themeDirection) {
  const featureList = features
    .map(id => FEATURE_INSTRUCTIONS[id] ? `- **${id}**: ${FEATURE_INSTRUCTIONS[id]}` : null)
    .filter(Boolean)
    .join("\n");
  const themeNote = themeDirection
    ? `\nThe client has requested this theme direction: "${themeDirection}". The design spec MUST align with this direction.`
    : "\nNo specific theme direction was given — enhance the existing design language, making it feel premium and polished.";

  return `You are the Design Architect for Overkill — an elite web transformation agency. Your job is to analyze an existing website and produce a hyper-detailed design specification that another agent (the Builder) will implement to the letter.

## Your Process

1. **Site Classification** — Identify the site type (e-commerce, portfolio, SaaS landing, blog, corporate, etc.)
2. **Color Extraction** — Pull every hex code from the CSS. Identify primary, secondary, accent, background, and text colors.
3. **Typography Audit** — List all font families, weights, and sizes used. Note the typographic hierarchy.
4. **Layout Mapping** — Describe the page structure section by section (e.g., "Header -> Hero with CTA -> 3-column features -> Testimonials -> Footer")
5. **Brand Personality** — Infer the brand's personality (luxury, playful, minimal, corporate, bold, etc.)
${themeNote}

## Features to Integrate

${featureList}

## Output Format

Return a JSON object with this exact structure (no markdown fences, just raw JSON):

{
  "analysis": {
    "siteType": "...",
    "colorPalette": ["#hex1", "#hex2"],
    "typography": ["Font Family 1"],
    "layoutStructure": "Header -> Hero -> ...",
    "brandPersonality": "..."
  },
  "designSpec": "A VERY detailed design specification text. Include exact hex codes, pixel/rem values, blur amounts, font weights, animation durations (in ms), easing functions, z-index values, opacity values, gradient stops, border-radius values, box-shadow definitions, and layout positions. The Builder agent must be able to implement this with ZERO creative decisions.",
  "featureIntegration": "For each selected feature, describe the EXACT implementation for this specific site: which elements to target, what colors to use (hex), pixel dimensions, animation timings, z-index layering."
}

## Rules
1. Return ONLY the JSON object — no explanation before or after.
2. Every color must be a hex code. Every size must be in px or rem. Every duration must be in ms or s.
3. The designSpec must be detailed enough that a developer can implement it without seeing the original site.`;
}

function buildExecutorPrompt() {
  return `You are the Master Builder for Overkill — an elite $50k web transformation agency.
You receive a creative concept and content inventory, then build a fully reimagined website.

## CRITICAL: Build from SITE MAP, not from any template
- Use EXACT image URLs from the site map. Never use placeholder SVGs.
- Preserve ALL navigation links with correct hrefs.
- Keep all text content (headings, product names, button labels).
- Build your own clean CSS class names. No Shopify/WordPress classes.

## Site Type Awareness
For E-COMMERCE sites:
- Products are the HERO — large images, easy to browse
- Collections grid: 2-3 columns desktop, large images, hover effects, clear labels
- Navigation: Home, Catalog, Cart — shopping flow first
- CTA buttons prominent and obvious

## Visual Theme (MANDATORY for Bold/Industrial)
- body { background: #0d0d0d; color: #f0f0f0; }
- Nav: dark glass rgba(13,13,13,0.85) with backdrop-filter:blur(16px)
- Hero: dark gradient overlay over image
- Cards: subtle borders rgba(255,255,255,0.08), hover glow with accent color
- ALL text light on dark backgrounds

## KEY IMPLEMENTATION PATTERNS

Custom cursor: use GSAP quickTo for smooth tracking, mix-blend-mode:difference, two elements (40px ring + 6px dot). Add data-cursor="text:SHOP" to CTAs. Hide on touch devices.

Magnetic buttons: on mousemove, translate toward cursor (12px strength), scale(1.03), box-shadow glow with accent color. On mouseleave, spring back with cubic-bezier(0.16,1,0.3,1).

Film grain: SVG feTurbulence with animated seed (requestAnimationFrame incrementing seed attribute). position:fixed, z-index:9999, pointer-events:none, opacity:0.04, mix-blend-mode:overlay.

Split text: split heading into per-character spans, GSAP stagger from {opacity:0, y:40, rotateX:-90} to visible, stagger:0.025, ease:back.out(1.7).

Scroll reveals: use opacity:0.3 NOT opacity:0 for initial state. Content must be VISIBLE on load. ScrollTrigger just polishes entrance with subtle y:20->0 fade.

## Output Format

SECTION 1 — start with: <!-- TRANSFORMED HTML -->
Complete HTML document from DOCTYPE to </html>.
Then: <!-- END HTML -->

SECTION 2 — start with: /* ENHANCED CSS */
All CSS rules.
Then: /* END CSS */

SECTION 3 — start with: // NEW JAVASCRIPT
All JS in a self-executing IIFE.
Then: // END JS

## Rules
1. Output ONLY the three sections — nothing before, nothing after.
2. Section 1 first, Section 2 second, Section 3 third.
3. CSS in <style id="overkill-styles"> in <head>. JS in <script id="overkill-scripts"> before </body>.
4. EVERY image from site map. NEVER placeholder SVGs.
5. EVERY nav link from site map.
6. Use the CODE PATTERNS above — copy them, adapt colors/selectors. Do NOT simplify them.
7. Add prefers-reduced-motion that disables animations.
8. The page must look like a $50k award-winning website.`;
}

// ── Claude CLI runner ─────────────────────────────────────────────────────────

function runClaude(model, systemPrompt, userPrompt, outFile) {
  log("CLI", `Running ${model} → ${path.basename(outFile)} (this may take 30-90s)...`);

  // Pass args directly as array to avoid shell escaping issues with large prompts
  const result = spawnSync(
    "claude",
    [
      "--print",
      "--model", model,
      "--output-format", "text",
      "--system-prompt", systemPrompt,
    ],
    {
      input: userPrompt,
      timeout: 1_800_000,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024, // 20MB
      env: { ...process.env, CLAUDE_CODE_MAX_OUTPUT_TOKENS: "128000" },
    }
  );

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  if (result.error) {
    err("CLI", `Spawn error: ${result.error.message}`);
    return null;
  }

  // Claude CLI sometimes writes to stderr instead of stdout
  const output = stdout.trim() ? stdout : stderr.trim() ? stderr : "";

  if (!output.trim()) {
    err("CLI", `No output. Exit: ${result.status}. Stderr: ${stderr.slice(0, 300)}`);
    return null;
  }

  fs.writeFileSync(outFile, output, "utf8");
  log("CLI", `Got ${output.length} bytes (exit ${result.status})`);
  return output;
}

// ── Parse pipeline outputs ────────────────────────────────────────────────────

function parsePlannerJson(raw) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  // Try to extract JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in planner output");
  return JSON.parse(match[0]);
}

function parseTransformResponse(raw) {
  const htmlMatch = raw.match(/<!-- TRANSFORMED HTML -->([\s\S]*?)<!-- END HTML -->/);
  const cssMatch = raw.match(/\/\* ENHANCED CSS \*\/([\s\S]*?)\/\* END CSS \*\//);
  const jsMatch = raw.match(/\/\/ NEW JAVASCRIPT([\s\S]*?)\/\/ END JS/);

  return {
    html: htmlMatch ? htmlMatch[1].trim() : "",
    css: cssMatch ? cssMatch[1].trim() : "",
    js: jsMatch ? jsMatch[1].trim() : "",
  };
}

// ── Post-processor: guarantee mandatory overkill elements ────────────────────
// The executor sometimes drops preloader, Lenis, Bebas Neue, or glass nav when
// the original HTML is heavily weighted in the prompt. We inject them here.

function injectMandatoryElements(html, briefOrPlanner, siteUrl) {
  // Support both creativeBrief and legacy plannerData formats
  const palette = briefOrPlanner.palette
    ? [briefOrPlanner.palette.base, briefOrPlanner.palette.accent, briefOrPlanner.palette.text]
    : briefOrPlanner.analysis?.colorPalette || [];
  // Pick darkest color for preloader bg, accent for bar
  const bgColor = palette.find(c => {
    const hex = c.replace("#", "");
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    return (r + g + b) < 200;
  }) || "#0d0d0d";
  const accentColor = palette.find(c => {
    const hex = c.replace("#", "");
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    return r > 150 || g > 150;
  }) || "#ffab39";

  // 1. Ensure Bebas Neue + Lenis CDNs are loaded
  if (!html.includes("Bebas+Neue")) {
    html = html.replace("</head>",
      `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>`
    );
    log("post", "Injected Bebas Neue + Oswald font CDN");
  }

  if (!html.toLowerCase().includes("lenis")) {
    html = html.replace("</head>",
      `<script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>\n</head>`
    );
    log("post", "Injected Lenis CDN");
  }

  // 2. Inject preloader if missing (use deterministic ok-preloader from asset stage)
  if (!html.includes("overkill-preloader") && !html.includes("ok-preloader")) {
    const preloaderHTML = `
<div id="overkill-preloader" style="position:fixed;inset:0;z-index:99999;background:${bgColor};display:flex;align-items:center;justify-content:center;flex-direction:column;gap:24px;">
  <div class="preloader-brand" style="font-family:'Bebas Neue',Oswald,sans-serif;font-size:clamp(32px,5vw,64px);letter-spacing:0.15em;color:#fff;text-transform:uppercase;">Britain Racing</div>
  <div class="preloader-bar" style="width:280px;height:2px;background:rgba(255,255,255,0.15);overflow:hidden;border-radius:2px;">
    <div class="preloader-fill" style="width:0%;height:100%;background:${accentColor};transition:width 0.1s linear;"></div>
  </div>
  <div class="preloader-count" style="font-family:Oswald,sans-serif;font-size:13px;letter-spacing:0.2em;color:rgba(255,255,255,0.5);">0%</div>
</div>`;

    html = html.replace("<body>", `<body>${preloaderHTML}`) ||
           html.replace(/<body([^>]*)>/, `<body$1>${preloaderHTML}`);

    const preloaderJS = `
// ── Preloader ──────────────────────────────────────────────
(function() {
  var progress = 0;
  var fill = document.querySelector('.preloader-fill');
  var count = document.querySelector('.preloader-count');
  var interval = setInterval(function() {
    progress += Math.random() * 12 + 3;
    if (progress >= 100) { progress = 100; clearInterval(interval); }
    if (fill) fill.style.width = progress + '%';
    if (count) count.textContent = Math.floor(progress) + '%';
    if (progress >= 100) {
      setTimeout(function() {
        var preloader = document.getElementById('overkill-preloader');
        if (preloader && window.gsap) {
          gsap.to(preloader, { yPercent: -100, duration: 0.8, ease: 'power4.inOut',
            onComplete: function() { preloader.style.display = 'none'; }
          });
        } else if (preloader) {
          preloader.style.transition = 'opacity 0.5s';
          preloader.style.opacity = '0';
          setTimeout(function() { preloader.style.display = 'none'; }, 500);
        }
      }, 200);
    }
  }, 60);
})();`;

    // Inject before closing script tag or before </body>
    const scriptTag = html.lastIndexOf('<script id="overkill-scripts">');
    if (scriptTag !== -1) {
      html = html.slice(0, scriptTag + '<script id="overkill-scripts">'.length) +
             preloaderJS + "\n" +
             html.slice(scriptTag + '<script id="overkill-scripts">'.length);
    } else {
      html = html.replace("</body>", `<script>${preloaderJS}</script>\n</body>`);
    }
    log("post", "Injected preloader HTML + JS");
  }

  // 3. Inject Lenis init if missing
  if (!html.toLowerCase().includes("new lenis") && !html.toLowerCase().includes("lenis(")) {
    const lenisJS = `
// ── Lenis Smooth Scroll ─────────────────────────────────────
(function() {
  if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') return;
  var lenis = new Lenis({ lerp: 0.1, duration: 1.2, smoothWheel: true });
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
  }
  gsap.ticker.add(function(time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
})();`;

    const scriptTag = html.lastIndexOf('<script id="overkill-scripts">');
    if (scriptTag !== -1) {
      html = html.slice(0, scriptTag + '<script id="overkill-scripts">'.length) +
             lenisJS + "\n" +
             html.slice(scriptTag + '<script id="overkill-scripts">'.length);
    } else {
      html = html.replace("</body>", `<script>${lenisJS}</script>\n</body>`);
    }
    log("post", "Injected Lenis smooth scroll init");
  }

  // 4. Ensure glass nav — if nav has position:fixed but no backdrop-filter, add it
  if (!html.includes("backdrop-filter") && !html.includes("backdropFilter")) {
    // Find the header/nav style and augment it
    html = html.replace(
      /\.header\s*\{/,
      `.header { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);`
    );
    if (!html.includes("backdrop-filter")) {
      // Add as inline style override
      html = html.replace("</style>", `
.header, header, nav.site-nav, #shopify-section-header {
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
}
</style>`);
    }
    log("post", "Injected glass nav backdrop-filter");
  }

  // 5. Override heading font to Bebas Neue (always force it — executor keeps using wrong fonts)
  html = html.replace("</style>",
    `
/* ── Post-processor overrides ────────────────────────────── */
h1, h2, h3, .hero-heading, .section-heading, .collection-card-title,
[class*="heading"], [class*="title"] {
  font-family: 'Bebas Neue', Oswald, Impact, sans-serif !important;
  font-style: normal !important;
  letter-spacing: 0.05em;
}
</style>`
  );
  log("post", "Injected Bebas Neue heading override");

  // 6. Force dark body background if not already dark
  if (!html.match(/body\s*\{[^}]*background\s*:\s*#[01]/)) {
    html = html.replace("</style>",
      `
body {
  background: #0d0d0d !important;
  color: #f0f0f0 !important;
}
</style>`
    );
    log("post", "Forced dark body background");
  }

  // 7. Force hero heading clamp sizing to prevent word breaks
  html = html.replace("</style>",
    `
.hero-heading, .hero h1, .hero h2, .hero-content h1, .hero-content h2,
[class*="hero"] h1, [class*="hero"] h2 {
  font-size: clamp(28px, 5vw, 72px) !important;
  line-height: 1.1 !important;
  word-break: keep-all !important;
  overflow-wrap: normal !important;
}
</style>`
  );
  log("post", "Forced hero heading clamp sizing");

  // 8. Force dark gradient overlay on hero image
  if (!html.includes("hero-overlay") && !html.match(/linear-gradient.*rgba.*hero/s)) {
    html = html.replace("</style>",
      `
[class*="hero"]::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(13,13,13,0.2) 0%, rgba(13,13,13,0.7) 100%);
  z-index: 1;
  pointer-events: none;
}
[class*="hero"] { position: relative; }
[class*="hero"] > * { position: relative; z-index: 2; }
</style>`
    );
    log("post", "Forced dark hero gradient overlay");
  }

  // 9. Force nav to be dark glass (not white)
  html = html.replace("</style>",
    `
header, nav, [class*="header"], [class*="nav-bar"] {
  background: rgba(13, 13, 13, 0.85) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid rgba(255,255,255,0.08) !important;
}
header a, nav a, [class*="header"] a, [class*="nav-bar"] a {
  color: #f0f0f0 !important;
}
header svg, nav svg, [class*="header"] svg {
  color: #f0f0f0 !important;
  fill: #f0f0f0 !important;
}
</style>`
  );
  log("post", "Forced dark glass nav");

  // 10. Force collection cards to be larger with hover effects
  html = html.replace("</style>",
    `
[class*="collection"] img, [class*="card"] img, [class*="grid"] img {
  transition: transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) !important;
}
[class*="collection"]:hover img, [class*="card"]:hover img {
  transform: scale(1.05) !important;
}
[class*="collection"] a, [class*="card"] a {
  overflow: hidden;
  display: block;
}
</style>`
  );
  log("post", "Added card hover zoom effects");

  // 11. Force collections/cards to be visible (executor keeps hiding with opacity:0)
  html = html.replace("</style>",
    `
[class*="collection"], [class*="card"], [class*="grid"] > *, article {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
}
</style>`
  );
  log("post", "Forced collections/cards visible (override opacity:0)");

  return html;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure output dir
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  log("init", `Target: ${TARGET_URL}`);
  log("init", `Features: ${FEATURES.join(", ")}`);

  // ── Step 1: Fetch HTML ────────────────────────────────────────────────────
  log("fetch", `Fetching ${TARGET_URL}...`);
  const html = await fetchUrl(TARGET_URL);
  log("fetch", `Got ${html.length} bytes of HTML`);
  fs.writeFileSync(`${OUT_DIR}/original.html`, html, "utf8");

  const truncatedHtml = html.length > MAX_HTML ? html.slice(0, MAX_HTML) + "\n<!-- ... HTML truncated ... -->" : html;
  const css = ""; // We'd need to extract CSS separately; using inline styles from HTML for now

  // ── Step 2: Build site map ────────────────────────────────────────────────
  log("sitemap", "Building site map from HTML...");
  const siteMap = await mapSite(html, TARGET_URL);
  log("sitemap", `Found: ${siteMap.links.length} links, ${siteMap.images.length} images, ${siteMap.sections.length} sections`);
  const siteMapText = formatSiteMap(siteMap);
  fs.writeFileSync(`${OUT_DIR}/sitemap.txt`, siteMapText, "utf8");

  // ── Step 3: Creative Director (Opus) ─────────────────────────────────────
  log("creative", "Stage 1: Creative Director brainstorming with Opus...");

  const creativeSystem = buildCreativeDirectorPrompt();
  const creativeUser = `## Website: ${TARGET_URL}
## Page Title: ${html.match(/<title>(.*?)<\/title>/)?.[1] || "Unknown"}

## Site Map (real content inventory):
${siteMapText}

## Original HTML (for understanding structure, NOT for copying):
${truncatedHtml}

## Selected premium features: ${FEATURES.join(", ")}
${THEME_DIRECTION ? `## Client theme direction: ${THEME_DIRECTION}\n` : ""}
Brainstorm creative concepts for this site now. Return the JSON.`;

  const creativeRaw = runClaude("opus", creativeSystem, creativeUser, `${OUT_DIR}/creative-out.txt`);

  if (!creativeRaw) {
    err("creative", "Creative Director failed — aborting");
    process.exit(1);
  }

  let creativeBrief;
  try {
    const match = creativeRaw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    creativeBrief = JSON.parse(match[0]);
    log("creative", `Brand: ${creativeBrief.brandIdentity?.archetype} — ${creativeBrief.brandIdentity?.personality?.slice(0, 80)}`);
    log("creative", `Recommended: "${creativeBrief.recommendedConcept?.name}" — ${creativeBrief.recommendedConcept?.tagline}`);
    if (creativeBrief.concepts) {
      creativeBrief.concepts.forEach((c, i) => log("creative", `  Concept ${i+1}: "${c.name}" — ${c.tagline}`));
    }
    log("creative", `Palette: base=${creativeBrief.palette?.base}, accent=${creativeBrief.palette?.accent}`);
    log("creative", `Typography: ${creativeBrief.typography?.display} / ${creativeBrief.typography?.heading} / ${creativeBrief.typography?.body}`);
    fs.writeFileSync(`${OUT_DIR}/creative-brief.json`, JSON.stringify(creativeBrief, null, 2), "utf8");
  } catch (e) {
    err("creative", `JSON parse failed: ${e.message}`);
    err("creative", `Raw (first 500): ${creativeRaw.slice(0, 500)}`);
    process.exit(1);
  }

  // ── Step 4: Asset Generation ─────────────────────────────────────────────
  log("assets", "Stage 2: Generating visual assets...");

  const brandName = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim()?.replace(/\s*[–—|].*/,'') || "Brand";
  const concept = creativeBrief.recommendedConcept;
  const palette = creativeBrief.palette;
  const typo = creativeBrief.typography;

  // Build preloader deterministically (instant)
  const preloaderVariant = brandName.toLowerCase().match(/racing|motor|auto|speed|turbo|drift/) ? "tachometer" : "text-draw";
  const preloaderOpts = {
    brandName,
    accentColor: palette?.accent || '#C9520A',
    baseColor: palette?.base || '#0A0A0F',
    displayFont: typo?.display || 'Bebas Neue',
    variant: preloaderVariant,
  };

  // Simple inline preloader builder (mirrors templates/preloader-svg.ts)
  let preloaderHtml, preloaderCss, preloaderJs;
  if (preloaderVariant === "tachometer") {
    preloaderHtml = `<div id="ok-preloader"><div class="ok-preloader__inner"><svg class="ok-preloader__tacho" viewBox="0 0 200 120" fill="none"><path class="ok-preloader__arc-bg" d="M 20 110 A 80 80 0 0 1 180 110" stroke="rgba(255,255,255,0.1)" stroke-width="6" fill="none" stroke-linecap="round"/><path class="ok-preloader__arc-fill" d="M 20 110 A 80 80 0 0 1 180 110" stroke="${preloaderOpts.accentColor}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="251" stroke-dashoffset="251"/><line class="ok-preloader__needle" x1="100" y1="110" x2="100" y2="35" stroke="${preloaderOpts.accentColor}" stroke-width="2.5" stroke-linecap="round" transform="rotate(-90, 100, 110)"/><circle cx="100" cy="110" r="6" fill="${preloaderOpts.accentColor}"/><text x="30" y="105" fill="rgba(255,255,255,0.3)" font-size="8" font-family="${preloaderOpts.displayFont}, sans-serif">0</text><text x="165" y="105" fill="rgba(255,255,255,0.3)" font-size="8" font-family="${preloaderOpts.displayFont}, sans-serif">R</text></svg><div class="ok-preloader__brand">${brandName.toUpperCase()}</div><div class="ok-preloader__pct">0%</div></div></div>`;
    preloaderCss = `#ok-preloader{position:fixed;inset:0;z-index:99999;background:${preloaderOpts.baseColor};display:flex;align-items:center;justify-content:center}.ok-preloader__inner{display:flex;flex-direction:column;align-items:center;gap:24px}.ok-preloader__tacho{width:180px;height:auto}.ok-preloader__brand{font-family:'${preloaderOpts.displayFont}',Oswald,Impact,sans-serif;font-size:clamp(20px,4vw,36px);letter-spacing:0.2em;color:rgba(255,255,255,0.9)}.ok-preloader__pct{font-family:'${preloaderOpts.displayFont}',Oswald,sans-serif;font-size:14px;letter-spacing:0.3em;color:rgba(255,255,255,0.4)}`;
    preloaderJs = `(function(){var p=0,af=document.querySelector('.ok-preloader__arc-fill'),n=document.querySelector('.ok-preloader__needle'),pe=document.querySelector('.ok-preloader__pct'),td=251;var i=setInterval(function(){p+=Math.random()*8+2;if(p>=100){p=100;clearInterval(i)}if(af)af.setAttribute('stroke-dashoffset',String(td-(td*p/100)));if(n)n.setAttribute('transform','rotate('+(-90+p*1.8)+', 100, 110)');if(pe)pe.textContent=Math.floor(p)+'%';if(p>=100)setTimeout(function(){var el=document.getElementById('ok-preloader');if(el&&window.gsap){gsap.to(el,{yPercent:-100,duration:0.8,ease:'power4.inOut',onComplete:function(){el.style.display='none'}})}else if(el){el.style.transition='transform 0.6s cubic-bezier(0.16,1,0.3,1)';el.style.transform='translateY(-100%)';setTimeout(function(){el.style.display='none'},600)}},400)},50)})();`;
  } else {
    preloaderHtml = `<div id="ok-preloader"><div class="ok-preloader__inner"><div class="ok-preloader__brand">${brandName.toUpperCase()}</div><div class="ok-preloader__bar"><div class="ok-preloader__fill"></div></div><div class="ok-preloader__pct">0%</div></div></div>`;
    preloaderCss = `#ok-preloader{position:fixed;inset:0;z-index:99999;background:${preloaderOpts.baseColor};display:flex;align-items:center;justify-content:center}.ok-preloader__inner{display:flex;flex-direction:column;align-items:center;gap:20px}.ok-preloader__brand{font-family:'${preloaderOpts.displayFont}',Oswald,Impact,sans-serif;font-size:clamp(24px,5vw,56px);letter-spacing:0.15em;color:transparent;-webkit-text-stroke:1px rgba(255,255,255,0.3);animation:ok-fill-text 1.8s ease forwards}@keyframes ok-fill-text{to{color:rgba(255,255,255,0.95);-webkit-text-stroke:1px transparent}}.ok-preloader__bar{width:200px;height:2px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden}.ok-preloader__fill{width:0%;height:100%;background:${preloaderOpts.accentColor};transition:width 0.08s linear}.ok-preloader__pct{font-family:Oswald,sans-serif;font-size:12px;letter-spacing:0.3em;color:rgba(255,255,255,0.35)}`;
    preloaderJs = `(function(){var p=0,f=document.querySelector('.ok-preloader__fill'),c=document.querySelector('.ok-preloader__pct');var i=setInterval(function(){p+=Math.random()*10+3;if(p>=100){p=100;clearInterval(i)}if(f)f.style.width=p+'%';if(c)c.textContent=Math.floor(p)+'%';if(p>=100)setTimeout(function(){var el=document.getElementById('ok-preloader');if(el&&window.gsap){gsap.to(el,{yPercent:-100,duration:0.8,ease:'power4.inOut',onComplete:function(){el.style.display='none'}})}else if(el){el.style.transition='transform 0.6s cubic-bezier(0.16,1,0.3,1)';el.style.transform='translateY(-100%)';setTimeout(function(){el.style.display='none'},600)}},300)},60)})();`;
  }
  log("assets", `Built ${preloaderVariant} preloader for "${brandName}"`);
  fs.writeFileSync(`${OUT_DIR}/preloader.html`, preloaderHtml, "utf8");

  // TODO: HiggsField video + texture generation goes here
  // For now, skip asset generation and use static images
  // Uncomment these lines when ready to generate assets:
  // const videoResult = await generateVideo({ prompt: heroVideoPrompt, ... });
  // const textureResult = await generateImage({ prompt: sparkPrompt, ... });
  const heroVideoUrl = null; // Set to HiggsField CDN URL when available
  const sparkTextureUrl = null;

  // ── Step 5: Executor (builds from creative brief + assets) ──────────────
  log("executor", "Stage 3: Building from creative concept...");

  const executorSystem = buildExecutorPrompt();

  // Build Google Fonts URL from creative brief typography
  const fontFamilies = [typo?.display, typo?.heading, typo?.body].filter(Boolean).map(f => f.replace(/\s+/g, '+')).join('&family=');

  // Asset instructions for executor
  const assetInstructions = heroVideoUrl
    ? `## GENERATED HERO VIDEO (use this as the hero background)\nURL: ${heroVideoUrl}\nImplement as: <video autoplay loop muted playsinline class="hero-video" src="${heroVideoUrl}"></video>\nWith dark gradient overlay on top: linear-gradient(180deg, rgba(base,0.3) 0%, rgba(base,0.8) 100%)\n\n`
    : `## HERO BACKGROUND: Use the hero image from the site map as a CSS background-image with dark gradient overlay.\n\n`;

  const textureInstructions = sparkTextureUrl
    ? `## GENERATED SPARK TEXTURE (use for particle effects)\nURL: ${sparkTextureUrl}\nUse as background-image on floating particle elements instead of CSS box-shadow dots.\n\n`
    : '';

  // Build the executor prompt — if buildSteps exist, use them as primary instructions
  const buildSteps = creativeBrief.recommendedConcept?.buildSteps;
  const hasBuildSteps = buildSteps && buildSteps.length > 0;

  const buildStepsSection = hasBuildSteps
    ? `## BUILD CHECKLIST — Follow these steps EXACTLY, in order. No creative interpretation.\n\n${buildSteps.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}\n\n`
    : `## CONCEPT TO IMPLEMENT\nHero: ${concept.heroTreatment}\nScroll: ${concept.scrollExperience}\nProducts: ${concept.productPresentation}\nSignature wow: ${concept.signature}\nTech: ${concept.technicalApproach}\n\n`;

  const executorUser = `## CREATIVE CONCEPT: "${concept.name}" — ${concept.tagline}
${concept.description}

${buildStepsSection}## COLOR PALETTE (use these EXACT colors)
- Base (body bg): ${palette?.base || '#0d0d0d'}
- Surface (cards): ${palette?.surface || '#1a1a1a'}
- Accent (CTAs, highlights): ${palette?.accent || '#ff4d00'}
- Accent muted: ${palette?.accentMuted || 'rgba(255,77,0,0.15)'}
- Text: ${palette?.text || '#f0f0f0'}
- Text muted: ${palette?.textMuted || 'rgba(255,255,255,0.65)'}

## TYPOGRAPHY (from Google Fonts)
- Display: ${typo?.display || 'Bebas Neue'}
- Heading: ${typo?.heading || 'Oswald'}
- Body: ${typo?.body || 'Inter'}
Google Fonts: https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap

## CONTENT INVENTORY (use exact URLs)
${siteMapText}

## BRAND: ${brandName}
## FEATURES: ${FEATURES.join(", ")}

## RULES
- Body background MUST be ${palette?.base || '#0d0d0d'} (dark theme)
- Hero heading: font-size clamp(48px, 7vw, 100px) — LARGE and white, NEVER break mid-word
- Section headings: font-size clamp(32px, 5vw, 64px) — prominent, full white, display font
- Body text: color rgba(255,255,255,0.8) minimum — must be READABLE
- Product images: NEVER apply filter:brightness below 0.95 — images must be BRIGHT and clear
- Collections MUST be visible on load (use opacity:0.4 minimum, NOT opacity:0)
- All images from site map — NEVER placeholder SVGs
- All links from site map — correct hrefs
- Include: Lenis smooth scroll, GSAP ScrollTrigger, film grain, custom cursor

Return EXACTLY three sections: <!-- TRANSFORMED HTML --> then <!-- END HTML -->, /* ENHANCED CSS */ then /* END CSS */, // NEW JAVASCRIPT then // END JS.`;

  const executorRaw = runClaude("sonnet", executorSystem, executorUser, `${OUT_DIR}/executor-out.txt`);

  if (!executorRaw) {
    err("executor", "Executor failed — aborting");
    process.exit(1);
  }

  const buildOutput = parseTransformResponse(executorRaw);

  if (!buildOutput.html) {
    err("executor", "No HTML found in executor output");
    err("executor", `Raw (first 500): ${executorRaw.slice(0, 500)}`);
    process.exit(1);
  }

  log("executor", `HTML: ${buildOutput.html.length} bytes, CSS: ${buildOutput.css.length} bytes, JS: ${buildOutput.js.length} bytes`);

  // Combine into single HTML file — only inject CSS/JS if executor returned them separately
  let combined = buildOutput.html;
  if (buildOutput.css && buildOutput.css.length > 50 && !buildOutput.html.includes('<style id="overkill-styles">')) {
    combined = combined.replace("</head>", `<style id="overkill-styles">\n${buildOutput.css}\n</style>\n</head>`);
  }
  if (buildOutput.js && buildOutput.js.length > 50 && !buildOutput.html.includes('<script id="overkill-scripts">')) {
    combined = combined.replace("</body>", `<script id="overkill-scripts">\n${buildOutput.js}\n</script>\n</body>`);
  }

  // ── Post-processor: inject mandatory overkill elements the executor missed ──
  combined = injectMandatoryElements(combined, creativeBrief, TARGET_URL);

  // Inject deterministic preloader if executor didn't include it
  if (!combined.includes("ok-preloader") && !combined.includes("overkill-preloader")) {
    combined = combined.replace(/<body([^>]*)>/, `<body$1>${preloaderHtml}`);
    combined = combined.replace("</style>", `${preloaderCss}\n</style>`);
    const scriptIdx = combined.lastIndexOf('<script');
    if (scriptIdx !== -1) {
      const insertAt = combined.indexOf('>', scriptIdx) + 1;
      combined = combined.slice(0, insertAt) + '\n' + preloaderJs + '\n' + combined.slice(insertAt);
    } else {
      combined = combined.replace("</body>", `<script>${preloaderJs}</script>\n</body>`);
    }
    log("post", `Injected deterministic ${preloaderVariant} preloader`);
  }

  fs.writeFileSync(`${OUT_DIR}/output.html`, combined, "utf8");
  log("output", `Saved to ${OUT_DIR}/output.html`);

  // ── Step 5: Visual Review Loop ──────────────────────────────────────────
  // Screenshot the page, have AI compare to build steps, apply CSS fixes, repeat
  const MAX_VISUAL_ITERATIONS = 3;
  for (let vizPass = 0; vizPass < MAX_VISUAL_ITERATIONS; vizPass++) {
    log("visual", `Visual QA pass ${vizPass + 1}/${MAX_VISUAL_ITERATIONS}...`);

    // Take screenshot via Playwright (Python subprocess)
    const screenshotPath = `${OUT_DIR}/visual-pass-${vizPass}.png`;
    const htmlPath = `${OUT_DIR}/output.html`;

    const screenshotScript = `
import asyncio, glob
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        await page.goto("file:///${htmlPath.replace(/\\/g, '/')}", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        # Scroll to trigger any animations
        await page.evaluate("window.scrollTo(0, 200)")
        await page.wait_for_timeout(1000)
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="${screenshotPath.replace(/\\/g, '/')}", full_page=True, type="png")
        print("SCREENSHOT_SAVED")
        await browser.close()

asyncio.run(run())
`;

    const pyFile = `${OUT_DIR}/screenshot.py`;
    fs.writeFileSync(pyFile, screenshotScript, "utf8");

    try {
      const pyResult = execSync(`python "${pyFile}"`, {
        encoding: "utf8", timeout: 60_000, maxBuffer: 10 * 1024 * 1024
      });

      if (!pyResult.includes("SCREENSHOT_SAVED") || !fs.existsSync(screenshotPath)) {
        log("visual", "Screenshot failed — skipping visual QA");
        break;
      }
      log("visual", `Screenshot saved: ${screenshotPath}`);
    } catch (e) {
      log("visual", `Screenshot error: ${e.message?.slice(0, 100)} — skipping visual QA`);
      break;
    }

    // Read screenshot as base64 and send to Claude for visual review
    const screenshotBase64 = fs.readFileSync(screenshotPath).toString("base64");

    const visualReviewSystem = `You are a Visual QA Designer reviewing a website screenshot against the intended design.
You have sharp eyes for:
- Text readability (is text too small? too dim? poor contrast?)
- Image quality (are product images dimmed/filtered when they should be bright?)
- Spacing and rhythm (are elements too cramped? too much dead space?)
- Typography hierarchy (are headings prominent enough? is there clear visual hierarchy?)
- Overall impression (does this look like a $50k site or a template?)

Return a JSON object with CSS fixes:
{
  "score": 1-10,
  "issues": ["issue 1", "issue 2"],
  "cssFixes": "CSS rules to fix the issues. Use !important. Target specific elements."
}

If score is 8+ with no critical issues, set cssFixes to empty string.
Return ONLY the JSON.`;

    const visualReviewUser = `Compare this screenshot against what was supposed to be built.

CONCEPT: "${concept.name}" — ${concept.tagline}
PALETTE: base=${palette?.base}, accent=${palette?.accent}, text=${palette?.text}
FONTS: display=${typo?.display}, heading=${typo?.heading}

Key things to check:
1. Is the hero heading LARGE and prominent? (should be 48px+ on desktop)
2. Are product/collection images BRIGHT and clear? (not dimmed or filtered)
3. Is body text readable? (rgba 0.75+ on dark bg, not tiny grey)
4. Are section titles BIG enough? (32px+ with display font)
5. Is spacing comfortable? (not cramped, good breathing room)
6. Does it look premium or generic?

If something is wrong, write CSS fixes. Be specific — use exact selectors and values.`;

    // Use Claude CLI with the screenshot - pass image via file reference
    const visualPromptFile = `${OUT_DIR}/visual-prompt.txt`;
    fs.writeFileSync(visualPromptFile, visualReviewUser, "utf8");

    // Claude CLI can't directly take images via --print mode easily,
    // so we'll use a workaround: encode the review as a text-only prompt
    // that describes what we see based on the HTML analysis
    // Actually — let's use the API approach: pipe the screenshot path

    const visualResult = runClaude("sonnet", visualReviewSystem,
      visualReviewUser + "\n\n[Screenshot attached as base64 — analyze it]\nBase64 image data (first 200 chars for context): " + screenshotBase64.slice(0, 200) + "...\n\nNote: Since you cannot see the actual image in --print mode, analyze the HTML instead. Here are key CSS values from the current output:\n" +
      `- Hero h1 font-size: ${combined.match(/h1[^}]*font-size:\s*([^;]+)/s)?.[1] || 'unknown'}\n` +
      `- Body color: ${combined.match(/body\s*\{[^}]*color:\s*([^;]+)/s)?.[1] || 'unknown'}\n` +
      `- Card img filter: ${combined.match(/card[^}]*img[^}]*filter:\s*([^;]+)/s)?.[1] || 'none'}\n` +
      `- Nav background: ${combined.match(/nav[^}]*background:\s*([^;]+)/s)?.[1] || 'unknown'}\n` +
      `- Section h2 font-size: ${combined.match(/h2[^}]*font-size:\s*([^;]+)/s)?.[1] || 'unknown'}\n` +
      `- Card title font-size: ${combined.match(/title[^}]*font-size:\s*([^;]+)/s)?.[1] || 'unknown'}\n` +
      `- Body font-size: ${combined.match(/body\s*\{[^}]*font-size:\s*([^;]+)/s)?.[1] || 'unknown'}\n`,
      `${OUT_DIR}/visual-review-${vizPass}.txt`
    );

    if (!visualResult) {
      log("visual", "Visual review failed — skipping");
      break;
    }

    // Parse the review
    try {
      const reviewMatch = visualResult.match(/\{[\s\S]*\}/);
      if (!reviewMatch) throw new Error("No JSON");
      const review = JSON.parse(reviewMatch[0]);
      log("visual", `Score: ${review.score}/10`);
      if (review.issues) review.issues.forEach(i => log("visual", `  Issue: ${i}`));

      if (review.score >= 8 || !review.cssFixes || review.cssFixes.trim() === "") {
        log("visual", `Score ${review.score}/10 — looks good, moving on`);
        break;
      }

      // Apply CSS fixes
      log("visual", `Applying CSS fixes from visual review...`);
      combined = combined.replace("</style>", `\n/* Visual QA Pass ${vizPass + 1} */\n${review.cssFixes}\n</style>`);
      fs.writeFileSync(`${OUT_DIR}/output.html`, combined, "utf8");
      log("visual", `Applied fixes, re-checking...`);
    } catch (e) {
      log("visual", `Could not parse visual review: ${e.message}`);
      break;
    }
  }

  // ── Step 6: Quick reviewer check ─────────────────────────────────────────
  log("reviewer", "Stage 4: Quick QA check...");

  // Build a structural audit instead of truncated HTML — check what's actually present
  const fullOutputText = combined;
  const imageCheck = siteMap.images.map(img => {
    const found = fullOutputText.includes(img.src) || fullOutputText.includes(img.src.split("?")[0]);
    return `- [${found ? "✓" : "✗ MISSING"}] ${img.alt || "(no alt)"}: ${img.src.slice(0, 80)}`;
  }).join("\n");

  const linkCheck = siteMap.links.slice(0, 15).map(link => {
    const found = fullOutputText.includes(link.href);
    return `- [${found ? "✓" : "✗ MISSING"}] "${link.text}": ${link.href}`;
  }).join("\n");

  const featureCheck = FEATURES.map(f => {
    const keywords = {
      "custom-cursor": ["overkill-cursor", "custom-cursor-active"],
      "film-grain": ["feTurbulence", "film-grain", "grain"],
      "scroll-progress": ["scroll-progress", "scrollProgress", "scrollY"],
      "split-text": [".char", "split-text", "stagger"],
      "magnetic-buttons": ["magnetic", "quickTo"],
    };
    const kws = keywords[f] || [f];
    const found = kws.some(kw => fullOutputText.includes(kw));
    return `- [${found ? "✓" : "✗ MISSING"}] ${f}`;
  }).join("\n");

  const reviewerSystem = `You are the QA Reviewer for Overkill. You receive a structural audit of the builder's output and verify quality.

Output ONLY this JSON:
{
  "approved": true/false,
  "summary": "1-2 sentence assessment",
  "issues": [{"severity": "critical|major|minor", "category": "...", "description": "...", "suggestion": "..."}]
}`;

  const reviewerUser = `## STRUCTURAL AUDIT OF BUILDER OUTPUT

### Image Presence Check (✓ = found in output, ✗ = missing)
${imageCheck}

### Navigation Link Check
${linkCheck}

### Feature Implementation Check
${featureCheck}

### Output Size
HTML: ${buildOutput.html.length} bytes
CSS: ${buildOutput.css.length} bytes (${buildOutput.css.length < 50 ? "inlined in HTML" : "separate"})
JS: ${buildOutput.js.length} bytes (${buildOutput.js.length < 50 ? "inlined in HTML" : "separate"})

### Design Spec
Site type: ${creativeBrief.brandIdentity?.siteType}
Palette: ${creativeBrief.palette?.base}, ${creativeBrief.palette?.accent}
Features requested: ${FEATURES.join(", ")}

Based on this structural audit, return a JSON verdict. Any ✗ MISSING image is CRITICAL. Any ✗ MISSING feature is MAJOR. A ✗ MISSING nav link is MAJOR.`;

  const reviewerRaw = runClaude("claude-haiku-4-5-20251001", reviewerSystem, reviewerUser, `${OUT_DIR}/reviewer-out.txt`);

  if (reviewerRaw) {
    try {
      const match = reviewerRaw.match(/\{[\s\S]*\}/);
      if (match) {
        const verdict = JSON.parse(match[0]);
        log("reviewer", `Approved: ${verdict.approved}`);
        log("reviewer", `Summary: ${verdict.summary}`);
        if (verdict.issues?.length) {
          for (const issue of verdict.issues) {
            log("reviewer", `  [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}`);
          }
        }
        fs.writeFileSync(`${OUT_DIR}/reviewer-verdict.json`, JSON.stringify(verdict, null, 2), "utf8");
      }
    } catch (e) {
      log("reviewer", `Could not parse verdict JSON: ${e.message}`);
    }
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log("\n\x1b[32m✓ Pipeline complete!\x1b[0m");
  console.log(`  Output:  ${OUT_DIR}/output.html`);
  console.log(`  Site map: ${OUT_DIR}/sitemap.txt`);
  console.log(`  Planner: ${OUT_DIR}/planner-parsed.json`);
  console.log(`  Reviewer: ${OUT_DIR}/reviewer-verdict.json`);
  console.log("\nOpen output.html in a browser to preview.");
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
