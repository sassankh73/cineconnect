import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";
import { clientIp, audit } from "@/lib/security";

export const runtime = "nodejs";

// Step 2 — verify the security question answer, then issue the session cookie.
export async function POST(req: Request) {
  const ip = clientIp(req);
  const { email, security_answer } = await req.json().catch(() => ({}));

  if (!email) {
    return NextResponse.json({ error: "جلسه منقضی شده — از ابتدا وارد شوید" }, { status: 400 });
  }

  const db = await readDB();
  const user = db.users.find((u) => u.email === email.toLowerCase().trim());

  if (!user || user.role !== "admin" || !user.is_active) {
    return NextResponse.json({ error: "خطای احراز هویت" }, { status: 401 });
  }

  // If user has a security question, verify the answer
  if (user.security_question && user.security_answer_hash) {
    const answerOk = await verifyPassword(
      String(security_answer || "").toLowerCase().trim(),
      user.security_answer_hash,
    );
    if (!answerOk) {
      await audit("admin_login_fail_sq", email, user.id, ip);
      return NextResponse.json({ error: "پاسخ امنیتی نادرست است" }, { status: 401 });
    }
  }

  // Issue session
  const sid = await setSession(
    {
      sub: user.id,
      role: "admin",
      email: user.email,
      name: user.full_name_latin ?? user.full_name_persian ?? "Admin",
    },
    { userAgent: req.headers.get("user-agent") ?? undefined, ip },
  );

  await audit("admin_login_success", email, user.id, ip);

  const res = NextResponse.json({ ok: true });
  // Session cookie already set by setSession via next/headers — just return 200
  return res;
}
