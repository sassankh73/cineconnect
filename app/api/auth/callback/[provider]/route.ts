import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isConfigured,
  exchangeCode,
  verifyIdToken,
  OAUTH_PROVIDERS,
  type OAuthProvider,
} from "@/lib/oauth";
import { loginWithOAuth } from "@/lib/oauth-login";
import { baseUrl, dashboardPath } from "@/lib/api";
import { clientIp, userAgent } from "@/lib/rate-limit";
import { audit } from "@/lib/security";

export const runtime = "nodejs";

// OAuth callback. Google/Microsoft return via GET (?code&state); Apple returns
// via POST (form_post) with an extra `user` field on first sign-in.
async function handle(
  req: Request,
  provider: OAuthProvider,
  input: { code?: string; state?: string; userField?: string }
) {
  const base = baseUrl(req);
  const loginErr = (e: string) => NextResponse.redirect(`${base}/login?error=${e}`);

  const jar = cookies();
  const expectedState = jar.get("cc_oauth_state")?.value;
  const nonce = jar.get("cc_oauth_nonce")?.value;
  // One-time use: clear the anti-forgery cookies regardless of outcome.
  jar.delete("cc_oauth_state");
  jar.delete("cc_oauth_nonce");

  if (!OAUTH_PROVIDERS.includes(provider) || !isConfigured(provider)) {
    return loginErr("oauth_unconfigured");
  }
  if (!input.code || !input.state || !expectedState || input.state !== expectedState) {
    return loginErr("oauth_failed");
  }

  try {
    const redirectUri = `${base}/api/auth/callback/${provider}`;
    const tokens = await exchangeCode(provider, { code: input.code, redirectUri });
    if (!tokens.id_token) throw new Error("no id_token in token response");

    const profile = await verifyIdToken(provider, tokens.id_token, nonce);

    // Apple only sends the user's name on the FIRST sign-in — capture it now.
    let nameOverride: string | undefined;
    if (provider === "apple" && input.userField) {
      try {
        const u = JSON.parse(input.userField) as { name?: { firstName?: string; lastName?: string } };
        nameOverride = [u.name?.firstName, u.name?.lastName].filter(Boolean).join(" ") || undefined;
      } catch {
        /* ignore malformed user field */
      }
    }

    const result = await loginWithOAuth(provider, profile, {
      ip: clientIp(req),
      userAgent: userAgent(req),
      nameOverride,
    });
    await audit(result.isNew ? "oauth_signup" : "oauth_login", provider, result.userId, clientIp(req));
    return NextResponse.redirect(`${base}${dashboardPath(result.role)}`);
  } catch {
    return loginErr("oauth_failed");
  }
}

export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const url = new URL(req.url);
  return handle(req, params.provider as OAuthProvider, {
    code: url.searchParams.get("code") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
  });
}

export async function POST(req: Request, { params }: { params: { provider: string } }) {
  const form = await req.formData().catch(() => null);
  return handle(req, params.provider as OAuthProvider, {
    code: (form?.get("code") as string) || undefined,
    state: (form?.get("state") as string) || undefined,
    userField: (form?.get("user") as string) || undefined,
  });
}
