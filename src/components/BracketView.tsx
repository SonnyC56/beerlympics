"use client";

import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { TeamBadge, cx } from "@/components/primitives";
import { Icon } from "@/components/Icon";
import { colorHex } from "@/lib/teamColors";

/** Host-only per-match management actions (change/undo a result, unseat). */
export type MatchManage = {
  isHost: boolean;
  onChangeResult: (m: BracketMatch) => void;
  onUndo: (m: BracketMatch) => void;
  onUnseat: (m: BracketMatch) => void;
};

// ── Shared match shape (from matches.forGame) ─────────────────────────────────
export type BracketTeam = {
  _id: Id<"teams">;
  name: string;
  emoji: string;
  color: string;
};

export type BracketMatch = {
  _id: Id<"matches">;
  round: number;
  slot: number;
  label?: string;
  bracket?: string;
  status: "pending" | "ready" | "queued" | "in_progress" | "completed" | "void";
  teamIds: Id<"teams">[];
  winnerTeamId?: Id<"teams">;
  stationId?: Id<"stations">;
  teams: BracketTeam[];
};

// ── Status presentation ───────────────────────────────────────────────────────
const STATUS_META: Record<
  BracketMatch["status"],
  { label: string; tone: string; live?: boolean }
> = {
  pending: { label: "Awaiting teams", tone: "text-white/40" },
  ready: { label: "Up next", tone: "text-[var(--color-gold-300)]" },
  queued: { label: "On deck", tone: "text-[var(--color-cyan)]" },
  in_progress: { label: "Live", tone: "text-[var(--color-live)]", live: true },
  completed: { label: "Final", tone: "text-[var(--color-win)]" },
  void: { label: "Void", tone: "text-white/30" },
};

function StatusPill({ status }: { status: BracketMatch["status"] }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest",
        meta.tone,
      )}
    >
      {meta.live && <span className="live-dot" />}
      {meta.label}
    </span>
  );
}

// ── A single competitor row inside a match node ───────────────────────────────
function SlotRow({
  team,
  isWinner,
  decided,
  placeBadge,
}: {
  team: BracketTeam | null;
  isWinner: boolean;
  decided: boolean;
  placeBadge?: string;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/30">
        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/15" />
        <span className="font-semibold italic">TBD</span>
      </div>
    );
  }
  const hex = colorHex(team.color);
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-2 px-3 py-2 transition",
        isWinner ? "bg-white/[0.06]" : decided ? "opacity-45" : "",
      )}
      style={isWinner ? { boxShadow: `inset 3px 0 0 ${hex}` } : undefined}
    >
      <TeamBadge
        emoji={team.emoji}
        name={team.name}
        color={team.color}
        size="sm"
      />
      <span className="shrink-0 text-sm">
        {placeBadge ? (
          <span>{placeBadge}</span>
        ) : isWinner ? (
          <Icon name="check" size={14} className="text-[var(--color-gold-400)]" />
        ) : null}
      </span>
    </div>
  );
}

