"use client";

import type { CategoryId, Preset } from "@/lib/features";
import { CategorySidebar } from "./CategorySidebar";
import { FeaturePreview } from "./FeaturePreview";

interface FeatureConfiguratorProps {
  activeCategory: CategoryId;
  onCategoryChange: (id: CategoryId) => void;
  selectedFeatures: Set<string>;
  onToggleFeature: (id: string) => void;
  onApplyPreset: (preset: Preset) => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
}

export function FeatureConfigurator({
  activeCategory,
  onCategoryChange,
  selectedFeatures,
  onToggleFeature,
  onApplyPreset,
  videoUrl,
  onVideoUrlChange,
}: FeatureConfiguratorProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 rounded-full bg-[var(--ok-gold)]/15 border border-[var(--ok-gold)]/30 flex items-center justify-center text-[11px] font-bold text-[var(--ok-gold)] font-[family-name:var(--font-geist-mono)]">
          2
        </div>
        <h2 className="text-sm font-semibold">
          Configure features
          <span className="ml-2 text-[var(--ok-muted)] font-normal">
            Toggle ON/OFF — preview updates live
          </span>
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-4 pl-2">
        <CategorySidebar
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
          selectedFeatures={selectedFeatures}
          onToggleFeature={onToggleFeature}
          onApplyPreset={onApplyPreset}
          videoUrl={videoUrl}
          onVideoUrlChange={onVideoUrlChange}
        />
        <FeaturePreview
          selectedFeatures={selectedFeatures}
          videoUrl={videoUrl}
        />
      </div>
    </section>
  );
}
