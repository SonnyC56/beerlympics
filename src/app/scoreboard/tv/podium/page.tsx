"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Icon, Mascot, Medal } from "@/components/Icon";
import { colorHex } from "@/lib/teamColors";

type PodiumTeam = {
  _id: string;
  rank: number;
  name: string;
  color: string;
  emoji: string;
  total: number;
  flagUrl: string | null;
};
type Podium = {
  eventName: string;
  status: string;
  revealedAt: number | null;
  teams: PodiumTeam[];
} | null;

type PollWinner = {
  winner: {
    name: string;
    emoji: string;
    teamName: string | null;
    teamColor: string | null;
    votes: number;
  } | null;
} | null;

// Deterministic confetti so the SSR/client markup matches (no Math.random).
const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: `${(i * 53 + 7) % 100}%`,
  delay: `${((i * 0.37) % 3).toFixed(2)}s`,
  dur: `${3 + (i % 5) * 0.7}s`,
  hue: ["#f7b733", "#ffd24d", "#2ad4ff", "#b388ff", "#ff7a59", "#fff0c2"][i % 6],
  size: 8 + (i % 4) * 4,
}));

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--color-ink-950)] text-white">
      <div className="stadium-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[70vh] w-[70vw] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #f7b73366, transparent 70%)" }}
        aria-hidden
      />
      {children}
      <Link
        href="/scoreboard"
        className="absolute bottom-[3vh] right-[3vw] inline-flex items-center gap-1.5 text-[1.6vh] font-semibold uppercase tracking-widest text-white/25 transition hover:text-white/60"
      >
        <Icon name="arrowLeft" size={16} /> Exit
      </Link>
    </div>
  );
}

export default function PodiumTvPage() {
  const data = useQuery(api.closing.podium, {}) as Podium | undefined;
  const poll = useQuery(api.poll.state, {}) as PollWinner | undefined;

  if (data === undefined) {
    return (
      <Stage>
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-[var(--color-gold-500)]" />
      </Stage>
    );
  }
  if (data === null || data.revealedAt === null) {
    return (
      <Stage>
        <div className="relative flex flex-col items-center gap-[3vh] text-center">
          <div className="animate-float text-[var(--color-gold-400)]">
            <Icon name="trophy" size={120} className="h-[16vh] w-[16vh]" />
          </div>
          <div className="text-[2.2vh] font-bold uppercase tracking-[0.4em] text-[var(--color-gold-300)]">
            Closing Ceremony
          </div>
          <h1 className="font-display text-[7vh] leading-[0.95] text-medal">
            {data?.eventName ?? "Beerlympics"}
          </h1>
          <div className="flex items-center gap-2 text-[2.4vh] text-white/45">
            <span className="live-dot" /> Champions revealed any moment…
          </div>
        </div>
      </Stage>
    );
  }

  // Center gold, left silver, right bronze — by array order (already rank-sorted).
  const gold = data.teams[0];
  const silver = data.teams[1];
  const bronze = data.teams[2];
  const winner = poll?.winner ?? null;

  return (
    <Stage>
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="animate-confetti absolute top-0 rounded-sm"
            style={{
              left: c.left,
              width: c.size,
              height: c.size * 1.6,
              background: c.hue,
              animationDelay: c.delay,
              animationDuration: c.dur,
            }}
          />
        ))}
      </div>

      <div className="relative flex w-full flex-col items-center px-[4vw]">
        <div className="text-[2.2vh] font-bold uppercase tracking-[0.45em] text-[var(--color-gold-300)] animate-podium-rise">
          {data.eventName} — Champions
        </div>

        <div className="mt-[5vh] flex w-full items-end justify-center gap-[2vw]">
          {silver && <Pedestal team={silver} place={2} height="30vh" delay="1.2s" />}
          {gold && <Pedestal team={gold} place={1} height="42vh" delay="2.6s" />}
          {bronze && <Pedestal team={bronze} place={3} height="22vh" delay="0s" />}
        </div>

        {winner && (
          <div
            className="mt-[5vh] flex items-center gap-4 rounded-3xl border border-white/12 bg-black/30 px-[3vw] py-[2vh] animate-podium-rise"
            style={{ animationDelay: "3.4s" }}
          >
            <div
              className="flex h-[9vh] w-[9vh] items-center justify-center rounded-2xl"
              style={{
                background: `${colorHex(winner.teamColor ?? "gold")}26`,
                border: `1px solid ${colorHex(winner.teamColor ?? "gold")}66`,
              }}
            >
              <Mascot name={winner.emoji} size={48} className="h-[6vh] w-[6vh]" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[2vh] font-bold uppercase tracking-[0.3em] text-[var(--color-gold-300)]">
                <Icon name="crown" size={22} /> Player of the Day
              </div>
              <div className="font-display text-[5vh] leading-none text-white">
                {winner.name}
              </div>
              {winner.teamName && (
                <div className="mt-1 text-[2vh] text-white/55">{winner.teamName}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Stage>
  );
}

function Pedestal({
  team,
  place,
  height,
  delay,
}: {
  team: PodiumTeam;
  place: number;
  height: string;
  delay: string;
}) {
  const hex = colorHex(team.color);
  const champ = place === 1;
  return (
    <div
      className="flex w-[26vw] max-w-[30vh] flex-col items-center animate-podium-rise"
      style={{ animationDelay: delay }}
    >
      {/* flag / mascot */}
      <div
        className="mb-[1.5vh] flex items-center justify-center overflow-hidden rounded-2xl"
        style={{
          height: champ ? "16vh" : "12vh",
          width: champ ? "20vh" : "15vh",
          background: `${hex}1f`,
          border: `2px solid ${hex}88`,
          boxShadow: `0 0 50px ${hex}55`,
        }}
      >
        {team.flagUrl ? (
          <img src={team.flagUrl} alt={`${team.name} flag`} className="h-full w-full object-cover" />
        ) : (
          <Mascot name={team.emoji} size={champ ? 110 : 80} className="h-[10vh] w-[10vh]" />
        )}
      </div>

      <Medal rank={place} size={champ ? 64 : 48} className={champ ? "h-[7vh] w-[7vh]" : "h-[5vh] w-[5vh]"} />

      <div
        className="mt-[1vh] truncate text-center font-display leading-none"
        style={{ color: hex, fontSize: champ ? "4.5vh" : "3.2vh", maxWidth: "26vw" }}
      >
        {team.name}
      </div>
      <div className="mt-[0.5vh] font-display text-[2.6vh] tabular-nums text-white/70">
        {team.total} pts
      </div>

      {/* pedestal block */}
      <div
        className="mt-[1.5vh] w-full rounded-t-2xl"
        style={{
          height,
          background: `linear-gradient(180deg, ${hex}cc, ${hex}55)`,
          boxShadow: `inset 0 2px 0 ${hex}, 0 -10px 40px -10px ${hex}88`,
        }}
      >
        <div className="flex h-full items-start justify-center pt-[1.5vh] font-display text-[6vh] text-white/85">
          {place}
        </div>
      </div>
    </div>
  );
}
