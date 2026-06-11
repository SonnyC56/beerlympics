"use client";

import { useState } from "react";
import { useIdentity } from "@/lib/identity";
import { Spinner, cx, useAction } from "@/components/primitives";
import { Icon, type IconName } from "@/components/Icon";
import { HostRun } from "./HostRun";
import { HostGames } from "./HostGames";
import { HostTeams } from "./HostTeams";
import { HostInvites } from "./HostInvites";
import { HostScoring } from "./HostScoring";
import { HostExtras } from "./HostExtras";
import { HostSettings } from "./HostSettings";
import { HostReset } from "./HostReset";

type Tab =
  | "run"
  | "games"
  | "teams"
  | "invites"
  | "scoring"
  | "extras"
  | "settings"
  | "reset";

const TABS: { value: Tab; label: string; icon: IconName }[] = [
  { value: "run", label: "Run", icon: "sliders" },
  { value: "games", label: "Games", icon: "games" },
  { value: "teams", label: "Teams", icon: "flag" },
  { value: "invites", label: "Invites", icon: "envelope" },
  { value: "scoring", label: "Score", icon: "target" },
  { value: "extras", label: "Extras", icon: "sparkle" },
  { value: "settings", label: "Setup", icon: "gear" },
  { value: "reset", label: "Reset", icon: "alert" },
];

export default function HostPage() {
  const identity = useIdentity();
  const [tab, setTab] = useState<Tab>("run");

  if (!identity.ready) return <Spinner label="Checking credentials…" />;
  if (!identity.isHost) return <HostGate />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="animate-rise">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-live)]">
            Host Control
          </span>
        </div>
        <h1 className="mt-1 font-display text-3xl text-medal">Command Center</h1>
        <p className="mt-1 text-sm text-white/50">
          Drive the whole day — status, brackets, scoring, the works.
        </p>
      </header>

      {/* Tab nav */}
      <nav className="sticky top-[57px] z-20 -mx-4 bg-[var(--color-ink-950)]/80 px-4 py-2 backdrop-blur-xl">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-black/40 p-1">
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cx(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition",
                  active
                    ? "bg-[var(--color-gold-500)] text-[#1a1205]"
                    : "text-white/55 hover:text-white",
                )}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active section */}
      <div className="animate-rise" key={tab}>
        {tab === "run" && <HostRun />}
        {tab === "games" && <HostGames />}
        {tab === "teams" && <HostTeams />}
        {tab === "invites" && <HostInvites />}
        {tab === "scoring" && <HostScoring />}
        {tab === "extras" && <HostExtras />}
        {tab === "settings" && <HostSettings />}
        {tab === "reset" && <HostReset />}
      </div>
    </div>
  );
}

// ── Host gate ─────────────────────────────────────────────────────────────────
function HostGate() {
  const identity = useIdentity();
  const run = useAction();
  const [code, setCode] = useState("");

  return (
    <div className="flex min-h-[60dvh] items-center justify-center py-8">
      <div className="panel stadium-grid w-full max-w-sm p-6 text-center animate-rise">
        <div className="flex justify-center text-[var(--color-gold-300)] animate-float">
          <Icon name="lock" size={48} />
        </div>
        <h1 className="mt-3 font-display text-2xl text-white">Host Only</h1>
        <p className="mt-2 text-sm text-white/55">
          This is the control center for game day. Enter the host code to unlock
          it.
        </p>

        <div className="mt-5 space-y-2.5 text-left">
          <label className="block text-sm font-semibold text-white/70">
            Host code
          </label>
          <input
            className="field text-center font-display text-lg tracking-[0.3em]"
            placeholder="HOST CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && code.trim()) {
                run(() => identity.claimHost(code.trim()), "Host unlocked!");
              }
            }}
            maxLength={12}
          />
          <button
            className="btn btn-gold w-full"
            disabled={!identity.deviceId || !code.trim()}
            onClick={() =>
              run(() => identity.claimHost(code.trim()), "Host unlocked!")
            }
          >
            Unlock controls
          </button>
        </div>

        <p className="mt-4 text-xs text-white/35">
          The default seed host code is{" "}
          <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[var(--color-gold-300)]">
            HOST
          </code>
          . Hosts can find the real code on their own device.
        </p>
      </div>
    </div>
  );
}
