import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  assertHost,
  getActiveEvent,
  getUserByDevice,
  recordActivity,
  requireUser,
} from "./lib";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function membersOf(ctx: QueryCtx | MutationCtx, teamId: Id<"teams">) {
  return await ctx.db
    .query("players")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();
}

/** All teams with their rosters. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const withMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await membersOf(ctx, team._id);
        return {
          ...team,
          members: members.map((m) => ({
            _id: m._id,
            userId: m.userId,
            name: m.name,
            emoji: m.emoji,
            role: m.role ?? "member",
          })),
        };
      }),
    );
    return withMembers.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/** A single team + roster. */
export const get = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const team = await ctx.db.get(teamId);
    if (!team) return null;
    const members = await membersOf(ctx, teamId);
    return {
      ...team,
      members: members.map((m) => ({
        _id: m._id,
        userId: m.userId,
        name: m.name,
        emoji: m.emoji,
        role: m.role ?? "member",
      })),
    };
  },
});

/** Create a team; the caller becomes captain. Requires an RSVP. */
export const create = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    theme: v.optional(v.string()),
    motto: v.optional(v.string()),
    color: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event yet.");
    const user = await requireUser(ctx, args.deviceId);

    const player = await ctx.db
      .query("players")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user._id),
      )
      .unique();
    if (!player) throw new Error("RSVP before creating a team.");
    if (player.teamId) throw new Error("Leave your current team first.");

    const name = args.name.trim();
    if (!name) throw new Error("Team needs a name.");

    const teamId = await ctx.db.insert("teams", {
      eventId: event._id,
      name,
      theme: args.theme?.trim(),
      motto: args.motto?.trim(),
      color: args.color,
      emoji: args.emoji,
      captainUserId: user._id,
      createdAt: Date.now(),
    });
    await ctx.db.patch(player._id, { teamId, role: "captain" });
    await recordActivity(ctx, event._id, {
      kind: "team",
      message: `Team "${name}" just entered the arena!`,
      teamId,
    });
    return teamId;
  },
});

/** Join an existing team. */
export const join = mutation({
  args: { deviceId: v.string(), teamId: v.id("teams") },
  handler: async (ctx, { deviceId, teamId }) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const user = await requireUser(ctx, deviceId);
    const team = await ctx.db.get(teamId);
    if (!team) throw new Error("Team not found.");

    const player = await ctx.db
      .query("players")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user._id),
      )
      .unique();
    if (!player) throw new Error("RSVP before joining a team.");
    await ctx.db.patch(player._id, { teamId, role: "member" });
    await recordActivity(ctx, event._id, {
      kind: "team",
      message: `${player.name} joined ${team.name}`,
      teamId,
    });
    return true;
  },
});

/** Leave your team. Promotes a new captain or deletes an empty team. */
export const leave = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const user = await requireUser(ctx, deviceId);
    const player = await ctx.db
      .query("players")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", event._id).eq("userId", user._id),
      )
      .unique();
    if (!player?.teamId) return true;
    const teamId = player.teamId;
    const team = await ctx.db.get(teamId);
    await ctx.db.patch(player._id, { teamId: undefined, role: undefined });

    const remaining = await membersOf(ctx, teamId);
    if (remaining.length === 0) {
      if (team) await ctx.db.delete(teamId);
    } else if (team && team.captainUserId === user._id) {
      // Promote the earliest-joined remaining member.
      const next = remaining.sort((a, b) => a.respondedAt - b.respondedAt)[0];
      await ctx.db.patch(team._id, { captainUserId: next.userId });
      await ctx.db.patch(next._id, { role: "captain" });
    }
    return true;
  },
});

/** Captain (or host) edits team identity. */
export const update = mutation({
  args: {
    deviceId: v.string(),
    teamId: v.id("teams"),
    patch: v.object({
      name: v.optional(v.string()),
      theme: v.optional(v.string()),
      motto: v.optional(v.string()),
      color: v.optional(v.string()),
      emoji: v.optional(v.string()),
      walkoutSong: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { deviceId, teamId, patch }) => {
    const user = await requireUser(ctx, deviceId);
    const team = await ctx.db.get(teamId);
    if (!team) throw new Error("Team not found.");
    if (team.captainUserId !== user._id && !user.isHost) {
      throw new Error("Only the captain or host can edit this team.");
    }
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, val]) => val !== undefined && val !== ""),
    );
    await ctx.db.patch(teamId, clean);
    return true;
  },
});

/** Host: kick a player off a team. */
export const removeMember = mutation({
  args: { deviceId: v.string(), playerId: v.id("players") },
  handler: async (ctx, { deviceId, playerId }) => {
    await assertHost(ctx, deviceId);
    const player = await ctx.db.get(playerId);
    if (player) await ctx.db.patch(playerId, { teamId: undefined, role: undefined });
    return true;
  },
});

/** Host: set/seed teams for bracket placement. */
export const setSeed = mutation({
  args: { deviceId: v.string(), teamId: v.id("teams"), seed: v.number() },
  handler: async (ctx, { deviceId, teamId, seed }) => {
    await assertHost(ctx, deviceId);
    await ctx.db.patch(teamId, { seed });
    return true;
  },
});

/** Host: delete a team and free its members. */
export const remove = mutation({
  args: { deviceId: v.string(), teamId: v.id("teams") },
  handler: async (ctx, { deviceId, teamId }) => {
    await assertHost(ctx, deviceId);
    const members = await ctx.db
      .query("players")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
    for (const m of members) {
      await ctx.db.patch(m._id, { teamId: undefined, role: undefined });
    }
    await ctx.db.delete(teamId);
    return true;
  },
});
