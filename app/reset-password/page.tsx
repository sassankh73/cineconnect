"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "../providers";
import { dict } from "@/lib/i18n";
import { Field } from "@/components/fields";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

function ResetInner() {
  const { lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const invalidToken = !token;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(dict.errors.passwordMismatch[lang]);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, password_confirm: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message?.[lang] || dict.auth.resetExpired[lang]);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError(dict.errors.network[lang]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-cine flex min-h-[80vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-center font-display text-2xl font-bold text-white">
          {dict.auth.resetTitle[lang]}
        </h1>

        {done ? (
          <p className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-sm text-emerald-300">
            {dict.auth.resetSuccess[lang]}
          </p>
        ) : invalidToken ? (
          <div className="mt-8 rounded-lg border border-crimson/40 bg-crimson/10 p-5 text-center text-sm text-crimson-light">
            {dict.auth.resetExpired[lang]}
            <Link href="/forgot-password" className="mt-4 block w-full text-gold hover:text-gold-light">
              {dict.auth.requestNewLink[lang]} →
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label={dict.auth.newPassword[lang]} required>
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
              />
              <PasswordStrength password={password} />
            </Field>
            <Field label={dict.auth.confirmPassword[lang]} required>
              <PasswordInput
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                required
              />
            </Field>

            {error && (
              <p className="rounded-md border border-crimson/40 bg-crimson/10 px-3 py-2 text-sm text-crimson-light">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? dict.common.loading[lang] : dict.auth.resetCta[lang]}
            </button>
            <Link href="/login" className="block w-full text-center text-sm text-white/55 hover:text-gold">
              {dict.auth.backToLogin[lang]}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container-cine py-20 text-center text-white/50">…</div>}>
      <ResetInner />
    </Suspense>
  );
}
