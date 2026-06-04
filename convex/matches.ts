import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  assertHost,
  awardPoints,
  getActiveEvent,
  getUserByDevice,
  recordActivity,
  requireUser,
} from "./lib";
import {
  advanceFromMatch,
  finalizeInstanceIfComplete,
  runDispatch,
} from "./engine";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ── Enrichment ────────────────────────────────────────────────────────────────
async function teamLite(ctx: QueryCtx | MutationCtx, id: Id<"teams">) {
  const t = await ctx.db.get(id);
  return t
    ? { _id: t._id, name: t.name, emoji: t.emoji, color: t.color }
    : { _id: id, name: "TBD", emoji: "•", color: "ink" };
}

async function enrichMatch(ctx: QueryCtx | MutationCtx, m: Doc<"matches">) {
  const teams = await Promise.all(m.teamIds.map((id) => teamLite(ctx, id)));
  return { ...m, teams };
}

// ── Result reporting ──────────────────────────────────────────────────────────
async function freeStationFor(ctx: MutationCtx, match: Doc<"matches">) {
  if (match.stationId) {
    const station = await ctx.db.get(match.stationId);
    if (station && station.currentMatchId === match._id) {
      await ctx.db.patch(station._id, {
        status: station.status === "closed" ? "closed" : "open",
        currentMatchId: undefined,
      });
    }
  }
}

/** Enter a match result. Awards points, advances the winner, re-dispatches. */
export const reportResult = mutation({
  args: {
    deviceId: v.string(),
    matchId: v.id("matches"),
    winnerTeamId: v.optional(v.id("teams")),
    rankings: v.optional(
      v.array(v.object({ teamId: v.id("teams"), place: v.number() })),
    ),
  },
  handler: async (ctx, args) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found.");
    if (match.status === "completed") {
      throw new Error("Match already has a result. Reopen it to change it.");
    }
    const user = await requireUser(ctx, args.deviceId);

    // Permission: host always; players only if self-claim is allowed and they
    // are in the match.
    if (!user.isHost) {
      if (!event.settings.allowSelfClaim) {
        throw new Error("Only the host can enter results.");
      }
      const player = await ctx.db
        .query("players")
        .withIndex("by_event_and_user", (q) =>
          q.eq("eventId", event._id).eq("userId", user._id),
        )
        .unique();
      const onTeam = player?.teamId && match.teamIds.includes(player.teamId);
      if (!onTeam) throw new Error("You can only score your own matches.");
    }

    // Normalize rankings.
    let rankings = args.rankings;
    if (!rankings) {
      if (!args.winnerTeamId) throw new Error("Pick a winner.");
      rankings = match.teamIds.map((teamId) => ({
        teamId,
        place: teamId === args.winnerTeamId ? 1 : 2,
      }));
    }
    rankings = [...rankings].sort((a, b) => a.place - b.place);
    const winnerTeamId = args.winnerTeamId ?? rankings[0]?.teamId;

    await ctx.db.patch(match._id, {
      status: "completed",
      winnerTeamId,
      rankings,
      completedAt: Date.now(),
    });
    await freeStationFor(ctx, match);

    const game = await ctx.db.get(match.gameId);

    // Win bonus to the first-place team(s).
    if (game && event.settings.winBonus > 0) {
      for (const r of rankings.filter((x) => x.place === 1)) {
        await awardPoints(ctx, {
          eventId: event._id,
          teamId: r.teamId,
          gameId: game._id,
          matchId: match._id,
          phaseIndex: match.phaseIndex,
          points: event.settings.winBonus,
          reason: "win",
          note: `Won a ${game.name} match`,
          createdByUserId: user._id,
        });
      }
    }

    // Advance + maybe finalize the tournament instance.
    const completed = await ctx.db.get(match._id);
    if (completed) await advanceFromMatch(ctx, completed);
    if (game) {
      await finalizeInstanceIfComplete(
        ctx,
        event,
        game,
        match.phaseIndex,
        user._id,
      );
    }

    // Activity (skip placement champ line; that's logged by finalize).
    if (winnerTeamId && game) {
      const w = await ctx.db.get(winnerTeamId);
      await recordActivity(ctx, event._id, {
        kind: "result",
        message: `${w?.emoji ?? ""} ${w?.name ?? "A team"} took a ${game.emoji} ${game.name} match`,
        emoji: game.emoji,
        teamId: winnerTeamId,
      });
    }

    const started = await runDispatch(ctx, event);
    return { started };
  },
});

