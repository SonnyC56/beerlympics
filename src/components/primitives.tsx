"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { colorHex } from "@/lib/teamColors";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** A clock that re-renders on an interval — for countdowns / "time ago". */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[var(--color-gold-500)]" />
      {label && <div className="text-sm">{label}</div>}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({
  emoji,
  title,
  subtitle,
  action,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="text-5xl animate-float">{emoji}</div>
      <div className="font-display text-2xl text-white">{title}</div>
      {subtitle && <div className="max-w-xs text-sm text-white/55">{subtitle}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({
  emoji,
  size = 40,
  color,
}: {
  emoji: string;
  size?: number;
  color?: string;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: color ? `${colorHex(color)}22` : "rgba(255,255,255,0.06)",
        border: `1px solid ${color ? colorHex(color) : "rgba(255,255,255,0.1)"}`,
      }}
    >
      {emoji}
    </span>
  );
}

// ── Team badge ────────────────────────────────────────────────────────────────
export function TeamBadge({
  emoji,
  name,
  color,
  size = "md",
  className,
}: {
  emoji: string;
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hex = colorHex(color);
  const text =
    size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={cx("inline-flex items-center gap-2 font-semibold", text, className)}>
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: hex, boxShadow: `0 0 10px ${hex}99` }}
      />
      <span className="truncate">
        {emoji} {name}
      </span>
    </span>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
export function Chip({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cx("chip", className)}
      style={color ? { color: colorHex(color), borderColor: `${colorHex(color)}55` } : undefined}
    >
      {children}
    </span>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="flex gap-1 rounded-full border border-white/10 bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "flex-1 rounded-full px-3 py-2 text-sm font-bold transition",
            value === o.value
              ? "bg-[var(--color-gold-500)] text-[#1a1205]"
              : "text-white/60 hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Number stepper ────────────────────────────────────────────────────────────
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-2 py-1">
      <button
        className="h-8 w-8 rounded-full bg-white/8 text-lg font-bold text-white disabled:opacity-30"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        type="button"
      >
        −
      </button>
      <span className="w-6 text-center font-display text-lg">{value}</span>
      <button
        className="h-8 w-8 rounded-full bg-white/8 text-lg font-bold text-white disabled:opacity-30"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        type="button"
      >
        +
      </button>
    </div>
  );
}

// ── Bottom sheet / modal ──────────────────────────────────────────────────────
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-pop"
        onClick={onClose}
      />
      <div className="panel relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 animate-rise sm:rounded-b-[1.75rem]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-white">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/70 hover:bg-white/15"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Toasts ────────────────────────────────────────────────────────────────────
type Toast = { id: number; message: string; tone: "ok" | "err" };
const ToastCtx = createContext<{
  toast: (message: string, tone?: "ok" | "err") => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "panel-tight pointer-events-auto max-w-sm px-4 py-3 text-sm font-semibold shadow-xl animate-rise",
              t.tone === "err" ? "text-[var(--color-loss)]" : "text-[var(--color-win)]",
            )}
          >
            {t.tone === "err" ? "⚠️ " : "✅ "}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  return ctx?.toast ?? (() => {});
}

/** Wrap an async action with toast feedback. */
export function useAction() {
  const toast = useToast();
  return useCallback(
    async (fn: () => Promise<unknown>, okMsg?: string) => {
      try {
        await fn();
        if (okMsg) toast(okMsg, "ok");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Something went wrong", "err");
        return false;
      }
    },
    [toast],
  );
}
