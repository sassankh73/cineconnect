// ---------------------------------------------------------------------------
// OAuth / OIDC sign-in for Google, Microsoft and Apple.
//
// Standard Authorization-Code flow implemented directly on top of `jose` (no
// NextAuth runtime needed — this plugs into the project's existing HttpOnly
// cookie session). ID tokens are verified against each provider's JWKS.
//
// Every provider is OPTIONAL: if its env vars are absent, isConfigured() is
// false and the UI/routes treat it as unavailable. Add the credentials
// (see AUTH_SETUP.md) and it activates with no code changes.
// ---------------------------------------------------------------------------

import {
  SignJWT,
  importPKCS8,
  jwtVerify,
  createRemoteJWKSet,
  type JWTPayload,
} from "jose";

export type OAuthProvider = "google" | "apple" | "microsoft";
export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "apple", "microsoft"];

const MS_TENANT = process.env.MICROSOFT_TENANT || "common";

interface ProviderMeta {
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  jwksUrl: string;
  issuer: string | string[];
  scope: string;
  responseMode: "query" | "form_post";
}

const META: Record<OAuthProvider, ProviderMeta> = {
  google: {
    label: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    scope: "openid email profile",
    responseMode: "query",
  },
  microsoft: {
    label: "Microsoft",
    authorizeUrl: `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`,
    jwksUrl: `https://login.microsoftonline.com/${MS_TENANT}/discovery/v2.0/keys`,
    // MS issuer is tenant-specific; validated loosely below for the `common` endpoint.
    issuer: `https://login.microsoftonline.com/${MS_TENANT}/v2.0`,
    scope: "openid email profile",
    responseMode: "query",
  },
  apple: {
    label: "Apple",
    authorizeUrl: "https://appleid.apple.com/auth/authorize",
    tokenUrl: "https://appleid.apple.com/auth/token",
    jwksUrl: "https://appleid.apple.com/auth/keys",
    issuer: "https://appleid.apple.com",
    scope: "name email",
    responseMode: "form_post", // Apple requires form_post when name/email is requested
  },
};

export function providerLabel(p: OAuthProvider): string {
  return META[p].label;
}

export function responseMode(p: OAuthProvider): "query" | "form_post" {
  return META[p].responseMode;
}

function clientId(p: OAuthProvider): string | undefined {
  if (p === "google") return process.env.GOOGLE_CLIENT_ID;
  if (p === "microsoft") return process.env.MICROSOFT_CLIENT_ID;
  return process.env.APPLE_CLIENT_ID;
}

export function isConfigured(p: OAuthProvider): boolean {
  if (p === "google") return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  if (p === "microsoft")
    return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
  return !!(
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  );
}

export function configuredProviders(): OAuthProvider[] {
  return OAUTH_PROVIDERS.filter(isConfigured);
}

// ---------------- Authorize URL ----------------
export function buildAuthorizeUrl(
  p: OAuthProvider,
  opts: { redirectUri: string; state: string; nonce: string }
): string {
  const m = META[p];
  const params = new URLSearchParams({
    client_id: clientId(p)!,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: m.scope,
    state: opts.state,
    nonce: opts.nonce,
  });
  if (m.responseMode === "form_post") params.set("response_mode", "form_post");
  if (p === "google") {
    params.set("access_type", "offline");
    params.set("prompt", "select_account");
  }
  return `${m.authorizeUrl}?${params.toString()}`;
}

// ---------------- Apple client secret (ES256 JWT) ----------------
async function appleClientSecret(): Promise<string> {
  const pkcs8 = (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const key = await importPKCS8(pkcs8, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

async function clientSecret(p: OAuthProvider): Promise<string> {
  if (p === "google") return process.env.GOOGLE_CLIENT_SECRET!;
  if (p === "microsoft") return process.env.MICROSOFT_CLIENT_SECRET!;
  return appleClientSecret();
}

// ---------------- Token exchange ----------------
interface TokenResponse {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export async function exchangeCode(
  p: OAuthProvider,
  opts: { code: string; redirectUri: string }
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: opts.code,
    redirect_uri: opts.redirectUri,
    client_id: clientId(p)!,
    client_secret: await clientSecret(p),
  });
  const res = await fetch(META[p].tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || data.error) {
    throw new Error(`${p} token exchange failed: ${data.error || res.status} ${data.error_description || ""}`);
  }
  return data;
}

// ---------------- ID-token verification ----------------
const jwksCache = new Map<OAuthProvider, ReturnType<typeof createRemoteJWKSet>>();
function jwks(p: OAuthProvider) {
  let set = jwksCache.get(p);
  if (!set) {
    set = createRemoteJWKSet(new URL(META[p].jwksUrl));
    jwksCache.set(p, set);
  }
  return set;
}

export interface OAuthProfile {
  providerAccountId: string; // OIDC `sub`
  email?: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export async function verifyIdToken(
  p: OAuthProvider,
  idToken: string,
  expectedNonce?: string
): Promise<OAuthProfile> {
  const m = META[p];
  // Microsoft `common` issues tenant-specific issuers; skip strict issuer check there.
  const verifyOpts =
    p === "microsoft"
      ? { audience: clientId(p)! }
      : { issuer: m.issuer, audience: clientId(p)! };

  const { payload } = await jwtVerify(idToken, jwks(p), verifyOpts);
  const claims = payload as JWTPayload & {
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
    nonce?: string;
  };
  if (expectedNonce && claims.nonce && claims.nonce !== expectedNonce) {
    throw new Error(`${p}: nonce mismatch`);
  }
  return {
    providerAccountId: String(claims.sub),
    email: claims.email?.toLowerCase(),
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    name: claims.name,
    picture: claims.picture,
  };
}
