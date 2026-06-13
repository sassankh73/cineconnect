"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "../providers";
import { dict } from "@/lib/i18n";
import { Field, TextInput } from "@/components/fields";

export default function ForgotPasswordPage() {
  const { lang } = useLang();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Always succeeds from the UI's perspective — the server never reveals
      // whether the email exists.
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-cine flex min-h-[80vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-center font-display text-2xl font-bold text-white">
          {dict.auth.forgotTitle[lang]}
        </h1>

        {sent ? (
          <div className="mt-8 rounded-lg border border-gold/30 bg-gold/5 p-5 text-center text-sm text-white/80">
            {dict.auth.forgotSent[lang]}
            <Link href="/login" className="mt-4 block w-full text-gold hover:text-gold-light">
              {dict.auth.backToLogin[lang]} →
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-center text-sm text-white/55">{dict.auth.forgotDesc[lang]}</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <Field label={dict.common.email[lang]} required>
                <TextInput
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? dict.common.loading[lang] : dict.auth.sendResetLink[lang]}
              </button>
              <Link
                href="/login"
                className="block w-full text-center text-sm text-white/55 hover:text-gold"
              >
                {dict.auth.backToLogin[lang]}
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
