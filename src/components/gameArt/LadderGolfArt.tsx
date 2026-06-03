import type { GameArtProps } from "./types";

/** Neon 3-rung ladder with a bola swinging toward a rung. */
export function LadderGolfArt({ size = 96, className, title = "Ladder Golf" }: GameArtProps) {
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
        <filter id="laddergolf-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="laddergolf-rail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
      </defs>

      {/* ground line */}
      <line x1="14" y1="84" x2="82" y2="84" stroke="#ffd24d" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />

      {/* the ladder: two uprights + 3 rungs, raised on a base */}
      <g filter="url(#laddergolf-glow)" stroke="url(#laddergolf-rail)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {/* uprights */}
        <line x1="38" y1="22" x2="38" y2="80" />
        <line x1="66" y1="22" x2="66" y2="80" />
        {/* base feet */}
        <line x1="34" y1="80" x2="44" y2="80" />
        <line x1="60" y1="80" x2="70" y2="80" />
        {/* three rungs */}
        <line x1="38" y1="30" x2="66" y2="30" />
        <line x1="38" y1="48" x2="66" y2="48" />
        <line x1="38" y1="66" x2="66" y2="66" />
      </g>

      {/* faint upright glow accent */}
      <line x1="52" y1="22" x2="52" y2="80" stroke="#ffd24d" strokeOpacity="0.12" strokeWidth="1.2" strokeLinecap="round" />

      {/* the bola: two balls joined by a cord, swinging from a pivot above the top rung */}
      <g filter="url(#laddergolf-glow)">
        <g transform="translate(52,30)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-48;42;-48"
            keyTimes="0;0.5;1"
            dur="3.6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
            additive="sum"
          />
          {/* cord */}
          <line x1="0" y1="0" x2="0" y2="26" stroke="#b388ff" strokeWidth="2" strokeLinecap="round" />
          {/* two weighted balls */}
          <circle cx="0" cy="20" r="4" stroke="#b388ff" strokeWidth="2.2" fill="#b388ff18" />
          <circle cx="0" cy="30" r="4" stroke="#b388ff" strokeWidth="2.2" fill="#b388ff18" />
        </g>
      </g>

      {/* pivot point shimmer */}
      <circle cx="52" cy="30" r="2.2" fill="#ffd24d" filter="url(#laddergolf-glow)">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
