import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * BEERLYMPICS DATA MODEL
 * ----------------------
 * One `event` (the annual games). Device-based `users` become `players` when
 * they RSVP. Players join `teams`. The day is split into ordered `phases`.
 * Each `game` runs its own tournament made of `matches`, played at physical
 * `stations`. A live dispatcher assigns ready matches to open stations to keep
 * everyone busy. Placement in each game awards `scoreEntries` whose sum is a
 * team's grand total. `media` captures the highlight reel. `activity` powers a
 * live ticker.
 */

// Reusable enums --------------------------------------------------------------
// Category is an open string ("drinking" | "lawn" today) so the taxonomy can
// evolve without a blocking data migration.
const gameCategory = v.string();

const matchStatus = v.union(
  v.literal("pending"), // teams not fully determined yet (awaiting upstream results)
  v.literal("ready"), // both teams known, eligible to be dispatched
  v.literal("queued"), // assigned to a station, about to start / on deck
  v.literal("in_progress"), // currently being played
  v.literal("completed"),
  v.literal("void"),
);

export default defineSchema({
  // Convex Auth tables (authAccounts, authSessions, authRefreshTokens, …).
  ...authTables,

  // ── The event ─────────────────────────────────────────────────────────────
  events: defineTable({
    slug: v.string(), // short url-safe id, e.g. "2026"
    name: v.string(),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    dateIso: v.string(), // ISO date of the games, e.g. "2026-07-04"
    startTime: v.optional(v.string()), // human time, e.g. "12:00 PM"
    location: v.optional(v.string()),
    locationUrl: v.optional(v.string()), // maps link
    coverEmoji: v.string(),
    coverColor: v.string(), // theme accent token
    hostCode: v.string(), // secret; entering it grants host powers
    status: v.union(
      v.literal("draft"),
      v.literal("rsvp"), // invites open, collecting RSVPs + teams
      v.literal("live"), // games in progress
      v.literal("finished"),
    ),
    currentPhaseIndex: v.number(), // which phase is active (-1 = pre-game)
    // Scoring knobs the host can tune.
    settings: v.object({
      // Keyed by category string (e.g. { drinking: 1, lawn: 1.5 }).
      categoryMultipliers: v.record(v.string(), v.number()),
      // Default placement->points curve used when a game doesn't override it.
      defaultPlacementPoints: v.array(v.number()),
      // Points for winning a single match (encourages effort even when out of placement).
      winBonus: v.number(),
      allowSelfClaim: v.boolean(), // can players enter their own results, or host-only
    }),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  // ── Identity (Convex Auth user, extended with app fields) ───────────────────
  // Overrides the default authTables.users so we can attach app data. Auth fills
  // name/email/image from the OAuth profile; we add emoji/isHost.
  users: defineTable({
    // Convex Auth fields:
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // App fields:
    emoji: v.optional(v.string()),
    isHost: v.optional(v.boolean()),
    deviceId: v.optional(v.string()), // legacy / demo users
    createdAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_device", ["deviceId"]),

  // ── Participation in the event (RSVP + team membership) ─────────────────────
  players: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    name: v.string(), // denormalized for fast lists
    emoji: v.string(),
    status: v.union(v.literal("yes"), v.literal("no"), v.literal("maybe")),
    plusOnes: v.number(),
    note: v.optional(v.string()),
    email: v.optional(v.string()), // for RSVP confirmation via Resend
    teamId: v.optional(v.id("teams")),
    role: v.optional(v.union(v.literal("captain"), v.literal("member"))),
    invitedViaCode: v.optional(v.string()), // attribution to an invite link
    respondedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_and_user", ["eventId", "userId"])
    .index("by_team", ["teamId"]),

  // ── Invites (custom shareable links + email via Resend) ─────────────────────
  invites: defineTable({
    eventId: v.id("events"),
    code: v.string(), // short url-safe token used in /i/<code>
    label: v.optional(v.string()), // host's note, e.g. "Jake & the softball crew"
    recipientName: v.optional(v.string()), // pre-fills the RSVP name field
    recipientEmail: v.optional(v.string()),
    createdByUserId: v.optional(v.id("users")),
    maxUses: v.optional(v.number()), // 0 / undefined = unlimited
    uses: v.number(),
    note: v.optional(v.string()), // personal message shown on the invite + email
    emailStatus: v.optional(
      v.union(
        v.literal("queued"),
        v.literal("sent"),
        v.literal("failed"),
      ),
    ),
    emailError: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    lastClaimedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_code", ["code"]),

  // ── Teams ───────────────────────────────────────────────────────────────────
  teams: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    theme: v.optional(v.string()), // vibe, e.g. "Pirates", "Top Gun"
    motto: v.optional(v.string()),
    color: v.string(), // hex or theme token used across the UI
    emoji: v.string(),
    captainUserId: v.id("users"),
    seed: v.optional(v.number()), // overall seed for bracket placement
    createdAt: v.number(),
  }).index("by_event", ["eventId"]),

  // ── Phases of the day ───────────────────────────────────────────────────────
  phases: defineTable({
    eventId: v.id("events"),
    index: v.number(), // 0,1,2,...
    name: v.string(),
    kind: v.union(
      v.literal("qualifier"),
      v.literal("knockout"),
      v.literal("semifinal"),
      v.literal("final"),
    ),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("locked"),
      v.literal("active"),
      v.literal("complete"),
    ),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_event_and_index", ["eventId", "index"]),

  // ── Games (each runs its own tournament) ────────────────────────────────────
  games: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    emoji: v.string(),
    category: gameCategory,
    description: v.optional(v.string()),
    rules: v.optional(v.string()), // newline-separated rule lines, shown to everyone
    art: v.optional(v.string()), // key into the animated SVG art registry
    enabled: v.optional(v.boolean()), // include/exclude from this year's games
    format: v.union(
      v.literal("single_elim"),
      v.literal("round_robin"),
      v.literal("heats"), // groups race; rank within heat (flip cup, etc.)
      v.literal("ladder"),
      v.literal("wheel"), // spin-the-wheel: no bracket, recorded spins
      v.literal("special"), // all-day side challenge: host awards points anytime
    ),
    // For format === "wheel": the spots around the wheel.
    wheelSpots: v.optional(
      v.array(
        v.object({
          label: v.string(),
          points: v.optional(v.number()),
          color: v.optional(v.string()),
        }),
      ),
    ),
    teamsPerMatch: v.number(), // 2 for 1v1; more for heats
    placementPoints: v.optional(v.array(v.number())), // overrides event default
    pointsMultiplier: v.number(), // scales this game's importance
    estMinutes: v.number(), // for scheduling / dispatch heuristics
    // Gating — beer die is deferred to late phases.
    isGated: v.boolean(),
    gateFromPhaseIndex: v.optional(v.number()), // earliest phase this game may run
    sortOrder: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("locked"),
    ),
  })
    .index("by_event", ["eventId"])
    .index("by_event_and_category", ["eventId", "category"]),

  // ── Stations (physical tables where games are played) ───────────────────────
  stations: defineTable({
    eventId: v.id("events"),
    name: v.string(), // "Pong Table 1"
    gameId: v.id("games"), // the game this station is set up for
    status: v.union(
      v.literal("open"), // free, can take a match
      v.literal("busy"), // a match is in progress here
      v.literal("closed"), // not in use (e.g. die table before semis)
    ),
    currentMatchId: v.optional(v.id("matches")),
    sortOrder: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_game", ["gameId"])
    .index("by_event_and_status", ["eventId", "status"]),

  // ── Matches (the atoms of every tournament) ─────────────────────────────────
  matches: defineTable({
    eventId: v.id("events"),
    gameId: v.id("games"),
    phaseIndex: v.number(), // which phase this match belongs to
    round: v.number(), // 1-based round within the game's bracket
    bracket: v.optional(v.string()), // "main" | "consolation" | "final"
    slot: v.number(), // position within the round (for pairing/advancement)
    label: v.optional(v.string()), // human label, e.g. "QF1", "Final"
    teamIds: v.array(v.id("teams")), // resolved competitors (may be empty until seeded)
    // For matches whose teams come from earlier results:
    sourceRefs: v.optional(
      v.array(
        v.object({
          fromMatchId: v.optional(v.id("matches")),
          take: v.union(v.literal("winner"), v.literal("loser")),
        }),
      ),
    ),
    status: matchStatus,
    stationId: v.optional(v.id("stations")),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    winnerTeamId: v.optional(v.id("teams")),
    // Ranked results (covers 1v1 and multi-team heats): place is 1-based.
    rankings: v.optional(
      v.array(
        v.object({
          teamId: v.id("teams"),
          place: v.number(),
          score: v.optional(v.number()),
        }),
      ),
    ),
    // Advancement wiring.
    nextMatchId: v.optional(v.id("matches")),
    nextSlot: v.optional(v.number()),
    loserNextMatchId: v.optional(v.id("matches")),
    loserNextSlot: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_game", ["gameId"])
    .index("by_event_and_status", ["eventId", "status"])
    .index("by_station", ["stationId"])
    .index("by_game_and_round", ["gameId", "round"]),

  // ── Score ledger (sum = grand total) ────────────────────────────────────────
  scoreEntries: defineTable({
    eventId: v.id("events"),
    teamId: v.id("teams"),
    gameId: v.optional(v.id("games")),
    matchId: v.optional(v.id("matches")),
    phaseIndex: v.optional(v.number()),
    points: v.number(),
    reason: v.union(
      v.literal("placement"),
      v.literal("win"),
      v.literal("bonus"),
      v.literal("penalty"),
      v.literal("manual"),
    ),
    place: v.optional(v.number()),
    note: v.optional(v.string()),
    createdByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_team", ["teamId"])
    .index("by_event_and_game", ["eventId", "gameId"])
    .index("by_match", ["matchId"]),

  // ── Media (photos + videos for the highlight reel) ──────────────────────────
  media: defineTable({
    eventId: v.id("events"),
    storageId: v.id("_storage"),
    kind: v.union(v.literal("photo"), v.literal("video")),
    uploaderUserId: v.optional(v.id("users")),
    uploaderName: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    gameId: v.optional(v.id("games")),
    matchId: v.optional(v.id("matches")), // tag to a specific match
    caption: v.optional(v.string()),
    takenAt: v.number(), // capture timestamp (client clock)
    durationMs: v.optional(v.number()),
    favorite: v.boolean(), // flagged for the highlight reel
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_uploader", ["uploaderUserId"])
    .index("by_team", ["teamId"])
    .index("by_match", ["matchId"])
    .index("by_event_and_favorite", ["eventId", "favorite"]),

  // ── Wheel spins (log of who spun the wheel and what they got) ───────────────
  wheelSpins: defineTable({
    eventId: v.id("events"),
    gameId: v.id("games"),
    teamId: v.id("teams"),
    spotIndex: v.number(),
    label: v.string(),
    points: v.number(),
    spunByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_game", ["gameId"])
    .index("by_team", ["teamId"]),

  // ── Live activity ticker ────────────────────────────────────────────────────
  activity: defineTable({
    eventId: v.id("events"),
    kind: v.union(
      v.literal("rsvp"),
      v.literal("team"),
      v.literal("result"),
      v.literal("phase"),
      v.literal("media"),
      v.literal("bonus"),
      v.literal("announcement"),
    ),
    message: v.string(),
    emoji: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    createdAt: v.number(),
  }).index("by_event", ["eventId"]),
});
