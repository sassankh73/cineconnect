import { NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit, clientIp } from "@/lib/security";

export const runtime = "nodejs";

// Send a contact request — CREATOR ONLY. This is the ONLY way a creator unlocks
// a player's phone. Enforces the subscription contact cap (basic = 10/month).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "creator") {
    return NextResponse.json({ error: "creator_only" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").slice(0, 1000);

  const result = await mutate((db) => {
    const creator = db.creators.find((c) => c.userId === s.sub);
    const player = db.players.find((p) => p.id === params.id && p.status === "active");
    if (!creator) return { error: "no_creator" as const };
    if (!player) return { error: "not_found" as const };

    // already contacted? idempotent unlock
    const existing = db.contactRequests.find((c) => c.playerId === player.id && c.creatorId === s.sub);
    if (existing) return { ok: true as const, phone: player.phone, already: true };

    // subscription limit check (basic plan = 10/month, pro/unlimited)
    const cap = creator.plan === "basic" ? 10 : creator.plan === "free" ? 3 : Infinity;
    if (creator.contacts_used_this_month >= cap) {
      return { error: "limit_reached" as const, cap };
    }

    const cr = {
      id: uid("con_"),
      creatorId: s.sub,
      playerId: player.id,
      message,
      status: "sent" as const,
      created_at: new Date().toISOString(),
    };
    db.contactRequests.push(cr);
    creator.contacts_used_this_month += 1;
    player.contact_request_count += 1;

    // notify the player (phone is now unlocked for this creator)
    db.notifications.unshift({
      id: uid("ntf_"),
      userId: player.userId,
      type: "contact_request",
      title: "درخواست تماس جدید",
      body: `یک سازنده فیلم به پروفایل شما علاقه‌مند شده است.`,
      read: false,
      created_at: new Date().toISOString(),
    });

    return { ok: true as const, phone: player.phone, already: false };
  });

  if ("error" in result) {
    const status = result.error === "limit_reached" ? 402 : result.error === "not_found" ? 404 : 400;
    return NextResponse.json(result, { status });
  }

  await audit("contact_request", `player=${params.id}`, s.sub, clientIp(req));
  return NextResponse.json(result);
}
