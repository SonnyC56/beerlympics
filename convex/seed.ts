import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { genCode, getActiveEvent } from "./lib";
import { GAME_CATALOG, DEFAULT_WHEEL_SPOTS } from "./gameCatalog";
import type { Id } from "./_generated/dataModel";

const DEFAULT_SETTINGS = {
  categoryMultipliers: { drinking: 1, lawn: 1.5 },
  defaultPlacementPoints: [100, 70, 50, 35, 25, 15, 10, 5],
  winBonus: 5,
  allowSelfClaim: true,
  maxTeamSize: 3, // pair + optional sub
};

// Games removed from the lineup — `seed:resync` (and `purgeRetired`) delete these
// (and their stations / matches / score rows) if they still exist, and they're
// no longer in GAME_CATALOG so they never re-seed.
const RETIRED_GAMES = ["Slap Cup", "Quarters", "Snappa", "Boat Race", "Cornhole"];

const PHASES = [
  {
    name: "Group Circuit",
    kind: "qualifier" as const,
    description:
      "Every game runs at once across the stations. Cycle through, rack up points — nobody stands around.",
  },
  {
    name: "Knockouts",
    kind: "knockout" as const,
    description: "Single-elim brackets per game. Stakes (and point multipliers) rising.",
  },
  {
    name: "Semifinals",
    kind: "semifinal" as const,
    description: "Beer Die unlocks — the marquee table opens for the top teams only.",
  },
  {
    name: "Finals",
    kind: "final" as const,
    description: "Championship + the Beer Die final, seeded straight from the leaderboard.",
  },
];

/**
 * Idempotently create a ready-to-run event. Safe to run once. Host code is
 * `HOST` — open the app, set your name, and enter it on the Host tab.
 */
export const run = mutation({
  args: { dateIso: v.optional(v.string()), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await getActiveEvent(ctx);
    if (existing) {
      return { ok: false, message: "An event already exists — nothing to seed." };
    }
    const dateIso = args.dateIso ?? "2026-06-13";
    // A fresh, non-guessable host code each seed (entering it grants host powers,
    // including factory reset — never ship a known default like "HOST").
    const hostCode = genCode(6);
    const eventId = await ctx.db.insert("events", {
      slug: "iv",
      name: args.name ?? "Sonny's 4th Annual Beer Olympics",
      tagline: "The 4th annual backyard games.",
      description:
        "Drinking games and lawn games. One champion. Cycle through the stations, climb the live leaderboard, and earn your way into the Beer Die finale.",
      dateIso,
      startTime: "1:00 PM",
      location: "The Backyard",
      coverEmoji: "trophy",
      coverColor: "gold",
      hostCode,
      status: "rsvp",
      currentPhaseIndex: -1,
      settings: DEFAULT_SETTINGS,
      createdAt: Date.now(),
    });

    for (let i = 0; i < PHASES.length; i++) {
      await ctx.db.insert("phases", {
        eventId,
        index: i,
        name: PHASES[i].name,
        kind: PHASES[i].kind,
        description: PHASES[i].description,
        status: "locked",
      });
    }

    let sortOrder = 0;
    let stationOrder = 0;
    for (const g of GAME_CATALOG) {
      const gameId = await ctx.db.insert("games", {
        eventId,
        name: g.name,
        emoji: g.emoji,
        category: g.category,
        description: g.blurb,
        rules: g.rules.join("\n"),
        art: g.art,
        enabled: g.enabled ?? true,
        format: g.format,
        wheelSpots: g.wheelSpots,
        teamsPerMatch: g.teamsPerMatch,
        pointsMultiplier: g.pointsMultiplier,
        estMinutes: g.estMinutes,
        isGated: g.gated ?? false,
        gateFromPhaseIndex: g.gated ? (g.gateFromPhaseIndex ?? 2) : undefined,
        sortOrder: sortOrder++,
        status: "scheduled",
      });
      for (let s = 0; s < g.stations; s++) {
        await ctx.db.insert("stations", {
          eventId,
          name: g.stations > 1 ? `${g.name} ${s + 1}` : g.name,
          gameId,
          status: g.gated ? "closed" : "open",
          sortOrder: stationOrder++,
        });
      }
    }

    await ctx.db.insert("activity", {
      eventId,
      kind: "announcement",
      message: "Sonny's 4th Annual Beer Olympics is open for RSVPs! Build your team.",
      createdAt: Date.now(),
    });

    return {
      ok: true,
      eventId,
      hostCode,
      message: `Seeded! Host code is ${hostCode} — keep it secret; it grants host powers.`,
    };
  },
});

/**
 * Migrate an EXISTING event up to the current catalog — without wiping teams,
 * RSVPs, or scores. Backfills rules + art on existing games, adds any new games
 * (Snappa, Stack Cup, Boat Race, Fuck Ya Buddy) and their stations, migrates
 * categories (beer->drinking, long->lawn) + the scoring multipliers, and nudges
 * the title/date to Beerlympics IV if still on the old defaults. Idempotent —
 * safe to run as many times as you like.
 */
