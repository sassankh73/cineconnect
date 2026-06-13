import { readDB, mutate } from "@/lib/db";
import { hashToken, isExpired } from "@/lib/auth-helpers";
import { verifyEmailQuerySchema } from "@/lib/validation/auth";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/emails/templates/welcome";
import { baseUrl, dashboardPath, fail, ok } from "@/lib/api";
import { audit, clientIp } from "@/lib/security";

export const runtime = "nodejs";

// Verify an email address from the link token. Returns JSON; the /verify-email
// page calls this on mount and then redirects to the dashboard on success.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = verifyEmailQuerySchema.safeParse({ token: url.searchParams.get("token") });
  if (!parsed.success) return fail("tokenInvalid", 400);

  const tokenHash = hashToken(parsed.data.token);
  const db = await readDB();
  const user = db.users.find((u) => u.verification_token === tokenHash);

  if (!user || isExpired(user.verification_token_expiry)) return fail("tokenInvalid", 400);

  if (user.email_verified) {
    return ok({ role: user.role, dashboard: dashboardPath(user.role), alreadyVerified: true });
  }

  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (!u) return;
    u.email_verified = true;
    u.verification_token = undefined;
    u.verification_token_expiry = undefined;
    u.updated_at = new Date().toISOString();
  });

  // Welcome email (spec: trigger after verification completes).
  await sendEmail({
    to: user.email,
    ...welcomeEmail({
      dashboardUrl: `${baseUrl(req)}${dashboardPath(user.role)}`,
      supportUrl: `${baseUrl(req)}/contact`,
    }),
  });
  await audit("email_verified", "", user.id, clientIp(req));

  return ok({ role: user.role, dashboard: dashboardPath(user.role) });
}
