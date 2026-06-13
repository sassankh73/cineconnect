// Email verification — sent immediately after registration. Bilingual (FA + EN).
import { renderBilingualEmail, renderBilingualText, type BilingualEmailInput } from "../layout";

export function verificationEmail(params: { verifyUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const data: BilingualEmailInput = {
    preheader: "ایمیل خود را تأیید کنید — Verify your email to activate your account",
    fa: {
      heading: "به سینه‌کانکت خوش آمدید 🎬",
      lines: [
        "از ثبت‌نام شما سپاسگزاریم. برای فعال‌سازی حساب، لطفاً ایمیل خود را تأیید کنید.",
        "این لینک تا ۲۴ ساعت معتبر است.",
      ],
      button: { label: "تأیید ایمیل", url: params.verifyUrl },
      muted: "اگر شما این حساب را ایجاد نکرده‌اید، این ایمیل را نادیده بگیرید.",
    },
    en: {
      heading: "Welcome to CineConnect 🎬",
      lines: [
        "Thanks for registering. Please verify your email address to activate your account.",
        "This link expires in 24 hours.",
      ],
      button: { label: "Verify email", url: params.verifyUrl },
      muted: "If you didn't create this account, you can safely ignore this email.",
    },
  };
  return {
    subject: "تأیید ایمیل حساب کاربری شما در سینه‌کانکت | Verify your CineConnect email address",
    html: renderBilingualEmail(data),
    text: renderBilingualText(data),
  };
}
