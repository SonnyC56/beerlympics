"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  Sheet,
  Spinner,
  cx,
  useAction,
} from "@/components/primitives";
import type { ReactNode } from "react";
import { EmojiPicker } from "@/components/EmojiColorPicker";
import { GameArt } from "@/components/gameArt";
import { Icon } from "@/components/Icon";
import { categoryLabel } from "@/lib/format";
import { HostField, MiniButton, StatusDot } from "./HostKit";

/** Section header with a leading SVG icon (emoji-free). */
function SectionTitle({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5 font-display text-xl text-white">
        <span className="inline-flex shrink-0">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

type Game = {
  _id: Id<"games">;
  name: string;
  emoji: string;
  category: string;
  description?: string;
  art?: string;
  enabled?: boolean;
  format: "single_elim" | "round_robin" | "heats" | "ladder" | "wheel" | "special";
  teamsPerMatch: number;
  pointsMultiplier: number;
  estMinutes: number;
  isGated: boolean;
  gateFromPhaseIndex?: number;
  status: "scheduled" | "active" | "completed" | "locked";
};

type Station = {
  _id: Id<"stations">;
  name: string;
  status: "open" | "busy" | "closed";
  gameId: Id<"games">;
  game: { _id: Id<"games">; name: string; emoji: string; art?: string } | null;
};

const CATEGORIES = ["drinking", "lawn"] as const;
const FORMATS = ["single_elim", "round_robin", "heats", "wheel", "special"] as const;

export function HostGames() {
  const identity = useIdentity();
  const run = useAction();
  const setEnabled = useMutation(api.games.setEnabled);
  const games = useQuery(api.games.list, {}) as Game[] | undefined;
  const stations = useQuery(api.stations.list, {}) as Station[] | undefined;

  const [editing, setEditing] = useState<Game | null>(null);
  const [creating, setCreating] = useState(false);

  const enabledCount = (games ?? []).filter((g) => g.enabled !== false).length;

  return (
    <div className="space-y-5">
      {/* ── Games ──────────────────────────────────────────────────────── */}
      <section className="panel p-5">
        <SectionTitle
          icon={<Icon name="games" size={20} />}
          title="Games"
          action={
            <button
              className="btn btn-gold inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              onClick={() => setCreating(true)}
            >
              <Icon name="plus" size={14} /> New
            </button>
          }
        />
        {games === undefined ? (
          <Spinner />
        ) : games.length === 0 ? (
          <p className="text-sm text-white/45">
            No games yet. Add your first event game to build the circuit.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-white/45">
              <span className="font-bold text-[var(--color-gold-300)]">{enabledCount}</span>{" "}
              of {games.length} games in the lineup — toggle to include / exclude.
            </p>
            <div className="space-y-2.5">
              {games.map((g) => {
                const off = g.enabled === false;
                return (
                  <div
                    key={g._id}
                    className={cx(
                      "flex items-center gap-3 rounded-2xl border p-3 transition",
                      off
                        ? "border-white/8 bg-white/[0.02] opacity-60"
                        : "border-white/8 bg-white/4",
                    )}
                  >
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => setEditing(g)}
                    >
                      <span className="shrink-0 rounded-xl bg-black/30 p-1 ring-1 ring-white/8">
                        <GameArt artKey={g.art} size={38} title={g.name} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-bold text-white">
                          {g.name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-white/45">
                          <span className="chip">{categoryLabel(g.category)}</span>
                          <span>{g.format.replace("_", " ")}</span>
                          {g.isGated && (
                            <span className="inline-flex items-center gap-1 text-[var(--color-gold-300)]">
                              <Icon name="lock" size={12} /> gated
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!off}
                        title={off ? "Excluded — tap to include" : "Included — tap to exclude"}
                        disabled={!identity.deviceId}
                        onClick={() =>
                          run(
                            () =>
                              setEnabled({
                                deviceId: identity.deviceId!,
                                gameId: g._id,
                                enabled: off,
                              }),
                            off ? `${g.name} added to the lineup` : `${g.name} excluded`,
                          )
                        }
                        className={cx(
                          "relative h-6 w-11 rounded-full transition",
                          off ? "bg-white/12" : "bg-[var(--color-win)]/70",
                        )}
                      >
                        <span
                          className={cx(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                            off ? "left-0.5" : "left-[1.4rem]",
                          )}
                        />
                      </button>
                      <button
                        className="text-xs font-bold text-[var(--color-gold-400)]"
                        onClick={() => setEditing(g)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Stations ───────────────────────────────────────────────────── */}
      <StationsPanel stations={stations} games={games} />

      {/* ── Sheets ─────────────────────────────────────────────────────── */}
      <GameSheet
        open={creating}
        onClose={() => setCreating(false)}
        game={null}
      />
      <GameSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        game={editing}
      />
    </div>
  );
}

// ── Stations ──────────────────────────────────────────────────────────────────
function StationsPanel({
  stations,
  games,
}: {
  stations: Station[] | undefined;
  games: Game[] | undefined;
}) {
  const identity = useIdentity();
  const run = useAction();
  const create = useMutation(api.stations.create);
  const setStatus = useMutation(api.stations.setStatus);
  const remove = useMutation(api.stations.remove);

  const [name, setName] = useState("");
  const [gameId, setGameId] = useState<Id<"games"> | "">("");

  useEffect(() => {
    if (games && games.length > 0 && !gameId) setGameId(games[0]._id);
  }, [games, gameId]);

  return (
    <section className="panel p-5">
      <SectionTitle icon={<Icon name="pin" size={20} />} title="Stations" />

      {games && games.length > 0 ? (
        <div className="mb-4 space-y-2.5 rounded-2xl border border-white/8 bg-white/4 p-3.5">
          <HostField label="Add a station">
            <input
              className="field"
              placeholder="Station name (e.g. Pong Table 1)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
            />
          </HostField>
          <div className="flex gap-2">
            <select
              className="field flex-1"
              value={gameId}
              onChange={(e) => setGameId(e.target.value as Id<"games">)}
            >
              {games.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-gold shrink-0"
              disabled={!identity.deviceId || !name.trim() || !gameId}
              onClick={() =>
                run(async () => {
                  await create({
                    deviceId: identity.deviceId!,
                    name: name.trim(),
                    gameId: gameId as Id<"games">,
                  });
                  setName("");
                }, "Station added")
              }
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm text-white/45">
          Add a game first, then create stations to run it on.
        </p>
      )}

      {stations === undefined ? (
        <Spinner />
      ) : stations.length === 0 ? (
        <p className="text-sm text-white/45">No stations yet.</p>
      ) : (
        <div className="space-y-2">
          {stations.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-white/8 bg-white/4 px-3.5 py-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-lg text-white/80">
                  {s.game ? (
                    <GameArt artKey={s.game.art} size={20} title={s.game.name} />
                  ) : (
                    <Icon name="target" size={20} />
                  )}
                </span>
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
                  <>
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
                          s.status === "open" ? "Closed" : "Opened",
                        )
                      }
                    >
                      {s.status === "open" ? "Close" : "Open"}
                    </MiniButton>
                    <MiniButton
                      tone="flame"
                      disabled={!identity.deviceId}
                      onClick={() =>
                        run(
                          () =>
                            remove({
                              deviceId: identity.deviceId!,
                              stationId: s._id,
                            }),
                          "Station deleted",
                        )
                      }
                    >
                      <Icon name="close" size={14} />
                    </MiniButton>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Game create / edit sheet ──────────────────────────────────────────────────
function GameSheet({
  open,
  onClose,
  game,
}: {
  open: boolean;
  onClose: () => void;
  game: Game | null;
}) {
  const identity = useIdentity();
  const run = useAction();
  const create = useMutation(api.games.create);
  const update = useMutation(api.games.update);
  const remove = useMutation(api.games.remove);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("beer");
  const [category, setCategory] = useState<Game["category"]>("beer");
  const [format, setFormat] = useState<Game["format"]>("single_elim");
  const [description, setDescription] = useState("");
  const [teamsPerMatch, setTeamsPerMatch] = useState(2);
  const [pointsMultiplier, setPointsMultiplier] = useState(1);
  const [estMinutes, setEstMinutes] = useState(12);
  const [isGated, setIsGated] = useState(false);
  const [gatePhase, setGatePhase] = useState(2);

  useEffect(() => {
    if (!open) return;
    setName(game?.name ?? "");
    setEmoji(game?.emoji ?? "beer");
    setCategory(game?.category ?? "beer");
    setFormat(game?.format ?? "single_elim");
    setDescription(game?.description ?? "");
    setTeamsPerMatch(game?.teamsPerMatch ?? 2);
    setPointsMultiplier(game?.pointsMultiplier ?? 1);
    setEstMinutes(game?.estMinutes ?? 12);
    setIsGated(game?.isGated ?? false);
    setGatePhase(game?.gateFromPhaseIndex ?? 2);
  }, [open, game]);

  const save = () => {
    if (!identity.deviceId || !name.trim()) return;
    const payload = {
      name: name.trim(),
      emoji,
      category,
      format,
      description: description.trim() || undefined,
      teamsPerMatch,
      pointsMultiplier,
      estMinutes,
      isGated,
      gateFromPhaseIndex: isGated ? gatePhase : undefined,
    };
    if (game) {
      run(
        () =>
          update({
            deviceId: identity.deviceId!,
            gameId: game._id,
            patch: payload,
          }),
        "Game updated",
      ).then((ok) => ok && onClose());
    } else {
      run(
        () => create({ deviceId: identity.deviceId!, ...payload }),
        "Game created",
      ).then((ok) => ok && onClose());
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={game ? "Edit Game" : "New Game"}>
      <div className="space-y-5">
        <HostField label="Name">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Beer Pong"
            maxLength={40}
          />
        </HostField>

        <HostField label="Mascot">
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </HostField>

        <HostField label="Category">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cx(
                  "rounded-xl border px-2 py-2.5 text-sm font-bold capitalize transition",
                  category === c
                    ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)]"
                    : "border-white/10 bg-white/4 text-white/60",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </HostField>

        <HostField label="Format">
          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cx(
                  "rounded-xl border px-2 py-2.5 text-sm font-bold transition",
                  format === f
                    ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)]"
                    : "border-white/10 bg-white/4 text-white/60",
                )}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </HostField>

        <HostField label="Description" hint="optional">
          <textarea
            className="field min-h-20 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How it's played, house rules…"
            maxLength={400}
          />
        </HostField>

        <div className="grid grid-cols-3 gap-3">
          <HostField label="Teams / match">
            <input
              type="number"
              min={2}
              max={8}
              className="field text-center"
              value={teamsPerMatch}
              onChange={(e) =>
                setTeamsPerMatch(Math.max(2, Number(e.target.value) || 2))
              }
            />
          </HostField>
          <HostField label="Multiplier">
            <input
              type="number"
              min={0.5}
              max={5}
              step={0.5}
              className="field text-center"
              value={pointsMultiplier}
              onChange={(e) =>
                setPointsMultiplier(Math.max(0.5, Number(e.target.value) || 1))
              }
            />
          </HostField>
          <HostField label="Est. min">
            <input
              type="number"
              min={1}
              max={120}
              className="field text-center"
              value={estMinutes}
              onChange={(e) =>
                setEstMinutes(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </HostField>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/4 p-3.5">
          <label className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Icon name="lock" size={16} /> Gated game
              </div>
              <div className="text-xs text-white/45">
                Stays locked until a later phase (e.g. the Beer Die finale).
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGated((v) => !v)}
              className={cx(
                "relative h-7 w-12 shrink-0 rounded-full transition",
                isGated ? "bg-[var(--color-gold-500)]" : "bg-white/15",
              )}
              aria-pressed={isGated}
            >
              <span
                className={cx(
                  "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                  isGated ? "left-6" : "left-1",
                )}
              />
            </button>
          </label>
          {isGated && (
            <div className="mt-3">
              <HostField label="Unlock from phase #" hint="1-based">
                <input
                  type="number"
                  min={1}
                  max={9}
                  className="field w-24 text-center"
                  value={gatePhase + 1}
                  onChange={(e) =>
                    setGatePhase(Math.max(0, (Number(e.target.value) || 1) - 1))
                  }
                />
              </HostField>
            </div>
          )}
        </div>

        <button
          className="btn btn-gold w-full"
          disabled={!identity.deviceId || !name.trim()}
          onClick={save}
        >
          {game ? "Save changes" : "Create game"}
        </button>

        {game && (
          <button
            className="w-full text-center text-sm font-bold text-[var(--color-loss)]"
            onClick={() =>
              run(
                () =>
                  remove({ deviceId: identity.deviceId!, gameId: game._id }),
                "Game deleted",
              ).then((ok) => ok && onClose())
            }
          >
            Delete this game
          </button>
        )}
      </div>
    </Sheet>
  );
}
