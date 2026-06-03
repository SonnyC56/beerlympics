import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertHost, getActiveEvent } from "./lib";

const gameCategory = v.string(); // "drinking" | "lawn" (open for evolution)
const gameFormat = v.union(
  v.literal("single_elim"),
  v.literal("round_robin"),
  v.literal("heats"),
  v.literal("ladder"),
  v.literal("wheel"),
  v.literal("special"),
);

/** All games for the event, sorted. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const games = await ctx.db
      .query("games")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    return games.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => ctx.db.get(gameId),
});

/** Host: create a game. */
export const create = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    emoji: v.string(),
    category: gameCategory,
    description: v.optional(v.string()),
    rules: v.optional(v.string()),
    art: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    format: gameFormat,
    teamsPerMatch: v.optional(v.number()),
    placementPoints: v.optional(v.array(v.number())),
    pointsMultiplier: v.optional(v.number()),
    estMinutes: v.optional(v.number()),
    isGated: v.optional(v.boolean()),
    gateFromPhaseIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertHost(ctx, args.deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const existing = await ctx.db
      .query("games")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const sortOrder = existing.length;
    return await ctx.db.insert("games", {
      eventId: event._id,
      name: args.name.trim(),
      emoji: args.emoji,
      category: args.category,
      description: args.description?.trim(),
      rules: args.rules?.trim(),
      art: args.art,
      enabled: args.enabled ?? true,
      format: args.format,
      teamsPerMatch: args.teamsPerMatch ?? 2,
      placementPoints: args.placementPoints,
      pointsMultiplier: args.pointsMultiplier ?? 1,
      estMinutes: args.estMinutes ?? 12,
      isGated: args.isGated ?? false,
      gateFromPhaseIndex: args.gateFromPhaseIndex,
      sortOrder,
      status: "scheduled",
    });
  },
});

/** Host: include/exclude a game from this year's lineup. */
export const setEnabled = mutation({
  args: { deviceId: v.string(), gameId: v.id("games"), enabled: v.boolean() },
  handler: async (ctx, { deviceId, gameId, enabled }) => {
    await assertHost(ctx, deviceId);
    await ctx.db.patch(gameId, { enabled });
    return true;
  },
});

/** Host: edit a game. */
export const update = mutation({
  args: {
    deviceId: v.string(),
    gameId: v.id("games"),
    patch: v.object({
      name: v.optional(v.string()),
      emoji: v.optional(v.string()),
      category: v.optional(gameCategory),
      description: v.optional(v.string()),
      rules: v.optional(v.string()),
      art: v.optional(v.string()),
      enabled: v.optional(v.boolean()),
      format: v.optional(gameFormat),
      teamsPerMatch: v.optional(v.number()),
      placementPoints: v.optional(v.array(v.number())),
      pointsMultiplier: v.optional(v.number()),
      estMinutes: v.optional(v.number()),
      isGated: v.optional(v.boolean()),
      gateFromPhaseIndex: v.optional(v.number()),
      sortOrder: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { deviceId, gameId, patch }) => {
    await assertHost(ctx, deviceId);
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, val]) => val !== undefined),
    );
    await ctx.db.patch(gameId, clean);
    return true;
  },
});

/** Host: delete a game (and its stations + matches). */
export const remove = mutation({
  args: { deviceId: v.string(), gameId: v.id("games") },
  handler: async (ctx, { deviceId, gameId }) => {
    await assertHost(ctx, deviceId);
    const stations = await ctx.db
      .query("stations")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();
    for (const s of stations) await ctx.db.delete(s._id);
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();
    for (const m of matches) await ctx.db.delete(m._id);
    await ctx.db.delete(gameId);
    return true;
  },
});
