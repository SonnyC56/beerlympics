"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  Spinner,
  TeamBadge,
  cx,
  useAction,
} from "@/components/primitives";
import { Icon, Mascot } from "@/components/Icon";
import { GameArt } from "@/components/gameArt";
import { HostStat, HostSectionTitle, MiniButton, StatusDot } from "./HostKit";

type Seeding = "seed" | "random" | "standings";

type GameLite = {
  _id: Id<"games">;
  name: string;
  emoji: string;
  art?: string;
  category: string;
  format: string;
  isGated: boolean;
  gateFromPhaseIndex?: number;
  status: "scheduled" | "active" | "completed" | "locked";
};

type PhaseLite = {
  _id: Id<"phases">;
  index: number;
  name: string;
  kind: "qualifier" | "knockout" | "semifinal" | "final";
  description?: string;
  status: "locked" | "active" | "complete";
};

export function HostRun() {
  const event = useQuery(api.events.get, {});
  const stats = useQuery(api.events.stats, {});
  const phases = useQuery(api.phases.list, {}) as PhaseLite[] | undefined;
  const games = useQuery(api.games.list, {}) as GameLite[] | undefined;
  const board = useQuery(api.matches.board, {});

  if (event === undefined) return <Spinner label="Loading the control room…" />;
  if (event === null)
    return (
      <div className="panel p-6 text-center text-white/60">
        No event yet. Create one from the home screen first.
      </div>
    );

  return (
    <div className="space-y-5">
      <StatusControl status={event.status} />

      {stats && (
        <section className="grid grid-cols-4 gap-2.5">
          <HostStat icon="handRaise" label="Going" value={stats.going} tone="win" />
          <HostStat icon="thinking" label="Maybe" value={stats.maybe} />
          <HostStat icon="flag" label="Teams" value={stats.teams} tone="gold" />
          <HostStat icon="beers" label="Heads" value={stats.headcount} />
        </section>
      )}

      <PhaseControl phases={phases} currentPhaseIndex={event.currentPhaseIndex} />

      <DispatchPanel />

      <GenerateBrackets games={games} currentPhaseIndex={event.currentPhaseIndex} />

      <StationBoard
        board={
          board as
            | {
                stations: BoardStation[];
                upNext: BoardMatch[];
              }
            | undefined
        }
      />
    </div>
  );
}

// ── Status control ────────────────────────────────────────────────────────────
const STATUS_FLOW = [
  { value: "draft" as const, icon: "pencil" as const, label: "Draft" },
  { value: "rsvp" as const, icon: "envelope" as const, label: "RSVPs" },
  { value: "live" as const, icon: "finish" as const, label: "Live" },
  { value: "finished" as const, icon: "trophy" as const, label: "Final" },
];

