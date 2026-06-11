"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import { Spinner, cx, useAction } from "@/components/primitives";
import { Icon } from "@/components/Icon";
import { HostSectionTitle } from "./HostKit";

// A deck of party prompts. Host can shuffle one in or type their own.
const PROMPTS = [
  "The worst thing to say right before a keg stand",
  "A rejected name for this year's Beer Olympics",
  "Worst possible prize for the losing team",
  "A terrible motivational speech for flip cup",
  "Worst thing to find at the bottom of your Solo cup",
  "A bad excuse for missing every single pong shot",
  "The next event we should add to the Beer Olympics",
  "What the championship trophy should actually be",
  "A terrible team walk-out song",
  "The most chaotic house rule imaginable",
  "What the flaming-arrow ceremony is missing",
  "A bad slogan to put on the team flags",
  "The worst superpower to have during beer die",
  "A terrible name for the party's signature drink",
  "The real MVP of any backyard party",
  "Worst thing to yell during the national anthem",
  "A rejected Olympic event",
  "What's actually in the jungle juice",
  "The worst way to celebrate a win",
  "What the loser's punishment should be",
  "The most likely cause of tomorrow's headache",
  "A bad name for our group chat after today",
  "The unofficial mascot of this backyard",
  "A terrible pickup line for a Beer Olympics",
];

type QuipState = {
  phase: "idle" | "answer" | "vote" | "reveal";
  prompt?: string;
  totalAnswers?: number;
  totalVotes?: number;
} | null;

export function HostQuips() {
  const identity = useIdentity();
  const run = useAction();
  const q = useQuery(
    api.quips.current,
    identity.deviceId ? { deviceId: identity.deviceId } : {},
  ) as QuipState | undefined;
  const start = useMutation(api.quips.start);
  const setPhase = useMutation(api.quips.setPhase);
  const close = useMutation(api.quips.close);
  const dev = identity.deviceId;

  const [prompt, setPrompt] = useState("");
  const [deckIndex, setDeckIndex] = useState(0);

  const shuffle = () => {
    const next = (deckIndex + 1) % PROMPTS.length;
    setDeckIndex(next);
    setPrompt(PROMPTS[next]);
  };

  const active = q && q.phase !== "idle";

  return (
    <section className="panel p-5">
      <HostSectionTitle
        icon="sparkle"
        title="Quip Battle"
        action={
          <Link
            href="/scoreboard/tv/quips"
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[var(--color-gold-300)] underline"
          >
            TV screen <Icon name="arrowRight" size={12} />
          </Link>
        }
      />

      {q === undefined ? (
        <Spinner />
      ) : !active ? (
        <div className="space-y-3">
          <p className="text-sm text-white/55">
            Cast the TV screen, set a prompt, and start a round. Everyone answers on
            their phone, then everyone votes — funniest quip wins their team{" "}
            <span className="text-white/70">+15</span>.
          </p>
          <textarea
            className="field min-h-[64px] resize-none"
            placeholder="Type a prompt, or shuffle one in"
            value={prompt}
            maxLength={120}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1 py-2.5 text-sm" onClick={shuffle}>
              <span className="flex items-center justify-center gap-1.5">
                <Icon name="dice" size={15} /> Shuffle prompt
              </span>
            </button>
            <button
              className="btn btn-gold flex-1 py-2.5 text-sm"
              disabled={!dev || !prompt.trim()}
              onClick={() =>
                run(async () => {
                  await start({ deviceId: dev!, prompt: prompt.trim() });
                  setPrompt("");
                }, "Round started — answers are open!")
              }
            >
              Start round
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/8 bg-black/25 p-3.5">
            <div className="text-[11px] uppercase tracking-widest text-white/40">Prompt</div>
            <div className="mt-1 font-display text-lg text-white">{q.prompt}</div>
            <div className="mt-2 flex items-center gap-3 text-xs text-white/50">
              <span
                className={cx(
                  "rounded-full px-2 py-0.5 font-bold uppercase",
                  q.phase === "answer"
                    ? "bg-[var(--color-win)]/15 text-[var(--color-win)]"
                    : q.phase === "vote"
                      ? "bg-[var(--color-live)]/15 text-[var(--color-live)]"
                      : "bg-[var(--color-gold-500)]/15 text-[var(--color-gold-300)]",
                )}
              >
                {q.phase}
              </span>
              <span>{q.totalAnswers ?? 0} answers</span>
              <span>{q.totalVotes ?? 0} votes</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {q.phase === "answer" && (
              <button
                className="btn btn-gold col-span-2 py-3"
                disabled={!dev}
                onClick={() =>
                  run(() => setPhase({ deviceId: dev!, phase: "vote" }), "Voting is open!")
                }
              >
                Close answers, open voting
              </button>
            )}
            {q.phase === "vote" && (
              <button
                className="btn btn-gold col-span-2 py-3"
                disabled={!dev}
                onClick={() =>
                  run(() => setPhase({ deviceId: dev!, phase: "reveal" }), "Revealed!")
                }
              >
                Close voting, reveal winner
              </button>
            )}
            {q.phase === "reveal" && (
              <p className="col-span-2 text-center text-sm text-white/55">
                Winner revealed on the TV. Start another round below.
              </p>
            )}
            <button
              className="btn btn-ghost text-sm"
              disabled={!dev}
              onClick={() => run(() => close({ deviceId: dev! }), "Round ended")}
            >
              End round
            </button>
            <button
              className="btn btn-ghost text-sm"
              disabled={!dev || !PROMPTS.length}
              onClick={() => {
                const p = PROMPTS[(deckIndex + 1) % PROMPTS.length];
                setDeckIndex((deckIndex + 1) % PROMPTS.length);
                run(() => start({ deviceId: dev!, prompt: p }), "New round started!");
              }}
            >
              Next round (random)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