// ── One match node (single elim bracket cell) ─────────────────────────────────
export function MatchNode({
  match,
  stationName,
  canReport,
  onReport,
  manage,
}: {
  match: BracketMatch;
  stationName?: string;
  canReport?: boolean;
  onReport?: () => void;
  manage?: MatchManage;
}) {
  const [confirmUndo, setConfirmUndo] = useState(false);
  const decided = match.status === "completed";
  const teamsPerMatch = Math.max(2, match.teamIds.length, match.teams.length);
  const slots: (BracketTeam | null)[] = [];
  for (let i = 0; i < teamsPerMatch; i++) slots.push(match.teams[i] ?? null);

  return (
    <div
      className={cx(
        "overflow-hidden rounded-2xl border bg-black/25",
        match.status === "in_progress"
          ? "border-[var(--color-live)]/50 shadow-[0_0_24px_-8px_rgba(255,59,107,0.6)]"
          : decided
            ? "border-[var(--color-win)]/25"
            : "border-white/10",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/8 px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/55">
          {match.label ?? `Match ${match.slot + 1}`}
        </span>
        <StatusPill status={match.status} />
      </div>
      <div className="divide-y divide-white/5">
        {slots.map((team, i) => (
          <SlotRow
            key={team?._id ?? `tbd-${i}`}
            team={team}
            isWinner={!!team && match.winnerTeamId === team._id}
            decided={decided}
          />
        ))}
      </div>
      {stationName && (match.status === "in_progress" || match.status === "queued") && (
        <div className="flex items-center gap-1 border-t border-white/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/45">
          <Icon name="pin" size={12} /> {stationName}
        </div>
      )}
      {canReport && onReport && (
        <button
          type="button"
          onClick={onReport}
          className="flex w-full items-center justify-center gap-1.5 border-t border-white/8 bg-[var(--color-gold-500)]/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-gold-300)] transition hover:bg-[var(--color-gold-500)]/20 active:scale-[0.99]"
        >
          <Icon name="finish" size={13} /> Report result
        </button>
      )}

      {/* Host: fix a completed match (change winner / undo). */}
      {manage?.isHost && match.status === "completed" && (
        <div className="flex border-t border-white/8 text-[10px] font-black uppercase tracking-widest">
          <button
            type="button"
            onClick={() => manage.onChangeResult(match)}
            className="flex flex-1 items-center justify-center gap-1.5 border-r border-white/8 px-3 py-2 text-white/55 transition hover:bg-white/5 hover:text-white"
          >
            <Icon name="edit" size={12} /> Change
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirmUndo) {
                manage.onUndo(match);
                setConfirmUndo(false);
              } else {
                setConfirmUndo(true);
              }
            }}
            className={cx(
              "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 transition",
              confirmUndo
                ? "bg-[var(--color-loss)]/15 text-[var(--color-loss)]"
                : "text-white/55 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon name={confirmUndo ? "warning" : "refresh"} size={12} />
            {confirmUndo ? "Confirm undo" : "Undo"}
          </button>
        </div>
      )}

      {/* Host: pull an in-progress match back to the queue. */}
      {manage?.isHost && match.status === "in_progress" && (
        <button
          type="button"
          onClick={() => manage.onUnseat(match)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-white/8 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:bg-white/5 hover:text-white"
        >
          <Icon name="arrowLeft" size={12} /> Send back to queue
        </button>
      )}
    </div>
  );
}

// ── Single-elimination bracket — horizontally-scrolling round columns ─────────
export function SingleElimBracket({
  matches,
  stationNameFor,
  canReport,
  onReport,
  manage,
}: {
  matches: BracketMatch[];
  stationNameFor?: (m: BracketMatch) => string | undefined;
  canReport?: (m: BracketMatch) => boolean;
  onReport?: (m: BracketMatch) => void;
  manage?: MatchManage;
}) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const roundTitle = (round: number, idx: number) => {
    // Prefer the engine-provided label (e.g. "Final", "Semifinal").
    const sample = matches.find((m) => m.round === round);
    return sample?.label && idx === rounds.length - 1
      ? "Final"
      : sample?.label ?? `Round ${round}`;
  };

  return (
    <div className="-mx-1 overflow-x-auto pb-2 no-scrollbar">
      <div className="flex min-w-max gap-4 px-1 sm:gap-6">
        {rounds.map((round, idx) => {
          const col = matches
            .filter((m) => m.round === round)
            .sort((a, b) => a.slot - b.slot);
          return (
            <div
              key={round}
              className="flex w-[15rem] shrink-0 flex-col sm:w-[16rem]"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="font-display text-sm tracking-wider text-[var(--color-gold-400)]">
                  {roundTitle(round, idx)}
                </span>
                <span className="text-[11px] text-white/35">
                  {col.length} {col.length === 1 ? "match" : "matches"}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {col.map((m) => (
                  <MatchNode
                    key={m._id}
                    match={m}
                    stationName={stationNameFor?.(m)}
                    canReport={canReport?.(m) ?? false}
                    onReport={onReport ? () => onReport(m) : undefined}
                    manage={manage}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Non-bracket formats (round robin / heats / ladder) — grouped list ─────────
export function RoundList({
  matches,
  stationNameFor,
  canReport,
  onReport,
  manage,
}: {
  matches: BracketMatch[];
  stationNameFor?: (m: BracketMatch) => string | undefined;
  canReport?: (m: BracketMatch) => boolean;
  onReport?: (m: BracketMatch) => void;
  manage?: MatchManage;
}) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  return (
    <div className="space-y-5">
      {rounds.map((round) => {
        const col = matches
          .filter((m) => m.round === round)
          .sort((a, b) => a.slot - b.slot);
        const label = col[0]?.label ?? `Round ${round}`;
        // For heats the label is per-heat, so use a generic round heading.
        const heading = col.every((m) => m.label === label)
          ? label
          : `Round ${round}`;
        return (
          <div key={round}>
            <div className="mb-2.5 flex items-center gap-2">
                <span className="font-display text-sm tracking-wider text-[var(--color-gold-400)]">
                  {heading}
                </span>
                <span className="h-px flex-1 bg-white/8" />
                <span className="text-[11px] text-white/35">
                  {col.length} {col.length === 1 ? "match" : "matches"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {col.map((m) => (
                  <MatchNode
                    key={m._id}
                    match={m}
                    stationName={stationNameFor?.(m)}
                    canReport={canReport?.(m) ?? false}
                    onReport={onReport ? () => onReport(m) : undefined}
                    manage={manage}
                  />
                ))}
              </div>
          </div>
        );
      })}
    </div>
  );
}
