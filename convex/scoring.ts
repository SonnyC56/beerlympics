import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertHost, awardPoints, getActiveEvent, recordActivity } from "./lib";

/**
 * The live grand-total leaderboard. Sums every team's score ledger and breaks
 * it down per game so the scoreboard can show where points came from.
 */
export const standings = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return { teams: [], games: [] };

    const [teams, allGames, entries] = await Promise.all([
      ctx.db
        .query("teams")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
      ctx.db
        .query("games")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
      ctx.db
        .query("scoreEntries")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
    ]);
    // Excluded games drop out of the breakdown (grand total still sums all points).
    const games = allGames.filter((g) => g.enabled !== false);

    const byTeam = new Map<
      string,
      { total: number; perGame: Map<string, number>; lastAt: number }
    >();
    for (const t of teams) {
      byTeam.set(t._id, { total: 0, perGame: new Map(), lastAt: 0 });
    }
    for (const e of entries) {
      const bucket = byTeam.get(e.teamId);
      if (!bucket) continue;
      bucket.total += e.points;
      if (e.gameId) {
        bucket.perGame.set(
          e.gameId,
          (bucket.perGame.get(e.gameId) ?? 0) + e.points,
        );
      }
      bucket.lastAt = Math.max(bucket.lastAt, e.createdAt);
    }

    const ranked = teams
      .map((t) => {
        const bucket = byTeam.get(t._id)!;
        return {
          _id: t._id,
          name: t.name,
          emoji: t.emoji,
          color: t.color,
          theme: t.theme,
          motto: t.motto,
          total: bucket.total,
          lastAt: bucket.lastAt,
          perGame: games.map((g) => ({
            gameId: g._id,
            name: g.name,
            emoji: g.emoji,
            points: bucket.perGame.get(g._id) ?? 0,
          })),
        };
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    // Assign dense ranks (ties share a rank).
    let rank = 0;
    let prevTotal: number | null = null;
    const withRank = ranked.map((team, i) => {
      if (prevTotal === null || team.total !== prevTotal) rank = i + 1;
      prevTotal = team.total;
      return { ...team, rank };
    });

    return {
      teams: withRank,
      games: games
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((g) => ({
          _id: g._id,
          name: g.name,
          emoji: g.emoji,
          category: g.category,
          status: g.status,
        })),
    };
  },
});

/** Per-game standings: how each team placed within a single game's tournament. */
export const gameStandings = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const entries = await ctx.db
      .query("scoreEntries")
      .withIndex("by_event_and_game", (q) =>
        q.eq("eventId", event._id).eq("gameId", gameId),
      )
      .collect();
    const byTeam = new Map<string, { points: number; place?: number }>();
    for (const e of entries) {
      const cur = byTeam.get(e.teamId) ?? { points: 0 };
      cur.points += e.points;
      if (e.reason === "placement" && e.place) cur.place = e.place;
      byTeam.set(e.teamId, cur);
    }
    const out = await Promise.all(
      [...byTeam.entries()].map(async ([teamId, val]) => {
        const team = await ctx.db.get(teamId as any);
        return {
          teamId,
          name: (team as any)?.name ?? "—",
          emoji: (team as any)?.emoji ?? "",
          color: (team as any)?.color ?? "gold",
          points: val.points,
          place: val.place,
        };
      }),
    );
    return out.sort(
      (a, b) => (a.place ?? 99) - (b.place ?? 99) || b.points - a.points,
    );
  },
});

/** The score ledger for a single team (audit trail). */
export const teamLedger = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const entries = await ctx.db
      .query("scoreEntries")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .order("desc")
      .collect();
    return entries;
  },
});

/** Host: award/deduct manual points (bonus, penalty, or correction). */
export const award = mutation({
  args: {
    deviceId: v.string(),
    teamId: v.id("teams"),
    points: v.number(),
    reason: v.union(
      v.literal("bonus"),
      v.literal("penalty"),
      v.literal("manual"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { deviceId, teamId, points, reason, note }) => {
    const host = await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const signed = reason === "penalty" ? -Math.abs(points) : points;
    await awardPoints(ctx, {
      eventId: event._id,
      teamId,
      points: signed,
      reason,
      note,
      createdByUserId: host._id,
    });
    const team = await ctx.db.get(teamId);
    await recordActivity(ctx, event._id, {
      kind: "bonus",
      message: `${signed >= 0 ? "➕" : "➖"} ${team?.emoji ?? ""} ${team?.name ?? "Team"} ${signed >= 0 ? "earned" : "lost"} ${Math.abs(signed)} pts${note ? ` — ${note}` : ""}`,
      emoji: signed >= 0 ? "✨" : "⚠️",
      teamId,
    });
    return true;
  },
});

/** Host: delete a single ledger entry. */
export const removeEntry = mutation({
  args: { deviceId: v.string(), entryId: v.id("scoreEntries") },
  handler: async (ctx, { deviceId, entryId }) => {
    await assertHost(ctx, deviceId);
    await ctx.db.delete(entryId);
    return true;
  },
});
