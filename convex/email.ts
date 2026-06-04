import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ── Resend transport ──────────────────────────────────────────────────────────
type SendResult = { ok: true; id?: string } | { ok: false; error: string };

async function sendViaResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Beerlympics <onboarding@resend.dev>";
  const replyTo = process.env.RESEND_REPLY_TO;
  if (!key) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY is not set on the Convex deployment. Run: npx convex env set RESEND_API_KEY re_xxx",
    };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 300)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Branded HTML shell ────────────────────────────────────────────────────────
function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#07060a;font-family:Helvetica,Arial,sans-serif;color:#f4f1fa;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:8px;">
      <div style="font-size:30px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#ffd24d;margin-top:8px;">Beerlympics</div>
    </div>
    <div style="background:#110e1c;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px 24px;">
      ${inner}
    </div>
    <div style="text-align:center;color:#7c7490;font-size:12px;margin-top:18px;">Sent from the Beerlympics app · may the best team win</div>
  </div></body></html>`;
}

function eventLine(dateIso: string, startTime?: string, location?: string): string {
  const date = new Date(dateIso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const bits = [`${date}${startTime ? ` · ${startTime}` : ""}`];
  if (location) bits.push(location);
  return bits
    .map(
      (b) =>
        `<div style="font-size:15px;color:#cfc8e0;margin:4px 0;">${b}</div>`,
    )
    .join("");
}

function button(href: string, label: string): string {
  return `<div style="text-align:center;margin:24px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#ffd24d;color:#1a1205;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:16px;">${label}</a>
  </div>`;
}

// ── Invite email ──────────────────────────────────────────────────────────────
export const sendInvite = internalAction({
  args: {
    inviteId: v.id("invites"),
    to: v.string(),
    recipientName: v.optional(v.string()),
    note: v.optional(v.string()),
    link: v.string(),
    eventName: v.string(),
    tagline: v.optional(v.string()),
    dateIso: v.string(),
    startTime: v.optional(v.string()),
    location: v.optional(v.string()),
    hostName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const greeting = args.recipientName ? `Hey ${args.recipientName},` : "You're invited!";
    const inner = `
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;">${greeting}</div>
      <div style="font-size:16px;color:#cfc8e0;line-height:1.5;">
        ${args.hostName ? `${args.hostName} is hosting` : "You're invited to"} <b style="color:#ffd24d;">${args.eventName}</b>${args.tagline ? ` — ${args.tagline}` : ""}. Tap below to RSVP, claim your team name + theme, and get ready to compete.
      </div>
      <div style="margin:18px 0;padding:14px 16px;background:#181327;border-radius:14px;">
        ${eventLine(args.dateIso, args.startTime, args.location)}
      </div>
      ${args.note ? `<div style="font-size:15px;color:#cfc8e0;font-style:italic;border-left:3px solid #ffd24d;padding-left:12px;margin:14px 0;">"${args.note}"</div>` : ""}
      ${button(args.link, "RSVP + Pick Your Team")}
      <div style="text-align:center;font-size:12px;color:#7c7490;margin-top:8px;">or paste this link: <br/><span style="color:#9b93b3;">${args.link}</span></div>
    `;
    const result = await sendViaResend({
      to: args.to,
      subject: `You're invited to ${args.eventName}`,
      html: shell(inner),
    });
    await ctx.runMutation(internal.invites.markEmail, {
      inviteId: args.inviteId,
      status: result.ok ? "sent" : "failed",
      error: result.ok ? undefined : result.error,
    });
  },
});

// ── RSVP confirmation email ───────────────────────────────────────────────────
export const sendRsvpConfirmation = internalAction({
  args: {
    to: v.string(),
    name: v.string(),
    eventName: v.string(),
    dateIso: v.string(),
    startTime: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const inner = `
      <div style="font-size:22px;font-weight:800;color:#36e07a;margin-bottom:6px;">You're locked in, ${args.name}!</div>
      <div style="font-size:16px;color:#cfc8e0;line-height:1.5;">
        Your RSVP for <b style="color:#ffd24d;">${args.eventName}</b> is confirmed. Start stretching those flip-cup wrists.
      </div>
      <div style="margin:18px 0;padding:14px 16px;background:#181327;border-radius:14px;">
        ${eventLine(args.dateIso, args.startTime, args.location)}
      </div>
      <div style="font-size:14px;color:#9b93b3;">See you on the field.</div>
    `;
    // Best-effort: confirmation failures are non-critical, so just log.
    const result = await sendViaResend({
      to: args.to,
      subject: `RSVP confirmed — ${args.eventName}`,
      html: shell(inner),
    });
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.warn("RSVP confirmation email failed:", result.error);
    }
  },
});
