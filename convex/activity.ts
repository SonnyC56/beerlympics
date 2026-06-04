import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertHost, getActiveEvent, recordActivity } from "./lib";

/** Recent activity ticker (newest first). */
export const feed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const rows = await ctx.db
      .query("activity")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .order("desc")
      .take(limit ?? 40);
    return rows;
  },
});

/** Host: broadcast an announcement to the ticker. */
export const announce = mutation({
  args: { deviceId: v.string(), message: v.string(), emoji: v.optional(v.string()) },
  handler: async (ctx, { deviceId, message, emoji }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: message.trim(),
      emoji: emoji || undefined,
    });
    return true;
  },
});
