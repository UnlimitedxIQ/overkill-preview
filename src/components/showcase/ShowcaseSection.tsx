"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLenis } from "../LenisProvider";
import { TypewriterText } from "./TypewriterText";
import { NexusSite } from "./sites/NexusSite";
import { AuraSite } from "./sites/AuraSite";
import { PrismSite } from "./sites/PrismSite";
import { DriftSite } from "./sites/DriftSite";
import { BasicNexus } from "./sites/basic/BasicNexus";
import { BasicAura } from "./sites/basic/BasicAura";
import { BasicPrism } from "./sites/basic/BasicPrism";
import { BasicDrift } from "./sites/basic/BasicDrift";

const SITES = [
  { Polished: NexusSite, Basic: BasicNexus, label: "Nexus", accent: "#22d3ee" },
  { Polished: AuraSite, Basic: BasicAura, label: "Aura", accent: "#C9A84C" },
  { Polished: PrismSite, Basic: BasicPrism, label: "Prism", accent: "#c084fc" },
  { Polished: DriftSite, Basic: BasicDrift, label: "Drift", accent: "#ff2d7b" },
];

/**
 * Phase machine:
 *   "preloading" → 0 → 1 → 2 → 3 → 4 → 5
 *
 *   preloading: Black overlay + centered logo + gold bar
 *   0: Grid visible, typewriter types question
 *   1: Full-page L→R sweep reveals polished sites (3s)
 *   2: Typewriter deletes → types "It's time for an upgrade."
 *   3: Top-left site zooms to fill screen, then swaps to carousel
 *   4: Carousel loops forever + auto-scrolls to checkout after first pass
 */
type Phase = "preloading" | 0 | 1 | 2 | 3 | 4;

