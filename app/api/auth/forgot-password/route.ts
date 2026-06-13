import { readDB, mutate } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { generateToken, hashToken, isoIn, HOUR } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/emails/templates/password-reset";
import { authRateLimit, clientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/security";
import { baseUrl, ok } from "@/lib/api";

export const runtime = "nodejs";

// Forgot password. ALWAYS returns 200 with an identical response whether or not
// the email exists (spec: prevent account enumeration).
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = authRateLimit(ip, "forgot");
  if (!rl.ok) return ok({ sent: true }); // throttle silently, still generic

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (parsed.success) {
    const email = parsed.data.email;
    const db = await readDB();
    const user = db.users.find((u) => u.email === email);
    // Only credentials accounts (with a password) get a reset link.
    if (user && user.password_hash) {
      const token = generateToken();
      await mutate((d) => {
        const u = d.users.find((x) => x.id === user.id);
        if (!u) return;
        u.reset_password_token = hashToken(token);
        u.reset_password_token_expiry = isoIn(HOUR); // 1 hour
        u.updated_at = new Date().toISOString();
      });
      await sendEmail({
        to: email,
        ...passwordResetEmail({ resetUrl: `${baseUrl(req)}/reset-password?token=${token}` }),
      });
      await audit("password_reset_requested", "", user.id, ip);
    }
  }

  return ok({ sent: true });
}
