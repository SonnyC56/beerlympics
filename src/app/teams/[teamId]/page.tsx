"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  Avatar,
  EmptyState,
  Sheet,
  Spinner,
  cx,
  useAction,
  useNow,
} from "@/components/primitives";
import { ColorPicker, EmojiPicker } from "@/components/EmojiColorPicker";
import { Icon, Mascot, Medal } from "@/components/Icon";
import type { IconName } from "@/components/icons/kit";
import { colorHex } from "@/lib/teamColors";
import { ordinal, timeAgo } from "@/lib/format";

type Member = {
  _id: Id<"players">;
  userId: Id<"users">;
  name: string;
  emoji: string;
  role: "captain" | "member";
};

type TeamDetail = {
  _id: Id<"teams">;
  name: string;
  emoji: string;
  color: string;
  theme?: string;
  motto?: string;
  walkoutSong?: string;
  seed?: number;
  captainUserId: Id<"users">;
  members: Member[];
};

type LedgerEntry = {
  _id: Id<"scoreEntries">;
  points: number;
  reason: "placement" | "win" | "bonus" | "penalty" | "manual";
  place?: number;
  note?: string;
  gameId?: Id<"games">;
  createdAt: number;
};

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const tid = teamId as Id<"teams">;
  const identity = useIdentity();
  const router = useRouter();
  const run = useAction();
  const now = useNow(30000);

  const team = useQuery(api.teams.get, { teamId: tid }) as
    | TeamDetail
    | null
    | undefined;
  const standings = useQuery(api.scoring.standings, {});
  const ledger = useQuery(api.scoring.teamLedger, { teamId: tid }) as
    | LedgerEntry[]
    | undefined;

  const leave = useMutation(api.teams.leave);
  const remove = useMutation(api.teams.remove);

  const [editOpen, setEditOpen] = useState(false);

  if (team === undefined) return <Spinner label="Loading the squad…" />;
  if (team === null) {
    return (
      <div className="py-6">
        <BackLink />
        <div className="panel mt-4">
          <EmptyState
            icon="teams"
            title="Team not found"
            subtitle="This squad may have disbanded."
            action={
              <Link
                href="/teams"
                className="btn btn-gold flex items-center justify-center gap-2"
              >
                <Icon name="arrowLeft" size={16} />
                All teams
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const hex = colorHex(team.color);
  const myUserId = identity.userId;
  const amCaptain = !!myUserId && team.captainUserId === myUserId;
  const amMember = !!myUserId && team.members.some((m) => m.userId === myUserId);
  const canEdit = amCaptain || identity.isHost;

  // Standings slice for this team (rank, total, per-game breakdown).
  const standing = standings?.teams.find((t) => t._id === team._id);
  const maxPerGame =
    standing && standing.perGame.length
      ? Math.max(1, ...standing.perGame.map((g) => Math.abs(g.points)))
      : 1;
  const scoringGames = standing?.perGame.filter((g) => g.points !== 0) ?? [];

  return (
    <div className="space-y-5">
      <BackLink />

      {/* Hero */}
      <section
        className="panel stadium-grid relative overflow-hidden p-6 text-center animate-rise"
        style={{
          borderColor: `${hex}66`,
          boxShadow: `0 0 0 1px ${hex}55, 0 26px 70px -30px ${hex}cc`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${hex}, ${hex}22)` }}
        />
        <div
          className="pointer-events-none absolute -right-10 -top-10 leading-none opacity-10"
          style={{ color: hex }}
        >
          <Mascot name={team.emoji} size={160} />
        </div>
        <div className="relative">
          <div className="flex justify-center drop-shadow">
            <Mascot name={team.emoji} size={72} />
          </div>
          <h1
            className="mt-2 font-display text-4xl leading-none"
            style={{ color: hex }}
          >
            {team.name}
          </h1>
          {team.theme && (
            <p className="mt-2 text-sm font-semibold text-white/75">
              {team.theme}
            </p>
          )}
          {team.motto && (
            <p className="mt-1 text-base italic text-white/55">“{team.motto}”</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {standing && (
              <span
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black"
                style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}55` }}
              >
                {standing.rank <= 3 ? (
                  <Medal rank={standing.rank} size={16} />
                ) : (
                  <Icon name="medalGold" size={16} />
                )}
                {ordinal(standing.rank)} place
              </span>
            )}
            {typeof team.seed === "number" && (
              <span className="chip">Seed #{team.seed}</span>
            )}
            <span className="chip flex items-center gap-1.5">
              <Icon name="teams" size={14} />
              {team.members.length}{" "}
              {team.members.length === 1 ? "player" : "players"}
            </span>
          </div>

          {standing && (
            <div className="mt-5">
              <div className="font-display text-5xl text-medal">
                {standing.total}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-white/40">
                Total points
              </div>
            </div>
          )}

          {(canEdit || amMember) && (
            <div className="mt-5 flex justify-center gap-2">
              {canEdit && (
                <button
                  className="btn btn-ghost flex items-center gap-1.5 px-4 py-2 text-sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Icon name="edit" size={14} />
                  Edit
                </button>
              )}
              {amMember && (
                <button
                  className="btn btn-ghost flex items-center gap-1.5 px-4 py-2 text-sm text-[var(--color-loss)]"
                  disabled={!identity.deviceId}
                  onClick={() =>
                    run(
                      () => leave({ deviceId: identity.deviceId! }),
                      "Left the team.",
                    ).then((ok) => ok && router.push("/teams"))
                  }
                >
                  <Icon name="arrowLeft" size={14} />
                  Leave
                </button>
              )}
              {identity.isHost && (
                <button
                  className="btn btn-ghost flex items-center gap-1.5 px-4 py-2 text-sm text-[var(--color-loss)]"
                  disabled={!identity.deviceId}
                  onClick={() => {
                    if (
                      !confirm(
                        `Disband “${team.name}”? This frees all members and removes the team.`,
                      )
                    )
                      return;
                    run(
                      () =>
                        remove({
                          deviceId: identity.deviceId!,
                          teamId: team._id,
                        }),
                      "Team disbanded.",
                    ).then((ok) => ok && router.push("/teams"));
                  }}
                >
                  <Icon name="trash" size={14} />
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Roster */}
      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          <Icon name="teams" size={20} />
          Roster
        </h2>
        {team.members.length === 0 ? (
          <p className="text-sm text-white/45">
            No players yet — this squad is looking for recruits.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...team.members]
              .sort((a, b) =>
                a.role === b.role ? 0 : a.role === "captain" ? -1 : 1,
              )
              .map((m) => {
                const isMe = !!myUserId && m.userId === myUserId;
                return (
                  <li
                    key={m._id}
                    className={cx(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                      isMe ? "bg-white/8" : "bg-white/4",
                    )}
                  >
                    <Avatar emoji={m.emoji} size={38} color={team.color} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-white">
                        {m.name}
                        {isMe && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                    {m.role === "captain" && (
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
                        style={{
                          background: `${hex}22`,
                          color: hex,
                          border: `1px solid ${hex}55`,
                        }}
                      >
                        <Icon name="crown" size={12} />
                        Captain
                      </span>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* Scoring breakdown */}
      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          <Icon name="chart" size={20} />
          Points by Game
        </h2>
        {standings === undefined ? (
          <Spinner />
        ) : scoringGames.length === 0 ? (
          <p className="text-sm text-white/45">
            No points on the board yet. Win some games to climb the standings.
          </p>
        ) : (
          <div className="space-y-3">
            {scoringGames.map((g) => {
              const pct = Math.round((Math.abs(g.points) / maxPerGame) * 100);
              const negative = g.points < 0;
              return (
                <div key={g.gameId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/80">
                      <Icon name="games" size={18} />
                      <span className="truncate">{g.name}</span>
                    </span>
                    <span
                      className="font-display text-lg"
                      style={{ color: negative ? "var(--color-loss)" : hex }}
                    >
                      {negative ? "" : "+"}
                      {g.points}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: negative
                          ? "var(--color-loss)"
                          : `linear-gradient(90deg, ${hex}, ${hex}aa)`,
                        boxShadow: `0 0 12px ${negative ? "#ff5c5c" : hex}66`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Points history / ledger */}
      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          <Icon name="clipboard" size={20} />
          Points History
        </h2>
        {ledger === undefined ? (
          <Spinner />
        ) : ledger.length === 0 ? (
          <p className="text-sm text-white/45">
            No points recorded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {ledger.slice(0, 30).map((entry) => (
              <li
                key={entry._id}
                className="flex items-center gap-3 rounded-2xl bg-white/4 px-3 py-2.5"
              >
                <span className="flex items-center text-xl">
                  <LedgerIcon entry={entry} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white/85">
                    {ledgerLabel(entry)}
                  </div>
                  <div className="text-xs text-white/40">
                    {timeAgo(entry.createdAt, now)}
                  </div>
                </div>
                <span
                  className="shrink-0 font-display text-lg"
                  style={{
                    color:
                      entry.points < 0 ? "var(--color-loss)" : "var(--color-win)",
                  }}
                >
                  {entry.points > 0 ? "+" : ""}
                  {entry.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canEdit && (
        <EditTeamSheet
          open={editOpen}
          team={team}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/teams"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white"
    >
      <Icon name="arrowLeft" size={14} />
      All teams
    </Link>
  );
}

function LedgerIcon({ entry }: { entry: LedgerEntry }) {
  if (entry.reason === "placement") {
    if (entry.place && entry.place <= 3) {
      return <Medal rank={entry.place} size={20} />;
    }
    return <Icon name="target" size={20} />;
  }
  const name: IconName =
    entry.reason === "win"
      ? "trophy"
      : entry.reason === "bonus"
        ? "sparkle"
        : entry.reason === "penalty"
          ? "warning"
          : "pencil";
  return <Icon name={name} size={20} />;
}

function ledgerLabel(entry: LedgerEntry): string {
  if (entry.note) return entry.note;
  switch (entry.reason) {
    case "placement":
      return entry.place
        ? `${ordinal(entry.place)} place finish`
        : "Placement points";
    case "win":
      return "Match win bonus";
    case "bonus":
      return "Bonus points";
    case "penalty":
      return "Penalty";
    case "manual":
      return "Manual adjustment";
    default:
      return "Points";
  }
}

// ── Edit team sheet ───────────────────────────────────────────────────────────
function EditTeamSheet({
  open,
  team,
  onClose,
}: {
  open: boolean;
  team: TeamDetail;
  onClose: () => void;
}) {
  const identity = useIdentity();
  const run = useAction();
  const update = useMutation(api.teams.update);

  const [name, setName] = useState(team.name);
  const [theme, setTheme] = useState(team.theme ?? "");
  const [motto, setMotto] = useState(team.motto ?? "");
  const [walkoutSong, setWalkoutSong] = useState(team.walkoutSong ?? "");
  const [color, setColor] = useState(team.color);
  const [emoji, setEmoji] = useState(team.emoji);

  const valid = name.trim().length > 0;
  const hex = colorHex(color);

  async function submit() {
    if (!identity.deviceId || !valid) return;
    const ok = await run(
      () =>
        update({
          deviceId: identity.deviceId!,
          teamId: team._id,
          patch: {
            name: name.trim(),
            theme: theme.trim(),
            motto: motto.trim(),
            walkoutSong: walkoutSong.trim(),
            color,
            emoji,
          },
        }),
      "Team updated!",
    );
    if (ok) onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Team">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/4 p-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: `${hex}1f`, border: `1px solid ${hex}66` }}
          >
            <Mascot name={emoji} size={26} />
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-xl text-white">
              {name.trim() || "Team name"}
            </div>
            {(theme || motto) && (
              <div className="truncate text-xs text-white/55">
                {theme}
                {theme && motto ? " · " : ""}
                {motto ? `“${motto}”` : ""}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white/70">
            Team name
          </label>
          <input
            className="field"
            value={name}
            maxLength={28}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white/70">
            Theme (optional)
          </label>
          <input
            className="field"
            placeholder="Pirates, neon, retro…"
            value={theme}
            maxLength={32}
            onChange={(e) => setTheme(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white/70">
            Motto (optional)
          </label>
          <input
            className="field"
            placeholder="Sip happens."
            value={motto}
            maxLength={48}
            onChange={(e) => setMotto(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/70">
            <Icon name="mic" size={14} /> Walk-out song (optional)
          </label>
          <input
            className="field"
            placeholder="Eye of the Tiger — Survivor"
            value={walkoutSong}
            maxLength={60}
            onChange={(e) => setWalkoutSong(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-white/40">
            Plays when your team is announced in the opening ceremony.
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70">
            Color
          </label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70">
            Team mascot
          </label>
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>

        <button
          className="btn btn-gold w-full"
          disabled={!valid || !identity.deviceId}
          onClick={submit}
        >
          <span className="flex items-center justify-center gap-2">
            <Icon name="save" size={16} />
            Save changes
          </span>
        </button>
      </div>
    </Sheet>
  );
}
