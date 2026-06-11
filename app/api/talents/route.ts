import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toCardPlayer } from "@/lib/security";

export const runtime = "nodejs";

// Browse active talent — CREATOR ONLY (authenticated). Players cannot browse.
// Only status === "active" profiles are ever returned (payment gate enforced).
export async function GET(req: Request) {
  const s = await getSession();
  if (!s || (s.role !== "creator" && s.role !== "admin")) {
    return NextResponse.json({ error: "creator_only" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams;
  const get = (k: string) => q.get(k)?.trim() || "";

  const db = await readDB();
  let list = db.players.filter((p) => p.status === "active");

  // ---- filters (filter_options spec) ----
  const profession = get("profession");
  const city = get("city");
  const level = get("experience_level");
  const gender = get("gender");
  const availability = get("availability");
  const skill = get("special_skills");
  const language = get("language");
  const ageMin = Number(get("age_min")) || 0;
  const ageMax = Number(get("age_max")) || 200;
  const heightMin = Number(get("height_min")) || 0;
  const heightMax = Number(get("height_max")) || 9999;
  const text = get("q").toLowerCase();

  const ageOf = (dob: string) => {
    const d = new Date(dob);
    return Number.isNaN(d.getTime()) ? null : Math.floor((Date.now() - d.getTime()) / (365.25 * 864e5));
  };

  list = list.filter((p) => {
    if (profession && p.primary_profession !== profession && !p.secondary_professions.includes(profession)) return false;
    if (city && !p.city.includes(city)) return false;
    if (level && p.experience_level !== level) return false;
    if (gender && p.gender !== gender) return false;
    if (availability && p.availability !== availability) return false;
    if (skill && !p.special_skills.includes(skill)) return false;
    if (language && !p.languages_spoken.includes(language)) return false;
    const age = ageOf(p.date_of_birth);
    if (age !== null && (age < ageMin || age > ageMax)) return false;
    const h = p.physical_attributes?.height_cm;
    if (h && (h < heightMin || h > heightMax)) return false;
    if (text && !(`${p.full_name_persian} ${p.full_name_latin} ${p.primary_profession} ${p.city}`.toLowerCase().includes(text))) return false;
    return true;
  });

  // ---- sort (sort_options spec) ----
  const sort = get("sort") || "newest";
  list.sort((a, b) => {
    if (sort === "most_viewed") return b.view_count - a.view_count;
    if (sort === "experience_level") return b.tier - a.tier;
    return b.created_at.localeCompare(a.created_at); // newest
  });

  const page = Math.max(1, Number(get("page")) || 1);
  const perPage = 12;
  const total = list.length;
  const paged = list.slice((page - 1) * perPage, page * perPage);

  return NextResponse.json({
    total,
    page,
    perPage,
    talents: paged.map(toCardPlayer),
  });
}
