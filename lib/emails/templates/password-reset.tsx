// Password reset link — sent on forgot-password. Bilingual (FA + EN).
import { renderBilingualEmail, renderBilingualText, type BilingualEmailInput } from "../layout";

export function passwordResetEmail(params: { resetUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const data: BilingualEmailInput = {
    preheader: "بازنشانی رمز عبور — Reset your password (link expires in 1 hour)",
    fa: {
      heading: "بازنشانی رمز عبور",
      lines: [
        "درخواست بازنشانی رمز عبور برای حساب شما دریافت شد. برای انتخاب رمز جدید روی دکمه زیر کلیک کنید.",
        "این لینک تا ۱ ساعت معتبر است.",
      ],
      button: { label: "بازنشانی رمز عبور", url: params.resetUrl },
      muted:
        "اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید و در صورت نگرانی رمز عبور خود را تغییر دهید.",
    },
    en: {
      heading: "Reset your password",
      lines: [
        "We received a request to reset the password for your account. Click the button below to choose a new one.",
        "This link expires in 1 hour.",
      ],
      button: { label: "Reset password", url: params.resetUrl },
      muted:
        "If you didn't request this, ignore this email — and consider changing your password if you're concerned.",
    },
  };
  return {
    subject: "بازنشانی رمز عبور سینه‌کانکت | Reset your CineConnect password",
    html: renderBilingualEmail(data),
    text: renderBilingualText(data),
  };
}
