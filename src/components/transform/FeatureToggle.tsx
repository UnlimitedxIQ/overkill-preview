"use client";

interface FeatureToggleProps {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  onToggle: (id: string) => void;
}

export function FeatureToggle({
  id,
  label,
  description,
  icon,
  enabled,
  onToggle,
}: FeatureToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onToggle(id)}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
        ${enabled
          ? "bg-[var(--ok-gold)]/8 border border-[var(--ok-gold)]/25"
          : "bg-transparent border border-transparent hover:bg-white/3"
        }
      `}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-[11px] text-[var(--ok-muted)] truncate">{description}</p>
      </div>
      {/* Toggle pill */}
      <div
        className={`
          relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200
          ${enabled ? "bg-[var(--ok-gold)]" : "bg-white/10"}
        `}
      >
        <div
          className={`
            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${enabled ? "translate-x-[18px]" : "translate-x-0.5"}
          `}
        />
      </div>
    </button>
  );
}
