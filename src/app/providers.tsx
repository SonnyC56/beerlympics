"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ReactNode, useMemo } from "react";
import { IdentityProvider } from "@/lib/identity";

export function Providers({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev` and copy the URL into .env.local",
      );
    }
    return new ConvexReactClient(url ?? "https://placeholder.convex.cloud");
  }, []);

  return (
    <ConvexAuthProvider client={client}>
      <IdentityProvider>{children}</IdentityProvider>
    </ConvexAuthProvider>
  );
}
