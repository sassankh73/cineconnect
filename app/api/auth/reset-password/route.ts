import { readDB, mutate } from "@/lib/db";
import { hashPassword, invalidateAllSessions } from "@/lib/auth";
import { resetPasswordSchema, firstErrorKey } from "@/lib/validation/auth";
import { hashToken, isExpired } from "@/lib/auth-helpers";
import { authRateLimit, clientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/security";
import { notifyPasswordChanged } from "@/lib/notify";
import { baseUrl, fail, ok } from "@/lib/api";

export const runtime = "nodejs";

// Complete a password reset using the emailed token.
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = authRateLimit(ip, "reset");
  if (!rl.ok) return fail("rateLimited", 429, { retryAfter: rl.retryAfter });

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return fail(firstErrorKey(parsed.error, "passwordWeak"), 422);
  const { token, password } = parsed.data;

  const tokenHash = hashToken(token);
  const db = await readDB();
  const user = db.users.find((u) => u.reset_password_token === tokenHash);
  if (!user || isExpired(user.reset_password_token_expiry)) return fail("tokenInvalid", 400);

  const pwHash = await hashPassword(password);
  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (!u) return;
    u.password_hash = pwHash;
    u.reset_password_token = undefined;
    u.reset_password_token_expiry = undefined;
    u.failed_login_attempts = 0;
    u.lockout_until = undefined;
    u.updated_at = new Date().toISOString();
  });

  // Spec: invalidate ALL existing sessions on reset, then notify by email.
  await invalidateAllSessions(user.id);
  await notifyPasswordChanged(user.email, ip, baseUrl(req));
  await audit("password_reset", "", user.id, ip);

  return ok();
}
