"use client";

import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";
import { Avatar, cx } from "@/components/primitives";
import { Icon, Mascot } from "@/components/Icon";
import { colorHex } from "@/lib/teamColors";

export type TeamCardMember = {
  _id: Id<"players">;
  userId: Id<"users">;
  name: string;
  emoji: string;
  role: "captain" | "member";
};

export type TeamCardTeam = {
  _id: Id<"teams">;
  name: string;
  emoji: string;
  color: string;
  theme?: string;
  motto?: string;
  seed?: number;
  members: TeamCardMember[];
};

/**
 * A vivid, color-accented team card for the /teams grid. Tapping the body
 * navigates to the team page; the `action` slot (Join / Leave / Edit) renders
 * below the divider and is rendered outside the Link to keep buttons tappable.
 */
export function TeamCard({
  team,
  highlight = false,
  pinnedLabel,
  action,
  cap,
}: {
  team: TeamCardTeam;
  highlight?: boolean;
  pinnedLabel?: string;
  action?: React.ReactNode;
  cap?: number;
}) {
  const hex = colorHex(team.color);
  const memberCount = team.members.length;
  const isFull = typeof cap === "number" && memberCount >= cap;
  const captain = team.members.find((m) => m.role === "captain");

  return (
    <div
      className="panel relative overflow-hidden p-0 animate-rise"
      style={{
        borderColor: highlight ? hex : undefined,
        boxShadow: highlight
          ? `0 0 0 1px ${hex}, 0 18px 50px -22px ${hex}aa`
          : `0 18px 50px -28px ${hex}66`,
      }}
    >
      {/* Color wash + glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${hex}, ${hex}22)` }}
      />
      <div
        className="pointer-events-none absolute -right-6 -top-6 leading-none opacity-10"
        style={{ color: hex }}
      >
        <Mascot name={team.emoji} size={110} />
      </div>

      {pinnedLabel && (
        <div
          className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}55` }}
        >
          {pinnedLabel}
        </div>
      )}

      <Link href={`/teams/${team._id}`} className="block px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `${hex}1f`, border: `1px solid ${hex}66` }}
          >
            <Mascot name={team.emoji} size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-display text-2xl leading-none text-white">
                {team.name}
              </h3>
              {typeof team.seed === "number" && (
                <span
                  className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                  style={{ background: `${hex}22`, color: hex }}
                >
                  Seed #{team.seed}
                </span>
              )}
            </div>
            {team.theme && (
              <p className="mt-1 truncate text-sm font-semibold" style={{ color: hex }}>
                {team.theme}
              </p>
            )}
            {team.motto && (
              <p className="mt-0.5 truncate text-sm italic text-white/55">
                “{team.motto}”
              </p>
            )}
          </div>
        </div>

        {/* Roster preview */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center -space-x-2">
            {team.members.slice(0, 5).map((m) => (
              <span key={m._id} className="ring-2 ring-[var(--color-ink-900)] rounded-full">
                <Avatar emoji={m.emoji} size={30} color={team.color} />
              </span>
            ))}
            {memberCount > 5 && (
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-white/70 ring-2 ring-[var(--color-ink-900)]">
                +{memberCount - 5}
              </span>
            )}
            {memberCount === 0 && (
              <span className="text-xs text-white/40">No members yet</span>
            )}
          </div>
          <div className="text-right">
            <div className="font-display text-lg leading-none text-white">
              {memberCount}
              {typeof cap === "number" && (
                <span className="text-white/40">/{cap}</span>
              )}
            </div>
            <div
              className={cx(
                "text-[10px] uppercase tracking-widest",
                isFull ? "text-[var(--color-gold-300)]" : "text-white/40",
              )}
            >
              {isFull ? "Full" : memberCount === 1 ? "Player" : "Players"}
            </div>
          </div>
        </div>

        {captain && (
          <div className="mt-2 flex items-center gap-1 text-xs text-white/45">
            <Icon name="crown" size={14} />
            <span>Captain</span>
            <Mascot name={captain.emoji} size={14} />
            <span>{captain.name}</span>
          </div>
        )}
      </Link>

      {action && (
        <div className="hairline flex items-center gap-2 px-5 py-3">{action}</div>
      )}
    </div>
  );
}
