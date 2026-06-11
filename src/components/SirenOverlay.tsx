"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useNow } from "@/components/primitives";
import { Icon } from "@/components/Icon";

/** How long the takeover stays on screen after the host fires it. */
const WINDOW_MS = 7000;

// A single shared AudioContext, armed on the first user gesture (browsers block
// audio until then). Best-effort: if it can't arm, the siren is silent.
let audioCtx: AudioContext | null = null;
let armed = false;
function armAudio() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const arm = () => {
    try {
      audioCtx ??= new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      void audioCtx.resume?.();
    } catch {
      /* no audio — visual only */
    }
  };
  window.addEventListener("pointerdown", arm);
  window.addEventListener("keydown", arm);
}

function playSiren() {
  try {
    const ctx = audioCtx;
    if (!ctx || ctx.state !== "running") return;
    const start = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.05);
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    let t = start;
    for (let i = 0; i < 5; i++) {
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(900, t + 0.22);
      osc.frequency.linearRampToValueAtTime(440, t + 0.44);
      t += 0.44;
    }
    gain.gain.setValueAtTime(0.25, t - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t);
    osc.connect(gain);
    osc.start(start);
    osc.stop(t + 0.05);
  } catch {
    /* ignore */
  }
}

/**
 * Full-screen "EVERYBODY DRINKS" takeover, driven by event.siren.firedAt. Mount
 * it once where it should appear (the app shell for phones, the TV scoreboard).
 */
export function SirenOverlay() {
  const event = useQuery(api.events.get, {});
  const now = useNow(500);
  const siren = (event as { siren?: { firedAt: number; message: string } } | null
    | undefined)?.siren;
  const active = !!siren && now - siren.firedAt < WINDOW_MS;
  const firedRef = useRef(0);

  useEffect(() => {
    armAudio();
  }, []);

  useEffect(() => {
    if (!siren) return;
    if (siren.firedAt === firedRef.current) return;
    if (now - siren.firedAt >= WINDOW_MS) return; // stale on load — don't replay
    firedRef.current = siren.firedAt;
    playSiren();
    try {
      navigator.vibrate?.([200, 90, 200, 90, 450]);
    } catch {
      /* ignore */
    }
  }, [siren, now]);

  if (!active || !siren) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden text-center animate-siren-flash"
      role="alert"
    >
      <div className="pointer-events-none absolute inset-0 bg-[var(--color-loss)]/30" />
      <div className="relative flex flex-col items-center gap-6 px-6">
        <div className="flex animate-float items-center gap-4 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]">
          <Icon name="beers" size={96} className="h-[16vh] w-[16vh]" />
        </div>
        <div
          className="font-display leading-none text-white"
          style={{ fontSize: "min(22vw, 18vh)", textShadow: "0 0 40px rgba(0,0,0,0.5)" }}
        >
          DRINK!
        </div>
        <div className="max-w-[80vw] font-display text-[clamp(1.5rem,6vw,4rem)] uppercase tracking-wide text-white/95">
          {siren.message}
        </div>
      </div>
    </div>
  );
}
