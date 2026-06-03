"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  EmptyState,
  Spinner,
  cx,
  useAction,
  useNow,
} from "@/components/primitives";
import { countdownTo } from "@/lib/format";
import {
  CircuitBoard,
  VersusRow,
  type BoardStation,
  type UpNextMatch,
} from "@/components/CircuitBoard";
import { ResultSheet, type ResultMatch } from "@/components/ResultSheet";
import { MediaCapture } from "@/components/MediaCapture";

// ── Local types (loosely mirror the Convex query shapes) ──────────────────────
type Phase = {
  _id: Id<"phases">;
  index: number;
  name: string;
  kind: "qualifier" | "knockout" | "semifinal" | "final";
  description?: string;
  status: "locked" | "active" | "complete";
};

type GameLite = {
  _id: Id<"games">;
  name: string;
  emoji: string;
  isGated: boolean;
  gateFromPhaseIndex?: number;
  enabled?: boolean;
};

type MineMatch = {
  _id: Id<"matches">;
  label?: string;
  status: "pending" | "ready" | "queued" | "in_progress" | "completed" | "void";
  teams: { _id: Id<"teams">; name: string; emoji: string; color: string }[];
  gameName?: string;
  gameEmoji?: string;
  stationName?: string;
};

type LiveMatch = MineMatch;

export default function PlayPage() {
  const identity = useIdentity();
  const event = useQuery(api.events.get, {});
  const now = useNow(1000);

  // Result sheet state — a single sheet drives both player + host reporting.
  const [active, setActive] = useState<ResultMatch | null>(null);

  if (event === undefined) return <Spinner label="Loading the Circuit…" />;
  if (event === null) {
    return (
      <EmptyState
        emoji="🏟️"
        title="No games yet"
        subtitle="The Circuit lights up once an event is created."
        action={
          <Link href="/" className="btn btn-gold">
            Back home
          </Link>
        }
      />
    );
  }

  if (event.status !== "live") {
    return <WaitingState event={event} now={now} isHost={identity.isHost} deviceId={identity.deviceId} />;
  }

  return (
    <>
      <LiveCircuit
        event={event}
        identity={identity}
        onOpenResult={(m) => setActive(m)}
      />
      <ResultSheet
        open={active !== null}
        onClose={() => setActive(null)}
        match={active}
        deviceId={identity.deviceId}
      />
    </>
  );
}

