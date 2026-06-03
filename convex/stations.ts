import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertHost, getActiveEvent } from "./lib";

/** All stations with their current game + match. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const stations = await ctx.db
      .query("stations")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const enriched = await Promise.all(
      stations.map(async (s) => {
        const game = await ctx.db.get(s.gameId);
        const match = s.currentMatchId ? await ctx.db.get(s.currentMatchId) : null;
        return { ...s, game, match };
      }),
    );
    return enriched.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/** Host: add a station for a game. */
export const create = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    await assertHost(ctx, args.deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found.");
    const all = await ctx.db
      .query("stations")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    return await ctx.db.insert("stations", {
      eventId: event._id,
      name: args.name.trim(),
      gameId: args.gameId,
      // Gated games (beer die) start closed until their phase unlocks.
      status: game.isGated ? "closed" : "open",
      sortOrder: all.length,
    });
  },
});

/** Host: open or close a station manually. */
export const setStatus = mutation({
  args: {
    deviceId: v.string(),
    stationId: v.id("stations"),
    status: v.union(v.literal("open"), v.literal("closed")),
  },
  handler: async (ctx, { deviceId, stationId, status }) => {
    await assertHost(ctx, deviceId);
    const station = await ctx.db.get(stationId);
    if (!station) throw new Error("Station not found.");
    if (station.status === "busy") {
      throw new Error("Finish the current match before closing this station.");
    }
    await ctx.db.patch(stationId, { status });
    return true;
  },
});

/** Host: rename / reassign a station. */
export const update = mutation({
  args: {
    deviceId: v.string(),
    stationId: v.id("stations"),
    patch: v.object({
      name: v.optional(v.string()),
      gameId: v.optional(v.id("games")),
    }),
  },
  handler: async (ctx, { deviceId, stationId, patch }) => {
    await assertHost(ctx, deviceId);
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, val]) => val !== undefined),
    );
    await ctx.db.patch(stationId, clean);
    return true;
  },
});

/** Host: delete a station. */
export const remove = mutation({
  args: { deviceId: v.string(), stationId: v.id("stations") },
  handler: async (ctx, { deviceId, stationId }) => {
    await assertHost(ctx, deviceId);
    const station = await ctx.db.get(stationId);
    if (station?.status === "busy") throw new Error("Station is in use.");
    await ctx.db.delete(stationId);
    return true;
  },
});
