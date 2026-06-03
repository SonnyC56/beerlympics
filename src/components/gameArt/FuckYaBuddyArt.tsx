import type { GameArtProps } from "./types";

/** One cup flips a full rotation in an arc and lands into a second cup, over a table. */
export function FuckYaBuddyArt({ size = 96, className, title = "Fuck Yeah Buddy" }: GameArtProps) {
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
        <filter id="fuckyabuddy-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* table */}
      <line x1="12" y1="74" x2="84" y2="74" stroke="#ffd24d" strokeOpacity="0.32" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="22" y1="74" x2="18" y2="85" stroke="#ffd24d" strokeOpacity="0.16" strokeWidth="2" strokeLinecap="round" />
      <line x1="74" y1="74" x2="78" y2="85" stroke="#ffd24d" strokeOpacity="0.16" strokeWidth="2" strokeLinecap="round" />

      {/* receiving cup (right) + a settle ripple when the flipper lands */}
      <g filter="url(#fuckyabuddy-glow)" stroke="#2ad4ff" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M53 50 L71 50 L68.5 73 L55.5 73 Z" fill="#2ad4ff10" />
        <line x1="53" y1="50" x2="71" y2="50" stroke="#7ee6ff" strokeWidth="2.6" strokeLinecap="round" />
        <ellipse cx="62" cy="50" rx="6" ry="2.6" stroke="#7ee6ff" strokeWidth="1.6" fill="none" opacity="0">
          <animate attributeName="rx" values="6;14" keyTimes="0;1" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;0.85;0" keyTimes="0;0.66;0.72;0.9" dur="2.4s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* flipping cup — arcs from the left, one full rotation, drops into the cup */}
      <g filter="url(#fuckyabuddy-glow)">
        <animateMotion
          dur="2.4s"
          repeatCount="indefinite"
          path="M24,60 Q42,12 61,49"
          keyPoints="0;1;1"
          keyTimes="0;0.7;1"
          calcMode="linear"
        />
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 0 0; 360 0 0; 360 0 0"
            keyTimes="0;0.7;1"
            dur="2.4s"
            repeatCount="indefinite"
          />
          <path d="M-6 -7 L6 -7 L4.5 7 L-4.5 7 Z" stroke="#ffd24d" strokeWidth="2.4" strokeLinejoin="round" fill="#f7b73312" />
          <line x1="-6" y1="-7" x2="6" y2="-7" stroke="#ffe9a8" strokeWidth="2.6" strokeLinecap="round" />
        </g>
        <animate
          attributeName="opacity"
          values="0;1;1;1;0"
          keyTimes="0;0.08;0.7;0.9;1"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </g>
    </svg>
  );
}
