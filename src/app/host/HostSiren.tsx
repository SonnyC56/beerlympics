"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import { useAction } from "@/components/primitives";
import { Icon } from "@/components/Icon";

/**
 * The host "EVERYBODY DRINKS" siren. Fires a full-screen takeover on the TV +
 * every phone, plus a push broadcast. Optional custom message.
 */
export function DrinkSiren() {
  const identity = useIdentity();
  const run = useAction();
  const fire = useMutation(api.events.fireSiren);
  const [message, setMessage] = useState("");

  return (
    <section className="panel stadium-grid p-5">
      <div className="flex items-center gap-1.5">
        <Icon name="beers" size={20} className="text-[var(--color-loss)]" />
        <h2 className="font-display text-xl text-white">Drink Siren</h2>
      </div>
      <p className="mb-3 mt-1 text-sm text-white/55">
        Blasts an “everybody drinks” takeover on the TV and every phone right now.
      </p>
      <input
        className="field mb-3"
        placeholder="Custom call (optional) — e.g. WATERFALL!"
        value={message}
        maxLength={80}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        className="btn btn-flame w-full py-4 text-lg"
        disabled={!identity.deviceId}
        onClick={() =>
          run(
            () => fire({ deviceId: identity.deviceId!, message: message.trim() || undefined }),
            "Siren fired!",
          )
        }
      >
        <span className="flex items-center justify-center gap-2">
          <Icon name="beers" size={22} /> Sound the DRINK siren
        </span>
      </button>
    </section>
  );
}
