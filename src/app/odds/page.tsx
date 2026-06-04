"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  Avatar,
  EmptyState,
  Spinner,
  TeamBadge,
  cx,
  useAction,
} from "@/components/primitives";
import { Icon, Medal } from "@/components/Icon";
import { colorHex } from "@/lib/teamColors";

type TeamLite = { _id: Id<"teams">; name: string; emoji: string; color: string };
type Mine = { first: Id<"teams">; second?: Id<"teams">; third?: Id<"teams"> } | null;
type Board = {
  provisional: boolean;
  podium: { _id: string; name: string; emoji: string; color: string }[];
  predictors: {
    _id: string;
    name: string;
    score: number;
    picks: ({ _id: string; name: string; emoji: string; color: string } | null)[];
  }[];
};

const SLOT_LABEL = ["Gold", "Silver", "Bronze"];

export default function OddsPage() {
  const identity = useIdentity();
  const run = useAction();
  const teams = useQuery(api.teams.list, {}) as TeamLite[] | undefined;
  const status = useQuery(api.predictions.status, {});
  const mine = useQuery(
    api.predictions.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  ) as Mine | undefined;
  const board = useQuery(api.predictions.leaderboard, {}) as Board | undefined;
  const submit = useMutation(api.predictions.submit);

  const [picks, setPicks] = useState<(Id<"teams"> | null)[]>([null, null, null]);

  // Seed the form from any existing prediction.
  useEffect(() => {
    if (mine) setPicks([mine.first ?? null, mine.second ?? null, mine.third ?? null]);
  }, [mine]);

  if (teams === undefined || status === undefined) return <Spinner label="Loading the odds…" />;

  const locked = status?.locked ?? false;

  function toggle(id: Id<"teams">) {
    setPicks((cur) => {
      if (cur.includes(id)) return cur.map((p) => (p === id ? null : p));
      const i = cur.findIndex((p) => p === null);
      if (i === -1) return cur; // podium full
      const nxt = [...cur];
      nxt[i] = id;
      return nxt;
    });
  }
  const slotOf = (id: Id<"teams">) => picks.findIndex((p) => p === id);
  const canSubmit = !!picks[0] && !!identity.deviceId;

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--color-gold-400)]">
          <Icon name="target" size={14} /> Opening Odds
        </div>
        <h1 className="mt-1 font-display text-4xl leading-none text-medal">Call the Podium</h1>
        <p className="mt-1.5 text-sm text-white/55">
          {locked
            ? "Predictions are locked. Here's how everyone's picks are holding up."
            : "Pick who you think finishes top three — before the first cup is thrown."}
          {status && (
            <span className="text-white/40">
              {" "}
              {status.count} {status.count === 1 ? "person has" : "people have"} predicted.
            </span>
          )}
        </p>
      </header>

      {/* Prediction form (pre-game) */}
      {!locked && (
        <section className="panel p-5 animate-rise">
          {/* podium slots */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => {
              const id = picks[i];
              const team = teams.find((t) => t._id === id);
              return (
                <div
                  key={i}
                  className={cx(
                    "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center",
                    team ? "border-white/20 bg-white/5" : "border-dashed border-white/12 bg-white/[0.02]",
                  )}
                  style={team ? { borderColor: `${colorHex(team.color)}88` } : undefined}
                >
                  <Medal rank={i + 1} size={26} />
                  <div className="text-[10px] uppercase tracking-wide text-white/40">
                    {SLOT_LABEL[i]}
                  </div>
                  {team ? (
                    <div className="flex flex-col items-center gap-1">
                      <Avatar emoji={team.emoji} size={26} color={team.color} />
                      <span className="line-clamp-2 text-xs font-bold text-white">
                        {team.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-white/30">Pick</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* team picker */}
          {teams.length === 0 ? (
            <p className="text-sm text-white/45">No teams to bet on yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teams.map((t) => {
                const slot = slotOf(t._id);
                const picked = slot !== -1;
                return (
                  <button
                    key={t._id}
                    onClick={() => toggle(t._id)}
                    className={cx(
                      "relative flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                      picked
                        ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/15 text-white"
                        : "border-white/10 bg-white/4 text-white/70 hover:bg-white/8",
                    )}
                    style={picked ? { borderColor: colorHex(t.color) } : undefined}
                  >
                    <Avatar emoji={t.emoji} size={20} color={t.color} />
                    {t.name}
                    {picked && (
                      <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-gold-500)] text-[10px] font-black text-[#1a1205]">
                        {slot + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button
            className="btn btn-gold mt-4 w-full"
            disabled={!canSubmit}
            onClick={() =>
              run(
                () =>
                  submit({
                    deviceId: identity.deviceId!,
                    first: picks[0]!,
                    second: picks[1] ?? undefined,
                    third: picks[2] ?? undefined,
                  }),
                "Prediction locked in!",
              )
            }
          >
            {mine ? "Update my prediction" : "Lock in my prediction"}
          </button>
          <p className="mt-2 text-center text-[11px] text-white/40">
            Exact spot = 5 pts · right team, wrong spot = 2 pts. You can edit until kickoff.
          </p>
        </section>
      )}

      {/* Standings vs predictions */}
      {board && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl text-white/90">
              <Icon name="trophy" size={18} /> Predictor Leaderboard
            </h2>
            <span className="chip">{board.provisional ? "Provisional" : "Final"}</span>
          </div>

          {board.podium.length > 0 && (
            <div className="panel p-4">
              <div className="mb-2 text-[11px] uppercase tracking-widest text-white/40">
                {board.provisional ? "Current podium" : "Final podium"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {board.podium.map((p, i) => (
                  <span key={p._id} className="flex items-center gap-1.5">
                    <Medal rank={i + 1} size={18} />
                    <TeamBadge emoji={p.emoji} name={p.name} color={p.color} size="sm" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {board.predictors.length === 0 ? (
            <EmptyState icon="target" title="No predictions yet" subtitle="Be the first to call it." />
          ) : (
            <ol className="space-y-2">
              {board.predictors.map((p, i) => (
                <li
                  key={p._id}
                  className="panel flex items-center justify-between gap-3 p-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-6 shrink-0 text-center font-display text-lg text-white/40">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{p.name}</div>
                      <div className="mt-0.5 flex items-center gap-1">
                        {p.picks.map((pk, j) =>
                          pk ? (
                            <span
                              key={j}
                              className="flex items-center gap-0.5"
                              title={`${SLOT_LABEL[j]}: ${pk.name}`}
                            >
                              <Avatar emoji={pk.emoji} size={16} color={pk.color} />
                            </span>
                          ) : null,
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 font-display text-xl text-[var(--color-gold-300)]">
                    {p.score}
                    <span className="ml-0.5 text-xs text-white/35">pts</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
