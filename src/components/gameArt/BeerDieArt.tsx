import type { GameArtProps } from "./types";

/** Diamond table with a cup at each corner and a die arcing over the center. */
export function BeerDieArt({ size = 96, className, title = "Beer Die" }: GameArtProps) {
  // four corners of the diamond table
  const corners = [
    [48, 22],
    [78, 48],
    [48, 74],
    [18, 48],
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
        <filter id="beerdie-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="beerdie-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
        <linearGradient id="beerdie-die" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd24d" />
          <stop offset="1" stopColor="#ff4d6d" />
        </linearGradient>
        {/* arc path the die travels along, center to center */}
        <path id="beerdie-arc" d="M22,52 Q48,8 74,52" />
      </defs>

      {/* diamond table */}
      <path
        d="M48,18 L82,48 L48,78 L14,48 Z"
        stroke="#ffd24d"
        strokeOpacity="0.4"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="#ffd24d10"
      />
      {/* center seam lines for depth */}
      <g stroke="#ffd24d" strokeOpacity="0.18" strokeWidth="1.4" strokeLinecap="round">
        <line x1="48" y1="18" x2="48" y2="78" />
        <line x1="14" y1="48" x2="82" y2="48" />
      </g>

      {/* a cup at each corner */}
      <g filter="url(#beerdie-glow)" stroke="url(#beerdie-cup)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        {corners.map(([cx, cy], i) => (
          <g key={i}>
            <path
              d={`M${cx - 5},${cy - 4} L${cx + 5},${cy - 4} L${cx + 3.6},${cy + 6} L${cx - 3.6},${cy + 6} Z`}
              fill="#f7b73318"
            />
            <ellipse cx={cx} cy={cy - 4} rx="5" ry="1.9" fill="none" />
          </g>
        ))}
      </g>

      {/* the arcing die: rounded square with pips, tumbling as it flies */}
      <g filter="url(#beerdie-glow)">
        <g>
          <animateMotion
            dur="3.2s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.4 0 0.6 1"
          >
            <mpath href="#beerdie-arc" />
          </animateMotion>
          {/* tumble */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="3.2s"
              repeatCount="indefinite"
            />
            <rect x="-7" y="-7" width="14" height="14" rx="3.4" stroke="url(#beerdie-die)" strokeWidth="2.4" fill="#ff4d6d14" />
            {/* five pips */}
            <g fill="#ffd24d">
              <circle cx="-3.4" cy="-3.4" r="1.3" />
              <circle cx="3.4" cy="-3.4" r="1.3" />
              <circle cx="0" cy="0" r="1.3" />
              <circle cx="-3.4" cy="3.4" r="1.3" />
              <circle cx="3.4" cy="3.4" r="1.3" />
            </g>
          </g>
        </g>
      </g>

      {/* landing ripple on the far cup */}
      <circle cx="74" cy="44" r="4" stroke="#ff4d6d" strokeWidth="1.6" fill="none" opacity="0">
        <animate attributeName="r" values="3;10" keyTimes="0;1" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;0.85;0" keyTimes="0;0.86;0.9;1" dur="3.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
