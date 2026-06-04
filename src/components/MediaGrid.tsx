"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import { EmptyState, Sheet, cx, useAction, useNow } from "@/components/primitives";
import { Icon } from "@/components/Icon";
import { timeAgo } from "@/lib/format";

export type MediaItem = {
  _id: Id<"media">;
  kind: "photo" | "video";
  url: string | null;
  uploaderName?: string;
  uploaderUserId?: Id<"users">;
  caption?: string;
  takenAt: number;
  teamId?: Id<"teams">;
  favorite: boolean;
  createdAt: number;
};

/**
 * Masonry gallery of photos/videos. Each tile overlays the uploader + time, a
 * caption, a favorite (star) toggle, and a delete affordance for the uploader/host.
 * Tapping a tile opens a fullscreen lightbox.
 */
export function MediaGrid({ items }: { items: MediaItem[] }) {
  const now = useNow(30000);
  const [active, setActive] = useState<MediaItem | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        icon="film"
        title="No clips yet"
        subtitle="Be the first to capture the action — tap Capture above."
      />
    );
  }

  return (
    <>
      <div className="columns-2 gap-3 [column-fill:_balance] sm:columns-3">
        {items.map((m) => (
          <MediaTile
            key={m._id}
            item={m}
            now={now}
            onOpen={() => setActive(m)}
          />
        ))}
      </div>
      <Lightbox item={active} now={now} onClose={() => setActive(null)} />
    </>
  );
}

function MediaTile({
  item,
  now,
  onOpen,
}: {
  item: MediaItem;
  now: number;
  onOpen: () => void;
}) {
  return (
    <div className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-white/8 bg-black/40 animate-rise">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full"
        aria-label="Open media"
      >
        {item.url ? (
          item.kind === "video" ? (
            <video
              src={item.url}
              controls
              playsInline
              preload="metadata"
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.caption ?? "Beerlympics moment"}
              loading="lazy"
              className="w-full"
            />
          )
        ) : (
          <div className="flex aspect-square items-center justify-center text-white/30">
            <Icon name="clock" size={28} />
          </div>
        )}

        {/* Bottom gradient + meta */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2.5 pt-8 text-left">
          {item.caption && (
            <div className="mb-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-white">
              {item.caption}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-white/65">
            <span className="truncate font-semibold text-white/85">
              {item.uploaderName ?? "Someone"}
            </span>
            <span>·</span>
            <span className="shrink-0">{timeAgo(item.takenAt, now)}</span>
          </div>
        </div>

        {/* Kind badge */}
        {item.kind === "video" && (
          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/90">
            <Icon name="film" size={11} /> VIDEO
          </span>
        )}
      </button>

      {/* Favorite toggle (top-right) */}
      <FavoriteButton item={item} className="absolute right-2 top-2" />
    </div>
  );
}

function FavoriteButton({
  item,
  className,
  large,
}: {
  item: MediaItem;
  className?: string;
  large?: boolean;
}) {
  const identity = useIdentity();
  const run = useAction();
  const toggle = useMutation(api.media.toggleFavorite);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!identity.deviceId) return;
        run(
          () =>
            toggle({ deviceId: identity.deviceId!, mediaId: item._id }),
          item.favorite ? "Removed from the reel" : "Added to the reel",
        );
      }}
      disabled={!identity.deviceId}
      aria-label={item.favorite ? "Remove from reel" : "Add to reel"}
      className={cx(
        "flex items-center justify-center rounded-full backdrop-blur transition active:scale-90 disabled:opacity-40",
        large ? "h-11 w-11 text-2xl" : "h-8 w-8 text-base",
        item.favorite
          ? "bg-[var(--color-gold-500)]/90 text-[#1a1205]"
          : "bg-black/55 text-white/80 hover:bg-black/75",
        className,
      )}
    >
      <Icon name={item.favorite ? "star" : "starOutline"} size={large ? 22 : 16} />
    </button>
  );
}

function Lightbox({
  item,
  now,
  onClose,
}: {
  item: MediaItem | null;
  now: number;
  onClose: () => void;
}) {
  const identity = useIdentity();
  const run = useAction();
  const remove = useMutation(api.media.remove);

  const canDelete =
    !!item &&
    !!identity.user &&
    (identity.isHost || item.uploaderUserId === identity.user._id);

  return (
    <Sheet open={!!item} onClose={onClose} title={item?.kind === "video" ? "Clip" : "Photo"}>
      {item && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
            {item.url ? (
              item.kind === "video" ? (
                <video
                  src={item.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[60dvh] w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.caption ?? "Beerlympics moment"}
                  className="max-h-[60dvh] w-full object-contain"
                />
              )
            ) : null}
          </div>

          {item.caption && (
            <p className="text-base font-semibold text-white">{item.caption}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-white/55">
              <span className="font-semibold text-white/80">
                {item.uploaderName ?? "Someone"}
              </span>{" "}
              · {timeAgo(item.takenAt, now)}
            </div>
            <FavoriteButton item={item} large />
          </div>

          {canDelete && (
            <button
              type="button"
              className="btn btn-ghost flex w-full items-center justify-center gap-2 text-[var(--color-loss)]"
              onClick={() =>
                run(
                  async () => {
                    await remove({
                      deviceId: identity.deviceId!,
                      mediaId: item._id,
                    });
                  },
                  "Deleted",
                ).then((ok) => ok && onClose())
              }
            >
              <Icon name="trash" size={16} /> Delete
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}
