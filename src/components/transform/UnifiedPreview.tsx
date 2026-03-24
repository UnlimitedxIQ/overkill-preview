"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MagneticButton } from "@/components/MagneticButton";

interface Props {
  features: Set<string>;
  videoUrl: string;
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

const HERO_HEADING = "Swift and Simple Transport";
const HERO_SUB = "Reliable logistics solutions";

// Clipped corner polygon for Targo buttons
const CLIP_PATH = "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))";

const SERVICES = [
  {
    icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l5-3 5 3z M20 18V9a1 1 0 00-1-1h-5v8.5l-2.5-1.5",
    title: "Freight Shipping",
    desc: "Full truckload & LTL across 48 states",
  },
  {
    icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z",
    title: "Real-Time Tracking",
    desc: "GPS visibility on every shipment 24/7",
  },
  {
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Express Delivery",
    desc: "Same-day and next-day options available",
  },
];

const STATS = [
  { value: "15K+", label: "Deliveries" },
  { value: "99.8%", label: "On-Time" },
  { value: "48", label: "States" },
];

export function UnifiedPreview({ features, videoUrl }: Props) {
  // Feature flags
  const magnetic = features.has("magnetic-buttons");
  const customCursor = features.has("custom-cursor");
  const focusRings = features.has("focus-rings");
  const glass = features.has("glass-buttons");
  const smoothScroll = features.has("smooth-scroll");
  const scrollProgress = features.has("scroll-progress");
  const parallax = features.has("parallax");
  const backToTop = features.has("back-to-top");
  const splitTextOn = features.has("split-text");
  const typewriterOn = features.has("typewriter");
  const scrambleOn = features.has("text-scramble");
  const bg3d = features.has("3d-background");
  const grain = features.has("film-grain");
  const tilt = features.has("card-tilt");
  const preloader = features.has("preloader");
  const videoBg = features.has("video-background");

  // Derived: detect "Smooth" mode (no video, no 3d-background = minimal preset)
  const isSmooth = !videoBg && !bg3d;

  // ─── Scroll state ───
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPct, setScrollPct] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollPct(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: smoothScroll ? "smooth" : "auto" });
  }, [smoothScroll]);

  // ─── Custom cursor (direct DOM) ───
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const cursorEl = cursorRef.current;
    if (!container || !cursorEl || !customCursor) {
      if (cursorEl) cursorEl.style.opacity = "0";
      return;
    }
    cursorEl.style.opacity = "0";
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      cursorEl.style.transform = `translate(${e.clientX - rect.left - 12}px, ${e.clientY - rect.top - 12}px)`;
      cursorEl.style.opacity = "1";
    };
    const onLeave = () => { cursorEl.style.opacity = "0"; };
    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
    };
  }, [customCursor]);

  // ─── Split text animation ───
  const [replayKey, setReplayKey] = useState(0);
  const [splitDone, setSplitDone] = useState(false);

  useEffect(() => {
    if (!splitTextOn) { setSplitDone(false); return; }
    setSplitDone(false);
    const t = setTimeout(() => setSplitDone(true), HERO_HEADING.length * 40 + 500);
    return () => clearTimeout(t);
  }, [splitTextOn, replayKey]);

  // ─── Typewriter ───
  const [typedLen, setTypedLen] = useState(0);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!typewriterOn) { setTypedLen(0); return; }
    setTypedLen(0);
    let i = 0;
    typeRef.current = setInterval(() => {
      i++;
      setTypedLen(i);
      if (i >= HERO_SUB.length && typeRef.current) clearInterval(typeRef.current);
    }, 60);
    return () => { if (typeRef.current) clearInterval(typeRef.current); };
  }, [typewriterOn, replayKey]);

  // ─── Text scramble ───
  const [scrambled, setScrambled] = useState(HERO_HEADING);
  const [isScrambling, setIsScrambling] = useState(false);
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerScramble = useCallback(() => {
    if (!scrambleOn || isScrambling) return;
    setIsScrambling(true);
    let frame = 0;
    const total = HERO_HEADING.length * 1.5;
    if (scrambleRef.current) clearInterval(scrambleRef.current);
    scrambleRef.current = setInterval(() => {
      frame++;
      const resolved = Math.floor((frame / total) * HERO_HEADING.length);
      setScrambled(
        HERO_HEADING.split("").map((c, i) => (c === " " ? " " : i < resolved ? c : randomChar())).join("")
      );
      if (resolved >= HERO_HEADING.length) {
        if (scrambleRef.current) clearInterval(scrambleRef.current);
        setScrambled(HERO_HEADING);
        setIsScrambling(false);
      }
    }, 30);
  }, [scrambleOn, isScrambling]);

  useEffect(() => { if (!scrambleOn) setScrambled(HERO_HEADING); }, [scrambleOn]);
  useEffect(() => () => { if (scrambleRef.current) clearInterval(scrambleRef.current); }, []);

  // ─── Card tilt ───
  const makeTiltHandler = useCallback(
    (ref: React.RefObject<HTMLDivElement | null>, setter: (v: string) => void) => ({
      onMouseMove: (e: React.MouseEvent) => {
        if (!tilt || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        setter(`perspective(600px) rotateY(${x * 15}deg) rotateX(${y * -15}deg)`);
      },
      onMouseLeave: () => setter("perspective(600px) rotateX(0) rotateY(0)"),
    }),
    [tilt]
  );

  // Consultation card tilt
  const consultCardRef = useRef<HTMLDivElement>(null);
  const [consultTf, setConsultTf] = useState("perspective(600px) rotateX(0) rotateY(0)");
  const consultTiltHandlers = makeTiltHandler(consultCardRef, setConsultTf);

  // Service card tilts
  const svcRef0 = useRef<HTMLDivElement>(null);
  const svcRef1 = useRef<HTMLDivElement>(null);
  const svcRef2 = useRef<HTMLDivElement>(null);
  const [svcTf0, setSvcTf0] = useState("perspective(600px) rotateX(0) rotateY(0)");
  const [svcTf1, setSvcTf1] = useState("perspective(600px) rotateX(0) rotateY(0)");
  const [svcTf2, setSvcTf2] = useState("perspective(600px) rotateX(0) rotateY(0)");
  const svcRefs = [svcRef0, svcRef1, svcRef2];
  const svcTfs = [svcTf0, svcTf1, svcTf2];
  const svcHandlers = [
    makeTiltHandler(svcRef0, setSvcTf0),
    makeTiltHandler(svcRef1, setSvcTf1),
    makeTiltHandler(svcRef2, setSvcTf2),
  ];

  // ─── Preloader ───
  const [loaderKey, setLoaderKey] = useState(0);

  const replay = useCallback(() => {
    setReplayKey((k) => k + 1);
    setSplitDone(false);
    setScrambled(HERO_HEADING);
    setLoaderKey((k) => k + 1);
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // ─── Auto-replay when features change ───
  const featuresKey = Array.from(features).sort().join(",");
  const prevFeaturesKey = useRef(featuresKey);
  useEffect(() => {
    if (prevFeaturesKey.current !== featuresKey) {
      prevFeaturesKey.current = featuresKey;
      replay();
    }
  }, [featuresKey, replay]);

  // ─── Button elements ───
  const getStartedBtn = (
    <span
      className={`inline-block px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-white ${focusRings ? "focus-visible:animate-[ring-pulse_1.5s_ease-in-out_infinite] outline-none" : ""}`}
      style={{
        backgroundColor: "#EE3F2C",
        clipPath: CLIP_PATH,
        ...(glass ? {
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
        } : {}),
      }}
    >
      Get Started
    </span>
  );

  const bookCallBtn = (
    <span
      className={`inline-block px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider text-black ${focusRings ? "focus-visible:animate-[ring-pulse_1.5s_ease-in-out_infinite] outline-none" : ""}`}
      style={{
        backgroundColor: "#FFFFFF",
        clipPath: CLIP_PATH,
        ...(glass ? {
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
        } : {}),
      }}
    >
      Book a Call
    </span>
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-xl font-[family-name:var(--font-rubik)]"
      style={{ cursor: customCursor ? "none" : "default" }}
    >
      {/* ─── Custom cursor (racer reticle) ─── */}
      {customCursor && (
        <div ref={cursorRef} className="pointer-events-none absolute top-0 left-0 z-50 will-change-transform" style={{ opacity: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 0 6px rgba(238,63,44,0.6))" }}>
            {/* Outer ring */}
            <circle cx="12" cy="12" r="9" stroke="#EE3F2C" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* Inner dot */}
            <circle cx="12" cy="12" r="2" fill="#EE3F2C" />
            {/* Crosshair lines */}
            <line x1="12" y1="1" x2="12" y2="5" stroke="#EE3F2C" strokeWidth="1.5" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="#EE3F2C" strokeWidth="1.5" />
            <line x1="1" y1="12" x2="5" y2="12" stroke="#EE3F2C" strokeWidth="1.5" />
            <line x1="19" y1="12" x2="23" y2="12" stroke="#EE3F2C" strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* ─── Background: MAX=video, Overkill=freeze frame, Smooth=themed gradient ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {videoBg ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover"
            src="/targo-bg.mp4"
          />
        ) : bg3d ? (
          <>
            <img
              src="/targo-freeze.jpg"
              alt=""
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
          </>
        ) : (
          <div className="absolute inset-0" style={{
            background: "linear-gradient(145deg, #0a0a0a 0%, #1a0a0a 30%, #150808 55%, #0d0506 75%, #0a0a0a 100%)",
          }} />
        )}
      </div>

      {/* ─── 3D gradient overlay ─── */}
      {bg3d && (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{
          background: "linear-gradient(135deg, rgba(238,63,44,0.3), rgba(120,50,220,0.2), rgba(238,63,44,0.15), rgba(50,120,240,0.2))",
          backgroundSize: "300% 300%", animation: "gradient-shift 5s ease infinite",
          opacity: 0.5,
        }} />
      )}

      {/* ─── Film grain ─── */}
      {grain && (
        <div className="absolute inset-0 pointer-events-none z-[2] mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px", opacity: 0.08,
        }} />
      )}

      {/* ─── Scroll progress bar ─── */}
      {scrollProgress && (
        <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/5">
          <div className="h-full transition-[width] duration-100" style={{
            width: `${scrollPct * 100}%`,
            background: "linear-gradient(90deg, #EE3F2C, #ff6b5a)",
          }} />
        </div>
      )}

      {/* ─── Scrollable content ─── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={(e) => e.stopPropagation()}
        className="relative z-10 h-full overflow-y-auto preview-scroll"
        style={{ scrollBehavior: smoothScroll ? "smooth" : "auto", overscrollBehavior: "contain" }}
      >
        {/* ════════════════════════════════════════ */}
        {/* SECTION 1: Hero                         */}
        {/* ════════════════════════════════════════ */}
        <div className="min-h-full flex flex-col relative">
          {/* Preloader */}
          {preloader && (
            <div key={loaderKey} className="px-6 pt-2">
              <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  background: "linear-gradient(90deg, #EE3F2C, #ff6b5a)",
                  animation: "loader-fill 2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                }} />
              </div>
            </div>
          )}

          {/* Nav bar */}
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="#EE3F2C" />
                <path d="M14 14h6v6h-6z" fill="white" fillOpacity="0.4" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-white">targo</span>
            </div>
            <div className="flex items-center gap-3">
              {["Home", "About"].map((item) => (
                <span key={item} className="text-[9px] text-white/60 hover:text-white transition-colors cursor-default uppercase tracking-wider">{item}</span>
              ))}
              {magnetic ? (
                <MagneticButton strength={6} glowColor={glass ? "rgba(255,255,255,0.15)" : "rgba(238,63,44,0.4)"}>
                  <span
                    className={`inline-block text-[9px] font-bold uppercase tracking-wider text-white px-2.5 py-1 cursor-default ${focusRings ? "focus-visible:animate-[ring-pulse_1.5s_ease-in-out_infinite] outline-none" : ""}`}
                    style={{
                      clipPath: CLIP_PATH,
                      ...(glass ? {
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(16px) saturate(1.4)",
                        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                      } : {
                        backgroundColor: "#EE3F2C",
                      }),
                    }}
                  >
                    Contact Us
                  </span>
                </MagneticButton>
              ) : (
                <span
                  className={`inline-block text-[9px] font-bold uppercase tracking-wider text-white px-2.5 py-1 cursor-default transition-all duration-200 hover:scale-105 ${focusRings ? "focus-visible:animate-[ring-pulse_1.5s_ease-in-out_infinite] outline-none" : ""}`}
                  style={{
                    clipPath: CLIP_PATH,
                    ...(glass ? {
                      background: "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(16px) saturate(1.4)",
                      WebkitBackdropFilter: "blur(16px) saturate(1.4)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                    } : {
                      backgroundColor: "#EE3F2C",
                    }),
                  }}
                >
                  Contact Us
                </span>
              )}
            </div>
          </div>

          {/* Hero content */}
          <div
            className={`flex-1 flex flex-col justify-center pb-16 ${isSmooth ? "items-center text-center px-4" : "px-8"}`}
            style={parallax ? { transform: `translateY(${scrollPct * -30}px)`, transition: "transform 0.1s ease-out" } : undefined}
          >
            <div className={`relative ${isSmooth ? "max-w-full" : "max-w-[320px]"}`}>
              {/* Heading classes: centered + bigger when no bg, left-aligned + smaller otherwise */}
              {(() => {
                const headingCls = isSmooth
                  ? "text-4xl font-black uppercase tracking-[-0.05em] leading-[1.05] text-white mb-4 whitespace-nowrap"
                  : "text-3xl font-bold uppercase tracking-[-0.04em] leading-[1.1] text-white mb-4";
                const splitCls = isSmooth
                  ? `${headingCls} flex flex-wrap justify-center`
                  : `${headingCls} flex flex-wrap`;

                if (splitTextOn && !splitDone && !isScrambling) {
                  return (
                    <h2 key={replayKey} className={splitCls}>
                      {HERO_HEADING.split(" ").reduce<{ charIndex: number; elements: React.ReactNode[] }>(
                        (acc, word, wordIdx) => {
                          const startIdx = acc.charIndex;
                          const wordEl = (
                            <span key={`w-${replayKey}-${wordIdx}`} className="inline-flex whitespace-nowrap">
                              {word.split("").map((c, ci) => (
                                <span key={`${replayKey}-${startIdx + ci}`} className="inline-block" style={{
                                  animation: `char-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${(startIdx + ci) * 0.04}s both`,
                                }}>{c}</span>
                              ))}
                            </span>
                          );
                          acc.elements.push(wordEl);
                          if (wordIdx < HERO_HEADING.split(" ").length - 1) {
                            acc.elements.push(
                              <span key={`sp-${replayKey}-${wordIdx}`} className="inline-block" style={{
                                animation: `char-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${(startIdx + word.length) * 0.04}s both`,
                              }}>{"\u00A0"}</span>
                            );
                          }
                          acc.charIndex = startIdx + word.length + 1;
                          return acc;
                        },
                        { charIndex: 0, elements: [] }
                      ).elements}
                    </h2>
                  );
                }
                if (scrambleOn || isScrambling) {
                  return (
                    <h2
                      onMouseEnter={triggerScramble}
                      className={`${headingCls} cursor-default select-none`}
                    >{scrambled}</h2>
                  );
                }
                return <h2 className={headingCls}>{HERO_HEADING}</h2>;
              })()}

              {typewriterOn ? (
                <p className={`text-[10px] text-white/50 mb-4 h-4 ${isSmooth ? "mx-auto" : ""}`}>
                  {HERO_SUB.slice(0, typedLen)}<span className="text-[#EE3F2C]">|</span>
                </p>
              ) : (
                <p className={`text-[10px] text-white/50 mb-4 leading-relaxed ${isSmooth ? "mx-auto max-w-[300px]" : "max-w-[240px]"}`}>
                  Delivering excellence across every mile, every time.
                </p>
              )}
            </div>

            <div>
              {magnetic ? (
                <MagneticButton strength={8} glowColor="rgba(238,63,44,0.4)">
                  {getStartedBtn}
                </MagneticButton>
              ) : (
                <button className="transition-all duration-200 hover:scale-105">
                  {getStartedBtn}
                </button>
              )}
            </div>
          </div>

          {/* Consultation card (bottom-left, only in hero section) */}
          <div className="absolute bottom-4 left-6 z-20 max-w-[200px]">
            <div
              ref={consultCardRef}
              {...consultTiltHandlers}
              className="p-4 rounded-xl relative overflow-hidden"
              style={{
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)",
                transform: consultTf,
                transition: tilt ? "transform 0.1s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)",
              }} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-2 relative">
                Book a Free Consultation
              </p>
              <div className="flex items-center gap-2 mb-3 relative">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                <span className="text-[9px] text-white/60">+1 (555) 000-0000</span>
              </div>
              <div className="relative">
                {magnetic ? (
                  <MagneticButton strength={6} glowColor="rgba(255,255,255,0.2)">
                    {bookCallBtn}
                  </MagneticButton>
                ) : (
                  <button className="transition-all duration-200 hover:scale-105">
                    {bookCallBtn}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 2: Services                     */}
        {/* ════════════════════════════════════════ */}
        <div className="relative bg-black/80 backdrop-blur-sm">
          {/* Top border accent */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#EE3F2C]/40 to-transparent" />

          <div
            className="px-8 py-10"
            style={parallax ? { transform: `translateY(${scrollPct * -15}px)`, transition: "transform 0.15s ease-out" } : undefined}
          >
            {/* Section header */}
            <div className="mb-6">
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#EE3F2C] font-bold mb-1">Our Services</p>
              <h3 className="text-xl font-bold uppercase tracking-[-0.03em] text-white leading-tight">
                End-to-End Logistics
              </h3>
              <p className="text-[10px] text-white/40 mt-1 max-w-[280px]">
                From first mile to final delivery — we handle every step.
              </p>
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {SERVICES.map((svc, i) => (
                <div
                  key={svc.title}
                  ref={svcRefs[i]}
                  {...svcHandlers[i]}
                  className="p-4 rounded-xl border border-white/[0.08] relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    transform: svcTfs[i],
                    transition: tilt ? "transform 0.1s ease-out" : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Card glow on hover */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(238,63,44,0.4), transparent)" }} />

                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: "rgba(238,63,44,0.12)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EE3F2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={svc.icon} />
                    </svg>
                  </div>

                  <p className="text-[10px] font-bold text-white mb-0.5 relative">{svc.title}</p>
                  <p className="text-[8px] text-white/40 leading-relaxed relative">{svc.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div
              className="flex items-center justify-between px-5 py-4 rounded-xl border border-white/[0.08]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                ...(parallax ? { transform: `translateY(${scrollPct * -8}px)`, transition: "transform 0.15s ease-out" } : {}),
              }}
            >
              {STATS.map((s, i) => (
                <div key={s.label} className="text-center flex-1 relative">
                  {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-white/[0.08]" />}
                  <p className="text-lg font-bold text-[#EE3F2C]">{s.value}</p>
                  <p className="text-[8px] text-white/40 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-8 text-center">
              <p className="text-xs font-semibold text-white mb-1">Ready to ship?</p>
              <p className="text-[9px] text-white/40 mb-3">Get a free quote in under 60 seconds.</p>
              {magnetic ? (
                <MagneticButton strength={6} glowColor="rgba(238,63,44,0.3)">
                  {getStartedBtn}
                </MagneticButton>
              ) : (
                <button className="transition-all duration-200 hover:scale-105">
                  {getStartedBtn}
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 flex items-center justify-between border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="#EE3F2C" />
                <path d="M14 14h6v6h-6z" fill="white" fillOpacity="0.3" />
              </svg>
              <span className="text-[9px] text-white/40 uppercase tracking-wider">targo logistics</span>
            </div>
            <span className="text-[9px] text-white/30">© 2026</span>
          </div>
        </div>
      </div>

      {/* ─── Back to top ─── */}
      {backToTop && scrollPct > 0.15 && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-3 right-3 z-30 w-7 h-7 rounded-full flex items-center justify-center
                     border border-[#EE3F2C]/30 text-[#EE3F2C]
                     hover:bg-[#EE3F2C]/15 transition-all"
          style={{ backgroundColor: "rgba(238,63,44,0.1)", animation: "fade-in 0.2s ease-out" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* ─── Replay button ─── */}
      <button
        onClick={replay}
        className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-md text-[10px] font-medium
                   border border-white/20 text-white/70 hover:bg-white/10
                   transition-all font-[family-name:var(--font-geist-mono)]"
      >
        Replay
      </button>
    </div>
  );
}
