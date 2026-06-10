"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import {
  Spinner,
  TeamBadge,
  useAction,
  useNow,
} from "@/components/primitives";
import { Icon, type IconName, Mascot, Medal } from "@/components/Icon";
import { VenueMap } from "@/components/VenueMap";
import {
  activityIcon,
  countdownTo,
  formatEventDate,
  timeAgo,
} from "@/lib/format";

export default function HomePage() {
  const event = useQuery(api.events.get, {});
  if (event === undefined) return <Spinner label="Loading the games…" />;
  if (event === null) return <CreateEventCard />;
  return <EventHome />;
}

// ── No event yet -> host setup ────────────────────────────────────────────────
function CreateEventCard() {
  const identity = useIdentity();
  const create = useMutation(api.events.create);
  const run = useAction();
  const [name, setName] = useState("Beerlympics 2026");
  const [dateIso, setDateIso] = useState("2026-07-04");
  const [location, setLocation] = useState("");
  const [tagline, setTagline] = useState("The annual backyard games.");

  return (
    <div className="space-y-5 py-6">
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <div className="animate-float text-[var(--color-gold-400)]">
          <Icon name="stadium" size={48} />
        </div>
        <div className="font-display text-2xl text-white">Start your Beerlympics</div>
        <div className="max-w-xs text-sm text-white/55">
          Set up the event, then invite your crew. You'll become the host.
        </div>
      </div>
      <div className="panel space-y-4 p-5">
        <Field label="Event name">
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tagline">
          <input className="field" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input
              type="date"
              className="field"
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
            />
          </Field>
          <Field label="Location">
            <input
              className="field"
              placeholder="The Backyard"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Field>
        </div>
        {!identity.hasProfile && (
          <p className="text-xs text-[var(--color-gold-300)]">
            Tip: set your name first (top-right) so you're credited as host.
          </p>
        )}
        <button
          className="btn btn-gold w-full"
          disabled={!identity.deviceId}
          onClick={() =>
            run(
              () =>
                create({
                  deviceId: identity.deviceId!,
                  name,
                  dateIso,
                  tagline,
                  location: location || undefined,
                }),
              "Event created — you're the host!",
            )
          }
        >
          Create event
        </button>
        <p className="text-center text-xs text-white/40">
          Prefer a pre-loaded demo? Run{" "}
          <code className="text-white/60">npx convex run seed:run</code>
        </p>
      </div>
    </div>
  );
}

