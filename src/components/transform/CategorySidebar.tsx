"use client";

import {
  FEATURE_CATEGORIES,
  FEATURES_MAP,
  PRESETS,
  getActivePreset,
  type CategoryId,
  type PresetId,
  type Preset,
} from "@/lib/features";
import { FeatureToggle } from "./FeatureToggle";

interface CategorySidebarProps {
  activeCategory: CategoryId;
  onCategoryChange: (id: CategoryId) => void;
  selectedFeatures: Set<string>;
  onToggleFeature: (id: string) => void;
  onApplyPreset: (preset: Preset) => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
}

export function CategorySidebar({
  activeCategory,
  onCategoryChange,
  selectedFeatures,
  onToggleFeature,
  onApplyPreset,
  videoUrl,
  onVideoUrlChange,
}: CategorySidebarProps) {
  const activePreset = getActivePreset(selectedFeatures);
  const activeGroup = FEATURE_CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div className="w-full lg:w-[320px] flex-shrink-0 space-y-4">
      {/* Presets */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[var(--ok-muted)] mb-2 font-[family-name:var(--font-geist-mono)]">
          Presets
        </p>
        <div className="flex gap-1.5">
          {PRESETS.map((preset) => (
            <PresetButton
              key={preset.id}
              preset={preset}
              isActive={activePreset === preset.id}
              onClick={() => onApplyPreset(preset)}
            />
          ))}
          <div
            className={`
              flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-center
              border transition-all cursor-default select-none
              ${activePreset === "custom"
                ? "border-[var(--ok-gold)]/40 bg-[var(--ok-gold)]/10 text-[var(--ok-gold)]"
                : "border-transparent bg-white/3 text-[var(--ok-muted)]"
              }
            `}
          >
            Custom
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[var(--ok-muted)] mb-2 font-[family-name:var(--font-geist-mono)]">
          Categories
        </p>
        <div className="flex flex-col gap-1">
          {FEATURE_CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory;
            const enabledCount = cat.featureIds.filter((id) =>
              selectedFeatures.has(id)
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm
                  transition-all
                  ${isActive
                    ? "bg-[var(--ok-gold)]/10 border border-[var(--ok-gold)]/25 text-white"
                    : "bg-transparent border border-transparent text-[var(--ok-muted)] hover:bg-white/3 hover:text-white"
                  }
                `}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="flex-1 font-medium">{cat.label}</span>
                <span
                  className={`
                    text-[11px] font-[family-name:var(--font-geist-mono)]
                    ${isActive ? "text-[var(--ok-gold)]" : "text-[var(--ok-muted)]"}
                  `}
                >
                  {enabledCount}/{cat.featureIds.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature toggles for active category */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[var(--ok-muted)] mb-2 font-[family-name:var(--font-geist-mono)]">
          {activeGroup.label}
        </p>
        <div className="space-y-1">
          {activeGroup.featureIds.map((fid) => {
            const feature = FEATURES_MAP.get(fid)!;
            return (
              <div key={fid}>
                <FeatureToggle
                  id={fid}
                  label={feature.name}
                  description={feature.description}
                  icon={feature.icon}
                  enabled={selectedFeatures.has(fid)}
                  onToggle={onToggleFeature}
                />
                {/* YouTube URL input — appears when video-background is toggled ON */}
                {fid === "video-background" && selectedFeatures.has("video-background") && (
                  <div className="ml-8 mt-1.5 mb-2">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => onVideoUrlChange(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className={`
                        w-full px-3 py-2 rounded-lg text-xs
                        border bg-[var(--ok-bg)] text-[var(--ok-text)]
                        placeholder:text-[var(--ok-muted)] outline-none
                        transition-colors font-[family-name:var(--font-geist-mono)]
                        ${videoUrl.trim()
                          ? "border-[var(--ok-gold)]/30 focus:border-[var(--ok-gold)]/50"
                          : "border-red-500/40 focus:border-red-500/60"
                        }
                      `}
                    />
                    {!videoUrl.trim() && (
                      <p className="text-[10px] text-red-400 mt-1">
                        Required — paste your YouTube video URL
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PresetButton({
  preset,
  isActive,
  onClick,
}: {
  preset: Preset;
  isActive: boolean;
  onClick: () => void;
}) {
  const colorMap: Record<PresetId, string> = {
    smooth: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    overkill: "border-[var(--ok-gold)]/40 bg-[var(--ok-gold)]/10 text-[var(--ok-gold)]",
    max: "border-red-500/40 bg-red-500/10 text-red-400",
    custom: "",
  };

  return (
    <button
      onClick={onClick}
      title={preset.description}
      className={`
        flex-1 px-3 py-1.5 rounded-lg text-xs font-medium
        border transition-all
        ${isActive
          ? colorMap[preset.id]
          : "border-transparent bg-white/3 text-[var(--ok-muted)] hover:bg-white/5 hover:text-white"
        }
      `}
    >
      {preset.label}
    </button>
  );
}
