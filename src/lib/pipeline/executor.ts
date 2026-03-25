import type Anthropic from "@anthropic-ai/sdk";
import * as fs from "node:fs";

import { parseTransformResponse } from "@/lib/transform";

import { buildExecutorSystemPrompt, buildRevisionSystemPrompt } from "./prompts";
import { formatSiteMap } from "./site-mapper";
import type { BuildOutput, DesignSpec, PipelineInput, ReviewVerdict } from "./types";

// ---------------------------------------------------------------------------
// Format structured build steps into readable spec (Targo/Bloom style)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Stage 2: Executor — Build complete transformed page
// ---------------------------------------------------------------------------

export async function runExecutor(
  client: Anthropic,
  input: PipelineInput,
  spec: DesignSpec,
): Promise<BuildOutput> {
  const siteMapText = formatSiteMap(spec.siteMap);
  const buildSpec = formatBuildSpec(spec);

  const textPrompt = `Build the transformed website following this design specification EXACTLY.

${spec.mockupImagePath ? "## DESIGN MOCKUP\nThe attached image shows the TARGET LAYOUT — section order, grid structure, spacing proportions, and visual hierarchy. The buildSteps below provide EXACT CSS values, animation timings, and color codes. Use the mockup for layout, buildSteps for precision. When they conflict, buildSteps take priority." : ""}

${buildSpec}

${siteMapText}

## Original HTML (for text content only — use SITE MAP for links/images):
${input.html.length > 15_000 ? input.html.slice(0, 15_000) + "\n<!-- ... truncated ... -->" : input.html}

## Selected Features: ${input.features.join(", ")}

Build the complete transformed page. Preserve ALL image URLs and link hrefs from the site map. Return ONLY the three marked sections.`;

  // Build content blocks — include mockup image if available
  const contentBlocks: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  if (spec.mockupImagePath && fs.existsSync(spec.mockupImagePath)) {
    const imageData = fs.readFileSync(spec.mockupImagePath);
    const base64 = imageData.toString("base64");
    const ext = spec.mockupImagePath.toLowerCase().endsWith(".jpg") || spec.mockupImagePath.toLowerCase().endsWith(".jpeg")
      ? "image/jpeg" as const
      : "image/png" as const;
    contentBlocks.push({
      type: "image",
      source: { type: "base64", media_type: ext, data: base64 },
    });
    console.log(`[executor] Including mockup image (${(imageData.length / 1024 / 1024).toFixed(1)}MB)`);
  }

  contentBlocks.push({ type: "text", text: textPrompt });

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 32_000,
    system: buildExecutorSystemPrompt(),
    messages: [{ role: "user", content: contentBlocks }],
  });

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!responseText) {
    throw new Error("Executor returned an empty response.");
  }

  return parseTransformResponse(responseText);
}

// ---------------------------------------------------------------------------
// Executor Revision — Fix issues from reviewer
// ---------------------------------------------------------------------------

export async function runExecutorRevision(
  client: Anthropic,
  input: PipelineInput,
  spec: DesignSpec,
  current: BuildOutput,
  verdict: ReviewVerdict,
): Promise<BuildOutput> {
  const issueList = verdict.issues
    .filter((i) => i.severity === "critical" || i.severity === "major")
    .map(
      (i, idx) =>
        `${idx + 1}. [${i.severity.toUpperCase()}] (${i.category}) ${i.description}\n   Fix: ${i.suggestion}`,
    )
    .join("\n");

  const userPrompt = `The QA Reviewer found these issues in your build. Fix ONLY these issues and return the complete corrected output.

## Issues to Fix
${issueList}

## Reviewer Summary
${verdict.summary}

## Design Specification (for reference)
${formatBuildSpec(spec)}

${formatSiteMap(spec.siteMap)}

## Current HTML Output:
${current.html}

## Current CSS Output:
${current.css}

## Current JS Output:
${current.js}

Fix all listed issues. Return the COMPLETE corrected output with all three marked sections.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 32_000,
    system: buildRevisionSystemPrompt(),
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!responseText) {
    throw new Error("Executor revision returned an empty response.");
  }

  return parseTransformResponse(responseText);
}
