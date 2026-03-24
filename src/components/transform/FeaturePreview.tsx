"use client";

import { UnifiedPreview } from "./UnifiedPreview";

interface FeaturePreviewProps {
  selectedFeatures: Set<string>;
  videoUrl: string;
}

export function FeaturePreview({ selectedFeatures, videoUrl }: FeaturePreviewProps) {
  return (
    <div className="flex-1 rounded-2xl border border-[var(--ok-border)] bg-[var(--ok-bg-card)] overflow-hidden" style={{ aspectRatio: "16 / 11" }}>
      <UnifiedPreview features={selectedFeatures} videoUrl={videoUrl} />
    </div>
  );
}
