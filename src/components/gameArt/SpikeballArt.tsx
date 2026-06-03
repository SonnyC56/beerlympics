import type { GameArtProps } from "./types";

/** Neon round spikeball net on legs with a ball bouncing off it. */
export function SpikeballArt({ size = 96, className, title = "Spikeball" }: GameArtProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <title>{title}</title>
      <defs>
        <filter id="spikeball-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="spikeball-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
      </defs>

      {/* ground line */}
      <line x1="14" y1="78" x2="82" y2="78" stroke="#ffd24d" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />

      {/* the round net unit */}
      <g filter="url(#spikeball-glow)" strokeLinecap="round" strokeLinejoin="round">
        {/* outer rim */}
        <ellipse cx="48" cy="62" rx="26" ry="9" stroke="url(#spikeball-rim)" strokeWidth="2.6" fill="#f7b73318" />
        {/* inner net circle */}
        <ellipse cx="48" cy="62" rx="18" ry="6" stroke="#ffd24d" strokeWidth="1.8" strokeOpacity="0.7" fill="none" />
        {/* net mesh lines */}
        <line x1="30" y1="62" x2="66" y2="62" stroke="#2ad4ff" strokeWidth="1.3" strokeOpacity="0.55" />
        <line x1="36" y1="57.5" x2="60" y2="66.5" stroke="#2ad4ff" strokeWidth="1.3" strokeOpacity="0.55" />
        <line x1="36" y1="66.5" x2="60" y2="57.5" stroke="#2ad4ff" strokeWidth="1.3" strokeOpacity="0.55" />
        {/* legs */}
        <line x1="32" y1="66" x2="26" y2="76" stroke="url(#spikeball-rim)" strokeWidth="2.4" />
        <line x1="48" y1="68" x2="48" y2="78" stroke="url(#spikeball-rim)" strokeWidth="2.4" />
        <line x1="64" y1="66" x2="70" y2="76" stroke="url(#spikeball-rim)" strokeWidth="2.4" />
      </g>

      {/* bouncing ball (cyan accent) arcing up off the net */}
      <circle r="4.2" fill="#2ad4ff" filter="url(#spikeball-glow)">
        <animateMotion
          dur="2.4s"
          repeatCount="indefinite"
          keyPoints="0;0.5;1"
          keyTimes="0;0.5;1"
          calcMode="spline"
          keySplines="0.3 0 0.5 1;0.5 0 0.7 1"
          path="M48,58 Q26,18 16,28 Q34,52 48,58"
        />
      </circle>

      {/* impact ring on the net when ball strikes */}
      <ellipse cx="48" cy="60" rx="6" ry="2.4" stroke="#2ad4ff" strokeWidth="1.6" fill="none" opacity="0">
        <animate attributeName="rx" values="5;14" keyTimes="0;1" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0" keyTimes="0;1" dur="2.4s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}
