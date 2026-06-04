import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertHost, getActiveEvent, recordActivity } from "./lib";
import type { Doc } from "./_generated/dataModel";

/**
 * OPENING CEREMONY — "Parade of Nations"
 * --------------------------------------
 * A host-driven, app-run walk-out shown on the TV (`/scoreboard/tv/parade`).
 * Teams are revealed one at a time in reverse-seed order (underdogs first, the
 * top seed / defending champ last), each with their color, mascot, and walk-out
 * song. Then a flag wall for the national anthem, then the host lights the torch
 * — which flips the whole event to LIVE.
 */

const IDLE = { stage: "idle" as const, activeIndex: 0 };

/** Parade order: reverse seed (unseeded + high seeds first, seed #1 last). */
function paradeSort(a: Doc<"teams">, b: Doc<"teams">) {
  const sa = a.seed ?? 9999;
  const sb = b.seed ?? 9999;
  if (sa !== sb) return sb - sa; // descending seed → champ (#1) walks out last
  return a.createdAt - b.createdAt;
}

/** Public: ceremony state + the parade lineup (with walk-out songs + roasts). */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const event = await getActiveEvent(ctx);
    if (!event) return null;
    const ceremony = event.ceremony ?? IDLE;

    const teams = (
      await ctx.db
        .query("teams")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect()
    ).sort(paradeSort);

    const lineup = await Promise.all(
      teams.map(async (t, i) => {
        // The team's latest roast clip, if any (played during their reveal).
        const roast = await ctx.db
          .query("media")
          .withIndex("by_team", (q) => q.eq("teamId", t._id))
          .order("desc")
          .collect();
        const clip = roast.find((m) => m.roast && m.kind === "video");
        return {
          _id: t._id,
          order: i,
          name: t.name,
          emoji: t.emoji,
          color: t.color,
          theme: t.theme,
          motto: t.motto,
          seed: t.seed,
          walkoutSong: t.walkoutSong,
          roastUrl: clip ? await ctx.storage.getUrl(clip.storageId) : null,
        };
      }),
    );

    return {
      eventName: event.name,
      eventStatus: event.status,
      stage: ceremony.stage,
      activeIndex: ceremony.activeIndex,
      total: lineup.length,
      lineup,
    };
  },
});

async function patchCeremony(
  ctx: Parameters<typeof recordActivity>[0],
  event: Doc<"events">,
  stage: "idle" | "parade" | "anthem" | "torch" | "live",
  activeIndex: number,
) {
  await ctx.db.patch(event._id, {
    ceremony: { stage, activeIndex, updatedAt: Date.now() },
  });
}

/** Host: kick off the parade (resets to the first team). */
export const start = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    await patchCeremony(ctx, event, "parade", 0);
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "The Parade of Nations has begun — line up your teams!",
    });
    return true;
  },
});

/** Host: advance the parade (next team, then on to the anthem). */
export const next = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const c = event.ceremony ?? IDLE;
    const count = (
      await ctx.db
        .query("teams")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect()
    ).length;

    if (c.stage === "parade") {
      if (c.activeIndex < count - 1) {
        await patchCeremony(ctx, event, "parade", c.activeIndex + 1);
      } else {
        await patchCeremony(ctx, event, "anthem", c.activeIndex);
      }
    } else if (c.stage === "anthem") {
      await patchCeremony(ctx, event, "torch", c.activeIndex);
    }
    return true;
  },
});

/** Host: step back through the ceremony. */
export const prev = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const c = event.ceremony ?? IDLE;
    if (c.stage === "torch") {
      await patchCeremony(ctx, event, "anthem", c.activeIndex);
    } else if (c.stage === "anthem") {
      await patchCeremony(ctx, event, "parade", Math.max(0, c.activeIndex));
    } else if (c.stage === "parade" && c.activeIndex > 0) {
      await patchCeremony(ctx, event, "parade", c.activeIndex - 1);
    }
    return true;
  },
});

/** Host: jump straight to a stage. */
export const setStage = mutation({
  args: {
    deviceId: v.string(),
    stage: v.union(
      v.literal("idle"),
      v.literal("parade"),
      v.literal("anthem"),
      v.literal("torch"),
    ),
  },
  handler: async (ctx, { deviceId, stage }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    const c = event.ceremony ?? IDLE;
    await patchCeremony(ctx, event, stage, stage === "parade" ? 0 : c.activeIndex);
    return true;
  },
});

/** Host: light the torch — the finale that flips the games LIVE. */
export const lightTorch = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    await patchCeremony(ctx, event, "live", event.ceremony?.activeIndex ?? 0);
    if (event.status !== "live") await ctx.db.patch(event._id, { status: "live" });
    await recordActivity(ctx, event._id, {
      kind: "announcement",
      message: "The torch is lit — let the Beer Olympics begin!",
    });
    return true;
  },
});

/** Host: end / hide the ceremony (back to idle). */
export const reset = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    await patchCeremony(ctx, event, "idle", 0);
    return true;
  },
});
