"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import { Spinner, TeamBadge, cx, useAction } from "@/components/primitives";
import { Icon } from "@/components/Icon";
import { HostSectionTitle, MiniButton } from "./HostKit";
import { DrinkSiren } from "./HostSiren";
import { HostQuips } from "./HostQuips";

type TeamLite = { _id: Id<"teams">; name: string; emoji: string; color: string };

export function HostExtras() {
  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/8 bg-white/4 p-4">
        <h2 className="font-display text-lg text-white">Crowd-pleasers</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          Fire these whenever the moment calls for it — they run alongside the
          games, not in any set order. Each one casts to the TV and lights up
          everyone&apos;s phone.
        </p>
      </header>
      <DrinkSiren />
      <HostQuips />
      <Bounties />
      <PollControl />
      <PodiumControl />
    </div>
  );
}

// ── Side quests / bounties ────────────────────────────────────────────────────
type BountyRow = {
  _id: Id<"bounties">;
  title: string;
  description?: string;
  points: number;
  status: "open" | "done";
  claimTeams: TeamLite[];
  awardedTeam: TeamLite | null;
};

function Bounties() {
  const identity = useIdentity();
  const run = useAction();
  const bounties = useQuery(api.bounties.list, {}) as BountyRow[] | undefined;
  const teams = useQuery(api.teams.list, {}) as TeamLite[] | undefined;
  const create = useMutation(api.bounties.create);
  const award = useMutation(api.bounties.award);
  const remove = useMutation(api.bounties.remove);
  const reopen = useMutation(api.bounties.reopen);

  const [title, setTitle] = useState("");
  const [points, setPoints] = useState(50);
  const [desc, setDesc] = useState("");
  const [pick, setPick] = useState<Record<string, string>>({});
  const dev = identity.deviceId;

  return (
    <section className="panel p-5">
      <HostSectionTitle icon="target" title="Side Quests" />
      <p className="mb-3 text-sm text-white/55">
        Post bonus-point dares that run all day (first keg stand, best costume…).
        Teams claim them from their phones; you award the points to the winner.
      </p>

      {/* create */}
      <div className="space-y-2.5 rounded-2xl border border-white/8 bg-white/4 p-3.5">
        <input
          className="field"
          placeholder="Challenge — e.g. First keg stand"
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="field"
          placeholder="Details (optional)"
          value={desc}
          maxLength={140}
          onChange={(e) => setDesc(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-white/60">Points</label>
          <input
            type="number"
            className="field w-24 text-center"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value) || 0)}
          />
          <button
            className="btn btn-gold ml-auto px-4 py-2 text-sm"
            disabled={!dev || !title.trim()}
            onClick={() =>
              run(async () => {
                await create({
                  deviceId: dev!,
                  title: title.trim(),
                  points,
                  description: desc.trim() || undefined,
                });
                setTitle("");
                setDesc("");
              }, "Side quest posted!")
            }
          >
            <span className="flex items-center gap-1.5">
              <Icon name="plus" size={14} /> Post
            </span>
          </button>
        </div>
      </div>

      {/* list */}
      <div className="mt-4 space-y-2.5">
        {bounties === undefined ? (
          <Spinner />
        ) : bounties.length === 0 ? (
          <p className="text-sm text-white/45">No side quests yet — post one above.</p>
        ) : (
          bounties.map((b) => (
            <div
              key={b._id}
              className={cx(
                "rounded-2xl border p-3.5",
                b.status === "done"
                  ? "border-white/8 bg-white/[0.02]"
                  : "border-white/10 bg-white/4",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cx(
                        "truncate font-bold text-white",
                        b.status === "done" && "line-through decoration-white/25",
                      )}
                    >
                      {b.title}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-[var(--color-gold-300)]">
                      +{b.points}
                    </span>
                  </div>
                  {b.description && (
                    <p className="mt-0.5 text-xs text-white/45">{b.description}</p>
                  )}
                </div>
                <MiniButton
                  tone="flame"
                  disabled={!dev}
                  onClick={() => run(() => remove({ deviceId: dev!, bountyId: b._id }), "Deleted")}
                >
                  Delete
                </MiniButton>
              </div>

              {b.status === "done" ? (
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  {b.awardedTeam ? (
                    <span className="flex items-center gap-1.5 text-xs text-white/55">
                      <Icon name="trophy" size={13} className="text-[var(--color-gold-300)]" />
                      <TeamBadge
                        emoji={b.awardedTeam.emoji}
                        name={b.awardedTeam.name}
                        color={b.awardedTeam.color}
                        size="sm"
                      />
                    </span>
                  ) : (
                    <span className="text-xs text-white/40">Settled</span>
                  )}
                  <MiniButton
                    disabled={!dev}
                    onClick={() => run(() => reopen({ deviceId: dev!, bountyId: b._id }), "Reopened")}
                  >
                    Reopen
                  </MiniButton>
                </div>
              ) : (
                <div className="mt-2.5 space-y-2">
                  {b.claimTeams.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-widest text-white/35">
                        Claimed
                      </span>
                      {b.claimTeams.map((t) => (
                        <TeamBadge key={t._id} emoji={t.emoji} name={t.name} color={t.color} size="sm" />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <select
                      className="field flex-1 py-2 text-sm"
                      value={pick[b._id] ?? ""}
                      onChange={(e) => setPick((s) => ({ ...s, [b._id]: e.target.value }))}
                    >
                      <option value="">Award to…</option>
                      {(teams ?? []).map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-gold px-4 py-2 text-sm"
                      disabled={!dev || !pick[b._id]}
                      onClick={() =>
                        run(
                          () =>
                            award({
                              deviceId: dev!,
                              bountyId: b._id,
                              teamId: pick[b._id] as Id<"teams">,
                            }),
                          "Points awarded!",
                        )
                      }
                    >
                      Award
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// ── Player of the Day poll ────────────────────────────────────────────────────
type PollState = {
  open: boolean;
  revealed: boolean;
  totalVotes: number;
  candidates: { userId: string; name: string; votes: number }[];
} | null;

function PollControl() {
  const identity = useIdentity();
  const run = useAction();
  const poll = useQuery(
    api.poll.state,
    identity.deviceId ? { deviceId: identity.deviceId } : {},
  ) as PollState | undefined;
  const setOpen = useMutation(api.poll.setOpen);
  const reveal = useMutation(api.poll.reveal);
  const reset = useMutation(api.poll.reset);
  const dev = identity.deviceId;

  const leader = poll?.candidates?.find((c) => c.votes > 0) ?? null;

  return (
    <section className="panel p-5">
      <HostSectionTitle
        icon="crown"
        title="Player of the Day"
        action={
          <Link
            href="/scoreboard/tv/podium"
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--color-gold-300)] underline"
          >
            TV screen <Icon name="arrowRight" size={12} />
          </Link>
        }
      />
      <p className="mb-3 text-sm text-white/55">
        Late in the day, open voting so guests can crown the day&apos;s MVP from
        their phones. Reveal the winner on the TV — it also rides along on the
        Champion Podium screen.
      </p>
      {!poll ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                poll.revealed
                  ? "bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)]"
                  : poll.open
                    ? "bg-[var(--color-win)]/15 text-[var(--color-win)]"
                    : "bg-white/8 text-white/55",
              )}
            >
              {poll.revealed ? "Revealed" : poll.open ? "Voting open" : "Closed"}
            </span>
            <span className="text-white/45">{poll.totalVotes} votes cast</span>
          </div>
          {leader && (
            <div className="text-sm text-white/70">
              Leading: <span className="font-bold text-white">{leader.name}</span> ({leader.votes})
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              className={cx("btn", poll.open ? "btn-ghost" : "btn-gold")}
              disabled={!dev}
              onClick={() =>
                run(
                  () => setOpen({ deviceId: dev!, open: !poll.open }),
                  poll.open ? "Voting closed" : "Voting open!",
                )
              }
            >
              {poll.open ? "Close voting" : "Open voting"}
            </button>
            <button
              className="btn btn-gold"
              disabled={!dev}
              onClick={() => run(() => reveal({ deviceId: dev! }), "Revealed on the TV!")}
            >
              Reveal winner
            </button>
          </div>
          <button
            className="w-full text-center text-xs text-white/40 underline"
            disabled={!dev}
            onClick={() => run(() => reset({ deviceId: dev! }), "Poll reset")}
          >
            Reset poll (clears all votes)
          </button>
        </div>
      )}
    </section>
  );
}

// ── Champion podium (closing ceremony) ────────────────────────────────────────
type PodiumState = {
  revealedAt: number | null;
  teams: { _id: string; rank: number; name: string; total: number }[];
} | null;

function PodiumControl() {
  const identity = useIdentity();
  const run = useAction();
  const podium = useQuery(api.closing.podium, {}) as PodiumState | undefined;
  const reveal = useMutation(api.events.revealPodium);
  const hide = useMutation(api.events.hidePodium);
  const dev = identity.deviceId;
  const live = !!podium?.revealedAt;

  return (
    <section className="panel p-5">
      <HostSectionTitle
        icon="trophy"
        title="Champion Podium"
        action={
          <Link
            href="/scoreboard/tv/podium"
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--color-gold-300)] underline"
          >
            TV screen <Icon name="arrowRight" size={12} />
          </Link>
        }
      />
      <p className="mb-3 text-sm text-white/55">
        Cast the podium screen, then reveal to crown the top 3 with confetti — the
        bookend to the opening torch.
      </p>
      {podium && podium.teams.length > 0 && (
        <div className="mb-3 space-y-1">
          {podium.teams.map((t) => (
            <div key={t._id} className="flex items-center justify-between text-sm">
              <span className="text-white/70">
                <span className="font-display text-white/40">{t.rank}.</span> {t.name}
              </span>
              <span className="font-display tabular-nums text-white/60">{t.total}</span>
            </div>
          ))}
        </div>
      )}
      <button
        className={cx("btn w-full py-3.5 text-base", live ? "btn-ghost" : "btn-gold")}
        disabled={!dev}
        onClick={() =>
          live
            ? run(() => hide({ deviceId: dev! }), "Podium hidden")
            : run(() => reveal({ deviceId: dev! }), "Champions crowned!")
        }
      >
        <span className="flex items-center justify-center gap-2">
          <Icon name="trophy" size={18} />
          {live ? "Hide podium" : "Crown the champions"}
        </span>
      </button>
    </section>
  );
}
