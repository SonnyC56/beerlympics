import Google from "@auth/core/providers/google";
import Apple from "@auth/core/providers/apple";
import { convexAuth } from "@convex-dev/auth/server";

/**
 * Sign in with Google or Apple. Credentials come from Convex env vars set by the
 * host (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET, AUTH_APPLE_ID / AUTH_APPLE_SECRET).
 * Until those are set, the buttons render but the OAuth round-trip won't complete.
 */
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google, Apple],
});
