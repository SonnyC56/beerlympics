import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertHost, getActiveEvent, recordActivity } from "./lib";
import {
  advanceFromMatch,
  gameEligible,
  getPhaseByIndex,
  runDispatch,
} from "./engine";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ── Bracket math ──────────────────────────────────────────────────────────────
function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Standard single-elimination seed order for a bracket of `size` slots. */
function seedSlots(size: number): number[] {
  let pls = [1, 2];
  const rounds = Math.log2(size);
  for (let r = 1; r < rounds; r++) {
    const sum = pls.length * 2 + 1;
    const out: number[] = [];
    for (const p of pls) {
      out.push(p);
      out.push(sum - p);
    }
    pls = out;
  }
  return pls;
}

function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Quarterfinal";
  return `Round ${round}`;
}

// ── Instance teardown ─────────────────────────────────────────────────────────
async function clearInstance(
  ctx: MutationCtx,
  event: Doc<"events">,
  gameId: Id<"games">,
  phaseIndex: number,
) {
  const matches = (
    await ctx.db
      .query("matches")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect()
  ).filter((m) => m.phaseIndex === phaseIndex);
  const matchIds = new Set(matches.map((m) => m._id as string));

  // Free any station holding one of these matches.
  const stations = await ctx.db
    .query("stations")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  for (const s of stations) {
    if (s.currentMatchId && matchIds.has(s.currentMatchId as string)) {
      await ctx.db.patch(s._id, {
        status: s.status === "busy" ? "open" : s.status,
        currentMatchId: undefined,
      });
    }
  }
  for (const m of matches) await ctx.db.delete(m._id);

  // Drop placement points for this instance so a regenerate is clean.
  const entries = await ctx.db
    .query("scoreEntries")
    .withIndex("by_event_and_game", (q) =>
      q.eq("eventId", event._id).eq("gameId", gameId),
    )
    .collect();
  for (const e of entries) {
    if (e.phaseIndex === phaseIndex) await ctx.db.delete(e._id);
  }
}

// ── Builders ──────────────────────────────────────────────────────────────────
async function buildSingleElim(
  ctx: MutationCtx,
  event: Doc<"events">,
  game: Doc<"games">,
  phaseIndex: number,
  orderedTeamIds: Id<"teams">[],
) {
  const n = orderedTeamIds.length;
  const size = nextPow2(n);
  const totalRounds = Math.log2(size);
  const slots = seedSlots(size); // seed number per slot position

  // matchIds[r][i] — created round by round.
  const matchIds: Id<"matches">[][] = [];
  for (let r = 1; r <= totalRounds; r++) {
    const count = size / Math.pow(2, r);
    const ids: Id<"matches">[] = [];
    for (let i = 0; i < count; i++) {
      let teamIds: Id<"teams">[] = [];
      let sourceRefs:
        | { fromMatchId?: Id<"matches">; take: "winner" | "loser" }[]
        | undefined;
      if (r === 1) {
        const seedA = slots[2 * i];
        const seedB = slots[2 * i + 1];
        const teamA = seedA <= n ? orderedTeamIds[seedA - 1] : undefined;
        const teamB = seedB <= n ? orderedTeamIds[seedB - 1] : undefined;
        teamIds = [teamA, teamB].filter(Boolean) as Id<"teams">[];
      } else {
        sourceRefs = [
          { take: "winner" },
          { take: "winner" },
        ];
      }
      const id = await ctx.db.insert("matches", {
        eventId: event._id,
        gameId: game._id,
        phaseIndex,
        round: r,
        bracket: "main",
        slot: i,
        label: roundLabel(r, totalRounds),
        teamIds,
        sourceRefs,
        status: r === 1 && teamIds.length === 2 ? "ready" : "pending",
      });
      ids.push(id);
    }
    matchIds.push(ids);
  }

  // Wire advancement.
  for (let r = 1; r < totalRounds; r++) {
    for (let i = 0; i < matchIds[r - 1].length; i++) {
      const nextId = matchIds[r][Math.floor(i / 2)];
      await ctx.db.patch(matchIds[r - 1][i], {
        nextMatchId: nextId,
        nextSlot: i % 2,
      });
    }
  }

  // Resolve byes: a round-1 match with a single team auto-advances.
  for (const id of matchIds[0]) {
    const m = await ctx.db.get(id);
    if (m && m.status !== "completed" && m.teamIds.length === 1) {
      await ctx.db.patch(id, {
        status: "completed",
        winnerTeamId: m.teamIds[0],
        completedAt: Date.now(),
        rankings: [{ teamId: m.teamIds[0], place: 1 }],
      });
      const done = await ctx.db.get(id);
      if (done) await advanceFromMatch(ctx, done);
    }
  }
}

