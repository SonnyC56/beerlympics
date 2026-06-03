import type { GameArtProps } from "./types";

/** Two poles topped with cups + a disc sailing through the gap. */
export function CrispyWicketsArt({ size = 96, className, title = "Crispy Wickets" }: GameArtProps) {
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
        <filter id="crispywickets-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ground */}
      <line x1="14" y1="78" x2="82" y2="78" stroke="#b6ff3d" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />

      {/* two poles (a wicket goal) */}
      <g filter="url(#crispywickets-glow)" stroke="#ffd24d" strokeWidth="2.6" strokeLinecap="round">
        <line x1="40" y1="78" x2="40" y2="40" />
        <line x1="58" y1="78" x2="58" y2="40" />
      </g>

      {/* cups perched on top */}
      <g filter="url(#crispywickets-glow)" stroke="#ff4d6d" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M35 40 L45 40 L43.5 32 L36.5 32 Z" fill="#ff4d6d12" />
        <path d="M53 40 L63 40 L61.5 32 L54.5 32 Z" fill="#ff4d6d12" />
      </g>

      {/* disc sailing through the gap, spinning */}
      <g filter="url(#crispywickets-glow)">
        <ellipse cx="0" cy="0" rx="8" ry="2.6" stroke="#2ad4ff" strokeWidth="2.2" fill="#2ad4ff14">
          <animateMotion dur="2.6s" repeatCount="indefinite" path="M12,58 Q34,40 49,49 Q64,58 86,44" rotate="auto" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.8;1" dur="2.6s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
}
