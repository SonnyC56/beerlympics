import type { GameArtProps } from "./types";

/** A slotted KanJam can with a disc flying into the slot. */
export function KanJamArt({ size = 96, className, title = "KanJam" }: GameArtProps) {
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
        <filter id="kanjam-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ground */}
      <line x1="14" y1="80" x2="82" y2="80" stroke="#b6ff3d" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />

      {/* the can (cylinder) */}
      <g filter="url(#kanjam-glow)" stroke="#ffd24d" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M50 46 L70 46 L68 78 L52 78 Z" fill="#f7b7330f" />
        <ellipse cx="60" cy="46" rx="10" ry="3.4" fill="#f7b73312" />
        {/* front slot */}
        <rect x="58" y="52" width="4" height="20" rx="2" stroke="#ff4d6d" strokeWidth="2" fill="#ff4d6d18" />
      </g>

      {/* disc flying toward the slot, spinning */}
      <g filter="url(#kanjam-glow)">
        <ellipse cx="0" cy="0" rx="8" ry="2.6" stroke="#2ad4ff" strokeWidth="2.2" fill="#2ad4ff14">
          <animateMotion dur="2.4s" repeatCount="indefinite" path="M10,34 Q34,24 60,58" rotate="auto" />
          <animate attributeName="opacity" values="0;1;1;0.2;0" keyTimes="0;0.12;0.7;0.85;1" dur="2.4s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* score pop when it lands */}
      <circle cx="60" cy="60" r="3" stroke="#b6ff3d" strokeWidth="1.8" fill="none" opacity="0">
        <animate attributeName="r" values="2;12" keyTimes="0;1" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;0.9;0" keyTimes="0;0.72;0.78;1" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
