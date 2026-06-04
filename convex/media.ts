import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveEvent, getUserByDevice, recordActivity } from "./lib";

/** Step 1 of upload: get a short-lived URL to POST the file to Convex storage. */
export const generateUploadUrl = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    // Any known device may contribute to the reel.
    const user = await getUserByDevice(ctx, deviceId);
    if (!user) throw new Error("Set your name before uploading.");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Step 2: record the uploaded file's metadata. */
export const record = mutation({
  args: {
    deviceId: v.string(),
    storageId: v.id("_storage"),
    kind: v.union(v.literal("photo"), v.literal("video")),
    caption: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    gameId: v.optional(v.id("games")),
    matchId: v.optional(v.id("matches")),
    takenAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    roast: v.optional(v.boolean()), // a Roast Cam confessional
  },
  handler: async (ctx, args) => {
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const user = await getUserByDevice(ctx, args.deviceId);
    const now = Date.now();
    // If tagged to a match but not a game, inherit the match's game.
    let gameId = args.gameId;
    if (!gameId && args.matchId) {
      const match = await ctx.db.get(args.matchId);
      gameId = match?.gameId;
    }
    const mediaId = await ctx.db.insert("media", {
      eventId: event._id,
      storageId: args.storageId,
      kind: args.kind,
      uploaderUserId: user?._id,
      uploaderName: user?.name,
      teamId: args.teamId,
      gameId,
      matchId: args.matchId,
      caption: args.caption?.trim(),
      roast: args.roast || undefined,
      takenAt: args.takenAt ?? now,
      durationMs: args.durationMs,
      favorite: false,
      createdAt: now,
    });
    await recordActivity(ctx, event._id, {
      kind: "media",
      message: args.roast
        ? `${user?.name ?? "Someone"} dropped a Roast Cam confessional`
        : `${user?.name ?? "Someone"} captured a ${args.kind} for the reel`,
      teamId: args.teamId,
    });
    return mediaId;
  },
});

/** Roast Cam gallery — trash-talk confessionals, newest first. */
export const roasts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const rows = await ctx.db
      .query("media")
      .withIndex("by_event_and_roast", (q) =>
        q.eq("eventId", event._id).eq("roast", true),
      )
      .order("desc")
      .take(limit ?? 100);
    return await Promise.all(
      rows.map(async (m) => {
        const team = m.teamId ? await ctx.db.get(m.teamId) : null;
        return {
          ...m,
          url: await ctx.storage.getUrl(m.storageId),
          teamName: team?.name ?? null,
          teamEmoji: team?.emoji ?? null,
          teamColor: team?.color ?? null,
        };
      }),
    );
  },
});

/** The event gallery, newest first, resolved to playable URLs. */
export const list = query({
  args: {
    favoritesOnly: v.optional(v.boolean()),
    teamId: v.optional(v.id("teams")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { favoritesOnly, teamId, limit }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    let rows = await ctx.db
      .query("media")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .order("desc")
      .take(limit ?? 200);
    if (favoritesOnly) rows = rows.filter((m) => m.favorite);
    if (teamId) rows = rows.filter((m) => m.teamId === teamId);
    return await Promise.all(
      rows.map(async (m) => ({
        ...m,
        url: await ctx.storage.getUrl(m.storageId),
      })),
    );
  },
});

/** Media tagged to a specific match (newest first). */
export const forMatch = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const rows = await ctx.db
      .query("media")
      .withIndex("by_match", (q) => q.eq("matchId", matchId))
      .order("desc")
      .collect();
    return await Promise.all(
      rows.map(async (m) => ({ ...m, url: await ctx.storage.getUrl(m.storageId) })),
    );
  },
});

/** Media tagged to a specific game (newest first). */
export const forGame = query({
  args: { gameId: v.id("games"), limit: v.optional(v.number()) },
  handler: async (ctx, { gameId, limit }) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const rows = (
      await ctx.db
        .query("media")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .order("desc")
        .take(limit ?? 200)
    ).filter((m) => m.gameId === gameId);
    return await Promise.all(
      rows.map(async (m) => ({ ...m, url: await ctx.storage.getUrl(m.storageId) })),
    );
  },
});

/**
 * Highlight reel: favorites in capture order (oldest to newest) so a host can
 * stitch them into a chronological recap.
 */
export const highlightReel = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const rows = await ctx.db
      .query("media")
      .withIndex("by_event_and_favorite", (q) =>
        q.eq("eventId", event._id).eq("favorite", true),
      )
      .collect();
    rows.sort((a, b) => a.takenAt - b.takenAt);
    return await Promise.all(
      rows.map(async (m) => ({
        ...m,
        url: await ctx.storage.getUrl(m.storageId),
      })),
    );
  },
});

/** Flag/unflag a clip for the highlight reel. */
export const toggleFavorite = mutation({
  args: { deviceId: v.string(), mediaId: v.id("media") },
  handler: async (ctx, { deviceId, mediaId }) => {
    const user = await getUserByDevice(ctx, deviceId);
    if (!user) throw new Error("Unknown user.");
    const media = await ctx.db.get(mediaId);
    if (!media) throw new Error("Not found.");
    await ctx.db.patch(mediaId, { favorite: !media.favorite });
    return !media.favorite;
  },
});

/** Delete a clip (uploader or host). Frees storage. */
export const remove = mutation({
  args: { deviceId: v.string(), mediaId: v.id("media") },
  handler: async (ctx, { deviceId, mediaId }) => {
    const user = await getUserByDevice(ctx, deviceId);
    const media = await ctx.db.get(mediaId);
    if (!media) return true;
    const canDelete =
      user && (user.isHost || media.uploaderUserId === user._id);
    if (!canDelete) throw new Error("Only the uploader or host can delete this.");
    await ctx.storage.delete(media.storageId);
    await ctx.db.delete(mediaId);
    return true;
  },
});

/** Counts for the media tab badge. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return { total: 0, photos: 0, videos: 0, favorites: 0 };
    const rows = await ctx.db
      .query("media")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    return {
      total: rows.length,
      photos: rows.filter((m) => m.kind === "photo").length,
      videos: rows.filter((m) => m.kind === "video").length,
      favorites: rows.filter((m) => m.favorite).length,
    };
  },
});
