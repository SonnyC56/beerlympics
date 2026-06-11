"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import { Avatar, EmptyState, Spinner, cx, useAction } from "@/components/primitives";
import { Icon } from "@/components/Icon";

type Candidate = {
  userId: Id<"users">;
  name: string;
  emoji: string;
  teamName: string | null;
  teamColor: string | null;
  votes: number;
};
type PollState = {
  open: boolean;
  revealed: boolean;
  showCounts: boolean;
  myVote: Id<"users"> | null;
  totalVotes: number;
  candidates: Candidate[];
  winner: Candidate | null;
} | null;

export default function MvpPage() {
  const identity = useIdentity();
  const poll = useQuery(
    api.poll.state,
    identity.deviceId ? { deviceId: identity.deviceId } : {},
  ) as PollState | undefined;
  const vote = useMutation(api.poll.vote);
  const run = useAction();

  if (poll === undefined) return <Spinner label="Loading the ballot…" />;

  if (poll === null || (!poll.open && !poll.revealed)) {
    return (
      <div className="space-y-5">
        <Header />
        <div className="panel">
          <EmptyState
            icon="crown"
            title="Voting isn't open yet"
            subtitle="The host opens Player of the Day voting later in the day. Come back to crown the MVP!"
          />
        </div>
      </div>
    );
  }

  if (poll.revealed) {
    const w = poll.winner;
    return (
      <div className="space-y-5">
        <Header />
        {w ? (
          <div className="panel stadium-grid p-7 text-center animate-rise">
            <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-[var(--color-gold-300)]">
              Player of the Day
            </div>
            <div className="mt-3 flex justify-center">
              <Avatar emoji={w.emoji} size={84} color={w.teamColor ?? undefined} />
            </div>
            <h2 className="mt-3 font-display text-4xl text-medal">{w.name}</h2>
            {w.teamName && <p className="mt-1 text-sm text-white/55">{w.teamName}</p>}
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/60">
              <Icon name="crown" size={15} className="text-[var(--color-gold-300)]" />
              {w.votes} {w.votes === 1 ? "vote" : "votes"}
            </p>
          </div>
        ) : (
          <div className="panel p-6 text-center text-white/55">No votes were cast.</div>
        )}
        <Results candidates={poll.candidates} myVote={poll.myVote} />
      </div>
    );
  }

  // Open for voting.
  return (
    <div className="space-y-5">
      <Header />
      <div className="panel-tight flex items-center gap-2 p-3 text-sm text-white/60">
        <Icon name="bell" size={16} className="text-[var(--color-gold-300)]" />
        Tap a player to cast (or move) your vote. {poll.totalVotes} cast so far.
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {poll.candidates.map((c) => {
          const mine = poll.myVote === c.userId;
          return (
            <button
              key={c.userId}
              disabled={!identity.deviceId}
              onClick={() =>
                run(
                  () => vote({ deviceId: identity.deviceId!, nomineeUserId: c.userId }),
                  `Voted for ${c.name}!`,
                )
              }
              className={cx(
                "panel-tight flex items-center gap-3 p-3 text-left transition active:scale-[0.99]",
                mine
                  ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/10"
                  : "hover:bg-white/5",
              )}
            >
              <Avatar emoji={c.emoji} size={40} color={c.teamColor ?? undefined} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-white">{c.name}</div>
                {c.teamName && (
                  <div className="truncate text-xs text-white/45">{c.teamName}</div>
                )}
              </div>
              {poll.showCounts && (
                <span className="shrink-0 font-display text-lg tabular-nums text-white/70">
                  {c.votes}
                </span>
              )}
              {mine && (
                <span className="shrink-0 rounded-full bg-[var(--color-gold-500)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a1205]">
                  Your vote
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="font-display text-3xl text-medal">Player of the Day</h1>
        <p className="mt-1 text-sm text-white/55">Vote for the day’s MVP.</p>
      </div>
      <Icon name="crown" size={36} className="text-medal" />
    </div>
  );
}

function Results({
  candidates,
  myVote,
}: {
  candidates: Candidate[];
  myVote: Id<"users"> | null;
}) {
  const ranked = candidates.filter((c) => c.votes > 0);
  if (ranked.length === 0) return null;
  const top = ranked[0]?.votes || 1;
  return (
    <section className="space-y-2">
      <h2 className="px-1 font-display text-lg text-white/60">The tally</h2>
      {ranked.map((c) => (
        <div key={c.userId} className="panel-tight p-3">
          <div className="flex items-center gap-3">
            <Avatar emoji={c.emoji} size={32} color={c.teamColor ?? undefined} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-semibold text-white">{c.name}</span>
                {myVote === c.userId && (
                  <Icon name="check" size={13} className="text-[var(--color-gold-300)]" />
                )}
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[var(--color-gold-500)]"
                  style={{ width: `${Math.round((c.votes / top) * 100)}%` }}
                />
              </div>
            </div>
            <span className="shrink-0 font-display tabular-nums text-white/70">{c.votes}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
