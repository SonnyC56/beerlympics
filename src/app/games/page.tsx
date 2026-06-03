"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { EmptyState, Spinner, cx } from "@/components/primitives";
import { GameArt } from "@/components/gameArt";
import { categoryEmoji, categoryLabel } from "@/lib/format";

type Game = {
  _id: Id<"games">;
  name: string;
  emoji: string;
  category: string;
  description?: string;
  rules?: string;
  art?: string;
  enabled?: boolean;
  format: "single_elim" | "round_robin" | "heats" | "ladder" | "wheel" | "special";
  teamsPerMatch: number;
  isGated: boolean;
  status: "scheduled" | "active" | "completed" | "locked";
};

const FORMAT_LABEL: Record<string, string> = {
  single_elim: "Single elimination",
  round_robin: "Round robin",
  heats: "Heats",
  ladder: "Ladder",
  wheel: "Spin the wheel",
  special: "All-day event",
};

const CATEGORY_ORDER: string[] = ["drinking", "lawn"];

export default function GamesLibraryPage() {
  const games = useQuery(api.games.list, {}) as Game[] | undefined;
  const [open, setOpen] = useState<string | null>(null);

  if (games === undefined) return <Spinner label="Loading the game library…" />;

  const enabled = games.filter((g) => g.enabled !== false);
  if (enabled.length === 0) {
    return (
      <EmptyState
        emoji="🎮"
        title="No games yet"
        subtitle="The host hasn't set the lineup. Check back soon."
        action={
          <Link href="/" className="btn btn-gold">
            Back home
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-gold-400)]">
          🎮 The Library
        </div>
        <h1 className="mt-1 font-display text-4xl leading-none text-medal">
          Games &amp; Rules
        </h1>
        <p className="mt-1.5 text-sm text-white/55">
          Every game in this year&apos;s lineup, with the rules. Tap a game to read how it&apos;s played.
        </p>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const inCat = enabled.filter(
          (g) =>
            g.category === cat &&
            g.format !== "wheel" &&
            g.format !== "special",
        );
        if (inCat.length === 0) return null;
        return (
          <section key={cat} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{categoryEmoji(cat)}</span>
              <h2 className="font-display text-xl text-white/90">
                {categoryLabel(cat)}s
              </h2>
              <span className="chip">{inCat.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {inCat.map((g) => (
                <GameLibraryCard
                  key={g._id}
                  game={g}
                  open={open === g._id}
                  onToggle={() => setOpen((cur) => (cur === g._id ? null : g._id))}
                />
              ))}
            </div>
          </section>
        );
      })}

      {enabled.some((g) => g.format === "wheel" || g.format === "special") && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎡</span>
            <h2 className="font-display text-xl text-white/90">Specials &amp; All-Day</h2>
            <span className="chip">
              {enabled.filter((g) => g.format === "wheel" || g.format === "special").length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {enabled
              .filter((g) => g.format === "wheel" || g.format === "special")
              .map((g) => (
                <GameLibraryCard
                  key={g._id}
                  game={g}
                  open={open === g._id}
                  onToggle={() => setOpen((cur) => (cur === g._id ? null : g._id))}
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GameLibraryCard({
  game,
  open,
  onToggle,
}: {
  game: Game;
  open: boolean;
  onToggle: () => void;
}) {
  const rules = (game.rules ?? "").split("\n").map((r) => r.trim()).filter(Boolean);
  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/[0.03]"
      >
        <span className="shrink-0 rounded-2xl bg-black/30 p-1.5 ring-1 ring-white/8">
          <GameArt artKey={game.art} size={56} title={game.name} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-display text-xl leading-none text-white">
              {game.emoji} {game.name}
            </span>
            {game.isGated && (
              <span className="chip border-[var(--color-flame)]/40 text-[var(--color-flame-soft)]">
                🔒 Finale
              </span>
            )}
          </span>
          {game.description && (
            <span className="mt-1 block text-xs text-white/55">{game.description}</span>
          )}
          <span className="mt-1.5 block text-[11px] uppercase tracking-wide text-white/35">
            {FORMAT_LABEL[game.format] ?? game.format}
            {game.teamsPerMatch > 2 ? ` · heats of ${game.teamsPerMatch}` : ""}
          </span>
        </span>
        <span className={cx("shrink-0 text-white/30 transition-transform", open && "rotate-180")}>▾</span>
      </button>

      {open && (
        <div className="border-t border-white/8 bg-black/25 px-4 py-4 animate-rise">
          {rules.length > 0 ? (
            <ol className="space-y-2">
              {rules.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-white/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold-500)]/15 text-[11px] font-bold text-[var(--color-gold-300)]">
                    {i + 1}
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-white/40">No rules written yet.</p>
          )}
          <Link
            href={`/games/${game._id}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-gold-400)] hover:text-[var(--color-gold-300)]"
          >
            View bracket &amp; standings →
          </Link>
        </div>
      )}
    </div>
  );
}
