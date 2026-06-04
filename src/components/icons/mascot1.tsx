import { Svg, type IconProps, type MascotRegistry } from "./kit";

export const mascot1: MascotRegistry = {
  // Lion face with mane: ring of points around a round face
  lion: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 3.5 L12 6.5" />
      <path d="M20.5 12 L17.5 12" />
      <path d="M3.5 12 L6.5 12" />
      <path d="M12 20.5 L12 17.5" />
      <path d="M6 6 L8 8" />
      <path d="M18 6 L16 8" />
      <path d="M6 18 L8 16" />
      <path d="M18 18 L16 16" />
      <circle cx="10" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <path d="M10.5 14 Q12 15.5 13.5 14" />
    </Svg>
  ),

  // Dragon head: angular snout, horn, eye, jaw, flame breath
  dragon: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 16 Q4 9 11 8 L13 5 L13.5 8 Q19 8.5 19 13 L17 13 Q17 11 14 11 L14 14 Q14 17 10 17 Z" />
      <path d="M13 5 L11.5 3.5" />
      <circle cx="11" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <path d="M19 13 L21.5 12 L20 14 L22 14" />
      <path d="M8 17 L8 19.5" />
      <path d="M11 17 L11 19" />
    </Svg>
  ),

  // Eagle head: hooked beak, head, eye, brow
  eagle: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 18 Q4 11 10 8 Q14 6 16 9" />
      <path d="M16 9 L21 10.5 L17 12.5 Q19 14 16.5 14.5" />
      <path d="M16 9 Q17 12 16.5 14.5" />
      <path d="M6 18 Q9 16.5 13.5 15 Q16 14 16.5 14.5" />
      <circle cx="13.5" cy="10.5" r="0.7" fill="currentColor" stroke="none" />
      <path d="M9.5 9 Q12.5 7.5 15 8.5" />
    </Svg>
  ),

  // Shark: triangular dorsal fin above water lines with body curve
  shark: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 4 Q12 11 18 14 L6 14 Q12 11 12 4 Z" />
      <path d="M3 18 Q6 16.5 9 18 T15 18 T21 18" />
      <path d="M3 21 Q6 19.5 9 21 T15 21 T21 21" />
    </Svg>
  ),

  // Wolf head: angular face, two ears, snout, eyes
  wolf: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 7 L7.5 11 L8 9 L12 12.5 L16 9 L16.5 11 L19 7 L18 13 Q18 18 12 19 Q6 18 6 13 Z" />
      <path d="M12 12.5 L12 16" />
      <path d="M12 16 L10.5 17.5" />
      <path d="M12 16 L13.5 17.5" />
      <circle cx="9.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Snake: coiled spiral with head and forked tongue
  snake: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 21 Q3 21 3 15 Q3 9 9 9 Q14 9 14 13 Q14 16 11 16 Q9 16 9 14" />
      <path d="M3 15 Q3 6 11 6 Q18 6 18 11" />
      <path d="M18 11 L18 7.5" />
      <path d="M18 7.5 L16.5 6" />
      <path d="M18 7.5 L19.5 6" />
      <circle cx="17" cy="9.5" r="0.55" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Dino (T-rex head): big jaw, teeth, eye, tiny arm
  dino: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 6 Q16 5 17 13 L21 13 L18.5 15.5 Q18 19 13 19 L6 19 Q4 19 4 17 L4 9 Q4 6 5 6 Z" />
      <path d="M9 19 L9.5 17 L11 19 L11.5 17 L13 19" />
      <circle cx="8" cy="9.5" r="0.7" fill="currentColor" stroke="none" />
      <path d="M16 14 L14 14 L15 16" />
    </Svg>
  ),

  // Octopus: round head, two eyes, wavy tentacles
  octopus: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 12 Q5 5 12 5 Q19 5 19 12 L19 14" />
      <path d="M5 12 L5 14" />
      <circle cx="9.5" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <path d="M5 14 Q4 17 6 18 Q4.5 19.5 6 20" />
      <path d="M8.5 14.5 Q8 18 9.5 19 Q8.5 20.5 10 21" />
      <path d="M12 15 L12 21" />
      <path d="M15.5 14.5 Q16 18 14.5 19 Q15.5 20.5 14 21" />
      <path d="M19 14 Q20 17 18 18 Q19.5 19.5 18 20" />
    </Svg>
  ),

  // Unicorn head: horse-like profile with spiral horn and ear
  unicorn: (p: IconProps) => (
    <Svg {...p}>
      <path d="M7 19 Q5 12 9 9 L11 9 L13.5 5.5 L14.5 9 Q18 11 16 16 L15 16 Q15 19 11 19 Z" />
      <path d="M11 4 L13 9 L9 7.5 L13 6 L9.5 4.5" />
      <path d="M14.5 9 L17 7" />
      <circle cx="12.5" cy="11.5" r="0.65" fill="currentColor" stroke="none" />
      <path d="M9 19 L9 21" />
      <path d="M13 19 L13 21" />
    </Svg>
  ),

  // Bee: striped oval body, wings, head with antennae, stinger
  bee: (p: IconProps) => (
    <Svg {...p}>
      <ellipse cx="12" cy="14" rx="4.5" ry="5.5" />
      <path d="M7.7 12 L16.3 12" />
      <path d="M8 16 L16 16" />
      <path d="M9.5 8.5 Q5 7 5.5 11" />
      <path d="M14.5 8.5 Q19 7 18.5 11" />
      <path d="M10 6 L8.5 4" />
      <path d="M14 6 L15.5 4" />
      <circle cx="10" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Skull: cranium, two eye sockets, nose, teeth line
  skull: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 11 Q5 4 12 4 Q19 4 19 11 Q19 14.5 16 16 L16 18 Q16 19 15 19 L9 19 Q8 19 8 18 L8 16 Q5 14.5 5 11 Z" />
      <circle cx="9.5" cy="11" r="1.8" />
      <circle cx="14.5" cy="11" r="1.8" />
      <path d="M12 13.5 L11 15.5 L13 15.5 Z" />
      <path d="M10 19 L10 16.5" />
      <path d="M12 19 L12 16.5" />
      <path d="M14 19 L14 16.5" />
    </Svg>
  ),

  // Crown: classic five-point crown with base band and gems
  crown: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 8 L7 13 L12 6 L17 13 L20 8 L18 18 L6 18 Z" />
      <path d="M6 18 L18 18" />
      <circle cx="4" cy="8" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="20" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  ),

  // Diamond / gem: faceted brilliant cut
  diamond: (p: IconProps) => (
    <Svg {...p}>
      <path d="M6 9 L9 5 L15 5 L18 9 L12 20 Z" />
      <path d="M6 9 L18 9" />
      <path d="M9 5 L10.5 9 L12 20" />
      <path d="M15 5 L13.5 9 L12 20" />
    </Svg>
  ),

  // Bolt: lightning flash
  bolt: (p: IconProps) => (
    <Svg {...p}>
      <path d="M13 3 L5 13 L11 13 L9.5 21 L18 10 L12 10 Z" />
    </Svg>
  ),

  // Fire: flame with inner curl
  fire: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12 3 Q14 7 16 9 Q19 12 17.5 16 Q16 20 12 20.5 Q8 20 6.5 16 Q5.5 13 7.5 11 Q8 13 9.5 13 Q8.5 9 12 3 Z" />
      <path d="M12 20.5 Q9.5 19 9.5 16.5 Q9.5 14.5 12 13 Q14.5 14.5 14.5 16.5 Q14.5 19 12 20.5 Z" />
    </Svg>
  ),
};
