export const VIBES = [
  "Dark & Cinematic",
  "Minimal & Clean",
  "Bold & Playful",
  "Luxury & Elegant",
  "Retro & Nostalgic",
  "Organic & Natural",
] as const;

export type Vibe = (typeof VIBES)[number];

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", queued: "Queued", planning: "Planning",
  building: "Building", testing: "Testing", polishing: "Polishing",
  deploying: "Deploying", live: "Live", expired: "Expired", failed: "Failed",
};

export const STATUS_MESSAGES: Record<string, string> = {
  draft: "Processing payment...",
  queued: "In the queue...",
  planning: "Designing your site's architecture...",
  building: "Writing code...",
  testing: "Running tests...",
  polishing: "Adding the finishing touches...",
  deploying: "Deploying to the web...",
  live: "Your site is live!",
  failed: "Generation failed",
};

export const PRICE_AMOUNT = 199;
export const PRICE_DISPLAY = "$1.99";
export const SITE_TTL_DAYS = 3;
export const MAX_CONCURRENT_SITES = 3;
export const MAX_SECTIONS = 8;
