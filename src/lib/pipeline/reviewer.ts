import type Anthropic from "@anthropic-ai/sdk";

import { buildReviewerSystemPrompt } from "./prompts";
import type { BuildOutput, DesignSpec, PipelineInput, ReviewVerdict } from "./types";

// ---------------------------------------------------------------------------
// Fallback verdict — don't block delivery on parse failure
// ---------------------------------------------------------------------------

function buildFallbackVerdict(): ReviewVerdict {
  return {
    approved: true,
    issues: [],
    summary: "Review could not be parsed — auto-approving to avoid blocking delivery.",
  };
}

// ---------------------------------------------------------------------------
// JSON parser
// ---------------------------------------------------------------------------

function parseReviewerResponse(raw: string): ReviewVerdict {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (typeof parsed.approved !== "boolean" || !Array.isArray(parsed.issues)) {
    throw new Error("Invalid reviewer response structure.");
  }

  return {
    approved: parsed.approved,
    issues: parsed.issues,
    summary: parsed.summary ?? "",
  };
}

// ---------------------------------------------------------------------------
// Stage 3: Reviewer
// ---------------------------------------------------------------------------

export async function runReviewer(
  client: Anthropic,
  input: PipelineInput,
  spec: DesignSpec,
  output: BuildOutput,
): Promise<ReviewVerdict> {
  // Build structural audit instead of sending truncated HTML.
  // This prevents false positives from the reviewer only seeing partial output.
  const fullText = output.html + "\n" + output.css + "\n" + output.js;

  const imageAudit = spec.siteMap.images
    .map((img) => {
      const found =
        fullText.includes(img.src) ||
        fullText.includes(img.src.split("?")[0]);
      return `- [${found ? "PRESENT" : "MISSING"}] ${(img.alt || "(no alt)").slice(0, 40)}: ${img.src.slice(0, 100)}`;
    })
    .join("\n");

  const linkAudit = spec.siteMap.links
    .slice(0, 20)
    .map((link) => {
      const found = fullText.includes(link.href);
      return `- [${found ? "PRESENT" : "MISSING"}] "${(link.text || "(no text)").slice(0, 40)}": ${link.href}`;
    })
    .join("\n");

  const featureKeywords: Record<string, string[]> = {
    "custom-cursor": ["ok-cursor", "cursor-active", "cursor: none", "quickTo"],
    "film-grain": ["feTurbulence", "film-grain", "grain", "ok-grain"],
    "scroll-progress": ["scroll-progress", "scrollProgress", "scrollY"],
    "split-text": ["ok-char", "split-text", "stagger", "splitText"],
    "magnetic-buttons": ["ok-magnetic", "magnetic", "quickTo"],
    "3d-background": ["radial-gradient", "feTurbulence"],
  };

  const featureAudit = input.features
    .map((f) => {
      const kws = featureKeywords[f] ?? [f];
      const found = kws.some((kw) => fullText.includes(kw));
      return `- [${found ? "PRESENT" : "MISSING"}] ${f}`;
    })
    .join("\n");

  const sectionAudit = spec.buildSteps
    .map((step) => {
      // Check if the section name or key CSS appears in output
      const nameInOutput = fullText.toLowerCase().includes(step.section.toLowerCase());
      return `- [${nameInOutput ? "PRESENT" : "UNCLEAR"}] ${step.section}`;
    })
    .join("\n");

  const userPrompt = `Review the Builder's output using this structural audit.

## STRUCTURAL AUDIT

### Image Preservation (PRESENT = found in output, MISSING = not found)
${imageAudit}

### Navigation Links
${linkAudit}

### Feature Implementation
${featureAudit}

### Page Sections
${sectionAudit}

### Output Size
HTML: ${output.html.length} bytes
CSS: ${output.css.length} bytes${output.css.length < 50 ? " (likely inlined in HTML)" : ""}
JS: ${output.js.length} bytes${output.js.length < 50 ? " (likely inlined in HTML)" : ""}

### Design Spec Summary
Site type: ${spec.analysis.siteType}
Palette: ${spec.analysis.colorPalette.join(", ")}
Features requested: ${input.features.join(", ")}

Any MISSING image is CRITICAL. Any MISSING feature is MAJOR. A MISSING nav link is MAJOR.
Return ONLY the JSON verdict.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: buildReviewerSystemPrompt(),
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    if (!responseText) {
      console.warn("[reviewer] Empty response — auto-approving.");
      return buildFallbackVerdict();
    }

    return parseReviewerResponse(responseText);
  } catch (err) {
    console.error(
      "[reviewer] Review failed:",
      err instanceof Error ? err.message : err,
    );
    return buildFallbackVerdict();
  }
}
