# 🎯 "The Circuit" — the Beerlympics tournament format

The old way: one game's bracket at a time while everyone else stands around. **The Circuit** fixes that. It was synthesized from three independently-designed formats (a zero-idle station dispatcher, a pods→podiums league, and a quest-board economy) and keeps the best of each.

## The core idea

> **Many games run at once. Every team is always either playing or about to play. Placement in each game feeds one grand total. The slowest game (Beer Die) is saved for the dramatic finale.**

### 1. Parallel stations, one grand total
Each game (Beer Pong, Flip Cup, Cornhole, …) runs its **own tournament** at one or more physical **stations** (tables). They all run **simultaneously**. Finishing well in any game's tournament awards **placement points** that roll up into a single live **grand total** — the scoreboard everyone is chasing all day.

### 2. The Dispatcher (the anti-idle engine)
A single idempotent function, `runDispatch`, behaves like a restaurant host "seating tables": while an **open station** and an **eligible, ready match** exist whose teams are **free**, it seats the match. It re-runs automatically on every resource-freeing event (a match ends, a phase starts, a bracket is generated) and can be triggered manually from the Host dashboard.

Priority is **earlier rounds first**, then **longest-idle team first** (a starvation term) — so nobody sits out, and teams that haven't played in a while get pulled in. Because a team can only be seated at one station at a time, the dispatcher naturally **interleaves** a team's slow "long game" matches with quick beer/drinking games while they wait for their next long-game opponent.

### 3. Rising-stakes phases
The day moves through ordered **phases**, each worth more than the last:

| Phase | Multiplier | What happens |
| --- | --- | --- |
| **Group Circuit** (qualifier) | ×1.0 | Every game runs at once. Cycle through, rack up points, get seeded. |
| **Knockouts** | ×1.5 | Single-elim brackets per game. |
| **Semifinals** | ×1.75 | 🎲 **Beer Die unlocks.** Its tables open for the top teams only. |
| **Finals** | ×2.0 | Championships + the Beer Die final, seeded from the leaderboard. |

Rising multipliers mean **no team is ever mathematically dead** — a hot finish can still steal the crown, so the party stays alive to the end.

### 4. Beer Die gating (triple-locked)
Beer Die takes the longest, so it's deferred three ways:
1. **Config** — the game is flagged `isGated` with `gateFromPhaseIndex = 2` (Semifinals).
2. **Stations** — Beer Die tables start **closed** and only open when the event reaches that phase.
3. **Seeding** — instead of a full bracket, the host clicks **"Seed finale from Top N"** and Beer Die is built as a small single-elim bracket straight from the **current grand-total standings** (e.g. top 4: 1v4, 2v3). The whole day's grind becomes the qualification for the marquee game.

### 5. An immutable score ledger
Every point is an append-only row in `scoreEntries` (placement, win bonus, or a host bonus/penalty). The grand total is just their sum, so:
- re-tuning category weights or placement curves **instantly re-ranks** everyone,
- corrections are just new/removed rows — fully auditable,
- reopening a match cleanly reverses its points and advancement.

## Scoring math

For a team finishing in **place P** in a game's phase instance:

```
points = placementPoints[P-1]            // per-game curve, or the event default
       × game.pointsMultiplier           // a game's importance (long games weigh more)
       × categoryMultiplier[game.category]// beer / drinking / long weighting
       × phaseMultiplier(phase.kind)      // rising stakes (1.0 → 2.0)
```

Plus a small **win bonus** for each match won, so effort is always rewarded even when you're out of the placement points.

## Host controls

The host drives everything from `/host`: advance phases, generate/reset brackets (seed by overall seed, random, or current standings), open/close stations, manually dispatch, seed the Beer Die finale, award bonus/penalty points, broadcast announcements, manage teams/RSVPs/invites, and tune the scoring knobs live.

## Match lifecycle

```
pending ──(teams resolved)──▶ ready ──(dispatcher seats it)──▶ in_progress
   ▲                                                               │
   │                                              (host enters result)
   └──────────────── reopen (host correction) ◀── completed ──────┘
                                                     │
                              winner advances to the next match;
                              when a (game, phase) instance is fully
                              complete, placement points are appended once.
```
