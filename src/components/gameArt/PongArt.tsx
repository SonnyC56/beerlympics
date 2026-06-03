import type { GameArtProps } from "./types";

/** Canonical reference: neon cup-triangle with an arcing ping-pong ball. */
export function PongArt({ size = 96, className, title = "Beer Pong" }: GameArtProps) {
  const cups = [
    [48, 44],
    [39, 59],
    [57, 59],
    [30, 74],
    [48, 74],
    [66, 74],
  ];
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
        <filter id="pong-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="pong-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
      </defs>

      {/* table line */}
      <line x1="14" y1="84" x2="82" y2="84" stroke="#ffd24d" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />

      {/* cup triangle */}
      <g filter="url(#pong-glow)" stroke="url(#pong-cup)" strokeWidth="2.4" strokeLinejoin="round">
        {cups.map(([cx, cy], i) => (
          <g key={i}>
            <path
              d={`M${cx - 6},${cy - 5} L${cx + 6},${cy - 5} L${cx + 4.5},${cy + 6} L${cx - 4.5},${cy + 6} Z`}
              fill="#f7b73318"
            />
            <ellipse cx={cx} cy={cy - 5} rx="6" ry="2" fill="none" />
          </g>
        ))}
      </g>

      {/* arcing ball */}
      <circle r="3.4" fill="#2ad4ff" filter="url(#pong-glow)">
        <animateMotion
          dur="2.6s"
          repeatCount="indefinite"
          keyPoints="0;1"
          keyTimes="0;1"
          calcMode="spline"
          keySplines="0.4 0 0.7 1"
          path="M10,30 Q30,-2 48,38"
        />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="2.6s" repeatCount="indefinite" />
      </circle>

      {/* splash pulse on the front cup */}
      <circle cx="48" cy="40" r="5" stroke="#2ad4ff" strokeWidth="1.6" fill="none" opacity="0">
        <animate attributeName="r" values="3;11" keyTimes="0;1" dur="2.6s" begin="0s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;0.8;0" keyTimes="0;0.78;0.82;1" dur="2.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
