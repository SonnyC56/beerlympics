import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertHost, getActiveEvent, recordActivity } from "./lib";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * ADMIN / DANGER ZONE
 * -------------------
 * Host-only resets for game day. Each mutation is narrowly scoped and the UI
 * confirms before firing. Nothing here ever touches user accounts or the event
 * / game / station / phase *definitions* — only the things that accumulate
 * during play (matches, scores, media, the wheel log, the activity feed,
 * teams). `factoryReset` rewinds the whole day back to a fresh RSVP state.
 */

// ── Read: what's in the database right now (host-gated) ──────────────────────
export const counts = query({
  args: { deviceId: v.optional(v.string()) },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) return null;
    const eid = event._id;

    const [teams, players, matches, scores, media, spins, activity] = await Promise.all([
      ctx.db.query("teams").withIndex("by_event", (q) => q.eq("eventId", eid)).collect(),
      ctx.db.query("players").withIndex("by_event", (q) => q.eq("eventId", eid)).collect(),
      ctx.db.query("matches").withIndex("by_event", (q) => q.eq("eventId", eid)).collect(),
      ctx.db.query("scoreEntries").withIndex("by_event", (q) => q.eq("eventId", eid)).collect(),
      ctx.db.query("media").withIndex("by_event", (q) => q.eq("eventId", eid)).collect(),
      ctx.db.query("wheelSpins").withIndex("by_event", (q) => q.eq("eventId", eid)).collect(),
      ctx.db.query("activity").withIndex("by_event", (q) => q.eq("eventId", eid)).collect(),
    ]);

    return {
      teams: teams.length,
      players: players.length,
      matches: matches.length,
      scoreEntries: scores.length,
      media: media.length,
      wheelSpins: spins.length,
      activity: activity.length,
      eventStatus: event.status,
      currentPhaseIndex: event.currentPhaseIndex,
    };
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
async function deleteScores(ctx: MutationCtx, event: Doc<"events">) {
  const rows = await ctx.db
    .query("scoreEntries")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  for (const r of rows) await ctx.db.delete(r._id);
  return rows.length;
}

async function deleteWheelSpins(ctx: MutationCtx, event: Doc<"events">) {
  const rows = await ctx.db
    .query("wheelSpins")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  for (const r of rows) await ctx.db.delete(r._id);
  return rows.length;
}

/** Reset every match + tournament wiring back to pre-game (keeps teams). */
async function rewindTournament(ctx: MutationCtx, event: Doc<"events">) {
  const matches = await ctx.db
    .query("matches")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  for (const m of matches) await ctx.db.delete(m._id);

  // Stations → open/closed per gating, no current match.
  const stations = await ctx.db
    .query("stations")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  for (const s of stations) {
    const game = await ctx.db.get(s.gameId);
    await ctx.db.patch(s._id, {
      status: game?.isGated ? "closed" : "open",
      currentMatchId: undefined,
    });
  }

  // Games → scheduled.
  const games = await ctx.db
    .query("games")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  for (const g of games) {
    if (g.status !== "scheduled") await ctx.db.patch(g._id, { status: "scheduled" });
  }

  // Phases → locked, event back to pre-game phase.
  const phases = await ctx.db
    .query("phases")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .collect();
  for (const p of phases) {
    await ctx.db.patch(p._id, { status: "locked", startedAt: undefined, endedAt: undefined });
  }
  await ctx.db.patch(event._id, { currentPhaseIndex: -1 });

  return matches.length;
}

// ── Clear the scoreboard (every team back to zero) ───────────────────────────
export const clearScores = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const cleared = await deleteScores(ctx, event);
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "The scoreboard was reset — everyone back to zero.",
    });
    return { cleared };
  },
});

// ── Reset all tournaments (matches + scores, back to pre-game) ───────────────
export const resetTournaments = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const scoreEntries = await deleteScores(ctx, event);
    const matches = await rewindTournament(ctx, event);
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "All brackets were reset — fresh start.",
    });
    return { matches, scoreEntries };
  },
});

// ── Clear the wheel's spin log ───────────────────────────────────────────────
export const clearWheelSpins = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const cleared = await deleteWheelSpins(ctx, event);
    return { cleared };
  },
});

// ── Clear the activity feed ──────────────────────────────────────────────────
export const clearActivity = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const rows = await ctx.db
      .query("activity")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
    return { cleared: rows.length };
  },
});

// ── Clear all photos + videos (also deletes the stored blobs) ────────────────
export const clearMedia = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const media = await ctx.db
      .query("media")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const m of media) {
      try {
        await ctx.storage.delete(m.storageId);
      } catch {
        // blob already gone — drop the row anyway
      }
      await ctx.db.delete(m._id);
    }
    return { cleared: media.length };
  },
});

// ── Remove all teams (unassigns players, keeps their RSVPs + accounts) ───────
export const clearTeams = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");

    // Teams are referenced everywhere — wipe the competition + wheel first.
    await deleteScores(ctx, event);
    await deleteWheelSpins(ctx, event);
    await rewindTournament(ctx, event);

    // Unassign players (keep their RSVP), then delete the teams.
    const players = await ctx.db
      .query("players")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const p of players) {
      if (p.teamId) await ctx.db.patch(p._id, { teamId: undefined, role: undefined });
    }
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const t of teams) await ctx.db.delete(t._id);

    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "Teams were cleared — time to draft again.",
    });
    return { teams: teams.length };
  },
});

// ── Factory reset: rewind the entire day back to a fresh RSVP state ──────────
export const factoryReset = mutation({
  args: { deviceId: v.string(), confirm: v.string() },
  handler: async (ctx, { deviceId, confirm }) => {
    await assertHost(ctx, deviceId);
    if (confirm.trim().toUpperCase() !== "RESET") {
      throw new Error('Type "RESET" to confirm a full reset.');
    }
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");

    await deleteScores(ctx, event);
    await deleteWheelSpins(ctx, event);

    // Media blobs.
    const media = await ctx.db
      .query("media")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const m of media) {
      try {
        await ctx.storage.delete(m.storageId);
      } catch {
        /* blob already gone */
      }
      await ctx.db.delete(m._id);
    }

    // Teams (unassign players first).
    const players = await ctx.db
      .query("players")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const p of players) {
      if (p.teamId) await ctx.db.patch(p._id, { teamId: undefined, role: undefined });
    }
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const t of teams) await ctx.db.delete(t._id);

    // Activity feed.
    const activity = await ctx.db
      .query("activity")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const a of activity) await ctx.db.delete(a._id);

    // Rewind tournament wiring + reopen invites.
    await rewindTournament(ctx, event);
    await ctx.db.patch(event._id, { status: "rsvp" });

    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "The event was reset and is open for RSVPs again.",
    });
    return { ok: true };
  },
});
