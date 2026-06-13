// ---------------------------------------------------------------------------
// Zod schemas for every auth request body. Routes parse with these BEFORE any
// processing (spec: input_validation.library = zod, validate all request bodies).
//
// On failure, routes return a stable error *key* (e.g. "passwordWeak") that the
// bilingual dictionary (lib/i18n.ts → dict.errors) maps to FA + EN messages.
// ---------------------------------------------------------------------------

import { z } from "zod";

// Strip HTML-ish angle brackets from free-text inputs (spec: sanitize text inputs).
const sanitized = (max: number) =>
  z.string().trim().max(max).transform((s) => s.replace(/[<>]/g, ""));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(255);

// min 8 chars + 1 upper + 1 lower + 1 number + 1 symbol
export const passwordSchema = z
  .string()
  .min(8)
  .max(200)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/\d/)
  .regex(/[^A-Za-z0-9]/);

export const registerAccountSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  password_confirm: z.string(),
  full_name_persian: sanitized(255).optional(),
  full_name_latin: sanitized(255).optional(),
  role: z.enum(["player", "creator"]).default("player"),
}).refine((d) => d.password === d.password_confirm, {
  message: "passwordMismatch",
  path: ["password_confirm"],
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
  remember_me: z.boolean().optional().default(false),
  role: z.enum(["player", "creator", "admin"]).optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16).max(200),
  password: passwordSchema,
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: "passwordMismatch",
  path: ["password_confirm"],
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: passwordSchema,
  new_password_confirm: z.string(),
}).refine((d) => d.new_password === d.new_password_confirm, {
  message: "passwordMismatch",
  path: ["new_password_confirm"],
});

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(16).max(200),
});

// Map a ZodError to the single most relevant dictionary error key.
export function firstErrorKey(err: z.ZodError, fallback = "validation"): string {
  const issue = err.issues[0];
  if (!issue) return fallback;
  // Custom refine messages carry the dictionary key directly.
  if (issue.message && /^[a-zA-Z]+$/.test(issue.message) && issue.message !== "Required") {
    if (issue.message in KNOWN_KEYS) return issue.message;
  }
  const path = String(issue.path[0] ?? "");
  if (path.includes("email")) return "emailInvalid";
  if (path.includes("password")) return "passwordWeak";
  return fallback;
}

const KNOWN_KEYS: Record<string, true> = {
  passwordMismatch: true,
  passwordWeak: true,
  emailInvalid: true,
  validation: true,
};
