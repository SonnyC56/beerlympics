import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
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
});

function spotsOf(game: { wheelSpots?: { label: string; points?: number; color?: string }[] }) {
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

    return { label: spot.label, points };
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
