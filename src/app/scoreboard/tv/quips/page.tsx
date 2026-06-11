"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Icon, Medal } from "@/components/Icon";
import { cx } from "@/components/primitives";

type QuipState =
  | {
      phase: "idle" | "answer" | "vote" | "reveal";
      prompt?: string;
      totalAnswers?: number;
      totalVotes?: number;
      answers?: { _id: string; text: string }[];
      results?: { _id: string; text: string; author: string; votes: number }[];
    }
  | null;

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--color-ink-950)] px-[5vw] text-white">
      <div className="stadium-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      {children}
      <Link
        href="/scoreboard"
        className="absolute bottom-[3vh] right-[3vw] inline-flex items-center gap-1.5 text-[1.6vh] font-semibold uppercase tracking-widest text-white/25 transition hover:text-white/60"
      >
        <Icon name="arrowLeft" size={16} /> Exit
      </Link>
    </div>
  );
}

function Prompt({ text }: { text: string }) {
  return (
    <>
      <div className="text-[2vh] font-bold uppercase tracking-[0.4em] text-[var(--color-gold-300)]">
        Quip Battle
      </div>
      <h1 className="mt-[2vh] max-w-[80vw] text-center font-display text-[7vh] leading-[1.05] text-medal">
        {text}
      </h1>
    </>
  );
}

export default function QuipsTvPage() {
  const q = useQuery(api.quips.current, {}) as QuipState | undefined;

  if (q === undefined) {
    return (
      <Stage>
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-[var(--color-gold-500)]" />
      </Stage>
    );
  }

  if (!q || q.phase === "idle") {
    return (
      <Stage>
        <div className="flex flex-col items-center gap-[3vh] text-center">
          <div className="animate-float text-[var(--color-gold-400)]">
            <Icon name="sparkle" size={120} className="h-[16vh] w-[16vh]" />
          </div>
          <div className="font-display text-[6vh] text-white/70">Quip Battle</div>
          <div className="text-[2.4vh] text-white/40">Waiting for the host to start a round.</div>
        </div>
      </Stage>
    );
  }

  if (q.phase === "answer") {
    return (
      <Stage>
        <div className="flex flex-col items-center text-center">
          <Prompt text={q.prompt ?? ""} />
          <div className="mt-[5vh] inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/30 px-[3vw] py-[2vh] text-[3vh] text-white/80">
            <Icon name="circuit" size={30} className="text-[var(--color-gold-300)]" />
            Answer on your phone —{" "}
            <Link href="/quips" className="font-bold text-[var(--color-gold-300)]">
              beerlympics.io/quips
            </Link>
          </div>
          <div className="mt-[3vh] font-display text-[5vh] tabular-nums text-white/60">
            {q.totalAnswers ?? 0} answer{q.totalAnswers === 1 ? "" : "s"} in
          </div>
        </div>
      </Stage>
    );
  }

  if (q.phase === "vote") {
    const answers = q.answers ?? [];
    return (
      <Stage>
        <div className="flex w-full flex-col items-center text-center">
          <Prompt text={q.prompt ?? ""} />
          <div className="mt-[3vh] text-[2.6vh] font-bold uppercase tracking-widest text-[var(--color-live)]">
            Vote on your phone · {q.totalVotes ?? 0} in
          </div>
          <div
            className="mt-[3vh] grid w-full gap-[1.5vw]"
            style={{
              gridTemplateColumns: `repeat(${answers.length > 4 ? 2 : 1}, minmax(0, 1fr))`,
            }}
          >
            {answers.map((a, i) => (
              <div
                key={a._id}
                className="rounded-2xl border border-white/10 bg-white/4 px-[2.5vw] py-[2vh] text-left text-[3vh] text-white animate-rise"
                style={{ animationDelay: `${Math.min(i * 80, 600)}ms` }}
              >
                {a.text}
              </div>
            ))}
          </div>
        </div>
      </Stage>
    );
  }

  // reveal
  const results = q.results ?? [];
  return (
    <Stage>
      <div className="flex w-full flex-col items-center text-center">
        <Prompt text={q.prompt ?? ""} />
        <div className="mt-[4vh] flex w-full max-w-[80vw] flex-col gap-[1.4vh]">
          {results.map((r, i) => (
            <div
              key={r._id}
              className={cx(
                "flex items-center gap-[1.5vw] rounded-2xl border px-[2.5vw] py-[1.8vh] text-left animate-rise",
                i === 0
                  ? "border-[var(--color-gold-500)] bg-[var(--color-gold-500)]/12"
                  : "border-white/10 bg-white/4",
              )}
              style={{ animationDelay: `${Math.min(i * 120, 800)}ms` }}
            >
              <span className="w-[6vh] shrink-0 text-center">
                {i < 3 ? (
                  <Medal rank={i + 1} size={48} className="h-[5vh] w-[5vh]" />
                ) : (
                  <span className="font-display text-[4vh] text-white/30">{i + 1}</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className={cx("text-white", i === 0 ? "text-[4.5vh]" : "text-[3.4vh]")}>
                  {r.text}
                </div>
                <div className="text-[2.2vh] text-white/50">— {r.author}</div>
              </div>
              <span className="shrink-0 font-display text-[5vh] tabular-nums text-[var(--color-gold-300)]">
                {r.votes}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}
