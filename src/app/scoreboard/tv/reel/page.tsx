"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { colorHex } from "@/lib/teamColors";
import { formatClock, placeMedal } from "@/lib/format";

type Item = {
  _id: string;
  kind: "photo" | "video";
  url: string | null;
  caption?: string;
  uploaderName?: string;
  takenAt: number;
};

const PHOTO_MS = 6500;
const VIDEO_CAP_MS = 28000;

export default function PhotoReelTV() {
  const event = useQuery(api.events.get, {});
  const standings = useQuery(api.scoring.standings, {});
  const mediaRaw = useQuery(api.media.list, { limit: 150 }) as Item[] | undefined;

  const items = (mediaRaw ?? []).filter((m) => m.url);
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = items.length > 0 ? items[index % items.length] : null;

  // Advance: photos on a timer, videos on end (with a safety cap).
  useEffect(() => {
    if (!current) return;
    const next = () => setIndex((i) => i + 1);
    const ms = current.kind === "video" ? VIDEO_CAP_MS : PHOTO_MS;
    const t = setTimeout(next, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?._id]);

  const teams = standings?.teams ?? [];
  const crawl = teams.slice(0, 10).map((t) => ({
    label: `${placeMedal(t.rank) || `#${t.rank}`} ${t.emoji} ${t.name}`,
    total: t.total,
    color: t.color,
  }));

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-[var(--color-ink-950)]">
      {/* Header */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-8 py-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{event?.coverEmoji ?? "🏅"}</span>
          <div className="font-display text-3xl tracking-wide text-white">
            {event?.name ?? "Beerlympics"}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--color-live)]/20 px-4 py-2 font-display text-xl text-[var(--color-live)]">
          <span className="live-dot" /> LIVE REEL
        </div>
      </div>

      {/* Stage */}
      <div className="absolute inset-0 flex items-center justify-center">
        {!current ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-7xl animate-float">📸</div>
            <div className="font-display text-4xl text-medal">The reel starts when you do</div>
            <div className="text-lg text-white/50">Snap photos & videos in the app — they appear here live.</div>
          </div>
        ) : current.kind === "video" ? (
          <video
            key={current._id}
            ref={videoRef}
            src={current.url ?? undefined}
            autoPlay
            muted
            playsInline
            onEnded={() => setIndex((i) => i + 1)}
            className="h-full w-full object-contain animate-slide-fade"
          />
        ) : (
          <div key={current._id} className="h-full w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url ?? ""}
              alt={current.caption ?? "Beerlympics moment"}
              className="kenburns h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Caption overlay */}
      {current && (current.caption || current.uploaderName) && (
        <div className="absolute inset-x-0 bottom-20 z-20 flex justify-center px-10">
          <div className="max-w-4xl rounded-2xl bg-black/55 px-6 py-4 text-center backdrop-blur-md animate-slide-fade">
            {current.caption && (
              <div className="font-display text-3xl leading-tight text-white">{current.caption}</div>
            )}
            <div className="mt-1 text-base text-white/60">
              {current.uploaderName ? `📸 ${current.uploaderName}` : "📸"} · {formatClock(current.takenAt)}
            </div>
          </div>
        </div>
      )}

      {/* Score crawl */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/70 py-3 backdrop-blur-md">
        {crawl.length > 0 ? (
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap pl-10">
            {[...crawl, ...crawl].map((c, i) => (
              <span key={i} className="flex items-center gap-2 font-display text-2xl">
                <span className="text-white">{c.label}</span>
                <span style={{ color: colorHex(c.color) }}>{c.total}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="px-10 font-display text-2xl text-white/40">Beerlympics — let the games begin 🍺</div>
        )}
      </div>
    </div>
  );
}
