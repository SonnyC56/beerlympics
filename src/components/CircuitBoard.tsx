"use client";

import type { Id } from "@convex/_generated/dataModel";
import { TeamBadge, cx } from "@/components/primitives";
import { Icon, Mascot } from "@/components/Icon";
import { GameArt } from "@/components/gameArt";
import { colorHex } from "@/lib/teamColors";

export type CircuitTeam = {
  _id: Id<"teams">;
  name: string;
  emoji: string;
  color: string;
};

type BoardGame = {
  _id: Id<"games">;
  name: string;
  emoji: string;
  art?: string;
  category: string;
} | null;

export type BoardStation = {
  _id: Id<"stations">;
  name: string;
  status: "open" | "busy" | "closed";
  sortOrder: number;
  game: BoardGame;
  match:
    | {
        _id: Id<"matches">;
        label?: string;
        teams: CircuitTeam[];
      }
    | null;
};

export type UpNextMatch = {
  _id: Id<"matches">;
  label?: string;
  teams: CircuitTeam[];
  gameName?: string;
  gameEmoji?: string;
  gameArt?: string;
};

/** Two TeamBadges with an animated VS pill between them. */
export function VersusRow({
  teams,
  size = "md",
}: {
  teams: CircuitTeam[];
  size?: "sm" | "md";
}) {
  if (teams.length === 0) {
    return <div className="text-sm italic text-white/40">Awaiting teams…</div>;
  }
  if (teams.length === 1) {
    return <TeamBadge emoji={teams[0].emoji} name={teams[0].name} color={teams[0].color} size={size} />;
  }
  if (teams.length === 2) {
    return (
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <TeamBadge emoji={teams[0].emoji} name={teams[0].name} color={teams[0].color} size={size} />
        </div>
        <span className="shrink-0 animate-pulse font-display text-xs text-[var(--color-flame)]">
          VS
        </span>
        <div className="min-w-0 flex-1 text-right">
          <span className="inline-flex flex-row-reverse">
            <TeamBadge emoji={teams[1].emoji} name={teams[1].name} color={teams[1].color} size={size} />
          </span>
        </div>
      </div>
    );
  }
  // Heat (3+): chip cloud.
  return (
    <div className="flex flex-wrap gap-1.5">
      {teams.map((t) => {
        const hex = colorHex(t.color);
        return (
          <span
            key={t._id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold"
            style={{ background: `${hex}1f`, color: hex, border: `1px solid ${hex}44` }}
          >
            <Mascot name={t.emoji} size={14} /> {t.name}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The station board: each station is a card. Open stations glow green and read
 * "OPEN", busy stations show the live match (tappable for hosts to report),
 * closed stations are dimmed + locked. Below it, the up-next queue.
 */
export function CircuitBoard({
  stations,
  upNext,
  canReport,
  onReport,
}: {
  stations: BoardStation[];
  upNext: UpNextMatch[];
  /** Host can tap a busy station to open the result sheet. */
  canReport: boolean;
  onReport: (station: BoardStation) => void;
}) {
  return (
    <div className="space-y-5">
      {stations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center text-sm text-white/45">
          No stations set up yet. The host adds tables in the control room.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stations.map((s) => (
            <StationCard
              key={s._id}
              station={s}
              canReport={canReport}
              onReport={() => onReport(s)}
            />
          ))}
        </div>
      )}

      {upNext.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-display text-lg text-white/90">Up Next</h3>
            <span className="chip">{upNext.length} queued</span>
          </div>
          <div className="space-y-2">
            {upNext.map((m) => (
              <div
                key={m._id}
                className="panel-tight flex items-center gap-3 px-4 py-3"
              >
                <GameArt artKey={m.gameArt} size={20} title={m.gameName ?? "Match"} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/40">
                    <span className="truncate">{m.gameName ?? "Match"}</span>
                    {m.label && <span className="shrink-0 text-white/30">· {m.label}</span>}
                  </div>
                  <VersusRow teams={m.teams} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StationCard({
  station,
  canReport,
  onReport,
}: {
  station: BoardStation;
  canReport: boolean;
  onReport: () => void;
}) {
  const { status, game, match } = station;
  const isBusy = status === "busy" && !!match;
  const isOpen = status === "open";
  const isClosed = status === "closed";
  const tappable = canReport && isBusy;

  return (
    <div
      className={cx(
        "panel relative overflow-hidden p-4 transition",
        isClosed && "opacity-55",
        tappable && "cursor-pointer hover:brightness-110 active:scale-[0.99]",
      )}
      style={
        isOpen
          ? { boxShadow: "0 0 0 1px rgba(54,224,122,0.4), 0 18px 50px -28px rgba(54,224,122,0.55)" }
          : isBusy
            ? { boxShadow: "0 0 0 1px rgba(255,59,107,0.35), 0 18px 50px -30px rgba(255,59,107,0.5)" }
            : undefined
      }
      onClick={tappable ? onReport : undefined}
      role={tappable ? "button" : undefined}
      tabIndex={tappable ? 0 : undefined}
      onKeyDown={
        tappable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onReport();
              }
            }
          : undefined
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GameArt artKey={game?.art} size={18} title={game?.name ?? "Station"} />
          <div className="leading-tight">
            <div className="font-display text-base text-white">{station.name}</div>
            {game && (
              <div className="text-[11px] uppercase tracking-widest text-white/40">
                {game.name}
              </div>
            )}
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {isBusy && match ? (
        <div className="rounded-2xl bg-black/30 p-3">
          <VersusRow teams={match.teams} />
          {tappable && (
            <div className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] font-bold uppercase tracking-widest text-[var(--color-gold-400)]">
              Tap to report result <Icon name="arrowRight" size={12} />
            </div>
          )}
        </div>
      ) : isOpen ? (
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-win)]/10 px-3 py-4 text-sm font-bold text-[var(--color-win)]">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[var(--color-win)]" />
          Open — waiting for the next match
        </div>
      ) : (
        <div className="flex items-center gap-1.5 rounded-2xl bg-white/4 px-3 py-4 text-sm text-white/40">
          <Icon name="lock" size={14} /> Closed for now
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "open" | "busy" | "closed" }) {
  if (status === "busy") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-live)]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-live)]">
        <span className="live-dot" /> Live
      </span>
    );
  }
  if (status === "open") {
    return (
      <span className="rounded-full bg-[var(--color-win)]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-win)]">
        Open
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/6 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/45">
      Closed
    </span>
  );
}
