/**
 * The Beerlympics game library. Each entry seeds a `games` row (rules are stored
 * on the doc so they're available to everyone who joins) and an `art` key that
 * the frontend maps to an animated neon SVG. Hosts include/exclude games via the
 * `enabled` flag in the game manager.
 */
export type CatalogGame = {
  key: string;
  name: string;
  aliases?: string[]; // prior names — the backfill matches + renames these
  emoji: string;
  category: "drinking" | "lawn";
  format: "single_elim" | "round_robin" | "heats" | "wheel" | "special";
  teamsPerMatch: number;
  pointsMultiplier: number;
  estMinutes: number;
  gated?: boolean;
  gateFromPhaseIndex?: number;
  art: string; // key into src/components/gameArt registry
  stations: number; // how many parallel tables to seed
  enabled?: boolean; // default true
  blurb: string;
  rules: string[];
  wheelSpots?: WheelSpot[]; // only for format "wheel"
};

export type WheelSpot = {
  label: string;
  points?: number;
  color?: string;
  // When true, landing here fires an "everybody drinks" push to everyone.
  broadcast?: boolean;
};

/** Default 18 spots for The Wheel — a mix of point bonuses, penalties, and dares. */
export const DEFAULT_WHEEL_SPOTS: WheelSpot[] = [
  { label: "+100", points: 100 },
  { label: "Waterfall", broadcast: true },
  { label: "+25", points: 25 },
  { label: "Shotgun a Beer", broadcast: true },
  { label: "+50", points: 50 },
  { label: "Everyone Drinks", broadcast: true },
  { label: "Dealer's Choice" },
  { label: "+75", points: 75 },
  { label: "Lose 25", points: -25 },
  { label: "Truth or Dare" },
  { label: "Double Up" },
  { label: "+50", points: 50 },
  { label: "Captain Chugs", broadcast: true },
  { label: "Wildcard" },
  { label: "+25", points: 25 },
  { label: "Spin Again" },
  { label: "Power Hour", broadcast: true },
  { label: "+10", points: 10 },
];

