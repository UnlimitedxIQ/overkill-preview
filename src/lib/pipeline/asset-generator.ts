import { generateImage, generateVideo } from "./higgsfield";
import type { HiggsFieldResult } from "./higgsfield";
import { buildPreloader } from "./templates/preloader-svg";
import type { CreativeBrief, SiteMap } from "./types";

// ---------------------------------------------------------------------------
// Asset Generator — creates visual assets before the executor runs
// ---------------------------------------------------------------------------

export interface GeneratedAssets {
  heroVideo?: { filePath: string; cdnUrl?: string };
  sparkTexture?: { filePath: string; cdnUrl?: string };
  preloader: { html: string; css: string; js: string };
}

interface AssetGeneratorInput {
  creativeBrief: CreativeBrief;
  siteMap: SiteMap;
  brandName: string;
  outputDir: string;
  skipVideo?: boolean; // Skip video gen (for fast testing)
  skipTexture?: boolean; // Skip texture gen
  heroVideoUrl?: string; // Use existing URL instead of generating
}

// ---------------------------------------------------------------------------
// Prompt builders — craft HiggsField prompts from the creative brief
// ---------------------------------------------------------------------------

function buildHeroVideoPrompt(brief: CreativeBrief): string {
  const archetype = brief.brandIdentity.archetype.toLowerCase();
  const personality = brief.brandIdentity.personality;

  if (archetype.includes("bold") || archetype.includes("industrial")) {
    return (
      `Cinematic close-up of industrial metalwork, welding sparks flying in slow motion, ` +
      `dark moody workshop atmosphere, ${brief.palette.accent} orange accent lighting from welding torch, ` +
      `shallow depth of field, smoke wisps, no text no UI no people, ` +
      `raw industrial beauty, 4K film quality, anamorphic lens flare`
    );
  }

  if (archetype.includes("elegant") || archetype.includes("luxury")) {
    return (
      `Slow cinematic dolly shot through luxury showroom, ` +
      `golden hour lighting, reflective surfaces, marble and glass, ` +
      `${brief.palette.accent} accent highlights, bokeh background, ` +
      `no text no UI no people, film grain, editorial fashion film quality`
    );
  }

  if (archetype.includes("modern") || archetype.includes("saas")) {
    return (
      `Abstract flowing data visualization, glowing ${brief.palette.accent} particles ` +
      `moving through dark space, network connections, subtle grid lines, ` +
      `futuristic technology atmosphere, clean and minimal, ` +
      `no text no UI, 4K motion graphics quality`
    );
  }

  // Default / Creative
  return (
    `Cinematic abstract motion, flowing light trails in ${brief.palette.accent} color, ` +
    `dark background, depth of field, slow motion, ` +
    `creative artistic atmosphere, no text no UI, film quality`
  );
}

function buildSparkTexturePrompt(brief: CreativeBrief): string {
  const archetype = brief.brandIdentity.archetype.toLowerCase();

  if (archetype.includes("bold") || archetype.includes("industrial")) {
    return (
      `Isolated welding sparks and hot metal particles on pure black background, ` +
      `orange and white hot sparks, high contrast, scattered particles, ` +
      `no background elements, sparks only, perfect for texture overlay, 4K`
    );
  }

  if (archetype.includes("elegant") || archetype.includes("luxury")) {
    return (
      `Isolated gold dust particles floating on pure black background, ` +
      `glitter and shimmer, bokeh light dots, subtle and elegant, ` +
      `no background, particles only, perfect for texture overlay, 4K`
    );
  }

  // Default
  return (
    `Isolated light particles on pure black background, ` +
    `glowing ${brief.palette.accent} color particles, scattered, ` +
    `no background, particles only, texture overlay, 4K`
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateAssets(
  input: AssetGeneratorInput,
): Promise<GeneratedAssets> {
  const { creativeBrief, brandName, outputDir } = input;

  console.log("[assets] Starting asset generation...");

  // 1. Build preloader (always — deterministic, instant)
  const preloader = buildPreloader({
    brandName,
    accentColor: creativeBrief.palette.accent,
    baseColor: creativeBrief.palette.base,
    displayFont: creativeBrief.typography.display,
  });
  console.log("[assets] Preloader SVG built (tachometer or text-draw)");

  const assets: GeneratedAssets = { preloader };

  // 2. Generate hero video (optional — takes 1-3 minutes)
  if (input.heroVideoUrl) {
    // Use provided URL (e.g., from YouTube or existing asset)
    assets.heroVideo = { filePath: "", cdnUrl: input.heroVideoUrl };
    console.log(`[assets] Using provided hero video: ${input.heroVideoUrl}`);
  } else if (!input.skipVideo) {
    const videoPrompt = buildHeroVideoPrompt(creativeBrief);
    console.log(`[assets] Generating hero video: "${videoPrompt.slice(0, 80)}..."`);

    const videoResult = await generateVideo({
      prompt: videoPrompt,
      model: "Kling 3.0",
      duration: "5s",
      aspectRatio: "16:9",
      outputDir,
    });

    if (videoResult.success) {
      assets.heroVideo = {
        filePath: videoResult.filePath ?? "",
        cdnUrl: videoResult.cdnUrl,
      };
      console.log(`[assets] Hero video generated: ${videoResult.filePath}`);
    } else {
      console.warn(`[assets] Hero video generation failed: ${videoResult.error}`);
      console.warn("[assets] Executor will fall back to static hero image");
    }
  } else {
    console.log("[assets] Skipping hero video (skipVideo=true)");
  }

  // 3. Generate spark texture (optional — takes ~30s)
  if (!input.skipTexture) {
    const texturePrompt = buildSparkTexturePrompt(creativeBrief);
    console.log(`[assets] Generating spark texture: "${texturePrompt.slice(0, 80)}..."`);

    const textureResult = await generateImage({
      prompt: texturePrompt,
      model: "seedream",
      aspectRatio: "1:1",
      resolution: "2K",
      outputDir,
    });

    if (textureResult.success) {
      assets.sparkTexture = {
        filePath: textureResult.filePath ?? "",
        cdnUrl: textureResult.cdnUrl,
      };
      console.log(`[assets] Spark texture generated: ${textureResult.filePath}`);
    } else {
      console.warn(`[assets] Spark texture failed: ${textureResult.error}`);
    }
  } else {
    console.log("[assets] Skipping spark texture (skipTexture=true)");
  }

  return assets;
}