function useViewport() {
  const [size, setSize] = useState({ w: 1920, h: 1080 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function ScaledSite({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 1920);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ paddingBottom: `${(1080 / 1920) * 100}%` }}>
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: "1920px", height: "1080px", transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}

interface ShowcaseSectionProps {
  checkoutRef: React.RefObject<HTMLDivElement | null>;
  onPreloaderDone?: () => void;
}

export function ShowcaseSection({ checkoutRef, onPreloaderDone }: ShowcaseSectionProps) {
  const [phase, setPhase] = useState<Phase>("preloading");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [sweepProgress, setSweepProgress] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(1);
  const [gridScale, setGridScale] = useState(1);
  const [carouselVisible, setCarouselVisible] = useState(false);
  const carouselCountRef = useRef(0);
  const lenis = useLenis();
  const viewport = useViewport();

  // ── Scroll to top on mount ──
  useEffect(() => {
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true });
  }, [lenis]);

  // ── Preloader: gold bar finishes → fade overlay, slide logo ──
  const handleBarAnimationEnd = useCallback(() => {
    setOverlayOpacity(0);
    setTimeout(() => {
      setPhase(0);
      onPreloaderDone?.();
    }, 850);
  }, [onPreloaderDone]);

  // ── Phase 0 complete: typewriter done ──
  const handlePhase0Complete = useCallback(() => {
    setTimeout(() => setPhase(1), 1200);
  }, []);

  // ── Phase 2 complete: typewriter done ──
  const handlePhase2Complete = useCallback(() => {
    setTimeout(() => setPhase(3), 2500);
  }, []);

  // ── Phase 1: Animate sweep progress via rAF ──
  useEffect(() => {
    if (phase !== 1) return;
    const duration = 3000;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setSweepProgress(eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase(2);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // ── Phase 3: Zoom top-left cell to fill screen, then swap to carousel ──
  useEffect(() => {
    if (phase !== 3) return;
    // Start zoom — top-left (Nexus) expands to fill viewport
    requestAnimationFrame(() => {
      setGridScale(2);
    });
    // After zoom completes, place carousel behind grid, then fade grid out
    const timer = setTimeout(() => {
      setCarouselVisible(true);
      setCarouselIndex(0);
      // Double-rAF ensures carousel has rendered before we fade the grid
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGridOpacity(0);
        });
      });
      setTimeout(() => setPhase(4), 800);
    }, 1300);
    return () => clearTimeout(timer);
  }, [phase]);

  // ── Phase 4: Carousel loops forever + auto-scroll after first pass ──
  useEffect(() => {
    if (phase !== 4) return;
    let scrolled = false;

    const interval = setInterval(() => {
      setCarouselIndex((prev) => {
        const next = (prev + 1) % SITES.length;
        // After cycling through all 4 once, auto-scroll to checkout
        if (next === 0 && !scrolled) {
          scrolled = true;
          setTimeout(() => {
            if (lenis && checkoutRef.current) {
              lenis.scrollTo(checkoutRef.current, { duration: 1.5 });
            } else if (checkoutRef.current) {
              checkoutRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }, 500);
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [phase, lenis, checkoutRef]);

  const isPreloading = phase === "preloading";
  const numericPhase = typeof phase === "number" ? phase : -1;
  const isGridPhase = numericPhase >= 0 && numericPhase <= 2;
  const sweepDone = numericPhase >= 1 && sweepProgress > 0.99;

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050505]">
      {/* Ambient gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(201,168,76,0.08) 0%, transparent 60%)",
        }}
      />

      {/* ── Grid — always renders so sites preload behind overlay ── */}
      <div
        className="absolute inset-0 z-10"
        style={{
          opacity: gridOpacity,
          transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Basic sites grid — underneath */}
        <div
          className="absolute inset-0 grid grid-cols-2 grid-rows-2"
          style={{
            opacity: sweepDone ? 0 : 1,
            transition: "opacity 0.3s",
          }}
        >
          {SITES.map((site) => (
            <div key={site.label} className="relative overflow-hidden">
              <ScaledSite>
                <site.Basic />
              </ScaledSite>
            </div>
          ))}
        </div>

        {/* Polished sites grid — single clipPath sweep over entire grid */}
        <div
          className="absolute inset-0 grid grid-cols-2 grid-rows-2"
          style={{
            clipPath:
              numericPhase >= 1
                ? `inset(0 ${100 - sweepProgress * 100}% 0 0)`
                : "inset(0 100% 0 0)",
            transform: `scale(${gridScale})`,
            transformOrigin: "top left",
            transition: numericPhase >= 3 ? "transform 1.3s cubic-bezier(0.25, 0.1, 0.25, 1)" : "none",
          }}
        >
          {SITES.map((site) => (
            <div key={site.label} className="relative overflow-hidden">
              <ScaledSite>
                <site.Polished />
              </ScaledSite>
            </div>
          ))}
        </div>

        {/* Overlay typewriter text — only during grid phases */}
        {isGridPhase && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <p
              className="text-xl sm:text-3xl md:text-4xl text-white leading-tight text-center whitespace-nowrap px-6"
              style={{
                fontFamily: "var(--font-syne), system-ui, sans-serif",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                textShadow: "0 2px 40px rgba(0,0,0,0.9), 0 0 120px rgba(0,0,0,0.6)",
              }}
            >
              {numericPhase === 0 && (
                <TypewriterText
                  text="Does your website look boring like this?"
                  speed={45}
                  onComplete={handlePhase0Complete}
                />
              )}
              {numericPhase >= 1 && numericPhase <= 2 && (
                <TypewriterText
                  key="phase2"
                  text="It's time for an upgrade."
                  initialText="Does your website look boring like this?"
                  speed={40}
                  onComplete={handlePhase2Complete}
                />
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Preloader overlay — black mask on top of grid ── */}
      <div
        className="absolute inset-0 z-30 bg-[#050505] flex flex-col items-center justify-center"
        style={{
          opacity: overlayOpacity,
          transition: "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: isPreloading ? "auto" : "none",
        }}
      >
        <Image
          src="/overkill-logo.png"
          alt="OVERKILL"
          width={600}
          height={185}
          priority
          style={{
            width: "min(500px, 70vw)",
            height: "auto",
            animation: "fade-in 400ms ease-out both",
            filter: "drop-shadow(0 0 60px rgba(201,168,76,0.35)) drop-shadow(0 0 120px rgba(201,168,76,0.12))",
          }}
        />

        <div className="mt-8 w-[min(400px,60vw)] h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--ok-gold), var(--ok-gold-light))",
              animation: "preloader-bar 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
            }}
            onAnimationEnd={handleBarAnimationEnd}
          />
        </div>
      </div>

      {/* Logo is rendered in ShowcaseSites as a fixed element */}

      {/* ── Full-screen Carousel (Phases 3–5) ── */}
      {carouselVisible && (
        <div
          className="absolute inset-0 z-10"
          style={{
            opacity: numericPhase >= 3 ? 1 : 0,
            transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {SITES.map((site, i) => {
            const isActive = carouselIndex === i;
            return (
              <div
                key={site.label}
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                <div
                  style={{
                    width: "1920px",
                    height: "1080px",
                    transform: `scale(${Math.max(viewport.w / 1920, viewport.h / 1080)})`,
                    transformOrigin: "top left",
                  }}
                >
                  <site.Polished />
                </div>
              </div>
            );
          })}

          {/* Dot indicators */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
            {SITES.map((site, i) => (
              <div
                key={site.label}
                className="w-2.5 h-2.5 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: carouselIndex === i ? site.accent : "rgba(255,255,255,0.2)",
                  boxShadow: carouselIndex === i ? `0 0 10px ${site.accent}80` : "none",
                  transform: carouselIndex === i ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
