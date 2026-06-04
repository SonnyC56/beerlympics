"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  Avatar,
  Sheet,
  Spinner,
  TeamBadge,
  cx,
  useAction,
  useNow,
} from "@/components/primitives";
import { SpinWheel, type WheelSpot } from "@/components/SpinWheel";
import { Icon } from "@/components/Icon";
import { colorHex } from "@/lib/teamColors";
import { timeAgo } from "@/lib/format";

type TeamLite = { _id: Id<"teams">; name: string; emoji: string; color: string };

export function WheelGame({ game }: { game: { _id: Id<"games">; name: string; emoji: string } }) {
  const identity = useIdentity();
  const run = useAction();
  const now = useNow(15000);
  const cfg = useQuery(api.wheel.config, { gameId: game._id });
  const history = useQuery(api.wheel.spins, { gameId: game._id, limit: 20 });
  const teams = useQuery(api.teams.list, {}) as TeamLite[] | undefined;
  const record = useMutation(api.wheel.recordSpin);
  const broadcastDrink = useMutation(api.wheel.broadcastDrink);

  const [teamId, setTeamId] = useState<Id<"teams"> | "">("");
  const [spin, setSpin] = useState<{ index: number; nonce: number } | null>(null);
  const [recordTeam, setRecordTeam] = useState<Id<"teams"> | null>(null);
  const [last, setLast] = useState<{
    label: string;
    points: number;
    teamName?: string;
    broadcast?: boolean;
  } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const nonce = useRef(0);

  if (cfg === undefined) return <Spinner label="Loading the wheel…" />;
  if (cfg === null) return null;
  const spots = cfg.spots as WheelSpot[];

  const fire = (index: number, forTeam: Id<"teams"> | null) => {
    nonce.current += 1;
    setLast(null);
    setRecordTeam(forTeam);
    setSpinning(true);
    setSpin({ index, nonce: nonce.current });
  };
  const spinRandom = (forTeam: Id<"teams"> | null) =>
    fire(Math.floor(Math.random() * spots.length), forTeam);

  const onArrive = async (index: number) => {
    setSpinning(false);
    const spot = spots[index];
    const team = teams?.find((t) => t._id === recordTeam);
    setLast({
      label: spot.label,
      points: spot.points ?? 0,
      teamName: team?.name,
      broadcast: spot.broadcast,
    });
    if (recordTeam && identity.deviceId) {
      const tid = recordTeam;
      await run(
        () => record({ deviceId: identity.deviceId!, gameId: game._id, teamId: tid, spotIndex: index }),
        `Recorded: ${spot.label}`,
      );
    }
    setRecordTeam(null);
  };

  const selectedTeam = teams?.find((t) => t._id === teamId);

  return (
    <div className="space-y-5">
      {/* The wheel */}
      <section className="panel stadium-grid flex flex-col items-center p-5">
        <div className="w-full max-w-[420px]">
          <SpinWheel spots={spots} size={420} spin={spin} onArrive={onArrive} />
        </div>

        {/* result banner */}
        <div className="mt-3 min-h-[2.5rem] text-center">
          {last ? (
            <div className="animate-pop">
              <div className="font-display text-2xl text-medal">{last.label}</div>
              <div className="text-sm text-white/60">
                {last.teamName ? `${last.teamName} ` : ""}
                {last.points ? (
                  <span className={last.points > 0 ? "text-[var(--color-win)]" : "text-[var(--color-loss)]"}>
                    {last.points > 0 ? "+" : ""}
                    {last.points} pts
                  </span>
                ) : (
                  "— do what it says!"
                )}
              </div>
              {last.broadcast && (
                <div className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-gold-300)]">
                  <Icon name="bell" size={13} /> Everybody drinks
                  {last.teamName ? " — alert sent!" : "!"}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-sm text-white/35">
              {spinning ? (
                "Round and round…"
              ) : (
                <>
                  Give it a spin <Icon name="wheel" size={16} />
                </>
              )}
            </div>
          )}
        </div>

        {/* everyone can practice-spin */}
        <button
          className="btn btn-ghost mt-1 inline-flex items-center justify-center gap-1.5"
          disabled={spinning}
          onClick={() => spinRandom(null)}
        >
          <Icon name="wheel" size={16} /> Spin it
        </button>
      </section>

      {/* Host: broadcast a drink to everyone, instantly */}
      {identity.isHost && (
        <section className="panel border-[var(--color-gold-500)]/30 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-gold-300)]">
            <Icon name="bell" size={16} /> Everybody drinks
          </div>
          <p className="mt-1 text-xs text-white/50">
            Physical wheel landed on a group spot? Buzz everyone&apos;s phone to drink — now.
          </p>
          <button
            className="btn btn-gold mt-3 w-full inline-flex items-center justify-center gap-1.5"
            disabled={!identity.deviceId}
            onClick={() =>
              run(
                () =>
                  broadcastDrink({
                    deviceId: identity.deviceId!,
                    gameId: game._id,
                    label: "Everybody drinks",
                  }),
                "Drink alert sent!",
              )
            }
          >
            <Icon name="bell" size={16} /> Send drink alert to everyone
          </button>
        </section>
      )}

      {/* Host: record a real spin for a team */}
      {identity.isHost && (
        <section className="panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-gold-300)]">
              <Icon name="crown" size={16} /> Record a spin
            </div>
            <button
              className="text-xs font-bold text-white/45 underline"
              onClick={() => setEditOpen(true)}
            >
              Edit spots
            </button>
          </div>

          {/* pick the team */}
          <div className="mb-3">
            <div className="mb-1.5 text-xs uppercase tracking-widest text-white/40">
              1. Whose turn?
            </div>
            {teams && teams.length > 0 ? (
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {teams.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setTeamId(teamId === t._id ? "" : t._id)}
                    className={cx(
                      "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                      teamId === t._id
                        ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/15"
                        : "border-white/10 bg-white/4 hover:bg-white/8",
                    )}
                    style={teamId === t._id ? { borderColor: colorHex(t.color) } : undefined}
                  >
                    <Avatar emoji={t.emoji} size={22} color={t.color} />
                    {t.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No teams yet.</p>
            )}
          </div>

          {/* spin & record, or enter the physical result */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest text-white/40">
              2. Spin for them, or enter what the real wheel hit
            </div>
            <button
              className="btn btn-gold w-full inline-flex items-center justify-center gap-1.5"
              disabled={!teamId || spinning || !identity.deviceId}
              onClick={() => teamId && spinRandom(teamId)}
            >
              <Icon name="wheel" size={16} /> Spin &amp; record{selectedTeam ? ` for ${selectedTeam.name}` : ""}
            </button>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {spots.map((s, i) => (
                <button
                  key={i}
                  disabled={!teamId || spinning || !identity.deviceId}
                  onClick={() => teamId && fire(i, teamId)}
                  className={cx(
                    "flex items-center justify-center gap-1 truncate rounded-lg border px-2 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-40",
                    s.broadcast
                      ? "border-[var(--color-gold-500)]/40 bg-[var(--color-gold-500)]/10 text-[var(--color-gold-200)]"
                      : "border-white/8 bg-white/4 text-white/70",
                  )}
                  style={{ color: !s.broadcast && s.color ? colorHex(s.color) : undefined }}
                  title={
                    s.broadcast
                      ? `${s.label} — records + buzzes everyone to drink`
                      : `It landed on ${s.label}`
                  }
                >
                  {s.broadcast && <Icon name="bell" size={11} />}
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-[11px] text-white/35">
              <Icon name="bell" size={10} className="mb-0.5 inline" /> spots also buzz
              everyone to drink.
            </p>
            {!teamId && (
              <p className="text-center text-xs text-white/40">Pick a team first.</p>
            )}
          </div>
        </section>
      )}

      {/* History */}
      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          <Icon name="wheel" size={20} /> Recent Spins
        </h2>
        {history && history.length > 0 ? (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h._id} className="flex items-center justify-between gap-2 text-sm">
                <TeamBadge emoji={h.teamEmoji} name={h.teamName} color={h.teamColor} size="sm" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white/80">{h.label}</span>
                  {h.points !== 0 && (
                    <span className={h.points > 0 ? "text-[var(--color-win)]" : "text-[var(--color-loss)]"}>
                      {h.points > 0 ? "+" : ""}
                      {h.points}
                    </span>
                  )}
                  <span className="text-xs text-white/30">{timeAgo(h.createdAt, now)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/40">No spins yet. Give it a whirl.</p>
        )}
      </section>

      {editOpen && (
        <SpotsEditor
          gameId={game._id}
          spots={spots}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

// ── Spots editor (host) ─────────────────────────────────────────────────────────
function SpotsEditor({
  gameId,
  spots,
  onClose,
}: {
  gameId: Id<"games">;
  spots: WheelSpot[];
  onClose: () => void;
}) {
  const identity = useIdentity();
  const run = useAction();
  const setSpots = useMutation(api.wheel.setSpots);
  const [rows, setRows] = useState(
    spots.map((s) => ({
      label: s.label,
      points: s.points?.toString() ?? "",
      broadcast: !!s.broadcast,
    })),
  );

  const update = (
    i: number,
    patch: Partial<{ label: string; points: string; broadcast: boolean }>,
  ) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const remove = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
  const add = () =>
    setRows((r) => [...r, { label: "", points: "", broadcast: false }]);

  const valid = rows.filter((r) => r.label.trim()).length >= 2;

  return (
    <Sheet open onClose={onClose} title="Edit the Wheel">
      <div className="space-y-3">
        <p className="text-sm text-white/55">
          Set the spots. Add a points value to auto-award (negative = penalty); leave
          blank for a dare or challenge. Toggle the{" "}
          <Icon name="bell" size={12} className="mb-0.5 inline" /> bell to buzz everyone
          to drink when a spot hits.
        </p>
        <div className="max-h-[48dvh] space-y-2 overflow-y-auto pr-1">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs text-white/35">{i + 1}</span>
              <input
                className="field flex-1 py-2"
                placeholder="Spot label"
                value={row.label}
                maxLength={24}
                onChange={(e) => update(i, { label: e.target.value })}
              />
              <input
                className="field w-16 py-2 text-center"
                placeholder="pts"
                inputMode="numeric"
                value={row.points}
                onChange={(e) => update(i, { points: e.target.value })}
              />
              <button
                type="button"
                onClick={() => update(i, { broadcast: !row.broadcast })}
                aria-pressed={row.broadcast}
                title={row.broadcast ? "Buzzes everyone to drink" : "No drink alert"}
                className={cx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
                  row.broadcast
                    ? "border-[var(--color-gold-500)]/50 bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)]"
                    : "border-white/8 bg-white/4 text-white/30 hover:text-white/60",
                )}
              >
                <Icon name="bell" size={15} />
              </button>
              <button
                className="shrink-0 px-1 text-white/40 hover:text-[var(--color-loss)]"
                onClick={() => remove(i)}
                title="Remove"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost w-full inline-flex items-center justify-center gap-1.5" onClick={add}>
          <Icon name="plus" size={16} /> Add spot
        </button>
        <button
          className="btn btn-gold w-full"
          disabled={!valid || !identity.deviceId}
          onClick={() =>
            run(
              () =>
                setSpots({
                  deviceId: identity.deviceId!,
                  gameId,
                  spots: rows
                    .filter((r) => r.label.trim())
                    .map((r) => {
                      const pts = r.points.trim() === "" ? undefined : Number(r.points);
                      return {
                        label: r.label.trim(),
                        points: pts !== undefined && !Number.isNaN(pts) ? pts : undefined,
                        broadcast: r.broadcast || undefined,
                      };
                    }),
                }),
              "Wheel updated!",
            ).then((ok) => ok && onClose())
          }
        >
          Save wheel ({rows.filter((r) => r.label.trim()).length} spots)
        </button>
      </div>
    </Sheet>
  );
}
