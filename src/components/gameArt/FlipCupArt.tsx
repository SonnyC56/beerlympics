import type { GameArtProps } from "./types";

/** A cup at the table edge mid-flip, with a row of small cups waiting. */
export function FlipCupArt({ size = 96, className, title = "Flip Cup" }: GameArtProps) {
  const row = [20, 33, 46];
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
        <filter id="flipcup-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="flipcup-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
      </defs>

      {/* table line */}
      <line x1="10" y1="70" x2="86" y2="70" stroke="#ffd24d" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />

      {/* row of small waiting cups (drawn as trapezoids on the table) */}
      <g filter="url(#flipcup-glow)" stroke="url(#flipcup-cup)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        {row.map((cx, i) => (
          <g key={i}>
            <path
              d={`M${cx - 5},57 L${cx + 5},57 L${cx + 3.6},69 L${cx - 3.6},69 Z`}
              fill="#f7b73318"
            />
            <ellipse cx={cx} cy={57} rx="5" ry="1.8" fill="none" />
          </g>
        ))}
      </g>

      {/* the flipping cup at the table edge (right side) */}
      <g filter="url(#flipcup-glow)" stroke="#b6ff3d" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        {/* pivot at the table edge near x=70, y=70 */}
        <g transform="translate(70 70)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 0 0;-200 0 0;0 0 0"
            keyTimes="0;0.5;1"
            dur="2.8s"
            calcMode="spline"
            keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            repeatCount="indefinite"
            additive="sum"
          />
          {/* cup body, rim down toward the table at the pivot */}
          <path d="M-1,0 L-7,-22 L7,-22 L1,0 Z" fill="#b6ff3d18" />
          <ellipse cx="0" cy="-22" rx="7" ry="2.4" fill="none" />
        </g>
      </g>

      {/* tiny success spark when the flip lands */}
      <g stroke="#b6ff3d" strokeWidth="1.6" strokeLinecap="round" opacity="0">
        <animate attributeName="opacity" values="0;0;0.9;0" keyTimes="0;0.92;0.97;1" dur="2.8s" repeatCount="indefinite" />
        <line x1="70" y1="58" x2="70" y2="52" />
        <line x1="63" y1="61" x2="59" y2="57" />
        <line x1="77" y1="61" x2="81" y2="57" />
      </g>
    </svg>
  );
}
