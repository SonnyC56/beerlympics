"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Icon, Mascot } from "@/components/Icon";
import { cx } from "@/components/primitives";
import { colorHex } from "@/lib/teamColors";

type LineupTeam = {
  _id: string;
  order: number;
  name: string;
  emoji: string;
  color: string;
  theme?: string;
  motto?: string;
  seed?: number;
  walkoutSong?: string;
  roastUrl?: string | null;
};

type Ceremony = {
  eventName: string;
  eventStatus: string;
  stage: "idle" | "parade" | "anthem" | "torch" | "live";
  activeIndex: number;
  total: number;
  lineup: LineupTeam[];
} | null;

export default function ParadeTvPage() {
  const data = useQuery(api.ceremony.get, {}) as Ceremony | undefined;

  if (data === undefined) {
    return (
      <Stage>
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-[var(--color-gold-500)]" />
      </Stage>
    );
  }
  if (data === null) {
    return (
      <Stage>
        <div className="text-center font-display text-[4vh] text-white/60">
          No event yet.
        </div>
      </Stage>
    );
  }

  if (data.stage === "parade") {
    const team = data.lineup[data.activeIndex] ?? data.lineup[0];
    if (!team) return <Standby name={data.eventName} note="Add teams to start the parade." />;
    return <ParadeReveal team={team} index={data.activeIndex} total={data.total} />;
  }
  if (data.stage === "anthem") return <AnthemWall name={data.eventName} lineup={data.lineup} />;
  if (data.stage === "torch") return <TorchScreen lit={false} />;
  if (data.stage === "live") return <TorchScreen lit />;

  return <Standby name={data.eventName} note="Waiting for the host to begin." />;
}

// ── Shells ───────────────────────────────────────────────────────────────────
function Stage({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--color-ink-950)] text-white",
        className,
      )}
      style={style}
    >
      <div className="stadium-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
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

function Standby({ name, note }: { name: string; note: string }) {
  return (
    <Stage>
      <div className="relative flex flex-col items-center gap-[3vh] text-center">
        <div className="animate-float text-[var(--color-gold-400)]">
          <Icon name="flag" size={120} className="h-[16vh] w-[16vh]" />
        </div>
        <div className="text-[2.2vh] font-bold uppercase tracking-[0.4em] text-[var(--color-gold-300)]">
          Opening Ceremony
        </div>
        <h1 className="font-display text-[8vh] leading-[0.95] text-medal">{name}</h1>
        <div className="flex items-center gap-2 text-[2.4vh] text-white/45">
          <span className="live-dot" /> {note}
        </div>
      </div>
    </Stage>
  );
}

