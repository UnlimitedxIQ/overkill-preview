/**
 * test-pipeline-cli.ts
 *
 * Thin CLI wrapper that runs the REAL pipeline code using Claude CLI
 * instead of the Anthropic API. No duplicated prompts — imports directly
 * from src/lib/pipeline/*.
 *
 * Usage: npx tsx test-pipeline-cli.ts [url] [features]
 */

import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";

import { mapSite, formatSiteMap } from "./src/lib/pipeline/site-mapper";
import { buildPlannerSystemPrompt, buildExecutorSystemPrompt, buildReviewerSystemPrompt } from "./src/lib/pipeline/prompts";
import { EFFECT_PATTERNS } from "./src/lib/pipeline/effect-patterns";
import { FEATURE_INSTRUCTIONS, parseTransformResponse } from "./src/lib/transform";
import type { BuildStep, DesignSpec, FeatureSpec, SiteAnalysis, VideoAsset } from "./src/lib/pipeline/types";
import { searchYouTubeBackground, downloadVideoClip } from "./src/lib/pipeline/video-downloader";

// ── Config ────────────────────────────────────────────────────────────────────

const TARGET_URL = process.argv[2] || "https://britainracing.com/";
const FEATURES = (process.argv[3] || "custom-cursor,film-grain,scroll-progress,split-text").split(",");
const MOCKUP_PATH = process.argv[4] || ""; // Optional: path to mockup image
const OUT_DIR = `${tmpdir()}/overkill-test`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(stage: string, msg: string) {
  console.log(`\x1b[36m[${stage}]\x1b[0m ${msg}`);
}

function err(stage: string, msg: string) {
  console.error(`\x1b[31m[${stage} ERROR]\x1b[0m ${msg}`);
}

async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; OverkillBot/1.0)" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.text();
}

function runClaude(model: string, systemPrompt: string, userPrompt: string, outFile: string): string | null {
  log("CLI", `Running ${model} → ${path.basename(outFile)}...`);

  const result = spawnSync("claude", [
    "--print", "--model", model, "--output-format", "text",
    "--system-prompt", systemPrompt,
  ], {
    input: userPrompt,
    timeout: 1_800_000, // 30 min — executor generates 30K+ tokens
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, CLAUDE_CODE_MAX_OUTPUT_TOKENS: "128000" },
  });

  const output = (result.stdout ?? "").trim() || (result.stderr ?? "").trim();

  if (result.error) { err("CLI", `Spawn error: ${(result.error as Error).message}`); return null; }
  if (!output) { err("CLI", `No output. Exit: ${result.status}`); return null; }

  fs.writeFileSync(outFile, output, "utf8");
  log("CLI", `Got ${output.length} bytes (exit ${result.status})`);
  return output;
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found");
  return JSON.parse(match[0]);
}

// ── Format build spec (same as executor.ts) ───────────────────────────────────

