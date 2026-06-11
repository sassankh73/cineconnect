"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useLang } from "@/app/providers";
import { Field, TextInput, Select, CheckboxPills } from "@/components/fields";
import {
  IRAN_PROVINCES, PRIMARY_PROFESSIONS, EXPERIENCE_LEVELS, GENDERS,
  EDUCATION_OPTIONS, BODY_TYPES, SPECIAL_SKILLS, AVAILABILITY_OPTIONS,
  LANGUAGES, TIERS, PAYMENT_METHODS, UPLOAD_LIMITS,
} from "@/lib/constants";
import { isValidEmail, isStrongPassword, isValidNationalId } from "@/lib/validation";
import { precheck, humanLimit, uploadFile } from "@/lib/upload-client";
import type { UploadKind } from "@/lib/constants";

type Errors = Record<string, string>;

const STEP_TITLES = [
  { fa: "اطلاعات حساب", en: "Account" },
  { fa: "اطلاعات حرفه‌ای", en: "Professional" },
  { fa: "بارگذاری رسانه", en: "Media" },
  { fa: "سطح و پرداخت", en: "Tier & Payment" },
  { fa: "تأیید", en: "Done" },
];

export default function RegisterPlayerPage() {
  const { lang } = useLang();
  const { refresh } = useAuth();
  const router = useRouter();
  const fa = lang === "fa";

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  // ---- account (step 1) ----
  const [account, setAccount] = useState({
    email: "", password: "", password_confirm: "",
    security_question: "", security_answer: "",
  });

  // ---- profile (step 2) ----
  const [p, setP] = useState<any>({
    full_name_persian: "", full_name_latin: "", date_of_birth: "", gender: "",
    city: "", province: "", willing_to_travel: false, phone: "", national_id: "",
    primary_profession: "", secondary_professions: [] as string[],
    experience_level: "", years_experience: "", education_training: [] as string[],
    education_detail: "", notable_projects: [] as any[], awards: "", union_membership: "",
    languages_spoken: [] as string[],
    physical_attributes: { height_cm: "", weight_kg: "", eye_color: "", hair_color: "", body_type: "" },
    special_skills: [] as string[], special_skill_other: "",
    availability: "", daily_rate: "", instagram: "", imdb_link: "", website: "",
  });

  // ---- media files (step 3) — held locally, uploaded at final submit ----
  const [files, setFiles] = useState<{
    profile_photo: File | null; portfolio_photos: File[];
    video_reel: File | null; voice_sample: File | null; cv_pdf: File | null;
  }>({ profile_photo: null, portfolio_photos: [], video_reel: null, voice_sample: null, cv_pdf: null });

  // ---- tier & payment (step 4) ----
  const [tier, setTier] = useState(1);
  const [payMethod, setPayMethod] = useState<"online_gateway" | "bank_transfer">("online_gateway");
  const [gateway, setGateway] = useState("ZarinPal");
  const [receipt, setReceipt] = useState<File | null>(null);

  const setField = (k: string, v: any) => setP((prev: any) => ({ ...prev, [k]: v }));
  const setAcc = (k: string, v: any) => setAccount((prev) => ({ ...prev, [k]: v }));
  const toggleIn = (k: string, v: string) =>
    setP((prev: any) => {
      const arr = prev[k] as string[];
      return { ...prev, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  const E = (k: string) => (errors[k] ? errors[k] : undefined);

  // ---------------- per-step validation ----------------
  function validateStep(s: number): boolean {
    const e: Errors = {};
    const req = fa ? "این فیلد الزامی است" : "Required";
    if (s === 1) {
      if (!isValidEmail(account.email)) e.email = fa ? "ایمیل معتبر نیست" : "Invalid email";
      if (!isStrongPassword(account.password))
        e.password = fa ? "حداقل ۸ کاراکتر، شامل حرف بزرگ، عدد و نماد" : "8+ chars, uppercase, number, symbol";
      if (account.password !== account.password_confirm)
        e.password_confirm = fa ? "رمزها مطابقت ندارند" : "Passwords do not match";
      if (!account.security_question.trim()) e.security_question = req;
      if (!account.security_answer.trim()) e.security_answer = req;
    }
    if (s === 2) {
      for (const k of ["full_name_persian", "full_name_latin", "date_of_birth", "gender", "city", "province", "primary_profession", "experience_level"]) {
        if (!String(p[k]).trim()) e[k] = req;
      }
      if (!String(p.phone).trim()) e.phone = req;
      if (!isValidNationalId(p.national_id)) e.national_id = fa ? "کد ملی باید ۱۰ رقم معتبر باشد" : "Valid 10-digit National ID required";
      if (p.years_experience === "" || Number(p.years_experience) < 0) e.years_experience = req;
      if (!p.availability) e.availability = req;
    }
    if (s === 3) {
      if (!files.profile_photo) e.profile_photo = fa ? "عکس پروفایل الزامی است" : "Profile photo is required";
    }
    if (s === 4) {
      if (payMethod === "bank_transfer" && !receipt) e.receipt = fa ? "بارگذاری رسید الزامی است" : "Receipt upload required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) {
      setErrors({});
      setStep((s) => Math.min(5, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function prev() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onFile(kind: UploadKind, file: File | null, multi = false) {
    if (!file) return;
    const chk = precheck(kind, file);
    if (!chk.ok) {
      setErrors((e) => ({ ...e, [kind]: chk.reason === "size"
        ? (fa ? "حجم فایل بیش از حد مجاز است" : "File too large")
        : (fa ? "فرمت فایل مجاز نیست" : "Wrong file format") }));
      return;
    }
    setErrors((e) => { const { [kind]: _, ...rest } = e; return rest; });
    if (multi) {
      setFiles((f) => ({ ...f, portfolio_photos: [...f.portfolio_photos, file].slice(0, UPLOAD_LIMITS.portfolio_photos.max_count) }));
    } else {
      setFiles((f) => ({ ...f, [kind]: file }));
    }
  }

  // ---------------- final submit ----------------
  async function submitAll() {
    if (!validateStep(4)) return;
    setSubmitting(true);
    setSubmitMsg(fa ? "در حال ایجاد حساب…" : "Creating account…");
    try {
      // 1) register (account + profile + tier) → sets session
      const regRes = await fetch("/api/auth/register/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account,
          profile: {
            ...p,
            tier,
            physical_attributes: {
              height_cm: Number(p.physical_attributes.height_cm) || undefined,
              weight_kg: Number(p.physical_attributes.weight_kg) || undefined,
              eye_color: p.physical_attributes.eye_color || undefined,
              hair_color: p.physical_attributes.hair_color || undefined,
              body_type: p.physical_attributes.body_type || undefined,
            },
            special_skills: [
              ...p.special_skills,
              ...(p.special_skill_other ? [p.special_skill_other] : []),
            ],
            years_experience: Number(p.years_experience) || 0,
          },
        }),
      });
      if (!regRes.ok) {
        const d = await regRes.json().catch(() => ({}));
        throw new Error(d.error === "email_taken" ? (fa ? "این ایمیل قبلاً ثبت شده است" : "Email already registered") : (fa ? "خطا در ثبت‌نام" : "Registration failed"));
      }

      // 2) upload media (now authenticated) and attach
      setSubmitMsg(fa ? "در حال بارگذاری رسانه…" : "Uploading media…");
      const media: Record<string, any> = {};
      if (files.profile_photo) media.profile_photo = await uploadFile("profile_photo", files.profile_photo);
      if (files.portfolio_photos.length) {
        media.portfolio_photos = [];
        for (const ph of files.portfolio_photos) media.portfolio_photos.push(await uploadFile("portfolio_photos", ph));
      }
      if (files.video_reel) media.video_reel = await uploadFile("video_reel", files.video_reel);
      if (files.voice_sample) media.voice_sample = await uploadFile("voice_sample", files.voice_sample);
      if (files.cv_pdf) media.cv_pdf = await uploadFile("cv_pdf", files.cv_pdf);
      if (Object.keys(media).length) {
        await fetch("/api/player/me", {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ media }),
        });
      }

      // 3) payment
      setSubmitMsg(fa ? "در حال پردازش پرداخت…" : "Processing payment…");
      let receipt_ref: string | undefined;
      if (payMethod === "bank_transfer" && receipt) {
        receipt_ref = await uploadFile("bank_transfer_receipt", receipt);
      }
      await fetch("/api/payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: payMethod, gateway: payMethod === "online_gateway" ? gateway : undefined, receipt_ref }),
      });

      await refresh();
      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitMsg(err?.message || (fa ? "خطایی رخ داد" : "An error occurred"));
    } finally {
      setSubmitting(false);
    }
  }

  const progress = useMemo(() => ((step - 1) / 4) * 100, [step]);
  const selectedTier = TIERS.find((t) => t.tier === tier)!;

  return (
    <div className="container-cine max-w-3xl py-12">
      {/* progress bar */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          {STEP_TITLES.map((s, i) => (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                  step >= i + 1 ? "bg-gold-sheen text-charcoal" : "bg-charcoal-700 text-white/40"
                }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`mt-1.5 hidden text-[11px] sm:block ${step >= i + 1 ? "text-gold" : "text-white/35"}`}>
                {fa ? s.fa : s.en}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal-700">
          <motion.div className="h-full bg-gold-sheen" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: fa ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: fa ? 20 : -20 }}
          transition={{ duration: 0.25 }}
          className="card p-6 sm:p-8"
        >
          {/* ---------------- STEP 1 ---------------- */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">{fa ? "اطلاعات حساب کاربری" : "Account Info"}</h2>
              <Field label={fa ? "ایمیل" : "Email"} required error={E("email")}>
                <TextInput type="email" value={account.email} onChange={(v) => setAcc("email", v)} error={!!E("email")} placeholder="you@example.com" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={fa ? "رمز عبور" : "Password"} required error={E("password")} hint={fa ? "حداقل ۸ کاراکتر، حرف بزرگ، عدد و نماد" : "8+ chars, uppercase, number, symbol"}>
                  <TextInput type="password" value={account.password} onChange={(v) => setAcc("password", v)} error={!!E("password")} />
                </Field>
                <Field label={fa ? "تکرار رمز عبور" : "Confirm password"} required error={E("password_confirm")}>
                  <TextInput type="password" value={account.password_confirm} onChange={(v) => setAcc("password_confirm", v)} error={!!E("password_confirm")} />
                </Field>
              </div>
              <Field label={fa ? "سوال امنیتی" : "Security question"} required error={E("security_question")} hint={fa ? "برای تأیید هویت در عملیات حساس" : "Used as a second factor for sensitive actions"}>
                <TextInput value={account.security_question} onChange={(v) => setAcc("security_question", v)} error={!!E("security_question")} placeholder={fa ? "مثلاً: نام اولین فیلمی که دیدید؟" : "e.g. First film you watched?"} />
              </Field>
              <Field label={fa ? "پاسخ سوال امنیتی" : "Security answer"} required error={E("security_answer")}>
                <TextInput value={account.security_answer} onChange={(v) => setAcc("security_answer", v)} error={!!E("security_answer")} />
              </Field>
            </div>
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">{fa ? "اطلاعات شخصی و حرفه‌ای" : "Personal & Professional Info"}</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={fa ? "نام و نام خانوادگی (فارسی)" : "Full name (Persian)"} required error={E("full_name_persian")}>
                  <TextInput value={p.full_name_persian} onChange={(v) => setField("full_name_persian", v)} error={!!E("full_name_persian")} />
                </Field>
                <Field label={fa ? "نام و نام خانوادگی (لاتین)" : "Full name (Latin)"} required error={E("full_name_latin")}>
                  <TextInput value={p.full_name_latin} onChange={(v) => setField("full_name_latin", v)} error={!!E("full_name_latin")} dir="ltr" />
                </Field>
                <Field label={fa ? "تاریخ تولد" : "Date of birth"} required error={E("date_of_birth")}>
                  <TextInput type="date" value={p.date_of_birth} onChange={(v) => setField("date_of_birth", v)} error={!!E("date_of_birth")} />
                </Field>
                <Field label={fa ? "جنسیت" : "Gender"} required error={E("gender")}>
                  <Select value={p.gender} onChange={(v) => setField("gender", v)} options={GENDERS} error={!!E("gender")} />
                </Field>
                <Field label={fa ? "شهر" : "City"} required error={E("city")}>
                  <TextInput value={p.city} onChange={(v) => setField("city", v)} error={!!E("city")} />
                </Field>
                <Field label={fa ? "استان" : "Province"} required error={E("province")}>
                  <Select value={p.province} onChange={(v) => setField("province", v)} options={IRAN_PROVINCES} error={!!E("province")} />
                </Field>
                <Field label={fa ? "شماره تماس" : "Phone"} required error={E("phone")} hint={fa ? "تا ارسال درخواست تماس از سازندگان پنهان است" : "Hidden from creators until a contact request"}>
                  <TextInput type="tel" dir="ltr" value={p.phone} onChange={(v) => setField("phone", v)} error={!!E("phone")} placeholder="09xxxxxxxxx" />
                </Field>
                <Field label={fa ? "کد ملی" : "National ID"} required error={E("national_id")} hint={fa ? "رمزنگاری می‌شود و هرگز نمایش داده نمی‌شود" : "Encrypted at rest, never displayed"}>
                  <TextInput dir="ltr" value={p.national_id} onChange={(v) => setField("national_id", v.replace(/\D/g, "").slice(0, 10))} error={!!E("national_id")} />
                </Field>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
                <input type="checkbox" checked={p.willing_to_travel} onChange={(e) => setField("willing_to_travel", e.target.checked)} className="h-4 w-4 accent-[#C9A84C]" />
                {fa ? "آمادگی سفر / جابجایی دارم" : "Willing to travel / relocate"}
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={fa ? "حرفه اصلی" : "Primary profession"} required error={E("primary_profession")}>
                  <Select value={p.primary_profession} onChange={(v) => setField("primary_profession", v)} options={PRIMARY_PROFESSIONS} error={!!E("primary_profession")} />
                </Field>
                <Field label={fa ? "سطح تجربه" : "Experience level"} required error={E("experience_level")}>
                  <Select
                    value={p.experience_level}
                    onChange={(v) => { setField("experience_level", v); const m = EXPERIENCE_LEVELS.find(x => x.value === v); if (m) setTier(m.tier); }}
                    options={EXPERIENCE_LEVELS.map((x) => ({ value: x.value, label: x.label_fa }))}
                    error={!!E("experience_level")}
                  />
                </Field>
                <Field label={fa ? "سال‌های تجربه فعال" : "Years of experience"} required error={E("years_experience")}>
                  <TextInput type="number" dir="ltr" value={String(p.years_experience)} onChange={(v) => setField("years_experience", v)} error={!!E("years_experience")} />
                </Field>
                <Field label={fa ? "دسترس‌پذیری" : "Availability"} required error={E("availability")}>
                  <Select value={p.availability} onChange={(v) => setField("availability", v)} options={AVAILABILITY_OPTIONS} error={!!E("availability")} />
                </Field>
              </div>

              <Field label={fa ? "حرفه‌های فرعی" : "Secondary professions"}>
                <CheckboxPills options={PRIMARY_PROFESSIONS.filter((x) => x !== p.primary_profession)} selected={p.secondary_professions} onToggle={(v) => toggleIn("secondary_professions", v)} />
              </Field>

              <Field label={fa ? "تحصیلات و آموزش" : "Education & training"}>
                <CheckboxPills options={EDUCATION_OPTIONS} selected={p.education_training} onToggle={(v) => toggleIn("education_training", v)} />
              </Field>
              <Field label={fa ? "توضیح بیشتر درباره تحصیلات" : "Education detail"}>
                <textarea className="input min-h-20" value={p.education_detail} onChange={(e) => setField("education_detail", e.target.value)} />
              </Field>

              <Field label={fa ? "زبان‌های مسلط" : "Languages"}>
                <CheckboxPills options={LANGUAGES} selected={p.languages_spoken} onToggle={(v) => toggleIn("languages_spoken", v)} />
              </Field>

              {/* physical attributes (for actors) */}
              <div className="rounded-xl border border-white/10 bg-charcoal-800/50 p-4">
                <p className="mb-3 text-sm font-semibold text-gold">{fa ? "مشخصات ظاهری (برای بازیگران)" : "Physical attributes (for actors)"}</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label={fa ? "قد (سانتی‌متر)" : "Height (cm)"}><TextInput type="number" dir="ltr" value={p.physical_attributes.height_cm} onChange={(v) => setField("physical_attributes", { ...p.physical_attributes, height_cm: v })} /></Field>
                  <Field label={fa ? "وزن (کیلوگرم)" : "Weight (kg)"}><TextInput type="number" dir="ltr" value={p.physical_attributes.weight_kg} onChange={(v) => setField("physical_attributes", { ...p.physical_attributes, weight_kg: v })} /></Field>
                  <Field label={fa ? "هیکل" : "Body type"}><Select value={p.physical_attributes.body_type} onChange={(v) => setField("physical_attributes", { ...p.physical_attributes, body_type: v })} options={BODY_TYPES} /></Field>
                  <Field label={fa ? "رنگ چشم" : "Eye color"}><TextInput value={p.physical_attributes.eye_color} onChange={(v) => setField("physical_attributes", { ...p.physical_attributes, eye_color: v })} /></Field>
                  <Field label={fa ? "رنگ مو" : "Hair color"}><TextInput value={p.physical_attributes.hair_color} onChange={(v) => setField("physical_attributes", { ...p.physical_attributes, hair_color: v })} /></Field>
                </div>
              </div>

              <Field label={fa ? "مهارت‌های ویژه" : "Special skills"}>
                <CheckboxPills options={SPECIAL_SKILLS} selected={p.special_skills} onToggle={(v) => toggleIn("special_skills", v)} />
                <input className="input mt-2" placeholder={fa ? "مهارت دیگر…" : "Other skill…"} value={p.special_skill_other} onChange={(e) => setField("special_skill_other", e.target.value)} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={fa ? "جوایز و افتخارات" : "Awards"}><textarea className="input min-h-16" value={p.awards} onChange={(e) => setField("awards", e.target.value)} /></Field>
                <Field label={fa ? "عضویت در انجمن / صنف" : "Union membership"}><TextInput value={p.union_membership} onChange={(v) => setField("union_membership", v)} /></Field>
                <Field label={fa ? "دستمزد روزانه" : "Daily rate"}><TextInput value={p.daily_rate} onChange={(v) => setField("daily_rate", v)} placeholder={fa ? "مثلاً: ۲ میلیون تومان یا قابل مذاکره" : "e.g. negotiable"} /></Field>
                <Field label="اینستاگرام / Instagram"><TextInput dir="ltr" value={p.instagram} onChange={(v) => setField("instagram", v)} placeholder="@username" /></Field>
                <Field label="IMDb"><TextInput dir="ltr" value={p.imdb_link} onChange={(v) => setField("imdb_link", v)} placeholder="https://imdb.com/name/…" /></Field>
                <Field label={fa ? "وب‌سایت شخصی" : "Website"}><TextInput dir="ltr" value={p.website} onChange={(v) => setField("website", v)} /></Field>
              </div>
            </div>
          )}

          {/* ---------------- STEP 3 ---------------- */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">{fa ? "بارگذاری رسانه" : "Media Uploads"}</h2>

              <FileBox label={fa ? "عکس پروفایل (هدشات)" : "Profile photo (headshot)"} required hint={humanLimit("profile_photo")} error={E("profile_photo")}
                accept={UPLOAD_LIMITS.profile_photo.accept} value={files.profile_photo} onPick={(f) => onFile("profile_photo", f)} onClear={() => setFiles((s) => ({ ...s, profile_photo: null }))} preview />

              <Field label={fa ? `گالری عکس (حداکثر ${UPLOAD_LIMITS.portfolio_photos.max_count})` : "Photo gallery (max 5)"} hint={humanLimit("portfolio_photos")}>
                <input type="file" accept={UPLOAD_LIMITS.portfolio_photos.accept} className="block w-full text-sm text-white/70 file:me-3 file:rounded-md file:border-0 file:bg-gold/15 file:px-4 file:py-2 file:text-gold"
                  onChange={(e) => { const f = e.target.files?.[0]; onFile("portfolio_photos", f ?? null, true); e.currentTarget.value = ""; }} />
                {files.portfolio_photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {files.portfolio_photos.map((ph, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(ph)} alt="" className="h-16 w-16 rounded-md object-cover" />
                        <button type="button" onClick={() => setFiles((s) => ({ ...s, portfolio_photos: s.portfolio_photos.filter((_, j) => j !== i) }))} className="absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-crimson text-xs text-white">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              <FileBox label={fa ? "ویدیو رزومه (حداکثر ۳ دقیقه)" : "Video reel (max 3 min)"} hint={humanLimit("video_reel")} error={E("video_reel")}
                accept={UPLOAD_LIMITS.video_reel.accept} value={files.video_reel} onPick={(f) => onFile("video_reel", f)} onClear={() => setFiles((s) => ({ ...s, video_reel: null }))} />
              <FileBox label={fa ? "نمونه صدا (دوبلور/بازیگر)" : "Voice sample"} hint={humanLimit("voice_sample")} error={E("voice_sample")}
                accept={UPLOAD_LIMITS.voice_sample.accept} value={files.voice_sample} onPick={(f) => onFile("voice_sample", f)} onClear={() => setFiles((s) => ({ ...s, voice_sample: null }))} />
              <FileBox label={fa ? "رزومه (PDF)" : "CV (PDF)"} hint={humanLimit("cv_pdf")} error={E("cv_pdf")}
                accept={UPLOAD_LIMITS.cv_pdf.accept} value={files.cv_pdf} onPick={(f) => onFile("cv_pdf", f)} onClear={() => setFiles((s) => ({ ...s, cv_pdf: null }))} />
            </div>
          )}

          {/* ---------------- STEP 4 ---------------- */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-white">{fa ? "انتخاب سطح و پرداخت" : "Choose Tier & Payment"}</h2>
              <p className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-sm text-gold">
                {fa ? "پروفایل تا تأیید پرداخت پنهان می‌ماند. اعتبار پروفایل ۱۲ ماه است." : "Profile stays hidden until payment is confirmed. Valid for 12 months."}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {TIERS.map((tt) => (
                  <button key={tt.tier} type="button" onClick={() => setTier(tt.tier)}
                    className={`rounded-xl border p-4 text-start transition ${tier === tt.tier ? "border-gold bg-gold/10 shadow-gold" : "border-white/12 bg-charcoal-800 hover:border-white/25"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg font-semibold text-white">{tt.label_fa}</span>
                      <span className="badge-gold">Tier {tt.tier}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/55">{tt.description}</p>
                    <p className="mt-2 font-bold text-gold">{tt.fee_toman.toLocaleString("fa-IR")} {fa ? "تومان" : "Toman"}</p>
                  </button>
                ))}
              </div>

              <div>
                <p className="label">{fa ? "روش پرداخت" : "Payment method"}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m.id} type="button" onClick={() => setPayMethod(m.id as any)}
                      className={`rounded-xl border p-4 text-start text-sm transition ${payMethod === m.id ? "border-gold bg-gold/10" : "border-white/12 bg-charcoal-800 hover:border-white/25"}`}>
                      <span className="font-medium text-white">{m.label_fa}</span>
                      {"gateways" in m && <p className="mt-1 text-xs text-white/50">{m.gateways.join(" · ")}</p>}
                      {"admin_confirms_within_hours" in m && <p className="mt-1 text-xs text-white/50">{fa ? "تأیید دستی ظرف ۲۴ ساعت" : "Manual confirm within 24h"}</p>}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod === "online_gateway" && (
                <Field label={fa ? "درگاه پرداخت" : "Gateway"}>
                  <Select value={gateway} onChange={setGateway} options={["ZarinPal", "IDPay", "Parsian"]} />
                </Field>
              )}
              {payMethod === "bank_transfer" && (
                <FileBox label={fa ? "تصویر رسید واریز" : "Payment receipt image"} required hint={humanLimit("bank_transfer_receipt")} error={E("receipt")}
                  accept={UPLOAD_LIMITS.bank_transfer_receipt.accept} value={receipt} onPick={(f) => { const c = precheck("bank_transfer_receipt", f!); if (!c.ok) { setErrors((e) => ({ ...e, receipt: fa ? "فایل نامعتبر" : "Invalid file" })); return; } setErrors((e) => { const { receipt, ...r } = e; return r; }); setReceipt(f); }} onClear={() => setReceipt(null)} />
              )}

              <div className="rounded-xl border border-white/10 bg-charcoal-800 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/65">{fa ? "مبلغ قابل پرداخت" : "Total"}</span>
                  <span className="font-display text-xl font-bold text-gold">{selectedTier.fee_toman.toLocaleString("fa-IR")} {fa ? "تومان" : "Toman"}</span>
                </div>
              </div>

              {submitMsg && <p className="text-center text-sm text-gold">{submitMsg}</p>}
            </div>
          )}

          {/* ---------------- STEP 5 ---------------- */}
          {step === 5 && (
            <div className="py-8 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-4xl text-gold">✓</motion.div>
              <h2 className="mt-6 font-display text-2xl font-bold text-white">{fa ? "ثبت‌نام تکمیل شد" : "Registration complete"}</h2>
              <p className="mx-auto mt-3 max-w-md text-white/65">
                {payMethod === "online_gateway"
                  ? (fa ? "پرداخت شما با موفقیت تأیید شد و پروفایل‌تان فعال و برای سازندگان قابل مشاهده است." : "Your payment was confirmed and your profile is now active and visible to creators.")
                  : (fa ? "رسید شما دریافت شد. پس از تأیید پرداخت توسط مدیر (حداکثر ۲۴ ساعت)، پروفایل شما فعال می‌شود. ایمیل تأیید ارسال شد." : "Your receipt was received. After an admin confirms payment (within 24h), your profile will be activated. A confirmation email was sent.")}
              </p>
              <div className="mt-7 flex justify-center gap-3">
                <button onClick={() => router.push("/dashboard/player")} className="btn-primary">{fa ? "رفتن به داشبورد" : "Go to dashboard"}</button>
              </div>
            </div>
          )}

          {/* nav buttons */}
          {step < 5 && (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/8 pt-6">
              <button onClick={prev} disabled={step === 1} className="btn-ghost">{fa ? "قبلی" : "Back"}</button>
              {step < 4 ? (
                <button onClick={next} className="btn-primary">{fa ? "بعدی" : "Next"}</button>
              ) : (
                <button onClick={submitAll} disabled={submitting} className="btn-crimson">
                  {submitting ? (fa ? "در حال پردازش…" : "Processing…") : (fa ? "پرداخت و ثبت نهایی" : "Pay & finish")}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---- file picker box ----
function FileBox({
  label, required, hint, error, accept, value, onPick, onClear, preview,
}: {
  label: string; required?: boolean; hint?: string; error?: string; accept: string;
  value: File | null; onPick: (f: File | null) => void; onClear: () => void; preview?: boolean;
}) {
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/12 bg-charcoal-800 p-3">
          {preview && value.type.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={URL.createObjectURL(value)} alt="" className="h-14 w-14 rounded-md object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-gold/15 text-xl text-gold">📎</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white/85">{value.name}</p>
            <p className="text-xs text-white/45">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button type="button" onClick={onClear} className="text-sm text-crimson-light hover:underline">حذف</button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 bg-charcoal-800 px-4 py-6 text-sm text-white/55 transition hover:border-gold/50 hover:text-gold">
          <input type="file" accept={accept} className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
          + انتخاب فایل
        </label>
      )}
    </Field>
  );
}
