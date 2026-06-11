// Seed the JSON data store with an admin, creators and active players.
// Run: npm run seed
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const NID_KEY = crypto.createHash("sha256")
  .update(process.env.NID_ENC_KEY || "dev-only-national-id-encryption-key-change-me").digest();
function encNID(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", NID_KEY, iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv.toString("base64"), c.getAuthTag().toString("base64"), enc.toString("base64")].join(".");
}
const uid = (p = "") => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => new Date().toISOString();
const inMonths = (m) => { const d = new Date(); d.setMonth(d.getMonth() + m); return d.toISOString(); };

const PROFS = ["بازیگر (مرد)", "بازیگر (زن)", "فیلمبردار", "تدوینگر", "طراح صدا", "دوبلور / بازیگر صدا", "بدلکار", "طراح لباس", "فیلمنامه‌نویس", "دستیار کارگردان"];
const CITIES = [["تهران", "تهران"], ["اصفهان", "اصفهان"], ["شیراز", "فارس"], ["مشهد", "خراسان رضوی"], ["تبریز", "آذربایجان شرقی"], ["کرج", "البرز"]];
const NAMES_M = ["آرش رضایی", "بهرام کریمی", "کاوه احمدی", "سهراب مرادی", "نیما تهرانی", "رامین صادقی"];
const NAMES_F = ["سارا محمدی", "نگار حسینی", "مریم رستمی", "لیلا کاظمی", "شیرین یوسفی", "آیدا نوری"];
const SKILLS = ["اسب‌سواری", "هنرهای رزمی", "رقص", "نوازندگی", "لهجه‌های مختلف", "غواصی"];
const LANGS = ["فارسی", "انگلیسی", "ترکی آذری", "عربی"];

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const db = {
    users: [], players: [], creators: [], payments: [], contactRequests: [],
    bookmarks: [], reviews: [], notifications: [], auditLogs: [], reports: [],
  };

  // ---- admin ----
  const adminId = uid("usr_");
  db.users.push({
    id: adminId, email: "admin@cineconnect.ir", password_hash: await bcrypt.hash("Admin@1234", 12),
    role: "admin", email_verified: true, created_at: now(),
  });

  // ---- creators ----
  const creatorUserId = uid("usr_");
  db.users.push({
    id: creatorUserId, email: "creator@cineconnect.ir", password_hash: await bcrypt.hash("Creator@1234", 12),
    role: "creator", email_verified: true, created_at: now(),
  });
  db.creators.push({
    id: uid("crt_"), userId: creatorUserId, full_name: "حمید کارگردان", company: "استودیو سینه‌پرو",
    role_title: "کارگردان", plan: "pro", contacts_used_this_month: 0, created_at: now(),
  });

  // ---- players (all active) ----
  for (let i = 0; i < 14; i++) {
    const female = i % 2 === 1;
    const name = female ? NAMES_F[(i >> 1) % NAMES_F.length] : NAMES_M[(i >> 1) % NAMES_M.length];
    const [city, province] = CITIES[i % CITIES.length];
    const tier = (i % 4) + 1;
    const prof = PROFS[i % PROFS.length];
    const userId = uid("usr_");
    db.users.push({
      id: userId, email: `talent${i + 1}@cineconnect.ir`, password_hash: await bcrypt.hash("Talent@1234", 12),
      role: "player", security_question: "نام اولین فیلم؟", security_answer_hash: await bcrypt.hash("سینما", 10),
      email_verified: true, created_at: now(),
    });
    db.players.push({
      id: uid("ply_"), userId,
      full_name_persian: `${name}`, full_name_latin: female ? "Actress " + (i + 1) : "Actor " + (i + 1),
      date_of_birth: `19${85 + (i % 12)}-0${(i % 8) + 1}-1${i % 9}`,
      gender: female ? "زن" : "مرد", city, province, willing_to_travel: i % 3 === 0,
      phone: `0912${String(1000000 + i * 137).slice(0, 7)}`,
      national_id_enc: encNID(String(1000000000 + i)),
      primary_profession: prof, secondary_professions: i % 4 === 0 ? [PROFS[(i + 3) % PROFS.length]] : [],
      experience_level: `tier${tier}`, years_experience: 1 + (i % 18),
      education_training: i % 2 ? ["دانشگاه"] : ["کارگاه تخصصی"], education_detail: "",
      notable_projects: i % 3 === 0 ? [{ title: "فیلم نمونه", year: `139${i % 9}`, role: "نقش اول", production: "تولید سینمایی" }] : [],
      awards: i % 5 === 0 ? "دیپلم افتخار جشنواره" : "", union_membership: i % 4 === 0 ? "خانه سینما" : "",
      languages_spoken: LANGS.slice(0, 1 + (i % 3)),
      physical_attributes: { height_cm: 165 + (i % 25), weight_kg: 58 + (i % 30), eye_color: i % 2 ? "قهوه‌ای" : "مشکی", hair_color: "مشکی", body_type: ["لاغر", "متوسط", "ورزشی", "درشت‌هیکل"][i % 4] },
      special_skills: SKILLS.slice(0, 1 + (i % 3)),
      availability: ["تمام‌وقت", "پاره‌وقت", "پروژه‌ای", "آخر هفته"][i % 4],
      daily_rate: i % 3 === 0 ? "قابل مذاکره" : "", instagram: `@talent${i + 1}`, imdb_link: "", website: "",
      media: {}, tier, status: "active", paid_at: now(), expires_at: inMonths(12),
      view_count: (i * 37) % 400, contact_request_count: i % 6, created_at: now(), updated_at: now(),
    });
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
  console.log(`✓ Seeded ${db.players.length} players, ${db.creators.length} creator(s), 1 admin → ${DATA_FILE}`);
  console.log("\nLogins:");
  console.log("  Admin   : admin@cineconnect.ir   / Admin@1234");
  console.log("  Creator : creator@cineconnect.ir / Creator@1234");
  console.log("  Player  : talent1@cineconnect.ir / Talent@1234");
}

main().catch((e) => { console.error(e); process.exit(1); });
