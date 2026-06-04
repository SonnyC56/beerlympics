"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { HostField } from "./HostKit";

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

type Team = {
  _id: Id<"teams">;
  name: string;
  emoji: string;
  color: string;
};

type Reason = "bonus" | "penalty" | "manual";

const REASONS: { value: Reason; label: string; icon: IconName }[] = [
  { value: "bonus", label: "Bonus", icon: "sparkle" },
  { value: "penalty", label: "Penalty", icon: "warning" },
  { value: "manual", label: "Manual", icon: "edit" },
];

const QUICK_ICONS: IconName[] = [
  "megaphone",
  "flame",
  "beer",
  "party",
  "bolt",
  "trophy",
  "alert",
  "dice",
];

export function HostScoring() {
  const teams = useQuery(api.teams.list, {}) as Team[] | undefined;
  return (
    <div className="space-y-5">
      <AwardPoints teams={teams} />
      <Announce />
    </div>
  );
}

// ── Award points ──────────────────────────────────────────────────────────────
function AwardPoints({ teams }: { teams: Team[] | undefined }) {
  const identity = useIdentity();
  const run = useAction();
  const award = useMutation(api.scoring.award);

  const [teamId, setTeamId] = useState<Id<"teams"> | "">("");
  const [points, setPoints] = useState("10");
  const [reason, setReason] = useState<Reason>("bonus");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (teams && teams.length > 0 && !teamId) setTeamId(teams[0]._id);
  }, [teams, teamId]);

  const selected = teams?.find((t) => t._id === teamId);
  const amount = Math.abs(Number(points) || 0);

  return (
    <section className="panel p-5">
      <SectionTitle icon={<Icon name="target" size={20} />} title="Award Points" />
      {teams === undefined ? (
        <Spinner />
      ) : teams.length === 0 ? (
        <p className="text-sm text-white/45">
          No teams to award yet — they show up here once formed.
        </p>
      ) : (
        <div className="space-y-3.5">
          <HostField label="Team">
            <select
              className="field"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value as Id<"teams">)}
            >
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </HostField>

          {selected && (
            <div className="rounded-2xl bg-white/4 px-3 py-2.5">
              <TeamBadge
                emoji={selected.emoji}
                name={selected.name}
                color={selected.color}
              />
            </div>
          )}

          <HostField label="Reason">
            <div className="grid grid-cols-3 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={cx(
                    "inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-bold transition",
                    reason === r.value
                      ? r.value === "penalty"
                        ? "border-[var(--color-loss)] bg-[var(--color-loss)]/15 text-[var(--color-loss)]"
                        : "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)]"
                      : "border-white/10 bg-white/4 text-white/60",
                  )}
                >
                  <Icon name={r.icon} size={14} /> {r.label}
                </button>
              ))}
            </div>
          </HostField>

          <HostField
            label="Points"
            hint={reason === "penalty" ? "deducted from total" : "added to total"}
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className="field flex-1 text-center font-display text-xl"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
              <div className="flex gap-1.5">
                {[5, 10, 25, 50].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPoints(String(p))}
                    className="rounded-full bg-white/8 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/15"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </HostField>

          <HostField label="Note" hint="optional">
            <input
              className="field"
              placeholder="e.g. Best costume, broke a rule…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
            />
          </HostField>

          <button
            className={cx(
              "btn w-full",
              reason === "penalty" ? "btn-flame" : "btn-gold",
            )}
            disabled={!identity.deviceId || !teamId || amount === 0}
            onClick={() =>
              run(
                () =>
                  award({
                    deviceId: identity.deviceId!,
                    teamId: teamId as Id<"teams">,
                    points: amount,
                    reason,
                    note: note.trim() || undefined,
                  }),
                reason === "penalty"
                  ? `−${amount} pts applied`
                  : `+${amount} pts awarded!`,
              ).then((ok) => ok && setNote(""))
            }
          >
            {reason === "penalty"
              ? `Deduct ${amount} pts`
              : `Award ${amount} pts`}
          </button>
        </div>
      )}
    </section>
  );
}

// ── Announce ──────────────────────────────────────────────────────────────────
function Announce() {
  const identity = useIdentity();
  const run = useAction();
  const announce = useMutation(api.activity.announce);

  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState<IconName>("megaphone");

  return (
    <section className="panel p-5">
      <SectionTitle icon={<Icon name="megaphone" size={20} />} title="Announce" />
      <p className="mb-3 text-sm text-white/55">
        Push a message to the live activity feed everyone sees.
      </p>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ICONS.map((name) => (
            <button
              key={name}
              type="button"
              aria-label={name}
              onClick={() => setEmoji(name)}
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-xl text-white/85 transition",
                emoji === name
                  ? "bg-[var(--color-gold-500)]/25 text-[var(--color-gold-300)] ring-2 ring-[var(--color-gold-500)]"
                  : "bg-white/5 hover:bg-white/10",
              )}
            >
              <Icon name={name} size={20} />
            </button>
          ))}
        </div>
        <textarea
          className="field min-h-20 resize-none"
          placeholder="Final round starts in 5! Grab your beers"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
        />
        <button
          className="btn btn-gold inline-flex w-full items-center justify-center gap-1.5"
          disabled={!identity.deviceId || !message.trim()}
          onClick={() =>
            run(
              () =>
                announce({
                  deviceId: identity.deviceId!,
                  message: message.trim(),
                  emoji,
                }),
              "Announced to everyone!",
            ).then((ok) => ok && setMessage(""))
          }
        >
          <Icon name="megaphone" size={16} /> Broadcast
        </button>
      </div>
    </section>
  );
}
