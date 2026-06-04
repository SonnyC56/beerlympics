"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  Spinner,
  TeamBadge,
  cx,
  useAction,
} from "@/components/primitives";
import { Icon, Mascot } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { MiniButton } from "./HostKit";

/** Section header with a leading SVG icon (emoji-free). */
function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5 font-display text-xl text-white">
        <span className="inline-flex shrink-0">{icon}</span>
        {title}
      </h2>
    </div>
  );
}

/** A compact stat tile with a leading SVG icon. */
function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: "gold" | "live" | "win";
}) {
  const color =
    tone === "gold"
      ? "text-[var(--color-gold-400)]"
      : tone === "live"
        ? "text-[var(--color-live)]"
        : tone === "win"
          ? "text-[var(--color-win)]"
          : "text-white";
  return (
    <div className="panel-tight flex flex-col items-center px-2 py-3">
      <div className="flex h-4 items-center text-white/80">{icon}</div>
      <div className={cx("font-display text-2xl tabular-nums", color)}>{value}</div>
      <div className="text-center text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
    </div>
  );
}

type TeamMember = {
  _id: Id<"players">;
  name: string;
  emoji: string;
  role: "captain" | "member";
};
type Team = {
  _id: Id<"teams">;
  name: string;
  emoji: string;
  color: string;
  motto?: string;
  seed?: number;
  members: TeamMember[];
};
type Guest = {
  _id: Id<"players">;
  name: string;
  emoji: string;
  status: "yes" | "no" | "maybe";
  plusOnes: number;
  note?: string;
  teamId?: Id<"teams">;
};

const STATUS_META: Record<string, { icon: IconName; label: string; color: string }> = {
  yes: { icon: "check", label: "Going", color: "var(--color-win)" },
  maybe: { icon: "thinking", label: "Maybe", color: "var(--color-gold-400)" },
  no: { icon: "close", label: "Out", color: "var(--color-loss)" },
};

export function HostTeams() {
  const teams = useQuery(api.teams.list, {}) as Team[] | undefined;
  const guests = useQuery(api.rsvp.guests, {}) as Guest[] | undefined;

  const headcount =
    guests
      ?.filter((g) => g.status === "yes")
      .reduce((n, g) => n + 1 + (g.plusOnes || 0), 0) ?? 0;
  const going = guests?.filter((g) => g.status === "yes").length ?? 0;
  const maybe = guests?.filter((g) => g.status === "maybe").length ?? 0;
  const out = guests?.filter((g) => g.status === "no").length ?? 0;

  return (
    <div className="space-y-5">
      {/* ── Teams ──────────────────────────────────────────────────────── */}
      <section className="panel p-5">
        <SectionTitle icon={<Icon name="flag" size={20} />} title="Teams" />
        {teams === undefined ? (
          <Spinner />
        ) : teams.length === 0 ? (
          <p className="text-sm text-white/45">
            No teams yet. Guests form teams from the Teams tab once they RSVP.
          </p>
        ) : (
          <div className="space-y-2.5">
            {teams.map((t) => (
              <TeamRow key={t._id} team={t} />
            ))}
          </div>
        )}
      </section>

      {/* ── RSVP summary ───────────────────────────────────────────────── */}
      {guests && (
        <section className="grid grid-cols-4 gap-2.5">
          <StatTile icon={<Icon name="check" size={16} />} label="Going" value={going} tone="win" />
          <StatTile icon={<Icon name="thinking" size={16} />} label="Maybe" value={maybe} />
          <StatTile icon={<Icon name="close" size={16} />} label="Out" value={out} />
          <StatTile icon={<Icon name="beers" size={16} />} label="Heads" value={headcount} tone="gold" />
        </section>
      )}

      {/* ── Guest list ─────────────────────────────────────────────────── */}
      <section className="panel p-5">
        <SectionTitle icon={<Icon name="list" size={20} />} title="Guest List" />
        {guests === undefined ? (
          <Spinner />
        ) : guests.length === 0 ? (
          <p className="text-sm text-white/45">No RSVPs yet.</p>
        ) : (
          <div className="space-y-1.5">
            {guests.map((g) => {
              const meta = STATUS_META[g.status];
              return (
                <div
                  key={g._id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/4 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="text-lg text-white/85">
                      <Mascot name={g.emoji} size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-white">
                        {g.name}
                        {g.plusOnes > 0 && (
                          <span className="ml-1.5 text-xs text-white/45">
                            +{g.plusOnes}
                          </span>
                        )}
                      </div>
                      {g.note && (
                        <div className="truncate text-[11px] text-white/40">
                          “{g.note}”
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-bold"
                    style={{ color: meta.color }}
                  >
                    <Icon name={meta.icon} size={14} /> {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Team row with seed + remove ───────────────────────────────────────────────
function TeamRow({ team }: { team: Team }) {
  const identity = useIdentity();
  const run = useAction();
  const setSeed = useMutation(api.teams.setSeed);
  const remove = useMutation(api.teams.remove);
  const [seed, setSeed_] = useState<string>(team.seed != null ? String(team.seed) : "");
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <TeamBadge emoji={team.emoji} name={team.name} color={team.color} />
        <span className="text-[11px] text-white/40">
          {team.members.length} {team.members.length === 1 ? "player" : "players"}
        </span>
      </div>

      {team.members.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {team.members.map((m) => (
            <span
              key={m._id}
              className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[11px] text-white/65"
            >
              <Mascot name={m.emoji} size={14} /> {m.name}
              {m.role === "captain" && (
                <span title="Captain" className="text-[var(--color-gold-300)]">
                  <Icon name="crown" size={12} />
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs font-semibold text-white/55">Seed</label>
        <input
          type="number"
          min={1}
          max={64}
          value={seed}
          onChange={(e) => setSeed_(e.target.value)}
          placeholder="—"
          className="field w-16 py-1.5 text-center"
        />
        <MiniButton
          tone="gold"
          disabled={!identity.deviceId || seed.trim() === ""}
          onClick={() =>
            run(
              () =>
                setSeed({
                  deviceId: identity.deviceId!,
                  teamId: team._id,
                  seed: Math.max(1, Number(seed) || 1),
                }),
              `${team.name} seeded #${seed}`,
            )
          }
        >
          Set
        </MiniButton>

        <div className="ml-auto">
          {confirmDel ? (
            <div className="flex items-center gap-1.5">
              <MiniButton
                tone="flame"
                disabled={!identity.deviceId}
                onClick={() =>
                  run(
                    () =>
                      remove({
                        deviceId: identity.deviceId!,
                        teamId: team._id,
                      }),
                    "Team removed",
                  )
                }
              >
                Confirm
              </MiniButton>
              <MiniButton onClick={() => setConfirmDel(false)}>Cancel</MiniButton>
            </div>
          ) : (
            <MiniButton tone="flame" onClick={() => setConfirmDel(true)}>
              Remove
            </MiniButton>
          )}
        </div>
      </div>
    </div>
  );
}
