import type { GameArtProps } from "./types";

/** A growing stack of cups with one dropping on top; a tinted 'death cup'. */
export function StackCupArt({ size = 96, className, title = "Stack Cup" }: GameArtProps) {
  // settled stack from bottom up; the 3rd is the tinted "death cup"
  const stack = [
    { cy: 74, death: false },
    { cy: 62, death: false },
    { cy: 50, death: true },
    { cy: 38, death: false },
  ];
  const cx = 48;
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
        <filter id="stackcup-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="stackcup-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
      </defs>

      {/* table line */}
      <line x1="20" y1="84" x2="76" y2="84" stroke="#ffd24d" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />

      {/* settled stack of cups (slight nesting cup shape) */}
      <g filter="url(#stackcup-glow)" strokeWidth="2.4" strokeLinejoin="round">
        {stack.map(({ cy, death }, i) => (
          <g
            key={i}
            stroke={death ? "#b388ff" : "url(#stackcup-cup)"}
          >
            <path
              d={`M${cx - 9},${cy - 5} L${cx + 9},${cy - 5} L${cx + 7},${cy + 5} L${cx - 7},${cy + 5} Z`}
              fill={death ? "#b388ff22" : "#f7b73318"}
            />
            <ellipse cx={cx} cy={cy - 5} rx="9" ry="2.4" fill="none" />
            {death && (
              <animate
                attributeName="stroke-opacity"
                values="0.55;1;0.55"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </g>
        ))}
      </g>

      {/* cup dropping onto the stack */}
      <g filter="url(#stackcup-glow)" stroke="url(#stackcup-cup)" strokeWidth="2.4" strokeLinejoin="round">
        <g>
          <path d={`M${cx - 9},21 L${cx + 9},21 L${cx + 7},31 L${cx - 7},31 Z`} fill="#f7b73318" />
          <ellipse cx={cx} cy="21" rx="9" ry="2.4" fill="none" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,-18; 0,5; 0,5"
            keyTimes="0;0.55;1"
            dur="3s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.5 0 0.9 0.4; 0 0 1 1"
          />
          <animate attributeName="opacity" values="0;1;1;1" keyTimes="0;0.1;0.55;1" dur="3s" repeatCount="indefinite" />
        </g>
      </g>

      {/* impact pulse when the dropped cup lands */}
      <ellipse cx={cx} cy="33" rx="11" ry="3" stroke="#b388ff" strokeWidth="1.6" fill="none" opacity="0">
        <animate attributeName="rx" values="6;15" keyTimes="0;1" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;0.85;0" keyTimes="0;0.52;0.58;0.72" dur="3s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}
