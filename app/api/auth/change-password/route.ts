import { getSession, hashPassword, verifyPassword, invalidateOtherSessions } from "@/lib/auth";
import { readDB, mutate } from "@/lib/db";
import { changePasswordSchema, firstErrorKey } from "@/lib/validation/auth";
import { authRateLimit, clientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/security";
import { notifyPasswordChanged } from "@/lib/notify";
import { baseUrl, fail, ok } from "@/lib/api";

export const runtime = "nodejs";

// Change password for the signed-in user. Verifies the current password, then
// invalidates all OTHER sessions (keeps this one) and emails a security alert.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return fail("notAuthenticated", 401);

  const ip = clientIp(req);
  const rl = authRateLimit(ip, "change-password");
  if (!rl.ok) return fail("rateLimited", 429, { retryAfter: rl.retryAfter });

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return fail(firstErrorKey(parsed.error, "passwordWeak"), 422);

  const db = await readDB();
  const user = db.users.find((u) => u.id === s.sub);
  if (!user) return fail("notAuthenticated", 401);

  const currentOk =
    !!user.password_hash && (await verifyPassword(parsed.data.current_password, user.password_hash));
  if (!currentOk) return fail("currentPasswordWrong", 403);

  const pwHash = await hashPassword(parsed.data.new_password);
  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (!u) return;
    u.password_hash = pwHash;
    u.updated_at = new Date().toISOString();
  });

  await invalidateOtherSessions(user.id, s.sid);
  await notifyPasswordChanged(user.email, ip, baseUrl(req));
  await audit("password_changed", "", user.id, ip);

  return ok();
}
