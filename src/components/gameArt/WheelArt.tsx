import type { GameArtProps } from "./types";

/** A neon prize wheel, slowly spinning, with a top pointer. */
export function WheelArt({ size = 96, className, title = "The Wheel" }: GameArtProps) {
  const colors = ["#ffd24d", "#ff4d6d", "#2ad4ff", "#b6ff3d", "#b388ff", "#ff9f1c"];
  const n = 8;
  const seg = 360 / n;
  const cx = 48;
  const cy = 50;
  const r = 30;
  const pt = (deg: number, rad: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  };
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
        <filter id="wheelart-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#wheelart-glow)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${cx} ${cy}`}
          to={`360 ${cx} ${cy}`}
          dur="9s"
          repeatCount="indefinite"
        />
        <circle cx={cx} cy={cy} r={r + 2} stroke="#ffffff22" strokeWidth="2" />
        {Array.from({ length: n }).map((_, i) => {
          const [x1, y1] = pt(i * seg, r);
          const [x2, y2] = pt((i + 1) * seg, r);
          const hex = colors[i % colors.length];
          return (
            <path
              key={i}
              d={`M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`}
              fill={`${hex}22`}
              stroke={hex}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="5" fill="#110e1c" stroke="#ffd24d" strokeWidth="2" />
      </g>

      {/* fixed pointer */}
      <path d="M43 12 L53 12 L48 22 Z" fill="#ffd24d" stroke="#1a1205" strokeWidth="0.8" strokeLinejoin="round" filter="url(#wheelart-glow)" />
    </svg>
  );
}
