import { Svg, type IconProps, type IconRegistry } from "./kit";

export const ui6: IconRegistry = {
  // Construction — hard hat
  construction: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 17 A8 8 0 0 1 20 17" />
      <path d="M10 9.5 A3 3 0 0 1 14 9.5" />
      <line x1="2.5" y1="17" x2="21.5" y2="17" />
      <line x1="2.5" y1="20.5" x2="21.5" y2="20.5" />
    </Svg>
  ),

  // Scale — balance scale
  scale: (p: IconProps) => (
    <Svg {...p}>
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="5.5" y1="6" x2="18.5" y2="6" />
      <circle cx="12" cy="4" r="1.25" />
      <path d="M2.5 12 L5.5 6 L8.5 12 A3 3 0 0 1 2.5 12 Z" />
      <path d="M15.5 12 L18.5 6 L21.5 12 A3 3 0 0 1 15.5 12 Z" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </Svg>
  ),

  // Traffic light with 3 dots
  traffic: (p: IconProps) => (
    <Svg {...p}>
      <rect x="7" y="2.5" width="10" height="19" rx="3" />
      <circle cx="12" cy="7" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="17" r="1.5" />
    </Svg>
  ),

  // Compass with needle
  compass: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16,8 10.5,10.5 8,16 13.5,13.5" />
    </Svg>
  ),

  // Clipboard with clip
  clipboard: (p: IconProps) => (
    <Svg {...p}>
      <path d="M9 3.5 H15 A1.5 1.5 0 0 1 16.5 5 V5.5 H7.5 V5 A1.5 1.5 0 0 1 9 3.5 Z" />
      <path d="M7.5 5 H6 A2 2 0 0 0 4 7 V19 A2 2 0 0 0 6 21 H18 A2 2 0 0 0 20 19 V7 A2 2 0 0 0 18 5 H16.5" />
    </Svg>
  ),

  // Open book
  book: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 6 C10 4.5 6.5 4 4 4.5 V18.5 C6.5 18 10 18.5 12 20" />
      <path d="M12 6 C14 4.5 17.5 4 20 4.5 V18.5 C17.5 18 14 18.5 12 20" />
      <line x1="12" y1="6" x2="12" y2="20" />
    </Svg>
  ),

  // Image — picture with mountain + sun
  image: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M4 16.5 L9.5 11.5 L13.5 15 L16.5 12.5 L20 16.5" />
    </Svg>
  ),

  // Film strip
  film: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <line x1="7.5" y1="4" x2="7.5" y2="20" />
      <line x1="16.5" y1="4" x2="16.5" y2="20" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="8" x2="7.5" y2="8" />
      <line x1="3" y1="16" x2="7.5" y2="16" />
      <line x1="16.5" y1="8" x2="21" y2="8" />
      <line x1="16.5" y1="16" x2="21" y2="16" />
    </Svg>
  ),

  // Video camera
  video: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="7" width="12" height="10" rx="2" />
      <path d="M15 10.5 L21 7.5 V16.5 L15 13.5" />
    </Svg>
  ),

  // Photo — picture frame
  photo: (p: IconProps) => (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <rect x="7" y="7" width="10" height="10" rx="0.5" />
      <circle cx="9.5" cy="10.5" r="1" />
      <path d="M7.5 16.5 L11 12.5 L13.5 15 L15 13.5 L16.5 15" />
    </Svg>
  ),

  // Key
  key: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="7.5" cy="7.5" r="4" />
      <line x1="10.5" y1="10.5" x2="20" y2="20" />
      <line x1="16.5" y1="16.5" x2="14.5" y2="18.5" />
      <line x1="18.5" y1="18.5" x2="16.5" y2="20.5" />
    </Svg>
  ),

  // Heart outline
  heart: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 20.5 L4.5 13 A4.5 4.5 0 0 1 12 8 A4.5 4.5 0 0 1 19.5 13 Z" />
    </Svg>
  ),

  // Rocket
  rocket: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 2.5 C15.5 5 17 9 17 13 L7 13 C7 9 8.5 5 12 2.5 Z" />
      <circle cx="12" cy="9" r="1.75" />
      <path d="M7 13 L4 16 L7 16.5" />
      <path d="M17 13 L20 16 L17 16.5" />
      <path d="M10 16.5 C10 19 12 21.5 12 21.5 C12 21.5 14 19 14 16.5" />
    </Svg>
  ),

  // Sad face
  sad: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 16 A4 4 0 0 1 15.5 16" />
      <line x1="9" y1="9.5" x2="9.5" y2="9.5" />
      <line x1="14.5" y1="9.5" x2="15" y2="9.5" />
    </Svg>
  ),

  // Thinking — face with question
  thinking: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <line x1="8.5" y1="9.5" x2="9" y2="9.5" />
      <line x1="13" y1="15.5" x2="16" y2="15.5" />
      <path d="M13 10 A1.75 1.75 0 1 1 15 11.75 C14.25 12.25 14.25 13 14.25 13.25" />
    </Svg>
  ),

  // Info — i in a circle
  info: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <line x1="12" y1="7.5" x2="12" y2="8" />
    </Svg>
  ),

  // Shrug — simple shrugging figure
  shrug: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M12 10 V15" />
      <path d="M12 11.5 L7 13.5 L5.5 10" />
      <path d="M12 11.5 L17 13.5 L18.5 10" />
      <path d="M9.5 15 L8.5 20.5" />
      <path d="M14.5 15 L15.5 20.5" />
    </Svg>
  ),
};
