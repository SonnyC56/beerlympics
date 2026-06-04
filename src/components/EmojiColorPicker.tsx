"use client";

import { COLOR_TOKENS, TEAM_COLORS, colorHex } from "@/lib/teamColors";
import { cx } from "./primitives";
import { MASCOT_KEYS, Mascot } from "./Icon";

/** Pick a mascot icon (stored in the `emoji` field). Replaces the old emoji grid. */
export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {MASCOT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-label={key}
          className={cx(
            "flex aspect-square items-center justify-center rounded-xl transition",
            value === key
              ? "bg-[var(--color-gold-500)]/25 text-[var(--color-gold-300)] ring-2 ring-[var(--color-gold-500)]"
              : "bg-white/5 text-white/80 hover:bg-white/10",
          )}
        >
          <Mascot name={key} size={22} />
        </button>
      ))}
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_TOKENS.map((token) => (
        <button
          key={token}
          type="button"
          onClick={() => onChange(token)}
          title={TEAM_COLORS[token].name}
          className={cx(
            "h-9 w-9 rounded-full transition",
            value === token
              ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--color-ink-900)] scale-110"
              : "hover:scale-105",
          )}
          style={{ background: colorHex(token), boxShadow: `0 0 12px ${colorHex(token)}66` }}
        />
      ))}
    </div>
  );
}
