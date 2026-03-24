import type Anthropic from "@anthropic-ai/sdk";

import { buildCreativeDirectorPrompt } from "./prompts";
import type { CreativeBrief, PipelineInput, SiteMap } from "./types";
import { formatSiteMap } from "./site-mapper";

// ---------------------------------------------------------------------------
// Stage 0: Creative Director — brainstorms brand-specific creative concepts
// Uses Opus for maximum creative thinking
// ---------------------------------------------------------------------------

const MAX_INPUT_HTML = 30_000;

function parseCreativeBrief(raw: string): CreativeBrief {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in creative director output");
  return JSON.parse(match[0]);
}

export async function runCreativeDirector(
  client: Anthropic,
  input: PipelineInput,
  siteMap: SiteMap,
): Promise<CreativeBrief> {
  const truncatedHtml =
    input.html.length > MAX_INPUT_HTML
      ? input.html.slice(0, MAX_INPUT_HTML) +
        "\n<!-- ... truncated ... -->"
      : input.html;

  const siteMapText = formatSiteMap(siteMap);

  const userPrompt =
    `## Website: ${input.url}\n` +
    `## Page Title: ${input.title}\n\n` +
    `## Site Map (real content inventory):\n${siteMapText}\n\n` +
    `## Original HTML (for understanding structure, NOT for copying):\n${truncatedHtml}\n\n` +
    `## Selected premium features: ${input.features.join(", ")}\n` +
    `${input.themeDirection ? `## Client theme direction: ${input.themeDirection}\n` : ""}` +
    `\nBrainstorm creative concepts for this site now. Return the JSON.`;

  const systemPrompt = buildCreativeDirectorPrompt();

  console.log("[creative-director] Brainstorming concepts with Opus...");

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-opus-4-20250514",
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
        throw new Error("Creative Director returned empty response.");
      }

      const brief = parseCreativeBrief(responseText);

      console.log(
        `[creative-director] Brand: ${brief.brandIdentity.archetype}`,
      );
      console.log(
        `[creative-director] Recommended concept: ${brief.recommendedConcept.name}`,
      );
      console.log(
        `[creative-director] Concepts: ${brief.concepts.map((c) => c.name).join(", ")}`,
      );

      return brief;
    } catch (err) {
      console.error(
        `[creative-director] Attempt ${attempt + 1} failed:`,
        err instanceof Error ? err.message : err,
      );
      if (attempt === 1) {
        throw new Error("Creative Director failed after 2 attempts.");
      }
    }
  }

  throw new Error("Creative Director failed unexpectedly.");
}
