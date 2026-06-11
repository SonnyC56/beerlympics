import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  assertHost,
  awardPoints,
  getActiveEvent,
  getUserByDevice,
  recordActivity,
  requireUser,
} from "./lib";

/**
 * QUIPLASH-STYLE QUIP BATTLES.
 * One round at a time, host-driven through three phases:
 *   answer → everyone writes an answer to the prompt on their phone (anonymous)
 *   vote   → everyone votes for their favourite (you can't vote your own)
 *   reveal → answers are ranked with authors on the TV; the winner's team banks
 *            a small bonus.
 */
const QUIP_WIN_POINTS = 15;

async function latestRound(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">,
): Promise<Doc<"quipRounds"> | null> {
  return await ctx.db
    .query("quipRounds")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .order("desc")
    .first();
}

/** Public: the active round + my participation, shaped to the current phase. */
export const current = query({
  args: { deviceId: v.optional(v.string()) },
  handler: async (ctx, { deviceId }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return { phase: "idle" as const };
    const round = await latestRound(ctx, event._id);
    if (!round || round.phase === "closed") return { phase: "idle" as const };

    const me = await getUserByDevice(ctx, deviceId);
    const [answers, votes] = await Promise.all([
      ctx.db
        .query("quipAnswers")
        .withIndex("by_round", (q) => q.eq("roundId", round._id))
        .collect(),
      ctx.db
        .query("quipVotes")
        .withIndex("by_round", (q) => q.eq("roundId", round._id))
        .collect(),
    ]);
    const tally = new Map<string, number>();
    for (const vote of votes) {
      tally.set(vote.answerId, (tally.get(vote.answerId) ?? 0) + 1);
    }
    const myAnswer = me
      ? answers.find((a) => a.authorUserId === me._id) ?? null
      : null;
    const myVote = me
      ? votes.find((vote) => vote.voterUserId === me._id)?.answerId ?? null
      : null;

    const base = {
      phase: round.phase,
      roundId: round._id,
      prompt: round.prompt,
      totalAnswers: answers.length,
      totalVotes: votes.length,
      myAnswerText: myAnswer?.text ?? null,
      myVote,
      isHost: !!me?.isHost,
    };

    if (round.phase === "answer") {
      return base;
    }
    if (round.phase === "vote") {
      return {
        ...base,
        answers: answers.map((a) => ({
          _id: a._id,
          text: a.text,
          mine: me ? a.authorUserId === me._id : false,
        })),
      };
    }
    // reveal
    return {
      ...base,
      results: answers
        .map((a) => ({
          _id: a._id,
          text: a.text,
          author: a.authorName,
          votes: tally.get(a._id) ?? 0,
        }))
        .sort((x, y) => y.votes - x.votes || x.author.localeCompare(y.author)),
    };
  },
});

/** Host: start a fresh round on a prompt (closes any open round first). */
export const start = mutation({
  args: { deviceId: v.string(), prompt: v.string() },
  handler: async (ctx, { deviceId, prompt }) => {
    const host = await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const clean = prompt.trim();
    if (!clean) throw new Error("Give the round a prompt.");
    const open = await latestRound(ctx, event._id);
    if (open && open.phase !== "closed") {
      await ctx.db.patch(open._id, { phase: "closed" });
    }
    const id = await ctx.db.insert("quipRounds", {
      eventId: event._id,
      prompt: clean,
      phase: "answer",
      createdByUserId: host._id,
      createdAt: Date.now(),
    });
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: `Quip battle! "${clean}" — answer on your phone.`,
    });
    return id;
  },
});

