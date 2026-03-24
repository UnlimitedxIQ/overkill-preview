"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_FEATURE_IDS, type CategoryId, type Preset } from "@/lib/features";
import { PageSelectionStep } from "@/components/transform/PageSelectionStep";
import { FeatureConfigurator } from "@/components/transform/FeatureConfigurator";
import { CheckoutBar } from "@/components/transform/CheckoutBar";

interface ScrapedPage {
  url: string;
  title: string;
  path: string;
}

interface ScrapeResult {
  pages: ScrapedPage[];
  sourceUrl: string;
}

export default function TransformPage() {
  const router = useRouter();
  const [scrapeData, setScrapeData] = useState<ScrapeResult | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(ALL_FEATURE_IDS)
  );
  const [activeCategory, setActiveCategory] = useState<CategoryId>("buttons-interactions");
  const [pageSelectionCollapsed, setPageSelectionCollapsed] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [themeDirection, setThemeDirection] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load scrape data from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("overkill_scrape");
    const sourceUrl = sessionStorage.getItem("overkill_url");
    if (!raw || !sourceUrl) {
      router.push("/");
      return;
    }
    const data = JSON.parse(raw);
    setScrapeData({ ...data, sourceUrl });
    if (data.pages?.length > 0) {
      setSelectedPages(new Set([data.pages[0].url]));
    }
  }, [router]);

  const togglePage = (url: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const applyPreset = (preset: Preset) => {
    setSelectedFeatures(new Set(preset.featureIds));
  };

  const totalPrice = selectedPages.size * 1.99;

  const handleCheckout = async () => {
    if (selectedPages.size === 0) {
      setError("Select at least one page");
      return;
    }
    if (selectedFeatures.has("video-background") && !videoUrl.trim()) {
      setError("Video Background requires a YouTube URL");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email for the download link");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: Array.from(selectedPages),
          features: Array.from(selectedFeatures),
          videoUrl: selectedFeatures.has("video-background") ? videoUrl.trim() : undefined,
          themeDirection: themeDirection.trim() || undefined,
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout failed");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFreePreview = async () => {
    if (selectedPages.size === 0) {
      setError("Select at least one page");
      return;
    }
    if (selectedFeatures.has("video-background") && !videoUrl.trim()) {
      setError("Video Background requires a YouTube URL");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/transform-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: Array.from(selectedPages),
          features: Array.from(selectedFeatures),
          videoUrl: selectedFeatures.has("video-background") ? videoUrl.trim() : undefined,
          themeDirection: themeDirection.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Preview failed");
      }

      const { jobId } = await res.json();
      router.push(`/transform/status?session_id=${jobId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Preview failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!scrapeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--ok-gold)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen py-10 px-6">
      {/* Fixed video background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover"
          src="/transform-bg.mp4"
        />
        {/* Dark overlay so content stays readable */}
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/[0.06]">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[var(--ok-muted)] hover:text-[var(--ok-gold)] transition-colors mb-4 flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold">
            <span className="text-[var(--ok-gold)]">Overkill</span> your site
          </h1>
          <p className="text-[var(--ok-muted)] mt-1 font-[family-name:var(--font-geist-mono)] text-sm">
            {scrapeData.sourceUrl}
          </p>
        </div>

        {/* Step 1: Page Selection */}
        <PageSelectionStep
          pages={scrapeData.pages}
          selectedPages={selectedPages}
          onTogglePage={togglePage}
          collapsed={pageSelectionCollapsed}
          onToggleCollapse={() => setPageSelectionCollapsed((c) => !c)}
        />

        {/* Step 2: Feature Configurator */}
        <FeatureConfigurator
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          selectedFeatures={selectedFeatures}
          onToggleFeature={toggleFeature}
          onApplyPreset={applyPreset}
          videoUrl={videoUrl}
          onVideoUrlChange={setVideoUrl}
        />

        {/* Step 3: Theme Direction */}
        <section className="mb-8 pl-9">
          <div className="flex items-center gap-3 mb-3 -ml-9">
            <div className="w-6 h-6 rounded-full bg-[var(--ok-gold)]/15 border border-[var(--ok-gold)]/30 flex items-center justify-center text-[11px] font-bold text-[var(--ok-gold)] font-[family-name:var(--font-geist-mono)]">
              3
            </div>
            <h2 className="text-sm font-semibold">
              Theme direction
              <span className="ml-2 text-[var(--ok-muted)] font-normal">optional</span>
            </h2>
          </div>
          <input
            type="text"
            value={themeDirection}
            onChange={(e) => setThemeDirection(e.target.value)}
            placeholder="dark + gold, minimal, surprise me..."
            className="w-full p-3 rounded-lg border border-[var(--ok-border)] bg-[var(--ok-bg-card)] text-[var(--ok-text)] placeholder:text-[var(--ok-muted)] outline-none focus:border-[var(--ok-gold)]/40 transition-colors text-sm"
          />
        </section>

        {/* Sticky Checkout Bar */}
        <CheckoutBar
          email={email}
          onEmailChange={setEmail}
          totalPrice={totalPrice}
          pageCount={selectedPages.size}
          loading={loading}
          disabled={selectedPages.size === 0}
          error={error}
          onFreePreview={handleFreePreview}
          onCheckout={handleCheckout}
        />
      </div>
    </main>
  );
}
