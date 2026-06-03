/** Date / time / countdown helpers. */

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

export function countdownTo(dateIso: string, fromMs: number): Countdown {
  const target = new Date(dateIso + "T12:00:00").getTime();
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

export function categoryEmoji(c: string): string {
  switch (c) {
    case "drinking":
    case "beer": // legacy
      return "🍺";
    case "lawn":
    case "long": // legacy
      return "🌳";
    default:
      return "•";
  }
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function placeMedal(place: number | undefined): string {
  if (place === 1) return "🥇";
  if (place === 2) return "🥈";
  if (place === 3) return "🥉";
  return "";
}
