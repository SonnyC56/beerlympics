"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  EmptyState,
  Segmented,
  Sheet,
  Spinner,
  TeamBadge,
  cx,
  useAction,
} from "@/components/primitives";
import {
  RoundList,
  SingleElimBracket,
  type BracketMatch,
} from "@/components/BracketView";
import { GameArt } from "@/components/gameArt";
import { WheelGame } from "@/components/WheelGame";
import { SpecialEventGame } from "@/components/SpecialEventGame";
import { MediaCapture } from "@/components/MediaCapture";
import { MediaGrid } from "@/components/MediaGrid";
import { categoryLabel, categoryEmoji, placeMedal, ordinal } from "@/lib/format";

type GameDoc = {
  _id: Id<"games">;
  name: string;
  emoji: string;
  category: string;
  description?: string;
  rules?: string;
  art?: string;
  format: "single_elim" | "round_robin" | "heats" | "ladder" | "wheel" | "special";
  teamsPerMatch: number;
  pointsMultiplier: number;
  estMinutes: number;
  isGated: boolean;
  gateFromPhaseIndex?: number;
  status: "scheduled" | "active" | "completed" | "locked";
};

type GameStanding = {
  teamId: string;
  name: string;
  emoji: string;
  color: string;
  points: number;
  place?: number;
};

const FORMAT_LABEL: Record<GameDoc["format"], string> = {
  single_elim: "Single Elimination",
  round_robin: "Round Robin",
  heats: "Heats",
  ladder: "Ladder",
  wheel: "Spin Wheel",
  special: "All-Day Event",
};

export default function GameBracketPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const id = gameId as Id<"games">;

  const game = useQuery(api.games.get, { gameId: id }) as
    | GameDoc
    | null
    | undefined;
  const matches = useQuery(api.matches.forGame, { gameId: id }) as
    | BracketMatch[]
    | undefined;
  const standings = useQuery(api.scoring.gameStandings, { gameId: id }) as
    | GameStanding[]
    | undefined;
  const stations = useQuery(api.stations.list, {});

  if (game === undefined) return <Spinner label="Loading the bracket…" />;
  if (game === null) {
    return (
      <div className="space-y-4 py-6">
        <BackLink />
        <EmptyState
          emoji="🤷"
          title="Game not found"
          subtitle="This game may have been removed. Head back to the circuit."
          action={
            <Link href="/play" className="btn btn-gold">
              Back to the Circuit
            </Link>
          }
        />
      </div>
    );
  }

  const stationNameById = new Map<string, string>(
    (stations ?? []).map((s) => [s._id as string, s.name]),
  );
  const stationNameFor = (m: BracketMatch) =>
    m.stationId ? stationNameById.get(m.stationId as string) : undefined;

  return (
    <div className="space-y-5">
      <BackLink />
      <GameHeader game={game} />

      {standings && standings.length > 0 && (
        <MiniLeaderboard standings={standings} />
      )}

      {game.format === "wheel" ? (
        <WheelGame game={{ _id: game._id, name: game.name, emoji: game.emoji }} />
      ) : game.format === "special" ? (
        <SpecialEventGame game={{ _id: game._id, name: game.name, emoji: game.emoji }} />
      ) : (
        <>
          <HostControls game={game} hasMatches={(matches?.length ?? 0) > 0} />
          <BracketSection
            game={game}
            matches={matches}
            stationNameFor={stationNameFor}
          />
          <GameMedia gameId={game._id} />
        </>
      )}
    </div>
  );
}

// ── Media tagged to this game ─────────────────────────────────────────────────
function GameMedia({ gameId }: { gameId: Id<"games"> }) {
  const media = useQuery(api.media.forGame, { gameId, limit: 60 });
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl">📸 Moments</h2>
        <MediaCapture variant="chip" gameId={gameId} label="Add" />
      </div>
      {media === undefined ? null : media.length > 0 ? (
        <MediaGrid items={media} />
      ) : (
        <p className="text-sm text-white/40">No photos or videos yet — add the first.</p>
      )}
    </section>
  );
}

