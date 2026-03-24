import type Anthropic from "@anthropic-ai/sdk";

import { buildPlannerSystemPrompt } from "./prompts";
import { mapSite } from "./site-mapper";
import type { BuildStep, DesignSpec, FeatureSpec, PipelineInput, SiteAnalysis, SiteMap } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HTML_LENGTH = 60_000;
const MAX_CSS_LENGTH = 30_000;

// ---------------------------------------------------------------------------
// Fallback spec when planner fails
// ---------------------------------------------------------------------------

function buildFallbackSpec(input: PipelineInput, siteMap: SiteMap): DesignSpec {
  const fallbackSteps: BuildStep[] = [
    {
      section: "Glass Nav",
      layout: "Fixed nav with logo left, links center, cart right",
      css: "position: fixed; width: 100%; z-index: 1000; background: rgba(26,26,46,0.85); backdrop-filter: blur(16px); padding: 16px 32px;",
      animation: "ScrollTrigger: shrink padding to 10px on scroll > 60px",
    },
    {
      section: "Hero",
      layout: "Full-viewport hero with background image from site map, heading + CTA",
      css: "min-height: 100vh; position: relative; background: center/cover;",
      animation: "Split-text heading, parallax background on scroll",
    },
    {
      section: "Content Grid",
      layout: "Collection/product grid, 2-3 columns on desktop",
      css: "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; padding: 80px 32px;",
      animation: "ScrollTrigger reveal: opacity 0.3→1, translateY 40→0, stagger 0.08s",
    },
    {
      section: "Footer",
      layout: "Dark footer with newsletter, social links, copyright",
      css: "background: #1a1a2e; color: rgba(255,255,255,0.7); padding: 80px 32px 32px;",
      animation: "Parallax reveal translateY 60→0 on ScrollTrigger",
    },
  ];

  const fallbackFeatures: FeatureSpec[] = input.features.map((f) => ({
    id: f,
    implementation: `Implement ${f} with brand accent #e94560 following the effect-patterns code.`,
    placement: `Apply site-wide with appropriate z-index layering.`,
  }));

  return {
    analysis: {
      siteType: "unknown",
      colorPalette: ["#1a1a2e", "#16213e", "#0f3460", "#e94560"],
      typography: ["system-ui", "sans-serif"],
      layoutStructure: "Glass Nav -> Hero -> Content Grid -> Footer",
      brandPersonality: "modern",
    },
    siteMap,
    buildSteps: fallbackSteps,
    features: fallbackFeatures,
  };
}

// ---------------------------------------------------------------------------
// JSON parser with retry
// ---------------------------------------------------------------------------

function parsePlannerResponse(raw: string): {
  analysis: SiteAnalysis;
  buildSteps: BuildStep[];
  features: FeatureSpec[];
} {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in planner output");

  const parsed = JSON.parse(match[0]);

  // Validate required arrays exist
  if (!Array.isArray(parsed.buildSteps)) {
    throw new Error("Planner response missing buildSteps array");
  }
  if (!Array.isArray(parsed.features)) {
    throw new Error("Planner response missing features array");
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Stage 1: Planner (also builds site map)
// ---------------------------------------------------------------------------

export async function runPlanner(
  client: Anthropic,
  input: PipelineInput,
): Promise<DesignSpec> {
  // Build site map from HTML (this is deterministic, no AI needed)
  const siteMap = mapSite(input.html, input.url);
  console.log(
    `[planner] Site map: ${siteMap.links.length} links, ` +
      `${siteMap.images.length} images, ${siteMap.sections.length} sections`,
  );

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

  const userPrompt = `Analyze this website and produce a detailed design specification for transformation.

## Original URL: ${input.url}
## Page Title: ${input.title}

## Original HTML:
${truncatedHtml}

## Original CSS:
${truncatedCss || "(No external CSS extracted — styles may be inline in the HTML)"}

## Selected Features: ${input.features.join(", ")}

Analyze the site and return the JSON design specification now.`;

  const systemPrompt = buildPlannerSystemPrompt(
    input.features,
    input.themeDirection,
  );

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const responseText = message.content
        .filter(
          (block): block is Anthropic.TextBlock => block.type === "text",
        )
        .map((block) => block.text)
        .join("");

      if (!responseText) {
        throw new Error("Planner returned an empty response.");
      }

      const parsed = parsePlannerResponse(responseText);

      return {
        analysis: parsed.analysis,
        siteMap,
        buildSteps: parsed.buildSteps,
        features: parsed.features,
      };
    } catch (err) {
      console.error(
        `[planner] Attempt ${attempt + 1} failed:`,
        err instanceof Error ? err.message : err,
      );

      if (attempt === 1) {
        console.warn("[planner] Both attempts failed — using fallback spec.");
        return buildFallbackSpec(input, siteMap);
      }
    }
  }

  return buildFallbackSpec(input, siteMap);
}
