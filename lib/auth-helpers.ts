// ---------------------------------------------------------------------------
// Stateless auth helpers: secure token generation, hashing, and password-strength
// scoring. Shared by the verification, password-reset and session flows.
//
// Spec (security_requirements):
//   token_generation: crypto.randomBytes(32).toString('hex')
//   token_storage:    store ONLY the SHA-256 hash of a token — never the plain token
// ---------------------------------------------------------------------------

import crypto from "crypto";

// 32 random bytes → 64-char hex string. This is the value emailed to the user.
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// SHA-256 hash of a token — this is what we persist and compare against.
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Constant-time comparison of two hex token hashes.
export function tokensMatch(aHashHex: string | undefined, bHashHex: string | undefined): boolean {
  if (!aHashHex || !bHashHex) return false;
  const a = Buffer.from(aHashHex, "hex");
  const b = Buffer.from(bHashHex, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isExpired(iso: string | undefined): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) || t < Date.now();
}

export function isoIn(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

export const HOUR = 60 * 60 * 1000;
export const MINUTE = 60 * 1000;
export const DAY = 24 * HOUR;

// ---------------- Password strength (0..4) ----------------
// Drives the registration / change-password strength bar AND a server-side floor.
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  hasMin: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export function scorePassword(pw: string): PasswordStrength {
  const hasMin = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  let score = 0;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;
  // length bonus / penalty
  if (pw.length >= 12 && score === 4) score = 4;
  if (!hasMin) score = Math.min(score, 1) as 0 | 1;

  return {
    score: Math.max(0, Math.min(4, score)) as PasswordStrength["score"],
    hasMin,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
  };
}

// Server-side policy: min 8 chars + 1 upper + 1 lower + 1 number + 1 symbol.
export function passwordMeetsPolicy(pw: string): boolean {
  const s = scorePassword(pw);
  return s.hasMin && s.hasUpper && s.hasLower && s.hasNumber && s.hasSymbol;
}

// UTC date key (YYYY-MM-DD) — used to bucket the per-day verification resend limit.
export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
