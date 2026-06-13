import { readDB, mutate } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";
import { dummyVerify } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";
import { authRateLimit, clientIp, userAgent } from "@/lib/rate-limit";
import { audit } from "@/lib/security";
import { isExpired, isoIn } from "@/lib/auth-helpers";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Login: Zod validation → IP rate-limit → lockout check → password verify →
// brute-force counter → HttpOnly session cookie (remember-me aware).
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = authRateLimit(ip, "login");
  if (!rl.ok) {
    await audit("login_rate_limited", ip, undefined, ip);
    return fail("rateLimited", 429, { retryAfter: rl.retryAfter });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail("loginFailed", 401);
  const { email, password, remember_me, role: expectedRole } = parsed.data;

  const db = await readDB();
  const user = db.users.find((u) => u.email === email);

  // Account lockout (checked before password to avoid burning attempts).
  if (user?.lockout_until && !isExpired(user.lockout_until)) {
    await audit("login_locked", email, user.id, ip);
    return fail("accountLocked", 423);
  }
  if (user && user.is_active === false) {
    return fail("accountInactive", 403);
  }

  // Constant-ish path: always run a hash compare to blunt user-enumeration timing.
  const passwordOk = user?.password_hash
    ? await verifyPassword(password, user.password_hash)
    : (await dummyVerify(password), false);

  if (!user || !passwordOk) {
    if (user) {
      await mutate((d) => {
        const u = d.users.find((x) => x.id === user.id);
        if (!u) return;
        u.failed_login_attempts = (u.failed_login_attempts ?? 0) + 1;
        if (u.failed_login_attempts >= MAX_ATTEMPTS) {
          u.lockout_until = isoIn(LOCKOUT_MS);
          u.failed_login_attempts = 0; // reset the counter once locked
        }
        u.updated_at = new Date().toISOString();
      });
    }
    await audit("login_failed", email, user?.id, ip);
    return fail("loginFailed", 401);
  }

  // Role gating (admins may use the creator tab).
  if (
    expectedRole &&
    user.role !== expectedRole &&
    !(expectedRole === "creator" && user.role === "admin")
  ) {
    return fail("loginFailed", 403);
  }

  // Success → reset brute-force state, stamp last login.
  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (!u) return;
    u.failed_login_attempts = 0;
    u.lockout_until = undefined;
    u.last_login_at = new Date().toISOString();
    u.updated_at = u.last_login_at;
  });

  let name = user.email;
  if (user.role === "player") name = db.players.find((p) => p.userId === user.id)?.full_name_persian || name;
  if (user.role === "creator") name = db.creators.find((c) => c.userId === user.id)?.full_name || name;

  await setSession(
    { sub: user.id, role: user.role, name, email: user.email },
    { remember: remember_me, ip, userAgent: userAgent(req) }
  );
  await audit("login_success", user.role, user.id, ip);
  return ok({ role: user.role, email_verified: user.email_verified });
}