async function buildRoundRobin(
  ctx: MutationCtx,
  event: Doc<"events">,
  game: Doc<"games">,
  phaseIndex: number,
  teamIds: Id<"teams">[],
) {
  // Circle method.
  const teams: (Id<"teams"> | null)[] = [...teamIds];
  if (teams.length % 2 === 1) teams.push(null); // bye
  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;
  let arr = [...teams];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a && b) {
        await ctx.db.insert("matches", {
          eventId: event._id,
          gameId: game._id,
          phaseIndex,
          round: r + 1,
          bracket: "round_robin",
          slot: i,
          label: `Round ${r + 1}`,
          teamIds: [a, b],
          status: "ready",
        });
      }
    }
    // rotate, keeping first fixed
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
}

async function buildHeats(
  ctx: MutationCtx,
  event: Doc<"events">,
  game: Doc<"games">,
  phaseIndex: number,
  teamIds: Id<"teams">[],
) {
  const size = Math.max(2, game.teamsPerMatch);
  let heat = 0;
  for (let i = 0; i < teamIds.length; i += size) {
    const group = teamIds.slice(i, i + size);
    if (group.length < 2) {
      // Fold a lone leftover into the previous heat if possible.
      const prev = await ctx.db
        .query("matches")
        .withIndex("by_game", (q) => q.eq("gameId", game._id))
        .collect();
      const last = prev
        .filter((m) => m.phaseIndex === phaseIndex)
        .sort((a, b) => b.slot - a.slot)[0];
      if (last) {
        await ctx.db.patch(last._id, { teamIds: [...last.teamIds, ...group] });
        continue;
      }
    }
    await ctx.db.insert("matches", {
      eventId: event._id,
      gameId: game._id,
      phaseIndex,
      round: 1,
      bracket: "heats",
      slot: heat,
      label: `Heat ${heat + 1}`,
      teamIds: group,
      status: "ready",
    });
    heat++;
  }
}

// ── Seeding helpers ───────────────────────────────────────────────────────────
async function orderTeams(
  ctx: MutationCtx,
  event: Doc<"events">,
  seeding: "seed" | "random" | "standings",
  explicit?: Id<"teams">[],
): Promise<Id<"teams">[]> {
  let teams = await ctx.db
    .query("teams")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  if (explicit) {
    const set = new Set(explicit.map((t) => t as string));
    teams = teams.filter((t) => set.has(t._id as string));
  }
  if (seeding === "standings") {
    const entries = await ctx.db
      .query("scoreEntries")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const total = new Map<string, number>();
    for (const e of entries)
      total.set(e.teamId, (total.get(e.teamId) ?? 0) + e.points);
    teams.sort((a, b) => (total.get(b._id) ?? 0) - (total.get(a._id) ?? 0));
  } else if (seeding === "seed") {
    teams.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  } else {
    // random but deterministic-ish per call
    teams = teams
      .map((t) => ({ t, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.t);
  }
  return teams.map((t) => t._id);
}

/** Build a game's bracket for a phase using its format. Clears any prior instance first. */
async function buildInstance(
  ctx: MutationCtx,
  event: Doc<"events">,
  game: Doc<"games">,
  phaseIndex: number,
  ordered: Id<"teams">[],
) {
  await clearInstance(ctx, event, game._id, phaseIndex);
  if (game.format === "single_elim") {
    await buildSingleElim(ctx, event, game, phaseIndex, ordered);
  } else if (game.format === "heats") {
    await buildHeats(ctx, event, game, phaseIndex, ordered);
  } else {
    await buildRoundRobin(ctx, event, game, phaseIndex, ordered);
  }
  await ctx.db.patch(game._id, { status: "active" });
}

/** True if a game already has matches built for the given phase. */
async function hasInstance(
  ctx: MutationCtx,
  gameId: Id<"games">,
  phaseIndex: number,
): Promise<boolean> {
  const matches = await ctx.db
    .query("matches")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .collect();
  return matches.some((m) => m.phaseIndex === phaseIndex);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Host: generate (or regenerate) a game's tournament for a phase. */
export const generate = mutation({
  args: {
    deviceId: v.string(),
    gameId: v.id("games"),
    phaseIndex: v.optional(v.number()),
    seeding: v.optional(
      v.union(v.literal("seed"), v.literal("random"), v.literal("standings")),
    ),
    teamIds: v.optional(v.array(v.id("teams"))),
  },
  handler: async (ctx, args) => {
    await assertHost(ctx, args.deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found.");
    if (game.format === "wheel" || game.format === "special") {
      throw new Error("This game isn't a bracket — manage it on its game page.");
    }

    const phaseIndex = args.phaseIndex ?? Math.max(0, event.currentPhaseIndex);
    const ordered = await orderTeams(
      ctx,
      event,
      args.seeding ?? "seed",
      args.teamIds,
    );
    if (ordered.length < 2) {
      throw new Error("Need at least 2 teams to build a tournament.");
    }

    await buildInstance(ctx, event, game, phaseIndex, ordered);
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: `${game.name} bracket is set — ${ordered.length} teams in!`,
    });

    // Seat matches immediately if stations are open.
    const started = await runDispatch(ctx, event);
    return { teams: ordered.length, started };
  },
});

/** Host: seed a gated game (Beer Die) from the current top-N grand total. */
export const seedFromStandings = mutation({
  args: {
    deviceId: v.string(),
    gameId: v.id("games"),
    topN: v.optional(v.number()),
    phaseIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertHost(ctx, args.deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found.");

    const ordered = await orderTeams(ctx, event, "standings");
    const top = ordered.slice(0, args.topN ?? 4);
    if (top.length < 2) throw new Error("Not enough teams to seed.");

    const phaseIndex = args.phaseIndex ?? Math.max(0, event.currentPhaseIndex);
    await clearInstance(ctx, event, game._id, phaseIndex);
    await buildSingleElim(ctx, event, game, phaseIndex, top);
    await ctx.db.patch(game._id, { status: "active" });
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: `${game.name} FINALE seeded from the leaderboard — top ${top.length} only!`,
    });
    const started = await runDispatch(ctx, event);
    return { teams: top.length, started };
  },
});

/** Host: the dispatcher — seat ready matches at every open station. */
export const dispatch = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const started = await runDispatch(ctx, event);
    return { started };
  },
});

