import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getActiveEvent, getUserByDevice, recordActivity } from "./lib";

const rsvpStatus = v.union(v.literal("yes"), v.literal("no"), v.literal("maybe"));

/** The current device's RSVP + team, if any. */
export const mine = query({
  args: { deviceId: v.optional(v.string()) },
  handler: async (ctx, { deviceId }) => {
    const event = await getActiveEvent(ctx);
    const user = await getUserByDevice(ctx, deviceId);
    if (!event || !user) return null;
    const player = await ctx.db
      .query("players")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user._id),
      )
      .unique();
    if (!player) return null;
    const team = player.teamId ? await ctx.db.get(player.teamId) : null;
    return { player, team };
  },
});

/** Create or update the caller's RSVP. */
export const respond = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    emoji: v.optional(v.string()),
    status: rsvpStatus,
    plusOnes: v.optional(v.number()),
    note: v.optional(v.string()),
    email: v.optional(v.string()),
    invitedViaCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event to RSVP to yet.");

    // The signed-in user (Convex Auth). Sync their display name/emoji.
    const user = await getUserByDevice(ctx);
    if (!user) throw new Error("Sign in to RSVP.");
    const now = Date.now();
    const name = args.name.trim() || user.name || "Player";
    const emoji = args.emoji || user.emoji || "beer";
    await ctx.db.patch(user._id, { name, emoji, lastSeenAt: now });

    const existing = await ctx.db
      .query("players")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user!._id),
      )
      .unique();

    const isNewYes =
      args.status === "yes" && (!existing || existing.status !== "yes");

    if (existing) {
      await ctx.db.patch(existing._id, {
        name,
        emoji,
        status: args.status,
        plusOnes: Math.max(0, args.plusOnes ?? existing.plusOnes ?? 0),
        note: args.note ?? existing.note,
        email: args.email ?? existing.email,
        invitedViaCode: args.invitedViaCode ?? existing.invitedViaCode,
        respondedAt: now,
      });
    } else {
      await ctx.db.insert("players", {
        eventId: event._id,
        userId: user._id,
        name,
        emoji,
        status: args.status,
        plusOnes: Math.max(0, args.plusOnes ?? 0),
        note: args.note,
        email: args.email,
        invitedViaCode: args.invitedViaCode,
        respondedAt: now,
      });
    }

    if (isNewYes) {
      await recordActivity(ctx, event._id, {
        kind: "rsvp",
        message: `${name} is IN for Beerlympics!`,
      });
    }

    // Fire off a confirmation email (best-effort, never blocks the RSVP).
    if (args.status === "yes" && args.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendRsvpConfirmation, {
        to: args.email,
        name,
        eventName: event.name,
        dateIso: event.dateIso,
        startTime: event.startTime,
        location: event.location,
      });
    }
    return true;
  },
});

/** Full guest list for the event (RSVP board). */
export const guests = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const players = await ctx.db
      .query("players")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    return players
      .sort((a, b) => a.respondedAt - b.respondedAt)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        emoji: p.emoji,
        status: p.status,
        plusOnes: p.plusOnes,
        note: p.note,
        teamId: p.teamId,
      }));
  },
});
