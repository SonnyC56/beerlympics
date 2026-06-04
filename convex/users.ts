import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveEvent, getUserByDevice } from "./lib";

const DEFAULT_EMOJI = "beer"; // mascot key

/** The current user for a device, or null if they haven't set a name yet. */
export const current = query({
  args: { deviceId: v.optional(v.string()) },
  handler: async (ctx, { deviceId }) => {
    return await getUserByDevice(ctx, deviceId);
  },
});

/**
 * Create-or-touch a user for this device. Called on app load. If `name` is
 * provided and the user is new (or has a placeholder name) it is applied.
 */
export const ensure = mutation({
  args: {
    deviceId: v.string(),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, { name, emoji }) => {
    const user = await getUserByDevice(ctx);
    if (!user) throw new Error("Sign in first.");
    await ctx.db.patch(user._id, {
      lastSeenAt: Date.now(),
      ...(name && name.trim() ? { name: name.trim() } : {}),
      ...(emoji ? { emoji } : {}),
      ...(!user.emoji && !emoji ? { emoji: DEFAULT_EMOJI } : {}),
    });
    return user._id;
  },
});

/** Update the player's display name / emoji. */
export const setProfile = mutation({
  args: {
    deviceId: v.string(),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, { deviceId, name, emoji }) => {
    const user = await getUserByDevice(ctx, deviceId);
    if (!user) throw new Error("Unknown device.");
    const patch: Record<string, unknown> = {};
    if (name && name.trim()) patch.name = name.trim();
    if (emoji) patch.emoji = emoji;
    await ctx.db.patch(user._id, patch);

    // Keep the player's denormalized name in sync across the event.
    const event = await getActiveEvent(ctx);
    if (event) {
      const player = await ctx.db
        .query("players")
        .withIndex("by_event_and_user", (q) =>
          q.eq("eventId", event._id).eq("userId", user._id),
        )
        .unique();
      if (player) {
        await ctx.db.patch(player._id, {
          ...(patch.name ? { name: patch.name as string } : {}),
          ...(patch.emoji ? { emoji: patch.emoji as string } : {}),
        });
      }
    }
    return user._id;
  },
});

/** Unlock host powers by entering the event host code. */
export const claimHost = mutation({
  args: { deviceId: v.string(), code: v.string() },
  handler: async (ctx, { deviceId, code }) => {
    const user = await getUserByDevice(ctx, deviceId);
    if (!user) throw new Error("Set your name first.");
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event yet.");
    if (code.trim().toUpperCase() !== event.hostCode.toUpperCase()) {
      throw new Error("That host code is incorrect.");
    }
    await ctx.db.patch(user._id, { isHost: true });
    return true;
  },
});

/** Step down as host (e.g. on a shared device). */
export const resignHost = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await getUserByDevice(ctx, deviceId);
    if (user) await ctx.db.patch(user._id, { isHost: false });
    return true;
  },
});
