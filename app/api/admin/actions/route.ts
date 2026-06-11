import { NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit, clientIp } from "@/lib/security";
import { PROFILE_VALIDITY_MONTHS } from "@/lib/constants";

export const runtime = "nodejs";

// Unified admin action endpoint. action ∈
//  confirm_payment | reject_payment | suspend | unsuspend | resolve_report | notify
export async function POST(req: Request) {
  const admin = await requireRole("admin");
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { action, id, message, userId } = await req.json().catch(() => ({}));
  const ip = clientIp(req);

  const result = await mutate((db) => {
    const now = new Date();
    switch (action) {
      case "confirm_payment": {
        const pay = db.payments.find((p) => p.id === id);
        if (!pay) return { error: "not_found" };
        pay.status = "confirmed";
        pay.confirmed_by = admin.sub;
        pay.confirmed_at = now.toISOString();
        const player = db.players.find((p) => p.id === pay.playerId);
        if (player) {
          player.status = "active"; // bank transfer confirmed → VISIBLE
          player.paid_at = now.toISOString();
          const exp = new Date(now);
          exp.setMonth(exp.getMonth() + PROFILE_VALIDITY_MONTHS);
          player.expires_at = exp.toISOString();
          db.notifications.unshift({
            id: uid("ntf_"), userId: player.userId, type: "payment_confirmed",
            title: "پرداخت تأیید شد", body: "واریز بانکی شما تأیید و پروفایل فعال شد.",
            read: false, created_at: now.toISOString(),
          });
        }
        return { ok: true };
      }
      case "reject_payment": {
        const pay = db.payments.find((p) => p.id === id);
        if (!pay) return { error: "not_found" };
        pay.status = "rejected";
        const player = db.players.find((p) => p.id === pay.playerId);
        if (player && player.status === "pending_review") player.status = "pending_payment";
        return { ok: true };
      }
      case "suspend": {
        const player = db.players.find((p) => p.id === id);
        if (!player) return { error: "not_found" };
        player.status = "suspended"; // immediate — hides profile
        return { ok: true };
      }
      case "unsuspend": {
        const player = db.players.find((p) => p.id === id);
        if (!player) return { error: "not_found" };
        player.status = player.paid_at ? "active" : "pending_payment";
        return { ok: true };
      }
      case "resolve_report": {
        const r = db.reports.find((x) => x.id === id);
        if (!r) return { error: "not_found" };
        r.status = "reviewed";
        return { ok: true };
      }
      case "notify": {
        // broadcast or targeted system notification
        const targets = userId ? db.users.filter((u) => u.id === userId) : db.users;
        for (const u of targets) {
          db.notifications.unshift({
            id: uid("ntf_"), userId: u.id, type: "system",
            title: "اطلاعیه سیستم", body: String(message || ""),
            read: false, created_at: now.toISOString(),
          });
        }
        return { ok: true, count: targets.length };
      }
      default:
        return { error: "unknown_action" };
    }
  });

  if (result && "error" in result) {
    return NextResponse.json(result, { status: result.error === "not_found" ? 404 : 400 });
  }
  await audit(`admin_${action}`, String(id || userId || ""), admin.sub, ip);
  return NextResponse.json(result);
}
