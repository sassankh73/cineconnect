import { NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { hashPassword, setSession } from "@/lib/auth";
import { isValidEmail, isStrongPassword } from "@/lib/validation";
import { audit, clientIp, userAgent } from "@/lib/security";
import { baseUrl } from "@/lib/api";
import { issueAndSendVerification } from "@/lib/verification";
import type { CreatorProfile, User } from "@/lib/types";

export const runtime = "nodejs";

// Creator registration.
// Stores cinema_id_data (base64) for admin review; sets approval_status = "pending".
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { email, password, full_name, company, role_title, cinema_id_data, cinema_id_filename } =
    body as Record<string, string>;

  if (!isValidEmail(email || "")) return NextResponse.json({ error: "emailInvalid" }, { status: 422 });
  if (!isStrongPassword(password || "")) return NextResponse.json({ error: "passwordWeak" }, { status: 422 });

  const norm = email.trim().toLowerCase();
  const pwHash = await hashPassword(password);
  const now = new Date().toISOString();

  const result = await mutate((db) => {
    if (db.users.some((u) => u.email === norm)) return null;
    const userId = uid("usr_");
    const user: User = {
      id: userId, email: norm, password_hash: pwHash, role: "creator",
      email_verified: false, provider: "credentials",
      full_name_latin: full_name || "",
      is_active: true, failed_login_attempts: 0,
      created_at: now, updated_at: now,
    };
    db.users.push(user);
    const creator: CreatorProfile = {
      id: uid("crt_"), userId, full_name: full_name || "",
      company, role_title, plan: "free",
      contacts_used_this_month: 0, created_at: now,
      // Approval fields
      approval_status: "pending",
      cinema_id_data: cinema_id_data || undefined,
      cinema_id_filename: cinema_id_filename || undefined,
      cinema_id_uploaded_at: cinema_id_data ? now : undefined,
    };
    db.creators.push(creator);
    return { user, creator };
  });

  if (!result) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  await issueAndSendVerification({
    userId: result.user.id,
    email: norm,
    base: baseUrl(req),
    countAsResend: false,
  });

  await setSession(
    { sub: result.user.id, role: "creator", name: result.creator.full_name, email: norm },
    { ip: clientIp(req), userAgent: userAgent(req) }
  );
  await audit("register_creator", company || "", result.user.id, clientIp(req));

  return NextResponse.json({
    ok: true,
    creatorId: result.creator.id,
    email_verified: false,
    approval_status: "pending",
  });
}