/** Host: reopen a completed match to correct it. Reverts points + advancement. */
export const reopenMatch = mutation({
  args: { deviceId: v.string(), matchId: v.id("matches") },
  handler: async (ctx, { deviceId, matchId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const match = await ctx.db.get(matchId);
    if (!match || match.status !== "completed") return true;

    // Refuse if a downstream match already started.
    if (match.nextMatchId) {
      const next = await ctx.db.get(match.nextMatchId);
      if (next && ["in_progress", "queued", "completed"].includes(next.status)) {
        throw new Error(
          "A later match has already started — reopen that one first.",
        );
      }
      // Pull the winner back out of the next match.
      if (next && match.winnerTeamId) {
        const teamIds = next.teamIds.filter((t) => t !== match.winnerTeamId);
        await ctx.db.patch(next._id, {
          teamIds,
          status: "pending",
        });
      }
    }

    // Remove win points for this match.
    const winEntries = await ctx.db
      .query("scoreEntries")
      .withIndex("by_match", (q) => q.eq("matchId", matchId))
      .collect();
    for (const e of winEntries) await ctx.db.delete(e._id);

    // Remove placement points for the instance (re-awarded when it completes).
    const placements = await ctx.db
      .query("scoreEntries")
      .withIndex("by_event_and_game", (q) =>
        q.eq("eventId", event._id).eq("gameId", match.gameId),
      )
      .collect();
    for (const e of placements) {
      if (e.reason === "placement" && e.phaseIndex === match.phaseIndex) {
        await ctx.db.delete(e._id);
      }
    }

    await ctx.db.patch(matchId, {
      status: "ready",
      winnerTeamId: undefined,
      rankings: undefined,
      completedAt: undefined,
      stationId: undefined,
    });
    return true;
  },
});

/** Host: force-seat a specific ready match at a station. */
export const assign = mutation({
  args: {
    deviceId: v.string(),
    matchId: v.id("matches"),
    stationId: v.id("stations"),
  },
  handler: async (ctx, { deviceId, matchId, stationId }) => {
    await assertHost(ctx, deviceId);
    const match = await ctx.db.get(matchId);
    const station = await ctx.db.get(stationId);
    if (!match || !station) throw new Error("Not found.");
    if (station.status === "busy") throw new Error("Station is occupied.");
    if (match.teamIds.length < 1) throw new Error("Match has no teams yet.");
    await ctx.db.patch(matchId, {
      status: "in_progress",
      stationId,
      startedAt: Date.now(),
    });
    await ctx.db.patch(stationId, { status: "busy", currentMatchId: matchId });
    return true;
  },
});

/** Host: send an in-progress match back to the queue (no result). */
export const unseat = mutation({
  args: { deviceId: v.string(), matchId: v.id("matches") },
  handler: async (ctx, { deviceId, matchId }) => {
    await assertHost(ctx, deviceId);
    const match = await ctx.db.get(matchId);
    if (!match) return true;
    await freeStationFor(ctx, match);
    await ctx.db.patch(matchId, {
      status: match.teamIds.length >= 2 ? "ready" : "pending",
      stationId: undefined,
      startedAt: undefined,
    });
    return true;
  },
});

// ── Queries ───────────────────────────────────────────────────────────────────

/** Live station board: what's playing now + what's on deck per station. */
export const board = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return { stations: [], upNext: [] };

    const stations = (
      await ctx.db
        .query("stations")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect()
    ).sort((a, b) => a.sortOrder - b.sortOrder);

    const enrichedStations = await Promise.all(
      stations.map(async (s) => {
        const game = await ctx.db.get(s.gameId);
        const match = s.currentMatchId
          ? await ctx.db.get(s.currentMatchId)
          : null;
        return {
          ...s,
          game: game
            ? { _id: game._id, name: game.name, emoji: game.emoji, category: game.category, art: game.art }
            : null,
          match: match ? await enrichMatch(ctx, match) : null,
        };
      }),
    );

    // Up-next queue: ready matches in the current phase.
    const ready = (
      await ctx.db
        .query("matches")
        .withIndex("by_event_and_status", (q) =>
          q.eq("eventId", event._id).eq("status", "ready"),
        )
        .collect()
    ).filter((m) => m.phaseIndex === event.currentPhaseIndex);
    const upNext = await Promise.all(
      ready
        .sort((a, b) => a.round - b.round || a.slot - b.slot)
        .map(async (m) => {
          const game = await ctx.db.get(m.gameId);
          return {
            ...(await enrichMatch(ctx, m)),
            gameName: game?.name,
            gameEmoji: game?.emoji,
          };
        }),
    );

    return { stations: enrichedStations, upNext };
  },
});

/** Everything happening right now (for a "now playing" strip). */
export const live = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const rows = await ctx.db
      .query("matches")
      .withIndex("by_event_and_status", (q) =>
        q.eq("eventId", event._id).eq("status", "in_progress"),
      )
      .collect();
    return await Promise.all(
      rows.map(async (m) => {
        const game = await ctx.db.get(m.gameId);
        const station = m.stationId ? await ctx.db.get(m.stationId) : null;
        return {
          ...(await enrichMatch(ctx, m)),
          gameName: game?.name,
          gameEmoji: game?.emoji,
          stationName: station?.name,
        };
      }),
    );
  },
});

/** A single match with resolved teams. */
export const get = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const m = await ctx.db.get(matchId);
    if (!m) return null;
    const game = await ctx.db.get(m.gameId);
    const station = m.stationId ? await ctx.db.get(m.stationId) : null;
    return {
      ...(await enrichMatch(ctx, m)),
      game,
      stationName: station?.name,
    };
  },
});

/** Bracket / all matches for a game, grouped by round. */
export const forGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();
    const enriched = await Promise.all(matches.map((m) => enrichMatch(ctx, m)));
    enriched.sort((a, b) => a.round - b.round || a.slot - b.slot);
    return enriched;
  },
});

/** Matches involving the caller's team (so a player sees "you're up next"). */
export const mine = query({
  args: { deviceId: v.optional(v.string()) },
  handler: async (ctx, { deviceId }) => {
    const event = await getActiveEvent(ctx);
    const user = await getUserByDevice(ctx, deviceId);
    if (!event || !user) return [];
    const player = await ctx.db
      .query("players")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user._id),
      )
      .unique();
    if (!player?.teamId) return [];
    const teamId = player.teamId;
    const all = await ctx.db
      .query("matches")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const mine = all.filter(
      (m) => m.teamIds.includes(teamId) && m.status !== "completed" && m.status !== "void",
    );
    return await Promise.all(
      mine
        .sort((a, b) => a.round - b.round)
        .map(async (m) => {
          const game = await ctx.db.get(m.gameId);
          const station = m.stationId ? await ctx.db.get(m.stationId) : null;
          return {
            ...(await enrichMatch(ctx, m)),
            gameName: game?.name,
            gameEmoji: game?.emoji,
            stationName: station?.name,
          };
        }),
    );
  },
});
