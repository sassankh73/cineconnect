"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useLang } from "../providers";
import { dict } from "@/lib/i18n";
import { Field, TextInput } from "@/components/fields";

function LoginInner() {
  const { lang } = useLang();
  const { refresh } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get("tab") === "creator" ? "creator" : "player";

  const [tab, setTab] = useState<"player" | "creator">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: tab }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(dict.errors[(data.error as keyof typeof dict.errors)] ? dict.errors[data.error as keyof typeof dict.errors][lang] : dict.errors.loginFailed[lang]);
        return;
      }
      await refresh();
      const dest = data.role === "admin" ? "/admin" : data.role === "creator" ? "/dashboard/creator" : "/dashboard/player";
      router.push(dest);
    } catch {
      setError(dict.errors.network[lang]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-cine flex min-h-[80vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-center font-display text-2xl font-bold text-white">{dict.auth.loginTitle[lang]}</h1>

        {/* tabs */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-charcoal-800 p-1">
          {(["player", "creator"] as const).map((tk) => (
            <button
              key={tk}
              onClick={() => setTab(tk)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                tab === tk ? "bg-gold-sheen text-charcoal" : "text-white/65 hover:text-white"
              }`}
            >
              {tk === "player" ? dict.auth.tabPlayer[lang] : dict.auth.tabCreator[lang]}
            </button>
          ))}
        </div>

        {forgot ? (
          forgotSent ? (
            <div className="mt-8 rounded-lg border border-gold/30 bg-gold/5 p-5 text-center text-sm text-white/80">
              {lang === "fa"
                ? "اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی رمز ارسال شد."
                : "If this email exists, a password-reset link has been sent."}
              <button onClick={() => { setForgot(false); setForgotSent(false); }} className="mt-4 block w-full text-gold">
                {dict.auth.signIn[lang]} ←
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setForgotSent(true); }}
              className="mt-8 space-y-4"
            >
              <Field label={dict.common.email[lang]} required>
                <TextInput type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
              </Field>
              <button type="submit" className="btn-primary w-full">
                {lang === "fa" ? "ارسال لینک بازیابی" : "Send reset link"}
              </button>
              <button type="button" onClick={() => setForgot(false)} className="block w-full text-sm text-white/55 hover:text-white">
                {dict.common.cancel[lang]}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label={dict.common.email[lang]} required>
              <TextInput type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" required />
            </Field>
            <Field label={dict.common.password[lang]} required>
              <TextInput type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
            </Field>

            {error && (
              <p className="rounded-md border border-crimson/40 bg-crimson/10 px-3 py-2 text-sm text-crimson-light">{error}</p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? dict.common.loading[lang] : dict.auth.signIn[lang]}
            </button>

            <div className="flex items-center justify-between pt-2 text-sm">
              <button type="button" onClick={() => setForgot(true)} className="text-white/55 hover:text-gold">
                {dict.auth.forgot[lang]}
              </button>
              <Link
                href={tab === "creator" ? "/register/creator" : "/register/player"}
                className="text-gold hover:text-gold-light"
              >
                {dict.auth.noAccount[lang]}
              </Link>
            </div>
          </form>
        )}

        <p className="mt-6 border-t border-white/8 pt-4 text-center text-xs text-white/40">
          {lang === "fa"
            ? "ورود شما به‌منزله پذیرش قوانین و سیاست حریم خصوصی است."
            : "By signing in you accept our terms and privacy policy."}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-cine py-20 text-center text-white/50">…</div>}>
      <LoginInner />
    </Suspense>
  );
}
