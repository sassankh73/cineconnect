"use client";

import { useEffect, useState } from "react";
import { useAuth, useLang } from "@/app/providers";
import { dict } from "@/lib/i18n";

// Dashboard banner shown to users whose email isn't verified yet. Offers a
// resend button with a live cooldown countdown.
export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  if (!user || user.emailVerified) return null;

  async function resend() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent(true);
        setCooldown(data.cooldownSeconds || 120);
      } else {
        setError(data?.message?.[lang] || dict.errors.network[lang]);
        if (data?.retryAfter) setCooldown(data.retryAfter);
      }
    } catch {
      setError(dict.errors.network[lang]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-lg">✉️</span>
        <div>
          <p className="text-sm text-white/90">{dict.auth.bannerUnverified[lang]}</p>
          {sent && <p className="mt-1 text-xs text-gold">{dict.auth.resent[lang]}</p>}
          {error && <p className="mt-1 text-xs text-crimson-light">{error}</p>}
        </div>
      </div>
      <button
        onClick={resend}
        disabled={busy || cooldown > 0}
        className="btn-primary btn-sm mt-3 whitespace-nowrap disabled:opacity-50 sm:mt-0"
      >
        {cooldown > 0
          ? `${dict.auth.resendCooldown[lang]} ${cooldown}s`
          : busy
            ? dict.common.loading[lang]
            : dict.auth.bannerResend[lang]}
      </button>
    </div>
  );
}
