"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cx, useNow } from "@/components/primitives";
import { colorHex } from "@/lib/teamColors";
import type { StandingTeam } from "@/components/Leaderboard";
import { formatClock, placeMedal } from "@/lib/format";

type Phase = {
  _id: string;
  index: number;
  name: string;
  kind: "qualifier" | "knockout" | "semifinal" | "final";
  status: "locked" | "active" | "complete";
};

type LiveMatch = {
  _id: string;
  label?: string;
  teams: { _id: string; name: string; emoji: string; color: string }[];
  gameName?: string;
  gameEmoji?: string;
  stationName?: string;
};

export default function ScoreboardTvPage() {
  const event = useQuery(api.events.get, {});
  const standings = useQuery(api.scoring.standings, {});
  const phases = useQuery(api.phases.list, {});
  const live = useQuery(api.matches.live, {});
  const now = useNow(1000);

  const teams = ((standings?.teams ?? []) as StandingTeam[]).slice(0, 8);
  const leader = teams[0]?.total ?? 0;
  const currentPhase = (phases as Phase[] | undefined)?.find(
    (p) => p.index === event?.currentPhaseIndex,
  );
  const finished = event?.status === "finished";

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--color-ink-950)] text-white">
      {/* Ambient stadium glow */}
      <div
        className="stadium-grid pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[60vh] w-[60vw] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #f7b73355, transparent 70%)" }}
        aria-hidden
      />

      {/* ── Header ── */}
      <header className="relative flex items-center justify-between gap-6 px-[3vw] pt-[3vh]">
        <div className="flex items-center gap-4">
          <span className="text-[7vh] leading-none">{event?.coverEmoji ?? "🏅"}</span>
          <div>
            <h1 className="font-display text-[6vh] leading-[0.95] text-medal">
              {event?.name ?? "Beerlympics"}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-[2.1vh] font-bold uppercase tracking-[0.2em]">
              {finished ? (
                <span className="text-[var(--color-gold-300)]">🏆 Final Standings</span>
              ) : (
                <span className="inline-flex items-center gap-2 text-[var(--color-live)]">
                  <span className="live-dot" /> Live
                </span>
              )}
              {currentPhase && (
                <span className="text-white/55">
                  {currentPhase.kind === "final" ? "🏁 " : "› "}
                  {currentPhase.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-[4vh] tabular-nums leading-none text-white/85">
            {formatClock(now)}
          </div>
          <Link
            href="/scoreboard"
            className="mt-2 inline-block text-[1.7vh] font-semibold uppercase tracking-widest text-white/35 transition hover:text-white/70"
          >
            ← Exit TV mode
          </Link>
        </div>
      </header>

      {/* ── Leaderboard ── */}
      <main className="relative flex flex-1 flex-col justify-center px-[3vw] py-[2vh]">
        {teams.length > 0 ? (
          <ol className="flex flex-col gap-[1.2vh]">
            {teams.map((t, i) => (
              <TvRow key={t._id} team={t} leader={leader} index={i} />
            ))}
          </ol>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="text-[12vh] animate-float">🍺</div>
            <div className="font-display text-[5vh] text-white/70">
              Waiting for the first points
            </div>
            <div className="text-[2.4vh] text-white/40">
              Scores appear here the moment a match wraps.
            </div>
          </div>
        )}
      </main>

      {/* ── Now-playing marquee ── */}
      <NowPlaying matches={(live as LiveMatch[] | undefined) ?? undefined} />
    </div>
  );
}

function TvRow({
  team,
  leader,
  index,
}: {
  team: StandingTeam;
  leader: number;
  index: number;
}) {
  const hex = colorHex(team.color);
  const medal = placeMedal(team.rank);
  const pct =
    leader <= 0
      ? team.total > 0
        ? 100
        : 4
      : Math.max(team.total > 0 ? 8 : 4, Math.round((team.total / leader) * 100));
  const champ = team.rank === 1;

  return (
    <li
      className="flex items-center gap-[2vw] animate-rise"
      style={{ animationDelay: `${Math.min(index * 70, 560)}ms` }}
    >
      {/* Rank */}
      <div className="flex w-[7vh] shrink-0 items-center justify-center">
        {medal ? (
          <span className="text-[5.5vh] leading-none">{medal}</span>
        ) : (
          <span className="font-display text-[4.5vh] tabular-nums leading-none text-white/30">
            {team.rank}
          </span>
        )}
      </div>

      {/* Name + bar */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-[4vh] leading-none">{team.emoji}</span>
            <span
              className={cx(
                "min-w-0 truncate font-display tracking-wide",
                champ ? "text-[5vh]" : "text-[4vh]",
              )}
              style={{ color: champ ? hex : undefined }}
            >
              {team.name}
            </span>
          </div>
          <span
            className="shrink-0 font-display text-[5.5vh] tabular-nums leading-none"
            style={{ color: hex, textShadow: `0 0 24px ${hex}66` }}
          >
            {team.total}
          </span>
        </div>
        <div className="mt-[0.8vh] h-[1.6vh] w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${hex}99, ${hex})`,
              boxShadow: `0 0 22px ${hex}88`,
            }}
          />
        </div>
      </div>
    </li>
  );
}

function NowPlaying({ matches }: { matches: LiveMatch[] | undefined }) {
  const active = matches?.filter((m) => m.teams.length > 0) ?? [];

  return (
    <footer className="relative border-t border-white/10 bg-black/40 backdrop-blur-md">
      <div className="flex items-stretch">
        {/* Label */}
        <div className="flex shrink-0 items-center gap-3 bg-[var(--color-live)]/15 px-[2.5vw] py-[2vh]">
          <span className="live-dot" />
          <span className="font-display text-[2.6vh] tracking-widest text-[var(--color-live)]">
            Now Playing
          </span>
        </div>

        {/* Marquee */}
        <div className="no-scrollbar relative flex-1 overflow-hidden">
          {active.length > 0 ? (
            <div
              className="flex w-max items-center gap-[3vw] whitespace-nowrap py-[2vh] pl-[3vw]"
              style={{ animation: "marquee 26s linear infinite" }}
            >
              {/* Duplicate the list so the marquee loops seamlessly. */}
              {[...active, ...active].map((m, i) => (
                <NowPlayingItem key={`${m._id}-${i}`} match={m} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center py-[2vh] pl-[3vw] text-[2.4vh] text-white/40">
              No matches on the field right now — next round loading up. 🍻
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

function NowPlayingItem({ match }: { match: LiveMatch }) {
  return (
    <span className="inline-flex items-center gap-[1.4vw] text-[2.6vh]">
      <span className="font-bold text-white/85">
        {match.gameEmoji ?? "🎯"} {match.gameName ?? "Match"}
      </span>
      <span className="flex items-center gap-[0.8vw]">
        {match.teams.map((t, idx) => (
          <span key={t._id} className="flex items-center gap-[0.8vw]">
            {idx > 0 && <span className="text-white/30">vs</span>}
            <span
              className="font-semibold"
              style={{ color: colorHex(t.color) }}
            >
              {t.emoji} {t.name}
            </span>
          </span>
        ))}
      </span>
      {match.stationName && (
        <span className="text-white/35">@ {match.stationName}</span>
      )}
      <span className="text-white/15">•</span>
    </span>
  );
}