// ── Pre-game / paused: celebratory countdown ──────────────────────────────────
function WaitingState({
  event,
  now,
  isHost,
  deviceId,
}: {
  event: { name: string; coverEmoji: string; dateIso: string; status: string };
  now: number;
  isHost: boolean;
  deviceId: string | null;
}) {
  const startPhase = useMutation(api.tournament.startPhase);
  const run = useAction();
  const finished = event.status === "finished";
  const cd = countdownTo(event.dateIso, now);

  return (
    <div className="space-y-5 py-4">
      <section className="panel stadium-grid relative overflow-hidden p-7 text-center animate-rise">
        <div className="pointer-events-none absolute -right-6 -top-6 text-[120px] opacity-10">
          {event.coverEmoji}
        </div>
        <div className="relative">
          <div className="text-6xl animate-float">{finished ? "🏆" : "🎯"}</div>
          <h1 className="mt-3 font-display text-4xl leading-none text-medal">
            {finished ? "The Games Are Done" : "The Circuit Is Warming Up"}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">
            {finished
              ? "Every match is in the books. Hit the scoreboard for the final standings."
              : "Stations are being set, brackets are being drawn. Grab a cold one — it's almost go time."}
          </p>

          {!finished && (
            <div className="mt-6">
              {cd.isPast ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-gold-500)]/15 px-5 py-3 font-display text-2xl text-[var(--color-gold-400)]">
                  🍺 It's go time
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
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/teams" className="btn btn-ghost">
          👥 Teams
        </Link>
        <Link href="/scoreboard" className="btn btn-ghost">
          🏆 Scoreboard
        </Link>
      </div>

      {isHost && !finished && (
        <div className="panel space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-gold-300)]">
            👑 Host controls
          </div>
          <p className="text-sm text-white/55">
            Ready to drop the puck? Kick off the first phase to put the event live
            and start seating matches.
          </p>
          <button
            className="btn btn-gold w-full"
            disabled={!deviceId}
            onClick={() =>
              run(
                () => startPhase({ deviceId: deviceId!, index: 0 }),
                "Game on — the Circuit is LIVE! ⚡",
              )
            }
          >
            ⚡ Start the Games
          </button>
          <Link href="/host" className="block text-center text-xs text-white/45 underline">
            Full host control room →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Live: the heart of game day ───────────────────────────────────────────────
function LiveCircuit({
  event,
  identity,
  onOpenResult,
}: {
  event: { currentPhaseIndex: number };
  identity: ReturnType<typeof useIdentity>;
  onOpenResult: (m: ResultMatch) => void;
}) {
  const phases = useQuery(api.phases.list, {}) as Phase[] | undefined;
  const games = useQuery(api.games.list, {}) as GameLite[] | undefined;
  const mine = useQuery(
    api.matches.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  ) as MineMatch[] | undefined;
  const live = useQuery(api.matches.live, {}) as LiveMatch[] | undefined;
  const board = useQuery(api.matches.board, {}) as
    | { stations: BoardStation[]; upNext: UpNextMatch[] }
    | undefined;

  const dispatch = useMutation(api.tournament.dispatch);
  const run = useAction();

  const activePhase = useMemo(
    () => phases?.find((p) => p.index === event.currentPhaseIndex) ?? null,
    [phases, event.currentPhaseIndex],
  );

  const shownGames = useMemo(
    () => (games ?? []).filter((g) => g.enabled !== false),
    [games],
  );
  const gatedGames = useMemo(
    () => shownGames.filter((g) => g.isGated),
    [shownGames],
  );

  const loading = phases === undefined || mine === undefined || live === undefined || board === undefined;

  return (
    <div className="space-y-6">
      {/* Phase banner */}
      <section className="panel stadium-grid relative overflow-hidden p-5 animate-rise">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-live)]">
              <span className="live-dot" /> Live now
            </div>
            <h1 className="mt-1 font-display text-3xl leading-none text-medal">
              {activePhase ? activePhase.name : "The Circuit"}
            </h1>
            {activePhase?.description && (
              <p className="mt-1.5 text-sm text-white/60">{activePhase.description}</p>
            )}
          </div>
          {identity.isHost && (
            <button
              className="btn btn-flame shrink-0 px-4 py-2.5 text-sm"
              disabled={!identity.deviceId}
              onClick={() =>
                run(
                  () => dispatch({ deviceId: identity.deviceId! }),
                  "Dispatched — open stations seated! ⚡",
                )
              }
              title="Seat ready matches at every open station"
            >
              ⚡ Dispatch
            </button>
          )}
        </div>

        {/* Phase pips */}
        {phases && phases.length > 0 && (
          <div className="mt-4 flex items-center gap-1.5">
            {phases.map((p) => (
              <div
                key={p._id}
                className={cx(
                  "h-1.5 flex-1 rounded-full transition",
                  p.status === "complete"
                    ? "bg-[var(--color-gold-500)]"
                    : p.status === "active"
                      ? "bg-[var(--color-live)]"
                      : "bg-white/10",
                )}
                title={p.name}
              />
            ))}
          </div>
        )}

        {/* Gated-game (Beer Die) lock status */}
        {gatedGames.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {gatedGames.map((g) => {
              const gate = g.gateFromPhaseIndex ?? Number.MAX_SAFE_INTEGER;
              const unlocked = event.currentPhaseIndex >= gate;
              return (
                <span
                  key={g._id}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold",
                    unlocked
                      ? "border-[var(--color-win)]/40 bg-[var(--color-win)]/10 text-[var(--color-win)]"
                      : "border-white/10 bg-white/4 text-white/45",
                  )}
                >
                  {g.emoji} {g.name} {unlocked ? "· UNLOCKED" : "· 🔒 LOCKED"}
                </span>
              );
            })}
          </div>
        )}
      </section>

      {loading ? (
        <Spinner label="Reading the board…" />
      ) : (
        <>
          {/* YOU'RE UP */}
          <YoureUp matches={mine ?? []} onOpenResult={onOpenResult} />

          {/* NOW PLAYING */}
          <section>
            <SectionHead title="Now Playing" emoji="🔴" count={live?.length} />
            {live && live.length > 0 ? (
              <div className="space-y-3">
                {live.map((m) => (
                  <NowPlayingCard key={m._id} match={m} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 px-4 py-6 text-center text-sm text-white/45">
                Nothing on the tables right now. Matches will seat themselves the
                moment a station opens up.
              </div>
            )}
          </section>

          {/* STATION BOARD */}
          <section>
            <SectionHead title="Station Board" emoji="🏟️" />
            <CircuitBoard
              stations={board?.stations ?? []}
              upNext={board?.upNext ?? []}
              canReport={identity.isHost}
              onReport={(s) => {
                if (!s.match) return;
                onOpenResult({
                  _id: s.match._id,
                  label: s.match.label,
                  teams: s.match.teams,
                  gameName: s.game?.name,
                  gameEmoji: s.game?.emoji,
                  stationName: s.name,
                });
              }}
            />
          </section>

          {/* Per-game brackets */}
          {shownGames.length > 0 && (
            <section>
              <SectionHead title="Brackets" emoji="🗺️" />
              <div className="flex flex-wrap gap-2">
                {shownGames.map((g) => (
                  <Link
                    key={g._id}
                    href={`/games/${g._id}`}
                    className="chip hover:border-[var(--color-gold-500)]/55 hover:text-white"
                  >
                    {g.emoji} {g.name} →
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ── "You're up" hero / on-deck ────────────────────────────────────────────────
function YoureUp({
  matches,
  onOpenResult,
}: {
  matches: MineMatch[];
  onOpenResult: (m: ResultMatch) => void;
}) {
  const playing = matches.find((m) => m.status === "in_progress");
  const onDeck = matches
    .filter((m) => m.status === "ready" || m.status === "queued")
    .sort((a, b) => (a.status === "queued" ? -1 : 1));

  return (
    <section>
      <SectionHead title="You're Up" emoji="🎯" />
      {playing ? (
        <div
          className="panel relative overflow-hidden p-5 animate-pop"
          style={{ boxShadow: "0 0 0 1px rgba(247,183,51,0.45), 0 22px 60px -25px rgba(247,183,51,0.6)" }}
        >
          <div className="pointer-events-none absolute -right-5 -top-5 text-[100px] leading-none opacity-10">
            {playing.gameEmoji ?? "🎯"}
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--color-live)]">
              <span className="live-dot" /> You're playing right now
            </div>
            <h3 className="mt-2 font-display text-2xl leading-tight text-white">
              {playing.gameEmoji} {playing.gameName ?? "Your match"}
            </h3>
            {playing.stationName && (
              <p className="mt-1 text-sm text-white/60">
                at <span className="font-bold text-[var(--color-gold-300)]">{playing.stationName}</span>
              </p>
            )}
            <div className="mt-4 rounded-2xl bg-black/30 p-3">
              <VersusRow teams={playing.teams} />
            </div>
            <button
              className="btn btn-gold mt-4 w-full"
              onClick={() =>
                onOpenResult({
                  _id: playing._id,
                  label: playing.label,
                  teams: playing.teams,
                  gameName: playing.gameName,
                  gameEmoji: playing.gameEmoji,
                  stationName: playing.stationName,
                })
              }
            >
              🏁 Report Result
            </button>
            <div className="mt-2 flex justify-center">
              <MediaCapture variant="chip" matchId={playing._id} label="Add match photo/video" />
            </div>
          </div>
        </div>
      ) : onDeck.length > 0 ? (
        <div className="space-y-2">
          {onDeck.map((m) => (
            <div key={m._id} className="panel-tight flex items-center gap-3 p-4">
              <span className="text-2xl">{m.gameEmoji ?? "🎯"}</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white">
                  On deck · {m.gameName ?? "Up next"}
                </div>
                <div className="mt-1">
                  <VersusRow teams={m.teams} size="sm" />
                </div>
              </div>
              <span className="chip shrink-0 border-[var(--color-gold-500)]/45 text-[var(--color-gold-300)]">
                {m.status === "queued" ? "On deck" : "Queued"}
              </span>
            </div>
          ))}
        </div>
      ) : matches.length > 0 ? (
        <div className="panel-tight flex items-center gap-3 p-4 text-sm text-white/60">
          <span className="text-2xl">⏳</span>
          You've got matches coming up — they'll appear here once your bracket
          slot is ready. Stay loose.
        </div>
      ) : (
        <div className="panel-tight flex items-center gap-3 p-4 text-sm text-white/60">
          <span className="text-2xl">🍺</span>
          You're not in a match right now. Join a team and the dispatcher will put
          you in the action.
        </div>
      )}
    </section>
  );
}

// ── Now-playing card ──────────────────────────────────────────────────────────
function NowPlayingCard({ match }: { match: LiveMatch }) {
  return (
    <div className="panel relative overflow-hidden p-4 animate-rise">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{match.gameEmoji ?? "🎯"}</span>
          <span className="font-bold text-white/90">{match.gameName ?? "Match"}</span>
          {match.label && (
            <span className="text-[11px] uppercase tracking-widest text-white/35">
              · {match.label}
            </span>
          )}
        </div>
        {match.stationName && (
          <span className="chip text-white/55">📍 {match.stationName}</span>
        )}
      </div>
      <div className="rounded-2xl bg-black/25 p-3">
        <VersusRow teams={match.teams} />
      </div>
      <div className="mt-2 flex justify-end">
        <MediaCapture variant="chip" matchId={match._id} label="Add" />
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({
  title,
  emoji,
  count,
}: {
  title: string;
  emoji: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-xl">{emoji}</span>
      <h2 className="font-display text-2xl text-white">{title}</h2>
      {typeof count === "number" && count > 0 && (
        <span className="chip">{count}</span>
      )}
    </div>
  );
}
