"use client";

import { useState } from "react";
import { TeamBadge, cx } from "@/components/primitives";
import { Icon, Medal, Mascot } from "@/components/Icon";
import { GameArt } from "@/components/gameArt";
import { colorHex } from "@/lib/teamColors";

/** Shared shape used by both the scoreboard page and TV mode. */
export type StandingTeam = {
  _id: string;
  name: string;
  emoji: string;
  color: string;
  theme?: string;
  motto?: string;
  total: number;
  rank: number;
  lastAt: number;
  perGame: { gameId: string; name: string; emoji: string; art?: string; points: number }[];
};

/** Bar width as a % of the leader's total (min 4% so a row is always visible). */
function barPct(total: number, leader: number): number {
  if (leader <= 0) return total > 0 ? 100 : 0;
  return Math.max(total > 0 ? 6 : 0, Math.round((total / leader) * 100));
}

/**
 * A single ranked, expandable leaderboard row with a color points bar.
 * Used on the interactive /scoreboard page.
 */
function LeaderRow({
  team,
  leader,
  index,
  expanded,
  onToggle,
}: {
  team: StandingTeam;
  leader: number;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hex = colorHex(team.color);
  const pct = barPct(team.total, leader);
  const scored = team.perGame.filter((g) => g.points !== 0);

  return (
    <li
      className="animate-rise"
      style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cx(
          "panel-tight w-full overflow-hidden p-0 text-left transition",
          "hover:border-white/20",
          team.rank === 1 && "ring-1 ring-[var(--color-gold-500)]/40",
        )}
        style={
          team.rank === 1
            ? { boxShadow: `0 0 0 1px ${hex}22, 0 18px 50px -28px ${hex}` }
            : undefined
        }
      >
        <div className="flex items-center gap-3 px-3.5 py-3">
          {/* Rank */}
          <div className="flex w-9 shrink-0 items-center justify-center">
            {team.rank <= 3 ? (
              <Medal rank={team.rank} size={24} />
            ) : (
              <span className="font-display text-xl tabular-nums text-white/40">
                {team.rank}
              </span>
            )}
          </div>

          {/* Name + bar */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <TeamBadge
                emoji={team.emoji}
                name={team.name}
                color={team.color}
                className="min-w-0"
              />
              <span
                className="shrink-0 font-display text-2xl tabular-nums leading-none"
                style={{ color: hex }}
              >
                {team.total}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${hex}aa, ${hex})`,
                  boxShadow: `0 0 14px ${hex}66`,
                }}
              />
            </div>
          </div>

          {/* Expand chevron */}
          <span
            className={cx(
              "shrink-0 text-white/30 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          >
            <Icon name="chevronDown" size={16} />
          </span>
        </div>

        {/* Per-game breakdown */}
        {expanded && (
          <div className="border-t border-white/8 bg-black/25 px-3.5 py-3 animate-rise">
            {team.motto && (
              <p className="mb-2 text-xs italic text-white/45">
                &ldquo;{team.motto}&rdquo;
              </p>
            )}
            {scored.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {scored.map((g) => (
                  <span
                    key={g.gameId}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-sm"
                  >
                    <GameArt artKey={g.art} size={16} />
                    <span className="text-white/55">{g.name}</span>
                    <span className="font-display tabular-nums text-[var(--color-gold-300)]">
                      {g.points}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No points scored yet.</p>
            )}
          </div>
        )}
      </button>
    </li>
  );
}

/** The full interactive leaderboard for /scoreboard. */
export function Leaderboard({ teams }: { teams: StandingTeam[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const leader = teams[0]?.total ?? 0;

  return (
    <ul className="space-y-2.5">
      {teams.map((t, i) => (
        <LeaderRow
          key={t._id}
          team={t}
          index={i}
          leader={leader}
          expanded={open === t._id}
          onToggle={() => setOpen((cur) => (cur === t._id ? null : t._id))}
        />
      ))}
    </ul>
  );
}

/** Celebratory podium shown when the event is finished. */
export function Podium({ teams }: { teams: StandingTeam[] }) {
  const top3 = teams.slice(0, 3);
  if (top3.length === 0) return null;
  // Render order: 2nd, 1st, 3rd so the champion sits center + tallest.
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as StandingTeam[];
  const heights: Record<number, string> = { 1: "h-28", 2: "h-20", 3: "h-14" };

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4">
      {order.map((t) => {
        const hex = colorHex(t.color);
        const champ = t.rank === 1;
        return (
          <div
            key={t._id}
            className="flex min-w-0 flex-1 flex-col items-center animate-rise"
          >
            <div className={cx("flex items-center justify-center", champ && "animate-float")}>
              <Medal rank={t.rank} size={28} />
            </div>
            <div className="mt-1 flex max-w-full items-center justify-center gap-1.5 truncate text-center text-sm font-bold">
              <Mascot name={t.emoji} size={16} />
              <span className="truncate">{t.name}</span>
            </div>
            <div
              className="font-display text-2xl leading-none"
              style={{ color: hex }}
            >
              {t.total}
            </div>
            <div
              className={cx(
                "mt-2 w-full rounded-t-xl border-x border-t",
                heights[t.rank] ?? "h-12",
              )}
              style={{
                background: `linear-gradient(180deg, ${hex}38, ${hex}10)`,
                borderColor: `${hex}55`,
                boxShadow: `0 -10px 40px -20px ${hex}`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
