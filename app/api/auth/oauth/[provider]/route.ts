import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isConfigured,
  buildAuthorizeUrl,
  responseMode,
  OAUTH_PROVIDERS,
  type OAuthProvider,
} from "@/lib/oauth";
import { baseUrl } from "@/lib/api";

export const runtime = "nodejs";

// Start an OAuth sign-in: set anti-forgery state + nonce cookies, then redirect
// the user to the provider's consent screen.
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const provider = params.provider as OAuthProvider;
  const base = baseUrl(req);

  if (!OAUTH_PROVIDERS.includes(provider) || !isConfigured(provider)) {
    return NextResponse.redirect(`${base}/login?error=oauth_unconfigured`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${base}/api/auth/callback/${provider}`;

  // Apple posts the callback cross-site (form_post) → the cookie must survive a
  // cross-site request, which requires SameSite=None; Secure (HTTPS only).
  const crossSite = responseMode(provider) === "form_post";
  const jar = cookies();
  const cookieOpts = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production" || crossSite,
    sameSite: (crossSite ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: 600, // 10 minutes to complete the flow
  };
  jar.set("cc_oauth_state", state, cookieOpts);
  jar.set("cc_oauth_nonce", nonce, cookieOpts);

  return NextResponse.redirect(buildAuthorizeUrl(provider, { redirectUri, state, nonce }));
}
