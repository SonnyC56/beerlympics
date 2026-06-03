import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  assertHost,
  genCode,
  getActiveEvent,
  getUserByDevice,
  recordActivity,
} from "./lib";

const DEFAULT_SETTINGS = {
  categoryMultipliers: { drinking: 1, lawn: 1.5 },
  defaultPlacementPoints: [100, 70, 50, 35, 25, 15, 10, 5],
  winBonus: 5,
  allowSelfClaim: true,
};

/** The active event (or null before setup). */
export const get = query({
  args: {},
  handler: async (ctx) => getActiveEvent(ctx),
});

/** Headline stats for the landing / dashboard. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return null;
    const [players, teams] = await Promise.all([
      ctx.db
        .query("players")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
      ctx.db
        .query("teams")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
    ]);
    const going = players.filter((p) => p.status === "yes");
    const headcount =
      going.reduce((n, p) => n + 1 + (p.plusOnes || 0), 0) || 0;
    return {
      eventId: event._id,
      status: event.status,
      teams: teams.length,
      going: going.length,
      maybe: players.filter((p) => p.status === "maybe").length,
      headcount,
      responses: players.length,
    };
  },
});

/**
 * Bootstrap the event. If none exists, create it and make the caller a host.
 * Returns the host code so the creator can share / re-enter it.
 */
export const create = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    dateIso: v.string(),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.string()),
    location: v.optional(v.string()),
    locationUrl: v.optional(v.string()),
    coverEmoji: v.optional(v.string()),
    coverColor: v.optional(v.string()),
    hostCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await getActiveEvent(ctx);
    if (existing) throw new Error("An event already exists.");

    const user = await getUserByDevice(ctx, args.deviceId);
    if (!user) throw new Error("Set your name before creating the event.");

    const hostCode = (args.hostCode?.trim() || genCode(5)).toUpperCase();
    const eventId = await ctx.db.insert("events", {
      slug: new Date(args.dateIso).getFullYear().toString() || "games",
      name: args.name.trim(),
      tagline: args.tagline?.trim(),
      description: args.description?.trim(),
      dateIso: args.dateIso,
      startTime: args.startTime,
      location: args.location?.trim(),
      locationUrl: args.locationUrl?.trim(),
      coverEmoji: args.coverEmoji || "🏅",
      coverColor: args.coverColor || "gold",
      hostCode,
      status: "rsvp",
      currentPhaseIndex: -1,
      settings: DEFAULT_SETTINGS,
      createdAt: Date.now(),
    });

    await ctx.db.patch(user._id, { isHost: true });
    await recordActivity(ctx, eventId, {
      kind: "announcement",
      message: `${user.name} created ${args.name.trim()}! 🎉`,
      emoji: "🎉",
    });
    return { eventId, hostCode };
  },
});

/** Host edits to the event details. */
export const update = mutation({
  args: {
    deviceId: v.string(),
    patch: v.object({
      name: v.optional(v.string()),
      tagline: v.optional(v.string()),
      description: v.optional(v.string()),
      dateIso: v.optional(v.string()),
      startTime: v.optional(v.string()),
      location: v.optional(v.string()),
      locationUrl: v.optional(v.string()),
      coverEmoji: v.optional(v.string()),
      coverColor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { deviceId, patch }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, val]) => val !== undefined),
    );
    await ctx.db.patch(event._id, clean);
    return true;
  },
});

/** Tune scoring settings. */
export const updateSettings = mutation({
  args: {
    deviceId: v.string(),
    settings: v.object({
      categoryMultipliers: v.record(v.string(), v.number()),
      defaultPlacementPoints: v.array(v.number()),
      winBonus: v.number(),
      allowSelfClaim: v.boolean(),
    }),
  },
  handler: async (ctx, { deviceId, settings }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    await ctx.db.patch(event._id, { settings });
    return true;
  },
});

/** Move the whole event between lifecycle states. */
export const setStatus = mutation({
  args: {
    deviceId: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("rsvp"),
      v.literal("live"),
      v.literal("finished"),
    ),
  },
  handler: async (ctx, { deviceId, status }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    await ctx.db.patch(event._id, { status });
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message:
        status === "live"
          ? "The games are LIVE! Let the Beerlympics begin! 🏁"
          : status === "finished"
            ? "That's a wrap on Beerlympics! 🏆"
            : `Event status: ${status}`,
      emoji: status === "live" ? "🏁" : status === "finished" ? "🏆" : "📣",
    });
    return true;
  },
});

/** Reveal the host code to an existing host (e.g. to re-share). */
export const getHostCode = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await getUserByDevice(ctx, deviceId);
    if (!user?.isHost) return null;
    const event = await getActiveEvent(ctx);
    return event?.hostCode ?? null;
  },
});
