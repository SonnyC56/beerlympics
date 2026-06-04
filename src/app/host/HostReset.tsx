"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import { Spinner, cx, useAction } from "@/components/primitives";
import { Icon, type IconName } from "@/components/Icon";

type Counts = {
  teams: number;
  players: number;
  matches: number;
  scoreEntries: number;
  media: number;
  wheelSpins: number;
  activity: number;
  eventStatus: string;
  currentPhaseIndex: number;
} | null;

export function HostReset() {
  const identity = useIdentity();
  const counts = useQuery(api.admin.counts, {
    deviceId: identity.deviceId ?? undefined,
  }) as Counts | undefined;

  if (counts === undefined) return <Spinner label="Loading the danger zone…" />;
  if (counts === null)
    return <div className="panel p-6 text-center text-white/60">No event to reset.</div>;

  return (
    <div className="space-y-5">
      {/* Snapshot */}
      <section className="panel p-5">
        <h2 className="mb-3 flex items-center gap-1.5 font-display text-xl text-white">
          <Icon name="sliders" size={20} /> In the database now
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Stat icon="teams" label="Teams" value={counts.teams} />
          <Stat icon="circuit" label="Matches" value={counts.matches} />
          <Stat icon="target" label="Scores" value={counts.scoreEntries} />
          <Stat icon="wheel" label="Spins" value={counts.wheelSpins} />
          <Stat icon="camera" label="Media" value={counts.media} />
          <Stat icon="bell" label="Activity" value={counts.activity} />
        </div>
      </section>

      {/* Reset actions */}
      <section className="panel border-[var(--color-loss)]/25 p-5">
        <h2 className="flex items-center gap-1.5 font-display text-xl text-white">
          <span className="text-[var(--color-loss)]">
            <Icon name="alert" size={20} />
          </span>
          Danger Zone
        </h2>
        <p className="mt-1 text-sm text-white/50">
          These are irreversible. Each one asks you to confirm first.
        </p>

        <div className="mt-4 space-y-2.5">
          <DangerAction
            icon="target"
            title="Clear the scoreboard"
            desc="Every team back to zero points. Brackets & results stay in place."
            confirmLabel="Reset scores"
            mutation={api.admin.clearScores}
            toast="Scoreboard cleared"
          />
          <DangerAction
            icon="circuit"
            title="Reset all brackets"
            desc="Deletes every match and score, reopens the stations, and rewinds to pre-game. Teams are kept."
            confirmLabel="Reset brackets"
            mutation={api.admin.resetTournaments}
            toast="All brackets reset"
          />
          <DangerAction
            icon="wheel"
            title="Clear the wheel log"
            desc="Wipes the spin history. (Points already awarded from spins live on the scoreboard.)"
            confirmLabel="Clear spins"
            mutation={api.admin.clearWheelSpins}
            toast="Wheel log cleared"
          />
          <DangerAction
            icon="camera"
            title="Delete all photos & videos"
            desc="Permanently removes every uploaded photo and video from the highlight reel."
            confirmLabel="Delete media"
            mutation={api.admin.clearMedia}
            toast="Media deleted"
          />
          <DangerAction
            icon="bell"
            title="Clear the activity feed"
            desc="Empties the live ticker. Doesn't touch scores or results."
            confirmLabel="Clear feed"
            mutation={api.admin.clearActivity}
            toast="Activity feed cleared"
          />
          <DangerAction
            icon="teams"
            title="Remove all teams"
            desc="Deletes every team and also resets brackets, scores, and the wheel log. Players keep their RSVP."
            confirmLabel="Remove teams"
            mutation={api.admin.clearTeams}
            toast="Teams removed"
          />
        </div>
      </section>

      {/* Nuclear option */}
      <FactoryReset />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/25 p-2.5 text-center">
      <div className="mb-0.5 flex justify-center text-white/40">
        <Icon name={icon} size={15} />
      </div>
      <div className="font-display text-xl leading-none text-white">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/35">{label}</div>
    </div>
  );
}

// A two-step (click → confirm) host action. `mutation` is an `api.admin.*` ref
// that takes `{ deviceId }`.
function DangerAction({
  icon,
  title,
  desc,
  confirmLabel,
  mutation,
  toast,
}: {
  icon: IconName;
  title: string;
  desc: string;
  confirmLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: any;
  toast: string;
}) {
  const identity = useIdentity();
  const run = useAction();
  const fire = useMutation(mutation);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-white/45">
          <Icon name={icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-white">{title}</div>
          <div className="mt-0.5 text-xs text-white/50">{desc}</div>
        </div>
      </div>
      <div className="mt-3">
        {!confirming ? (
          <button
            className="btn btn-ghost w-full text-sm"
            disabled={!identity.deviceId}
            onClick={() => setConfirming(true)}
          >
            {confirmLabel}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="btn flex-1 bg-[var(--color-loss)] text-sm font-bold text-white hover:brightness-110"
              disabled={!identity.deviceId}
              onClick={() =>
                run(() => fire({ deviceId: identity.deviceId! }), toast).then((ok) => {
                  if (ok) setConfirming(false);
                })
              }
            >
              Yes, do it
            </button>
            <button
              className="btn btn-ghost flex-1 text-sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FactoryReset() {
  const identity = useIdentity();
  const run = useAction();
  const fire = useMutation(api.admin.factoryReset);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <section className="panel border-[var(--color-loss)]/40 bg-[var(--color-loss)]/[0.04] p-5">
      <h2 className="flex items-center gap-1.5 font-display text-xl text-[var(--color-loss)]">
        <Icon name="alert" size={20} /> Factory reset
      </h2>
      <p className="mt-1 text-sm text-white/55">
        Rewinds the entire day: deletes all teams, matches, scores, media, spins, and the
        activity feed, and reopens the event for RSVPs. Games, stations, and accounts are
        kept. This cannot be undone.
      </p>

      {!open ? (
        <button
          className="btn btn-ghost mt-3 w-full text-sm"
          onClick={() => setOpen(true)}
        >
          Start a factory reset
        </button>
      ) : (
        <div className="mt-3 space-y-2.5">
          <label className="block text-sm font-semibold text-white/70">
            Type <span className="font-mono text-[var(--color-loss)]">RESET</span> to confirm
          </label>
          <input
            className="field text-center font-display tracking-[0.3em]"
            placeholder="RESET"
            value={text}
            onChange={(e) => setText(e.target.value.toUpperCase())}
          />
          <div className="flex gap-2">
            <button
              className={cx(
                "btn flex-1 text-sm font-bold",
                text.trim().toUpperCase() === "RESET"
                  ? "bg-[var(--color-loss)] text-white hover:brightness-110"
                  : "bg-white/8 text-white/40",
              )}
              disabled={text.trim().toUpperCase() !== "RESET" || !identity.deviceId}
              onClick={() =>
                run(
                  () => fire({ deviceId: identity.deviceId!, confirm: text.trim() }),
                  "Event reset — open for RSVPs",
                ).then((ok) => {
                  if (ok) {
                    setOpen(false);
                    setText("");
                  }
                })
              }
            >
              Wipe everything
            </button>
            <button
              className="btn btn-ghost flex-1 text-sm"
              onClick={() => {
                setOpen(false);
                setText("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
