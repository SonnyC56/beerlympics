"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import {
  Avatar,
  NumberStepper,
  Segmented,
  TeamBadge,
  cx,
  useAction,
} from "@/components/primitives";
import { EmojiPicker } from "@/components/EmojiColorPicker";
import { Icon, Mascot } from "@/components/Icon";

type RsvpStatus = "yes" | "no" | "maybe";

type ExistingRsvp = {
  status: RsvpStatus;
  plusOnes: number;
  note?: string;
  emoji?: string;
  name?: string;
  team?: { emoji: string; name: string; color: string } | null;
} | null;

const STATUS_OPTIONS: { value: RsvpStatus; label: React.ReactNode }[] = [
  {
    value: "yes",
    label: (
      <span className="inline-flex items-center justify-center gap-1.5">
        Yes <Icon name="beer" size={14} />
      </span>
    ),
  },
  {
    value: "maybe",
    label: (
      <span className="inline-flex items-center justify-center gap-1.5">
        Maybe <Icon name="thinking" size={14} />
      </span>
    ),
  },
  {
    value: "no",
    label: (
      <span className="inline-flex items-center justify-center gap-1.5">
        Can&apos;t <Icon name="sad" size={14} />
      </span>
    ),
  },
];

export function RsvpForm({
  recipientName,
  invitedViaCode,
  existing,
  compact,
}: {
  /** Pre-fill the name (e.g. from a personalized invite). */
  recipientName?: string;
  /** Attribution code passed straight through to rsvp.respond. */
  invitedViaCode?: string;
  /** The caller's current RSVP, to pre-fill + show a "you're in" state. */
  existing?: ExistingRsvp;
  /** Render in a slightly tighter layout (used on the invite page). */
  compact?: boolean;
}) {
  const identity = useIdentity();
  const respond = useMutation(api.rsvp.respond);
  const run = useAction();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("beer");
  const [status, setStatus] = useState<RsvpStatus>("yes");
  const [plusOnes, setPlusOnes] = useState(0);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState<RsvpStatus | null>(null);

  // Seed the form from identity / invite / existing RSVP once those resolve.
  // `existing === undefined` means the parent's query is still loading.
  const seedKey = `${identity.user?.name ?? ""}|${recipientName ?? ""}|${
    existing ? "y" : "n"
  }`;
  useEffect(() => {
    const identityName =
      identity.user?.name && identity.user.name !== "New Player"
        ? identity.user.name
        : "";
    setName(existing?.name || recipientName || identityName || "");
    setEmoji(existing?.emoji || identity.user?.emoji || "beer");
    if (existing) {
      setStatus(existing.status);
      setPlusOnes(existing.plusOnes ?? 0);
      setNote(existing.note ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  const trimmedName = name.trim();
  const canSubmit = !!identity.deviceId && trimmedName.length > 0 && !saving;
  const alreadyResponded = !!existing;

  async function submit() {
    if (!identity.deviceId || !trimmedName) return;
    setSaving(true);
    const ok = await run(
      () =>
        respond({
          deviceId: identity.deviceId!,
          name: trimmedName,
          emoji,
          status,
          plusOnes: status === "yes" ? plusOnes : 0,
          note: note.trim() || undefined,
          email: email.trim() || undefined,
          invitedViaCode,
        }),
      status === "yes"
        ? "You're in! See you there"
        : status === "maybe"
          ? "Marked as a maybe"
          : "RSVP saved — we'll miss you",
    );
    setSaving(false);
    if (ok) setConfirmed(status);
  }

  // ── Confirmation state ──────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="panel animate-pop space-y-4 p-6 text-center">
        <div className="animate-float text-medal">
          <Icon
            name={confirmed === "yes" ? "party" : confirmed === "maybe" ? "thinking" : "heart"}
            size={60}
          />
        </div>
        <h2 className="font-display text-3xl text-medal">
          {confirmed === "yes"
            ? "You're locked in!"
            : confirmed === "maybe"
              ? "Penciled in"
              : "Maybe next year"}
        </h2>
        <p className="mx-auto max-w-xs text-sm text-white/60">
          {confirmed === "yes"
            ? "Your spot is saved. Time to pick a squad and start training your liver."
            : confirmed === "maybe"
              ? "We've got you down as a maybe. Flip to a yes anytime — the keg's waiting."
              : "No worries — we'll save you a cold one. Change your mind? Just RSVP again."}
        </p>
        {email.trim() && confirmed === "yes" && (
          <p className="inline-flex items-center justify-center gap-1.5 text-xs text-[var(--color-gold-300)]">
            <Icon name="envelope" size={13} /> Confirmation on the way to {email.trim()}
          </p>
        )}
        <div className="flex flex-col gap-2 pt-1">
          {confirmed === "yes" && (
            <Link href="/teams" className="btn btn-gold flex w-full items-center justify-center gap-2 py-3.5 text-base">
              <Icon name="flag" size={16} /> Now pick your team
              <Icon name="arrowRight" size={16} />
            </Link>
          )}
          <button
            className="btn btn-ghost w-full"
            onClick={() => setConfirmed(null)}
          >
            Edit my RSVP
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className={cx("panel space-y-5", compact ? "p-5" : "p-6")}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-white">
          {alreadyResponded ? "Update your RSVP" : "Are you in?"}
        </h2>
        {alreadyResponded && (
          <span className="chip inline-flex items-center gap-1.5 text-[var(--color-gold-300)]">
            <Icon
              name={
                existing!.status === "yes"
                  ? "check"
                  : existing!.status === "maybe"
                    ? "thinking"
                    : "sad"
              }
              size={13}
            />
            {existing!.status === "yes"
              ? "Going"
              : existing!.status === "maybe"
                ? "Maybe"
                : "Out"}
          </span>
        )}
      </div>

      {alreadyResponded && existing!.team && (
        <div className="flex items-center gap-2 rounded-2xl bg-white/4 px-4 py-3 text-sm">
          <span className="text-white/50">Your squad:</span>
          <TeamBadge
            emoji={existing!.team.emoji}
            name={existing!.team.name}
            color={existing!.team.color}
            size="sm"
          />
        </div>
      )}

      {/* Name + emoji */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-white/70">
          Your name
        </label>
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className={cx(
              "flex shrink-0 items-center justify-center rounded-[0.9rem] border px-3 transition",
              showEmoji
                ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)]"
                : "border-white/10 bg-black/40 text-white/85 hover:bg-white/8",
            )}
            aria-label="Choose your mascot"
            title="Choose your mascot"
          >
            <Mascot name={emoji} size={24} />
          </button>
          <input
            className="field"
            placeholder="What should we call you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={28}
          />
        </div>
        {showEmoji && (
          <div className="mt-3 animate-rise rounded-2xl border border-white/8 bg-black/30 p-3">
            <EmojiPicker
              value={emoji}
              onChange={(e) => {
                setEmoji(e);
                setShowEmoji(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-white/70">
          Can you make it?
        </label>
        <Segmented value={status} onChange={setStatus} options={STATUS_OPTIONS} />
      </div>

      {/* Plus-ones (only when going) */}
      {status === "yes" && (
        <div className="flex animate-rise items-center justify-between rounded-2xl bg-white/4 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">Bringing anyone?</div>
            <div className="text-xs text-white/45">Count your plus-ones</div>
          </div>
          <NumberStepper value={plusOnes} onChange={setPlusOnes} min={0} max={10} />
        </div>
      )}

      {/* Email */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-white/70">
          Email <span className="font-normal text-white/35">(optional)</span>
        </label>
        <input
          className="field"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-white/40">
          We&apos;ll email a confirmation via Resend.
        </p>
      </div>

      {/* Note */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-white/70">
          Add a note <span className="font-normal text-white/35">(optional)</span>
        </label>
        <textarea
          className="field min-h-[72px] resize-none"
          placeholder="Trash talk, dietary needs, what you're bringing…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          rows={3}
        />
      </div>

      <button
        className={cx(
          "btn w-full py-3.5 text-base",
          status === "no" ? "btn-ghost" : "btn-gold",
        )}
        disabled={!canSubmit}
        onClick={submit}
      >
        {saving ? (
          "Saving…"
        ) : !identity.deviceId ? (
          "Loading…"
        ) : !trimmedName ? (
          "Add your name first"
        ) : alreadyResponded ? (
          "Update RSVP"
        ) : status === "yes" ? (
          <span className="inline-flex items-center justify-center gap-1.5">
            Count me in <Icon name="beer" size={16} />
          </span>
        ) : status === "maybe" ? (
          <span className="inline-flex items-center justify-center gap-1.5">
            Pencil me in <Icon name="thinking" size={16} />
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-1.5">
            I can&apos;t make it <Icon name="sad" size={16} />
          </span>
        )}
      </button>
    </div>
  );
}

/** Compact preview avatar used by the guest list. Exported for reuse. */
export function GuestAvatar({
  emoji,
  name,
  plusOnes,
}: {
  emoji: string;
  name: string;
  plusOnes?: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3">
      <Avatar emoji={emoji} size={28} />
      <span className="max-w-[9rem] truncate text-sm font-semibold text-white/85">
        {name}
      </span>
      {!!plusOnes && plusOnes > 0 && (
        <span className="rounded-full bg-[var(--color-gold-500)]/20 px-1.5 text-xs font-bold text-[var(--color-gold-300)]">
          +{plusOnes}
        </span>
      )}
    </div>
  );
}
