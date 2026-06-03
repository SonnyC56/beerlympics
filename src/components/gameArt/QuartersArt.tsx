import type { GameArtProps } from "./types";

/** Neon spinning quarter arcing into a cup — coin squashes (rx) to fake spin. */
export function QuartersArt({ size = 96, className, title = "Quarters" }: GameArtProps) {
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
        <filter id="quarters-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="quarters-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
        <radialGradient id="quarters-coin" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#eafbff" />
          <stop offset="0.6" stopColor="#2ad4ff" />
          <stop offset="1" stopColor="#1593b3" />
        </radialGradient>
      </defs>

      {/* table line */}
      <line x1="14" y1="84" x2="82" y2="84" stroke="#ffd24d" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />

      {/* cup (target) */}
      <g filter="url(#quarters-glow)" stroke="url(#quarters-cup)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M52,52 L70,52 L67,80 L55,80 Z" fill="#f7b73318" />
        <ellipse cx="61" cy="52" rx="9" ry="3" fill="none" />
      </g>

      {/* bounce arc guide (faint) */}
      <path d="M16,40 Q34,8 61,50" stroke="#2ad4ff" strokeOpacity="0.18" strokeWidth="1.6" strokeLinecap="round" fill="none" strokeDasharray="2 5" />

      {/* spinning quarter — squashes rx to fake a spin, rides the arc */}
      <g filter="url(#quarters-glow)">
        <ellipse cx="0" cy="0" ry="6" rx="6" fill="url(#quarters-coin)" stroke="#bdf3ff" strokeWidth="1.4">
          <animate attributeName="rx" values="6;0.8;6;0.8;6" keyTimes="0;0.25;0.5;0.75;1" dur="2.8s" repeatCount="indefinite" />
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.4 0 0.7 1"
            path="M16,40 Q34,8 61,50"
          />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="2.8s" repeatCount="indefinite" />
        </ellipse>
        {/* coin face notch */}
        <line x1="-2.4" y1="0" x2="2.4" y2="0" stroke="#0c5a72" strokeWidth="1" strokeLinecap="round" opacity="0.5">
          <animate attributeName="opacity" values="0;0.5;0;0.5;0" keyTimes="0;0.25;0.5;0.75;1" dur="2.8s" repeatCount="indefinite" />
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.4 0 0.7 1"
            path="M16,40 Q34,8 61,50"
          />
        </line>
      </g>

      {/* splash ring on the cup when coin lands */}
      <ellipse cx="61" cy="50" rx="4" ry="2" stroke="#2ad4ff" strokeWidth="1.6" fill="none" opacity="0">
        <animate attributeName="rx" values="3;12" keyTimes="0;1" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="ry" values="1.5;5" keyTimes="0;1" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;0.85;0" keyTimes="0;0.82;0.86;1" dur="2.8s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}
