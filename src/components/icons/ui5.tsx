import { Svg, type IconProps, type IconRegistry } from "./kit";

export const ui5: IconRegistry = {
  // Calendar grid with top tabs (binding rings)
  calendar: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <line x1="8" y1="3" x2="8" y2="6.5" />
      <line x1="16" y1="3" x2="16" y2="6.5" />
      <line x1="8" y1="13" x2="8" y2="13" />
      <line x1="12" y1="13" x2="12" y2="13" />
      <line x1="16" y1="13" x2="16" y2="13" />
      <line x1="8" y1="16.5" x2="8" y2="16.5" />
      <line x1="12" y1="16.5" x2="12" y2="16.5" />
    </Svg>
  ),

  // Clock face with hour + minute hands
  clock: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </Svg>
  ),

  // Map pin teardrop with dot
  pin: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 21.5C12 21.5 19 14.5 19 9.5A7 7 0 0 0 5 9.5C5 14.5 12 21.5 12 21.5Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Svg>
  ),

  // Megaphone / bullhorn
  megaphone: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3.5 10.5 L14 6 V18 L3.5 13.5 Z" />
      <path d="M3.5 10.5 H2.5 V13.5 H3.5" />
      <path d="M14 8.5 A4 4 0 0 1 14 15.5" />
      <path d="M6 14 V18 A1.5 1.5 0 0 0 9 18 V15.3" />
    </Svg>
  ),

  // Triangle play button
  play: (p: IconProps) => (
    <Svg {...p}>
      <path d="M7 4.5 L19 12 L7 19.5 Z" />
    </Svg>
  ),

  // List: three lines with bullet dots
  list: (p: IconProps) => (
    <Svg {...p}>
      <line x1="9" y1="7" x2="20" y2="7" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="17" x2="20" y2="17" />
      <circle cx="4.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17" r="1" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Bar chart
  chart: (p: IconProps) => (
    <Svg {...p}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="11" width="3.5" height="9" rx="0.5" />
      <rect x="11.5" y="6.5" width="3.5" height="13.5" rx="0.5" />
      <rect x="17" y="14" width="3.5" height="6" rx="0.5" />
    </Svg>
  ),

  // TV / monitor with stand
  tv: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <line x1="8.5" y1="20.5" x2="15.5" y2="20.5" />
      <line x1="12" y1="17" x2="12" y2="20.5" />
    </Svg>
  ),

  // Mail envelope
  envelope: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 7 L12 13 L20.5 7" />
    </Svg>
  ),

  // Ticket stub with side notches
  ticket: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 8.5 A1.5 1.5 0 0 1 4.5 7 H19.5 A1.5 1.5 0 0 1 21 8.5 V10 A2 2 0 0 0 21 14 V15.5 A1.5 1.5 0 0 1 19.5 17 H4.5 A1.5 1.5 0 0 1 3 15.5 V14 A2 2 0 0 0 3 10 Z" />
      <line x1="14" y1="7.5" x2="14" y2="16.5" strokeDasharray="1.5 2" />
    </Svg>
  ),

  // Eye
  eye: (p: IconProps) => (
    <Svg {...p}>
      <path d="M2.5 12 C5 7 9 5 12 5 C15 5 19 7 21.5 12 C19 17 15 19 12 19 C9 19 5 17 2.5 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  ),

  // Folded map
  map: (p: IconProps) => (
    <Svg {...p}>
      <path d="M9 4.5 L3.5 6.5 V19.5 L9 17.5 L15 19.5 L20.5 17.5 V4.5 L15 6.5 Z" />
      <line x1="9" y1="4.5" x2="9" y2="17.5" />
      <line x1="15" y1="6.5" x2="15" y2="19.5" />
    </Svg>
  ),

  // Folder
  folder: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 6.5 A1.5 1.5 0 0 1 4.5 5 H9 L11.5 8 H19.5 A1.5 1.5 0 0 1 21 9.5 V17.5 A1.5 1.5 0 0 1 19.5 19 H4.5 A1.5 1.5 0 0 1 3 17.5 Z" />
    </Svg>
  ),

  // Raised hand (palm forward, fingers up)
  handRaise: (p: IconProps) => (
    <Svg {...p}>
      <path d="M7 12.5 V6.5 A1.25 1.25 0 0 1 9.5 6.5 V11" />
      <path d="M9.5 11 V4.5 A1.25 1.25 0 0 1 12 4.5 V11" />
      <path d="M12 11 V5 A1.25 1.25 0 0 1 14.5 5 V11.5" />
      <path d="M14.5 11.5 V7.5 A1.25 1.25 0 0 1 17 7.5 V15 A6 6 0 0 1 11 21 A6 6 0 0 1 5.5 17.5 L4 14.5 A1.3 1.3 0 0 1 6.3 13.3 L7 14.5" />
    </Svg>
  ),

  // Waving hand (simple open-hand outline with motion lines)
  wave: (p: IconProps) => (
    <Svg {...p}>
      <path d="M9 13.5 V7 A1.2 1.2 0 0 1 11.4 7 V11.5" />
      <path d="M11.4 11.5 V5.5 A1.2 1.2 0 0 1 13.8 5.5 V11.5" />
      <path d="M13.8 11.5 V7 A1.2 1.2 0 0 1 16.2 7 V13.5" />
      <path d="M16.2 13.5 V9.5 A1.2 1.2 0 0 1 18.5 9.5 V15 A6 6 0 0 1 7 17.5 L5.8 15 A1.25 1.25 0 0 1 8 13.8 L9 15.5" />
      <path d="M4 6.5 L5.5 8" />
      <path d="M3 11 L5 11.5" />
    </Svg>
  ),
};
