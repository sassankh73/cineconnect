import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { audit, clientIp } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const s = await getSession();
  clearSession();
  if (s) await audit("logout", "", s.sub, clientIp(req));
  return NextResponse.json({ ok: true });
}
