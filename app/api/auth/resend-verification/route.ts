import { getSession } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { authRateLimit, clientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/security";
import { baseUrl, fail, ok } from "@/lib/api";
import { issueAndSendVerification, resendStatus, VERIFICATION_LIMITS } from "@/lib/verification";

export const runtime = "nodejs";

// Resend the verification email. Auth required. Enforces the 2-minute cooldown
// and the 5-per-day cap (spec.email_verification).
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return fail("notAuthenticated", 401);

  const ip = clientIp(req);
  const rl = authRateLimit(ip, "resend");
  if (!rl.ok) return fail("rateLimited", 429, { retryAfter: rl.retryAfter });

  const db = await readDB();
  const user = db.users.find((u) => u.id === s.sub);
  if (!user) return fail("notAuthenticated", 401);
  if (user.email_verified) return ok({ alreadyVerified: true });

  const status = resendStatus(user);
  if (!status.allowed) {
    return fail(status.reason, 429, { retryAfter: status.retryAfter });
  }

  await issueAndSendVerification({
    userId: user.id,
    email: user.email,
    base: baseUrl(req),
    countAsResend: true,
  });
  await audit("verification_resent", "", user.id, ip);

  return ok({ cooldownSeconds: VERIFICATION_LIMITS.cooldownSeconds });
}
