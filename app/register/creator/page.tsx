"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useLang } from "@/app/providers";
import { Field, TextInput } from "@/components/fields";
import { isValidEmail, isStrongPassword } from "@/lib/validation";
import { CREATOR_PLANS } from "@/lib/constants";

export default function RegisterCreatorPage() {
  const { lang } = useLang();
  const { refresh } = useAuth();
  const router = useRouter();
  const fa = lang === "fa";

  const [f, setF] = useState({ full_name: "", company: "", role_title: "", email: "", password: "", password_confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.full_name.trim()) errs.full_name = fa ? "الزامی" : "Required";
    if (!isValidEmail(f.email)) errs.email = fa ? "ایمیل معتبر نیست" : "Invalid email";
    if (!isStrongPassword(f.password)) errs.password = fa ? "حداقل ۸ کاراکتر، حرف بزرگ، عدد و نماد" : "8+ chars, uppercase, number, symbol";
    if (f.password !== f.password_confirm) errs.password_confirm = fa ? "رمزها مطابقت ندارند" : "Passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/auth/register/creator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: f.email, password: f.password, full_name: f.full_name, company: f.company, role_title: f.role_title }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErrors({ email: d.error === "email_taken" ? (fa ? "این ایمیل قبلاً ثبت شده" : "Email taken") : (fa ? "خطا در ثبت‌نام" : "Failed") });
        return;
      }
      await refresh();
      router.push("/dashboard/creator");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-cine grid max-w-5xl gap-8 py-14 lg:grid-cols-2">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-bold text-white">{fa ? "ثبت‌نام سازنده فیلم" : "Register as Filmmaker"}</h1>
        <p className="mt-2 text-sm text-white/55">{fa ? "رایگان ثبت‌نام کنید و استعدادها را جستجو کنید." : "Register free and start browsing talent."}</p>
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
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "…" : (fa ? "ثبت‌نام" : "Register")}</button>
          <p className="text-center text-sm text-white/50">
            {fa ? "حساب دارید؟ " : "Have an account? "}
            <Link href="/login?tab=creator" className="text-gold">{fa ? "ورود" : "Login"}</Link>
          </p>
        </form>
      </div>

      <div className="space-y-4">
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
