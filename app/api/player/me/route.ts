import { NextResponse } from "next/server";
import { mutate, readDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit, clientIp } from "@/lib/security";

export const runtime = "nodejs";

// Editable profile fields a player may change from their dashboard.
// (national_id, email and status/tier are intentionally NOT editable here.)
const EDITABLE = new Set([
  "full_name_persian", "full_name_latin", "date_of_birth", "gender", "city",
  "province", "willing_to_travel", "phone", "primary_profession",
  "secondary_professions", "experience_level", "years_experience",
  "education_training", "education_detail", "notable_projects", "awards",
  "union_membership", "languages_spoken", "physical_attributes",
  "special_skills", "availability", "daily_rate", "instagram", "imdb_link",
  "website", "media",
]);

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "player") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = await readDB();
  const player = db.players.find((p) => p.userId === s.sub);
  if (!player) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { national_id_enc, ...safe } = player; // never expose NID
  const notifications = db.notifications.filter((n) => n.userId === s.sub).slice(0, 30);
  const payments = db.payments.filter((p) => p.playerId === player.id);

  return NextResponse.json({ player: safe, notifications, payments });
}

export async function PUT(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "player") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const patch = await req.json().catch(() => ({}));

  const updated = await mutate((db) => {
    const player = db.players.find((p) => p.userId === s.sub);
    if (!player) return null;
    for (const [k, v] of Object.entries(patch)) {
      if (EDITABLE.has(k)) (player as unknown as Record<string, unknown>)[k] = v;
    }
    player.updated_at = new Date().toISOString();
    const { national_id_enc, ...safe } = player;
    return safe;
  });

  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await audit("profile_update", Object.keys(patch).join(","), s.sub, clientIp(req));
  return NextResponse.json({ ok: true, player: updated });
}

// Account deletion request (spec: player can request account deletion)
export async function DELETE() {
  const s = await getSession();
  if (!s || s.role !== "player") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await mutate((db) => {
    const player = db.players.find((p) => p.userId === s.sub);
    if (player) player.status = "suspended";
    db.notifications.unshift({
      id: "ntf_" + Date.now(), userId: s.sub, type: "system",
      title: "درخواست حذف حساب", body: "درخواست شما ثبت شد و توسط مدیر بررسی می‌شود.",
      read: false, created_at: new Date().toISOString(),
    });
  });
  await audit("account_deletion_request", "", s.sub);
  return NextResponse.json({ ok: true });
}