// ── Back link ─────────────────────────────────────────────────────────────────
function BackLink() {
  return (
    <Link
      href="/play"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/55 transition hover:text-white"
    >
      <span className="text-base">←</span> Circuit
    </Link>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function GameHeader({ game }: { game: GameDoc }) {
  const statusMeta: Record<
    GameDoc["status"],
    { label: string; tone: string }
  > = {
    scheduled: { label: "Scheduled", tone: "text-white/55" },
    active: { label: "● Live", tone: "text-[var(--color-live)]" },
    completed: { label: "Completed", tone: "text-[var(--color-win)]" },
    locked: { label: "Locked", tone: "text-white/40" },
  };
  const sm = statusMeta[game.status];

  return (
    <section className="panel stadium-grid relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-6 -top-8 text-[110px] opacity-10">
        {game.emoji}
      </div>
      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-2xl bg-black/30 p-2 ring-1 ring-white/8">
            <GameArt artKey={game.art} size={64} title={game.name} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cx("text-xs font-bold uppercase tracking-widest", sm.tone)}>
                {sm.label}
              </span>
            </div>
            <h1 className="font-display text-3xl leading-none text-white">
              {game.name}
            </h1>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="chip">
            {categoryEmoji(game.category)} {categoryLabel(game.category)}
          </span>
          <span className="chip">🗺️ {FORMAT_LABEL[game.format]}</span>
          {game.pointsMultiplier !== 1 && (
            <span className="chip text-[var(--color-gold-300)]">
              ✖️ {game.pointsMultiplier}× points
            </span>
          )}
          <span className="chip">⏱️ ~{game.estMinutes} min</span>
        </div>

        {game.description && (
          <p className="mt-3 text-sm text-white/65">{game.description}</p>
        )}

        {game.isGated && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[var(--color-grape)]/30 bg-[var(--color-grape)]/10 px-3.5 py-3 text-sm">
            <span className="text-base">🔒</span>
            <span className="text-white/75">
              This is a gated finale
              {typeof game.gateFromPhaseIndex === "number"
                ? ` — unlocks from phase ${game.gateFromPhaseIndex + 1}.`
                : "."}{" "}
              The host seeds it from the leaderboard.
            </span>
          </div>
        )}

        {game.rules && (
          <details className="group mt-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--color-gold-400)]">
              📖 Rules <span className="text-white/40 group-open:hidden">▾</span>
              <span className="hidden text-white/40 group-open:inline">▴</span>
            </summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/65">
              {game.rules}
            </p>
          </details>
        )}
      </div>
    </section>
  );
}

