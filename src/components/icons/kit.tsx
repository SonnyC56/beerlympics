import type { ReactNode } from "react";

export type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

/**
 * Shared SVG wrapper for every icon. All icons are 24×24, line-style,
 * `stroke="currentColor"` (so they inherit text color), no fill, round caps.
 * This is how we replace ALL emoji in the app — see <Icon> in ../Icon.tsx.
 */
export function Svg({
  size = 24,
  className,
  strokeWidth = 2,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Every UI/semantic icon name in the app (emoji replacements). */
export type IconName =
  // nav
  | "home" | "teams" | "circuit" | "trophy" | "camera" | "games"
  // medals / ranks
  | "medalGold" | "medalSilver" | "medalBronze" | "crown" | "flag"
  // categories / drinks
  | "beer" | "beers" | "drink" | "lawn" | "keg" | "dice" | "wheel" | "mic"
  // actions
  | "bolt" | "plus" | "minus" | "edit" | "trash" | "refresh" | "check" | "close"
  | "share" | "link" | "copy" | "bell" | "gear" | "sliders" | "save" | "pencil"
  // status / state
  | "lock" | "unlock" | "live" | "warning" | "alert" | "sparkle" | "party"
  // arrows
  | "arrowRight" | "arrowLeft" | "chevronDown" | "back"
  // info / misc
  | "calendar" | "clock" | "pin" | "flame" | "star" | "starOutline" | "megaphone"
  | "play" | "list" | "chart" | "tv" | "envelope" | "ticket" | "eye" | "map"
  | "folder" | "handRaise" | "wave" | "construction" | "scale" | "traffic"
  | "compass" | "clipboard" | "book" | "image" | "film" | "video" | "photo"
  | "key" | "heart" | "target" | "finish" | "rocket" | "sad" | "thinking"
  | "cheers" | "stadium" | "qr" | "info" | "shrug" | "google";

/** Team / player mascot icons (replacing the emoji picker). */
export type MascotName =
  | "lion" | "dragon" | "eagle" | "shark" | "wolf" | "snake" | "dino" | "octopus"
  | "unicorn" | "bee" | "skull" | "crown" | "diamond" | "bolt" | "fire" | "wave"
  | "pepper" | "clover" | "disco" | "guitar" | "rockHand" | "shades" | "cowboy"
  | "alien" | "robot" | "star" | "rocket" | "trophy" | "beer" | "anchor"
  | "ghost";

export type IconRegistry = Partial<Record<IconName, (p: IconProps) => ReactNode>>;
export type MascotRegistry = Partial<Record<MascotName, (p: IconProps) => ReactNode>>;
