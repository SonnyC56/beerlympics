/** Props every animated game-art SVG accepts. */
export type GameArtProps = {
  /** Pixel size (the SVG is square). Defaults to 96. */
  size?: number;
  className?: string;
  /** Accessible title; defaults to the game name. */
  title?: string;
};

/**
 * NEON LINE-ART STYLE CONTRACT (every game art follows this):
 * - viewBox="0 0 96 96", width/height = size (default 96).
 * - Transparent background (the card behind provides the dark surface).
 * - Thin glowing strokes (stroke-width 2–3, round caps/joins), NO heavy fills.
 * - Palette: gold #ffd24d primary; accents cyan #2ad4ff, flame #ff4d6d,
 *   lime #b6ff3d, grape #b388ff (use 1–2 accents per game).
 * - A soft glow via an inline <filter> with feGaussianBlur.
 * - Subtle, looping motion via SMIL (<animate>/<animateTransform>/<animateMotion>,
 *   repeatCount="indefinite", gentle 2–6s durations).
 * - CRITICAL: every id inside <defs> (filters, gradients, paths) MUST be prefixed
 *   with the art key (e.g. id="pong-glow") so multiple arts can render together
 *   on the library page without id collisions.
 * - role="img" + a <title> for accessibility.
 */
