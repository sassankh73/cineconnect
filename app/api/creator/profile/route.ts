import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Returns the creator's own profile including approval_status.
// Used by the creator dashboard to decide what to show.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "creator") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = await readDB();
  const creator = db.creators.find((c) => c.userId === session.sub);
  if (!creator) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    id: creator.id,
    full_name: creator.full_name,
    company: creator.company,
    role_title: creator.role_title,
    plan: creator.plan,
    approval_status: creator.approval_status ?? "approved", // legacy accounts default to approved
    approved_at: creator.approved_at ?? null,
    rejected_at: creator.rejected_at ?? null,
    rejection_reason: creator.rejection_reason ?? null,
    cinema_id_filename: creator.cinema_id_filename ?? null,
    cinema_id_uploaded_at: creator.cinema_id_uploaded_at ?? null,
    contacts_used_this_month: creator.contacts_used_this_month,
    created_at: creator.created_at,
    // Never return cinema_id_data (base64) — admin-only
  });
}