function StatusControl({ status }: { status: string }) {
  const identity = useIdentity();
  const run = useAction();
  const setStatus = useMutation(api.events.setStatus);

  const blurb: Record<string, string> = {
    rsvp: "Guests can RSVP and form teams. Flip to Live when the games begin.",
    live: "The circuit is open — drive it with the phase + dispatch controls below.",
    finished: "Results are locked as final. Switch back to Live to keep playing.",
    draft: "Event is hidden in draft mode. Open RSVPs when you're ready.",
  };

  return (
    <section className="panel p-5">
      <HostSectionTitle icon="traffic" title="Event Status" />
      <div className="grid grid-cols-4 gap-2">
        {STATUS_FLOW.map((s) => {
          const active = status === s.value;
          return (
            <button
              key={s.value}
              type="button"
              disabled={!identity.deviceId || active}
              onClick={() =>
                run(
                  () =>
                    setStatus({
                      deviceId: identity.deviceId!,
                      status: s.value,
                    }),
                  `Now in ${s.label} mode`,
                )
              }
              className={cx(
                "flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-bold transition",
                active
                  ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)]"
                  : "border-white/10 bg-white/4 text-white/55 hover:bg-white/8 disabled:opacity-50",
              )}
            >
              <Icon name={s.icon} size={18} />
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-white/45">{blurb[status] ?? ""}</p>
    </section>
  );
}

// ── Phase control ─────────────────────────────────────────────────────────────
function PhaseControl({
  phases,
  currentPhaseIndex,
}: {
  phases: PhaseLite[] | undefined;
  currentPhaseIndex: number;
}) {
  const identity = useIdentity();
  const run = useAction();
  const startPhase = useMutation(api.tournament.startPhase);

  return (
    <section className="panel p-5">
      <HostSectionTitle icon="compass" title="Phases" />
      {phases === undefined ? (
        <Spinner />
      ) : phases.length === 0 ? (
        <p className="text-sm text-white/45">
          No phases yet. Add them in your seed/setup — then advance through them
          here on game day.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {phases.map((p) => {
            const isCurrent = p.index === currentPhaseIndex;
            const unlocksDie = p.kind === "semifinal" || p.kind === "final";
            return (
              <li
                key={p._id}
                className={cx(
                  "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition",
                  isCurrent
                    ? "border-[var(--color-gold-500)]/60 bg-[var(--color-gold-500)]/10"
                    : "border-white/8 bg-white/4",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg text-white/40">
                      {p.index + 1}
                    </span>
                    <span className="truncate font-bold text-white">{p.name}</span>
                    {isCurrent && (
                      <span className="chip border-[var(--color-gold-500)]/50 text-[var(--color-gold-300)]">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/45">
                    <StatusDot status={p.status} />
                    {unlocksDie && (
                      <span className="flex items-center gap-1">
                        · unlocks gated games <Icon name="dice" size={14} />
                      </span>
                    )}
                  </div>
                </div>
                <MiniButton
                  tone={isCurrent ? "ghost" : "gold"}
                  disabled={!identity.deviceId || isCurrent}
                  onClick={() =>
                    run(
                      () =>
                        startPhase({
                          deviceId: identity.deviceId!,
                          index: p.index,
                        }),
                      `Started ${p.name}`,
                    )
                  }
                >
                  {isCurrent ? (
                    "Running"
                  ) : (
                    <span className="flex items-center gap-1">
                      Start <Icon name="arrowRight" size={14} />
                    </span>
                  )}
                </MiniButton>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-3 text-xs text-white/40">
        Starting the <b className="text-white/60">Semifinals</b> phase unlocks gated
        games like Beer Die, opening their stations automatically.
      </p>
    </section>
  );
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
function DispatchPanel() {
  const identity = useIdentity();
  const run = useAction();
  const dispatch = useMutation(api.tournament.dispatch);

  return (
    <section className="panel stadium-grid p-5">
      <HostSectionTitle icon="bolt" title="Dispatch" />
      <p className="mb-3 text-sm text-white/55">
        Seat every ready match at an open station. Run this whenever you open
        stations or build a new bracket.
      </p>
      <button
        className="btn btn-flame w-full py-4 text-lg"
        disabled={!identity.deviceId}
        onClick={() =>
          run(async () => {
            const res = await dispatch({ deviceId: identity.deviceId! });
            const n = (res as { started?: number })?.started ?? 0;
            if (!n) throw new Error("Nothing to seat — open stations or generate a bracket.");
          }, "Matches seated")
        }
      >
        <span className="flex items-center justify-center gap-2">
          <Icon name="bolt" size={20} /> Dispatch ready matches
        </span>
      </button>
    </section>
  );
}

// ── Generate brackets ─────────────────────────────────────────────────────────
const SEEDING_OPTS: { value: Seeding; label: string }[] = [
  { value: "seed", label: "By seed" },
  { value: "standings", label: "Standings" },
  { value: "random", label: "Random" },
];

function GenerateBrackets({
  games,
  currentPhaseIndex,
}: {
  games: GameLite[] | undefined;
  currentPhaseIndex: number;
}) {
  const identity = useIdentity();
  const run = useAction();
  const generate = useMutation(api.tournament.generate);
  const seedFinale = useMutation(api.tournament.seedFromStandings);
  const resetGame = useMutation(api.tournament.resetGame);

  const [seeding, setSeeding] = useState<Record<string, Seeding>>({});
  const [topN, setTopN] = useState<Record<string, number>>({});

  return (
    <section className="panel p-5">
      <HostSectionTitle icon="construction" title="Build Brackets" />
      {games === undefined ? (
        <Spinner />
      ) : games.length === 0 ? (
        <p className="text-sm text-white/45">No games yet — add some in the Games tab.</p>
      ) : (
        <div className="space-y-3">
          {games
            .filter((g) => g.format !== "wheel" && g.format !== "special")
            .map((g) => {
            const sd = seeding[g._id] ?? "seed";
            const n = topN[g._id] ?? 4;
            const gated = g.isGated;
            return (
              <div
                key={g._id}
                className={cx(
                  "rounded-2xl border p-3.5",
                  gated
                    ? "border-[var(--color-gold-500)]/40 bg-[var(--color-gold-500)]/8"
                    : "border-white/8 bg-white/4",
                )}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <GameArt artKey={g.art} size={20} />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{g.name}</div>
                      <div className="text-[11px] uppercase tracking-wide text-white/40">
                        {g.format.replace("_", " ")} · {g.status}
                      </div>
                    </div>
                  </div>
                  {g.status !== "scheduled" && (
                    <MiniButton
                      tone="flame"
                      disabled={!identity.deviceId}
                      onClick={() =>
                        run(
                          () =>
                            resetGame({
                              deviceId: identity.deviceId!,
                              gameId: g._id,
                            }),
                          `${g.name} reset`,
                        )
                      }
                    >
                      Reset
                    </MiniButton>
                  )}
                </div>

                {gated ? (
                  <div className="space-y-2.5">
                    <p className="flex items-start gap-1.5 text-xs text-[var(--color-gold-300)]">
                      <Icon name="dice" size={14} className="mt-0.5 shrink-0" />
                      <span>
                        Gated finale — seed it from the live leaderboard when the
                        gate phase is open
                        {typeof g.gateFromPhaseIndex === "number"
                          ? ` (phase ${g.gateFromPhaseIndex + 1})`
                          : ""}
                        .
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-white/60">
                        Top
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={16}
                        value={n}
                        onChange={(e) =>
                          setTopN((s) => ({
                            ...s,
                            [g._id]: Math.max(2, Number(e.target.value) || 2),
                          }))
                        }
                        className="field w-20 py-2 text-center"
                      />
                      <button
                        className="btn btn-gold flex-1 py-2.5 text-sm"
                        disabled={!identity.deviceId}
                        onClick={() =>
                          run(
                            () =>
                              seedFinale({
                                deviceId: identity.deviceId!,
                                gameId: g._id,
                                topN: n,
                              }),
                            `${g.name} finale seeded from Top ${n}!`,
                          )
                        }
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Icon name="dice" size={16} /> Seed finale
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 rounded-full border border-white/10 bg-black/30 p-0.5">
                      {SEEDING_OPTS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() =>
                            setSeeding((s) => ({ ...s, [g._id]: o.value }))
                          }
                          className={cx(
                            "rounded-full px-2.5 py-1.5 text-[11px] font-bold transition",
                            sd === o.value
                              ? "bg-[var(--color-gold-500)] text-[#1a1205]"
                              : "text-white/55 hover:text-white",
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <button
                      className="btn btn-ghost ml-auto py-2.5 text-sm"
                      disabled={!identity.deviceId}
                      onClick={() =>
                        run(async () => {
                          const res = await generate({
                            deviceId: identity.deviceId!,
                            gameId: g._id,
                            seeding: sd,
                            phaseIndex:
                              currentPhaseIndex >= 0 ? currentPhaseIndex : 0,
                          });
                          const t = (res as { teams?: number })?.teams ?? 0;
                          if (t < 2) throw new Error("Need at least 2 teams.");
                        }, `${g.name} bracket built!`)
                      }
                    >
                      {g.status === "scheduled" ? "Generate" : "Regenerate"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Station board ─────────────────────────────────────────────────────────────
type BoardMatch = {
  _id: Id<"matches">;
  label?: string;
  status: string;
  teams: { _id: Id<"teams">; name: string; emoji: string; color: string }[];
  gameName?: string;
  gameEmoji?: string;
};
type BoardStation = {
  _id: Id<"stations">;
  name: string;
  status: "open" | "busy" | "closed";
  game: {
    _id: Id<"games">;
    name: string;
    emoji: string;
    category: string;
    art?: string;
  } | null;
  match: BoardMatch | null;
};

function StationBoard({
  board,
}: {
  board: { stations: BoardStation[]; upNext: BoardMatch[] } | undefined;
}) {
  const identity = useIdentity();
  const run = useAction();
  const setStatus = useMutation(api.stations.setStatus);
  const unseat = useMutation(api.matches.unseat);

  return (
    <section className="panel p-5">
      <HostSectionTitle icon="sliders" title="Station Board" />
      {board === undefined ? (
        <Spinner />
      ) : board.stations.length === 0 ? (
        <p className="text-sm text-white/45">
          No stations yet. Add some in the Games &amp; Stations tab.
        </p>
      ) : (
        <div className="space-y-2.5">
          {board.stations.map((s) => (
            <div
              key={s._id}
              className="rounded-2xl border border-white/8 bg-white/4 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {s.game ? (
                    <GameArt artKey={s.game.art} size={20} />
                  ) : (
                    <Icon name="target" size={18} />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-bold text-white">{s.name}</div>
                    <div className="truncate text-[11px] text-white/40">
                      {s.game?.name ?? "No game"}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusDot status={s.status} />
                  {s.status !== "busy" && (
                    <MiniButton
                      disabled={!identity.deviceId}
                      onClick={() =>
                        run(
                          () =>
                            setStatus({
                              deviceId: identity.deviceId!,
                              stationId: s._id,
                              status: s.status === "open" ? "closed" : "open",
                            }),
                          s.status === "open" ? "Station closed" : "Station opened",
                        )
                      }
                    >
                      {s.status === "open" ? "Close" : "Open"}
                    </MiniButton>
                  )}
                </div>
              </div>

              {s.match && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-black/30 px-3 py-2.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    {s.match.teams.map((t, i) => (
                      <span key={t._id} className="flex items-center gap-2">
                        {i > 0 && <span className="text-xs text-white/30">vs</span>}
                        <TeamBadge
                          emoji={t.emoji}
                          name={t.name}
                          color={t.color}
                          size="sm"
                        />
                      </span>
                    ))}
                  </div>
                  <MiniButton
                    tone="flame"
                    disabled={!identity.deviceId}
                    title="Send back to the queue without a result"
                    onClick={() =>
                      run(
                        () =>
                          unseat({
                            deviceId: identity.deviceId!,
                            matchId: s.match!._id,
                          }),
                        "Match returned to queue",
                      )
                    }
                  >
                    Unseat
                  </MiniButton>
                </div>
              )}
            </div>
          ))}

          {board.upNext.length > 0 && (
            <div className="hairline pt-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
                On deck · {board.upNext.length}
              </div>
              <div className="space-y-1.5">
                {board.upNext.slice(0, 6).map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center gap-2 text-sm text-white/70"
                  >
                    <Icon name="games" size={16} className="shrink-0" />
                    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      {m.teams.map((t, i) => (
                        <span key={t._id} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-xs text-white/30">vs</span>
                          )}
                          <Mascot name={t.emoji} size={14} />
                          <span className="truncate">{t.name}</span>
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
