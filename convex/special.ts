import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  assertHost,
  awardPoints,
  getActiveEvent,
  recordActivity,
} from "./lib";

/**
 * All-day "special events" (Longest Keg Stand, Karaoke Points, …) are games with
 * format "special". The host awards points to teams anytime; points flow into
 * the team's total tagged to this game.
 */

/** Host: award points to a team for a special event. */
export const award = mutation({
  args: {
    deviceId: v.string(),
    gameId: v.id("games"),
    teamId: v.id("teams"),
    points: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { deviceId, gameId, teamId, points, note }) => {
    const host = await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found.");
    const team = await ctx.db.get(teamId);
    if (!team) throw new Error("Team not found.");

    await awardPoints(ctx, {
      eventId: event._id,
      teamId,
      gameId,
      points,
      reason: points >= 0 ? "bonus" : "penalty",
      note: note?.trim() || game.name,
      createdByUserId: host._id,
    });

    await recordActivity(ctx, event._id, {
      kind: "bonus",
      message: `${game.emoji} ${team.emoji} ${team.name} scored ${points >= 0 ? "+" : ""}${points} in ${game.name}${note ? ` — ${note.trim()}` : ""}`,
      emoji: game.emoji,
      teamId,
    });
    return true;
  },
});

/** Recent awards for a special event (newest first), with team info. */
export const awards = query({
  args: { gameId: v.id("games"), limit: v.optional(v.number()) },
  handler: async (ctx, { gameId, limit }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const rows = await ctx.db
      .query("scoreEntries")
      .withIndex("by_event_and_game", (q) =>
        q.eq("eventId", event._id).eq("gameId", gameId),
      )
      .order("desc")
      .take(limit ?? 30);
    return await Promise.all(
      rows.map(async (r) => {
        const team = await ctx.db.get(r.teamId);
        return {
          _id: r._id,
          points: r.points,
          note: r.note,
          createdAt: r.createdAt,
          teamName: team?.name ?? "—",
          teamEmoji: team?.emoji ?? "",
          teamColor: team?.color ?? "gold",
        };
      }),
    );
  },
});
