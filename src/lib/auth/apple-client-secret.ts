import { importPKCS8, SignJWT } from "jose";

/**
 * Apple Sign In client secret for the public site.
 *
 * Better Auth's provider id is `apple`. Apple does not issue a long-lived
 * client secret: the secret is a JWT signed with the Sign in with Apple `.p8`
 * key, and Apple rejects a JWT that expires more than 15777000 seconds
 * (about six months) ahead. This signs a fresh JWT at sign-in time.
 *
 * `APPLE_CLIENT_SECRET`, when set, is used as-is (a JWT Tony already generated).
 * Otherwise the JWT is signed from `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and
 * `APPLE_PRIVATE_KEY` (the `.p8` PEM; literal `\n` sequences are accepted).
 * `APPLE_CLIENT_ID` is the Services ID, not the App ID.
 */

function read(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

/** True when enough Apple env is present to register the social provider. */
export function appleSignInConfigured(): boolean {
  if (!read("APPLE_CLIENT_ID")) return false;
  if (read("APPLE_CLIENT_SECRET")) return true;
  return Boolean(read("APPLE_TEAM_ID") && read("APPLE_KEY_ID") && read("APPLE_PRIVATE_KEY"));
}

/** The Apple client secret JWT, or undefined when Apple is not configured. */
export async function appleClientSecret(): Promise<string | undefined> {
  const existing = read("APPLE_CLIENT_SECRET");
  if (existing) return existing;
  const clientId = read("APPLE_CLIENT_ID");
  const teamId = read("APPLE_TEAM_ID");
  const keyId = read("APPLE_KEY_ID");
  const privateKey = read("APPLE_PRIVATE_KEY");
  if (!clientId || !teamId || !keyId || !privateKey) return undefined;
  const key = await importPKCS8(normalizePrivateKey(privateKey), "ES256");
  const now = Math.floor(Date.now() / 1000);
  // Stay under Apple's 15777000-second maximum lifetime.
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 150 * 24 * 60 * 60)
    .sign(key);
}
