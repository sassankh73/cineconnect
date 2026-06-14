import { NextResponse } from "next/server";
import { mutate, readDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toPublicPlayer } from "@/lib/security";

export const runtime = "nodejs";

// Talent profile detail.
//  - public_preview (no/guest session): photo, name, profession, city only.
//  - creator_full: all info + media, but phone only if a contact request exists.
//  - National ID is NEVER included (toPublicPlayer strips national_id_enc).
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = await readDB();
  const player = db.players.find((p) => p.id === params.id);
  if (!player || player.status !== "active") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const s = await getSession();
  let isCreator = s?.role === "admin"; // admins always have full access

  if (s?.role === "creator") {
    // Only approved creators get full access
    const creator = db.creators.find((c) => c.userId === s.sub);
    if (creator && (!creator.approval_status || creator.approval_status === "approved")) {
      isCreator = true;
    }
  }

  if (!isCreator) {
    // public preview — minimal fields only
    return NextResponse.json({
      access: "public_preview",
      talent: {
        id: player.id,
        full_name_persian: player.full_name_persian,
        primary_profession: player.primary_profession,
        city: player.city,
        profile_photo: player.media?.profile_photo,
      },
    });
  }

  // count a view (only for creators, not self/admin double counts kept simple)
  await mutate((d) => {
    const p = d.players.find((x) => x.id === params.id);
    if (p) p.view_count += 1;
  });

  const unlocked = db.contactRequests.some(
    (c) => c.playerId === player.id && c.creatorId === s!.sub
  );

  return NextResponse.json({
    access: "creator_full",
    contactUnlocked: unlocked,
    talent: toPublicPlayer({ ...player, view_count: player.view_count + 1 }, unlocked),
  });
}
