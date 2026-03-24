"use client";

import { useRef, useState, useCallback } from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Magnetic pull strength in px (default 12) */
  strength?: number;
  /** Glow color (default gold) */
  glowColor?: string;
}

export function MagneticButton({
  children,
  className = "",
  style,
  onClick,
  type = "button",
  disabled = false,
  strength = 12,
  glowColor = "rgba(201,168,76,0.4)",
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState("translate(0px, 0px) scale(1)");
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      setTransform(
        `translate(${deltaX * strength}px, ${deltaY * strength}px) scale(1.03)`
      );
      setGlowPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [disabled, strength]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform("translate(0px, 0px) scale(1)");
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setIsHovered(true);
  }, [disabled]);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        transform,
        transition: isHovered
          ? "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: isHovered
          ? `0 0 30px ${glowColor}, 0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
          : (style?.boxShadow ?? "0 2px 8px rgba(0,0,0,0.3)"),
      }}
    >
      {/* Shine sweep on hover */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isHovered
            ? `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`
            : "none",
          transition: "background 0.2s ease",
        }}
      />
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
