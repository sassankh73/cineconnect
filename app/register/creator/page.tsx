"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useLang } from "@/app/providers";
import { Field, TextInput } from "@/components/fields";
import { isValidEmail, isStrongPassword } from "@/lib/validation";
import { CREATOR_PLANS } from "@/lib/constants";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RegisterCreatorPage() {
  const { lang } = useLang();
  const { refresh } = useAuth();
  const router = useRouter();
  const fa = lang === "fa";

  const [f, setF] = useState({ full_name: "", company: "", role_title: "", email: "", password: "", password_confirm: "" });
  const [cinemaIdFile, setCinemaIdFile] = useState<File | null>(null);
  const [cinemaIdPreview, setCinemaIdPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((err) => ({ ...err, cinema_id: fa ? "حجم فایل نباید بیش از ۵ مگابایت باشد" : "File must be under 5MB" }));
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setErrors((err) => ({ ...err, cinema_id: fa ? "فقط JPG، PNG، WebP یا PDF مجاز است" : "Only JPG, PNG, WebP or PDF allowed" }));
      return;
    }
    setCinemaIdFile(file);
    setErrors((err) => { const e = { ...err }; delete e.cinema_id; return e; });
    if (file.type.startsWith("image/")) {
      setCinemaIdPreview(URL.createObjectURL(file));
    } else {
      setCinemaIdPreview(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.full_name.trim()) errs.full_name = fa ? "الزامی" : "Required";
    if (!isValidEmail(f.email)) errs.email = fa ? "ایمیل معتبر نیست" : "Invalid email";
    if (!isStrongPassword(f.password)) errs.password = fa ? "حداقل ۸ کاراکتر، حرف بزرگ، عدد و نماد" : "8+ chars, uppercase, number, symbol";
    if (f.password !== f.password_confirm) errs.password_confirm = fa ? "رمزها مطابقت ندارند" : "Passwords don't match";
    if (!cinemaIdFile) errs.cinema_id = fa ? "بارگذاری کارت سینمایی الزامی است" : "Cinema Card upload is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const cinemaIdBase64 = await fileToBase64(cinemaIdFile!);
      const res = await fetch("/api/auth/register/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.email, password: f.password, full_name: f.full_name,
          company: f.company, role_title: f.role_title,
          cinema_id_data: cinemaIdBase64, cinema_id_filename: cinemaIdFile!.name,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErrors({ email: d.error === "email_taken" ? (fa ? "این ایمیل قبلاً ثبت شده" : "Email taken") : (fa ? "خطا در ثبت‌نام" : "Failed") });
        return;
      }
      await refresh();
      router.push("/dashboard/creator");
    } catch {
      setErrors({ email: fa ? "خطای شبکه. دوباره تلاش کنید." : "Network error. Please retry." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-cine grid max-w-5xl gap-8 py-14 lg:grid-cols-2">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-bold text-white">{fa ? "ثبت‌نام سازنده فیلم" : "Register as Filmmaker"}</h1>
        <p className="mt-2 text-sm text-white/55">
          {fa ? "پس از تأیید مدارک توسط مدیر، به پروفایل بازیگران دسترسی خواهید داشت." : "After your documents are verified by an admin, you'll gain access to talent profiles."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label={fa ? "نام و نام خانوادگی" : "Full name"} required error={errors.full_name}>
            <TextInput value={f.full_name} onChange={set("full_name")} error={!!errors.full_name} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={fa ? "شرکت / استودیو" : "Company / Studio"}><TextInput value={f.company} onChange={set("company")} /></Field>
            <Field label={fa ? "سمت" : "Role"}><TextInput value={f.role_title} onChange={set("role_title")} placeholder={fa ? "کارگردان، تهیه‌کننده…" : "Director, Producer…"} /></Field>
          </div>
          <Field label={fa ? "ایمیل" : "Email"} required error={errors.email}>
            <TextInput type="email" value={f.email} onChange={set("email")} error={!!errors.email} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={fa ? "رمز عبور" : "Password"} required error={errors.password}>
              <TextInput type="password" value={f.password} onChange={set("password")} error={!!errors.password} />
            </Field>
            <Field label={fa ? "تکرار رمز" : "Confirm"} required error={errors.password_confirm}>
              <TextInput type="password" value={f.password_confirm} onChange={set("password_confirm")} error={!!errors.password_confirm} />
            </Field>
          </div>

          {/* Cinema ID Upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">
              {fa ? "کارت سینمایی / مجوز تهیه‌کنندگی" : "Cinema Card / Production License"}
              <span className="mr-1 text-red-400">*</span>
            </label>
            <p className="mb-3 text-xs text-white/45">
              {fa
                ? "تصویر کارت عضویت خانه سینما یا مجوز معتبر را بارگذاری کنید. برای تأیید هویت شما الزامی است."
                : "Upload your Cinema House membership card or valid production license. Required for identity verification."}
            </p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed py-6 text-center text-sm transition-colors"
              style={{
                borderColor: errors.cinema_id ? "rgba(239,68,68,0.6)" : cinemaIdFile ? "rgba(201,168,76,0.6)" : "rgba(255,255,255,0.15)",
                background: cinemaIdFile ? "rgba(201,168,76,0.05)" : "rgba(255,255,255,0.03)",
                color: cinemaIdFile ? "#C9A84C" : "rgba(255,255,255,0.4)",
              }}
            >
              {cinemaIdFile ? (
                <span>✅ {cinemaIdFile.name} ({(cinemaIdFile.size / 1024).toFixed(0)} KB)</span>
              ) : (
                <span>
                  📎 {fa ? "کلیک کنید یا فایل را اینجا رها کنید" : "Click to upload or drag & drop"}<br />
                  <span className="text-xs opacity-60">JPG, PNG, WebP {fa ? "یا" : "or"} PDF — {fa ? "حداکثر ۵ مگابایت" : "max 5MB"}</span>
                </span>
              )}
            </button>
            {cinemaIdPreview && (
              <div className="relative mt-3">
                <img src={cinemaIdPreview} alt="Cinema ID preview" className="max-h-40 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => { setCinemaIdFile(null); setCinemaIdPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white/70 hover:text-white"
                >✕ {fa ? "حذف" : "Remove"}</button>
              </div>
            )}
            {errors.cinema_id && <p className="mt-1.5 text-xs text-red-400">{errors.cinema_id}</p>}
          </div>

          {/* Notice */}
          <div className="rounded-xl p-4 text-xs leading-6" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(255,255,255,0.6)" }}>
            ⚠️ {fa
              ? "پس از ثبت‌نام، حساب شما «در انتظار تأیید» خواهد بود. دسترسی به پروفایل بازیگران پس از تأیید مدیر (معمولاً ظرف ۴۸ ساعت) فعال می‌شود."
              : "After registration your account will be 'Pending Approval'. Access to talent profiles is granted after admin approval, typically within 48 hours."}
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "…" : (fa ? "ثبت‌نام" : "Register")}
          </button>
          <p className="text-center text-sm text-white/50">
            {fa ? "حساب دارید؟ " : "Have an account? "}
            <Link href="/login?tab=creator" className="text-gold">{fa ? "ورود" : "Login"}</Link>
          </p>
        </form>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(139,26,26,0.2), rgba(201,168,76,0.1))", border: "1px solid rgba(201,168,76,0.25)" }}>
          <p className="font-display text-base font-semibold text-white mb-2">🎬 {fa ? "چرا کارت سینمایی نیاز است؟" : "Why is a Cinema Card required?"}</p>
          <p className="text-xs leading-6 text-white/60">
            {fa
              ? "برای حفاظت از بازیگران، فقط سازندگان تأییدشده می‌توانند به پروفایل‌ها دسترسی داشته باشند. این مانع از دسترسی افراد ناشناس و سوءاستفاده از اطلاعات تماس می‌شود."
              : "To protect talent, only verified filmmakers can access profiles. This prevents unauthorized access and misuse of contact information."}
          </p>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="font-display text-base font-semibold text-gold">{fa ? "فرآیند تأیید" : "Approval process"}</h2>
          {[
            { icon: "1️⃣", fa: "ثبت‌نام و بارگذاری کارت سینمایی", en: "Register and upload Cinema Card" },
            { icon: "2️⃣", fa: "بررسی مدارک توسط مدیر (تا ۴۸ ساعت)", en: "Admin reviews documents (up to 48h)" },
            { icon: "3️⃣", fa: "دریافت ایمیل تأیید و فعال‌سازی", en: "Receive approval email and activation" },
            { icon: "4️⃣", fa: "دسترسی کامل به جستجو و پروفایل‌ها", en: "Full access to search and profiles" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/60">
              <span className="shrink-0">{s.icon}</span>
              <span>{fa ? s.fa : s.en}</span>
            </div>
          ))}
        </div>

        <h2 className="font-display text-xl font-semibold text-gold">{fa ? "پلن‌های اشتراک" : "Subscription plans"}</h2>
        {CREATOR_PLANS.map((pl) => (
          <div key={pl.id} className="card p-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-semibold text-white">{pl.name}</span>
              <span className="badge-gold">{pl.price_toman ? `${pl.price_toman} ${fa ? "تومان" : "Toman"}` : (fa ? "قیمت در زمان عرضه" : "Pricing at launch")}</span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              {pl.contacts_per_month === "unlimited"
                ? (fa ? "تماس نامحدود با استعدادها در ماه" : "Unlimited talent contacts per month")
                : (fa ? `تا ${pl.contacts_per_month} تماس در ماه` : `Up to ${pl.contacts_per_month} contacts per month`)}
            </p>
          </div>
        ))}
        <p className="text-xs text-white/40">{fa ? "ثبت‌نام رایگان است؛ پلن را بعداً از داشبورد انتخاب کنید." : "Registration is free; choose a plan later from your dashboard."}</p>
      </div>
    </div>
  );
}
