"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import { Spinner, cx, useAction, useToast } from "@/components/primitives";
import { Icon } from "@/components/Icon";
import { HostField, MiniButton } from "./HostKit";

/** Section header with a leading SVG icon (emoji-free). */
function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5 font-display text-xl text-white">
        <span className="inline-flex shrink-0">{icon}</span>
        {title}
      </h2>
    </div>
  );
}

type Invite = {
  _id: Id<"invites">;
  code: string;
  label?: string;
  recipientName?: string;
  recipientEmail?: string;
  note?: string;
  uses: number;
  maxUses?: number;
  emailStatus?: "queued" | "sent" | "failed";
  sentAt?: number;
  createdAt: number;
};

function origin() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

export function HostInvites() {
  const identity = useIdentity();
  const invites = useQuery(
    api.invites.list,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  ) as Invite[] | undefined;
  const hostCode = useQuery(
    api.events.getHostCode,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  );

  return (
    <div className="space-y-5">
      {/* ── Host code ──────────────────────────────────────────────────── */}
      <HostCodeCard hostCode={hostCode} />

      {/* ── Create invite ──────────────────────────────────────────────── */}
      <CreateInvite />

      {/* ── Invite list ────────────────────────────────────────────────── */}
      <section className="panel p-5">
        <SectionTitle icon={<Icon name="link" size={20} />} title="Invite Links" />
        {invites === undefined ? (
          <Spinner />
        ) : invites.length === 0 ? (
          <p className="text-sm text-white/45">
            No invites yet. Create one above to text or email a personalized link.
          </p>
        ) : (
          <div className="space-y-2.5">
            {invites.map((inv) => (
              <InviteRow key={inv._id} invite={inv} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Host code ─────────────────────────────────────────────────────────────────
function HostCodeCard({ hostCode }: { hostCode: string | null | undefined }) {
  const toast = useToast();
  return (
    <section className="panel stadium-grid p-5">
      <SectionTitle icon={<Icon name="crown" size={20} />} title="Host Code" />
      <p className="mb-3 text-sm text-white/55">
        Share this code with a co-host so they can run controls from their own
        phone.
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-2xl border border-[var(--color-gold-500)]/40 bg-black/40 px-4 py-3 text-center font-display text-2xl tracking-[0.3em] text-[var(--color-gold-300)]">
          {hostCode ?? "•••••"}
        </div>
        <button
          className="btn btn-ghost shrink-0"
          disabled={!hostCode}
          onClick={() => {
            if (!hostCode) return;
            navigator.clipboard?.writeText(hostCode);
            toast("Host code copied", "ok");
          }}
        >
          Copy
        </button>
      </div>
    </section>
  );
}

// ── Create invite ─────────────────────────────────────────────────────────────
function CreateInvite() {
  const identity = useIdentity();
  const run = useAction();
  const toast = useToast();
  const create = useMutation(api.invites.create);

  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  const reset = () => {
    setLabel("");
    setRecipientName("");
    setRecipientEmail("");
    setNote("");
    setSendEmail(false);
  };

  return (
    <section className="panel p-5">
      <SectionTitle icon={<Icon name="envelope" size={20} />} title="New Invite" />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <HostField label="Label" hint="for you">
            <input
              className="field"
              placeholder="The Smiths"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
            />
          </HostField>
          <HostField label="Recipient">
            <input
              className="field"
              placeholder="Alex"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              maxLength={40}
            />
          </HostField>
        </div>
        <HostField label="Email" hint="optional — to send via Resend">
          <input
            type="email"
            className="field"
            placeholder="alex@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </HostField>
        <HostField label="Personal note" hint="optional">
          <textarea
            className="field min-h-16 resize-none"
            placeholder="Can't wait to see you there!"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={240}
          />
        </HostField>

        <label
          className={cx(
            "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition",
            sendEmail && recipientEmail
              ? "border-[var(--color-gold-500)]/40 bg-[var(--color-gold-500)]/8"
              : "border-white/8 bg-white/4",
          )}
        >
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Icon name="envelope" size={16} /> Email it now
            </div>
            <div className="text-xs text-white/45">
              {recipientEmail
                ? "Sends the link via Resend on create."
                : "Add an email above to enable."}
            </div>
          </div>
          <button
            type="button"
            disabled={!recipientEmail}
            onClick={() => setSendEmail((v) => !v)}
            className={cx(
              "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40",
              sendEmail && recipientEmail
                ? "bg-[var(--color-gold-500)]"
                : "bg-white/15",
            )}
            aria-pressed={sendEmail}
          >
            <span
              className={cx(
                "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                sendEmail && recipientEmail ? "left-6" : "left-1",
              )}
            />
          </button>
        </label>

        <button
          className="btn btn-gold inline-flex w-full items-center justify-center gap-1.5"
          disabled={!identity.deviceId}
          onClick={() =>
            run(async () => {
              const res = await create({
                deviceId: identity.deviceId!,
                label: label.trim() || undefined,
                recipientName: recipientName.trim() || undefined,
                recipientEmail: recipientEmail.trim() || undefined,
                note: note.trim() || undefined,
                sendEmail: sendEmail && !!recipientEmail.trim(),
                appBaseUrl: origin(),
              });
              const link = (res as { link?: string })?.link;
              if (link) {
                await navigator.clipboard?.writeText(link).catch(() => {});
                toast("Invite created — link copied!", "ok");
              }
              reset();
            })
          }
        >
          <Icon name="link" size={16} /> Create invite link
        </button>
      </div>
    </section>
  );
}

// ── Invite row ────────────────────────────────────────────────────────────────
function InviteRow({ invite }: { invite: Invite }) {
  const identity = useIdentity();
  const run = useAction();
  const toast = useToast();
  const resend = useMutation(api.invites.resend);
  const remove = useMutation(api.invites.remove);
  const [confirmDel, setConfirmDel] = useState(false);

  const link = `${origin()}/i/${invite.code}`;
  const emailStatus = invite.emailStatus;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg tracking-widest text-[var(--color-gold-300)]">
              {invite.code}
            </span>
            <span className="chip">
              {invite.uses}
              {invite.maxUses ? `/${invite.maxUses}` : ""} used
            </span>
          </div>
          {(invite.label || invite.recipientName) && (
            <div className="mt-0.5 truncate text-sm text-white/70">
              {invite.label ?? invite.recipientName}
            </div>
          )}
          {invite.recipientEmail && (
            <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-white/40">
              {invite.recipientEmail}
              {emailStatus && (
                <span
                  className={cx(
                    "inline-flex items-center gap-1 font-bold",
                    emailStatus === "sent" && "text-[var(--color-win)]",
                    emailStatus === "failed" && "text-[var(--color-loss)]",
                    emailStatus === "queued" && "text-[var(--color-gold-400)]",
                  )}
                >
                  ·{" "}
                  {emailStatus === "sent" ? (
                    <>
                      <Icon name="envelope" size={12} /> sent
                    </>
                  ) : emailStatus === "failed" ? (
                    <>
                      <Icon name="warning" size={12} /> failed
                    </>
                  ) : (
                    <>
                      <Icon name="clock" size={12} /> queued
                    </>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MiniButton
          tone="gold"
          onClick={() => {
            navigator.clipboard?.writeText(link);
            toast("Link copied — paste it in a text!", "ok");
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clipboard" size={14} /> Copy link
          </span>
        </MiniButton>
        {invite.recipientEmail && (
          <MiniButton
            disabled={!identity.deviceId}
            onClick={() =>
              run(
                () =>
                  resend({
                    deviceId: identity.deviceId!,
                    inviteId: invite._id,
                    appBaseUrl: origin(),
                  }),
                "Email re-queued",
              )
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="envelope" size={14} /> Resend
            </span>
          </MiniButton>
        )}
        <div className="ml-auto">
          {confirmDel ? (
            <div className="flex items-center gap-1.5">
              <MiniButton
                tone="flame"
                disabled={!identity.deviceId}
                onClick={() =>
                  run(
                    () =>
                      remove({
                        deviceId: identity.deviceId!,
                        inviteId: invite._id,
                      }),
                    "Invite deleted",
                  )
                }
              >
                Confirm
              </MiniButton>
              <MiniButton onClick={() => setConfirmDel(false)}>Cancel</MiniButton>
            </div>
          ) : (
            <MiniButton tone="flame" onClick={() => setConfirmDel(true)}>
              Delete
            </MiniButton>
          )}
        </div>
      </div>
    </div>
  );
}
