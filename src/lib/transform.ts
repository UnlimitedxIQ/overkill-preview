import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransformInput {
  html: string;
  css: string;
  url: string;
  title: string;
  features: string[];
  themeDirection?: string;
}

export interface TransformOutput {
  html: string;
  css: string;
  js: string;
}

// ---------------------------------------------------------------------------
// Feature instruction map
// ---------------------------------------------------------------------------

export const FEATURE_INSTRUCTIONS: Record<string, string> = {
  "custom-cursor":
    "Add a custom cursor element (div.overkill-cursor) with mix-blend-mode:difference. " +
    "Show context-aware labels on interactive elements (buttons get 'Click', links get 'View', images get 'Explore'). " +
    "CRITICAL: use `body.custom-cursor-active, body.custom-cursor-active * { cursor: none !important; }` to hide " +
    "the native cursor on ALL elements. Track mouse with GSAP quickTo for smooth follow. " +
    "Only activate on non-touch devices (matchMedia pointer:fine).",

  "3d-background":
    "Add an animated gradient background to the hero/first section using CSS. " +
    "Use a multi-stop radial gradient with CSS @keyframes that shifts background-position " +
    "over 15s infinite loop. Colors should complement the existing palette. " +
    "Add a subtle noise texture overlay using SVG feTurbulence for depth.",

  "film-grain":
    "Add an SVG film grain overlay: fixed position, inset 0, pointer-events none, z-index 9999. " +
    "Use <svg> with <filter><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' " +
    "stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#grain)'/></svg>. " +
    "Set opacity to 0.04. Add a subtle CSS animation that shifts the SVG transform every 0.5s for movement.",

  "magnetic-buttons":
    "Make all <button> and <a class containing 'btn' or 'button'> elements magnetic. " +
    "On mousemove within 80px, translate the button toward the cursor using GSAP quickTo. " +
    "On mouseleave, spring back to origin. Use GSAP with ease: 'elastic.out(1, 0.3)'. " +
    "Add a subtle scale(1.05) on hover.",

  "split-text":
    "Split hero heading (h1, or first h2 if no h1) into individual characters wrapped in <span>. " +
    "Use GSAP to animate each character from opacity:0, y:40, rotateX:-90 to full visibility " +
    "with stagger: 0.03 and ease: 'back.out(1.7)'. Trigger on page load after any preloader completes.",

  "scroll-progress":
    "Add a 2px-tall fixed bar at the very top of the viewport (z-index 10000). " +
    "Style with a gradient (left to right, brand colors or purple→pink→orange). " +
    "Width starts at 0% and tracks scroll position (scrollY / (docHeight - windowHeight) * 100%). " +
    "Use requestAnimationFrame for smooth updates.",

  "card-tilt":
    "Add perspective tilt to elements that look like cards (elements with box-shadow, border-radius, " +
    "or classes containing 'card'). On mousemove, calculate tilt based on cursor position relative " +
    "to card center. Max rotation: 3deg on both axes. Add perspective: 1000px to parent. " +
    "Use GSAP for smooth interpolation. Add a subtle translateZ(10px) on hover for depth.",

  "smooth-scroll":
    "Initialize Lenis smooth scrolling on the page. Include Lenis from CDN: " +
    "https://unpkg.com/lenis@1.1.18/dist/lenis.min.js. " +
    "Create new Lenis instance with lerp: 0.1 and smoothWheel: true. " +
    "Use requestAnimationFrame loop to call lenis.raf(). " +
    "Connect with GSAP ScrollTrigger if present: ScrollTrigger.scrollerProxy().",

  preloader:
    "Add a full-screen preloader overlay (z-index 99999, position fixed, inset 0). " +
    "Show a counter from 0 to 100 with GSAP number tween (duration 2s, ease: 'power2.inOut'). " +
    "After counter reaches 100, use clipPath: 'inset(0 0 100% 0)' animation to reveal the page. " +
    "Preloader background should match the site's dark/primary color. " +
    "Add 'overflow: hidden' to body during preload, remove after reveal.",

  parallax:
    "Add scroll-driven parallax to sections. Use GSAP ScrollTrigger to move background elements " +
    "at different speeds. Hero section: background moves at 0.5x scroll speed. " +
    "Alternate sections: slight translateY shift on scroll (data-speed attributes). " +
    "Use will-change: transform for GPU acceleration. Keep subtle — max 50px shift.",

  "focus-rings":
    "Add animated :focus-visible rings to all interactive elements. " +
    "Style: 2px solid with brand color, offset 4px, with a subtle box-shadow glow. " +
    "Add a CSS animation that pulses the box-shadow opacity. " +
    "Only show on keyboard navigation (:focus-visible), not mouse clicks.",

  "back-to-top":
    "Add a scroll-to-top button fixed at bottom-right (bottom: 2rem, right: 2rem). " +
    "Show only when scrolled past 500px (opacity + translateY transition). " +
    "Style: circular, 48px, with an up arrow (SVG or Unicode ↑). " +
    "On click, smooth scroll to top. Match site's accent color.",
};

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(features: string[], themeDirection?: string): string {
  const featureInstructions = features
    .map((id) => {
      const instruction = FEATURE_INSTRUCTIONS[id];
      return instruction ? `### ${id}\n${instruction}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  const themeNote = themeDirection
    ? `\n\nThe user wants this theme direction: "${themeDirection}". Adapt colors, mood, and intensity to match.`
    : "";

  return `You are Overkill — an elite web transformation engine. Your job is to take an existing website's HTML/CSS and enhance it with premium interactive effects that make it feel like a $50k agency build.

## Philosophy
- Every pixel matters. Every interaction should feel intentional.
- Preserve ALL original content, structure, and functionality.
- Layer effects ON TOP of the existing design — never break what works.
- Use GSAP for animations, Lenis for smooth scroll.
- Keep performance tight: no layout thrashing, use will-change sparingly, GPU-accelerate transforms.
- All effects must be accessible: respect prefers-reduced-motion, maintain keyboard navigation.
${themeNote}

## Features to Add

${featureInstructions}

## Output Format

Return EXACTLY three sections with these markers. No markdown code fences. No explanation text.

<!-- TRANSFORMED HTML -->
(The complete HTML document with all modifications. Include CDN script/link tags in <head>.)
<!-- END HTML -->

/* ENHANCED CSS */
(All new and modified CSS. Include original styles plus enhancements.)
/* END CSS */

// NEW JAVASCRIPT
(All JavaScript for the effects. Self-executing, no module syntax. Include null checks for safety.)
// END JS

## CDN Dependencies to Include in HTML <head>
- GSAP: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
- GSAP ScrollTrigger: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
- Lenis (if smooth-scroll selected): https://unpkg.com/lenis@1.1.18/dist/lenis.min.js

## Rules
1. Return ONLY the three sections — no explanatory text before or after.
2. The HTML must be a complete, valid document (<!DOCTYPE html> through </html>).
3. Inline the enhanced CSS in a <style id="overkill-styles"> tag in the <head>.
4. Add a <script id="overkill-scripts"> tag before </body> for the JS, OR keep it in the JS section.
5. All original content, text, images, and links must remain intact.
6. Add prefers-reduced-motion media query that disables animations.
7. If the original site has dark backgrounds, keep them. If light, keep light but enhance.`;
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

export function parseTransformResponse(response: string): TransformOutput {
  const htmlMatch = response.match(
    /<!-- TRANSFORMED HTML -->\s*([\s\S]*?)\s*<!-- END HTML -->/,
  );
  const cssMatch = response.match(
    /\/\* ENHANCED CSS \*\/\s*([\s\S]*?)\s*\/\* END CSS \*\//,
  );
  const jsMatch = response.match(
    /\/\/ NEW JAVASCRIPT\s*([\s\S]*?)\s*\/\/ END JS/,
  );

  return {
    html: htmlMatch?.[1]?.trim() ?? response,
    css: cssMatch?.[1]?.trim() ?? "",
    js: jsMatch?.[1]?.trim() ?? "",
  };
}

// ---------------------------------------------------------------------------
// Main transform function
// ---------------------------------------------------------------------------

const MAX_HTML_LENGTH = 60_000;
const MAX_CSS_LENGTH = 30_000;

export async function transformPage(
  input: TransformInput,
): Promise<TransformOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
  }

  const client = new Anthropic({ apiKey });

  const truncatedHtml =
    input.html.length > MAX_HTML_LENGTH
      ? input.html.slice(0, MAX_HTML_LENGTH) +
        "\n<!-- ... HTML truncated for length ... -->"
      : input.html;

  const truncatedCss =
    input.css.length > MAX_CSS_LENGTH
      ? input.css.slice(0, MAX_CSS_LENGTH) +
        "\n/* ... CSS truncated for length ... */"
      : input.css;

  const userPrompt = `Transform this website by adding the selected premium features. Preserve ALL original content, structure, and links.

## Original URL: ${input.url}
## Page Title: ${input.title}

## Original HTML:
${truncatedHtml}

## Original CSS:
${truncatedCss || "(No external CSS extracted — styles may be inline in the HTML)"}

## Selected Features: ${input.features.join(", ")}

Enhance this website now. Return ONLY the three marked sections (HTML, CSS, JS). No extra commentary.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16_000,
    system: buildSystemPrompt(input.features, input.themeDirection),
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!responseText) {
    throw new Error("Claude returned an empty response.");
  }

  return parseTransformResponse(responseText);
}
