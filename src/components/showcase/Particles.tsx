"use client";

export function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-sm opacity-0"
          style={{
            backgroundColor: color,
            left: `${10 + (i * 7.3) % 80}%`,
            top: `${5 + (i * 13.7) % 85}%`,
            animation: `float ${3 + (i % 3)}s ease-in-out infinite, pulse-particle ${2 + (i % 2)}s ease-in-out infinite, spin-slow ${15 + i * 2}s linear infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}
