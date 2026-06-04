"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import webpush from "web-push";

/**
 * Send "you're up next" web-push notifications to everyone in a just-seated
 * match. Runs in the Node runtime (web-push needs node crypto). Dead
 * subscriptions (404/410) are pruned.
 */
export const sendToMatch = internalAction({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:host@beerlympics.app";
    if (!pub || !priv) return; // push not configured — no-op

    webpush.setVapidDetails(subject, pub, priv);

    const payloads = await ctx.runQuery(internal.push.payloadsForMatch, { matchId });
    await Promise.all(
      payloads.map(async (p) => {
        try {
          await webpush.sendNotification(
            { endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } },
            JSON.stringify({ title: p.title, body: p.body, url: "/play" }),
          );
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await ctx.runMutation(internal.push.remove, { id: p.id });
          }
        }
      }),
    );
  },
});

/**
 * Broadcast a notification to EVERYONE subscribed — used for the wheel's
 * "everybody drinks" moments (whether spun digitally or on the physical wheel).
 */
export const sendBroadcast = internalAction({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, { title, body, url }) => {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:host@beerlympics.app";
    if (!pub || !priv) return; // push not configured — no-op

    webpush.setVapidDetails(subject, pub, priv);

    const subs = await ctx.runQuery(internal.push.allSubscriptions, {});
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title, body, url: url ?? "/games" }),
          );
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await ctx.runMutation(internal.push.remove, { id: s.id });
          }
        }
      }),
    );
  },
});
