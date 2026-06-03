"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import { Spinner, cx, useAction } from "@/components/primitives";
import { EmojiPicker, ColorPicker } from "@/components/EmojiColorPicker";
import { HostField, HostSectionTitle } from "./HostKit";

type EventDoc = {
  name: string;
  tagline?: string;
  description?: string;
  dateIso: string;
  startTime?: string;
  location?: string;
  locationUrl?: string;
  coverEmoji: string;
  coverColor: string;
  settings: {
    categoryMultipliers: Record<string, number>;
    defaultPlacementPoints: number[];
    winBonus: number;
    allowSelfClaim: boolean;
  };
};

export function HostSettings() {
  const event = useQuery(api.events.get, {}) as EventDoc | null | undefined;

  if (event === undefined) return <Spinner />;
  if (event === null)
    return (
      <div className="panel p-6 text-center text-white/60">No event to edit.</div>
    );

  return (
    <div className="space-y-5">
      <EventDetails event={event} />
      <ScoringSettings event={event} />
    </div>
  );
}

// ── Event details ─────────────────────────────────────────────────────────────
function EventDetails({ event }: { event: EventDoc }) {
  const identity = useIdentity();
  const run = useAction();
  const update = useMutation(api.events.update);

  const [name, setName] = useState(event.name);
  const [tagline, setTagline] = useState(event.tagline ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [dateIso, setDateIso] = useState(event.dateIso);
  const [startTime, setStartTime] = useState(event.startTime ?? "");
  const [location, setLocation] = useState(event.location ?? "");
  const [locationUrl, setLocationUrl] = useState(event.locationUrl ?? "");
  const [coverEmoji, setCoverEmoji] = useState(event.coverEmoji);
  const [coverColor, setCoverColor] = useState(event.coverColor);

  useEffect(() => {
    setName(event.name);
    setTagline(event.tagline ?? "");
    setDescription(event.description ?? "");
    setDateIso(event.dateIso);
    setStartTime(event.startTime ?? "");
    setLocation(event.location ?? "");
    setLocationUrl(event.locationUrl ?? "");
    setCoverEmoji(event.coverEmoji);
    setCoverColor(event.coverColor);
  }, [event]);

  return (
    <section className="panel p-5">
      <HostSectionTitle emoji="🏟️" title="Event Details" />
      <div className="space-y-3.5">
        <HostField label="Name">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
        </HostField>
        <HostField label="Tagline" hint="optional">
          <input
            className="field"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={80}
          />
        </HostField>
        <HostField label="Description" hint="optional">
          <textarea
            className="field min-h-20 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
          />
        </HostField>
        <div className="grid grid-cols-2 gap-3">
          <HostField label="Date">
            <input
              type="date"
              className="field"
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
            />
          </HostField>
          <HostField label="Start time" hint="optional">
            <input
              className="field"
              placeholder="2:00 PM"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </HostField>
        </div>
        <HostField label="Location" hint="optional">
          <input
            className="field"
            placeholder="The Backyard"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </HostField>
        <HostField label="Map link" hint="optional">
          <input
            className="field"
            placeholder="https://maps.google.com/…"
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
          />
        </HostField>

        <HostField label={`Cover emoji ${coverEmoji}`}>
          <EmojiPicker value={coverEmoji} onChange={setCoverEmoji} />
        </HostField>
        <HostField label="Cover color">
          <ColorPicker value={coverColor} onChange={setCoverColor} />
        </HostField>

        <button
          className="btn btn-gold w-full"
          disabled={!identity.deviceId || !name.trim()}
          onClick={() =>
            run(
              () =>
                update({
                  deviceId: identity.deviceId!,
                  patch: {
                    name: name.trim(),
                    tagline: tagline.trim(),
                    description: description.trim(),
                    dateIso,
                    startTime: startTime.trim(),
                    location: location.trim(),
                    locationUrl: locationUrl.trim(),
                    coverEmoji,
                    coverColor,
                  },
                }),
              "Event updated",
            )
          }
        >
          Save details
        </button>
      </div>
    </section>
  );
}

// ── Scoring settings ──────────────────────────────────────────────────────────
function ScoringSettings({ event }: { event: EventDoc }) {
  const identity = useIdentity();
  const run = useAction();
  const updateSettings = useMutation(api.events.updateSettings);

  const s = event.settings;
  // Read with legacy fallbacks (beer→drinking, long→lawn) for pre-migration events.
  const cm = s.categoryMultipliers;
  const [drinking, setDrinking] = useState(String(cm.drinking ?? cm.beer ?? 1));
  const [lawn, setLawn] = useState(String(cm.lawn ?? cm.long ?? 1.5));
  const [placement, setPlacement] = useState(
    s.defaultPlacementPoints.join(", "),
  );
  const [winBonus, setWinBonus] = useState(String(s.winBonus));
  const [allowSelfClaim, setAllowSelfClaim] = useState(s.allowSelfClaim);

  useEffect(() => {
    setDrinking(String(cm.drinking ?? cm.beer ?? 1));
    setLawn(String(cm.lawn ?? cm.long ?? 1.5));
    setPlacement(s.defaultPlacementPoints.join(", "));
    setWinBonus(String(s.winBonus));
    setAllowSelfClaim(s.allowSelfClaim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const parsedPlacement = placement
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n));
  const placementValid =
    parsedPlacement.length > 0 && parsedPlacement.length === placement.split(",").filter((x) => x.trim() !== "").length;

  return (
    <section className="panel p-5">
      <HostSectionTitle emoji="⚖️" title="Scoring Rules" />
      <div className="space-y-4">
        <HostField label="Category multipliers" hint="weight each game type">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "🍺 Drinking", v: drinking, set: setDrinking },
              { l: "🌳 Lawn", v: lawn, set: setLawn },
            ].map((m) => (
              <div key={m.l}>
                <div className="mb-1 text-center text-[11px] text-white/50">
                  {m.l}
                </div>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="field text-center"
                  value={m.v}
                  onChange={(e) => m.set(e.target.value)}
                />
              </div>
            ))}
          </div>
        </HostField>

        <HostField
          label="Default placement points"
          hint="comma list, best → worst"
        >
          <input
            className={cx("field", !placementValid && "border-[var(--color-loss)]")}
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            placeholder="100, 70, 50, 35, 25"
          />
          {!placementValid && (
            <p className="mt-1 text-[11px] text-[var(--color-loss)]">
              Enter a comma-separated list of numbers.
            </p>
          )}
        </HostField>

        <HostField label="Win bonus" hint="extra points per match won">
          <input
            type="number"
            min={0}
            className="field w-28 text-center"
            value={winBonus}
            onChange={(e) => setWinBonus(e.target.value)}
          />
        </HostField>

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
          <div>
            <div className="font-bold text-white">🙋 Player self-scoring</div>
            <div className="text-xs text-white/45">
              Let players report results for their own matches.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAllowSelfClaim((v) => !v)}
            className={cx(
              "relative h-7 w-12 shrink-0 rounded-full transition",
              allowSelfClaim ? "bg-[var(--color-gold-500)]" : "bg-white/15",
            )}
            aria-pressed={allowSelfClaim}
          >
            <span
              className={cx(
                "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                allowSelfClaim ? "left-6" : "left-1",
              )}
            />
          </button>
        </label>

        <button
          className="btn btn-gold w-full"
          disabled={!identity.deviceId || !placementValid}
          onClick={() =>
            run(
              () =>
                updateSettings({
                  deviceId: identity.deviceId!,
                  settings: {
                    categoryMultipliers: {
                      drinking: Number(drinking) || 0,
                      lawn: Number(lawn) || 0,
                    },
                    defaultPlacementPoints: parsedPlacement,
                    winBonus: Math.max(0, Number(winBonus) || 0),
                    allowSelfClaim,
                  },
                }),
              "Scoring rules saved",
            )
          }
        >
          Save scoring rules
        </button>
      </div>
    </section>
  );
}