// ── Event home ────────────────────────────────────────────────────────────────
function EventHome() {
  const identity = useIdentity();
  const event = useQuery(api.events.get, {});
  const stats = useQuery(api.events.stats, {});
  const feed = useQuery(api.activity.feed, { limit: 12 });
  const mine = useQuery(
    api.rsvp.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : {},
  );
  const standings = useQuery(api.scoring.standings, {});
  const now = useNow(1000);

  if (!event) return <Spinner />;
  const cd = countdownTo(event.dateIso, now);
  const live = event.status === "live";
  const finished = event.status === "finished";

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="panel stadium-grid relative overflow-hidden p-6 text-center">
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
          <Mascot name={event.coverEmoji} size={120} />
        </div>
        <div className="relative">
          <div className="inline-flex justify-center text-medal">
            <Mascot name={event.coverEmoji} size={60} />
          </div>
          <h1 className="mt-2 font-display text-4xl leading-none text-medal">
            {event.name}
          </h1>
          {event.tagline && (
            <p className="mt-2 text-sm text-white/60">{event.tagline}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/70">
            <span className="chip inline-flex items-center gap-1.5">
              <Icon name="calendar" size={14} /> {formatEventDate(event.dateIso)}
            </span>
            {event.startTime && (
              <span className="chip inline-flex items-center gap-1.5">
                <Icon name="clock" size={14} /> {event.startTime}
              </span>
            )}
            {event.location && (
              <a
                href={event.locationUrl}
                className="chip inline-flex items-center gap-1.5 hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="pin" size={14} /> {event.location}
              </a>
            )}
          </div>

          {/* Countdown / status */}
          {!live && !finished && (
            <div className="mt-5">
              {cd.isPast ? (
                <div className="inline-flex items-center justify-center gap-2 font-display text-2xl text-[var(--color-gold-400)]">
                  It's go time <Icon name="beer" size={24} />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  {[
                    { v: cd.days, l: "days" },
                    { v: cd.hours, l: "hrs" },
                    { v: cd.minutes, l: "min" },
                    { v: cd.seconds, l: "sec" },
                  ].map((u) => (
                    <div
                      key={u.l}
                      className="min-w-[58px] rounded-2xl border border-white/10 bg-black/30 px-2 py-2"
                    >
                      <div className="font-display text-3xl tabular-nums text-white">
                        {String(u.v).padStart(2, "0")}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">
                        {u.l}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {live && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-live)]/15 px-4 py-2 font-bold text-[var(--color-live)]">
              <span className="live-dot" /> THE GAMES ARE LIVE
            </div>
          )}
        </div>
      </section>

      {/* Where it's going down */}
      {event.location && (
        <VenueMap
          location={event.location}
          lat={event.lat}
          lng={event.lng}
          locationUrl={event.locationUrl}
        />
      )}

      {/* Primary CTA */}
      <CtaBlock status={event.status} mine={mine} />

      {/* Games & rules quick link */}
      <Link
        href="/games"
        className="panel-tight flex items-center gap-3 p-4 transition hover:bg-white/[0.03]"
      >
        <span className="text-white"><Icon name="games" size={24} /></span>
        <div className="flex-1">
          <div className="font-bold text-white">The Games &amp; Rules</div>
          <div className="text-xs text-white/50">
            Browse every game, watch the art, and learn how each one is played.
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm text-[var(--color-gold-400)]">
          Open <Icon name="arrowRight" size={14} />
        </span>
      </Link>

      {/* Pre-game fun: odds + roast cam */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/odds"
          className="panel-tight flex flex-col gap-1 p-4 transition hover:bg-white/[0.03]"
        >
          <span className="text-[var(--color-gold-400)]"><Icon name="target" size={22} /></span>
          <div className="font-bold text-white">Opening Odds</div>
          <div className="text-xs text-white/50">
            {finished ? "See who called the podium." : "Predict the podium before kickoff."}
          </div>
        </Link>
        <Link
          href="/roast"
          className="panel-tight flex flex-col gap-1 p-4 transition hover:bg-white/[0.03]"
        >
          <span className="text-[var(--color-flame-soft)]"><Icon name="mic" size={22} /></span>
          <div className="font-bold text-white">Roast Cam</div>
          <div className="text-xs text-white/50">Record a trash-talk confessional.</div>
        </Link>
      </section>

      {/* Host: opening ceremony quick link */}
      {identity.isHost && !finished && (
        <Link
          href="/scoreboard/tv/parade"
          target="_blank"
          className="panel-tight flex items-center gap-3 p-4 transition hover:bg-white/[0.03]"
        >
          <span className="text-[var(--color-gold-400)]"><Icon name="flag" size={24} /></span>
          <div className="flex-1">
            <div className="font-bold text-white">Opening Ceremony — TV screen</div>
            <div className="text-xs text-white/50">
              Cast this to the big screen; run the parade from the Host tab.
            </div>
          </div>
          <Icon name="arrowRight" size={14} />
        </Link>
      )}

      {/* Live podium snapshot */}
      {(live || finished) && standings && standings.teams.length > 0 && (
        <section className="panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 font-display text-xl">
              <Icon name={finished ? "trophy" : "flame"} size={20} />
              {finished ? "Final Standings" : "Leaderboard"}
            </h2>
            <Link
              href="/scoreboard"
              className="inline-flex items-center gap-1 text-sm text-[var(--color-gold-400)]"
            >
              Full board <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {standings.teams.slice(0, 3).map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between rounded-2xl bg-white/4 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center font-display text-xl text-white/50">
                    {t.rank <= 3 ? <Medal rank={t.rank} size={20} /> : `#${t.rank}`}
                  </span>
                  <TeamBadge emoji={t.emoji} name={t.name} color={t.color} />
                </div>
                <span className="font-display text-xl text-[var(--color-gold-400)]">
                  {t.total}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      {stats && (
        <section className="grid grid-cols-3 gap-3">
          <Stat label="Going" value={stats.going} icon="handRaise" />
          <Stat label="Teams" value={stats.teams} icon="flag" />
          <Stat label="Headcount" value={stats.headcount} icon="beers" />
        </section>
      )}

      {/* Activity ticker */}
      <section className="panel p-5">
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-xl">
          <Icon name="megaphone" size={20} /> The Feed
        </h2>
        {feed && feed.length > 0 ? (
          <ul className="space-y-2.5">
            {feed.map((a) => (
              <li key={a._id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-white/70">
                  <Icon name={activityIcon(a.kind)} size={16} />
                </span>
                <div className="flex-1">
                  <span className="text-white/85">{a.message}</span>
                  <span className="ml-2 text-xs text-white/35">
                    {timeAgo(a.createdAt, now)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/40">
            Nothing yet — RSVP and start a team to kick things off.
          </p>
        )}
      </section>
    </div>
  );
}

type MineRsvp = {
  player: { status: "yes" | "no" | "maybe" } | null;
  team: { emoji: string; name: string; color: string } | null;
} | null;

function CtaBlock({ status, mine }: { status: string; mine: MineRsvp | undefined }) {
  if (status === "live") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Link href="/play" className="btn btn-gold inline-flex items-center justify-center gap-2">
          <Icon name="target" size={18} /> Enter the Circuit
        </Link>
        <Link href="/scoreboard" className="btn btn-ghost inline-flex items-center justify-center gap-2">
          <Icon name="trophy" size={18} /> Scoreboard
        </Link>
      </div>
    );
  }
  if (mine?.player) {
    return (
      <Link href="/rsvp" className="panel-tight flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex">
            {mine.player.status === "yes" ? (
              <Icon name="check" size={24} />
            ) : mine.player.status === "maybe" ? (
              <Icon name="thinking" size={24} />
            ) : (
              <Icon name="close" size={24} />
            )}
          </span>
          <div>
            <div className="font-bold">
              You're {mine.player.status === "yes" ? "in" : mine.player.status === "maybe" ? "a maybe" : "out"}
            </div>
            <div className="text-xs text-white/50">
              {mine.team ? (
                <TeamBadge emoji={mine.team.emoji} name={mine.team.name} color={mine.team.color} size="sm" />
              ) : (
                "No team yet — tap to pick one"
              )}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm text-[var(--color-gold-400)]">
          Edit <Icon name="arrowRight" size={14} />
        </span>
      </Link>
    );
  }
  return (
    <Link
      href="/rsvp"
      className="btn btn-gold inline-flex w-full items-center justify-center gap-2 py-4 text-lg"
    >
      <Icon name="beer" size={20} /> RSVP + Pick Your Team
    </Link>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: IconName;
}) {
  return (
    <div className="panel-tight flex flex-col items-center py-4">
      <div className="text-white/80">
        <Icon name={icon} size={20} />
      </div>
      <div className="font-display text-3xl text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-white/40">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-white/70">{label}</label>
      {children}
    </div>
  );
}
