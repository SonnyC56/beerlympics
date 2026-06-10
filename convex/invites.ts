import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { assertHost, genCode, getActiveEvent } from "./lib";

/** Public: look up an invite by code to pre-fill the RSVP page. */
export const peek = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();
    if (!invite) return null;
    return {
      code: invite.code,
      label: invite.label,
      recipientName: invite.recipientName,
      note: invite.note,
    };
  },
});

/** Public: record that an invite link was opened (best-effort attribution). */
export const claim = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();
    if (!invite) return false;
    // Note when the link was last opened, but DON'T count an open as a "use".
    // Uses now reflects actual sign-ups (see `list` below), so simply opening
    // — or re-opening — the link no longer inflates the count.
    await ctx.db.patch(invite._id, { lastClaimedAt: Date.now() });
    return true;
  },
});

/** Host: list all invites with usage. */
export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    await assertHost(ctx, deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) return [];
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();

    // "uses" = how many people actually signed up through each link. We derive
    // it from the players who RSVP'd with that invite's code, rather than from a
    // counter bumped on every page open (which over-counted re-opens and people
    // who opened the link but never RSVP'd). Codes are normalized to uppercase
    // on both sides so attribution matches regardless of link casing.
    const players = await ctx.db
      .query("players")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const signupsByCode = new Map<string, number>();
    for (const p of players) {
      if (!p.invitedViaCode) continue;
      const key = p.invitedViaCode.toUpperCase();
      signupsByCode.set(key, (signupsByCode.get(key) ?? 0) + 1);
    }

    return invites
      .map((inv) => ({
        ...inv,
        uses: signupsByCode.get(inv.code.toUpperCase()) ?? 0,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Host: create a custom invite link. Optionally email it via Resend right away.
 * Returns the code so the client can build a shareable link to text manually.
 */
export const create = mutation({
  args: {
    deviceId: v.string(),
    label: v.optional(v.string()),
    recipientName: v.optional(v.string()),
    recipientEmail: v.optional(v.string()),
    note: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    sendEmail: v.optional(v.boolean()),
    appBaseUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const host = await assertHost(ctx, args.deviceId);
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event yet.");

    // Generate a unique code.
    let code = genCode(6);
    for (let i = 0; i < 5; i++) {
      const clash = await ctx.db
        .query("invites")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!clash) break;
      code = genCode(6);
    }

    const willEmail = !!(args.sendEmail && args.recipientEmail);
    const inviteId = await ctx.db.insert("invites", {
      eventId: event._id,
      code,
      label: args.label?.trim(),
      recipientName: args.recipientName?.trim(),
      recipientEmail: args.recipientEmail?.trim(),
      createdByUserId: host._id,
      maxUses: args.maxUses,
      uses: 0,
      note: args.note?.trim(),
      emailStatus: willEmail ? "queued" : undefined,
      createdAt: Date.now(),
    });

    if (willEmail) {
      await ctx.scheduler.runAfter(0, internal.email.sendInvite, {
        inviteId,
        to: args.recipientEmail!.trim(),
        recipientName: args.recipientName?.trim(),
        note: args.note?.trim(),
        link: `${args.appBaseUrl.replace(/\/$/, "")}/i/${code}`,
        eventName: event.name,
        tagline: event.tagline,
        dateIso: event.dateIso,
        startTime: event.startTime,
        location: event.location,
        hostName: host.name,
      });
    }

    return { inviteId, code, link: `${args.appBaseUrl.replace(/\/$/, "")}/i/${code}` };
  },
});

/**
 * Host: edit an existing invite's details. Passing an empty string clears that
 * field; omitting a field leaves it unchanged is NOT supported here — the editor
 * always sends the full set, so a blank value means "clear it".
 */
export const update = mutation({
  args: {
    deviceId: v.string(),
    inviteId: v.id("invites"),
    label: v.optional(v.string()),
    recipientName: v.optional(v.string()),
    recipientEmail: v.optional(v.string()),
    note: v.optional(v.string()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, inviteId, label, recipientName, recipientEmail, note, maxUses }) => {
    await assertHost(ctx, deviceId);
    const invite = await ctx.db.get(inviteId);
    if (!invite) throw new Error("Invite not found.");
    const clean = (s?: string) => {
      const t = s?.trim();
      return t ? t : undefined;
    };
    // Patching a field to `undefined` removes it from the doc.
    await ctx.db.patch(inviteId, {
      label: clean(label),
      recipientName: clean(recipientName),
      recipientEmail: clean(recipientEmail),
      note: clean(note),
      maxUses: maxUses && maxUses > 0 ? maxUses : undefined,
    });
    return true;
  },
});

/** Host: re-send an invite email. */
export const resend = mutation({
  args: { deviceId: v.string(), inviteId: v.id("invites"), appBaseUrl: v.string() },
  handler: async (ctx, { deviceId, inviteId, appBaseUrl }) => {
    const host = await assertHost(ctx, deviceId);
    const invite = await ctx.db.get(inviteId);
    if (!invite) throw new Error("Invite not found.");
    if (!invite.recipientEmail) throw new Error("No email on this invite.");
    const event = await getActiveEvent(ctx);
    if (!event) throw new Error("No event.");
    await ctx.db.patch(inviteId, { emailStatus: "queued", emailError: undefined });
    await ctx.scheduler.runAfter(0, internal.email.sendInvite, {
      inviteId,
      to: invite.recipientEmail,
      recipientName: invite.recipientName,
      note: invite.note,
      link: `${appBaseUrl.replace(/\/$/, "")}/i/${invite.code}`,
      eventName: event.name,
      tagline: event.tagline,
      dateIso: event.dateIso,
      startTime: event.startTime,
      location: event.location,
      hostName: host.name,
    });
    return true;
  },
});

/** Host: delete an invite. */
export const remove = mutation({
  args: { deviceId: v.string(), inviteId: v.id("invites") },
  handler: async (ctx, { deviceId, inviteId }) => {
    await assertHost(ctx, deviceId);
    await ctx.db.delete(inviteId);
    return true;
  },
});

/** Internal: update an invite's email delivery status (called by the email action). */
export const markEmail = internalMutation({
  args: {
    inviteId: v.id("invites"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { inviteId, status, error }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite) return;
    await ctx.db.patch(inviteId, {
      emailStatus: status,
      emailError: error,
      sentAt: status === "sent" ? Date.now() : invite.sentAt,
    });
  },
});
