import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  assertHost,
  getActiveEvent,
  getUserByDevice,
  recordActivity,
  requireUser,
} from "./lib";

/**
 * PLAYER OF THE DAY — a crowd MVP poll. One ballot per voter (re-voting just
 * moves your ballot). Counts stay hidden from guests until the host reveals, so
 * the TV reveal is a real moment instead of a foregone conclusion.
 */
export const state = query({
  args: { deviceId: v.optional(v.string()) },
  handler: async (ctx, { deviceId }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return null;
    const poll = event.poll ?? { open: false, revealed: false };
    const me = await getUserByDevice(ctx, deviceId);
    const isHost = !!me?.isHost;
    const showCounts = poll.revealed || isHost;

    const players = await ctx.db
      .query("players")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const going = players.filter((p) => p.status === "yes");

    const ballots = await ctx.db
      .query("pollVotes")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const tally = new Map<string, number>();
    for (const b of ballots) {
      tally.set(b.nomineeUserId, (tally.get(b.nomineeUserId) ?? 0) + 1);
    }
    const myVote = me
      ? ballots.find((b) => b.voterUserId === me._id)?.nomineeUserId ?? null
      : null;

    const candidates = await Promise.all(
      going.map(async (p) => {
        const team = p.teamId ? await ctx.db.get(p.teamId) : null;
        return {
          userId: p.userId,
          name: p.name,
          emoji: p.emoji,
          teamName: team?.name ?? null,
          teamColor: team?.color ?? null,
          votes: showCounts ? tally.get(p.userId) ?? 0 : 0,
        };
      }),
    );
    candidates.sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));

    const winner =
      poll.revealed && candidates.length > 0 && candidates[0].votes > 0
        ? candidates[0]
        : null;

    return {
      open: poll.open,
      revealed: poll.revealed,
      showCounts,
      myVote,
      totalVotes: ballots.length,
      candidates,
      winner,
    };
  },
});

/** Cast (or move) your single Player of the Day vote. */
export const vote = mutation({
  args: { deviceId: v.string(), nomineeUserId: v.id("users") },
  handler: async (ctx, { deviceId, nomineeUserId }) => {
    const user = await requireUser(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    if (!event.poll?.open) throw new Error("Voting isn't open right now.");
    const existing = await ctx.db
      .query("pollVotes")
      .withIndex("by_event_and_voter", (q) =>
        q.eq("eventId", event._id).eq("voterUserId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { nomineeUserId, createdAt: Date.now() });
    } else {
      await ctx.db.insert("pollVotes", {
        eventId: event._id,
        voterUserId: user._id,
        nomineeUserId,
        createdAt: Date.now(),
      });
    }
    return true;
  },
});

/** Host: open or close voting. */
export const setOpen = mutation({
  args: { deviceId: v.string(), open: v.boolean() },
  handler: async (ctx, { deviceId, open }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const poll = event.poll ?? { open: false, revealed: false };
    await ctx.db.patch(event._id, { poll: { ...poll, open } });
    if (open) {
      await recordActivity(ctx, event._id, {
        kind: "announcement",
        message: "Player of the Day voting is OPEN — cast your vote!",
      });
    }
    return true;
  },
});

/** Host: lock voting and reveal the result on the TV. */
export const reveal = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    await ctx.db.patch(event._id, { poll: { open: false, revealed: true } });
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "Player of the Day, revealed!",
    });
    return true;
  },
});

/** Host: clear all ballots and reset the poll. */
export const reset = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const ballots = await ctx.db
      .query("pollVotes")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    for (const b of ballots) await ctx.db.delete(b._id);
    await ctx.db.patch(event._id, { poll: { open: false, revealed: false } });
    return true;
  },
});
