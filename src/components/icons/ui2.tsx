import { Svg, type IconProps, type IconRegistry } from "./kit";

export const ui2: IconRegistry = {
  // Beer mug with handle + foam line
  beer: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 8 H16 V20 a1 1 0 0 1 -1 1 H7 a1 1 0 0 1 -1 -1 Z" />
      <path d="M16 10 H19 a1 1 0 0 1 1 1 V16 a1 1 0 0 1 -1 1 H16" />
      <path d="M6 11 H16" />
    </Svg>
  ),

  // Two mugs clinking
  beers: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 7 H9 V18 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 Z" />
      <path d="M9 9 H11 a1 1 0 0 1 1 1 V13 a1 1 0 0 1 -1 1 H9" />
      <path d="M3 10 H9" />
      <path d="M15 7 H21 V18 a1 1 0 0 1 -1 1 H16 a1 1 0 0 1 -1 -1 Z" />
      <path d="M15 9 H13 a1 1 0 0 1 -1 1 V13 a1 1 0 0 1 1 1 H15" />
      <path d="M15 10 H21" />
    </Svg>
  ),

  // Rocks glass / tumbler
  drink: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6.5 5 H17.5 L16 20 a1 1 0 0 1 -1 0.9 H9 a1 1 0 0 1 -1 -0.9 Z" />
      <path d="M7 10 H17" />
      <circle cx="14" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Grass blades / three tufts
  lawn: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 20 V14 C6 11 4.5 9.5 3.5 8.5" />
      <path d="M6 20 C6 16 7.5 13.5 9 12" />
      <path d="M12 20 V13 C12 9.5 10 7.5 9 6.5" />
      <path d="M12 20 C12 15 14 12 15.5 10.5" />
      <path d="M18 20 V14 C18 11 16.5 9.5 15.5 8.5" />
      <path d="M18 20 C18 16 19.5 13.5 21 12" />
    </Svg>
  ),

  // Keg cylinder with tap
  keg: (p: IconProps) => (
    <Svg {...p}>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M6 8 H18" />
      <path d="M6 16 H18" />
      <path d="M14 11.5 H20 V13.5" />
      <path d="M20 13.5 V16.5" />
    </Svg>
  ),

  // Square die with pips
  dice: (p: IconProps) => (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Circle with spokes + top pointer triangle (spinner wheel)
  wheel: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="13" r="8" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 5 V13" />
      <path d="M12 13 L18.5 17" />
      <path d="M12 13 L5.5 17" />
      <polygon points="12,2 9.5,6 14.5,6" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Microphone head + stand
  mic: (p: IconProps) => (
    <Svg {...p}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M6 11 a6 6 0 0 0 12 0" />
      <path d="M12 17 V21" />
      <path d="M9 21 H15" />
    </Svg>
  ),

  // Flame
  flame: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 2.5 C12 6 8 7.5 8 12 a4 4 0 0 0 8 0 C16 9.5 14 8 14 6 C13 7 12.5 7.5 12 8 C12 6 13 4 12 2.5 Z" />
    </Svg>
  ),

  // Two glasses tilting together (cheers)
  cheers: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 4 L9.5 5.5 L8 11 a2.5 2.5 0 0 1 -4.5 -1 Z" />
      <path d="M5.5 10.5 L4 19" />
      <path d="M2 19 H7" />
      <path d="M21 4 L14.5 5.5 L16 11 a2.5 2.5 0 0 0 4.5 -1 Z" />
      <path d="M18.5 10.5 L20 19" />
      <path d="M17 19 H22" />
    </Svg>
  ),

  // Oval stadium with tiers
  stadium: (p: IconProps) => (
    <Svg {...p}>
      <ellipse cx="12" cy="12" rx="10" ry="6.5" />
      <ellipse cx="12" cy="12" rx="6.5" ry="4" />
      <ellipse cx="12" cy="12" rx="3" ry="1.8" />
    </Svg>
  ),

  // Concentric rings + arrow (target)
  target: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="11" cy="13" r="8.5" />
      <circle cx="11" cy="13" r="5" />
      <circle cx="11" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <path d="M11 13 L20 4" />
      <polyline points="16,4 20,4 20,8" />
    </Svg>
  ),

  // Checkered finish flag
  finish: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 3 V21" />
      <rect x="5" y="4" width="14" height="10" rx="0.5" />
      <path d="M5 9 H19" />
      <path d="M12 4 V14" />
      <path d="M5 6.5 H12 V9 H5" fill="currentColor" stroke="none" />
      <path d="M12 9 H19 V11.5 H12" fill="currentColor" stroke="none" />
    </Svg>
  ),
};
