import { Svg, type IconProps, type IconRegistry } from "./kit";

export const ui3: IconRegistry = {
  bolt: (p: IconProps) => (
    <Svg {...p}>
      <polygon points="13,2 4,13.5 11,13.5 11,22 20,10.5 13,10.5" />
    </Svg>
  ),
  plus: (p: IconProps) => (
    <Svg {...p}>
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </Svg>
  ),
  minus: (p: IconProps) => (
    <Svg {...p}>
      <line x1="4" y1="12" x2="20" y2="12" />
    </Svg>
  ),
  edit: (p: IconProps) => (
    <Svg {...p}>
      <path d="M14.5 5.5 L18.5 9.5 L9 19 L4.5 19.5 L5 15 Z" />
      <line x1="4" y1="22" x2="20" y2="22" />
    </Svg>
  ),
  trash: (p: IconProps) => (
    <Svg {...p}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <path d="M9 6 V4 H15 V6" />
      <path d="M6 6 L7 20 H17 L18 6" />
      <line x1="10" y1="10" x2="10" y2="16" />
      <line x1="14" y1="10" x2="14" y2="16" />
    </Svg>
  ),
  refresh: (p: IconProps) => (
    <Svg {...p}>
      <path d="M20 7 A8.5 8.5 0 1 0 21 14" />
      <polyline points="20,3 20,7 16,7" />
    </Svg>
  ),
  check: (p: IconProps) => (
    <Svg {...p}>
      <polyline points="4,12.5 9.5,18 20,6" />
    </Svg>
  ),
  close: (p: IconProps) => (
    <Svg {...p}>
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
      <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
    </Svg>
  ),
  share: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <line x1="8.2" y1="10.8" x2="15.8" y2="6.7" />
      <line x1="8.2" y1="13.2" x2="15.8" y2="17.3" />
    </Svg>
  ),
  link: (p: IconProps) => (
    <Svg {...p}>
      <path d="M10 14 A4 4 0 0 1 10 8.5 L13 5.5 A4 4 0 0 1 18.5 11 L17 12.5" />
      <path d="M14 10 A4 4 0 0 1 14 15.5 L11 18.5 A4 4 0 0 1 5.5 13 L7 11.5" />
    </Svg>
  ),
  copy: (p: IconProps) => (
    <Svg {...p}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8 V5 A1.5 1.5 0 0 0 14.5 3.5 H5 A1.5 1.5 0 0 0 3.5 5 V14.5 A1.5 1.5 0 0 0 5 16 H8" />
    </Svg>
  ),
  bell: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 17 V11 A6 6 0 0 1 18 11 V17 L20 19 H4 Z" />
      <path d="M10 19 A2 2 0 0 0 14 19" />
    </Svg>
  ),
  gear: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5 V5 M12 19 V21.5 M21.5 12 H19 M5 12 H2.5 M18.7 5.3 L16.9 7.1 M7.1 16.9 L5.3 18.7 M18.7 18.7 L16.9 16.9 M7.1 7.1 L5.3 5.3" />
    </Svg>
  ),
  sliders: (p: IconProps) => (
    <Svg {...p}>
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="16" x2="21" y2="16" />
      <circle cx="9" cy="8" r="2.5" />
      <circle cx="15" cy="16" r="2.5" />
    </Svg>
  ),
  save: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 5.5 A1.5 1.5 0 0 1 5.5 4 H16 L20 8 V18.5 A1.5 1.5 0 0 1 18.5 20 H5.5 A1.5 1.5 0 0 1 4 18.5 Z" />
      <path d="M7.5 4 V8.5 H15 V4" />
      <rect x="8" y="12" width="8" height="6" rx="1" />
    </Svg>
  ),
  pencil: (p: IconProps) => (
    <Svg {...p}>
      <path d="M16 4 L20 8 L9 19 L4 20 L5 15 Z" />
      <line x1="13.5" y1="6.5" x2="17.5" y2="10.5" />
    </Svg>
  ),
};
