"use client";

import { FEATURES } from "@/lib/features";

export function FeatureGrid({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="feature-grid">
      {FEATURES.map((feature) => (
        <label
          key={feature.id}
          className={`
            flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
            ${
              selected.has(feature.id)
                ? "border-[var(--ok-gold)]/40 bg-[var(--ok-gold)]/5"
                : "border-[var(--ok-border)] bg-[var(--ok-bg-card)] hover:border-[var(--ok-gold)]/20"
            }
          `}
        >
          <input
            type="checkbox"
            className="feature-check mt-0.5"
            checked={selected.has(feature.id)}
            onChange={() => onToggle(feature.id)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{feature.icon}</span>
              <span className="font-medium text-sm text-[var(--ok-text)]">
                {feature.name}
              </span>
            </div>
            <p className="text-xs text-[var(--ok-muted)] mt-0.5 leading-relaxed">
              {feature.description}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}
