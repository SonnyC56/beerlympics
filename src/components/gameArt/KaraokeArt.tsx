import type { GameArtProps } from "./types";

/** A neon microphone with pulsing sound waves. */
export function KaraokeArt({ size = 96, className, title = "Karaoke" }: GameArtProps) {
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
        <filter id="karaoke-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* sound waves */}
      <g filter="url(#karaoke-glow)" stroke="#2ad4ff" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M30 34 Q24 42 30 50">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="1.6s" repeatCount="indefinite" />
        </path>
        <path d="M23 30 Q14 42 23 54">
          <animate attributeName="opacity" values="0.15;0.8;0.15" dur="1.6s" begin="0.2s" repeatCount="indefinite" />
        </path>
        <path d="M66 34 Q72 42 66 50">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="1.6s" begin="0.1s" repeatCount="indefinite" />
        </path>
        <path d="M73 30 Q82 42 73 54">
          <animate attributeName="opacity" values="0.15;0.8;0.15" dur="1.6s" begin="0.3s" repeatCount="indefinite" />
        </path>
      </g>

      {/* mic */}
      <g filter="url(#karaoke-glow)" stroke="#ffd24d" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="48" cy="40" r="12" fill="#f7b7331a" />
        <line x1="42" y1="36" x2="54" y2="36" strokeOpacity="0.55" strokeWidth="1.6" />
        <line x1="42" y1="40" x2="54" y2="40" strokeOpacity="0.55" strokeWidth="1.6" />
        <line x1="42" y1="44" x2="54" y2="44" strokeOpacity="0.55" strokeWidth="1.6" />
        <path d="M48 52 L48 70" />
        <path d="M40 74 L56 74" />
      </g>
    </svg>
  );
}
