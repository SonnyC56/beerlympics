"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import { EmptyState, Spinner } from "@/components/primitives";
import { Icon, Mascot } from "@/components/Icon";
import { formatEventDate } from "@/lib/format";
import { RsvpForm } from "@/components/RsvpForm";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const identity = useIdentity();

  const event = useQuery(api.events.get, {});
  const invite = useQuery(api.invites.peek, code ? { code } : "skip");
  const mine = useQuery(
    api.rsvp.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  );

  // Record the click exactly once per mount (best-effort attribution).
  const claim = useMutation(api.invites.claim);
  const claimedRef = useRef(false);
  useEffect(() => {
    if (!code || claimedRef.current) return;
    claimedRef.current = true;
    void claim({ code }).catch(() => {
      /* attribution is best-effort; never block the page */
    });
  }, [code, claim]);

  if (event === undefined || invite === undefined) {
    return <Spinner label="Opening your invite…" />;
  }

  if (event === null) {
    return (
      <div className="py-6">
        <EmptyState
          icon="calendar"
          title="Nothing here yet"
          subtitle="This invite link is valid, but the host hasn't set up the games yet. Check back soon!"
          action={
            <Link href="/" className="btn btn-gold">
              Go home
            </Link>
          }
        />
      </div>
    );
  }

  const recipientName = invite?.recipientName?.trim() || undefined;
  const hostNote = invite?.note?.trim() || undefined;

  const existing =
    mine === undefined
      ? undefined
      : mine?.player
        ? {
            status: mine.player.status,
            plusOnes: mine.player.plusOnes,
            note: mine.player.note,
            emoji: mine.player.emoji,
            name: mine.player.name,
            team: mine.team
              ? {
                  emoji: mine.team.emoji,
                  name: mine.team.name,
                  color: mine.team.color,
                }
              : null,
          }
        : null;

  return (
    <div className="space-y-5">
      {/* Personalized hero */}
      <section className="panel stadium-grid relative overflow-hidden p-6 text-center">
        <div className="pointer-events-none absolute -right-8 -top-10 opacity-10">
          <Mascot name={event.coverEmoji} size={120} />
        </div>
        <div className="relative">
          <p className="inline-flex items-center justify-center gap-1.5 font-display text-xl tracking-wide text-[var(--color-gold-300)]">
            {recipientName ? <>Hey {recipientName}</> : <>Hey there</>}
            <Icon name="wave" size={18} />
          </p>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-white/45">
            You&apos;re invited to
          </p>

          <div className="mt-3 flex justify-center text-medal">
            <Mascot name={event.coverEmoji} size={48} />
          </div>
          <h1 className="mt-2 font-display text-4xl leading-none text-medal">
            {event.name}
          </h1>
          {event.tagline && (
            <p className="mt-2 text-sm text-white/60">{event.tagline}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
            <span className="chip inline-flex items-center gap-1.5">
              <Icon name="calendar" size={13} /> {formatEventDate(event.dateIso)}
            </span>
            {event.startTime && (
              <span className="chip inline-flex items-center gap-1.5">
                <Icon name="clock" size={13} /> {event.startTime}
              </span>
            )}
            {event.location &&
              (event.locationUrl ? (
                <a
                  href={event.locationUrl}
                  className="chip inline-flex items-center gap-1.5 hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="pin" size={13} /> {event.location}
                </a>
              ) : (
                <span className="chip inline-flex items-center gap-1.5">
                  <Icon name="pin" size={13} /> {event.location}
                </span>
              ))}
          </div>
        </div>
      </section>

      {/* Host's personal note */}
      {hostNote && (
        <blockquote className="panel-tight relative p-5">
          <span className="absolute -top-2 left-4 font-display text-4xl text-[var(--color-gold-500)]/40">
            &ldquo;
          </span>
          <p className="pl-4 text-sm italic text-white/80">{hostNote}</p>
          <footer className="mt-2 pl-4 text-xs uppercase tracking-widest text-white/40">
            — a note from your host
          </footer>
        </blockquote>
      )}

      {/* RSVP — sign in first (returning right back here), then the prefilled form */}
      {!identity.isAuthenticated ? (
        <div className="panel p-6 text-center">
          <div className="flex justify-center text-medal">
            <Icon name="beer" size={40} />
          </div>
          <h2 className="mt-2 font-display text-2xl text-white">
            {recipientName ? `Ready, ${recipientName}?` : "Ready to lock it in?"}
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-white/60">
            Sign in with Google to RSVP and join the games — one tap, and it brings you
            right back to this invite.
          </p>
          <button
            className="btn mt-4 w-full bg-white py-3.5 font-bold text-[#1a1205] hover:brightness-95"
            onClick={() => void identity.signInGoogle(`/i/${code}`)}
          >
            <span className="text-base font-black text-[#4285F4]">G</span> Sign in with
            Google to RSVP
          </button>
        </div>
      ) : existing === undefined ? (
        <div className="panel p-6">
          <Spinner label="Checking your RSVP…" />
        </div>
      ) : (
        <RsvpForm
          recipientName={recipientName}
          invitedViaCode={code}
          existing={existing}
          compact
        />
      )}

      <p className="text-center text-xs text-white/35">
        Already part of the crew?{" "}
        <Link href="/" className="text-[var(--color-gold-400)] underline">
          Open Beerlympics
        </Link>
      </p>
    </div>
  );
}
