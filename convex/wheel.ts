import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  assertHost,
  awardPoints,
  getActiveEvent,
  recordActivity,
} from "./lib";
import { DEFAULT_WHEEL_SPOTS } from "./gameCatalog";

const spotValidator = v.object({
  label: v.string(),
  points: v.optional(v.number()),
  color: v.optional(v.string()),
  broadcast: v.optional(v.boolean()),
});

function spotsOf(game: {
  wheelSpots?: { label: string; points?: number; color?: string; broadcast?: boolean }[];
}) {
  return game.wheelSpots && game.wheelSpots.length > 0
    ? game.wheelSpots
    : DEFAULT_WHEEL_SPOTS;
}

/** Public: the wheel's spots + meta for a game. */
export const config = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return null;
    return {
      gameId: game._id,
      name: game.name,
      emoji: game.emoji,
      spots: spotsOf(game),
    };
  },
});

/** Host: replace the wheel's spots. */
export const setSpots = mutation({
  args: {
    deviceId: v.string(),
    gameId: v.id("games"),
    spots: v.array(spotValidator),
  },
  handler: async (ctx, { deviceId, gameId, spots }) => {
    await assertHost(ctx, deviceId);
    if (spots.length < 2) throw new Error("A wheel needs at least 2 spots.");
    await ctx.db.patch(gameId, { wheelSpots: spots });
    return true;
  },
});

/**
 * Host: record a spin for a team (from the physical wheel, or the digital one).
 * Logs the spin, awards the spot's points, and announces it.
 */
export const recordSpin = mutation({
  args: {
    deviceId: v.string(),
    gameId: v.id("games"),
    teamId: v.id("teams"),
    spotIndex: v.number(),
  },
  handler: async (ctx, { deviceId, gameId, teamId, spotIndex }) => {
    const host = await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found.");
    const spots = spotsOf(game);
    const spot = spots[spotIndex];
    if (!spot) throw new Error("That spot doesn't exist.");
    const team = await ctx.db.get(teamId);
    if (!team) throw new Error("Team not found.");

    const points = spot.points ?? 0;
    await ctx.db.insert("wheelSpins", {
      eventId: event._id,
      gameId,
      teamId,
      spotIndex,
      label: spot.label,
      points,
      spunByUserId: host._id,
      createdAt: Date.now(),
    });

    if (points !== 0) {
      await awardPoints(ctx, {
        eventId: event._id,
        teamId,
        gameId,
        points,
        reason: points > 0 ? "bonus" : "penalty",
        note: `Wheel: ${spot.label}`,
        createdByUserId: host._id,
      });
    }

    await recordActivity(ctx, event._id, {
      kind: "bonus",
      message: `${team.name} spun the wheel and landed on ${spot.label}${
        points ? ` (${points > 0 ? "+" : ""}${points} pts)` : ""
      }`,
      teamId,
    });

    // Group-action spots (Everyone Drinks, Waterfall, …) buzz everybody.
    if (spot.broadcast) {
      await ctx.scheduler.runAfter(0, internal.pushSender.sendBroadcast, {
        title: "DRINK!",
        body: `${team.name} spun "${spot.label}" — everybody drink!`,
        url: `/games/${gameId}`,
      });
    }

    return { label: spot.label, points, broadcast: spot.broadcast ?? false };
  },
});

/**
 * Host: fire an "everybody drinks" push to everyone right now — for when the
 * physical wheel lands on a group action (or just to rally a drink). Logs it to
 * the activity feed too.
 */
export const broadcastDrink = mutation({
  args: {
    deviceId: v.string(),
    gameId: v.optional(v.id("games")),
    label: v.optional(v.string()),
  },
  handler: async (ctx, { deviceId, gameId, label }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const what = (label ?? "Everybody drinks").trim() || "Everybody drinks";

    await ctx.scheduler.runAfter(0, internal.pushSender.sendBroadcast, {
      title: "DRINK!",
      body: `${what} — bottoms up!`,
      url: gameId ? `/games/${gameId}` : "/games",
    });

    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: `The wheel says: ${what}. Everybody drink!`,
    });

    return { ok: true };
  },
});

/** Recent spins for a wheel (newest first), with team info. */
export const spins = query({
  args: { gameId: v.id("games"), limit: v.optional(v.number()) },
  handler: async (ctx, { gameId, limit }) => {
    const rows = await ctx.db
      .query("wheelSpins")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .order("desc")
      .take(limit ?? 30);
    return await Promise.all(
      rows.map(async (r) => {
        const team = await ctx.db.get(r.teamId);
        return {
          ...r,
          teamName: team?.name ?? "—",
          teamEmoji: team?.emoji ?? "",
          teamColor: team?.color ?? "gold",
        };
      }),
    );
  },
});

/**
 * Admin-only (CLI/dashboard): the Wheel got too swingy mid-event. This removes
 * every point the Wheel has awarded from the standings (deletes its scoreEntries)
 * and strips the point values off its spots so future spins award nothing — the
 * wheel still spins for drinks/dares. Spin history (wheelSpins) is preserved, so
 * the points could be re-derived if ever needed. Idempotent.
 */
export const adminDisablePoints = internalMutation({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const games = await ctx.db
      .query("games")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const wheels = games.filter((g) => g.format === "wheel");

    let entriesRemoved = 0;
    let pointsRemoved = 0;
    for (const w of wheels) {
      const entries = await ctx.db
        .query("scoreEntries")
        .withIndex("by_event_and_game", (q) =>
          q.eq("eventId", event._id).eq("gameId", w._id),
        )
        .collect();
      for (const e of entries) {
        pointsRemoved += e.points;
        await ctx.db.delete(e._id);
        entriesRemoved++;
      }
      // Strip point values off the spots (keep labels + "everybody drinks").
      const spots =
        w.wheelSpots && w.wheelSpots.length > 0 ? w.wheelSpots : DEFAULT_WHEEL_SPOTS;
      const stripped = spots.map(({ points: _p, ...rest }) => rest);
      await ctx.db.patch(w._id, { wheelSpots: stripped });
    }

    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message:
        "The Wheel is now just for fun — its points have been removed from the standings.",
    });
    return { wheels: wheels.length, entriesRemoved, pointsRemoved };
  },
});
