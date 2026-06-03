import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertHost, getActiveEvent } from "./lib";

const phaseKind = v.union(
  v.literal("qualifier"),
  v.literal("knockout"),
  v.literal("semifinal"),
  v.literal("final"),
);

/** All phases in order. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const phases = await ctx.db
      .query("phases")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    return phases.sort((a, b) => a.index - b.index);
  },
});

/** Host: add a phase at the end. */
export const create = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    kind: phaseKind,
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertHost(ctx, args.deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const phases = await ctx.db
      .query("phases")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    return await ctx.db.insert("phases", {
      eventId: event._id,
      index: phases.length,
      name: args.name.trim(),
      kind: args.kind,
      description: args.description?.trim(),
      status: "locked",
    });
  },
});

/** Host: edit a phase. */
export const update = mutation({
  args: {
    deviceId: v.string(),
    phaseId: v.id("phases"),
    patch: v.object({
      name: v.optional(v.string()),
      kind: v.optional(phaseKind),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { deviceId, phaseId, patch }) => {
    await assertHost(ctx, deviceId);
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, val]) => val !== undefined),
    );
    await ctx.db.patch(phaseId, clean);
    return true;
  },
});