/** Host: advance the event to a phase, opening/closing stations by eligibility. */
export const startPhase = mutation({
  args: { deviceId: v.string(), index: v.number() },
  handler: async (ctx, { deviceId, index }) => {
    await assertHost(ctx, deviceId);
    let event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");

    await ctx.db.patch(event._id, {
      currentPhaseIndex: index,
      status: "live",
    });
    event = (await ctx.db.get(event._id))!;

    // Phase bookkeeping.
    const phases = await ctx.db
      .query("phases")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const p of phases) {
      const status =
        p.index < index ? "complete" : p.index === index ? "active" : "locked";
      await ctx.db.patch(p._id, {
        status,
        ...(p.index === index && !p.startedAt ? { startedAt: Date.now() } : {}),
      });
    }
    const phase = await getPhaseByIndex(ctx, event._id, index);

    // Open eligible stations; close newly-ineligible idle ones.
    const stations = await ctx.db
      .query("stations")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const s of stations) {
      const game = await ctx.db.get(s.gameId);
      if (!game) continue;
      const eligible = gameEligible(game, event);
      if (eligible && s.status === "closed") {
        await ctx.db.patch(s._id, { status: "open" });
      } else if (!eligible && s.status === "open") {
        await ctx.db.patch(s._id, { status: "closed" });
      }
    }

    // Auto-build brackets for this phase: every enabled, bracketed, non-gated
    // game that doesn't already have an instance for this phase gets generated.
    // Seeding follows the round — by overall seed in the qualifier, by live
    // standings in the knockouts/finals. Gated games (Beer Die) are skipped;
    // they're seeded explicitly via seedFromStandings. Hosts can still
    // Regenerate any game by hand afterward.
    const seeding: "seed" | "standings" =
      phase?.kind === "qualifier" ? "seed" : "standings";
    const games = await ctx.db
      .query("games")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    let autoBuilt = 0;
    for (const g of games) {
      if (g.enabled === false) continue;
      if (g.format === "wheel" || g.format === "special") continue;
      if (g.isGated) continue; // gated finales seed from standings on demand
      if (await hasInstance(ctx, g._id, index)) continue; // don't clobber existing
      const ordered = await orderTeams(ctx, event, seeding);
      if (ordered.length < 2) continue; // not enough teams to bracket
      await buildInstance(ctx, event, g, index, ordered);
      autoBuilt++;
    }

    await recordActivity(ctx, event._id, {
      kind: "phase",
      message:
        `${phase?.name ?? `Phase ${index + 1}`} is underway!` +
        (autoBuilt > 0 ? ` ${autoBuilt} bracket${autoBuilt === 1 ? "" : "s"} built.` : ""),
    });
    const started = await runDispatch(ctx, event);
    return { started, autoBuilt };
  },
});

