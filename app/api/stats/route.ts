import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { toCardPlayer } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always read live data, never prerender

// Public stats for the landing page animated counters + featured carousel.
export async function GET() {
  const db = await readDB();
  const active = db.players.filter((p) => p.status === "active");
  const cities = new Set(active.map((p) => p.city)).size;

  const featured = [...active]
    .sort((a, b) => b.tier - a.tier || b.view_count - a.view_count)
    .slice(0, 8)
    .map(toCardPlayer);

  return NextResponse.json({
    stats: {
      talents: active.length,
      productions: db.contactRequests.length,
      cities,
    },
    featured,
  });
}
