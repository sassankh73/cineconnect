import { mutate, uid, type DB } from "./db";
import type { PlayerProfile, PublicPlayer } from "./types";

// ---------------- In-memory rate limiter (login brute-force prevention) ----
// Production: back this with Redis. Keyed by ip+route.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= max) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "0.0.0.0"
  );
}

// ---------------- Audit log (all logins & profile changes) ----------------
export async function audit(action: string, detail: string, userId?: string, ip?: string) {
  await mutate((db: DB) => {
    db.auditLogs.unshift({
      id: uid("aud_"),
      userId,
      action,
      detail,
      ip,
      created_at: new Date().toISOString(),
    });
    // keep the log bounded in the file store
    if (db.auditLogs.length > 5000) db.auditLogs.length = 5000;
  });
}

// ---------------- Public projection ----------------
// CRITICAL: strips national_id_enc ALWAYS and phone unless a contact request
// from this creator to this player exists. Never leak protected fields.
export function toPublicPlayer(p: PlayerProfile, contactUnlocked: boolean): PublicPlayer {
  const { national_id_enc, phone, ...rest } = p;
  const out: PublicPlayer = { ...rest, contactUnlocked };
  if (contactUnlocked) out.phone = phone;
  return out;
}

// Minimal card projection for the browse grid (no contact info at all).
export function toCardPlayer(p: PlayerProfile) {
  return {
    id: p.id,
    full_name_persian: p.full_name_persian,
    primary_profession: p.primary_profession,
    city: p.city,
    province: p.province,
    experience_level: p.experience_level,
    tier: p.tier,
    gender: p.gender,
    availability: p.availability,
    special_skills: p.special_skills,
    languages_spoken: p.languages_spoken,
    physical_attributes: p.physical_attributes,
    profile_photo: p.media?.profile_photo,
    view_count: p.view_count,
    created_at: p.created_at,
  };
}
