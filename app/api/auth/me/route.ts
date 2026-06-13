import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readDB } from "@/lib/db";

export const runtime = "nodejs";

// Current user profile — no sensitive fields (never password_hash / national_id).
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null });

  const db = await readDB();
  const u = db.users.find((x) => x.id === s.sub);

  return NextResponse.json({
    user: {
      id: s.sub,
      role: s.role,
      fullName: s.name,
      email: s.email,
      emailVerified: u?.email_verified ?? false,
      provider: u?.provider ?? "credentials",
    },
  });
}
