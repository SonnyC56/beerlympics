import { query } from "./_generated/server";
import { getActiveEvent } from "./lib";

/**
 * CLOSING CEREMONY — the champion podium.
 * Returns the top 3 (dense-ranked, ties share a step) with their flag, mascot,
 * color, and grand total, plus the reveal timestamp the host controls. The TV
 * page at /scoreboard/tv/podium animates the reveal bottom-up (3rd, 2nd, 1st).
 */
export const podium = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return null;

    const [teams, entries] = await Promise.all([
      ctx.db
        .query("teams")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
      ctx.db
        .query("scoreEntries")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect(),
    ]);

    const totals = new Map<string, number>();
    for (const t of teams) totals.set(t._id, 0);
    for (const e of entries) {
      totals.set(e.teamId, (totals.get(e.teamId) ?? 0) + e.points);
    }

    const ranked = teams
      .map((t) => ({ t, total: totals.get(t._id) ?? 0 }))
      .sort((a, b) => b.total - a.total || a.t.name.localeCompare(b.t.name));

    const top: {
      _id: string;
      rank: number;
      name: string;
      color: string;
      emoji: string;
      total: number;
      flagUrl: string | null;
    }[] = [];
    let rank = 0;
    let prev: number | null = null;
    for (let i = 0; i < ranked.length; i++) {
      const { t, total } = ranked[i];
      if (prev === null || total !== prev) rank = i + 1;
      prev = total;
      if (rank > 3) break;
      top.push({
        _id: t._id,
        rank,
        name: t.name,
        color: t.color,
        emoji: t.emoji,
        total,
        flagUrl: t.flagStorageId
          ? await ctx.storage.getUrl(t.flagStorageId)
          : null,
      });
    }

    return {
      eventName: event.name,
      status: event.status,
      revealedAt: event.podiumAt ?? null,
      teams: top,
    };
  },
});
