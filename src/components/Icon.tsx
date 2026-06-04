import type { IconName, IconProps, MascotName } from "./icons/kit";
import { ui1 } from "./icons/ui1";
import { ui2 } from "./icons/ui2";
import { ui3 } from "./icons/ui3";
import { ui4 } from "./icons/ui4";
import { ui5 } from "./icons/ui5";
import { ui6 } from "./icons/ui6";
import { mascot1 } from "./icons/mascot1";
import { mascot2 } from "./icons/mascot2";

export type { IconName, MascotName } from "./icons/kit";

const ICONS = { ...ui1, ...ui2, ...ui3, ...ui4, ...ui5, ...ui6 };
const MASCOTS = { ...mascot1, ...mascot2 };

/** A custom line icon by name (replaces emoji). Inherits text color. */
export function Icon({ name, ...p }: { name: IconName } & IconProps) {
  const render = ICONS[name];
  return render ? <>{render(p)}</> : null;
}

/** A team/player mascot icon by key. Falls back to a star for unknown values. */
export function Mascot({ name, ...p }: { name?: string | null } & IconProps) {
  const render =
    (name && MASCOTS[name as MascotName]) || MASCOTS.star || MASCOTS.trophy;
  return render ? <>{render(p)}</> : null;
}

/** A place medal (1/2/3) or nothing. Color is set by the caller's text color. */
export function Medal({ rank, ...p }: { rank?: number } & IconProps) {
  const name: IconName | null =
    rank === 1
      ? "medalGold"
      : rank === 2
        ? "medalSilver"
        : rank === 3
          ? "medalBronze"
          : null;
  return name ? <Icon name={name} {...p} /> : null;
}

export const MASCOT_KEYS = Object.keys(MASCOTS) as MascotName[];
export const ICON_KEYS = Object.keys(ICONS) as IconName[];
