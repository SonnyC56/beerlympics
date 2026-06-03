"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  Avatar,
  Spinner,
  TeamBadge,
  cx,
  useAction,
  useNow,
} from "@/components/primitives";
import { MediaCapture } from "@/components/MediaCapture";
import { MediaGrid } from "@/components/MediaGrid";
import { colorHex } from "@/lib/teamColors";
import { placeMedal, timeAgo } from "@/lib/format";

type TeamLite = { _id: Id<"teams">; name: string; emoji: string; color: string };
const QUICK = [10, 25, 50, 100];

export function SpecialEventGame({ game }: { game: { _id: Id<"games">; name: string; emoji: string } }) {
  const identity = useIdentity();
  const run = useAction();
  const now = useNow(15000);
  const award = useMutation(api.special.award);
  const teams = useQuery(api.teams.list, {}) as TeamLite[] | undefined;
  const standings = useQuery(api.scoring.gameStandings, { gameId: game._id });
  const recent = useQuery(api.special.awards, { gameId: game._id, limit: 15 });
  const media = useQuery(api.media.forGame, { gameId: game._id, limit: 60 });

  const [teamId, setTeamId] = useState<Id<"teams"> | "">("");
  const [points, setPoints] = useState("25");
  const [note, setNote] = useState("");

  const doAward = (pts: number) => {
    if (!teamId || !identity.deviceId) return;
    run(
      () =>
        award({
          deviceId: identity.deviceId!,
          gameId: game._id,
          teamId: teamId as Id<"teams">,
          points: pts,
          note: note.trim() || undefined,
        }),
      `${pts >= 0 ? "+" : ""}${pts} awarded`,
    ).then((ok) => ok && setNote(""));
  };

  return (
    <div className="space-y-5">
      <div className="panel-tight flex items-center gap-2 p-3 text-sm text-[var(--color-gold-300)]">
        <span className="text-lg">⏱️</span> Running all day — earn points anytime.
      </div>

      {/* Host: award points */}
      {identity.isHost && (
        <section className="panel p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-gold-300)]">
            👑 Award points
          </div>
          {teams && teams.length > 0 ? (
            <>
              <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
                {teams.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setTeamId(teamId === t._id ? "" : t._id)}
                    className={cx(
                      "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                      teamId === t._id ? "bg-[var(--color-gold-500)]/15" : "border-white/10 bg-white/4 hover:bg-white/8",
                    )}
                    style={{ borderColor: teamId === t._id ? colorHex(t.color) : undefined }}
                  >
                    <Avatar emoji={t.emoji} size={22} color={t.color} />
                    {t.name}
                  </button>
                ))}
              </div>
              <input
                className="field mb-2"
                placeholder="Note (e.g. '47s keg stand', 'Bohemian Rhapsody')"
                value={note}
                maxLength={60}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                {QUICK.map((p) => (
                  <button
                    key={p}
                    className="btn btn-gold px-4 py-2 text-sm disabled:opacity-40"
                    disabled={!teamId}
                    onClick={() => doAward(p)}
                  >
                    +{p}
                  </button>
                ))}
                <div className="flex items-center gap-1.5">
                  <input
                    className="field w-20 py-2 text-center"
                    inputMode="numeric"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                  />
                  <button
                    className="btn btn-ghost px-3 py-2 text-sm disabled:opacity-40"
                    disabled={!teamId || Number.isNaN(Number(points))}
                    onClick={() => doAward(Number(points) || 0)}
                  >
                    Give
                  </button>
                </div>
              </div>
              {!teamId && <p className="mt-2 text-xs text-white/40">Pick a team first.</p>}
            </>
          ) : (
            <p className="text-sm text-white/40">No teams yet.</p>
          )}
        </section>
      )}

      {/* Leaderboard */}
      <section className="panel p-5">
        <h2 className="mb-3 font-display text-xl">🏅 {game.name} Leaders</h2>
        {standings === undefined ? (
          <Spinner />
        ) : standings.length > 0 ? (
          <div className="space-y-2">
            {standings.map((t, i) => (
              <div key={t.teamId} className="flex items-center justify-between rounded-2xl bg-white/4 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-display text-lg text-white/50">{placeMedal(i + 1) || i + 1}</span>
                  <TeamBadge emoji={t.emoji} name={t.name} color={t.color} />
                </div>
                <span className="font-display text-lg text-[var(--color-gold-400)]">{t.points}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40">No points yet — get out there.</p>
        )}
      </section>

      {/* Recent awards */}
      {recent && recent.length > 0 && (
        <section className="panel p-5">
          <h2 className="mb-3 font-display text-xl">📣 Recent</h2>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r._id} className="flex items-center justify-between gap-2 text-sm">
                <TeamBadge emoji={r.teamEmoji} name={r.teamName} color={r.teamColor} size="sm" />
                <div className="flex items-center gap-2">
                  {r.note && <span className="truncate text-white/55">{r.note}</span>}
                  <span className={r.points >= 0 ? "text-[var(--color-win)]" : "text-[var(--color-loss)]"}>
                    {r.points >= 0 ? "+" : ""}{r.points}
                  </span>
                  <span className="text-xs text-white/30">{timeAgo(r.createdAt, now)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Media for this event */}
      <section className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">📸 {game.name} Moments</h2>
          <MediaCapture variant="chip" gameId={game._id} label="Add" />
        </div>
        {media && media.length > 0 ? (
          <MediaGrid items={media} />
        ) : (
          <p className="text-sm text-white/40">No clips yet — capture the chaos.</p>
        )}
      </section>
    </div>
  );
}
