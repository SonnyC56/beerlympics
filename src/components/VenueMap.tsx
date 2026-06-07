"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

/**
 * A satellite map of the event venue.
 *
 * Renders a mosaic of Web-Mercator satellite tiles centered on the venue, with
 * a pin dropped on the exact spot. Imagery comes from Esri's World Imagery
 * service — the satellite layer commonly paired with OpenStreetMap/Leaflet — so
 * no API key is required. Tapping the map opens the location on OpenStreetMap.
 *
 * Coordinates are taken from the event (`lat`/`lng`) when present; otherwise we
 * geocode the `location` string via OpenStreetMap's Nominatim as a fallback, so
 * the map still works for events that only have an address typed in.
 */

const TILE = 256;
const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

// Module-level cache so we don't re-geocode the same address on every mount.
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

function lngToWorldX(lng: number, z: number) {
  return ((lng + 180) / 360) * TILE * 2 ** z;
}

function latToWorldY(lat: number, z: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  return (
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE * 2 ** z
  );
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        query,
      )}`,
      { headers: { Accept: "application/json" } },
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = data[0]
      ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      : null;
    geocodeCache.set(query, hit);
    return hit;
  } catch {
    geocodeCache.set(query, null);
    return null;
  }
}

export function VenueMap({
  location,
  lat,
  lng,
  locationUrl,
  zoom = 17,
  height = 180,
  className,
}: {
  location?: string;
  lat?: number;
  lng?: number;
  locationUrl?: string;
  zoom?: number;
  height?: number;
  className?: string;
}) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null,
  );
  // Measure the container so the tile mosaic fills its actual width.
  const [width, setWidth] = useState(0);
  const [node, setNode] = useState<HTMLAnchorElement | null>(null);

  // Geocode the address only if we weren't handed explicit coordinates.
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      setCoords({ lat, lng });
      return;
    }
    if (!location) return;
    let alive = true;
    void geocode(location).then((hit) => {
      if (alive && hit) setCoords(hit);
    });
    return () => {
      alive = false;
    };
  }, [location, lat, lng]);

  useEffect(() => {
    if (!node) return;
    const measure = () => setWidth(node.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);

  // Nothing to show (no coords yet / geocode miss) — render the measuring shell
  // so width is known once coords arrive, but keep it collapsed until ready.
  const ready = coords && width > 0;

  const href =
    locationUrl ||
    (coords
      ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=${zoom}/${coords.lat}/${coords.lng}`
      : undefined);

  // Compute the tiles needed to cover the viewport, centered on the venue.
  const tiles: { key: string; src: string; left: number; top: number }[] = [];
  if (ready) {
    const worldX = lngToWorldX(coords.lng, zoom);
    const worldY = latToWorldY(coords.lat, zoom);
    // Top-left world pixel of the viewport.
    const originX = worldX - width / 2;
    const originY = worldY - height / 2;
    const startTileX = Math.floor(originX / TILE);
    const startTileY = Math.floor(originY / TILE);
    const endTileX = Math.floor((originX + width) / TILE);
    const endTileY = Math.floor((originY + height) / TILE);
    const maxTile = 2 ** zoom;
    for (let tx = startTileX; tx <= endTileX; tx++) {
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (ty < 0 || ty >= maxTile) continue;
        const wrappedX = ((tx % maxTile) + maxTile) % maxTile;
        tiles.push({
          key: `${tx}_${ty}`,
          src: `${ESRI_IMAGERY}/${zoom}/${ty}/${wrappedX}`,
          left: tx * TILE - originX,
          top: ty * TILE - originY,
        });
      }
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      ref={setNode}
      className={`group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 ${
        className ?? ""
      }`}
      style={{ height }}
      aria-label={location ? `Open ${location} on a map` : "Open venue on a map"}
    >
      {ready ? (
        <>
          {tiles.map((t) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={t.key}
              src={t.src}
              alt=""
              width={TILE}
              height={TILE}
              loading="lazy"
              className="pointer-events-none absolute max-w-none select-none"
              style={{ left: t.left, top: t.top }}
            />
          ))}

          {/* Center pin — its tip sits on the exact venue coordinate. */}
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full text-[var(--color-flame-soft,#ff7a59)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            style={{ left: "50%", top: "50%" }}
          >
            <Icon name="pin" size={30} />
          </span>

          {/* Address chip + attribution */}
          {location && (
            <span className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 rounded-xl bg-black/55 px-2.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
              <Icon name="pin" size={12} />
              <span className="truncate">{location}</span>
            </span>
          )}
          <span className="absolute right-1 top-1 rounded bg-black/45 px-1 text-[9px] leading-tight text-white/60">
            Imagery © Esri
          </span>
        </>
      ) : (
        <span className="flex h-full items-center justify-center text-xs text-white/40">
          <Icon name="pin" size={14} />
          <span className="ml-1.5">{location ?? "Loading map…"}</span>
        </span>
      )}
    </a>
  );
}
