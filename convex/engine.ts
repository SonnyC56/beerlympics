/**
 * THE CIRCUIT — fluid tournament engine helpers.
 *
 * These are plain async helpers (not registered functions) shared by
 * `tournament.ts` and `matches.ts`. The two ideas that make the day fluid:
 *
 *  1. A greedy, idempotent DISPATCHER (`runDispatch`) that — on every
 *     resource-freeing event — seats the highest-priority ready match at every
 *     open station, never double-booking a team. Re-running it is always safe.
 *     This is what keeps everyone busy instead of waiting on one bracket.
 *
 *  2. An immutable score LEDGER: placement points are appended once per
 *     (game, phase) tournament instance, scaled by a rising phase multiplier,
 *     so the grand total is always a pure sum and overrides are just new rows.
 *
 * Beer Die is gated: gated games can only be seated once the event has reached
 * the game's `gateFromPhaseIndex` (its stations also start closed).
 */
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { awardPoints, placementToPoints, recordActivity } from "./lib";

// Rising stakes: later phases are worth more, so no team is ever dead-in-the-water.
export function phaseMultiplier(kind: Doc<"phases">["kind"] | undefined): number {
  switch (kind) {
    case "knockout":
      return 1.5;
    case "semifinal":
      return 1.75;
    case "final":
      return 2;
    case "qualifier":
    default:
      return 1;
  }
}

export async function getPhaseByIndex(
  ctx: MutationCtx,
  eventId: Id<"events">,
  index: number,
): Promise<Doc<"phases"> | null> {
  return await ctx.db
    .query("phases")
    .withIndex("by_event_and_index", (q) =>
      q.eq("eventId", eventId).eq("index", index),
    )
    .unique();
}

/** Is this game allowed to run at the event's current phase? (Beer Die gating.) */
export function gameEligible(game: Doc<"games">, event: Doc<"events">): boolean {
  if (!game.isGated) return true;
  const gate = game.gateFromPhaseIndex ?? Number.MAX_SAFE_INTEGER;
  return event.currentPhaseIndex >= gate;
}

/** Teams currently committed to a station (in-progress or queued). */
async function busyTeamIds(
  ctx: MutationCtx,
  eventId: Id<"events">,
): Promise<Set<string>> {
  const busy = new Set<string>();
  for (const status of ["in_progress", "queued"] as const) {
    const rows = await ctx.db
      .query("matches")
      .withIndex("by_event_and_status", (q) =>
        q.eq("eventId", eventId).eq("status", status),
      )
      .collect();
    for (const m of rows) for (const t of m.teamIds) busy.add(t);
  }
  return busy;
}

/**
 * THE DISPATCHER. Seats one ready match at every open, eligible station,
 * preferring earlier rounds and the longest-idle teams. Idempotent.
 * Returns the number of matches started.
 */
