import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveEvent, getUserByDevice, requireUser } from "./lib";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * OPENING ODDS — pre-game podium predictions.
 * Guests pick who they think finishes 1st / 2nd / 3rd before the games start.
 * Predictions lock once the event goes live, and are scored against the live
 * (then final) standings: an exact-slot hit is worth more than just naming a
 * podium team.
 */
const EXACT = 5;
const PODIUM = 2;

/** Current top-3 team ids (by grand total) from the score ledger. */
async function podiumNow(
  ctx: Parameters<typeof getActiveEvent>[0],
  event: Doc<"events">,
): Promise<Id<"teams">[]> {
  const [teams, entries] = await Promise.all([
    ctx.db.query("teams").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect(),
    ctx.db.query("scoreEntries").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect(),
  ]);
  const totals = new Map<string, number>();
  for (const t of teams) totals.set(t._id, 0);
  for (const e of entries) totals.set(e.teamId, (totals.get(e.teamId) ?? 0) + e.points);
  return teams
    .map((t) => ({ id: t._id, total: totals.get(t._id) ?? 0, name: t.name }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((t) => t.id);
}

function scorePick(
  pick: (Id<"teams"> | undefined)[],
  podium: Id<"teams">[],
): number {
  let s = 0;
  for (let i = 0; i < pick.length; i++) {
    const p = pick[i];
    if (!p) continue;
    if (podium[i] === p) s += EXACT;
    else if (podium.includes(p)) s += PODIUM;
  }
  return s;
}

/** Public: my current prediction (or null). */
export const mine = query({
  args: { deviceId: v.optional(v.string()) },
  handler: async (ctx, { deviceId }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return null;
    const user = await getUserByDevice(ctx, deviceId);
    if (!user) return null;
    return await ctx.db
      .query("predictions")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user._id),
      )
      .unique();
  },
});

/** Public: how open the board is + how many have predicted. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return null;
    const all = await ctx.db
      .query("predictions")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const locked = event.status === "live" || event.status === "finished";
    return { count: all.length, locked, eventStatus: event.status };
  },
});

/** Submit / update my podium prediction (locks once the games are live). */
export const submit = mutation({
  args: {
    deviceId: v.string(),
    first: v.id("teams"),
    second: v.optional(v.id("teams")),
    third: v.optional(v.id("teams")),
  },
  handler: async (ctx, { deviceId, first, second, third }) => {
    const user = await requireUser(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    if (event.status === "live" || event.status === "finished") {
      throw new Error("Predictions are locked — the games have started.");
    }
    const picks = [first, second, third].filter(Boolean) as Id<"teams">[];
    if (new Set(picks).size !== picks.length) {
      throw new Error("Pick three different teams.");
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("predictions")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { first, second, third, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("predictions", {
      eventId: event._id,
      userId: user._id,
      name: user.name ?? "Someone",
      first,
      second,
      third,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** The predictor leaderboard, scored vs current standings (provisional until final). */
export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return { provisional: true, podium: [], predictors: [] };

    const podium = await podiumNow(ctx, event);
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const teamName = new Map(teams.map((t) => [t._id as string, t]));

    const preds = await ctx.db
      .query("predictions")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();

    const predictors = preds
      .map((p) => ({
        _id: p._id,
        name: p.name,
        score: scorePick([p.first, p.second, p.third], podium),
        picks: [p.first, p.second, p.third].map((id) =>
          id
            ? {
                _id: id,
                name: teamName.get(id)?.name ?? "—",
                emoji: teamName.get(id)?.emoji ?? "star",
                color: teamName.get(id)?.color ?? "gold",
              }
            : null,
        ),
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    return {
      provisional: event.status !== "finished",
      podium: podium.map((id) => ({
        _id: id,
        name: teamName.get(id)?.name ?? "—",
        emoji: teamName.get(id)?.emoji ?? "star",
        color: teamName.get(id)?.color ?? "gold",
      })),
      predictors,
    };
  },
});
