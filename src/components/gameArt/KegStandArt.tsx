import type { GameArtProps } from "./types";

/** A keg with legs kicked up in the air (a keg stand), wobbling. */
export function KegStandArt({ size = 96, className, title = "Longest Keg Stand" }: GameArtProps) {
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
        <filter id="kegstand-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* legs kicked up, wobbling */}
      <g filter="url(#kegstand-glow)" stroke="#ff4d6d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <g style={{ transformBox: "view-box", transformOrigin: "48px 52px" }}>
          <animateTransform attributeName="transform" type="rotate" values="-7 48 52; 7 48 52; -7 48 52" dur="2.8s" repeatCount="indefinite" />
          <path d="M48 52 L40 26" />
          <path d="M48 52 L57 24" />
          <circle cx="40" cy="24" r="2.4" fill="#ff7a93" stroke="none" />
          <circle cx="57" cy="22" r="2.4" fill="#ff7a93" stroke="none" />
          <path d="M40 26 L36 22" />
          <path d="M57 24 L61 20" />
        </g>
      </g>

      {/* keg */}
      <g filter="url(#kegstand-glow)" stroke="#ffd24d" strokeWidth="2.4" strokeLinejoin="round">
        <ellipse cx="48" cy="56" rx="13" ry="4" fill="#f7b73312" />
        <path d="M35 56 L35 78 Q48 82 61 78 L61 56" fill="#f7b7330e" />
        <ellipse cx="48" cy="78" rx="13" ry="4" fill="none" />
        <line x1="36" y1="67" x2="60" y2="67" strokeOpacity="0.5" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
