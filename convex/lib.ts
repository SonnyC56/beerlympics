/**
 * Shared server-side helpers. These are plain functions (not registered Convex
 * functions) imported by the query/mutation modules.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ── Codes / slugs ─────────────────────────────────────────────────────────────
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

/** Short, human-shareable, url-safe code (e.g. for invite links). */
export function genCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// ── Event ─────────────────────────────────────────────────────────────────────
/** Returns the single active event, or null if none exists yet. */
export async function getActiveEvent(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"events"> | null> {
  const events = await ctx.db.query("events").take(1);
  return events[0] ?? null;
}

/** Returns the active event or throws — use where an event is required. */
export async function requireActiveEvent(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"events">> {
  const event = await getActiveEvent(ctx);
  if (!event) throw new Error("No event has been created yet.");
  return event;
}

// ── Identity ──────────────────────────────────────────────────────────────────
/**
 * The signed-in user (Convex Auth). The `_deviceId` arg is ignored — identity
 * comes from the verified session, never from a client-supplied id — and is kept
 * only so existing call sites/args don't all have to change.
 */
export async function getUserByDevice(
  ctx: QueryCtx | MutationCtx,
  _deviceId?: string | undefined,
): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

/** Alias that reads clearly at new call sites. */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  return getUserByDevice(ctx);
}

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
  deviceId?: string | undefined,
): Promise<Doc<"users">> {
  const user = await getUserByDevice(ctx, deviceId);
  if (!user) throw new Error("Sign in to do that.");
  return user;
}

/** Throws unless the device belongs to a host. Returns the host user. */
export async function assertHost(
  ctx: QueryCtx | MutationCtx,
  deviceId: string | undefined,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx, deviceId);
  if (!user.isHost) {
    throw new Error("Host access required. Enter the host code to unlock.");
  }
  return user;
}

// ── Activity ticker ─────────────────────────────────────────────────────────────
export async function recordActivity(
  ctx: MutationCtx,
  eventId: Id<"events">,
  args: {
    kind: Doc<"activity">["kind"];
    message: string;
    emoji?: string;
    teamId?: Id<"teams">;
  },
): Promise<void> {
  await ctx.db.insert("activity", {
    eventId,
    kind: args.kind,
    message: args.message,
    emoji: args.emoji,
    teamId: args.teamId,
    createdAt: Date.now(),
  });
}

// ── Scoring ──────────────────────────────────────────────────────────────────
export async function awardPoints(
  ctx: MutationCtx,
  args: {
    eventId: Id<"events">;
    teamId: Id<"teams">;
    points: number;
    reason: Doc<"scoreEntries">["reason"];
    gameId?: Id<"games">;
    matchId?: Id<"matches">;
    phaseIndex?: number;
    place?: number;
    note?: string;
    createdByUserId?: Id<"users">;
  },
): Promise<Id<"scoreEntries">> {
  return await ctx.db.insert("scoreEntries", {
    eventId: args.eventId,
    teamId: args.teamId,
    gameId: args.gameId,
    matchId: args.matchId,
    phaseIndex: args.phaseIndex,
    points: args.points,
    reason: args.reason,
    place: args.place,
    note: args.note,
    createdByUserId: args.createdByUserId,
    createdAt: Date.now(),
  });
}

/**
 * Maps a 1-based placement to points for a game, honoring the game's own
 * placement curve (falling back to the event default), scaled by the game's
 * multiplier and the category multiplier.
 */
export function placementToPoints(
  event: Doc<"events">,
  game: Doc<"games">,
  place: number,
): number {
  const curve =
    game.placementPoints && game.placementPoints.length > 0
      ? game.placementPoints
      : event.settings.defaultPlacementPoints;
  let base: number;
  if (place <= curve.length) {
    base = curve[place - 1] ?? 0;
  } else {
    // Beyond the configured curve (big fields), keep a gentle descending tail
    // floored at 1 so every placing team earns *something* instead of silently
    // scoring 0. Works for any number of teams.
    const last = curve[curve.length - 1] ?? 0;
    base = Math.max(1, last - (place - curve.length));
  }
  const categoryMult = event.settings.categoryMultipliers[game.category] ?? 1;
  return Math.round(base * game.pointsMultiplier * categoryMult);
}
