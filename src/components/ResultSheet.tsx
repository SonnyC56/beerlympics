"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Sheet, TeamBadge, cx, useAction } from "@/components/primitives";
import { Icon, Mascot, Medal } from "@/components/Icon";
import { GameArt } from "@/components/gameArt";
import { colorHex } from "@/lib/teamColors";
import { ordinal } from "@/lib/format";

export type ResultTeam = {
  _id: Id<"teams">;
  name: string;
  emoji: string;
  color: string;
};

export type ResultMatch = {
  _id: Id<"matches">;
  label?: string;
  teams: ResultTeam[];
  gameName?: string;
  gameEmoji?: string;
  gameArt?: string;
  stationName?: string;
};

/**
 * Result entry. Opened from a player's own in-progress match or by a host from
 * any match on the board. 1v1 -> pick the winner. Heats (3+ teams) -> tap teams
 * in finishing order to build a ranking, then submit. Errors (e.g. permissions)
 * surface as toasts via reportResult; the sheet stays open so it can be retried.
 */
export function ResultSheet({
  open,
  onClose,
  match,
  deviceId,
}: {
  open: boolean;
  onClose: () => void;
  match: ResultMatch | null;
  deviceId: string | null;
}) {
  const report = useMutation(api.matches.reportResult);
  const run = useAction();
  const [order, setOrder] = useState<Id<"teams">[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isHeat = (match?.teams.length ?? 0) > 2;

  // Reset the running order each time we open a fresh match.
  useEffect(() => {
    if (open) setOrder([]);
  }, [open, match?._id]);

  const byId = useMemo(() => {
    const m = new Map<string, ResultTeam>();
    for (const t of match?.teams ?? []) m.set(t._id as string, t);
    return m;
  }, [match]);

  if (!match) return null;

  const placedSet = new Set(order.map((x) => x as string));
  const remaining = match.teams.filter((t) => !placedSet.has(t._id as string));

  const submit = (fn: () => Promise<unknown>) => {
    if (!deviceId) return;
    setSubmitting(true);
    void run(fn, "Result locked in!").then((ok) => {
      setSubmitting(false);
      if (ok) onClose();
    });
  };

  const pickWinner = (winnerTeamId: Id<"teams">) =>
    submit(() => report({ deviceId: deviceId!, matchId: match._id, winnerTeamId }));

  const tap = (teamId: Id<"teams">) =>
    setOrder((o) =>
      o.includes(teamId) ? o.filter((x) => x !== teamId) : [...o, teamId],
    );

  const submitHeat = () => {
    const rankings = order.map((teamId, i) => ({ teamId, place: i + 1 }));
    submit(() => report({ deviceId: deviceId!, matchId: match._id, rankings }));
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {match.gameArt ? (
            <GameArt artKey={match.gameArt} size={20} title={match.gameName ?? "Match"} />
          ) : (
            <Icon name="finish" size={20} />
          )}
          Report Result
        </span>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-white/55">
          {match.gameName && <span className="font-semibold text-white/80">{match.gameName}</span>}
          {match.label && <span> · {match.label}</span>}
          {match.stationName && (
            <span className="inline-flex items-center gap-1">
              · <Icon name="pin" size={12} /> {match.stationName}
            </span>
          )}
        </div>

        {!deviceId && (
          <p className="rounded-2xl bg-[var(--color-loss)]/10 px-4 py-3 text-sm text-[var(--color-loss)]">
            Set your name first to report results.
          </p>
        )}

        {!isHeat ? (
          // ── 1v1: two big winner buttons ─────────────────────────────────────
          <div className="space-y-3">
            <p className="text-center text-xs uppercase tracking-widest text-white/40">
              Who won?
            </p>
            <div className="grid gap-3">
              {match.teams.map((t) => {
                const hex = colorHex(t.color);
                return (
                  <button
                    key={t._id}
                    disabled={!deviceId || submitting}
                    onClick={() => pickWinner(t._id)}
                    className="group relative flex items-center justify-between overflow-hidden rounded-2xl border px-5 py-5 text-left transition active:scale-[0.99] disabled:opacity-50"
                    style={{
                      borderColor: `${hex}66`,
                      background: `linear-gradient(135deg, ${hex}22, ${hex}0a)`,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ background: `${hex}26`, border: `1px solid ${hex}66` }}
                      >
                        <Mascot name={t.emoji} size={26} />
                      </span>
                      <span className="font-display text-2xl leading-none text-white">
                        {t.name}
                      </span>
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wider transition group-hover:brightness-110"
                      style={{ background: hex, color: "#1a1205" }}
                    >
                      Winner <Icon name="trophy" size={14} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // ── Heat: tap teams in finishing order ──────────────────────────────
          <div className="space-y-4">
            <p className="text-center text-xs uppercase tracking-widest text-white/40">
              Tap teams in finishing order
            </p>

            {/* Finishing order so far */}
            <div className="space-y-2">
              {order.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/12 px-4 py-4 text-center text-sm text-white/40">
                  No places yet — tap the 1st-place team below.
                </div>
              )}
              {order.map((id, i) => {
                const t = byId.get(id as string);
                if (!t) return null;
                const hex = colorHex(t.color);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 animate-pop"
                    style={{ background: `${hex}1c`, border: `1px solid ${hex}55` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex items-center font-display text-2xl tabular-nums"
                        style={{ color: hex }}
                      >
                        {i + 1 <= 3 ? <Medal rank={i + 1} size={24} /> : ordinal(i + 1)}
                      </span>
                      <TeamBadge emoji={t.emoji} name={t.name} color={t.color} />
                    </div>
                    <button
                      onClick={() => tap(id)}
                      className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-white/70 hover:bg-white/15"
                    >
                      Undo
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Remaining pool */}
            {remaining.length > 0 && (
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-white/35">
                  {order.length === 0 ? "Standings" : `Pick ${ordinal(order.length + 1)}`}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {remaining.map((t) => {
                    const hex = colorHex(t.color);
                    return (
                      <button
                        key={t._id}
                        onClick={() => tap(t._id)}
                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-3 py-3 text-left transition hover:bg-white/8 active:scale-[0.98]"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: `${hex}22`, border: `1px solid ${hex}55` }}
                        >
                          <Mascot name={t.emoji} size={18} />
                        </span>
                        <span className="min-w-0 truncate text-sm font-bold text-white">
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              className={cx("btn btn-gold w-full", remaining.length > 0 && "opacity-60")}
              disabled={!deviceId || submitting || remaining.length > 0}
              onClick={submitHeat}
            >
              {remaining.length > 0 ? (
                `Rank all ${match.teams.length} teams to submit`
              ) : submitting ? (
                "Locking in…"
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="finish" size={16} /> Submit Results
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