/** Host: wipe a game's tournament entirely (all phases) and reset it. */
export const resetGame = mutation({
  args: { deviceId: v.string(), gameId: v.id("games") },
  handler: async (ctx, { deviceId, gameId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();
    const ids = new Set(matches.map((m) => m._id as string));
    const stations = await ctx.db
      .query("stations")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();
    for (const s of stations) {
      if (s.currentMatchId && ids.has(s.currentMatchId as string)) {
        await ctx.db.patch(s._id, { status: "open", currentMatchId: undefined });
      }
    }
    for (const m of matches) await ctx.db.delete(m._id);
    const entries = await ctx.db
      .query("scoreEntries")
      .withIndex("by_event_and_game", (q) =>
        q.eq("eventId", event._id).eq("gameId", gameId),
      )
      .collect();
    for (const e of entries) await ctx.db.delete(e._id);
    await ctx.db.patch(gameId, { status: "scheduled" });
    return true;
  },
});

/**
 * Re-seed every bracketed game in the current phase that hasn't started yet with
 * an INDEPENDENT random draw, so teams stop facing the same opponent across games
 * (the default seed order pairs everyone the same way in every game). Games with
 * any in-progress/queued/completed match are left untouched, as are gated finales
 * and wheel/special games. Safe to re-run.
 */
async function reshuffleUnstartedFor(ctx: MutationCtx, event: Doc<"events">) {
  const phaseIndex = Math.max(0, event.currentPhaseIndex);
  const games = await ctx.db
    .query("games")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();

  const reshuffled: string[] = [];
  const skipped: string[] = [];
  for (const g of games) {
    if (g.enabled === false) continue;
    if (g.format === "wheel" || g.format === "special") continue;
    if (g.isGated) continue; // leave the gated finale alone
    const matches = (
      await ctx.db
        .query("matches")
        .withIndex("by_game", (q) => q.eq("gameId", g._id))
        .collect()
    ).filter((m) => m.phaseIndex === phaseIndex);
    if (matches.length === 0) continue; // nothing built for this phase
    const started = matches.some((m) =>
      ["in_progress", "queued", "completed"].includes(m.status),
    );
    if (started) {
      skipped.push(g.name);
      continue;
    }
    const ordered = await orderTeams(ctx, event, "random");
    if (ordered.length < 2) continue;
    await buildInstance(ctx, event, g, phaseIndex, ordered); // clears + rebuilds
    reshuffled.push(g.name);
  }

  if (reshuffled.length > 0) {
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "Fresh draws! Upcoming brackets have been re-shuffled for new matchups.",
    });
  }
  const seated = await runDispatch(ctx, event);
  return { reshuffled, skipped, seated };
}

/** Host: shuffle the not-yet-started brackets in the current phase (button). */
export const reshuffleUpcoming = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    return reshuffleUnstartedFor(ctx, event);
  },
});

/** Admin-only (CLI/dashboard) version of the same shuffle. */
export const reshuffleUnstarted = internalMutation({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    return reshuffleUnstartedFor(ctx, event);
  },
});

/**
 * Admin-only (CLI/dashboard): FORCE-reshuffle every bracketed, non-gated game in
 * the current phase EXCEPT the named ones — even games already underway. This
 * wipes those games' existing matches AND their points for this phase and draws
 * fresh random brackets. Destructive; use deliberately.
 */
export const reshuffleGamesExcept = internalMutation({
  args: { exclude: v.array(v.string()) },
  handler: async (ctx, { exclude }) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const ex = new Set(exclude.map((n) => n.trim().toLowerCase()));
    const phaseIndex = Math.max(0, event.currentPhaseIndex);
    const games = await ctx.db
      .query("games")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();

    const reshuffled: string[] = [];
    const kept: string[] = [];
    for (const g of games) {
      if (g.enabled === false) continue;
      if (g.format === "wheel" || g.format === "special") continue;
      if (g.isGated) {
        kept.push(`${g.name} (gated)`);
        continue;
      }
      if (ex.has(g.name.trim().toLowerCase())) {
        kept.push(g.name);
        continue;
      }
      const ordered = await orderTeams(ctx, event, "random");
      if (ordered.length < 2) continue;
      await buildInstance(ctx, event, g, phaseIndex, ordered); // wipes + rebuilds
      reshuffled.push(g.name);
    }

    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "Brackets re-drawn — fresh matchups all around!",
    });
    const seated = await runDispatch(ctx, event);
    return { reshuffled, kept, seated };
  },
});
