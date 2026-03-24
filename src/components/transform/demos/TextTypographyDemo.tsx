"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  features: Set<string>;
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

export function TextTypographyDemo({ features }: Props) {
  const splitText = features.has("split-text");
  const typewriter = features.has("typewriter");
  const textScramble = features.has("text-scramble");

  const [replayKey, setReplayKey] = useState(0);
  const [splitAnimDone, setSplitAnimDone] = useState(false);

  const heading = "Premium Experience";
  const subtext = "Elevate every detail";

  // ─── Typewriter state ───
  const [typedLength, setTypedLength] = useState(0);
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTypewriter = useCallback(() => {
    setTypedLength(0);
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    let i = 0;
    typeIntervalRef.current = setInterval(() => {
      i++;
      setTypedLength(i);
      if (i >= subtext.length) {
        if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
      }
    }, 60);
  }, [subtext.length]);

  useEffect(() => {
    if (typewriter) startTypewriter();
    return () => {
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    };
  }, [typewriter, replayKey, startTypewriter]);

  // ─── Text scramble state ───
  const [scrambledText, setScrambledText] = useState(heading);
  const scrambleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isScrambling, setIsScrambling] = useState(false);

  const handleScrambleEnter = useCallback(() => {
    if (!textScramble || isScrambling) return;
    setIsScrambling(true);

    let resolved = 0;
    const target = heading;
    const totalFrames = target.length * 1.5; // fast resolve
    let frame = 0;

    if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);
    scrambleIntervalRef.current = setInterval(() => {
      frame++;
      resolved = Math.floor((frame / totalFrames) * target.length);

      const result = target
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (i < resolved) return char;
          return randomChar();
        })
        .join("");

      setScrambledText(result);

      if (resolved >= target.length) {
        if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);
        setScrambledText(target);
        setIsScrambling(false);
      }
    }, 30);
  }, [textScramble, isScrambling]);

  useEffect(() => {
    return () => {
      if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);
    };
  }, []);

  // Mark split animation as done after it finishes
  useEffect(() => {
    if (!splitText) {
      setSplitAnimDone(false);
      return;
    }
    setSplitAnimDone(false);
    const duration = heading.length * 40 + 500; // delay per char + animation duration
    const timer = setTimeout(() => setSplitAnimDone(true), duration);
    return () => clearTimeout(timer);
  }, [splitText, replayKey]);

  // Reset scramble text when feature toggled
  useEffect(() => {
    if (!textScramble) setScrambledText(heading);
  }, [textScramble]);

  const replay = useCallback(() => {
    setReplayKey((k) => k + 1);
    setSplitAnimDone(false);
    setScrambledText(heading);
  }, []);

  const anyActive = splitText || typewriter || textScramble;

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6">
      <div className="text-center space-y-4">
        {/* ─── Main heading: split-text, scramble, or both ─── */}
        {splitText && !splitAnimDone && !isScrambling ? (
          /* Split reveal animation — plays once */
          <h2
            key={replayKey}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            {heading.split("").map((char, i) => (
              <span
                key={`${replayKey}-${i}`}
                className="inline-block"
                style={{
                  animation: `char-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s both`,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h2>
        ) : textScramble || isScrambling ? (
          <h2
            onMouseEnter={handleScrambleEnter}
            className="text-4xl md:text-5xl font-bold tracking-tight cursor-default font-[family-name:var(--font-geist-mono)] select-none"
          >
            {scrambledText}
          </h2>
        ) : (
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {heading}
          </h2>
        )}

        {/* ─── Subtext: typewriter or plain ─── */}
        {typewriter ? (
          <p className="text-base text-[var(--ok-muted)] font-[family-name:var(--font-geist-mono)] h-6">
            {subtext.slice(0, typedLength)}
            <span className="typewriter-cursor text-[var(--ok-gold)]">|</span>
          </p>
        ) : (
          <p className="text-sm text-[var(--ok-muted)] max-w-xs mx-auto leading-relaxed">
            {splitText && textScramble && "Split reveal on load, then hover to scramble."}
            {splitText && !textScramble && "Each character animates in with staggered timing."}
            {textScramble && !splitText && "Hover the heading to scramble it."}
            {!splitText && !textScramble && "Enable a feature to see text effects."}
          </p>
        )}
      </div>

      {/* Controls */}
      {anyActive && (
        <button
          onClick={replay}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-[var(--ok-gold)]/25
                     text-[var(--ok-gold)] hover:bg-[var(--ok-gold)]/10 transition-all
                     font-[family-name:var(--font-geist-mono)]"
        >
          Replay
        </button>
      )}

      {/* Hints */}
      <div className="flex flex-col items-center gap-1 text-[11px] text-[var(--ok-muted)] font-[family-name:var(--font-geist-mono)]">
        {splitText && <span>Characters reveal with staggered timing</span>}
        {typewriter && <span>Text types out character by character</span>}
        {textScramble && <span>Hover the heading to trigger scramble</span>}
        {!anyActive && <span className="opacity-50">Enable a feature to see it in action</span>}
      </div>
    </div>
  );
}