// ── Parade reveal — one team takes over the screen ───────────────────────────
function ParadeReveal({
  team,
  index,
  total,
}: {
  team: LineupTeam;
  index: number;
  total: number;
}) {
  const hex = colorHex(team.color);
  const champ = team.seed === 1;
  // Deterministic positions for the "raining mascots" backdrop.
  const drops = Array.from({ length: 9 }, (_, i) => ({
    left: `${(i * 37 + 11) % 96}%`,
    delay: `${(i * 0.45) % 3.2}s`,
    dur: `${5 + (i % 4)}s`,
    size: 30 + (i % 3) * 18,
    op: 0.07 + (i % 3) * 0.04,
  }));

  return (
    <Stage
      key={team._id}
      style={{
        background: `radial-gradient(120vh 90vh at 50% 18%, ${hex}3a, transparent 70%), radial-gradient(80vh 60vh at 50% 120%, ${hex}26, transparent 70%)`,
      }}
    >
      {/* color wash + raining mascots */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {drops.map((d, i) => (
          <div
            key={i}
            className="absolute top-[-12vh] animate-mascot-fall"
            style={{
              left: d.left,
              animationDelay: d.delay,
              animationDuration: d.dur,
              color: hex,
              opacity: d.op,
            }}
          >
            <Mascot name={team.emoji} size={d.size} />
          </div>
        ))}
      </div>

      <div className="relative flex w-full max-w-[88vw] flex-col items-center text-center animate-rise">
        <div className="text-[2vh] font-bold uppercase tracking-[0.4em] text-white/55">
          {champ ? "Defending Champions" : `Team ${index + 1} of ${total}`}
          {champ && <span className="ml-2 text-[var(--color-gold-300)]">·</span>}
        </div>

        {/* roast clip if present, else a giant mascot */}
        {team.roastUrl ? (
          <video
            src={team.roastUrl}
            autoPlay
            muted
            loop
            playsInline
            className="mt-[2vh] max-h-[34vh] rounded-3xl border-2 object-contain shadow-2xl"
            style={{ borderColor: `${hex}88`, boxShadow: `0 0 60px ${hex}55` }}
          />
        ) : (
          <div className="mt-[1vh] animate-float" style={{ color: hex }}>
            <Mascot name={team.emoji} size={180} className="h-[24vh] w-[24vh]" />
          </div>
        )}

        <h1
          className="mt-[2.5vh] font-display leading-[0.9] tracking-wide"
          style={{
            color: hex,
            fontSize: champ ? "13vh" : "11vh",
            textShadow: `0 0 50px ${hex}77`,
          }}
        >
          {team.name}
        </h1>

        {(team.theme || team.motto) && (
          <div className="mt-[1.5vh] text-[3vh] italic text-white/70">
            {team.motto ? `“${team.motto}”` : team.theme}
          </div>
        )}

        {team.walkoutSong ? (
          <div
            className="mt-[3vh] inline-flex items-center gap-3 rounded-full border px-[2.2vw] py-[1.4vh] text-[3vh] font-bold"
            style={{ borderColor: `${hex}66`, background: `${hex}1f`, color: hex }}
          >
            <span className="animate-pulse">
              <Icon name="mic" size={30} className="h-[3.4vh] w-[3.4vh]" />
            </span>
            Walking out to <span className="text-white">{team.walkoutSong}</span>
          </div>
        ) : (
          <div className="mt-[3vh] inline-flex items-center gap-2 text-[2.4vh] text-white/40">
            <Icon name="mic" size={22} /> Cue their walk-out song!
          </div>
        )}
      </div>
    </Stage>
  );
}

// ── Anthem wall — every flag, all at once ────────────────────────────────────
function AnthemWall({ name, lineup }: { name: string; lineup: LineupTeam[] }) {
  return (
    <Stage>
      <div className="relative flex w-full flex-col items-center px-[4vw]">
        <div className="text-[2.2vh] font-bold uppercase tracking-[0.4em] text-[var(--color-gold-300)]">
          {name}
        </div>
        <h1 className="mt-[1vh] flex items-center gap-3 font-display text-[7vh] leading-none text-medal">
          <Icon name="mic" size={56} className="h-[6vh] w-[6vh]" /> National Anthem
        </h1>
        <p className="mt-[1vh] text-[2.6vh] text-white/55">Hats off. Hand on heart.</p>

        <div
          className="mt-[4vh] grid w-full gap-[1.6vw]"
          style={{
            gridTemplateColumns: `repeat(${Math.min(Math.max(lineup.length, 1), 6)}, minmax(0, 1fr))`,
          }}
        >
          {lineup.map((t, i) => {
            const hex = colorHex(t.color);
            return (
              <div
                key={t._id}
                className="flex flex-col items-center gap-[1vh] rounded-3xl border p-[1.6vh] animate-rise"
                style={{
                  borderColor: `${hex}55`,
                  background: `linear-gradient(180deg, ${hex}24, transparent)`,
                  animationDelay: `${Math.min(i * 90, 700)}ms`,
                }}
              >
                <div className="animate-float" style={{ color: hex }}>
                  <Mascot name={t.emoji} size={64} className="h-[8vh] w-[8vh]" />
                </div>
                <div
                  className="truncate text-center font-display text-[2.6vh] leading-tight"
                  style={{ color: hex }}
                >
                  {t.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
}

// ── Torch finale ─────────────────────────────────────────────────────────────
function TorchScreen({ lit }: { lit: boolean }) {
  return (
    <Stage
      style={
        lit
          ? {
              background:
                "radial-gradient(110vh 80vh at 50% 30%, #f7b73340, transparent 70%), radial-gradient(70vh 60vh at 50% 0%, #ff6a0033, transparent 70%)",
            }
          : undefined
      }
    >
      <div className="relative flex flex-col items-center text-center">
        <Torch lit={lit} />
        {lit ? (
          <>
            <h1 className="mt-[3vh] font-display text-[10vh] leading-none text-medal animate-pop">
              Let the Games Begin
            </h1>
            <div className="mt-[2vh] inline-flex items-center gap-2 rounded-full bg-[var(--color-live)]/15 px-[2vw] py-[1.2vh] text-[2.8vh] font-bold text-[var(--color-live)]">
              <span className="live-dot" /> The Beer Olympics are LIVE
            </div>
            <Link
              href="/scoreboard/tv"
              className="mt-[3vh] inline-flex items-center gap-2 text-[2vh] font-semibold uppercase tracking-widest text-white/45 transition hover:text-white/80"
            >
              Go to the scoreboard <Icon name="arrowRight" size={20} />
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-[3vh] font-display text-[8vh] leading-none text-white/85">
              Light the Torch
            </h1>
            <p className="mt-[1.5vh] text-[2.8vh] text-white/45">
              The host lights it to start the games.
            </p>
          </>
        )}
      </div>
    </Stage>
  );
}

/** A custom SVG torch with an animated flame (no emoji). */
function Torch({ lit }: { lit: boolean }) {
  return (
    <div className="relative" style={{ width: "26vh", height: "40vh" }}>
      <svg viewBox="0 0 120 200" className="h-full w-full" aria-hidden>
        {/* handle */}
        <rect x="54" y="92" width="12" height="92" rx="6" fill="#3a2a14" stroke="#caa24a" strokeWidth="2" />
        {/* bowl */}
        <path d="M36 92 L84 92 L74 116 L46 116 Z" fill="#1a1205" stroke="#f7b733" strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="60" cy="92" rx="24" ry="6" fill="#0c0a14" stroke="#f7b733" strokeWidth="3" />
        {lit && (
          <g className="origin-center" style={{ transformBox: "fill-box" }}>
            {/* flame */}
            <path
              className="animate-flame"
              d="M60 18 C72 40 86 50 80 74 C78 86 70 92 60 92 C50 92 42 86 40 74 C34 50 48 40 60 18 Z"
              fill="url(#flameGrad)"
            />
            <path
              className="animate-flame-inner"
              d="M60 40 C68 54 74 60 70 76 C68 86 64 90 60 90 C56 90 52 86 50 76 C46 60 52 54 60 40 Z"
              fill="#ffe27a"
            />
          </g>
        )}
        <defs>
          <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd24d" />
            <stop offset="55%" stopColor="#ff8a1e" />
            <stop offset="100%" stopColor="#ff3d2e" />
          </linearGradient>
        </defs>
      </svg>
      {lit && (
        <div
          className="pointer-events-none absolute left-1/2 top-[8%] h-[30vh] w-[30vh] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #ff8a1e66, transparent 70%)" }}
          aria-hidden
        />
      )}
    </div>
  );
}
