"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useLang } from "../providers";
import { dict } from "@/lib/i18n";

type State = "verifying" | "success" | "error";

function VerifyInner() {
  const { lang } = useLang();
  const router = useRouter();
  const { refresh } = useAuth();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [state, setState] = useState<State>("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against double-invoke in dev StrictMode
    ran.current = true;

    if (!token) {
      setState("error");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setState("success");
          await refresh(); // clears the unverified banner if signed in
          setTimeout(() => router.push(data.dashboard || "/login"), 3000);
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    })();
  }, [token, router, refresh]);

  return (
    <div className="container-cine flex min-h-[80vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 text-center">
        {state === "verifying" && (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-gold" />
            <p className="text-white/80">{dict.auth.verifying[lang]}</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto mb-4 text-4xl">✅</div>
            <h1 className="font-display text-xl font-bold text-white">{dict.brand[lang]}</h1>
            <p className="mt-3 text-sm text-emerald-300">{dict.auth.verifySuccess[lang]}</p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto mb-4 text-4xl">⚠️</div>
            <p className="text-sm text-crimson-light">{dict.auth.verifyError[lang]}</p>
            <ResendButton />
            <Link
              href="/login"
              className="mt-4 block w-full text-center text-sm text-white/55 hover:text-gold"
            >
              {dict.auth.backToLogin[lang]}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function ResendButton() {
  const { lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function resend() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? dict.auth.resent[lang] : data?.message?.[lang] || dict.errors.notAuthenticated[lang]);
    } catch {
      setMsg(dict.errors.network[lang]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      <button onClick={resend} disabled={busy} className="btn-primary w-full">
        {busy ? dict.common.loading[lang] : dict.auth.resendVerification[lang]}
      </button>
      {msg && <p className="mt-2 text-xs text-white/60">{msg}</p>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="container-cine py-20 text-center text-white/50">…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
