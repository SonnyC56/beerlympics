"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import { EmptyState, Spinner, cx, useAction } from "@/components/primitives";
import { Icon, Medal } from "@/components/Icon";

type QuipState =
  | {
      phase: "idle" | "answer" | "vote" | "reveal";
      roundId?: Id<"quipRounds">;
      prompt?: string;
      totalAnswers?: number;
      totalVotes?: number;
      myAnswerText?: string | null;
      myVote?: Id<"quipAnswers"> | null;
      answers?: { _id: Id<"quipAnswers">; text: string; mine: boolean }[];
      results?: {
        _id: Id<"quipAnswers">;
        text: string;
        author: string;
        votes: number;
      }[];
    }
  | null;

export default function QuipsPage() {
  const identity = useIdentity();
  const q = useQuery(
    api.quips.current,
    identity.deviceId ? { deviceId: identity.deviceId } : {},
  ) as QuipState | undefined;
  const submit = useMutation(api.quips.submitAnswer);
  const vote = useMutation(api.quips.vote);
  const run = useAction();
  const [text, setText] = useState("");

  if (q === undefined) return <Spinner label="Checking the stage…" />;

  if (!q || q.phase === "idle") {
    return (
      <div className="space-y-5">
        <Header />
        <div className="panel">
          <EmptyState
            icon="sparkle"
            title="No quip battle right now"
            subtitle="When the host kicks one off, the prompt lands right here. Keep this open!"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header />

      {/* The prompt */}
      <div className="panel stadium-grid p-5 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--color-gold-300)]">
          The prompt
        </div>
        <p className="mt-2 font-display text-2xl leading-tight text-white">{q.prompt}</p>
      </div>

      {/* ── Answer phase ── */}
      {q.phase === "answer" && (
        <div className="space-y-3">
          <textarea
            className="field min-h-[96px] resize-none"
            placeholder="Write the funniest answer you can…"
            value={text || q.myAnswerText || ""}
            maxLength={140}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="btn btn-gold w-full py-3.5"
            disabled={!identity.deviceId || !(text || q.myAnswerText)?.trim()}
            onClick={() =>
              run(
                () =>
                  submit({
                    deviceId: identity.deviceId!,
                    text: (text || q.myAnswerText || "").trim(),
                  }),
                "Answer locked in!",
              )
            }
          >
            <span className="flex items-center justify-center gap-2">
              <Icon name={q.myAnswerText ? "check" : "arrowRight"} size={16} />
              {q.myAnswerText ? "Update my answer" : "Submit answer"}
            </span>
          </button>
          {q.myAnswerText && (
            <p className="text-center text-xs text-white/45">
              You&apos;re in — {q.totalAnswers} answer{q.totalAnswers === 1 ? "" : "s"} so
              far. You can tweak it until voting opens.
            </p>
          )}
        </div>
      )}

      {/* ── Vote phase ── */}
      {q.phase === "vote" && (
        <div className="space-y-3">
          <p className="text-center text-sm text-white/60">
            Tap your favourite. {q.totalVotes ?? 0} vote{q.totalVotes === 1 ? "" : "s"} in.
          </p>
          <div className="space-y-2.5">
            {(q.answers ?? []).map((a) => {
              const mine = a.mine;
              const voted = q.myVote === a._id;
              return (
                <button
                  key={a._id}
                  disabled={!identity.deviceId || mine}
                  onClick={() =>
                    run(() => vote({ deviceId: identity.deviceId!, answerId: a._id }), "Voted!")
                  }
                  className={cx(
                    "panel-tight w-full p-4 text-left text-lg transition active:scale-[0.99]",
                    voted
                      ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/10"
                      : mine
                        ? "opacity-50"
                        : "hover:bg-white/5",
                  )}
                >
                  <span className="text-white">{a.text}</span>
                  {mine && (
                    <span className="ml-2 text-xs uppercase tracking-wide text-white/40">
                      your answer
                    </span>
                  )}
                  {voted && (
                    <span className="ml-2 text-xs font-bold uppercase tracking-wide text-[var(--color-gold-300)]">
                      your vote
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Reveal phase ── */}
      {q.phase === "reveal" && (
        <div className="space-y-2.5">
          <p className="text-center text-sm text-white/60">The results are in!</p>
          {(q.results ?? []).map((r, i) => (
            <div
              key={r._id}
              className={cx(
                "panel-tight flex items-center gap-3 p-4",
                i === 0 && "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/10",
              )}
            >
              <span className="w-8 shrink-0 text-center">
                {i < 3 ? <Medal rank={i + 1} size={26} /> : <span className="text-white/40">{i + 1}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-white">{r.text}</div>
                <div className="text-xs text-white/45">— {r.author}</div>
              </div>
              <span className="shrink-0 font-display text-lg tabular-nums text-white/70">
                {r.votes}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="font-display text-3xl text-medal">Quip Battle</h1>
        <p className="mt-1 text-sm text-white/55">Write it. Vote it. Roast your friends.</p>
      </div>
      <Icon name="sparkle" size={36} className="text-medal" />
    </div>
  );
}
