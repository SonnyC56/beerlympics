import { Svg, type IconProps, type IconRegistry } from "./kit";

export const ui1: IconRegistry = {
  // House: roof line + body with a centered door.
  home: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 11.5 L12 4 L21 11.5" />
      <path d="M5 10.5 V20 H19 V10.5" />
      <path d="M10 20 V14.5 H14 V20" />
    </Svg>
  ),

  // Two people: two heads + two shoulder arcs.
  teams: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 19 V18 C3 15.5 5 14 8.5 14 C12 14 14 15.5 14 18 V19" />
      <path d="M16 5.5 C18 5.5 19.5 7 19.5 9 C19.5 10.5 18.5 11.5 17.5 12" />
      <path d="M15.5 14.5 C19 14.5 21 16 21 18.5 V19" />
    </Svg>
  ),

  // Target: concentric rings with a filled center dot.
  circuit: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Trophy: cup bowl + two side handles + stem and base.
  trophy: (p: IconProps) => (
    <Svg {...p}>
      <path d="M7 4 H17 V9 C17 11.75 14.75 14 12 14 C9.25 14 7 11.75 7 9 Z" />
      <path d="M7 5.5 H4.5 V7 C4.5 8.65 5.85 10 7.5 10" />
      <path d="M17 5.5 H19.5 V7 C19.5 8.65 18.15 10 16.5 10" />
      <path d="M12 14 V17.5" />
      <path d="M8.5 20.5 H15.5 V18.5 C15.5 18 15 17.5 14.5 17.5 H9.5 C9 17.5 8.5 18 8.5 18.5 Z" />
    </Svg>
  ),

  // Camera: body with viewfinder bump + lens circle.
  camera: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 8 H7 L8.5 5.5 H15.5 L17 8 H21 V19 H3 Z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  ),

  // Games: 2x2 grid of rounded squares.
  games: (p: IconProps) => (
    <Svg {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Svg>
  ),

  // Medal: two ribbon strands + circular medal. Same drawing for all three.
  medalGold: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8.5 3 L11 11" />
      <path d="M15.5 3 L13 11" />
      <circle cx="12" cy="16" r="5" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  ),

  medalSilver: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8.5 3 L11 11" />
      <path d="M15.5 3 L13 11" />
      <circle cx="12" cy="16" r="5" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  ),

  medalBronze: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8.5 3 L11 11" />
      <path d="M15.5 3 L13 11" />
      <circle cx="12" cy="16" r="5" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Crown: 3-point crown on a base band.
  crown: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 8 L7 15 H17 L20 8 L15.5 11 L12 6 L8.5 11 Z" />
      <path d="M7 18 H17" />
    </Svg>
  ),

  // Flag: pennant triangle on a vertical pole.
  flag: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 3 V21" />
      <path d="M6 4.5 L19 8.5 L6 12.5 Z" />
    </Svg>
  ),
};
