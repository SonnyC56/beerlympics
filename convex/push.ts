import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";
import type { Id } from "./_generated/dataModel";

/** Public VAPID key the client needs to subscribe (safe to expose). */
export const publicKey = query({
  args: {},
  handler: async () => process.env.VAPID_PUBLIC_KEY ?? null,
});

/** Save (or move) a browser push subscription to the signed-in user. */
export const subscribe = mutation({
  args: {
    deviceId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, { endpoint, p256dh, auth }) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { userId: user._id, p256dh, auth });
      return existing._id;
    }
    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint,
      p256dh,
      auth,
      createdAt: Date.now(),
    });
  },
});

/** Remove a subscription (on opt-out). */
export const unsubscribe = mutation({
  args: { deviceId: v.string(), endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (sub) await ctx.db.delete(sub._id);
    return true;
  },
});

/** Whether the signed-in user has any push subscription on record. */
export const isSubscribed = query({
  args: { deviceId: v.optional(v.string()), endpoint: v.optional(v.string()) },
  handler: async (ctx, { endpoint }) => {
    if (!endpoint) return false;
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    return !!sub;
  },
});

/**
 * Internal: build the push payloads for everyone in a just-seated match —
 * each player on each team gets a "you're up" message naming their opponent.
 */
export const payloadsForMatch = internalQuery({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) return [];
    const game = await ctx.db.get(match.gameId);
    const station = match.stationId ? await ctx.db.get(match.stationId) : null;
    const teams = await Promise.all(match.teamIds.map((id) => ctx.db.get(id)));

    const out: {
      id: Id<"pushSubscriptions">;
      endpoint: string;
      p256dh: string;
      auth: string;
      title: string;
      body: string;
    }[] = [];

    for (const team of teams) {
      if (!team) continue;
      const opponents = teams
        .filter((t) => t && t._id !== team._id)
        .map((t) => t!.name)
        .join(" & ");
      const where = station?.name ? ` at ${station.name}` : "";
      const vs = opponents ? ` vs ${opponents}` : "";
      const title = "🏟️ You're up!";
      const body = `${game?.emoji ?? "🎯"} ${game?.name ?? "Your match"}${where}${vs}`;

      const players = await ctx.db
        .query("players")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      for (const p of players) {
        const subs = await ctx.db
          .query("pushSubscriptions")
          .withIndex("by_user", (q) => q.eq("userId", p.userId))
          .collect();
        for (const s of subs) {
          out.push({
            id: s._id,
            endpoint: s.endpoint,
            p256dh: s.p256dh,
            auth: s.auth,
            title,
            body,
          });
        }
      }
    }
    return out;
  },
});

/** Internal: drop a dead subscription (410/404 from the push service). */
export const remove = internalMutation({
  args: { id: v.id("pushSubscriptions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
