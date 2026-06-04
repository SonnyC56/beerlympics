import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

/**
 * Sign in with Google. Credentials come from Convex env vars set by the host
 * (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET).
 */
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google],
});
