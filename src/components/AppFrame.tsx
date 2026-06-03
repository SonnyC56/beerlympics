"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useIdentity } from "@/lib/identity";
import {
  Avatar,
  Sheet,
  ToastProvider,
  cx,
  useAction,
} from "./primitives";
import { EmojiPicker } from "./EmojiColorPicker";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/games", label: "Games", icon: "🎮" },
  { href: "/teams", label: "Teams", icon: "👥" },
  { href: "/play", label: "Circuit", icon: "🎯" },
  { href: "/scoreboard", label: "Board", icon: "🏆" },
  { href: "/photos", label: "Photos", icon: "📸" },
];

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <Shell>{children}</Shell>
    </ToastProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const event = useQuery(api.events.get, {});
  const identity = useIdentity();
  const [profileOpen, setProfileOpen] = useState(false);

  // The big-screen scoreboard is chromeless (a public TV display — no sign-in).
  const chromeless = pathname === "/scoreboard/tv";
  if (chromeless) return <>{children}</>;

  // Auth gate: everyone signs in with Google / Apple before entering.
  if (!identity.ready) return <SplashScreen />;
  if (!identity.isAuthenticated) return <SignInScreen />;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[var(--color-ink-950)]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">{event?.coverEmoji ?? "🏅"}</span>
            <div className="leading-none">
              <div className="font-display text-lg tracking-wide text-white">
                {event?.name ?? "Beerlympics"}
              </div>
              {event && (
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/45">
                  {event.status === "live" ? (
                    <>
                      <span className="live-dot" /> LIVE NOW
                    </>
                  ) : event.status === "finished" ? (
                    "🏆 Final results"
                  ) : (
                    "RSVPs open"
                  )}
                </div>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {identity.isHost && (
              <Link
                href="/host"
                className={cx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-lg transition",
                  pathname.startsWith("/host")
                    ? "bg-[var(--color-gold-500)] text-[#1a1205]"
                    : "bg-white/8 hover:bg-white/15",
                )}
                title="Host controls"
              >
                ⚙️
              </Link>
            )}
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white/8 py-1 pl-1 pr-3 transition hover:bg-white/15"
            >
              <Avatar emoji={identity.user?.emoji ?? "🍺"} size={28} />
              <span className="max-w-24 truncate text-sm font-semibold">
                {identity.hasProfile ? identity.user?.name : "Set name"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-[var(--color-ink-950)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2">
          {TABS.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cx(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition",
                  active ? "text-[var(--color-gold-400)]" : "text-white/45",
                )}
              >
                <span
                  className={cx(
                    "text-xl transition",
                    active && "scale-110 drop-shadow-[0_0_8px_rgba(247,183,51,0.5)]",
                  )}
                >
                  {t.icon}
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5">
      <div className="text-6xl animate-float">🏅🍺</div>
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[var(--color-gold-500)]" />
    </div>
  );
}

function SignInScreen() {
  const identity = useIdentity();
  const run = useAction();
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="panel stadium-grid w-full max-w-sm p-7 text-center animate-rise">
        <div className="text-6xl animate-float">🏅🍺</div>
        <h1 className="mt-3 font-display text-4xl text-medal">Beerlympics</h1>
        <p className="mt-2 text-sm text-white/60">
          Sign in to RSVP, draft your team, and compete. One tap — your spot follows
          you across devices.
        </p>
        <div className="mt-6 space-y-2.5">
          <button
            className="btn w-full bg-white py-3.5 font-bold text-[#1a1205] hover:brightness-95"
            onClick={() => run(() => identity.signInGoogle())}
          >
            <span className="text-base font-black text-[#4285F4]">G</span> Continue with
            Google
          </button>
          <button
            className="btn w-full bg-black py-3.5 font-bold text-white ring-1 ring-white/15 hover:bg-[#141414]"
            onClick={() => run(() => identity.signInApple())}
          >
            <span className="text-base"></span> Continue with Apple
          </button>
        </div>
        <p className="mt-5 text-xs text-white/35">
          We only use this to remember who you are year to year.
        </p>
      </div>
    </div>
  );
}

function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const identity = useIdentity();
  const run = useAction();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍺");
  const [hostCode, setHostCode] = useState("");
  const [showHost, setShowHost] = useState(false);

  // Initialize the form from the current profile each time the sheet opens.
  useEffect(() => {
    if (open) {
      setName(
        identity.user?.name && identity.user.name !== "New Player"
          ? identity.user.name
          : "",
      );
      setEmoji(identity.user?.emoji ?? "🍺");
      setShowHost(false);
      setHostCode("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title="Your Profile">
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white/70">
            Display name
          </label>
          <input
            className="field"
            placeholder={identity.user?.name ?? "What should we call you?"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={28}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/70">
            Pick your emoji {emoji}
          </label>
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>
        <button
          className="btn btn-gold w-full"
          onClick={() =>
            run(
              async () => {
                await identity.setProfile(name || identity.user?.name || "Player", emoji);
              },
              "Profile saved!",
            ).then((ok) => ok && onClose())
          }
        >
          Save profile
        </button>

        <div className="hairline pt-4">
          {identity.isHost ? (
            <div className="flex items-center justify-between rounded-2xl bg-[var(--color-gold-500)]/10 px-4 py-3">
              <div className="text-sm font-semibold text-[var(--color-gold-300)]">
                👑 You're a host
              </div>
              <button
                className="text-xs text-white/50 underline"
                onClick={() => run(() => identity.resignHost())}
              >
                Step down
              </button>
            </div>
          ) : !showHost ? (
            <button
              className="text-sm text-white/50 underline"
              onClick={() => setShowHost(true)}
            >
              I'm the host →
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/70">
                Enter host code
              </label>
              <div className="flex gap-2">
                <input
                  className="field"
                  placeholder="HOST CODE"
                  value={hostCode}
                  onChange={(e) => setHostCode(e.target.value.toUpperCase())}
                />
                <button
                  className="btn btn-ghost shrink-0"
                  onClick={() =>
                    run(
                      () => identity.claimHost(hostCode),
                      "Host unlocked! ⚙️",
                    )
                  }
                >
                  Unlock
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hairline flex items-center justify-between pt-4">
          <div className="min-w-0 truncate text-xs text-white/40">
            {identity.user?.email ?? "Signed in"}
          </div>
          <button
            className="shrink-0 text-sm font-semibold text-white/55 underline hover:text-white"
            onClick={() => run(() => identity.signOut())}
          >
            Sign out
          </button>
        </div>
      </div>
    </Sheet>
  );
}
