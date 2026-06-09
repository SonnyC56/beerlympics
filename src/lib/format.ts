/** Date / time / countdown helpers. */
import type { IconName } from "@/components/Icon";

/** Icon name for a game category (no emoji). */
export function categoryIcon(c: string): IconName {
  return c === "lawn" || c === "long" ? "lawn" : "beer";
}

/** Icon name for an activity-feed entry kind. */
export function activityIcon(kind: string): IconName {
  switch (kind) {
    case "rsvp":
      return "handRaise";
    case "team":
      return "flag";
    case "result":
      return "trophy";
    case "phase":
      return "megaphone";
    case "media":
      return "camera";
    case "bonus":
      return "sparkle";
    case "announcement":
      return "megaphone";
    default:
      return "circuit";
  }
}

export function formatEventDate(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalMs: number;
};

/**
 * Returns the offset in ms (tz - UTC) for a given IANA time zone at an instant.
 * e.g. America/New_York in summer (EDT) → -4h, in winter (EST) → -5h.
 */
function tzOffsetMs(timeZone: string, atMs: number): number {
  const d = new Date(atMs);
  const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  const tz = new Date(d.toLocaleString("en-US", { timeZone }));
  return tz.getTime() - utc.getTime();
}

/** The fixed instant (ms) when the games kick off: 1:00 PM Eastern on `dateIso`. */
export function kickoffMs(dateIso: string): number {
  // Interpret 13:00 as if it were UTC, then correct by the Eastern offset so the
  // result is the same real moment for every viewer regardless of their timezone.
  const asUtc = new Date(dateIso + "T13:00:00Z").getTime();
  return asUtc - tzOffsetMs("America/New_York", asUtc);
}

export function countdownTo(dateIso: string, fromMs: number): Countdown {
  const target = kickoffMs(dateIso);
  const diff = target - fromMs;
  const isPast = diff <= 0;
  const abs = Math.abs(diff);
  return {
    days: Math.floor(abs / 86400000),
    hours: Math.floor((abs % 86400000) / 3600000),
    minutes: Math.floor((abs % 3600000) / 60000),
    seconds: Math.floor((abs % 60000) / 1000),
    isPast,
    totalMs: diff,
  };
}

export function timeAgo(ts: number, nowMs: number): string {
  const s = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function categoryLabel(c: string): string {
  switch (c) {
    case "drinking":
    case "beer": // legacy
      return "Drinking Game";
    case "lawn":
    case "long": // legacy
      return "Lawn Game";
    default:
      return c;
  }
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
