import type { GameArtProps } from "./types";
import { PongArt } from "./PongArt";
import { FlipCupArt } from "./FlipCupArt";
import { BeerDieArt } from "./BeerDieArt";
import { SnappaArt } from "./SnappaArt";
import { BoatRaceArt } from "./BoatRaceArt";
import { QuartersArt } from "./QuartersArt";
import { CivilWarArt } from "./CivilWarArt";
import { StackCupArt } from "./StackCupArt";
import { FuckYaBuddyArt } from "./FuckYaBuddyArt";
import { CornholeArt } from "./CornholeArt";
import { SpikeballArt } from "./SpikeballArt";
import { LadderGolfArt } from "./LadderGolfArt";
import { CrispyWicketsArt } from "./CrispyWicketsArt";
import { KanJamArt } from "./KanJamArt";
import { WheelArt } from "./WheelArt";
import { KegStandArt } from "./KegStandArt";
import { KaraokeArt } from "./KaraokeArt";

export type { GameArtProps } from "./types";

/** Neon fallback used for any game without a custom art key. */
export function DefaultArt({ size = 96, className, title = "Game" }: GameArtProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <title>{title}</title>
      <defs>
        <filter id="def-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#def-glow)" stroke="#ffd24d" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="48" cy="40" r="18" fill="#f7b73314" />
        <path d="M36 24 L30 10 M60 24 L66 10" />
        <path d="M40 58 L40 72 L56 72 L56 58" />
        <path d="M34 80 L62 80" />
      </g>
      <circle cx="48" cy="40" r="22" stroke="#2ad4ff" strokeWidth="1.4" opacity="0">
        <animate attributeName="r" values="14;26" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** Maps a game's `art` key to its animated neon SVG. */
const REGISTRY: Record<string, (p: GameArtProps) => React.ReactElement> = {
  pong: PongArt,
  flipcup: FlipCupArt,
  beerdie: BeerDieArt,
  snappa: SnappaArt,
  boatrace: BoatRaceArt,
  quarters: QuartersArt,
  civilwar: CivilWarArt,
  stackcup: StackCupArt,
  fuckyabuddy: FuckYaBuddyArt,
  cornhole: CornholeArt,
  spikeball: SpikeballArt,
  laddergolf: LadderGolfArt,
  crispywickets: CrispyWicketsArt,
  kanjam: KanJamArt,
  wheel: WheelArt,
  kegstand: KegStandArt,
  karaoke: KaraokeArt,
};

/** Render the animated art for a game by its `art` key (falls back to neon default). */
export function GameArt({
  artKey,
  ...props
}: GameArtProps & { artKey?: string | null }) {
  const Cmp = (artKey && REGISTRY[artKey]) || DefaultArt;
  return <Cmp {...props} />;
}