export const resync = mutation({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event yet — run seed:run first.");

    // 1) Title / date — only if still on a known default (don't clobber edits).
    const eventPatch: Record<string, unknown> = {};
    if (["Beerlympics 2026", "Beerlympics IV"].includes(event.name)) {
      eventPatch.name = "Sonny's 4th Annual Beer Olympics";
    }
    if (event.dateIso === "2026-07-04") {
      eventPatch.dateIso = "2026-06-13";
      eventPatch.slug = "iv";
    }
    if (
      event.tagline === "The annual backyard games." ||
      event.tagline === "The fourth annual backyard games."
    ) {
      eventPatch.tagline = "The 4th annual backyard games.";
    }
    // Migrate the cover from an emoji to a mascot key.
    if (event.coverEmoji === "🏅" || event.coverEmoji === "medalGold") {
      eventPatch.coverEmoji = "trophy";
    }

    // 2) Migrate scoring multipliers into the two-category world.
    const cm = (event.settings.categoryMultipliers ?? {}) as Record<string, number>;
    eventPatch.settings = {
      ...event.settings,
      categoryMultipliers: {
        drinking: cm.drinking ?? cm.beer ?? 1,
        lawn: cm.lawn ?? cm.long ?? 1.5,
      },
      maxTeamSize: event.settings.maxTeamSize ?? 3,
    };
    await ctx.db.patch(event._id, eventPatch);

    // 3) Sync the games from the catalog (patch existing by name, add new ones).
    const existing = await ctx.db
      .query("games")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();

    // 3a) Delete retired games (and cascade their stations / matches / scores).
    const retired = new Set(RETIRED_GAMES.map((n) => n.trim().toLowerCase()));
    let removed = 0;
    const live: typeof existing = [];
    for (const g of existing) {
      if (!retired.has(g.name.trim().toLowerCase())) {
        live.push(g);
        continue;
      }
      const stations = await ctx.db
        .query("stations")
        .withIndex("by_game", (q) => q.eq("gameId", g._id))
        .collect();
      for (const s of stations) await ctx.db.delete(s._id);
      const matches = await ctx.db
        .query("matches")
        .withIndex("by_game", (q) => q.eq("gameId", g._id))
        .collect();
      for (const m of matches) await ctx.db.delete(m._id);
      const scores = await ctx.db
        .query("scoreEntries")
        .withIndex("by_event_and_game", (q) =>
          q.eq("eventId", event._id).eq("gameId", g._id),
        )
        .collect();
      for (const e of scores) await ctx.db.delete(e._id);
      await ctx.db.delete(g._id);
      removed++;
    }

    const byName = new Map(live.map((g) => [g.name.trim().toLowerCase(), g]));
    let stationOrder = (
      await ctx.db
        .query("stations")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect()
    ).length;

    let updated = 0;
    let added = 0;
    let stationsAdded = 0;

    for (let i = 0; i < GAME_CATALOG.length; i++) {
      const g = GAME_CATALOG[i];
      const fields = {
        name: g.name,
        emoji: g.emoji,
        category: g.category,
        description: g.blurb,
        rules: g.rules.join("\n"),
        art: g.art,
        format: g.format,
        teamsPerMatch: g.teamsPerMatch,
        pointsMultiplier: g.pointsMultiplier,
        estMinutes: g.estMinutes,
        isGated: g.gated ?? false,
        gateFromPhaseIndex: g.gated ? g.gateFromPhaseIndex ?? 2 : undefined,
        sortOrder: i,
      };
      let match = byName.get(g.name.trim().toLowerCase());
      if (!match && g.aliases) {
        for (const a of g.aliases) {
          const m = byName.get(a.trim().toLowerCase());
          if (m) {
            match = m;
            break;
          }
        }
      }
      if (match) {
        await ctx.db.patch(match._id, {
          ...fields, // includes name -> renames aliased games to the canonical name
          enabled: match.enabled ?? g.enabled ?? true, // keep host's choice
        });
        updated++;
      } else {
        const gameId = await ctx.db.insert("games", {
          eventId: event._id,
          ...fields,
          enabled: g.enabled ?? true,
          wheelSpots: g.wheelSpots, // only set on first insert; preserved after
          status: "scheduled",
        });
        added++;
        for (let s = 0; s < g.stations; s++) {
          await ctx.db.insert("stations", {
            eventId: event._id,
            name: g.stations > 1 ? `${g.name} ${s + 1}` : g.name,
            gameId,
            status: g.gated ? "closed" : "open",
            sortOrder: stationOrder++,
          });
          stationsAdded++;
        }
      }
    }

    // 4) Backfill "everybody drinks" broadcast flags onto wheels that still use
    //    the stock spots (host-customized wheels are left untouched). Idempotent:
    //    once a wheel has any broadcast spot, it's skipped.
    let wheelsMigrated = 0;
    const wheelGames = (
      await ctx.db
        .query("games")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect()
    ).filter((g) => g.format === "wheel");
    const defaultLabels = DEFAULT_WHEEL_SPOTS.map((s) => s.label).join("|");
    for (const wg of wheelGames) {
      const cur = wg.wheelSpots ?? [];
      const untouched = cur.map((s) => s.label).join("|") === defaultLabels;
      const noneBroadcast = cur.every((s) => !s.broadcast);
      if (untouched && noneBroadcast) {
        await ctx.db.patch(wg._id, { wheelSpots: DEFAULT_WHEEL_SPOTS });
        wheelsMigrated++;
      }
    }

    return {
      ok: true,
      updated,
      added,
      removed,
      stationsAdded,
      wheelsMigrated,
      message: `Resynced ${updated} games, added ${added} new (+${stationsAdded} stations), removed ${removed}, migrated ${wheelsMigrated} wheel(s).`,
    };
  },
});

