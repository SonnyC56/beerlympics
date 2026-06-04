"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  EmptyState,
  Spinner,
  cx,
  useNow,
} from "@/components/primitives";
import { Leaderboard, Podium, type StandingTeam } from "@/components/Leaderboard";
import { Icon } from "@/components/Icon";
import { GameArt } from "@/components/gameArt";
import { activityIcon, categoryLabel, timeAgo } from "@/lib/format";

type GameLite = {
  _id: string;
  name: string;
  emoji: string;
  art?: string;
  category: string;
  status: "scheduled" | "active" | "completed" | "locked";
};

type FeedItem = {
  _id: string;
  kind: string;
  message: string;
  emoji?: string;
  createdAt: number;
};

export default function ScoreboardPage() {
  const event = useQuery(api.events.get, {});
  const standings = useQuery(api.scoring.standings, {});
  const feed = useQuery(api.activity.feed, { limit: 16 });
  const now = useNow(1000);

  if (event === undefined || standings === undefined) {
    return <Spinner label="Tallying the scores…" />;
  }

  if (!event) {
    return (
      <EmptyState
        icon="stadium"
        title="No games yet"
        subtitle="The scoreboard lights up once the Beerlympics is set up."
        action={
          <Link href="/" className="btn btn-gold">
            Go home
          </Link>
        }
      />
    );
  }

  const teams = (standings.teams ?? []) as StandingTeam[];
  const games = (standings.games ?? []) as GameLite[];
  const finished = event.status === "finished";
  const live = event.status === "live";

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="panel stadium-grid relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-6 -top-6 opacity-10">
          <Icon name="trophy" size={110} />
        </div>
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              {live ? (
                <>
                  <span className="live-dot" />
                  <span className="text-[var(--color-live)]">Live scoreboard</span>
                </>
              ) : finished ? (
                <span className="text-[var(--color-gold-300)]">Final results</span>
              ) : (
                <span className="text-white/45">Scoreboard</span>
              )}
            </div>
            <h1 className="mt-1 font-display text-4xl leading-none text-medal">
              {finished ? "Champions" : "Leaderboard"}
            </h1>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            <Link
              href="/scoreboard/tv"
              className="btn btn-ghost inline-flex items-center gap-1.5 px-3.5 py-2 text-sm"
              title="Big-screen scoreboard"
            >
              <Icon name="tv" size={16} /> TV scoreboard
            </Link>
            <Link
              href="/scoreboard/tv/reel"
              className="btn btn-ghost inline-flex items-center gap-1.5 px-3.5 py-2 text-sm"
              title="Big-screen photo slideshow"
            >
              <Icon name="film" size={16} /> Photo reel
            </Link>
          </div>
        </div>

        {/* Podium when finished */}
        {finished && teams.length > 0 && (
          <div className="relative mt-6">
            <Podium teams={teams} />
          </div>
        )}
      </section>

      {/* Game legend */}
      {games.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {games.map((g) => (
            <span
              key={g._id}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                g.status === "active"
                  ? "border-[var(--color-live)]/50 bg-[var(--color-live)]/10 text-[var(--color-live)]"
                  : g.status === "completed"
                    ? "border-[var(--color-win)]/40 bg-[var(--color-win)]/10 text-[var(--color-win)]"
                    : "border-white/10 bg-white/4 text-white/55",
              )}
              title={`${g.name} - ${categoryLabel(g.category)}`}
            >
              <GameArt artKey={g.art} size={14} />
              <span className="max-w-[7.5rem] truncate">{g.name}</span>
              {g.status === "active" && <span className="live-dot" />}
              {g.status === "completed" && <Icon name="check" size={14} />}
            </span>
          ))}
        </section>
      )}

      {/* Leaderboard */}
      <section>
        {teams.length > 0 ? (
          <Leaderboard teams={teams} />
        ) : (
          <div className="panel p-2">
            <EmptyState
              icon="chart"
              title="No scores on the board"
              subtitle="Once teams start winning matches, points roll in here automatically."
            />
          </div>
        )}
      </section>

      {/* Activity ticker */}
      <section className="panel p-5">
        <div className="mb-3 flex items-center gap-2">
          {live && <span className="live-dot" />}
          <h2 className="flex items-center gap-2 font-display text-xl">
            <Icon name="megaphone" size={20} /> The Feed
          </h2>
        </div>
        {feed === undefined ? (
          <Spinner />
        ) : feed.length > 0 ? (
          <ul className="space-y-2.5">
            {(feed as FeedItem[]).map((a) => (
              <li key={a._id} className="flex items-start gap-3 text-sm animate-rise">
                <span className="leading-tight text-white/80">
                  <Icon name={activityIcon(a.kind)} size={18} />
                </span>
                <div className="flex-1">
                  <span className="text-white/85">{a.message}</span>
                  <span className="ml-2 whitespace-nowrap text-xs text-white/35">
                    {timeAgo(a.createdAt, now)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/40">
            Quiet for now — the feed fills up as matches finish.
          </p>
        )}
      </section>
    </div>
  );
}
