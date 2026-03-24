export function FilmGrain() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[9998] h-full w-full opacity-[0.035]"
      aria-hidden="true"
    >
      <filter id="overkillGrain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#overkillGrain)" />
    </svg>
  );
}
