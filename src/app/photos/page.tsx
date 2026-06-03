"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import {
  EmptyState,
  Segmented,
  Spinner,
  cx,
  useNow,
} from "@/components/primitives";
import { timeAgo } from "@/lib/format";
import { MediaCapture } from "@/components/MediaCapture";
import { MediaGrid, type MediaItem } from "@/components/MediaGrid";

type Filter = "all" | "photo" | "video" | "reel";

export default function PhotosPage() {
  const identity = useIdentity();
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useQuery(api.media.stats, {});
  const all = useQuery(api.media.list, {}) as MediaItem[] | undefined;
  const reel = useQuery(
    api.media.highlightReel,
    filter === "reel" ? {} : "skip",
  ) as MediaItem[] | undefined;

  const filtered = useMemo<MediaItem[]>(() => {
    if (!all) return [];
    if (filter === "photo") return all.filter((m) => m.kind === "photo");
    if (filter === "video") return all.filter((m) => m.kind === "video");
    return all;
  }, [all, filter]);

  const loading = all === undefined || stats === undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-medal">The Reel</h1>
          <p className="mt-1 text-sm text-white/55">
            Capture the glory. Star the best for the highlight cut.
          </p>
        </div>
      </header>

      {/* Capture */}
      <MediaCapture />

      {/* Stats strip */}
      {stats && stats.total > 0 && (
        <section className="grid grid-cols-4 gap-2.5">
          <StatPill label="Clips" value={stats.total} emoji="🎞️" />
          <StatPill label="Photos" value={stats.photos} emoji="📸" />
          <StatPill label="Videos" value={stats.videos} emoji="🎬" />
          <StatPill
            label="Reel"
            value={stats.favorites}
            emoji="⭐"
            highlight
          />
        </section>
      )}

      {/* Filter */}
      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "photo", label: "📸 Photos" },
          { value: "video", label: "🎬 Videos" },
          { value: "reel", label: "⭐ Reel" },
        ]}
      />

      {/* Body */}
      {loading ? (
        <Spinner label="Loading the reel…" />
      ) : filter === "reel" ? (
        <ReelView items={reel} />
      ) : (
        <MediaGrid items={filtered} />
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  emoji,
  highlight,
}: {
  label: string;
  value: number;
  emoji: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cx(
        "panel-tight flex flex-col items-center py-3",
        highlight && "ring-1 ring-[var(--color-gold-500)]/40",
      )}
    >
      <div className="text-base">{emoji}</div>
      <div
        className={cx(
          "font-display text-2xl",
          highlight ? "text-[var(--color-gold-400)]" : "text-white",
        )}
      >
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-white/40">
        {label}
      </div>
    </div>
  );
}

// ── ⭐ Highlight reel filmstrip ────────────────────────────────────────────────
function ReelView({ items }: { items: MediaItem[] | undefined }) {
  const now = useNow(30000);
  if (items === undefined) return <Spinner label="Cueing the reel…" />;

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="⭐"
        title="No highlights yet"
        subtitle="Tap the ☆ on any photo or clip to add it to the highlight reel."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="panel-tight flex items-start gap-3 p-4">
        <span className="text-2xl">🎬</span>
        <p className="text-sm text-white/60">
          These {items.length} starred {items.length === 1 ? "pick" : "picks"} are
          queued — in capture order — for the host to stitch into the highlight
          video.
        </p>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {items.map((m, i) => (
          <ReelFrame key={m._id} item={m} index={i} now={now} />
        ))}
      </div>
    </div>
  );
}

function ReelFrame({
  item,
  index,
  now,
}: {
  item: MediaItem;
  index: number;
  now: number;
}) {
  return (
    <figure className="relative w-64 shrink-0 snap-center overflow-hidden rounded-2xl border border-[var(--color-gold-500)]/30 bg-black/40 animate-rise">
      <span className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-gold-500)] font-display text-sm text-[#1a1205]">
        {index + 1}
      </span>
      <div className="aspect-[3/4] w-full">
        {item.url ? (
          item.kind === "video" ? (
            <video
              src={item.url}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.caption ?? "Highlight"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            ⏳
          </div>
        )}
      </div>
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-10">
        {item.caption && (
          <div className="mb-0.5 line-clamp-2 text-sm font-semibold text-white">
            {item.caption}
          </div>
        )}
        <div className="text-[11px] text-white/65">
          <span className="font-semibold text-white/85">
            {item.uploaderName ?? "Someone"}
          </span>{" "}
          · {timeAgo(item.takenAt, now)}
        </div>
      </figcaption>
    </figure>
  );
}
