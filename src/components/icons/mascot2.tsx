import { Svg, type IconProps, type MascotRegistry } from "./kit";

export const mascot2: MascotRegistry = {
  // Ocean wave — curling crest with motion lines
  wave: (p: IconProps) => (
    <Svg {...p}>
      <path d="M2.5 16.5 C5 16.5 5.5 11 9 11 C12 11 12 15 14.5 15 C16.5 15 16.5 8 13 8 C11 8 10.5 10 11.5 11.5" />
      <path d="M2.5 20.5 C5 20.5 5.5 17.5 8.5 17.5 C11 17.5 11 20.5 14 20.5 C17 20.5 18 17.5 21 17.5" />
    </Svg>
  ),

  // Chili pepper — body with curved stem
  pepper: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8 7.5 C8 12.5 10.5 19.5 14.5 19.5 C18 19.5 19 16 19 13.5 C19 11 17 9 14.5 9 C12.5 9 11.5 10 11.5 10" />
      <path d="M8 7.5 C8 5 9.5 4 11 4 C12.5 4 13 5 13 5" />
      <path d="M11 4 C11 6 9.5 7 8 7.5" />
    </Svg>
  ),

  // Four-leaf clover — four rounded lobes around center with stem
  clover: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 12 C12 9.5 10.5 6.5 8 6.5 C6 6.5 5 8 5 9.5 C5 11.5 7 12 9 12 Z" />
      <path d="M12 12 C14.5 12 17.5 10.5 17.5 8 C17.5 6 16 5 14.5 5 C12.5 5 12 7 12 9 Z" />
      <path d="M12 12 C9.5 12 6.5 13.5 6.5 16 C6.5 18 8 19 9.5 19 C11.5 19 12 17 12 15 Z" />
      <path d="M12 12 C12 14.5 13.5 17.5 16 17.5 C18 17.5 19 16 19 14.5 C19 12.5 17 12 15 12 Z" />
      <path d="M12 13 C12.5 17 14.5 19.5 17.5 21" />
    </Svg>
  ),

  // Disco ball — circle with facet grid and hanging line
  disco: (p: IconProps) => (
    <Svg {...p}>
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <circle cx="12" cy="13" r="8" />
      <line x1="4.5" y1="10" x2="19.5" y2="10" />
      <line x1="4" y1="13" x2="20" y2="13" />
      <line x1="4.5" y1="16" x2="19.5" y2="16" />
      <line x1="9" y1="5.5" x2="9" y2="20.5" />
      <line x1="12" y1="5" x2="12" y2="21" />
      <line x1="15" y1="5.5" x2="15" y2="20.5" />
    </Svg>
  ),

  // Electric guitar — angled body, neck, headstock
  guitar: (p: IconProps) => (
    <Svg {...p}>
      <path d="M19.5 4.5 L21 6" />
      <line x1="18.5" y1="5.5" x2="11" y2="13" />
      <path d="M11 13 C9.5 11.5 7 11 5.5 12.5 C4 14 4 16.5 5.5 18 C7 19.5 9.5 19.5 11 18 C12.5 16.5 12 14 11 13 Z" />
      <circle cx="8.25" cy="15.25" r="1.5" />
      <path d="M19.5 4.5 L20 3 L22 5 L20.5 5.5" />
    </Svg>
  ),

  // Rock-on hand — fist with index and pinky raised
  rockHand: (p: IconProps) => (
    <Svg {...p}>
      <path d="M8 21 C6 21 5 19.5 5 17.5 L5 11 C5 10 6 10 6 11 L6 13" />
      <path d="M6 12 L6 6 C6 5 7.5 5 7.5 6 L7.5 12.5" />
      <path d="M7.5 12 L7.5 11 C7.5 10 9 10 9 11 L9 13" />
      <path d="M9 12.5 L9 11 C9 10 10.5 10 10.5 11 L10.5 14" />
      <path d="M10.5 13 L10.5 6.5 C10.5 5.5 12 5.5 12 6.5 L12 14" />
      <path d="M5 13 L5 15 C5 17 6.5 18 8 18 L11 18 C12.5 18 12 16 12 14" />
    </Svg>
  ),

  // Sunglasses — two lenses with bridge and arms
  shades: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 9 L9.5 9 C10 9 10.5 9.5 10.5 10 L10.5 12.5 C10.5 14 9.5 15 8 15 L6 15 C4 15 3 13.5 3 11.5 Z" />
      <path d="M21 9 L14.5 9 C14 9 13.5 9.5 13.5 10 L13.5 12.5 C13.5 14 14.5 15 16 15 L18 15 C20 15 21 13.5 21 11.5 Z" />
      <path d="M10.5 10.5 C11 10 13 10 13.5 10.5" />
      <path d="M3 9.5 L1.5 7.5" />
      <path d="M21 9.5 L22.5 7.5" />
    </Svg>
  ),

  // Cowboy hat — crown and curved brim
  cowboy: (p: IconProps) => (
    <Svg {...p}>
      <path d="M7.5 14 C7.5 9 8 6 12 6 C16 6 16.5 9 16.5 14" />
      <path d="M2.5 14 C2.5 14 5 16 12 16 C19 16 21.5 14 21.5 14" />
      <path d="M7.5 14 C5.5 14 4 13.5 3 13 C3 13.5 2.7 14 2.5 14" />
      <path d="M16.5 14 C18.5 14 20 13.5 21 13 C21 13.5 21.3 14 21.5 14" />
    </Svg>
  ),

  // Alien head — wide head, big slanted eyes
  alien: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 3 C7.5 3 5 6 5 10 C5 15 8.5 21 12 21 C15.5 21 19 15 19 10 C19 6 16.5 3 12 3 Z" />
      <path d="M8 10 C8 9 9 8.5 9.5 9 C10.5 10 10.5 12.5 9.5 13 C8.5 13.5 8 12 8 10 Z" />
      <path d="M16 10 C16 9 15 8.5 14.5 9 C13.5 10 13.5 12.5 14.5 13 C15.5 13.5 16 12 16 10 Z" />
    </Svg>
  ),

  // Robot head — rounded box, antenna, eyes, mouth grille
  robot: (p: IconProps) => (
    <Svg {...p}>
      <line x1="12" y1="2.5" x2="12" y2="5" />
      <circle cx="12" cy="2" r="0.5" fill="currentColor" stroke="none" />
      <rect x="4.5" y="5" width="15" height="14" rx="3" />
      <circle cx="9" cy="11" r="1.25" />
      <circle cx="15" cy="11" r="1.25" />
      <line x1="9" y1="15.5" x2="15" y2="15.5" />
      <line x1="2.5" y1="10" x2="2.5" y2="14" />
      <line x1="21.5" y1="10" x2="21.5" y2="14" />
    </Svg>
  ),

  // Five-pointed star
  star: (p: IconProps) => (
    <Svg {...p}>
      <polygon points="12,3 14.6,9.2 21,9.7 16,14 17.6,20.5 12,16.8 6.4,20.5 8,14 3,9.7 9.4,9.2" />
    </Svg>
  ),

  // Rocket — body, fins, window, flame
  rocket: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 2.5 C15 5 16.5 9 16.5 13 L7.5 13 C7.5 9 9 5 12 2.5 Z" />
      <circle cx="12" cy="9" r="1.75" />
      <path d="M7.5 13 C6 13.5 4.5 15 4.5 17.5 L7.5 16 Z" />
      <path d="M16.5 13 C18 13.5 19.5 15 19.5 17.5 L16.5 16 Z" />
      <path d="M10 16.5 C10 18.5 10.5 20.5 12 22 C13.5 20.5 14 18.5 14 16.5" />
    </Svg>
  ),

  // Trophy — cup, handles, stem, base
  trophy: (p: IconProps) => (
    <Svg {...p}>
      <path d="M7 4 L17 4 L17 9 C17 12 15 14 12 14 C9 14 7 12 7 9 Z" />
      <path d="M7 5.5 L4 5.5 C4 8.5 5.5 10 7.5 10.5" />
      <path d="M17 5.5 L20 5.5 C20 8.5 18.5 10 16.5 10.5" />
      <line x1="12" y1="14" x2="12" y2="17.5" />
      <path d="M8.5 20.5 C8.5 18.5 10 17.5 12 17.5 C14 17.5 15.5 18.5 15.5 20.5 Z" />
    </Svg>
  ),

  // Beer mug — body, handle, foam, fill line
  beer: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6.5 9 L16 9 L16 20 C16 20.5 15.5 21 15 21 L7.5 21 C7 21 6.5 20.5 6.5 20 Z" />
      <path d="M16 11 L19 11 C19.5 11 20 11.5 20 12 L20 16 C20 16.5 19.5 17 19 17 L16 17" />
      <path d="M6.5 9 C6.5 6.5 8 5.5 9.5 6 C10 4.5 12 4.5 13 5.5 C15 5 16.5 6.5 16 8 C17 8.5 16.5 9 16 9" />
      <line x1="6.5" y1="12" x2="16" y2="12" />
    </Svg>
  ),

  // Anchor — ring, shank, crossbar, curved flukes
  anchor: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="20" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <path d="M5 13 C5 17.5 8 20.5 12 20.5 C16 20.5 19 17.5 19 13" />
      <polyline points="5,15.5 5,13 7.5,13" />
      <polyline points="19,15.5 19,13 16.5,13" />
    </Svg>
  ),

  // Ghost — rounded dome, wavy hem, eyes
  ghost: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 19.5 L5 11 C5 6.5 8 3.5 12 3.5 C16 3.5 19 6.5 19 11 L19 19.5 L16.5 17.5 L14 19.5 L12 17.5 L10 19.5 L7.5 17.5 Z" />
      <circle cx="9.5" cy="10.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10.5" r="1.25" fill="currentColor" stroke="none" />
    </Svg>
  ),
};
