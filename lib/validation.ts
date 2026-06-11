import { UPLOAD_LIMITS, type UploadKind } from "./constants";

// Password rule (spec step_1): min 8 chars, 1 uppercase, 1 number, 1 symbol
export const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NATIONAL_ID_RE = /^\d{10}$/;

export function isValidEmail(v: string) {
  return EMAIL_RE.test(v.trim());
}
export function isStrongPassword(v: string) {
  return PASSWORD_RE.test(v);
}
export function isValidNationalId(v: string) {
  // 10 digits + Iranian national-ID checksum
  if (!NATIONAL_ID_RE.test(v)) return false;
  const digits = v.split("").map(Number);
  if (new Set(digits).size === 1) return false; // all-same is invalid
  const check = digits[9];
  const sum = digits.slice(0, 9).reduce((acc, d, i) => acc + d * (10 - i), 0);
  const r = sum % 11;
  return r < 2 ? check === r : check === 11 - r;
}

// File validation usable on client (pre-upload) AND server (post-upload).
export function validateFile(
  kind: UploadKind,
  file: { size: number; name: string; type?: string }
): { ok: true } | { ok: false; reason: "size" | "type" } {
  const limit = UPLOAD_LIMITS[kind];
  const maxBytes = limit.max_mb * 1024 * 1024;
  if (file.size > maxBytes) return { ok: false, reason: "size" };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!limit.formats.includes(ext as never)) return { ok: false, reason: "type" };
  return { ok: true };
}

export function ageFromDob(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
