import { NextResponse } from "next/server";
import { mutate, readDB, uid } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toCardPlayer } from "@/lib/security";

export const runtime = "nodejs";

// Named bookmark collections (e.g. "Cast for Film X").
export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "creator") return NextResponse.json({ error: "creator_only" }, { status: 403 });
  const db = await readDB();
  const marks = db.bookmarks.filter((b) => b.creatorId === s.sub);
  // group by collection, hydrate player cards
  const collections: Record<string, ReturnType<typeof toCardPlayer>[]> = {};
  for (const m of marks) {
    const player = db.players.find((p) => p.id === m.playerId && p.status === "active");
    if (!player) continue;
    (collections[m.collection] ||= []).push(toCardPlayer(player));
  }
  return NextResponse.json({ collections });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "creator") return NextResponse.json({ error: "creator_only" }, { status: 403 });
  const { playerId, collection } = await req.json().catch(() => ({}));
  if (!playerId || !collection) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  await mutate((db) => {
    const dup = db.bookmarks.find(
      (b) => b.creatorId === s.sub && b.playerId === playerId && b.collection === collection
    );
    if (dup) return;
    db.bookmarks.push({
      id: uid("bmk_"), creatorId: s.sub, collection: String(collection).slice(0, 80),
      playerId, created_at: new Date().toISOString(),
    });
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "creator") return NextResponse.json({ error: "creator_only" }, { status: 403 });
  const { playerId, collection } = await req.json().catch(() => ({}));
  await mutate((db) => {
    db.bookmarks = db.bookmarks.filter(
      (b) => !(b.creatorId === s.sub && b.playerId === playerId && b.collection === collection)
    );
  });
  return NextResponse.json({ ok: true });
}
