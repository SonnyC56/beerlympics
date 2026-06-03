"use client";

import { useEffect, useRef, useState } from "react";
import { colorHex } from "@/lib/teamColors";

export type WheelSpot = { label: string; points?: number; color?: string };

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
 * pointer, and calls `onArrive(index)` when it stops.
 */
export function SpinWheel({
  spots,
  size = 300,
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
  const cy = 104;
  const r = 88;

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
          transformOrigin: "100px 104px",
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
          const flip = mid > 90 && mid < 270;
          const labelR = r * 0.62;
          return (
            <g key={i}>
              <path
                d={`M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`}
                fill={`${hex}26`}
                stroke={hex}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <g transform={`rotate(${mid} ${cx} ${cy})`}>
                <text
                  x={cx}
                  y={cy - labelR}
                  transform={flip ? `rotate(180 ${cx} ${cy - labelR})` : undefined}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="800"
                  fill={hex}
                  style={{ letterSpacing: "0.02em" }}
                >
                  {truncate(spot.label, 13)}
                </text>
              </g>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="13" fill="#110e1c" stroke="#ffd24d" strokeWidth="2.4" filter="url(#wheel-glow)" />
        <circle cx={cx} cy={cy} r="4" fill="#ffd24d" />
      </g>

      {/* fixed pointer at the top */}
      <g filter="url(#wheel-glow)">
        <path d="M89 5 L111 5 L100 27 Z" fill="#ffd24d" stroke="#1a1205" strokeWidth="1" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
