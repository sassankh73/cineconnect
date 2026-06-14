import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { clientIp, audit } from "@/lib/security";

export const runtime = "nodejs";

// Step 1 — verify email + password, return the admin's security question.
// No session cookie is set here; the session is created in /verify after 2FA.
export async function POST(req: Request) {
  const ip = clientIp(req);
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ error: "ایمیل و رمز عبور الزامی است" }, { status: 400 });
  }

  const db = await readDB();
  const user = db.users.find((u) => u.email === email.toLowerCase().trim());

  // Generic error — do NOT reveal whether the email exists
  const INVALID = NextResponse.json(
    { error: "اطلاعات ورود نادرست است" },
    { status: 401 },
  );

  if (!user || user.role !== "admin") return INVALID;
  if (!user.is_active) return NextResponse.json({ error: "حساب غیرفعال است" }, { status: 403 });
  if (!user.password_hash) return INVALID;

  // Brute-force lockout check
  if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
    return NextResponse.json({ error: "حساب موقتاً قفل شده است. بعداً تلاش کنید." }, { status: 429 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    await audit("admin_login_fail_credentials", email, undefined, ip);
    return INVALID;
  }

  if (!user.security_question) {
    // Admin has no security question — proceed directly; /verify will skip that check
    await audit("admin_login_no_sq", email, user.id, ip);
    return NextResponse.json({ security_question: null });
  }

  await audit("admin_login_step1_ok", email, user.id, ip);
  return NextResponse.json({ security_question: user.security_question });
}
