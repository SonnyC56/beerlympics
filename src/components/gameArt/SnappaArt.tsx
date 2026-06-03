import type { GameArtProps } from "./types";

/** A long table with cups and a die bouncing across it. */
export function SnappaArt({ size = 96, className, title = "Snappa" }: GameArtProps) {
  const cups = [28, 48, 68];
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
        <filter id="snappa-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="snappa-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
        <linearGradient id="snappa-die" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2ad4ff" />
          <stop offset="1" stopColor="#ffd24d" />
        </linearGradient>
        {/* bounce path: comes in, dips down to the table, kicks back up */}
        <path id="snappa-path" d="M10,30 Q24,16 34,62 Q44,30 58,62 Q72,30 86,34" />
      </defs>

      {/* long table */}
      <line x1="10" y1="70" x2="86" y2="70" stroke="#ffd24d" strokeOpacity="0.4" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="14" y1="76" x2="82" y2="76" stroke="#ffd24d" strokeOpacity="0.18" strokeWidth="1.6" strokeLinecap="round" />

      {/* cups on the table */}
      <g filter="url(#snappa-glow)" stroke="url(#snappa-cup)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        {cups.map((cx, i) => (
          <g key={i}>
            <path
              d={`M${cx - 5},57 L${cx + 5},57 L${cx + 3.6},69 L${cx - 3.6},69 Z`}
              fill="#f7b73318"
            />
            <ellipse cx={cx} cy={57} rx="5" ry="1.9" fill="none" />
          </g>
        ))}
      </g>

      {/* bounce mark on the table where the die dips */}
      <ellipse cx="34" cy="69" rx="3" ry="1" stroke="#2ad4ff" strokeWidth="1.4" fill="none" opacity="0">
        <animate attributeName="opacity" values="0;0;0.9;0" keyTimes="0;0.3;0.36;0.5" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="rx" values="2;6" keyTimes="0;1" dur="2.8s" repeatCount="indefinite" />
      </ellipse>

      {/* bouncing die */}
      <g filter="url(#snappa-glow)">
        <g>
          <animateMotion dur="2.8s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
            <mpath href="#snappa-path" />
          </animateMotion>
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="540"
              dur="2.8s"
              repeatCount="indefinite"
            />
            <rect x="-6.5" y="-6.5" width="13" height="13" rx="3.2" stroke="url(#snappa-die)" strokeWidth="2.3" fill="#2ad4ff14" />
            <g fill="#2ad4ff">
              <circle cx="-3" cy="-3" r="1.2" />
              <circle cx="3" cy="3" r="1.2" />
              <circle cx="0" cy="0" r="1.2" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
