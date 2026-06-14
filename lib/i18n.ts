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
    rememberMe: { fa: "مرا به خاطر بسپار", en: "Remember me" },
    orContinueWith: { fa: "یا ورود با", en: "or continue with" },
    continueWith: { fa: "ادامه با", en: "Continue with" },
    // forgot-password page
    forgotTitle: { fa: "بازیابی رمز عبور", en: "Reset your password" },
    forgotDesc: { fa: "ایمیل خود را وارد کنید تا لینک بازیابی برایتان ارسال شود.", en: "Enter your email and we'll send you a reset link." },
    sendResetLink: { fa: "ارسال لینک بازیابی", en: "Send reset link" },
    forgotSent: { fa: "اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی رمز ارسال شد. صندوق ورودی (و پوشه اسپم) را بررسی کنید.", en: "If that email exists, a reset link has been sent. Check your inbox (and spam folder)." },
    backToLogin: { fa: "بازگشت به ورود", en: "Back to login" },
    // reset-password page
    resetTitle: { fa: "انتخاب رمز عبور جدید", en: "Choose a new password" },
    newPassword: { fa: "رمز عبور جدید", en: "New password" },
    confirmPassword: { fa: "تکرار رمز عبور", en: "Confirm password" },
    resetCta: { fa: "بازنشانی رمز عبور", en: "Reset password" },
    resetSuccess: { fa: "رمز عبور شما با موفقیت تغییر کرد. در حال انتقال به صفحه ورود…", en: "Your password has been reset. Redirecting to login…" },
    resetExpired: { fa: "این لینک نامعتبر یا منقضی شده است.", en: "This link is invalid or has expired." },
    requestNewLink: { fa: "درخواست لینک جدید", en: "Request a new link" },
    // verify-email page
    verifying: { fa: "در حال تأیید ایمیل شما…", en: "Verifying your email…" },
    verifySuccess: { fa: "ایمیل شما تأیید شد! در حال انتقال به داشبورد…", en: "Email verified! Redirecting to your dashboard…" },
    verifyError: { fa: "لینک تأیید نامعتبر یا منقضی شده است.", en: "This verification link is invalid or has expired." },
    resendVerification: { fa: "ارسال مجدد لینک تأیید", en: "Resend verification link" },
    resendCooldown: { fa: "ارسال مجدد تا", en: "Resend available in" },
    resent: { fa: "لینک تأیید جدید ارسال شد.", en: "A new verification link has been sent." },
    // dashboard banner
    bannerUnverified: { fa: "ایمیل شما هنوز تأیید نشده است. برخی امکانات تا زمان تأیید غیرفعال هستند.", en: "Your email isn't verified yet. Some features are disabled until you verify." },
    bannerResend: { fa: "ارسال مجدد ایمیل تأیید", en: "Resend verification email" },
    // change password (account settings)
    changePasswordTitle: { fa: "تغییر رمز عبور", en: "Change password" },
    currentPassword: { fa: "رمز عبور فعلی", en: "Current password" },
    changePasswordCta: { fa: "تغییر رمز عبور", en: "Change password" },
    changePasswordSuccess: { fa: "رمز عبور با موفقیت تغییر کرد.", en: "Password changed successfully." },
  },

  adminLogin: {
    title: { fa: "ورود مدیر سیستم", en: "Admin Login" },
    subtitle: { fa: "Admin Access — CineConnect", en: "Admin Access — CineConnect" },
    emailLabel: { fa: "ایمیل مدیر", en: "Admin Email" },
    step1Btn: { fa: "ادامه", en: "Continue" },
    secQuestion: { fa: "سؤال امنیتی", en: "Security Question" },
    secAnswer: { fa: "پاسخ امنیتی", en: "Security Answer" },
    secAnswerPlaceholder: { fa: "پاسخ خود را بنویسید…", en: "Write your answer…" },
    step2Btn: { fa: "ورود به پنل مدیریت", en: "Enter Admin Panel" },
    back: { fa: "بازگشت", en: "Back" },
    checking: { fa: "در حال تأیید…", en: "Verifying…" },
    restricted: { fa: "این صفحه فقط برای مدیران سیستم است. دسترسی غیرمجاز گزارش می‌شود.", en: "This page is for system administrators only. Unauthorized access is logged." },
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
    accountLocked: { fa: "به دلیل تلاش‌های ناموفق زیاد، حساب شما موقتاً قفل شده است. لطفاً بعداً دوباره امتحان کنید.", en: "Your account is temporarily locked due to too many failed attempts. Try again later." },
    accountInactive: { fa: "این حساب غیرفعال شده است.", en: "This account has been deactivated." },
    emailTaken: { fa: "این ایمیل قبلاً ثبت شده است.", en: "This email is already registered." },
    tokenInvalid: { fa: "این لینک نامعتبر یا منقضی شده است.", en: "This link is invalid or has expired." },
    currentPasswordWrong: { fa: "رمز عبور فعلی اشتباه است.", en: "Your current password is incorrect." },
    notAuthenticated: { fa: "برای این کار باید وارد شوید.", en: "You must be signed in to do this." },
    verificationCooldown: { fa: "لطفاً پیش از ارسال مجدد کمی صبر کنید.", en: "Please wait a moment before requesting another email." },
    verificationLimit: { fa: "به سقف ارسال روزانه رسیده‌اید. فردا دوباره تلاش کنید.", en: "You've reached the daily resend limit. Try again tomorrow." },
    emailNotVerified: { fa: "برای این کار ابتدا باید ایمیل خود را تأیید کنید.", en: "Please verify your email address first." },
    oauthUnconfigured: { fa: "این روش ورود هنوز پیکربندی نشده است.", en: "This sign-in method isn't configured yet." },
    oauthFailed: { fa: "ورود با این سرویس ناموفق بود. دوباره تلاش کنید.", en: "Sign-in with this provider failed. Please try again." },
    validation: { fa: "اطلاعات واردشده معتبر نیست.", en: "The submitted data is invalid." },
    server: { fa: "خطای داخلی سرور. لطفاً بعداً تلاش کنید.", en: "Internal server error. Please try again later." },
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
