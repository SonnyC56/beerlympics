"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { EmptyState, Spinner, TeamBadge, useNow } from "@/components/primitives";
import { MediaCapture } from "@/components/MediaCapture";
import { Icon } from "@/components/Icon";
import { timeAgo } from "@/lib/format";

type Roast = {
  _id: string;
  url: string | null;
  kind: "photo" | "video";
  caption?: string;
  uploaderName?: string;
  teamName?: string | null;
  teamEmoji?: string | null;
  teamColor?: string | null;
  createdAt: number;
};

export default function RoastCamPage() {
  const roasts = useQuery(api.media.roasts, {}) as Roast[] | undefined;
  const now = useNow(30000);

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--color-flame-soft)]">
          <Icon name="mic" size={14} /> Roast Cam
        </div>
        <h1 className="mt-1 font-display text-4xl leading-none text-medal">
          Talk Your Trash
        </h1>
        <p className="mt-1.5 text-sm text-white/55">
          Record a confessional. Call your shot, roast your rivals — the best ones play
          during the opening ceremony and the highlight reel.
        </p>
      </header>

      <MediaCapture
        roast
        label="Step up to the Roast Cam"
        className="animate-rise"
      />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl text-white/90">
          <Icon name="video" size={18} /> The Roasts
          {roasts && roasts.length > 0 && <span className="chip">{roasts.length}</span>}
        </h2>

        {roasts === undefined ? (
          <Spinner label="Loading the roasts…" />
        ) : roasts.length === 0 ? (
          <EmptyState
            icon="mic"
            title="No roasts yet"
            subtitle="Be the first to step up and talk some trash."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {roasts.map((r) => (
              <div key={r._id} className="panel overflow-hidden">
                {r.url ? (
                  <video
                    src={r.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full bg-black object-contain"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-black/40 text-white/30">
                    <Icon name="video" size={32} />
                  </div>
                )}
                <div className="space-y-1.5 p-3.5">
                  {r.caption && (
                    <p className="text-sm font-semibold text-white/85">“{r.caption}”</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    {r.teamName ? (
                      <TeamBadge
                        emoji={r.teamEmoji ?? "star"}
                        name={r.teamName}
                        color={r.teamColor ?? "gold"}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-white/45">
                        {r.uploaderName ?? "Someone"}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-white/30">
                      {timeAgo(r.createdAt, now)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        href="/photos"
        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-white/50 underline hover:text-white"
      >
        Back to the highlight reel <Icon name="arrowRight" size={14} />
      </Link>
    </div>
  );
}
