"use client";

import { useLang } from "@/app/providers";

// Visual password-strength bar shown on registration + change/reset password.
// Scoring is inlined (client-safe) and mirrors lib/auth-helpers.scorePassword.
function score(pw: string): number {
  let s = 0;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length < 8) s = Math.min(s, 1);
  return s;
}

const LABELS: { fa: string; en: string }[] = [
  { fa: "خیلی ضعیف", en: "Very weak" },
  { fa: "ضعیف", en: "Weak" },
  { fa: "متوسط", en: "Fair" },
  { fa: "خوب", en: "Good" },
  { fa: "قوی", en: "Strong" },
];

const COLORS = ["#8B1A1A", "#b45309", "#C9A84C", "#65a30d", "#16a34a"];

export function PasswordStrength({ password }: { password: string }) {
  const { lang } = useLang();
  if (!password) return null;
  const s = score(password);
  const label = LABELS[s] ?? LABELS[0];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: i < s ? COLORS[s] : "rgba(255,255,255,0.12)" }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color: COLORS[s] }}>
        {label[lang]}
      </p>
    </div>
  );
}
