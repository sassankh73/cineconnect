import { NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { hashPassword, setSession } from "@/lib/auth";
import { isValidEmail, isStrongPassword } from "@/lib/validation";
import { audit, clientIp } from "@/lib/security";
import type { CreatorProfile, User } from "@/lib/types";

export const runtime = "nodejs";

// Creator registration — free by default (subscription chosen later).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { email, password, full_name, company, role_title } = body as Record<string, string>;
  if (!isValidEmail(email || "")) return NextResponse.json({ error: "emailInvalid" }, { status: 422 });
  if (!isStrongPassword(password || "")) return NextResponse.json({ error: "passwordWeak" }, { status: 422 });

  const norm = email.trim().toLowerCase();
  const pwHash = await hashPassword(password);

  const result = await mutate((db) => {
    if (db.users.some((u) => u.email === norm)) return null;
    const userId = uid("usr_");
    const now = new Date().toISOString();
    const user: User = {
      id: userId, email: norm, password_hash: pwHash, role: "creator",
      email_verified: false, created_at: now,
    };
    db.users.push(user);
    const creator: CreatorProfile = {
      id: uid("crt_"), userId, full_name: full_name || "", company, role_title,
      plan: "free", contacts_used_this_month: 0, created_at: now,
    };
    db.creators.push(creator);
    return { user, creator };
  });

  if (!result) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  await setSession({ sub: result.user.id, role: "creator", name: result.creator.full_name, email: norm });
  await audit("register_creator", company || "", result.user.id, clientIp(req));
  return NextResponse.json({ ok: true, creatorId: result.creator.id });
}
