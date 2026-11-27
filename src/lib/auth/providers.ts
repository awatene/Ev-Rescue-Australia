/**
 * The upstream identity providers this app offers for sign-in (via the broker).
 *
 * Source of truth for BOTH the server (`server.ts`, one `genericOAuth` provider
 * per entry) and the client (`client.ts` / sign-in buttons). Kept in its own
 * dependency-free module so the client can import it without pulling the
 * server-only Better Auth instance (and `pg`) into the browser bundle.
 *
 * Each app federates to the shared **auth broker** (`GROK_AUTH_ISSUER`), which
 * holds the real Google/X secrets. The app never sees them — it only knows its
 * own per-app client id/secret and which upstream to ask the broker for (`idp`).
 *
 * To add an upstream (e.g. GitHub) once the broker supports it: add one entry
 * here (`{ providerId: "grok-github", idp: "github", label: "GitHub" }`). The
 * `providerId` is this app's local id and the OAuth callback path segment
 * (`/api/auth/oauth2/callback/<providerId>`); `idp` is the hint the broker reads
 * to pick the upstream. Those ids are Better Auth social provider ids. X is
 * `twitter`, so the broker's redirect_uri registered with X is
 * `https://auth.grok.me/api/auth/callback/twitter`. Apple is `apple` and
 * Facebook is `facebook` (`/api/auth/callback/apple`, `/api/auth/callback/facebook`).
 *
 * The public site does not use this list for Google, Apple, or Facebook.
 * The broker cannot issue a client for this self-hosted domain, so those three
 * call Better Auth `signIn.social` with the same provider ids and this app's
 * own client credentials (see `server.ts`). This list is still what the live
 * preview popup sends (`idp`) and what Continue with X uses everywhere.
 */
export type GrokProvider = {
  /** This app's local provider id; also the callback path segment. */
  providerId: string;
  /** Upstream hint the broker forwards to (Better Auth social id). */
  idp: string;
  /** Human label for the sign-in button. */
  label: string;
};

export const GROK_PROVIDERS: readonly GrokProvider[] = [
  { providerId: "grok-google", idp: "google", label: "Google" },
  { providerId: "grok-x", idp: "twitter", label: "X" },
  { providerId: "grok-apple", idp: "apple", label: "Apple" },
  { providerId: "grok-facebook", idp: "facebook", label: "Facebook" },
];

function nestedPictureUrl(picture: unknown): string | undefined {
  if (!picture || typeof picture !== "object" || !("data" in picture)) return undefined;
  const data = (picture as { data?: { url?: unknown } }).data;
  return typeof data?.url === "string" && data.url.trim() ? data.url : undefined;
}

/** Profile photo from a Google, X, Apple, or Facebook account, if the broker sent one. */
export function profileImageFrom(profile: Record<string, unknown>): string | undefined {
  const raw = [profile.image, profile.picture, nestedPictureUrl(profile.picture), profile.profile_image_url_https, profile.profile_image_url, profile.avatar_url].find(
    (value) => typeof value === "string" && value.trim(),
  );
  if (typeof raw !== "string") return undefined;
  let url = raw.trim().replace(/^http:\/\//i, "https://");
  url = url.replace("_normal.", "_400x400.");
  return url.startsWith("https://") ? url : undefined;
}