export const GAME_CATALOG: CatalogGame[] = [
  // ── DRINKING GAMES — cup & table (skill) ────────────────────────────────────
  {
    key: "pong",
    name: "Beer Pong",
    emoji: "🏓",
    category: "drinking",
    format: "single_elim",
    teamsPerMatch: 2,
    pointsMultiplier: 1.2,
    estMinutes: 12,
    art: "pong",
    stations: 2,
    blurb: "The classic. Sink ping pong balls in the other team's cups.",
    rules: [
      "Two teams, 10 cups in a triangle on each end of the table.",
      "Teams alternate throwing ping pong balls at the opponent's cups.",
      "Sink a ball → opponents drink that cup and pull it off the table.",
      "Make both shots in a turn → balls back, shoot again.",
      "Re-racks: each team may call a re-rack (e.g. at 6, 3, and 1 cups).",
      "Clear all the opponent's cups to win. Redemption: the trailing team gets one last turn to tie and force overtime.",
    ],
  },
  {
    key: "flipcup",
    name: "Flip Cup",
    emoji: "🥤",
    category: "drinking",
    format: "single_elim",
    teamsPerMatch: 2,
    pointsMultiplier: 1.0,
    estMinutes: 6,
    art: "flipcup",
    stations: 2,
    blurb: "A chaotic team relay. Chug, flip, pass it down the line.",
    rules: [
      "Teams line up across the table, one cup of beer each.",
      "On 'go', the lead players chug, set the cup at the table edge, and flip it upside-down with a flick of the rim.",
      "Land it cup-down → the next teammate goes. Miss → keep flipping.",
      "First team to flip the entire line wins the round.",
      "Best of 3 races decides the match.",
    ],
  },
  {
    key: "beerdie",
    name: "Beer Die",
    emoji: "🎲",
    category: "drinking",
    format: "single_elim",
    teamsPerMatch: 2,
    pointsMultiplier: 1.6,
    estMinutes: 22,
    gated: true,
    gateFromPhaseIndex: 2,
    art: "beerdie",
    stations: 1,
    blurb: "The marquee finale. Arc a die over the table — and catch theirs.",
    rules: [
      "2v2 across a square table, a cup near each player's corner.",
      "Toss the die underhand in an arc above eye-level, aiming for the table or the opponents' cups.",
      "Opponents try to catch the die one-handed after it bounces off the table.",
      "Score on: the die off the far end (sink), valid tosses they fail to catch, and landing in a cup (plonk).",
      "Drink penalties for drops, missed catches, and getting sunk.",
      "Play to a set score (e.g. 7, win by 2). The longest game of the day — that's why it's reserved for the Semifinals & Final.",
    ],
  },

  // ── DRINKING GAMES — circle & chaos ─────────────────────────────────────────
  {
    key: "civilwar",
    name: "Civil War",
    emoji: "⚔️",
    category: "drinking",
    format: "single_elim",
    teamsPerMatch: 2,
    pointsMultiplier: 0.9,
    estMinutes: 10,
    art: "civilwar",
    stations: 1,
    blurb: "3v3 pong with no turns — everyone shoots at once. Mayhem.",
    rules: [
      "3v3, each player with their own row of cups. No turns — everyone shoots continuously.",
      "Sink a cup → opponents drink it and pull it. Bounce shots count for two but can be swatted.",
      "Lose all your cups and you're knocked out of the round.",
      "Last team with any cups (and players) standing wins.",
    ],
  },
  {
    key: "stackcup",
    name: "Stack Cup",
    emoji: "🥡",
    category: "drinking",
    format: "heats",
    teamsPerMatch: 4,
    pointsMultiplier: 0.8,
    estMinutes: 10,
    art: "stackcup",
    stations: 1,
    blurb: "Make your cup, stack it, chase the player ahead. Dodge the death cup.",
    rules: [
      "Players around the table each bounce a ball into their own cup, then stack it onto a central pile and pass left.",
      "Catch the player ahead of you and land your cup on theirs → they drink.",
      "One cup is the 'death cup' (often colored). Make it and the round ends — the slowest player drinks.",
      "Heats of up to 4 teams; rank by who survives longest.",
    ],
  },

  {
    key: "fuckyabuddy",
    name: "Fuck Yeah Buddy",
    aliases: ["Fuck Ya Buddy"],
    emoji: "🙌",
    category: "drinking",
    format: "heats",
    teamsPerMatch: 8,
    pointsMultiplier: 0.8,
    estMinutes: 8,
    art: "fuckyabuddy",
    stations: 1,
    blurb: "Partners flip & catch the cup, then smack hands. Slowest team loses a life.",
    rules: [
      "Teams play as pairs — the two partners stand across the table from each other. Lots of teams go at the same time.",
      "Each round, both partners take a small drink.",
      "One partner flips their cup so it does exactly one full rotation in the air — and their partner has to catch it.",
      "The instant it's caught, both partners yell 'FUCK YEAH BUDDY!' and smack hands. The hand smack is the real finish line — that's the moment that counts.",
      "The last team to land the catch + hand smack loses a life. Every team has three lives — lose all three and you're out. Last team standing wins.",
    ],
  },

  // ── LAWN GAMES (outdoor / big) ──────────────────────────────────────────────
  {
    key: "spikeball",
    name: "Spikeball",
    emoji: "🏐",
    category: "lawn",
    format: "single_elim",
    teamsPerMatch: 2,
    pointsMultiplier: 1.2,
    estMinutes: 16,
    art: "spikeball",
    stations: 1,
    blurb: "2v2 around a round net. Three touches, then spike it back down.",
    rules: [
      "2v2 around a circular trampoline net. Serve to a receiver to start.",
      "Each team gets up to 3 touches to bounce the ball back onto the net.",
      "Point scored when the ball hits the ground, rims off, or comes back awkwardly.",
      "No boundaries — move freely around the net. Play to 21, win by 2.",
    ],
  },
  {
    key: "laddergolf",
    name: "Ladder Golf",
    emoji: "🪜",
    category: "lawn",
    format: "single_elim",
    teamsPerMatch: 2,
    pointsMultiplier: 1.1,
    estMinutes: 14,
    art: "laddergolf",
    stations: 1,
    blurb: "Toss bolas at the ladder. Top rung is worth the most. Hit 21 exactly.",
    rules: [
      "Teams toss bolas (two balls on a string) at a 3-rung ladder.",
      "Top rung = 3 points, middle = 2, bottom = 1.",
      "Cancellation scoring each round, like cornhole.",
      "You must land on exactly 21 — overshoot and you bust back to your previous safe score.",
    ],
  },
  {
    key: "crispywickets",
    name: "Crispy Wickets",
    emoji: "🥏",
    category: "lawn",
    format: "single_elim",
    teamsPerMatch: 2,
    pointsMultiplier: 1.2,
    estMinutes: 18,
    art: "crispywickets",
    stations: 1,
    blurb: "Frisbee disc-cricket — knock the cups off the poles, or thread the gap.",
    rules: [
      "Also called Fricket. Two poles ('wickets') stand ~15 inches apart on each side, with a cup balanced on top of each — the two goals are about 40 feet apart.",
      "2v2. Teams alternate throwing the disc at the opposing team's wickets.",
      "Knock a cup off and it hits the ground → the throwing team scores 1 point.",
      "The defending team catches a knocked-off cup one-handed before it lands → the defending team scores 1 point.",
      "Sail the disc cleanly between the two poles without touching them → the throwing team scores 2 points.",
      "Play to 11, 15, or 21 (your call), switching sides at the halfway mark.",
    ],
  },
  {
    key: "kanjam",
    name: "KanJam",
    emoji: "🥫",
    category: "lawn",
    format: "single_elim",
    teamsPerMatch: 2,
    pointsMultiplier: 1.2,
    estMinutes: 16,
    art: "kanjam",
    stations: 1,
    blurb: "2v2 disc-and-can — throw, deflect, and jam the frisbee into the goal.",
    rules: [
      "2v2 with two slotted cans (goals) about 50 feet apart. Partners stand at opposite cans.",
      "One player throws the disc toward the far can; their partner standing there may deflect or redirect it.",
      "Scoring: a deflect that hits the can = 1 (dinger). A direct hit off your own throw = 2 (deuce). Partner deflects it into the can = 3 (bucket).",
      "Throw the disc directly into the front slot yourself, unassisted = INSTANT WIN.",
      "You must hit exactly 21 to win — go over and you bust back down. No moving with the disc; throw from behind your can.",
    ],
  },

  // ── THE WHEEL — spin-to-win, no bracket ─────────────────────────────────────
  {
    key: "wheel",
    name: "The Wheel",
    emoji: "🎡",
    category: "drinking",
    format: "wheel",
    teamsPerMatch: 1,
    pointsMultiplier: 1,
    estMinutes: 2,
    art: "wheel",
    stations: 0,
    wheelSpots: DEFAULT_WHEEL_SPOTS,
    blurb: "Spin the big wheel and do whatever it lands on — points, dares, chaos.",
    rules: [
      "A giant 18-spot wheel — point bonuses, drinking challenges, and wildcards.",
      "When it's your team's turn, give the wheel a spin (the real one, or the digital wheel in the app).",
      "The host records what you landed on; point spots get added to your total automatically.",
      "Spots range from big bonuses (+100, +50…) to penalties to dares. The host can edit the spots anytime.",
    ],
  },

  // ── ALL-DAY SPECIAL EVENTS — host awards points anytime ─────────────────────
  {
    key: "kegstand",
    name: "Longest Keg Stand",
    emoji: "🍺",
    category: "drinking",
    format: "special",
    teamsPerMatch: 1,
    pointsMultiplier: 1,
    estMinutes: 0,
    art: "kegstand",
    stations: 0,
    blurb: "All-day challenge — hold the longest keg stand for bonus points.",
    rules: [
      "Running all day — attempt it whenever a keg and spotters are free.",
      "Get hoisted upside-down on the keg and drink; the clock runs until you tap out.",
      "The host logs attempts and awards points — the longest stand banks the big ones.",
      "Spotters required. Know your limits — don't be a hero.",
    ],
  },
  {
    key: "karaoke",
    name: "Karaoke Points",
    emoji: "🎤",
    category: "drinking",
    format: "special",
    teamsPerMatch: 1,
    pointsMultiplier: 1,
    estMinutes: 0,
    art: "karaoke",
    stations: 0,
    blurb: "Grab the mic anytime — the host hands out points for the best performances.",
    rules: [
      "Open all day — sing whenever the stage is free.",
      "The host (and the crowd) award points for commitment, crowd reaction, and sheer audacity.",
      "Duets, group numbers, and deep cuts all count. Bonus for getting everyone singing.",
    ],
  },
];
