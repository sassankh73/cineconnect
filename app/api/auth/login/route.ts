import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";
import { isValidEmail } from "@/lib/validation";
import { rateLimit, clientIp, audit } from "@/lib/security";

export const runtime = "nodejs";

// Login with rate limiting (brute-force prevention): 5 attempts / 5 min / IP.
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`login:${ip}`, 5, 5 * 60 * 1000);
  if (!rl.ok) {
    await audit("login_rate_limited", ip, undefined, ip);
    return NextResponse.json({ error: "rateLimited", retryAfter: rl.retryAfter }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const expectedRole = body?.role as "player" | "creator" | "admin" | undefined;

  if (!isValidEmail(email) || !password) {
    return NextResponse.json({ error: "loginFailed" }, { status: 401 });
  }

  const db = await readDB();
  const user = db.users.find((u) => u.email === email);
  // constant-ish path: always run a compare to reduce user-enumeration timing
  const ok = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv");

  if (!user || !ok) {
    await audit("login_failed", email, user?.id, ip);
    return NextResponse.json({ error: "loginFailed" }, { status: 401 });
  }
  if (expectedRole && user.role !== expectedRole && !(expectedRole === "creator" && user.role === "admin")) {
    return NextResponse.json({ error: "wrong_role" }, { status: 403 });
  }

  let name = user.email;
  if (user.role === "player") name = db.players.find((p) => p.userId === user.id)?.full_name_persian || name;
  if (user.role === "creator") name = db.creators.find((c) => c.userId === user.id)?.full_name || name;

  await setSession({ sub: user.id, role: user.role, name, email: user.email });
  await audit("login_success", user.role, user.id, ip);
  return NextResponse.json({ ok: true, role: user.role });
}
