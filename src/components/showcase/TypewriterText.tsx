"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface TypewriterTextProps {
  text: string;
  initialText?: string;
  speed?: number;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  initialText,
  speed = 40,
  onComplete,
}: TypewriterTextProps) {
  const needsDelete = initialText !== undefined && initialText.length > 0;
  const [displayed, setDisplayed] = useState(initialText ?? "");
  const [stage, setStage] = useState<"deleting" | "typing">(
    needsDelete ? "deleting" : "typing"
  );
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Deletion phase
  useEffect(() => {
    if (stage !== "deleting") return;
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        if (prev.length <= 1) {
          clearInterval(interval);
          setTimeout(() => setStage("typing"), 200);
          return "";
        }
        return prev.slice(0, -1);
      });
    }, speed / 2);
    return () => clearInterval(interval);
  }, [stage, speed]);

  // Typing phase
  useEffect(() => {
    if (stage !== "typing") return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i > text.length) {
        clearInterval(interval);
        onCompleteRef.current?.();
        return;
      }
      setDisplayed(text.slice(0, i));
    }, speed);
    return () => clearInterval(interval);
  }, [stage, text, speed]);

  return (
    <span>
      {displayed}
      <span className="typewriter-cursor">|</span>
    </span>
  );
}
