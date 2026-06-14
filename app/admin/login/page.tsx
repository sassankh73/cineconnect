"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from "@/components/icons";

// ─── Admin Login Page ───────────────────────────────────────────────────────
// Dedicated entry-point for administrators.
// • No OAuth buttons — credentials-only.
// • Security question as 2FA step (server verifies answer hash).
// • Visual language is distinct from the public /login page.
// ────────────────────────────────────────────────────────────────────────────

type Step = "credentials" | "security_question";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [secQuestion, setSecQuestion] = useState("");
  const [secAnswer, setSecAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: credentials ─────────────────────────────────────────────────
  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "اطلاعات وارد شده نادرست است");
        return;
      }
<<<<<<< HEAD
      // If no security question configured, skip step 2 entirely
      if (!data.security_question) {
        const verifyRes = await fetch("/api/admin/login/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, security_answer: "" }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          setError(verifyData.error || "خطای احراز هویت");
          return;
        }
        router.push("/admin");
        return;
      }
      setSecQuestion(data.security_question);
=======
      // Server returns the security question for this admin user
      setSecQuestion(data.security_question || "");
>>>>>>> a5c16ff1ac5df596fa852aecc90308462fbd669e
      setStep("security_question");
    } catch {
      setError("خطای شبکه. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: security question 2FA ───────────────────────────────────────
  async function handleSecurityAnswer(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, security_answer: secAnswer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "پاسخ امنیتی نادرست است");
        return;
      }
      router.push("/admin");
    } catch {
      setError("خطای شبکه. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0a0f 0%, #0D0D0D 40%, #0d0d1a 100%)",
        direction: "rtl",
      }}
    >
      {/* ── Background grid lines (cinematic feel) ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Glow orbs ── */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139,26,26,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "rgba(26,26,46,0.85)",
            borderColor: "rgba(201,168,76,0.25)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 60px rgba(139,26,26,0.15), 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-8 gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #8B1A1A 0%, #C9A84C 100%)",
                boxShadow: "0 0 30px rgba(201,168,76,0.3)",
              }}
            >
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{ color: "#C9A84C" }}>
                ورود مدیر سیستم
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Admin Access — CineConnect
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6 justify-center">
            {(["credentials", "security_question"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    background:
                      step === s
                        ? "linear-gradient(135deg, #C9A84C, #8B1A1A)"
                        : s === "credentials" && step === "security_question"
                        ? "rgba(201,168,76,0.3)"
                        : "rgba(255,255,255,0.08)",
                    color:
                      step === s
                        ? "#fff"
                        : s === "credentials" && step === "security_question"
                        ? "#C9A84C"
                        : "rgba(255,255,255,0.3)",
                  }}
                >
                  {s === "credentials" && step === "security_question" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i === 0 && (
                  <div
                    className="w-8 h-0.5 rounded-full"
                    style={{
                      background:
                        step === "security_question"
                          ? "rgba(201,168,76,0.5)"
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(139,26,26,0.25)",
                  border: "1px solid rgba(139,26,26,0.5)",
                  color: "#f87171",
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 1: credentials ── */}
          <AnimatePresence mode="wait">
            {step === "credentials" && (
              <motion.form
                key="creds"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleCredentials}
                className="space-y-4"
              >
                {/* Email */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    ایمیل مدیر
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "rgba(201,168,76,0.5)" }}
                    />
                    <input
                      type="email"
                      required
                      autoFocus
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg px-4 pr-10 py-2.5 text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(201,168,76,0.2)",
                        color: "#fff",
                        direction: "ltr",
                      }}
                      placeholder="admin@cinepro.ir"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    رمز عبور
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "rgba(201,168,76,0.5)" }}
                    />
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg px-4 pr-10 pl-10 py-2.5 text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(201,168,76,0.2)",
                        color: "#fff",
                        direction: "ltr",
                      }}
                      placeholder="••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-3 text-sm font-semibold transition-all mt-2"
                  style={{
                    background: loading
                      ? "rgba(201,168,76,0.3)"
                      : "linear-gradient(135deg, #C9A84C 0%, #8B1A1A 100%)",
                    color: "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "در حال تأیید…" : "ادامه"}
                </button>
              </motion.form>
            )}

            {/* ── Step 2: security question ── */}
            {step === "security_question" && (
              <motion.form
                key="secq"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSecurityAnswer}
                className="space-y-4"
              >
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: "rgba(201,168,76,0.7)" }}>
                    سؤال امنیتی
                  </p>
                  {secQuestion || "لطفاً به سؤال امنیتی خود پاسخ دهید"}
                </div>

                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    پاسخ امنیتی
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "rgba(201,168,76,0.5)" }}
                    />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={secAnswer}
                      onChange={(e) => setSecAnswer(e.target.value)}
                      className="w-full rounded-lg px-4 pr-10 py-2.5 text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(201,168,76,0.2)",
                        color: "#fff",
                      }}
                      placeholder="پاسخ خود را بنویسید…"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep("credentials"); setError(""); setSecAnswer(""); }}
                    className="flex-1 rounded-lg py-3 text-sm font-medium transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] rounded-lg py-3 text-sm font-semibold transition-all"
                    style={{
                      background: loading
                        ? "rgba(201,168,76,0.3)"
                        : "linear-gradient(135deg, #C9A84C 0%, #8B1A1A 100%)",
                      color: "#fff",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "در حال تأیید…" : "ورود به پنل مدیریت"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            این صفحه فقط برای مدیران سیستم است. دسترسی غیرمجاز گزارش می‌شود.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
