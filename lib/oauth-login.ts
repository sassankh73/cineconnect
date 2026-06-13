// Turns a verified OAuth profile into a CineConnect session: link an existing
// account by provider id or email (spec: "auto-link if email matches"), or
// create a fresh user, then open the HttpOnly cookie session.

import { mutate, uid } from "./db";
import { setSession } from "./auth";
import type { OAuthProvider, OAuthProfile } from "./oauth";
import type { Role } from "./types";

export interface OAuthLoginResult {
  userId: string;
  role: Role;
  isNew: boolean;
}

export async function loginWithOAuth(
  provider: OAuthProvider,
  profile: OAuthProfile,
  opts: { ip?: string; userAgent?: string; nameOverride?: string }
): Promise<OAuthLoginResult> {
  const email = profile.email;
  const displayName = opts.nameOverride || profile.name || "";

  const result = await mutate((db) => {
    // 1) Already linked via this provider?
    const link = db.oauthAccounts.find(
      (a) => a.provider === provider && a.provider_account_id === profile.providerAccountId
    );
    let user = link ? db.users.find((u) => u.id === link.userId) : undefined;

    // 2) Auto-link by matching email.
    if (!user && email) user = db.users.find((u) => u.email === email);

    let isNew = false;
    if (!user) {
      // 3) Create a brand-new account (default role: player).
      isNew = true;
      const now = new Date().toISOString();
      user = {
        id: uid("usr_"),
        email: email || `${provider}_${profile.providerAccountId}@oauth.local`,
        password_hash: "", // OAuth-only account
        role: "player",
        email_verified: profile.emailVerified || !!email,
        provider,
        provider_id: profile.providerAccountId,
        full_name_latin: displayName,
        avatar_url: profile.picture,
        is_active: true,
        failed_login_attempts: 0,
        created_at: now,
        updated_at: now,
      };
      db.users.push(user);
    } else {
      // Backfill any missing profile bits from the provider.
      if (!user.avatar_url && profile.picture) user.avatar_url = profile.picture;
      if (!user.full_name_latin && displayName) user.full_name_latin = displayName;
      if (email && !user.email_verified && profile.emailVerified) user.email_verified = true;
      user.updated_at = new Date().toISOString();
    }

    // Ensure the provider link row exists.
    const linked = db.oauthAccounts.some(
      (a) => a.provider === provider && a.provider_account_id === profile.providerAccountId
    );
    if (!linked) {
      db.oauthAccounts.push({
        id: uid("oau_"),
        userId: user.id,
        provider,
        provider_account_id: profile.providerAccountId,
        created_at: new Date().toISOString(),
      });
    }

    return {
      userId: user.id,
      role: user.role,
      name: user.full_name_latin || user.full_name_persian || user.email,
      email: user.email,
      isNew,
    };
  });

  await setSession(
    { sub: result.userId, role: result.role, name: result.name, email: result.email },
    { remember: true, ip: opts.ip, userAgent: opts.userAgent }
  );

  return { userId: result.userId, role: result.role, isNew: result.isNew };
}
