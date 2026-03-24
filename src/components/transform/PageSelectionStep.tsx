"use client";

interface ScrapedPage {
  url: string;
  title: string;
  path: string;
}

interface PageSelectionStepProps {
  pages: ScrapedPage[];
  selectedPages: Set<string>;
  onTogglePage: (url: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function PageSelectionStep({
  pages,
  selectedPages,
  onTogglePage,
  collapsed,
  onToggleCollapse,
}: PageSelectionStepProps) {
  return (
    <section className="mb-8">
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[var(--ok-gold)]/15 border border-[var(--ok-gold)]/30 flex items-center justify-center text-[11px] font-bold text-[var(--ok-gold)] font-[family-name:var(--font-geist-mono)]">
            1
          </div>
          <h2 className="text-sm font-semibold">
            Pages to transform
            <span className="ml-2 text-[var(--ok-muted)] font-normal">
              {selectedPages.size} of {pages.length} selected
            </span>
          </h2>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-[var(--ok-muted)] transition-transform ${collapsed ? "" : "rotate-180"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="space-y-1.5 pl-9">
          {pages.map((page) => (
            <label
              key={page.url}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm
                ${selectedPages.has(page.url)
                  ? "border-[var(--ok-gold)]/30 bg-[var(--ok-gold)]/5"
                  : "border-[var(--ok-border)] bg-transparent hover:border-[var(--ok-gold)]/15"
                }
              `}
            >
              <input
                type="checkbox"
                className="feature-check"
                checked={selectedPages.has(page.url)}
                onChange={() => onTogglePage(page.url)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{page.title || page.path}</p>
                <p className="text-[11px] text-[var(--ok-muted)] font-[family-name:var(--font-geist-mono)] truncate">
                  {page.path}
                </p>
              </div>
              <span className="text-xs font-[family-name:var(--font-geist-mono)] text-[var(--ok-gold)]">
                $1.99
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
