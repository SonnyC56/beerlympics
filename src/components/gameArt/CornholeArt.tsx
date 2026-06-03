import type { GameArtProps } from "./types";

/** Neon angled cornhole board with a bean bag arcing into the hole. */
export function CornholeArt({ size = 96, className, title = "Cornhole" }: GameArtProps) {
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
        <filter id="cornhole-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="cornhole-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
      </defs>

      {/* ground line */}
      <line x1="12" y1="82" x2="84" y2="82" stroke="#ffd24d" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />

      {/* board: angled parallelogram top with hole, raised on legs */}
      <g filter="url(#cornhole-glow)" stroke="url(#cornhole-board)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        {/* board surface (parallelogram, receding into the distance) */}
        <path d="M28,70 L74,70 L62,40 L24,40 Z" fill="#f7b73318" />
        {/* legs */}
        <line x1="30" y1="70" x2="34" y2="82" />
        <line x1="72" y1="70" x2="68" y2="82" />
        {/* the hole */}
        <ellipse cx="43" cy="50" rx="7" ry="3.6" fill="#0c0c12" stroke="#b6ff3d" strokeWidth="2.2" />
      </g>

      {/* center seam for premium detail */}
      <line x1="51" y1="70" x2="43" y2="40" stroke="#ffd24d" strokeOpacity="0.25" strokeWidth="1.4" strokeLinecap="round" />

      {/* arcing bean bag (lime accent) tumbling toward the hole */}
      <g filter="url(#cornhole-glow)">
        <rect x="-5" y="-4" width="10" height="8" rx="2.4" stroke="#b6ff3d" strokeWidth="2.2" fill="#b6ff3d18" strokeLinejoin="round">
          <animateMotion
            dur="3.4s"
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="spline"
            keySplines="0.45 0 0.7 1"
            path="M84,26 Q60,2 43,49"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="220"
            dur="3.4s"
            repeatCount="indefinite"
            additive="sum"
          />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.82;1" dur="3.4s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* sink ripple at the hole */}
      <ellipse cx="43" cy="50" rx="7" ry="3.6" stroke="#b6ff3d" strokeWidth="1.6" fill="none" opacity="0">
        <animate attributeName="rx" values="6;13" keyTimes="0;1" dur="3.4s" repeatCount="indefinite" />
        <animate attributeName="ry" values="3;6.5" keyTimes="0;1" dur="3.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;0.85;0" keyTimes="0;0.78;0.84;1" dur="3.4s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}
