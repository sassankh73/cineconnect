// Bilingual dictionary. Persian (fa) is the DEFAULT and RTL.
export type Lang = "fa" | "en";

export const dict = {
  brand: { fa: "سینه‌کانکت", en: "CineConnect" },
  tagline: { fa: "جایی که استعداد، فرصت پیدا می‌کند", en: "Where Talent Finds Opportunity" },

  nav: {
    home: { fa: "خانه", en: "Home" },
    talents: { fa: "استعدادها", en: "Talents" },
    about: { fa: "درباره ما", en: "About" },
    contact: { fa: "تماس", en: "Contact" },
    faq: { fa: "سوالات متداول", en: "FAQ" },
    login: { fa: "ورود", en: "Login" },
    registerPlayer: { fa: "ثبت‌نام بازیگر / عوامل", en: "Register as Talent" },
    loginCreator: { fa: "ورود سازنده فیلم", en: "Filmmaker Login" },
    dashboard: { fa: "داشبورد", en: "Dashboard" },
    logout: { fa: "خروج", en: "Logout" },
    admin: { fa: "مدیریت", en: "Admin" },
  },

  common: {
    next: { fa: "بعدی", en: "Next" },
    prev: { fa: "قبلی", en: "Back" },
    submit: { fa: "ثبت", en: "Submit" },
    save: { fa: "ذخیره", en: "Save" },
    cancel: { fa: "انصراف", en: "Cancel" },
    optional: { fa: "اختیاری", en: "optional" },
    required: { fa: "الزامی", en: "required" },
    loading: { fa: "در حال بارگذاری…", en: "Loading…" },
    search: { fa: "جستجو", en: "Search" },
    filters: { fa: "فیلترها", en: "Filters" },
    clear: { fa: "پاک کردن", en: "Clear" },
    viewProfile: { fa: "مشاهده پروفایل", en: "View Profile" },
    toman: { fa: "تومان", en: "Toman" },
    yes: { fa: "بله", en: "Yes" },
    no: { fa: "خیر", en: "No" },
    email: { fa: "ایمیل", en: "Email" },
    password: { fa: "رمز عبور", en: "Password" },
    all: { fa: "همه", en: "All" },
  },

  home: {
    ctaPrimary: { fa: "ثبت‌نام بازیگر / عوامل", en: "Register as Talent" },
    ctaSecondary: { fa: "ورود سازنده فیلم", en: "Filmmaker Login" },
    howItWorks: { fa: "چگونه کار می‌کند", en: "How It Works" },
    step1: { fa: "پروفایل خود را بسازید", en: "Build your profile" },
    step1d: { fa: "اطلاعات حرفه‌ای، نمونه‌کار و رسانه خود را در چند گام ساده ثبت کنید.", en: "Register your professional info, portfolio and media in a few simple steps." },
    step2: { fa: "سطح خود را فعال کنید", en: "Activate your tier" },
    step2d: { fa: "با پرداخت حق عضویت، پروفایل شما برای سازندگان قابل مشاهده می‌شود.", en: "Pay your membership fee and your profile becomes visible to filmmakers." },
    step3: { fa: "فرصت‌ها را دریافت کنید", en: "Receive opportunities" },
    step3d: { fa: "کارگردانان و تهیه‌کنندگان پروفایل شما را می‌بینند و با شما تماس می‌گیرند.", en: "Directors and producers discover your profile and contact you." },
    featured: { fa: "استعدادهای منتخب", en: "Featured Talent" },
    professions: { fa: "تخصص‌ها", en: "Professions" },
    testimonials: { fa: "از زبان کاربران", en: "Testimonials" },
    statsTalents: { fa: "استعداد ثبت‌نام‌شده", en: "Registered talents" },
    statsProductions: { fa: "تولید سینمایی", en: "Productions" },
    statsCities: { fa: "شهر", en: "Cities" },
  },

  auth: {
    loginTitle: { fa: "ورود به سینه‌کانکت", en: "Sign in to CineConnect" },
    tabPlayer: { fa: "بازیگر / عوامل", en: "Talent / Crew" },
    tabCreator: { fa: "سازنده فیلم", en: "Filmmaker" },
    forgot: { fa: "رمز عبور را فراموش کرده‌اید؟", en: "Forgot password?" },
    noAccount: { fa: "حساب ندارید؟ ثبت‌نام کنید", en: "No account? Register" },
    signIn: { fa: "ورود", en: "Sign in" },
  },

  errors: {
    required: { fa: "این فیلد الزامی است", en: "This field is required" },
    emailInvalid: { fa: "ایمیل معتبر نیست", en: "Invalid email address" },
    passwordWeak: { fa: "رمز باید حداقل ۸ کاراکتر، شامل حرف بزرگ، عدد و نماد باشد", en: "Password must be 8+ chars with an uppercase letter, a number and a symbol" },
    passwordMismatch: { fa: "رمزها مطابقت ندارند", en: "Passwords do not match" },
    fileTooBig: { fa: "حجم فایل بیش از حد مجاز است", en: "File exceeds the maximum size" },
    fileWrongType: { fa: "فرمت فایل مجاز نیست", en: "File format not allowed" },
    nationalId: { fa: "کد ملی باید ۱۰ رقم باشد", en: "National ID must be 10 digits" },
    loginFailed: { fa: "ایمیل یا رمز عبور اشتباه است", en: "Incorrect email or password" },
    rateLimited: { fa: "تلاش‌های زیاد. لطفاً بعداً دوباره امتحان کنید", en: "Too many attempts. Please try again later." },
    network: { fa: "خطای ارتباط با سرور", en: "Network error" },
  },

  footer: {
    rights: { fa: "تمامی حقوق محفوظ است.", en: "All rights reserved." },
    privacyNote: {
      fa: "این پلتفرم مطابق با اصول حفاظت از داده‌ها (GDPR و قوانین حریم خصوصی ایران) عمل می‌کند.",
      en: "This platform complies with GDPR and Iranian data-privacy regulations.",
    },
  },
} as const;

export type DictPath = typeof dict;

// Helper to read "section.key" safely
export function t(lang: Lang, section: keyof DictPath, key: string): string {
  // @ts-expect-error dynamic access into the typed dict
  const entry = dict[section]?.[key];
  if (!entry) return `${String(section)}.${key}`;
  return entry[lang] ?? entry.fa;
}