export async function runDispatch(
  ctx: MutationCtx,
  event: Doc<"events">,
): Promise<number> {
  const openStations = (
    await ctx.db
      .query("stations")
      .withIndex("by_event_and_status", (q) =>
        q.eq("eventId", event._id).eq("status", "open"),
      )
      .collect()
  ).sort((a, b) => a.sortOrder - b.sortOrder);
  if (openStations.length === 0) return 0;

  // When did each team last finish a match? Teams that never played (0) are the
  // most "starved" and get top priority so nobody sits out.
  const completed = await ctx.db
    .query("matches")
    .withIndex("by_event_and_status", (q) =>
      q.eq("eventId", event._id).eq("status", "completed"),
    )
    .collect();
  const lastActive = new Map<string, number>();
  for (const m of completed) {
    for (const t of m.teamIds) {
      lastActive.set(t, Math.max(lastActive.get(t) ?? 0, m.completedAt ?? 0));
    }
  }

  const busy = await busyTeamIds(ctx, event._id);
  const gameCache = new Map<string, Doc<"games"> | null>();
  const getGame = async (id: Id<"games">) => {
    const key = id as string;
    if (!gameCache.has(key)) gameCache.set(key, await ctx.db.get(id));
    return gameCache.get(key) ?? null;
  };

  // Pre-load ready matches per game once.
  const readyByGame = new Map<string, Doc<"matches">[]>();
  const allReady = await ctx.db
    .query("matches")
    .withIndex("by_event_and_status", (q) =>
      q.eq("eventId", event._id).eq("status", "ready"),
    )
    .collect();
  for (const m of allReady) {
    if (m.phaseIndex !== event.currentPhaseIndex) continue;
    const arr = readyByGame.get(m.gameId as string) ?? [];
    arr.push(m);
    readyByGame.set(m.gameId as string, arr);
  }

  let started = 0;
  for (const station of openStations) {
    const game = await getGame(station.gameId);
    if (!game || !gameEligible(game, event)) continue;

    const candidates = (readyByGame.get(station.gameId as string) ?? [])
      .filter((m) => m.teamIds.length > 0 && m.teamIds.every((t) => !busy.has(t)))
      .sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        const aWait = Math.min(...a.teamIds.map((t) => lastActive.get(t) ?? 0));
        const bWait = Math.min(...b.teamIds.map((t) => lastActive.get(t) ?? 0));
        return aWait - bWait; // longest-idle (smallest lastActive) first
      });

    const match = candidates[0];
    if (!match) continue;

    await ctx.db.patch(match._id, {
      status: "in_progress",
      stationId: station._id,
      startedAt: Date.now(),
    });
    await ctx.db.patch(station._id, {
      status: "busy",
      currentMatchId: match._id,
    });
    // Buzz the players: "you're up next" push (no-op if push isn't configured).
    await ctx.scheduler.runAfter(0, internal.pushSender.sendToMatch, {
      matchId: match._id,
    });
    for (const t of match.teamIds) busy.add(t);
    // Remove from the pool so it isn't seated twice in this pass.
    readyByGame.set(
      station.gameId as string,
      (readyByGame.get(station.gameId as string) ?? []).filter(
        (m) => m._id !== match._id,
      ),
    );
    started++;
  }
  return started;
}

/** Push a completed match's winner (and optionally loser) into downstream matches. */
export async function advanceFromMatch(
  ctx: MutationCtx,
  match: Doc<"matches">,
): Promise<void> {
  const feed = async (
    nextMatchId: Id<"matches"> | undefined,
    teamId: Id<"teams"> | undefined,
  ) => {
    if (!nextMatchId || !teamId) return;
    const next = await ctx.db.get(nextMatchId);
    if (!next) return;
    if (next.teamIds.includes(teamId)) return; // idempotent
    const teamIds = [...next.teamIds, teamId];
    const expected = next.sourceRefs?.length ?? 2;
    const ready = teamIds.length >= expected;
    await ctx.db.patch(nextMatchId, {
      teamIds,
      status: ready ? "ready" : next.status,
    });
  };
  await feed(match.nextMatchId, match.winnerTeamId);
  if (match.loserNextMatchId) {
    const loser = match.teamIds.find((t) => t !== match.winnerTeamId);
    await feed(match.loserNextMatchId, loser);
  }
}

