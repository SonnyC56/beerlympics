import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  assertHost,
  awardPoints,
  getActiveEvent,
  recordActivity,
  requireUser,
} from "./lib";

/**
 * SIDE QUESTS / BOUNTIES — host-posted bonus-point challenges that run alongside
 * the bracket ("first keg stand", "win a game shirtless"…). Teams can raise a
 * "we did it!" claim; the host awards the points to a team, which closes it.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const rows = await ctx.db
      .query("bounties")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .order("desc")
      .collect();
    return await Promise.all(
      rows.map(async (b) => {
        const awarded = b.awardedTeamId ? await ctx.db.get(b.awardedTeamId) : null;
        const claimTeams = (
          await Promise.all(
            (b.claims ?? []).map(async (tid) => {
              const t = await ctx.db.get(tid);
              return t
                ? { _id: t._id, name: t.name, emoji: t.emoji, color: t.color }
                : null;
            }),
          )
        ).filter(Boolean);
        return {
          ...b,
          awardedTeam: awarded
            ? {
                _id: awarded._id,
                name: awarded.name,
                emoji: awarded.emoji,
                color: awarded.color,
              }
            : null,
          claimTeams,
        };
      }),
    );
  },
});

/** Host: post a new bounty. */
export const create = mutation({
  args: {
    deviceId: v.string(),
    title: v.string(),
    points: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { deviceId, title, points, description }) => {
    const host = await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const clean = title.trim();
    if (!clean) throw new Error("Give the bounty a title.");
    const id = await ctx.db.insert("bounties", {
      eventId: event._id,
      title: clean,
      description: description?.trim() || undefined,
      points: Math.round(points) || 0,
      status: "open",
      createdByUserId: host._id,
      createdAt: Date.now(),
    });
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: `New side quest: ${clean} (+${Math.round(points) || 0} pts)`,
    });
    return id;
  },
});

/** Player: toggle a "we did it!" claim for your team. */
export const claim = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (ctx, { deviceId, bountyId }) => {
    const user = await requireUser(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const player = await ctx.db
      .query("players")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user._id),
      )
      .unique();
    if (!player?.teamId) throw new Error("Join a team to claim a bounty.");
    const bounty = await ctx.db.get(bountyId);
    if (!bounty) throw new Error("Bounty not found.");
    if (bounty.status === "done") throw new Error("That bounty is already settled.");
    const teamId = player.teamId;
    const claims = bounty.claims ?? [];
    const has = claims.some((t) => t === teamId);
    const next = has
      ? claims.filter((t) => t !== teamId)
      : [...claims, teamId];
    await ctx.db.patch(bountyId, { claims: next });
    if (!has) {
      const team = await ctx.db.get(teamId);
      await recordActivity(ctx, event._id, {
        kind: "announcement",
        message: `${team?.name ?? "A team"} claims "${bounty.title}"`,
        teamId,
      });
    }
    return !has;
  },
});

/** Host: award a bounty to a team — banks the points and closes it. */
export const award = mutation({
  args: {
    deviceId: v.string(),
    bountyId: v.id("bounties"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, { deviceId, bountyId, teamId }) => {
    const host = await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const bounty = await ctx.db.get(bountyId);
    if (!bounty) throw new Error("Bounty not found.");
    const team = await ctx.db.get(teamId);
    if (!team) throw new Error("Team not found.");
    if (bounty.points !== 0) {
      await awardPoints(ctx, {
        eventId: event._id,
        teamId,
        points: bounty.points,
        reason: "bonus",
        note: `Side quest: ${bounty.title}`,
        createdByUserId: host._id,
      });
    }
    await ctx.db.patch(bountyId, {
      status: "done",
      awardedTeamId: teamId,
      awardedAt: Date.now(),
    });
    await recordActivity(ctx, event._id, {
      kind: "bonus",
      message: `${team.name} completed "${bounty.title}" (+${bounty.points} pts)`,
      teamId,
    });
    return true;
  },
});

/** Host: reopen a settled bounty (does not claw back points). */
export const reopen = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (ctx, { deviceId, bountyId }) => {
    await assertHost(ctx, deviceId);
    await ctx.db.patch(bountyId, {
      status: "open",
      awardedTeamId: undefined,
      awardedAt: undefined,
    });
    return true;
  },
});

/** Host: delete a bounty. */
export const remove = mutation({
  args: { deviceId: v.string(), bountyId: v.id("bounties") },
  handler: async (ctx, { deviceId, bountyId }) => {
    await assertHost(ctx, deviceId);
    await ctx.db.delete(bountyId);
    return true;
  },
});
