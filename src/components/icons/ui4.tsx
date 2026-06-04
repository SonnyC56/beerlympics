import { Svg, type IconProps, type IconRegistry } from "./kit";

export const ui4: IconRegistry = {
  // padlock closed
  lock: (p: IconProps) => (
    <Svg {...p}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11 V7.5 a4 4 0 0 1 8 0 V11" />
      <line x1="12" y1="14.5" x2="12" y2="16.5" />
    </Svg>
  ),

  // padlock open (shackle swung to the side)
  unlock: (p: IconProps) => (
    <Svg {...p}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11 V7.5 a4 4 0 0 1 7.5 -2" />
      <line x1="12" y1="14.5" x2="12" y2="16.5" />
    </Svg>
  ),

  // live: filled center dot with a ring
  live: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="7.5" />
    </Svg>
  ),

  // warning: triangle with exclamation
  warning: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 4 L21 19 H3 Z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // alert: octagon with exclamation
  alert: (p: IconProps) => (
    <Svg {...p}>
      <polygon points="8.5,3.5 15.5,3.5 20.5,8.5 20.5,15.5 15.5,20.5 8.5,20.5 3.5,15.5 3.5,8.5" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <circle cx="12" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // sparkle: 4-point star
  sparkle: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 3 C12.5 8.5 15.5 11.5 21 12 C15.5 12.5 12.5 15.5 12 21 C11.5 15.5 8.5 12.5 3 12 C8.5 11.5 11.5 8.5 12 3 Z" />
    </Svg>
  ),

  // party popper cone with bits
  party: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 20 L9.5 8.5 L15.5 14.5 Z" />
      <line x1="14.5" y1="4.5" x2="14.5" y2="6.5" />
      <line x1="18" y1="6" x2="16.5" y2="7.5" />
      <line x1="19.5" y1="9.5" x2="17.5" y2="9.5" />
      <circle cx="20" cy="14" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="13" cy="18.5" r="0.7" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // arrow right
  arrowRight: (p: IconProps) => (
    <Svg {...p}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14,6 20,12 14,18" />
    </Svg>
  ),

  // arrow left
  arrowLeft: (p: IconProps) => (
    <Svg {...p}>
      <line x1="20" y1="12" x2="4" y2="12" />
      <polyline points="10,6 4,12 10,18" />
    </Svg>
  ),

  // chevron down
  chevronDown: (p: IconProps) => (
    <Svg {...p}>
      <polyline points="5,9 12,16 19,9" />
    </Svg>
  ),

  // back: left arrow
  back: (p: IconProps) => (
    <Svg {...p}>
      <line x1="20" y1="12" x2="5" y2="12" />
      <polyline points="11,6 5,12 11,18" />
    </Svg>
  ),

  // star: filled
  star: (p: IconProps) => (
    <Svg {...p}>
      <polygon
        points="12,3 14.6,9.1 21,9.7 16.1,13.9 17.7,20 12,16.6 6.3,20 7.9,13.9 3,9.7 9.4,9.1"
        fill="currentColor"
        stroke="none"
      />
    </Svg>
  ),

  // star: outline
  starOutline: (p: IconProps) => (
    <Svg {...p}>
      <polygon points="12,3 14.6,9.1 21,9.7 16.1,13.9 17.7,20 12,16.6 6.3,20 7.9,13.9 3,9.7 9.4,9.1" />
    </Svg>
  ),

  // qr code grid
  qr: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <line x1="14.5" y1="14.5" x2="14.5" y2="17.5" />
      <line x1="20.5" y1="14.5" x2="20.5" y2="18.5" />
      <line x1="14.5" y1="20.5" x2="18" y2="20.5" />
      <circle cx="17.5" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="20.5" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // google: stylized G mark
  google: (p: IconProps) => (
    <Svg {...p}>
      <path d="M19 8 a8 8 0 1 0 1.5 7 H12" />
    </Svg>
  ),
};
