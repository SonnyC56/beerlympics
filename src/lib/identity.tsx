"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

type IdentityUser = {
  _id: Id<"users">;
  name?: string;
  emoji?: string;
  isHost?: boolean;
  image?: string;
  email?: string;
} | null;

type IdentityValue = {
  /** Kept for back-compat with mutation args; server identity comes from the session. */
  deviceId: string | null;
  user: IdentityUser;
  userId: Id<"users"> | null;
  isHost: boolean;
  /** True once auth + the user query have resolved. */
  ready: boolean;
  hasProfile: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setProfile: (name: string, emoji?: string) => Promise<void>;
  claimHost: (code: string) => Promise<boolean>;
  resignHost: () => Promise<void>;
};

const IdentityContext = createContext<IdentityValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  const user = useQuery(
    api.users.current,
    isAuthenticated ? {} : "skip",
  ) as IdentityUser | undefined;

  const ensure = useMutation(api.users.ensure);
  const setProfileMutation = useMutation(api.users.setProfile);
  const claimHostMutation = useMutation(api.users.claimHost);
  const resignHostMutation = useMutation(api.users.resignHost);

  // When signed in, identity is the auth user id; mutations still take a
  // (server-ignored) deviceId arg, so we pass the user id for traceability.
  const deviceId = isAuthenticated ? user?._id ?? "self" : null;

  // Touch the user once signed in to set defaults (emoji) + lastSeen.
  useEffect(() => {
    if (isAuthenticated && user) void ensure({ deviceId: "self" });
  }, [isAuthenticated, user, ensure]);

  const value = useMemo<IdentityValue>(() => {
    const ready = !isLoading && (!isAuthenticated || user !== undefined);
    return {
      deviceId,
      user: user ?? null,
      userId: user?._id ?? null,
      isHost: !!user?.isHost,
      ready,
      hasProfile: !!user?.name,
      isAuthenticated,
      isLoading,
      signInGoogle: async () => {
        await signIn("google");
      },
      signInApple: async () => {
        await signIn("apple");
      },
      signOut: async () => {
        await signOut();
      },
      setProfile: async (name: string, emoji?: string) => {
        await ensure({ deviceId: "self", name, emoji });
        await setProfileMutation({ deviceId: "self", name, emoji });
      },
      claimHost: async (code: string) =>
        await claimHostMutation({ deviceId: "self", code }),
      resignHost: async () => {
        await resignHostMutation({ deviceId: "self" });
      },
    };
  }, [
    deviceId,
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    ensure,
    setProfileMutation,
    claimHostMutation,
    resignHostMutation,
  ]);

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}
