// Email-verification issuance + resend throttling.
// Spec: token_expiry 24h · resend_cooldown 2 min · resend_max_per_day 5.

import { mutate } from "./db";
import type { User } from "./types";
import { generateToken, hashToken, isoIn, DAY, MINUTE, utcDayKey } from "./auth-helpers";
import { sendEmail } from "./email";
import { verificationEmail } from "./emails/templates/verification";

const RESEND_COOLDOWN_MS = 2 * MINUTE;
const RESEND_MAX_PER_DAY = 5;

export type ResendCheck =
  | { allowed: true }
  | { allowed: false; reason: "verificationCooldown" | "verificationLimit"; retryAfter?: number };

// Is the user allowed to (re)send a verification email right now?
export function resendStatus(user: User): ResendCheck {
  if (user.verification_last_sent_at) {
    const since = Date.now() - new Date(user.verification_last_sent_at).getTime();
    if (since < RESEND_COOLDOWN_MS) {
      return {
        allowed: false,
        reason: "verificationCooldown",
        retryAfter: Math.ceil((RESEND_COOLDOWN_MS - since) / 1000),
      };
    }
  }
  const today = utcDayKey();
  const count = user.verification_resend_day === today ? user.verification_resend_count ?? 0 : 0;
  if (count >= RESEND_MAX_PER_DAY) {
    return { allowed: false, reason: "verificationLimit" };
  }
  return { allowed: true };
}

// Generate a fresh token, persist its HASH + expiry, update resend bookkeeping,
// and email the link. `countAsResend` is false for the initial post-register send.
export async function issueAndSendVerification(opts: {
  userId: string;
  email: string;
  base: string;
  countAsResend: boolean;
}): Promise<void> {
  const token = generateToken();
  const today = utcDayKey();

  await mutate((db) => {
    const u = db.users.find((x) => x.id === opts.userId);
    if (!u) return;
    u.verification_token = hashToken(token);
    u.verification_token_expiry = isoIn(DAY); // 24 hours
    u.verification_last_sent_at = new Date().toISOString();
    if (opts.countAsResend) {
      const prev = u.verification_resend_day === today ? u.verification_resend_count ?? 0 : 0;
      u.verification_resend_count = prev + 1;
      u.verification_resend_day = today;
    }
    u.updated_at = new Date().toISOString();
  });

  const verifyUrl = `${opts.base}/verify-email?token=${token}`;
  await sendEmail({ to: opts.email, ...verificationEmail({ verifyUrl }) });
}

export const VERIFICATION_LIMITS = {
  cooldownSeconds: RESEND_COOLDOWN_MS / 1000,
  maxPerDay: RESEND_MAX_PER_DAY,
  expiryHours: 24,
};
