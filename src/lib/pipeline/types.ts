// ---------------------------------------------------------------------------
// Shared types for the multi-agent site transformation pipeline
// ---------------------------------------------------------------------------

export interface PipelineInput {
  html: string;
  css: string;
  url: string;
  title: string;
  features: string[];
  themeDirection?: string;
  heroVideoUrl?: string;
  mockupImagePath?: string;
}

export interface SiteAnalysis {
  siteType: string;
  colorPalette: string[];
  typography: string[];
  layoutStructure: string;
  brandPersonality: string;
}

export interface SiteMap {
  links: { text: string; href: string; location: string }[];
  images: { src: string; alt: string; location: string }[];
  sections: { tag: string; id: string; classes: string; summary: string }[];
}

export interface BuildStep {
  section: string;
  layout: string;
  css: string;
  animation: string;
  elements?: { name: string; details: string }[];
  notes?: string;
  videoQuery?: string;
}

export interface VideoAsset {
  localPath: string;
  filename: string;
  durationSec: number;
  source: "youtube-search" | "user-provided";
  youtubeId: string;
  youtubeTitle: string;
}

export interface FeatureSpec {
  id: string;
  implementation: string;
  placement: string;
}

export interface DesignSpec {
  analysis: SiteAnalysis;
  siteMap: SiteMap;
  buildSteps: BuildStep[];
  features: FeatureSpec[];
  videoAsset?: VideoAsset;
  mockupImagePath?: string;
}

export interface BuildOutput {
  html: string;
  css: string;
  js: string;
}

export interface ReviewIssue {
  severity: "critical" | "major" | "minor";
  category:
    | "palette"
    | "typography"
    | "layout"
    | "feature"
    | "html-validity"
    | "content"
    | "accessibility"
    | "broken-ref";
  description: string;
  suggestion: string;
}

export interface ReviewVerdict {
  approved: boolean;
  issues: ReviewIssue[];
  summary: string;
}

export type PipelineStage =
  | "planning"
  | "building"
  | "reviewing"
  | "revising"
  | "packaging";

export interface PipelineCallbacks {
  onStageChange: (stage: PipelineStage, message: string) => void;
  onProgress: (percent: number) => void;
}

export interface PipelineResult {
  output: BuildOutput;
  spec: DesignSpec;
  reviewHistory: ReviewVerdict[];
  revisionCount: number;
  videoAsset?: VideoAsset;
}