function formatBuildSpec(spec: DesignSpec): string {
  let out = "# BUILD SPECIFICATION — Follow EXACTLY\n\n";
  out += `Brand: ${spec.analysis.siteType}\n`;
  out += `Archetype: ${spec.analysis.brandPersonality}\n`;
  out += `Palette: ${spec.analysis.colorPalette.join(", ")}\n`;
  out += `Typography: ${spec.analysis.typography.join(", ")}\n`;
  out += `Layout Flow: ${spec.analysis.layoutStructure}\n\n`;

  if (spec.videoAsset) {
    out += `# HERO BACKGROUND VIDEO (MANDATORY)\n`;
    out += `A video file is included at: assets/${spec.videoAsset.filename}\n`;
    out += `Use it as the hero background with this exact HTML:\n`;
    out += `  <video autoplay loop muted playsinline src="assets/${spec.videoAsset.filename}"\n`;
    out += `    style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;">\n`;
    out += `  </video>\n`;
    out += `Add a dark gradient overlay div ABOVE the video (z-index:1).\n`;
    out += `All hero text and CTAs go ABOVE the overlay (z-index:2).\n`;
    out += `Do NOT use a background-image for the hero — use this video instead.\n\n`;
  }

  for (const step of spec.buildSteps) {
    out += `## ${step.section}\n`;
    out += `Layout: ${step.layout}\n`;
    out += `CSS: ${step.css}\n`;
    out += `Animation: ${step.animation}\n`;
    if (step.elements?.length) {
      out += "Elements:\n";
      for (const el of step.elements) {
        out += `  - ${el.name}: ${el.details}\n`;
      }
    }
    if (step.notes) out += `Notes: ${step.notes}\n`;
    out += "\n";
  }

  out += "# FEATURE SPECS\n\n";
  for (const f of spec.features) {
    out += `## ${f.id}\n`;
    out += `Implementation: ${f.implementation}\n`;
    out += `Placement: ${f.placement}\n\n`;
  }
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  log("init", `Target: ${TARGET_URL}`);
  log("init", `Features: ${FEATURES.join(", ")}`);

  // ── Step 1: Fetch + Site Map ──────────────────────────────────────────────
  log("fetch", `Fetching ${TARGET_URL}...`);
  const html = await fetchUrl(TARGET_URL);
  log("fetch", `Got ${html.length} bytes`);
  fs.writeFileSync(`${OUT_DIR}/original.html`, html, "utf8");

  log("sitemap", "Building site map...");
  const siteMap = mapSite(html, TARGET_URL);
  log("sitemap", `Found: ${siteMap.links.length} links, ${siteMap.images.length} images, ${siteMap.sections.length} sections`);
  const siteMapText = formatSiteMap(siteMap);
  fs.writeFileSync(`${OUT_DIR}/sitemap.txt`, siteMapText, "utf8");

  // Planner gets more HTML for analysis, executor gets less (site map has all content)
  const plannerHtml = html.length > 40_000
    ? html.slice(0, 40_000) + "\n<!-- ... truncated ... -->"
    : html;
  const executorHtml = html.length > 15_000
    ? html.slice(0, 15_000) + "\n<!-- ... truncated (see site map for full content inventory) ... -->"
    : html;

  // ── Step 2: Planner (structured buildSteps) ───────────────────────────────
  log("planner", "Stage 1: Analyzing site (structured buildSteps)...");

  const plannerSystem = buildPlannerSystemPrompt(FEATURES);
  const plannerUser = `Analyze this website and produce a structured build specification.

## Original URL: ${TARGET_URL}

## Original HTML:
${plannerHtml}

## Selected Features: ${FEATURES.join(", ")}

${siteMapText}

Return the JSON with analysis, buildSteps[], and features[].`;

  const plannerRaw = runClaude("sonnet", plannerSystem, plannerUser, `${OUT_DIR}/planner-out.txt`);
  if (!plannerRaw) { err("planner", "Failed"); process.exit(1); }

  let plannerData: { analysis: SiteAnalysis; buildSteps: BuildStep[]; features: FeatureSpec[] };
  try {
    plannerData = parseJson(plannerRaw);
    if (!Array.isArray(plannerData.buildSteps)) throw new Error("Missing buildSteps[]");
    if (!Array.isArray(plannerData.features)) throw new Error("Missing features[]");
    log("planner", `Site: ${plannerData.analysis?.siteType}`);
    log("planner", `Build steps: ${plannerData.buildSteps.length} sections`);
    log("planner", `Features: ${plannerData.features.length} specs`);
    log("planner", `Palette: ${plannerData.analysis?.colorPalette?.join(", ")}`);
    fs.writeFileSync(`${OUT_DIR}/planner-parsed.json`, JSON.stringify(plannerData, null, 2), "utf8");
  } catch (e) {
    err("planner", `Parse failed: ${(e as Error).message}`);
    err("planner", `Raw: ${plannerRaw.slice(0, 500)}`);
    process.exit(1);
  }

  // Build the DesignSpec
  const spec: DesignSpec = {
    analysis: plannerData.analysis,
    siteMap,
    buildSteps: plannerData.buildSteps,
    features: plannerData.features,
  };

  // ── Step 2.5: Video Download ──────────────────────────────────────────────
  const heroStep = spec.buildSteps.find(s => s.section.toLowerCase().includes("hero"));
  if (heroStep?.videoQuery) {
    log("video", `Searching YouTube: "${heroStep.videoQuery}"`);
    try {
      const result = await searchYouTubeBackground(heroStep.videoQuery);
      if (result) {
        log("video", `Found: "${result.title}" (${result.id})`);
        const videoAsset = await downloadVideoClip(result.id, OUT_DIR);
        spec.videoAsset = videoAsset;
        log("video", `Downloaded: ${videoAsset.filename} (${(fs.statSync(videoAsset.localPath).size / 1024 / 1024).toFixed(1)}MB)`);
      }
    } catch (e) {
      log("video", `Failed (continuing without): ${(e as Error).message}`);
    }
  }

  // ── Step 3: Executor ──────────────────────────────────────────────────────
  const mockupPath = MOCKUP_PATH || spec.mockupImagePath || "";
  const hasMockup = mockupPath && fs.existsSync(mockupPath);

  if (hasMockup) {
    spec.mockupImagePath = mockupPath;
    log("executor", `Stage 2: Building from mockup image (${mockupPath})...`);
  } else {
    log("executor", "Stage 2: Building from structured spec...");
  }

  const executorSystem = buildExecutorSystemPrompt();
  const buildSpecText = formatBuildSpec(spec);
  const executorUser = `Build the transformed website following this design specification EXACTLY.

${hasMockup ? "## DESIGN MOCKUP\nA mockup image has been provided showing the EXACT layout to build. Match its layout, typography scale, spacing, grid structure, and color usage precisely. The mockup shows:\n- Dark nav bar at top with logo + links\n- Hero section with race car background + large heading + CTA\n- Product category grid (2-3 columns, clean cards with images and labels)\n- Footer\nBuild EXACTLY what the mockup shows, but use the REAL images and links from the site map below.\n" : ""}

${buildSpecText}

${siteMapText}

## Original HTML (truncated — use SITE MAP above for complete content inventory):
${executorHtml}

## Selected Features: ${FEATURES.join(", ")}

Build the complete transformed page. Preserve ALL image URLs and link hrefs from the site map. Return ONLY the three marked sections.`;

  let executorRaw: string | null;

  if (hasMockup) {
    // Use CLI with --allowedTools "Read" so Claude can see the mockup image
    const mockupPrompt = `FIRST: Read the image file at ${mockupPath.replace(/\\/g, "/")} — this is the DESIGN MOCKUP you must match exactly.

THEN: Build the website to match that mockup layout precisely.

${executorUser}`;

    log("executor", "Using CLI with Read tool for mockup image...");
    const result = spawnSync("claude", [
      "--print", "--model", "sonnet", "--output-format", "text",
      "--system-prompt", executorSystem,
      "--allowedTools", "Read",
    ], {
      input: mockupPrompt,
      timeout: 1_800_000,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, CLAUDE_CODE_MAX_OUTPUT_TOKENS: "128000" },
    });

    const output = (result.stdout ?? "").trim() || (result.stderr ?? "").trim();
    if (result.error) { err("CLI", `Spawn error: ${(result.error as Error).message}`); }
    if (output) {
      fs.writeFileSync(`${OUT_DIR}/executor-out.txt`, output, "utf8");
      log("CLI", `Got ${output.length} bytes (exit ${result.status})`);
    }
    executorRaw = output || null;
  } else {
    // No mockup — text spec only
    executorRaw = runClaude("sonnet", executorSystem, executorUser, `${OUT_DIR}/executor-out.txt`);
  }
  if (!executorRaw) { err("executor", "Failed"); process.exit(1); }

  const buildOutput = parseTransformResponse(executorRaw);
  if (!buildOutput.html) {
    err("executor", "No HTML in output");
    process.exit(1);
  }

  log("executor", `HTML: ${buildOutput.html.length}b, CSS: ${buildOutput.css.length}b, JS: ${buildOutput.js.length}b`);

  // Combine — only inject if executor didn't inline
  let combined = buildOutput.html;
  if (buildOutput.css.length > 50 && !combined.includes('<style id="overkill-styles">')) {
    combined = combined.replace("</head>", `<style id="overkill-styles">\n${buildOutput.css}\n</style>\n</head>`);
  }
  if (buildOutput.js.length > 50 && !combined.includes('<script id="overkill-scripts">')) {
    combined = combined.replace("</body>", `<script id="overkill-scripts">\n${buildOutput.js}\n</script>\n</body>`);
  }

  fs.writeFileSync(`${OUT_DIR}/output.html`, combined, "utf8");
  log("output", `Saved: ${OUT_DIR}/output.html (${combined.length} bytes)`);

  // ── Step 4: Reviewer (structural audit) ───────────────────────────────────
  log("reviewer", "Stage 3: QA check...");

  const fullText = combined;
  const imageCheck = siteMap.images.map(img => {
    const found = fullText.includes(img.src) || fullText.includes(img.src.split("?")[0]);
    return `- [${found ? "PRESENT" : "MISSING"}] ${(img.alt || "(no alt)").slice(0, 40)}: ${img.src.slice(0, 100)}`;
  }).join("\n");

  const linkCheck = siteMap.links.slice(0, 15).map(link => {
    const found = fullText.includes(link.href);
    return `- [${found ? "PRESENT" : "MISSING"}] "${(link.text || "(no text)").slice(0, 40)}": ${link.href}`;
  }).join("\n");

  const featureKeywords: Record<string, string[]> = {
    "custom-cursor": ["ok-cursor", "cursor-active", "cursor: none", "quickTo"],
    "film-grain": ["feTurbulence", "grain", "ok-grain"],
    "scroll-progress": ["scroll-progress", "scrollProgress", "scrollY"],
    "split-text": ["ok-char", "split-text", "stagger", "splitText"],
    "magnetic-buttons": ["ok-magnetic", "magnetic"],
  };

  const featureCheck = FEATURES.map(f => {
    const kws = featureKeywords[f] ?? [f];
    const found = kws.some(kw => fullText.includes(kw));
    return `- [${found ? "PRESENT" : "MISSING"}] ${f}`;
  }).join("\n");

  const reviewerSystem = buildReviewerSystemPrompt();
  const reviewerUser = `## STRUCTURAL AUDIT

### Images
${imageCheck}

### Navigation Links
${linkCheck}

### Features
${featureCheck}

### Output Size
HTML: ${buildOutput.html.length}b, CSS: ${buildOutput.css.length}b, JS: ${buildOutput.js.length}b

### Spec Summary
Site: ${spec.analysis.siteType}
Palette: ${spec.analysis.colorPalette.join(", ")}
Features: ${FEATURES.join(", ")}

Any MISSING image = CRITICAL. Any MISSING feature = MAJOR. Return JSON verdict.`;

  const reviewerRaw = runClaude("haiku", reviewerSystem, reviewerUser, `${OUT_DIR}/reviewer-out.txt`);
  if (reviewerRaw) {
    try {
      const match = reviewerRaw.match(/\{[\s\S]*\}/);
      if (match) {
        const verdict = JSON.parse(match[0]);
        log("reviewer", `Approved: ${verdict.approved}`);
        log("reviewer", `Summary: ${verdict.summary}`);
        for (const issue of verdict.issues ?? []) {
          log("reviewer", `  [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}`);
        }
        fs.writeFileSync(`${OUT_DIR}/reviewer-verdict.json`, JSON.stringify(verdict, null, 2), "utf8");
      }
    } catch { log("reviewer", "Could not parse verdict"); }
  }

  console.log("\n\x1b[32m✓ Pipeline complete!\x1b[0m");
  console.log(`  Output:   ${OUT_DIR}/output.html`);
  console.log(`  Planner:  ${OUT_DIR}/planner-parsed.json`);
  console.log(`  Reviewer: ${OUT_DIR}/reviewer-verdict.json`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
