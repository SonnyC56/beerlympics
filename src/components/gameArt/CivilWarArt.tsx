import type { GameArtProps } from "./types";

/** Two opposing rows of cups (3v3) with multiple balls flying at once. */
export function CivilWarArt({ size = 96, className, title = "Civil War" }: GameArtProps) {
  const topRow = [
    [30, 24],
    [48, 24],
    [66, 24],
  ];
  const botRow = [
    [30, 72],
    [48, 72],
    [66, 72],
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
        <filter id="civilwar-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="civilwar-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
      </defs>

      {/* center battle line */}
      <line x1="12" y1="48" x2="84" y2="48" stroke="#2ad4ff" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5">
        <animate attributeName="stroke-dashoffset" values="0;-8" dur="2.2s" repeatCount="indefinite" />
      </line>

      {/* top opposing row (pointing down) */}
      <g filter="url(#civilwar-glow)" stroke="url(#civilwar-cup)" strokeWidth="2.4" strokeLinejoin="round">
        {topRow.map(([cx, cy], i) => (
          <g key={`t${i}`}>
            <path
              d={`M${cx - 4.5},${cy - 6} L${cx + 4.5},${cy - 6} L${cx + 6},${cy + 5} L${cx - 6},${cy + 5} Z`}
              fill="#f7b73318"
            />
            <ellipse cx={cx} cy={cy - 6} rx="6" ry="2" fill="none" />
          </g>
        ))}
      </g>

      {/* bottom opposing row (pointing up) */}
      <g filter="url(#civilwar-glow)" stroke="url(#civilwar-cup)" strokeWidth="2.4" strokeLinejoin="round">
        {botRow.map(([cx, cy], i) => (
          <g key={`b${i}`}>
            <path
              d={`M${cx - 6},${cy - 5} L${cx + 6},${cy - 5} L${cx + 4.5},${cy + 6} L${cx - 4.5},${cy + 6} Z`}
              fill="#f7b73318"
            />
            <ellipse cx={cx} cy={cy - 5} rx="6" ry="2" fill="none" />
          </g>
        ))}
      </g>

      {/* multiple balls flying at once - staggered chaos */}
      <circle r="3" fill="#ff4d6d" filter="url(#civilwar-glow)">
        <animateMotion dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.7 1" path="M30,68 Q40,38 48,22" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="2.4s" repeatCount="indefinite" />
      </circle>

      <circle r="2.8" fill="#2ad4ff" filter="url(#civilwar-glow)">
        <animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.7 1" path="M48,28 Q58,58 66,68" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="2.4s" begin="0.5s" repeatCount="indefinite" />
      </circle>

      <circle r="3" fill="#ff4d6d" filter="url(#civilwar-glow)">
        <animateMotion dur="2.8s" begin="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.7 1" path="M66,68 Q54,40 48,22" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="2.8s" begin="1s" repeatCount="indefinite" />
      </circle>

      <circle r="2.6" fill="#2ad4ff" filter="url(#civilwar-glow)">
        <animateMotion dur="2.6s" begin="1.6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.7 1" path="M30,28 Q22,52 30,68" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="2.6s" begin="1.6s" repeatCount="indefinite" />
      </circle>

      <circle r="2.8" fill="#ffd24d" filter="url(#civilwar-glow)">
        <animateMotion dur="3s" begin="0.9s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.7 1" path="M48,68 Q46,44 66,24" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="3s" begin="0.9s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