/** Final placements (1-based, ties allowed) for one game's phase instance. */
export function computePlacements(
  game: Doc<"games">,
  matches: Doc<"matches">[],
): { teamId: Id<"teams">; place: number }[] {
  const played = matches.filter((m) => m.status === "completed");
  const teamSet = new Set<string>();
  for (const m of played) for (const t of m.teamIds) teamSet.add(t);

  if (game.format === "single_elim") {
    const maxRound = played.reduce((r, m) => Math.max(r, m.round), 0);
    const places = new Map<string, number>();
    // Champion = winner of the terminal (final) match.
    const finalMatch = played.find((m) => m.round === maxRound && !m.nextMatchId);
    if (finalMatch?.winnerTeamId) places.set(finalMatch.winnerTeamId, 1);
    // Walk rounds from the final backward. Losers of each round are tied and
    // ranked just beneath everyone who survived longer. Counting ACTUAL losers
    // (byes contribute none) keeps places correct for any non-power-of-2 field —
    // no padded-bracket inflation, places never exceed the real team count.
    let placedAbove = places.size;
    for (let r = maxRound; r >= 1; r--) {
      const losers = played
        .filter((m) => m.round === r)
        .map((m) => m.teamIds.find((t) => t !== m.winnerTeamId))
        .filter((t): t is Id<"teams"> => !!t && !places.has(t as string));
      if (losers.length === 0) continue;
      const place = placedAbove + 1;
      for (const t of losers) places.set(t as string, place);
      placedAbove += losers.length;
    }
    return [...teamSet].map((t) => ({
      teamId: t as Id<"teams">,
      place: places.get(t) ?? placedAbove + 1,
    }));
  }

  // round_robin / ladder / heats: rank by accumulated performance points.
  const score = new Map<string, number>();
  for (const t of teamSet) score.set(t, 0);
  for (const m of played) {
    if (m.rankings && m.rankings.length > 0) {
      const size = m.rankings.length;
      for (const r of m.rankings) {
        score.set(r.teamId, (score.get(r.teamId) ?? 0) + (size - r.place + 1));
      }
    } else if (m.winnerTeamId) {
      score.set(m.winnerTeamId, (score.get(m.winnerTeamId) ?? 0) + 1);
    }
  }
  const ordered = [...teamSet].sort(
    (a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0),
  );
  const result: { teamId: Id<"teams">; place: number }[] = [];
  let place = 0;
  let prevScore: number | null = null;
  ordered.forEach((t, i) => {
    const s = score.get(t) ?? 0;
    if (prevScore === null || s !== prevScore) place = i + 1;
    prevScore = s;
    result.push({ teamId: t as Id<"teams">, place });
  });
  return result;
}

/**
 * If every match in a (game, phase) instance is done, append its placement
 * points to the ledger exactly once. Returns true if it finalized.
 */
export async function finalizeInstanceIfComplete(
  ctx: MutationCtx,
  event: Doc<"events">,
  game: Doc<"games">,
  phaseIndex: number,
  byUserId?: Id<"users">,
): Promise<boolean> {
  const all = (
    await ctx.db
      .query("matches")
      .withIndex("by_game", (q) => q.eq("gameId", game._id))
      .collect()
  ).filter((m) => m.phaseIndex === phaseIndex);
  if (all.length === 0) return false;
  const unfinished = all.filter(
    (m) => m.status !== "completed" && m.status !== "void",
  );
  if (unfinished.length > 0) return false;

  // Idempotency: bail if placement points already exist for this instance.
  const existing = await ctx.db
    .query("scoreEntries")
    .withIndex("by_event_and_game", (q) =>
      q.eq("eventId", event._id).eq("gameId", game._id),
    )
    .collect();
  if (
    existing.some((e) => e.reason === "placement" && e.phaseIndex === phaseIndex)
  ) {
    return false;
  }

  const phase = await getPhaseByIndex(ctx, event._id, phaseIndex);
  const mult = phaseMultiplier(phase?.kind);
  const placements = computePlacements(game, all);

  let champion: { teamId: Id<"teams">; points: number } | null = null;
  for (const { teamId, place } of placements) {
    const pts = Math.round(placementToPoints(event, game, place) * mult);
    if (pts <= 0) continue; // never write 0/negative placement rows
    await awardPoints(ctx, {
      eventId: event._id,
      teamId,
      gameId: game._id,
      phaseIndex,
      points: pts,
      reason: "placement",
      place,
      note: `${game.name}${phase ? ` — ${phase.name}` : ""}`,
      createdByUserId: byUserId,
    });
    if (place === 1) champion = { teamId, points: pts };
  }

  if (champion) {
    const team = await ctx.db.get(champion.teamId);
    await recordActivity(ctx, event._id, {
      kind: "result",
      message: `🏆 ${team?.emoji ?? ""} ${team?.name ?? "A team"} won ${game.emoji} ${game.name}${phase ? ` (${phase.name})` : ""}! +${champion.points} pts`,
      emoji: "🏆",
      teamId: champion.teamId,
    });
  }
  return true;
}
