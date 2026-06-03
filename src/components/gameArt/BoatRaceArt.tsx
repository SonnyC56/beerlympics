import type { GameArtProps } from "./types";

/** A beer mug tipping up to chug, with droplets and a faint racing rival. */
export function BoatRaceArt({ size = 96, className, title = "Boat Race" }: GameArtProps) {
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
        <filter id="boatrace-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="boatrace-mug" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#f7b733" />
        </linearGradient>
      </defs>

      {/* table line */}
      <line x1="12" y1="80" x2="84" y2="80" stroke="#ffd24d" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />

      {/* faint rival mug behind, also chugging but offset */}
      <g stroke="#2ad4ff" strokeOpacity="0.45" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.7">
        <g transform="translate(24 62)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 0 0;-26 0 0;0 0 0"
            keyTimes="0;0.5;1"
            dur="3.4s"
            begin="0.4s"
            calcMode="spline"
            keySplines="0.4 0 0.5 1;0.4 0 0.5 1"
            repeatCount="indefinite"
            additive="sum"
          />
          <path d="M-9,0 L-9,-20 L9,-20 L9,0 Z" fill="#2ad4ff10" />
          <path d="M9,-16 q8,1 8,7 q0,6 -8,6" fill="none" />
        </g>
      </g>

      {/* main mug tipping up to chug, pivot at its base */}
      <g filter="url(#boatrace-glow)" stroke="url(#boatrace-mug)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        <g transform="translate(52 64)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 0 0;-34 0 0;-34 0 0;0 0 0"
            keyTimes="0;0.35;0.6;1"
            dur="3.4s"
            calcMode="spline"
            keySplines="0.35 0 0.4 1;0 0 1 1;0.4 0 0.5 1"
            repeatCount="indefinite"
            additive="sum"
          />
          {/* mug body */}
          <path d="M-11,0 L-11,-24 L11,-24 L11,0 Z" fill="#f7b73318" />
          {/* foam line near the rim */}
          <line x1="-11" y1="-19" x2="11" y2="-19" strokeOpacity="0.6" />
          {/* handle */}
          <path d="M11,-19 q9,1 9,8 q0,7 -9,7" fill="none" />
        </g>
      </g>

      {/* droplet dashes flicking from the rim during the chug */}
      <g stroke="#ffd24d" strokeWidth="2" strokeLinecap="round">
        <line x1="46" y1="34" x2="44" y2="28" opacity="0">
          <animate attributeName="opacity" values="0;0;0.9;0" keyTimes="0;0.4;0.5;0.62" dur="3.4s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 0;-2 -5" keyTimes="0;1" dur="3.4s" repeatCount="indefinite" />
        </line>
        <line x1="54" y1="32" x2="55" y2="26" stroke="#2ad4ff" opacity="0">
          <animate attributeName="opacity" values="0;0;0.9;0" keyTimes="0;0.45;0.55;0.68" dur="3.4s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 0;2 -6" keyTimes="0;1" dur="3.4s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  );
}
