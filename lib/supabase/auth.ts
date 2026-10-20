import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthUser = { id: string; email: string };

// Comma-separated list of emails allowed to use the app. Fails closed:
// if ALLOWED_EMAILS is unset, nobody gets in.
export function isAllowedEmail(email: string | undefined) {
  if (!email) return false;
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

// Verified user from the session JWT, or null if signed out / not allowed.
export async function getUser(
  supabase: SupabaseClient,
): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || !isAllowedEmail(claims.email)) return null;
  return { id: claims.sub, email: claims.email as string };
}

// Only allow relative in-app redirects, so ?next= can't send users off-site.
export function safeNext(next: string | null | undefined, fallback = "/app") {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : fallback;
}
