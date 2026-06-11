import { NextResponse } from "next/server";
import { mutate, readDB, uid } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Creator rates & reviews a player after a project.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = await readDB();
  const reviews = db.reviews.filter((r) => r.playerId === params.id);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;
  return NextResponse.json({ reviews, average: avg, count: reviews.length });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "creator") return NextResponse.json({ error: "creator_only" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const rating = Math.min(5, Math.max(1, Number(body?.rating) || 0));
  if (!rating) return NextResponse.json({ error: "rating_required" }, { status: 422 });

  await mutate((db) => {
    db.reviews.push({
      id: uid("rev_"), creatorId: s.sub, playerId: params.id,
      rating, comment: String(body?.comment || "").slice(0, 1000),
      project: body?.project ? String(body.project) : undefined,
      created_at: new Date().toISOString(),
    });
  });
  return NextResponse.json({ ok: true });
}