// ── Mini medal leaderboard ────────────────────────────────────────────────────
function MiniLeaderboard({ standings }: { standings: GameStanding[] }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-3 font-display text-xl">🏅 Game Standings</h2>
      <div className="space-y-2">
        {standings.map((t, i) => {
          const medal = placeMedal(t.place);
          return (
            <div
              key={t.teamId}
              className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-7 shrink-0 text-center font-display text-lg text-white/50">
                  {medal || (t.place ? ordinal(t.place) : `#${i + 1}`)}
                </span>
                <TeamBadge emoji={t.emoji} name={t.name} color={t.color} />
              </div>
              <span className="shrink-0 font-display text-lg text-[var(--color-gold-400)]">
                {t.points} <span className="text-xs text-white/40">pts</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Bracket / list body ───────────────────────────────────────────────────────
function BracketSection({
  game,
  matches,
  stationNameFor,
}: {
  game: GameDoc;
  matches: BracketMatch[] | undefined;
  stationNameFor: (m: BracketMatch) => string | undefined;
}) {
  if (matches === undefined) return <Spinner label="Loading matches…" />;

  if (matches.length === 0) {
    return (
      <section className="panel p-2">
        <EmptyState
          emoji="🎲"
          title="No bracket yet"
          subtitle={
            game.isGated
              ? "The host will seed this finale from the leaderboard once earlier games wrap up."
              : "The host hasn't generated this tournament yet. Check back soon."
          }
        />
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl">
          {game.format === "single_elim" ? "🏆 The Bracket" : "📋 The Matches"}
        </h2>
        <span className="text-xs text-white/40">
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </span>
      </div>
      {game.format === "single_elim" ? (
        <>
          <SingleElimBracket
            matches={matches}
            stationNameFor={stationNameFor}
          />
          <p className="mt-3 text-center text-[11px] text-white/30 sm:hidden">
            ← swipe to see later rounds →
          </p>
        </>
      ) : (
        <RoundList matches={matches} stationNameFor={stationNameFor} />
      )}
    </section>
  );
}

// ── Host controls ─────────────────────────────────────────────────────────────
type Seeding = "seed" | "random" | "standings";

function HostControls({
  game,
  hasMatches,
}: {
  game: GameDoc;
  hasMatches: boolean;
}) {
  const identity = useIdentity();
  const run = useAction();
  const generate = useMutation(api.tournament.generate);
  const resetGame = useMutation(api.tournament.resetGame);
  const seedFromStandings = useMutation(api.tournament.seedFromStandings);

  const [genOpen, setGenOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [finaleOpen, setFinaleOpen] = useState(false);
  const [seeding, setSeeding] = useState<Seeding>("seed");
  const [topN, setTopN] = useState(4);
  const [busy, setBusy] = useState(false);

  const seedingHelp = useMemo<Record<Seeding, string>>(
    () => ({
      seed: "Use each team's manual seed (set in Teams). Best for a fair draw.",
      random: "Shuffle teams into the bracket for a chaotic, fun draw.",
      standings: "Seed top teams from the live leaderboard — reward the leaders.",
    }),
    [],
  );

  if (!identity.isHost) return null;
  const deviceId = identity.deviceId;

  const doGenerate = async () => {
    if (!deviceId) return;
    setBusy(true);
    const ok = await run(
      () => generate({ deviceId, gameId: game._id, seeding }),
      `${game.emoji} ${game.name} bracket generated!`,
    );
    setBusy(false);
    if (ok) setGenOpen(false);
  };

  const doReset = async () => {
    if (!deviceId) return;
    setBusy(true);
    const ok = await run(
      () => resetGame({ deviceId, gameId: game._id }),
      `${game.name} reset to scheduled.`,
    );
    setBusy(false);
    if (ok) setResetOpen(false);
  };

  const doSeedFinale = async () => {
    if (!deviceId) return;
    setBusy(true);
    const ok = await run(
      () => seedFromStandings({ deviceId, gameId: game._id, topN }),
      `🎲 Finale seeded from the Top ${topN}!`,
    );
    setBusy(false);
    if (ok) setFinaleOpen(false);
  };

  return (
    <>
      <section className="panel-tight p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-gold-300)]">
          👑 Host controls
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-gold flex-1 whitespace-nowrap"
            disabled={!deviceId}
            onClick={() => {
              setSeeding("seed");
              setGenOpen(true);
            }}
          >
            {hasMatches ? "🔁 Regenerate" : "⚡ Generate bracket"}
          </button>
          {game.isGated && (
            <button
              className="btn btn-flame flex-1 whitespace-nowrap"
              disabled={!deviceId}
              onClick={() => setFinaleOpen(true)}
            >
              🎲 Seed finale
            </button>
          )}
          {hasMatches && (
            <button
              className="btn btn-ghost whitespace-nowrap"
              disabled={!deviceId}
              onClick={() => setResetOpen(true)}
            >
              🗑️ Reset
            </button>
          )}
        </div>
      </section>

      {/* Generate sheet */}
      <Sheet
        open={genOpen}
        onClose={() => !busy && setGenOpen(false)}
        title={hasMatches ? "Regenerate bracket" : "Generate bracket"}
      >
        <div className="space-y-5">
          {hasMatches && (
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--color-loss)]/30 bg-[var(--color-loss)]/10 px-3.5 py-3 text-sm text-white/80">
              <span>⚠️</span>
              <span>
                This wipes the current bracket and any points earned in this
                game's phase, then builds a fresh draw.
              </span>
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Seeding method
            </label>
            <Segmented
              value={seeding}
              onChange={setSeeding}
              options={[
                { value: "seed", label: "Seed" },
                { value: "random", label: "Random" },
                { value: "standings", label: "Standings" },
              ]}
            />
            <p className="mt-2.5 text-sm text-white/55">{seedingHelp[seeding]}</p>
          </div>
          <button
            className="btn btn-gold w-full"
            disabled={busy || !deviceId}
            onClick={doGenerate}
          >
            {busy ? "Building…" : hasMatches ? "Regenerate bracket" : "Generate bracket"}
          </button>
        </div>
      </Sheet>

      {/* Seed finale sheet */}
      <Sheet
        open={finaleOpen}
        onClose={() => !busy && setFinaleOpen(false)}
        title="🎲 Seed the finale"
      >
        <div className="space-y-5">
          <p className="text-sm text-white/65">
            Pull the strongest teams off the live leaderboard into a
            single-elimination finale for {game.emoji} {game.name}.
          </p>
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              How many teams?
            </label>
            <Segmented
              value={String(topN)}
              onChange={(v) => setTopN(Number(v))}
              options={[
                { value: "2", label: "Top 2" },
                { value: "4", label: "Top 4" },
                { value: "8", label: "Top 8" },
              ]}
            />
          </div>
          <button
            className="btn btn-flame w-full"
            disabled={busy || !deviceId}
            onClick={doSeedFinale}
          >
            {busy ? "Seeding…" : `Seed Top ${topN} finale`}
          </button>
        </div>
      </Sheet>

      {/* Reset sheet */}
      <Sheet
        open={resetOpen}
        onClose={() => !busy && setResetOpen(false)}
        title="Reset game?"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-2 rounded-2xl border border-[var(--color-loss)]/30 bg-[var(--color-loss)]/10 px-3.5 py-3 text-sm text-white/80">
            <span>⚠️</span>
            <span>
              This deletes every match for {game.emoji}{" "}
              <span className="font-bold">{game.name}</span> across all phases,
              frees its stations, and removes all points it awarded. This can't
              be undone.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost flex-1"
              disabled={busy}
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-flame flex-1"
              disabled={busy || !deviceId}
              onClick={doReset}
            >
              {busy ? "Resetting…" : "Reset game"}
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
