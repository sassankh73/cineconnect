import { NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit, clientIp } from "@/lib/security";
import { TIERS, PROFILE_VALIDITY_MONTHS } from "@/lib/constants";

export const runtime = "nodejs";

// Create a payment intent for the current player's tier.
//  - online_gateway  → auto-confirmed (simulated gateway success) → profile ACTIVE
//  - bank_transfer   → status pending_review, awaits admin manual confirm (≤24h)
//
// CRITICAL: a profile only becomes "active" (VISIBLE) once a payment is
// confirmed. This is enforced here on the server — never by the client.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "player") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const method: "online_gateway" | "bank_transfer" =
    body?.method === "bank_transfer" ? "bank_transfer" : "online_gateway";
  const gateway = body?.gateway as string | undefined; // ZarinPal | IDPay | Parsian
  const receiptRef = body?.receipt_ref as string | undefined;

  const result = await mutate((db) => {
    const player = db.players.find((p) => p.userId === s.sub);
    if (!player) return null;
    const tier = TIERS.find((t) => t.tier === player.tier) ?? TIERS[0];
    const now = new Date();

    const payment = {
      id: uid("pay_"),
      playerId: player.id,
      tier: tier.tier,
      amount_toman: tier.fee_toman,
      method,
      gateway,
      status: method === "online_gateway" ? ("confirmed" as const) : ("pending" as const),
      receipt_ref: receiptRef,
      created_at: now.toISOString(),
      confirmed_at: method === "online_gateway" ? now.toISOString() : undefined,
    };
    db.payments.push(payment);

    if (method === "online_gateway") {
      // simulate successful gateway callback → activate
      player.status = "active";
      player.paid_at = now.toISOString();
      const exp = new Date(now);
      exp.setMonth(exp.getMonth() + PROFILE_VALIDITY_MONTHS);
      player.expires_at = exp.toISOString();
      db.notifications.unshift({
        id: uid("ntf_"), userId: player.userId, type: "payment_confirmed",
        title: "پرداخت تأیید شد", body: "پروفایل شما فعال و برای سازندگان قابل مشاهده شد.",
        read: false, created_at: now.toISOString(),
      });
    } else {
      // bank transfer → hold for admin review
      player.status = "pending_review";
    }
    return { payment, status: player.status };
  });

  if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await audit("payment_created", `${method}:${result.status}`, s.sub, clientIp(req));

  return NextResponse.json({
    ok: true,
    paymentId: result.payment.id,
    status: result.status,
    autoConfirmed: method === "online_gateway",
  });
}
