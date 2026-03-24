export const FEATURES = [
  {
    id: "custom-cursor",
    name: "Custom Cursor",
    description: "Context-aware cursor with hover labels",
    icon: "🎯",
  },
  {
    id: "3d-background",
    name: "3D Background",
    description: "Particles, gradient noise, or animated waves",
    icon: "🌊",
  },
  {
    id: "film-grain",
    name: "Film Grain",
    description: "Subtle SVG noise overlay for premium texture",
    icon: "🎬",
  },
  {
    id: "magnetic-buttons",
    name: "Magnetic Buttons",
    description: "CTAs that pull toward your cursor",
    icon: "🧲",
  },
  {
    id: "split-text",
    name: "Split-Text Animations",
    description: "Per-character stagger reveals on headings",
    icon: "✨",
  },
  {
    id: "scroll-progress",
    name: "Scroll Progress",
    description: "Gradient progress bar at the top",
    icon: "📊",
  },
  {
    id: "card-tilt",
    name: "Card Tilt Effects",
    description: "Perspective tilt on hover with depth",
    icon: "🃏",
  },
  {
    id: "smooth-scroll",
    name: "Smooth Scroll",
    description: "Lenis smooth scrolling throughout",
    icon: "🧈",
  },
  {
    id: "preloader",
    name: "Preloader Animation",
    description: "Branded loading sequence with counter",
    icon: "⏳",
  },
  {
    id: "parallax",
    name: "Parallax Sections",
    description: "Depth layers that move at different speeds",
    icon: "🏔️",
  },
  {
    id: "focus-rings",
    name: "Animated Focus Rings",
    description: "Beautiful keyboard navigation indicators",
    icon: "💍",
  },
  {
    id: "back-to-top",
    name: "Back to Top",
    description: "Smooth scroll-to-top button",
    icon: "⬆️",
  },
  {
    id: "glass-buttons",
    name: "Glass Buttons",
    description: "Frosted glass CTAs with backdrop blur",
    icon: "🪟",
  },
  {
    id: "video-background",
    name: "Video Background",
    description: "Full-screen looping YouTube video hero",
    icon: "🎥",
  },
  {
    id: "typewriter",
    name: "Typewriter Effect",
    description: "Characters type out one by one with a blinking cursor",
    icon: "⌨️",
  },
  {
    id: "text-scramble",
    name: "Text Scramble",
    description: "Hover text to scramble and unscramble it",
    icon: "🔀",
  },
] as const;

export type FeatureId = (typeof FEATURES)[number]["id"];

// ─── Categories ───

export type CategoryId =
  | "buttons-interactions"
  | "scroll-effects"
  | "text-typography"
  | "visual-effects";

export interface FeatureCategory {
  id: CategoryId;
  label: string;
  icon: string;
  featureIds: FeatureId[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "buttons-interactions",
    label: "Buttons & Interactions",
    icon: "🧲",
    featureIds: ["magnetic-buttons", "custom-cursor", "focus-rings", "glass-buttons"],
  },
  {
    id: "scroll-effects",
    label: "Scroll Effects",
    icon: "📜",
    featureIds: ["smooth-scroll", "scroll-progress", "parallax", "back-to-top"],
  },
  {
    id: "text-typography",
    label: "Text & Typography",
    icon: "✨",
    featureIds: ["split-text", "typewriter", "text-scramble"],
  },
  {
    id: "visual-effects",
    label: "Visual Effects",
    icon: "🎬",
    featureIds: ["3d-background", "film-grain", "card-tilt", "preloader", "video-background"],
  },
];

export const FEATURES_MAP = new Map(
  FEATURES.map((f) => [f.id, f])
);

export const ALL_FEATURE_IDS: FeatureId[] = FEATURES.map((f) => f.id);

// ─── Presets ───

export type PresetId = "smooth" | "overkill" | "max" | "custom";

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  featureIds: FeatureId[];
}

export const PRESETS: Preset[] = [
  {
    id: "smooth",
    label: "Smooth",
    description: "Subtle polish, nothing flashy",
    featureIds: ["smooth-scroll", "focus-rings", "back-to-top", "scroll-progress", "split-text"],
  },
  {
    id: "overkill",
    label: "Overkill",
    description: "The sweet spot — impressive but tasteful",
    featureIds: [
      "magnetic-buttons",
      "focus-rings",
      "smooth-scroll",
      "scroll-progress",
      "parallax",
      "back-to-top",
      "split-text",
      "typewriter",
      "text-scramble",
      "3d-background",
      "card-tilt",
      "glass-buttons",
    ],
  },
  {
    id: "max",
    label: "MAX",
    description: "Everything. No restraint.",
    featureIds: [...ALL_FEATURE_IDS],
  },
];

/** Determine which preset matches the current selection, or "custom" */
export function getActivePreset(selected: Set<string>): PresetId {
  for (const preset of PRESETS) {
    if (
      preset.featureIds.length === selected.size &&
      preset.featureIds.every((id) => selected.has(id))
    ) {
      return preset.id;
    }
  }
  return "custom";
}