/**
 * Admin-only (CLI/dashboard): immediately purge any RETIRED_GAMES from the live
 * event — deletes the game and cascades its stations, matches, and score entries
 * — without running a full resync. Idempotent (no-op once they're gone). Pairs
 * with removing the game from GAME_CATALOG so it never re-seeds.
 */
export const purgeRetired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const retired = new Set(RETIRED_GAMES.map((n) => n.trim().toLowerCase()));
    const games = await ctx.db
      .query("games")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const removed: string[] = [];
    let stationsDeleted = 0;
    let matchesDeleted = 0;
    let scoreEntriesDeleted = 0;
    for (const g of games) {
      if (!retired.has(g.name.trim().toLowerCase())) continue;
      const stations = await ctx.db
        .query("stations")
        .withIndex("by_game", (q) => q.eq("gameId", g._id))
        .collect();
      for (const s of stations) {
        await ctx.db.delete(s._id);
        stationsDeleted++;
      }
      const matches = await ctx.db
        .query("matches")
        .withIndex("by_game", (q) => q.eq("gameId", g._id))
        .collect();
      for (const m of matches) {
        await ctx.db.delete(m._id);
        matchesDeleted++;
      }
      const scores = await ctx.db
        .query("scoreEntries")
        .withIndex("by_event_and_game", (q) =>
          q.eq("eventId", event._id).eq("gameId", g._id),
        )
        .collect();
      for (const e of scores) {
        await ctx.db.delete(e._id);
        scoreEntriesDeleted++;
      }
      await ctx.db.delete(g._id);
      removed.push(g.name);
    }
    return { removed, stationsDeleted, matchesDeleted, scoreEntriesDeleted };
  },
});

/** Add demo teams (and optionally a few results) so the app looks alive. */
export const demo = mutation({
  args: { teams: v.optional(v.number()) },
  handler: async (ctx, { teams }) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("Seed the event first (convex run seed:run).");
    const roster = [
      { name: "The Hop Stars", emoji: "star", color: "gold", theme: "All-Stars" },
      { name: "Lager Than Life", emoji: "lion", color: "flame", theme: "Safari" },
      { name: "Pour Decisions", emoji: "beer", color: "cyan", theme: "Frat" },
      { name: "Ale Mary", emoji: "clover", color: "grape", theme: "Hail Mary" },
      { name: "Brewtal Squad", emoji: "skull", color: "lime", theme: "Metal" },
      { name: "Sip Happens", emoji: "wave", color: "orange", theme: "Beach" },
    ];
    const count = Math.min(teams ?? 6, roster.length);
    const created: Id<"teams">[] = [];
    for (let i = 0; i < count; i++) {
      const r = roster[i];
      // Demo teams use synthetic host-less users.
      const userId = await ctx.db.insert("users", {
        deviceId: `demo_${i}_${Math.random().toString(36).slice(2)}`,
        name: `${r.name} Captain`,
        emoji: r.emoji,
        isHost: false,
        createdAt: Date.now(),
        lastSeenAt: Date.now(),
      });
      const teamId = await ctx.db.insert("teams", {
        eventId: event._id,
        name: r.name,
        emoji: r.emoji,
        color: r.color,
        theme: r.theme,
        captainUserId: userId,
        seed: i + 1,
        createdAt: Date.now(),
      });
      await ctx.db.insert("players", {
        eventId: event._id,
        userId,
        name: `${r.name} Captain`,
        emoji: r.emoji,
        status: "yes",
        plusOnes: 0,
        teamId,
        role: "captain",
        respondedAt: Date.now(),
      });
      created.push(teamId);
    }
    return { ok: true, teams: created.length };
  },
});
