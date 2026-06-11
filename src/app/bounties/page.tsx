"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import { EmptyState, Spinner, TeamBadge, cx, useAction } from "@/components/primitives";
import { Icon } from "@/components/Icon";

type ClaimTeam = { _id: Id<"teams">; name: string; emoji: string; color: string };
type Bounty = {
  _id: Id<"bounties">;
  title: string;
  description?: string;
  points: number;
  status: "open" | "done";
  claimTeams: ClaimTeam[];
  awardedTeam: ClaimTeam | null;
};

export default function BountiesPage() {
  const identity = useIdentity();
  const bounties = useQuery(api.bounties.list, {}) as Bounty[] | undefined;
  const mine = useQuery(
    api.rsvp.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  );
  const claim = useMutation(api.bounties.claim);
  const run = useAction();

  if (bounties === undefined) return <Spinner label="Loading the side quests…" />;

  const myTeamId = (mine as { player?: { teamId?: Id<"teams"> } } | null | undefined)
    ?.player?.teamId;
  const open = bounties.filter((b) => b.status === "open");
  const done = bounties.filter((b) => b.status === "done");

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-medal">Side Quests</h1>
          <p className="mt-1 text-sm text-white/55">
            Bonus-point challenges running all day. Pull them off, then tap “We did it!”
          </p>
        </div>
        <Icon name="target" size={36} className="text-medal" />
      </div>

      {bounties.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="target"
            title="No side quests yet"
            subtitle="The host drops bonus challenges here during the day. Check back!"
          />
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <section className="space-y-3">
              {open.map((b) => {
                const claimed = !!myTeamId && b.claimTeams.some((t) => t._id === myTeamId);
                return (
                  <div key={b._id} className="panel p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl text-white">{b.title}</h3>
                        {b.description && (
                          <p className="mt-1 text-sm text-white/55">{b.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-[var(--color-gold-500)]/15 px-3 py-1 font-display text-lg text-[var(--color-gold-300)]">
                        +{b.points}
                      </span>
                    </div>

                    {b.claimTeams.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] uppercase tracking-widest text-white/35">
                          Claimed by
                        </span>
                        {b.claimTeams.map((t) => (
                          <TeamBadge key={t._id} emoji={t.emoji} name={t.name} color={t.color} size="sm" />
                        ))}
                      </div>
                    )}

                    {myTeamId ? (
                      <button
                        className={cx(
                          "btn mt-4 w-full",
                          claimed ? "btn-ghost" : "btn-gold",
                        )}
                        disabled={!identity.deviceId}
                        onClick={() =>
                          run(
                            () => claim({ deviceId: identity.deviceId!, bountyId: b._id }),
                            claimed ? "Claim withdrawn" : "Claim sent to the host!",
                          )
                        }
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Icon name={claimed ? "close" : "check"} size={16} />
                          {claimed ? "Withdraw claim" : "We did it!"}
                        </span>
                      </button>
                    ) : (
                      <p className="mt-3 text-xs text-white/40">Join a team to claim bounties.</p>
                    )}
                    {myTeamId && claimed && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-white/45">
                        <Icon name="clock" size={13} className="shrink-0 text-[var(--color-gold-300)]" />
                        Flagged for the host — points land once they confirm it.
                      </p>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {done.length > 0 && (
            <section className="space-y-2">
              <h2 className="px-1 font-display text-lg text-white/60">Settled</h2>
              {done.map((b) => (
                <div key={b._id} className="panel-tight flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white/80 line-through decoration-white/20">
                      {b.title}
                    </div>
                    {b.awardedTeam && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
                        <Icon name="trophy" size={13} className="text-[var(--color-gold-300)]" />
                        Won by
                        <TeamBadge
                          emoji={b.awardedTeam.emoji}
                          name={b.awardedTeam.name}
                          color={b.awardedTeam.color}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 font-display text-white/40">+{b.points}</span>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
