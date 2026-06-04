"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import { EmptyState, Spinner } from "@/components/primitives";
import { Icon, Mascot, type IconName } from "@/components/Icon";
import { formatEventDate } from "@/lib/format";
import { RsvpForm, GuestAvatar } from "@/components/RsvpForm";

type Guest = {
  _id: Id<"players">;
  name: string;
  emoji: string;
  status: "yes" | "no" | "maybe";
  plusOnes: number;
  note?: string;
  teamId?: Id<"teams">;
};

export default function RsvpPage() {
  const identity = useIdentity();
  const event = useQuery(api.events.get, {});
  const guests = useQuery(api.rsvp.guests, {}) as Guest[] | undefined;
  const mine = useQuery(
    api.rsvp.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  );

  if (event === undefined) return <Spinner label="Loading the invite…" />;

  if (event === null) {
    return (
      <div className="py-6">
        <EmptyState
          icon="calendar"
          title="No event yet"
          subtitle="The host hasn't set up the Beerlympics. Check back soon — or head home to start one."
          action={
            <Link href="/" className="btn btn-gold">
              Go home
            </Link>
          }
        />
      </div>
    );
  }

  // mine is undefined while loading, null if not yet RSVP'd.
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
      <EventHero event={event} />

      {/* Only mount the form once we know the caller's existing RSVP, so it
          pre-fills correctly instead of flashing an empty state. */}
      {existing === undefined ? (
        <div className="panel p-6">
          <Spinner label="Checking your RSVP…" />
        </div>
      ) : (
        <RsvpForm existing={existing} />
      )}

      <GuestList guests={guests} />
    </div>
  );
}

type EventDoc = {
  name: string;
  tagline?: string;
  dateIso: string;
  startTime?: string;
  location?: string;
  locationUrl?: string;
  coverEmoji: string;
  status: "draft" | "rsvp" | "live" | "finished";
};

function EventHero({ event }: { event: EventDoc }) {
  return (
    <section className="panel stadium-grid relative overflow-hidden p-6 text-center">
      <div className="pointer-events-none absolute -right-8 -top-10 opacity-10">
        <Mascot name={event.coverEmoji} size={120} />
      </div>
      <div className="relative">
        <span className="chip mx-auto mb-3 inline-flex items-center gap-1.5 text-[var(--color-gold-300)]">
          {event.status === "live" ? (
            <>
              <Icon name="live" size={13} /> Happening now
            </>
          ) : event.status === "finished" ? (
            <>
              <Icon name="trophy" size={13} /> The games are over
            </>
          ) : (
            <>
              <Icon name="ticket" size={13} /> You&apos;re invited
            </>
          )}
        </span>
        <div className="flex justify-center text-medal">
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
  );
}

function GuestList({ guests }: { guests: Guest[] | undefined }) {
  if (guests === undefined) {
    return (
      <section className="panel p-5">
        <Spinner label="Loading the guest list…" />
      </section>
    );
  }

  const going = guests.filter((g) => g.status === "yes");
  const maybe = guests.filter((g) => g.status === "maybe");
  const out = guests.filter((g) => g.status === "no");
  const headcount = going.reduce((n, g) => n + 1 + (g.plusOnes || 0), 0);

  if (guests.length === 0) {
    return (
      <section className="panel p-5">
        <h2 className="mb-1 flex items-center gap-2 font-display text-xl">
          <Icon name="beers" size={20} /> The Guest List
        </h2>
        <EmptyState
          icon="eye"
          title="Be the first to RSVP"
          subtitle="No one's responded yet. Lock in your spot above and start the hype."
        />
      </section>
    );
  }

  return (
    <section className="panel space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Icon name="beers" size={20} /> The Guest List
        </h2>
        <span className="chip text-[var(--color-gold-300)]">
          {headcount} coming
        </span>
      </div>

      <GuestGroup
        icon="handRaise"
        title="Going"
        accent="var(--color-win)"
        guests={going}
        empty="No yeses yet — set the pace."
        showPlusOnes
      />
      {maybe.length > 0 && (
        <GuestGroup
          icon="thinking"
          title="Maybe"
          accent="var(--color-gold-400)"
          guests={maybe}
          empty=""
        />
      )}
      {out.length > 0 && (
        <GuestGroup
          icon="sad"
          title="Can't make it"
          accent="var(--color-loss)"
          guests={out}
          empty=""
          muted
        />
      )}
    </section>
  );
}

function GuestGroup({
  icon,
  title,
  accent,
  guests,
  empty,
  showPlusOnes,
  muted,
}: {
  icon: IconName;
  title: string;
  accent: string;
  guests: Guest[];
  empty: string;
  showPlusOnes?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: accent }}>
          <Icon name={icon} size={15} /> {title}
        </span>
        <span className="font-display text-sm text-white/40">{guests.length}</span>
      </div>
      {guests.length === 0 ? (
        empty ? (
          <p className="text-xs text-white/35">{empty}</p>
        ) : null
      ) : (
        <div className={muted ? "flex flex-wrap gap-2 opacity-60" : "flex flex-wrap gap-2"}>
          {guests.map((g) => (
            <GuestAvatar
              key={g._id}
              emoji={g.emoji}
              name={g.name}
              plusOnes={showPlusOnes ? g.plusOnes : 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
