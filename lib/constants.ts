// Locked specification values — sourced from cineconnect_prompt.json.
// Do NOT diverge from these enums; they mirror the registration_form spec.

export const IRAN_PROVINCES = [
  "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام",
  "بوشهر", "تهران", "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی",
  "خراسان شمالی", "خوزستان", "زنجان", "سمنان", "سیستان و بلوچستان", "فارس",
  "قزوین", "قم", "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد",
  "گلستان", "گیلان", "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد",
] as const;

export const PRIMARY_PROFESSIONS = [
  "بازیگر (مرد)", "بازیگر (زن)", "فیلمبردار", "مدیر فیلمبرداری (DP)", "طراح صدا",
  "دستیار صدا (بوم)", "تدوینگر", "رنگبند (Colorist)", "آرایشگر",
  "طراح موی سر", "طراح لباس", "صحنه‌آرا / هنر دایرکتور",
  "فیلمنامه‌نویس", "دستیار کارگردان", "مدیر تولید",
  "بدلکار", "دوبلور / بازیگر صدا", "سیاهی‌لشکر / بازیگر نقش کوچک",
  "عکاس پشت صحنه", "سایر",
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "tier1", label_fa: "تازه‌کار (Tier 1)", tier: 1 },
  { value: "tier2", label_fa: "آموزش‌دیده (Tier 2)", tier: 2 },
  { value: "tier3", label_fa: "حرفه‌ای (Tier 3)", tier: 3 },
  { value: "tier4", label_fa: "بسیار حرفه‌ای (Tier 4)", tier: 4 },
] as const;

export const GENDERS = ["مرد", "زن", "ترجیح می‌دهم نگویم"] as const;

export const EDUCATION_OPTIONS = [
  "دانشکده سینما", "دانشگاه", "کارگاه تخصصی", "خودآموز",
] as const;

export const BODY_TYPES = ["لاغر", "متوسط", "ورزشی", "درشت‌هیکل"] as const;

export const SPECIAL_SKILLS = [
  "اسب‌سواری", "هنرهای رزمی", "لهجه‌های مختلف", "نوازندگی", "رقص",
  "گواهینامه رانندگی (سبک)", "گواهینامه رانندگی (سنگین)", "غواصی", "پرواز", "سایر",
] as const;

export const AVAILABILITY_OPTIONS = ["تمام‌وقت", "پاره‌وقت", "پروژه‌ای", "آخر هفته"] as const;

export const LANGUAGES = [
  "فارسی", "انگلیسی", "عربی", "ترکی آذری", "کردی", "آلمانی", "فرانسوی", "اسپانیایی", "ارمنی",
] as const;

// step_4.tiers — registration fees (Toman)
export const TIERS = [
  { tier: 1, label_fa: "تازه‌کار", fee_toman: 50000, description: "بدون تجربه قبلی" },
  { tier: 2, label_fa: "آموزش‌دیده", fee_toman: 100000, description: "دانشگاه، کارگاه یا دوره تخصصی" },
  { tier: 3, label_fa: "حرفه‌ای", fee_toman: 150000, description: "تجربه حرفه‌ای در صنعت" },
  { tier: 4, label_fa: "بسیار حرفه‌ای", fee_toman: 200000, description: "ستاره / کارنامه درخشان" },
] as const;

export const PAYMENT_METHODS = [
  {
    id: "online_gateway",
    label_fa: "پرداخت آنلاین (درگاه پرداخت)",
    gateways: ["ZarinPal", "IDPay", "Parsian"],
    auto_confirm: true,
  },
  {
    id: "bank_transfer",
    label_fa: "کارت به کارت / واریز بانکی",
    auto_confirm: false,
    requires: "آپلود تصویر رسید پرداخت",
    admin_confirms_within_hours: 24,
  },
] as const;

// Creator subscription plans (price defined at launch per spec)
export const CREATOR_PLANS = [
  { id: "basic", name: "Basic", contacts_per_month: 10, price_toman: null as number | null },
  { id: "pro", name: "Pro", contacts_per_month: "unlimited" as const, price_toman: null as number | null },
] as const;

export const PROFILE_VALIDITY_MONTHS = 12;

// File-upload limits — enforced client AND server side
export const UPLOAD_LIMITS = {
  profile_photo: { max_mb: 5, formats: ["jpg", "jpeg", "png", "webp"], accept: "image/jpeg,image/png,image/webp" },
  portfolio_photos: { max_mb: 5, max_count: 5, formats: ["jpg", "jpeg", "png", "webp"], accept: "image/jpeg,image/png,image/webp" },
  video_reel: { max_mb: 500, max_duration_min: 3, formats: ["mp4"], accept: "video/mp4" },
  voice_sample: { max_mb: 20, formats: ["mp3"], accept: "audio/mpeg" },
  cv_pdf: { max_mb: 10, formats: ["pdf"], accept: "application/pdf" },
  bank_transfer_receipt: { max_mb: 5, formats: ["jpg", "jpeg", "png", "pdf"], accept: "image/jpeg,image/png,application/pdf" },
} as const;

export type UploadKind = keyof typeof UPLOAD_LIMITS;