/** Host: advance the active round (answer → vote → reveal). */
export const setPhase = mutation({
  args: {
    deviceId: v.string(),
    phase: v.union(
      v.literal("answer"),
      v.literal("vote"),
      v.literal("reveal"),
    ),
  },
  handler: async (ctx, { deviceId, phase }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const round = await latestRound(ctx, event._id);
    if (!round || round.phase === "closed") {
      throw new Error("No active quip round.");
    }
    await ctx.db.patch(round._id, { phase });

    // On the first reveal, award the winning quip's team a small bonus.
    if (phase === "reveal" && !round.awardedAt) {
      const [answers, votes] = await Promise.all([
        ctx.db
          .query("quipAnswers")
          .withIndex("by_round", (q) => q.eq("roundId", round._id))
          .collect(),
        ctx.db
          .query("quipVotes")
          .withIndex("by_round", (q) => q.eq("roundId", round._id))
          .collect(),
      ]);
      const tally = new Map<string, number>();
      for (const vote of votes) {
        tally.set(vote.answerId, (tally.get(vote.answerId) ?? 0) + 1);
      }
      let best: { answer: Doc<"quipAnswers">; votes: number } | null = null;
      for (const a of answers) {
        const n = tally.get(a._id) ?? 0;
        if (n > 0 && (!best || n > best.votes)) best = { answer: a, votes: n };
      }
      await ctx.db.patch(round._id, { awardedAt: Date.now() });
      if (best) {
        const player = await ctx.db
          .query("players")
          .withIndex("by_event_and_user", (q) =>
            q.eq("eventId", event._id).eq("userId", best!.answer.authorUserId),
          )
          .unique();
        if (player?.teamId) {
          await awardPoints(ctx, {
            eventId: event._id,
            teamId: player.teamId,
            points: QUIP_WIN_POINTS,
            reason: "bonus",
            note: `Won a quip battle: "${round.prompt}"`,
            createdByUserId: undefined,
          });
        }
        const team = player?.teamId ? await ctx.db.get(player.teamId) : null;
        await recordActivity(ctx, event._id, {
          kind: "bonus",
          message: `${best.answer.authorName} won the quip battle${
            team ? ` (+${QUIP_WIN_POINTS} for ${team.name})` : ""
          }!`,
          teamId: player?.teamId,
        });
      }
    }
    return true;
  },
});

/** Host: close the active round (clears the TV). */
export const close = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const round = await latestRound(ctx, event._id);
    if (round && round.phase !== "closed") {
      await ctx.db.patch(round._id, { phase: "closed" });
    }
    return true;
  },
});

/** Player: submit (or replace) your answer during the answer phase. */
export const submitAnswer = mutation({
  args: { deviceId: v.string(), text: v.string() },
  handler: async (ctx, { deviceId, text }) => {
    const user = await requireUser(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const round = await latestRound(ctx, event._id);
    if (!round || round.phase !== "answer") {
      throw new Error("Answers are closed for this round.");
    }
    const clean = text.trim().slice(0, 140);
    if (!clean) throw new Error("Type an answer first.");
    const existing = await ctx.db
      .query("quipAnswers")
      .withIndex("by_round_and_author", (q) =>
        q.eq("roundId", round._id).eq("authorUserId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { text: clean });
    } else {
      await ctx.db.insert("quipAnswers", {
        eventId: event._id,
        roundId: round._id,
        authorUserId: user._id,
        authorName: user.name ?? "Someone",
        text: clean,
        createdAt: Date.now(),
      });
    }
    return true;
  },
});

/** Player: vote for an answer during the vote phase (not your own). */
export const vote = mutation({
  args: { deviceId: v.string(), answerId: v.id("quipAnswers") },
  handler: async (ctx, { deviceId, answerId }) => {
    const user = await requireUser(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const round = await latestRound(ctx, event._id);
    if (!round || round.phase !== "vote") {
      throw new Error("Voting isn't open for this round.");
    }
    const answer = await ctx.db.get(answerId);
    if (!answer || answer.roundId !== round._id) {
      throw new Error("That answer isn't in this round.");
    }
    if (answer.authorUserId === user._id) {
      throw new Error("You can't vote for your own answer!");
    }
    const existing = await ctx.db
      .query("quipVotes")
      .withIndex("by_round_and_voter", (q) =>
        q.eq("roundId", round._id).eq("voterUserId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { answerId });
    } else {
      await ctx.db.insert("quipVotes", {
        eventId: event._id,
        roundId: round._id,
        voterUserId: user._id,
        answerId,
        createdAt: Date.now(),
      });
    }
    return true;
  },
});
