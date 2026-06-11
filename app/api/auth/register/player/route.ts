import { NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import {
  hashPassword, hashSecurityAnswer, encryptNationalId, setSession,
} from "@/lib/auth";
import { isValidEmail, isStrongPassword, isValidNationalId } from "@/lib/validation";
import { audit, clientIp } from "@/lib/security";
import { TIERS } from "@/lib/constants";
import type { PlayerProfile, User } from "@/lib/types";

export const runtime = "nodejs";

// Player registration. Creates the user + profile in `pending_payment` status.
// Profile is HIDDEN until payment is confirmed (enforced server-side here and
// in every read path — never visible before status === "active").
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { account, profile } = body as {
    account: {
      email: string; password: string; password_confirm: string;
      security_question: string; security_answer: string;
    };
    profile: Record<string, unknown>;
  };

  // ---- Server-side validation (never trust the client) ----
  if (!account?.email || !isValidEmail(account.email))
    return NextResponse.json({ error: "emailInvalid" }, { status: 422 });
  if (!isStrongPassword(account.password || ""))
    return NextResponse.json({ error: "passwordWeak" }, { status: 422 });
  if (account.password !== account.password_confirm)
    return NextResponse.json({ error: "passwordMismatch" }, { status: 422 });
  if (!isValidNationalId(String(profile?.national_id || "")))
    return NextResponse.json({ error: "nationalId" }, { status: 422 });

  const email = account.email.trim().toLowerCase();
  const tierNum = Number(profile?.tier) || 1;
  const tier = TIERS.find((t) => t.tier === tierNum) ?? TIERS[0];

  const created = await mutate((db) => {
    if (db.users.some((u) => u.email === email)) return null;

    const userId = uid("usr_");
    const now = new Date().toISOString();

    const user: User = {
      id: userId,
      email,
      password_hash: "", // filled below (async)
      role: "player",
      security_question: account.security_question,
      security_answer_hash: "", // filled below
      email_verified: false,
      created_at: now,
    };
    db.users.push(user);

    const player: PlayerProfile = {
      id: uid("ply_"),
      userId,
      full_name_persian: String(profile.full_name_persian || ""),
      full_name_latin: String(profile.full_name_latin || ""),
      date_of_birth: String(profile.date_of_birth || ""),
      gender: String(profile.gender || ""),
      city: String(profile.city || ""),
      province: String(profile.province || ""),
      willing_to_travel: Boolean(profile.willing_to_travel),
      phone: String(profile.phone || ""),
      national_id_enc: encryptNationalId(String(profile.national_id)),
      primary_profession: String(profile.primary_profession || ""),
      secondary_professions: (profile.secondary_professions as string[]) || [],
      experience_level: String(profile.experience_level || `tier${tier.tier}`),
      years_experience: Number(profile.years_experience) || 0,
      education_training: (profile.education_training as string[]) || [],
      education_detail: profile.education_detail ? String(profile.education_detail) : undefined,
      notable_projects: (profile.notable_projects as PlayerProfile["notable_projects"]) || [],
      awards: profile.awards ? String(profile.awards) : undefined,
      union_membership: profile.union_membership ? String(profile.union_membership) : undefined,
      languages_spoken: (profile.languages_spoken as string[]) || [],
      physical_attributes: (profile.physical_attributes as PlayerProfile["physical_attributes"]) || {},
      special_skills: (profile.special_skills as string[]) || [],
      availability: String(profile.availability || ""),
      daily_rate: profile.daily_rate ? String(profile.daily_rate) : undefined,
      instagram: profile.instagram ? String(profile.instagram) : undefined,
      imdb_link: profile.imdb_link ? String(profile.imdb_link) : undefined,
      website: profile.website ? String(profile.website) : undefined,
      media: (profile.media as PlayerProfile["media"]) || {},
      tier: tier.tier,
      status: "pending_payment", // HIDDEN until paid
      view_count: 0,
      contact_request_count: 0,
      created_at: now,
      updated_at: now,
    };
    db.players.push(player);
    return { user, player };
  });

  if (!created) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  // hash secrets after the mutation reserved the records
  const [pwHash, ansHash] = await Promise.all([
    hashPassword(account.password),
    hashSecurityAnswer(account.security_answer || ""),
  ]);
  await mutate((db) => {
    const u = db.users.find((x) => x.id === created.user.id);
    if (u) {
      u.password_hash = pwHash;
      u.security_answer_hash = ansHash;
    }
  });

  await setSession({ sub: created.user.id, role: "player", name: created.player.full_name_persian, email });
  await audit("register_player", `tier=${tier.tier}`, created.user.id, clientIp(req));

  return NextResponse.json({
    ok: true,
    playerId: created.player.id,
    tier: tier.tier,
    fee_toman: tier.fee_toman,
    status: created.player.status,
  });
}
