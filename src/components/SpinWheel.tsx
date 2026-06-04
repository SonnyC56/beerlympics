"use client";

import { useEffect, useRef, useState } from "react";
import { colorHex } from "@/lib/teamColors";

export type WheelSpot = {
  label: string;
  points?: number;
  color?: string;
  broadcast?: boolean; // landing here fires an "everybody drinks" push
};

const PALETTE = ["gold", "flame", "cyan", "lime", "grape", "orange", "mint", "sky", "rose"];

function spotColor(spot: WheelSpot, i: number): string {
  if (spot.color) return colorHex(spot.color);
  return colorHex(PALETTE[i % PALETTE.length]);
}

function pt(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/**
 * An animated spin-the-wheel. Drive it by bumping `spin.nonce` with the target
 * `spin.index`; it spins 5+ turns clockwise, lands that spot under the top
 * pointer, and calls `onArrive(index)` when it stops. Labels are drawn radially
 * (running from the hub out to the rim) so even an 18-spot wheel stays legible.
 */
export function SpinWheel({
  spots,
  size = 360,
  spin,
  onArrive,
}: {
  spots: WheelSpot[];
  size?: number;
  spin: { index: number; nonce: number } | null;
  onArrive?: (index: number) => void;
}) {
  const n = Math.max(spots.length, 1);
  const seg = 360 / n;
  const cx = 100;
  const cy = 102;
  const r = 90;

  // Scale the label to the slice count so dense wheels still fit.
  const fontSize = n >= 16 ? 6 : n >= 12 ? 6.8 : n >= 9 ? 7.6 : n >= 6 ? 9 : 11;
  const maxChars = n >= 16 ? 15 : n >= 11 ? 17 : 20;
  const inner = 21;
  const outer = r - 5;

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const lastNonce = useRef<number | null>(null);
  const pendingIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!spin || spin.nonce === lastNonce.current) return;
    lastNonce.current = spin.nonce;
    const centerAngle = spin.index * seg + seg / 2;
    const targetMod = ((-centerAngle) % 360 + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const forwardDelta = ((targetMod - currentMod) % 360 + 360) % 360;
    const next = rotation + 360 * 5 + forwardDelta;
    pendingIndex.current = spin.index;
    setSpinning(true);
    setRotation(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin?.nonce]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Prize wheel"
      style={{ width: "100%", height: "auto", maxWidth: size }}
    >
      <defs>
        <filter id="wheel-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* spinning group */}
      <g
        style={{
          transform: `rotate(${rotation}deg)`,
          transformBox: "view-box",
          transformOrigin: `${cx}px ${cy}px`,
          transition: spinning ? "transform 4.4s cubic-bezier(0.16, 0.84, 0.27, 1)" : "none",
        }}
        onTransitionEnd={() => {
          if (!spinning) return;
          setSpinning(false);
          if (pendingIndex.current !== null) onArrive?.(pendingIndex.current);
        }}
      >
        <circle cx={cx} cy={cy} r={r + 3} fill="#0c0a14" stroke="#ffffff14" strokeWidth="2" />
        {spots.map((spot, i) => {
          const start = i * seg;
          const end = (i + 1) * seg;
          const [x1, y1] = pt(cx, cy, r, start);
          const [x2, y2] = pt(cx, cy, r, end);
          const hex = spotColor(spot, i);
          const mid = start + seg / 2;
          // Radial label: runs along the slice's centerline, flipped on the
          // left half so it never reads upside-down.
          const dir = mid - 90;
          const flip = mid > 180;
          const [lx, ly] = pt(cx, cy, flip ? outer : inner, mid);
          const rot = flip ? dir + 180 : dir;
          const [bx, by] = pt(cx, cy, outer - 3, mid);
          return (
            <g key={i}>
              <path
                d={`M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`}
                fill={spot.broadcast ? `${hex}40` : `${hex}22`}
                stroke={hex}
                strokeWidth={spot.broadcast ? "2" : "1.3"}
                strokeLinejoin="round"
              />
              {spot.broadcast && (
                <circle cx={bx} cy={by} r="2.2" fill={hex} filter="url(#wheel-glow)" />
              )}
              <text
                x={lx}
                y={ly}
                transform={`rotate(${rot} ${lx} ${ly})`}
                textAnchor="start"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight="800"
                fill={hex}
                style={{ letterSpacing: "0.01em" }}
              >
                {truncate(spot.label, maxChars)}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="13" fill="#110e1c" stroke="#ffd24d" strokeWidth="2.4" filter="url(#wheel-glow)" />
        <circle cx={cx} cy={cy} r="4" fill="#ffd24d" />
      </g>

      {/* fixed pointer at the top */}
      <g filter="url(#wheel-glow)">
        <path d="M89 3 L111 3 L100 26 Z" fill="#ffd24d" stroke="#1a1205" strokeWidth="1" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
