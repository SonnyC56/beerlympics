/**
 * Team color tokens. Teams pick one; the UI renders it consistently everywhere
 * (badges, bracket nodes, scoreboard bars). Each has a vivid hex + a soft glow.
 */
export type TeamColorToken =
  | "gold"
  | "flame"
  | "cyan"
  | "lime"
  | "grape"
  | "orange"
  | "mint"
  | "sky"
  | "rose"
  | "amber";

export const TEAM_COLORS: Record<
  TeamColorToken,
  { hex: string; ink: string; name: string }
> = {
  gold: { hex: "#f7b733", ink: "#1a1205", name: "Gold" },
  flame: { hex: "#ff4d6d", ink: "#2a0710", name: "Flame" },
  cyan: { hex: "#2ad4ff", ink: "#04212b", name: "Cyan" },
  lime: { hex: "#b6ff3d", ink: "#16240a", name: "Lime" },
  grape: { hex: "#b388ff", ink: "#1a0e33", name: "Grape" },
  orange: { hex: "#ff9f1c", ink: "#2a1500", name: "Orange" },
  mint: { hex: "#36e07a", ink: "#052414", name: "Mint" },
  sky: { hex: "#5b8cff", ink: "#06122e", name: "Sky" },
  rose: { hex: "#ff6fb5", ink: "#2c0a1d", name: "Rose" },
  amber: { hex: "#ffd24d", ink: "#241a04", name: "Amber" },
};

export const COLOR_TOKENS = Object.keys(TEAM_COLORS) as TeamColorToken[];

export function colorHex(token: string | undefined): string {
  if (token && token in TEAM_COLORS) return TEAM_COLORS[token as TeamColorToken].hex;
  return TEAM_COLORS.gold.hex;
}

export function colorInk(token: string | undefined): string {
  if (token && token in TEAM_COLORS) return TEAM_COLORS[token as TeamColorToken].ink;
  return TEAM_COLORS.gold.ink;
}

/** Inline style helpers for a team's accent. */
export function teamAccent(token: string | undefined) {
  const hex = colorHex(token);
  return {
    color: hex,
    borderColor: hex,
  } as const;
}

export function teamFill(token: string | undefined) {
  const hex = colorHex(token);
  return {
    background: hex,
    color: colorInk(token),
  } as const;
}
