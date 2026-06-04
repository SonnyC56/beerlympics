"use client";

import { type ReactNode } from "react";
import { cx } from "@/components/primitives";
import { Icon, type IconName } from "@/components/Icon";

/** A labeled form field used across the host dashboard. */
export function HostField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white/70">{label}</span>
        {hint && <span className="text-[11px] text-white/35">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/** Section header with an optional action on the right. */
export function HostSectionTitle({
  emoji,
  icon,
  title,
  action,
}: {
  /** @deprecated use `icon` — emoji are no longer rendered. */
  emoji?: string;
  icon?: IconName;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5 font-display text-xl text-white">
        {icon && <Icon name={icon} size={20} />}
        {title}
      </h2>
      {action}
    </div>
  );
}

/** A compact stat tile for the run dashboard. */
export function HostStat({
  label,
  value,
  emoji,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  /** @deprecated use `icon` — emoji are no longer rendered. */
  emoji?: string;
  icon?: IconName;
  tone?: "gold" | "live" | "win";
}) {
  const color =
    tone === "gold"
      ? "text-[var(--color-gold-400)]"
      : tone === "live"
        ? "text-[var(--color-live)]"
        : tone === "win"
          ? "text-[var(--color-win)]"
          : "text-white";
  return (
    <div className="panel-tight flex flex-col items-center px-2 py-3">
      {icon && <Icon name={icon} size={16} className="text-white/70" />}
      <div className={cx("font-display text-2xl tabular-nums", color)}>{value}</div>
      <div className="text-center text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
    </div>
  );
}

/** Small destructive / confirm pill button. */
export function MiniButton({
  children,
  onClick,
  tone = "ghost",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "ghost" | "flame" | "gold";
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-40",
        tone === "flame" &&
          "bg-[var(--color-loss)]/15 text-[var(--color-loss)] hover:bg-[var(--color-loss)]/25",
        tone === "gold" &&
          "bg-[var(--color-gold-500)] text-[#1a1205] hover:brightness-105",
        tone === "ghost" && "bg-white/8 text-white/80 hover:bg-white/15",
      )}
    >
      {children}
    </button>
  );
}

/** A status badge for stations / matches. */
export function StatusDot({ status }: { status: string }) {
  const map: Record<string, { c: string; label: string }> = {
    open: { c: "var(--color-win)", label: "Open" },
    busy: { c: "var(--color-live)", label: "Busy" },
    closed: { c: "rgba(255,255,255,0.3)", label: "Closed" },
    active: { c: "var(--color-win)", label: "Active" },
    locked: { c: "rgba(255,255,255,0.3)", label: "Locked" },
    complete: { c: "var(--color-gold-400)", label: "Done" },
    scheduled: { c: "var(--color-cyan)", label: "Scheduled" },
    completed: { c: "var(--color-gold-400)", label: "Completed" },
  };
  const m = map[status] ?? { c: "rgba(255,255,255,0.3)", label: status };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/60">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: m.c, boxShadow: `0 0 8px ${m.c}` }}
      />
      {m.label}
    </span>
  );
}
