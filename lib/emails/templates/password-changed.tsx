// Security alert — sent after a successful password change OR reset. Bilingual.
import { renderBilingualEmail, renderBilingualText, type BilingualEmailInput } from "../layout";

export function passwordChangedEmail(params: {
  whenFa: string;
  whenEn: string;
  ip: string;
  supportUrl: string;
}): { subject: string; html: string; text: string } {
  const data: BilingualEmailInput = {
    preheader: "رمز عبور شما تغییر کرد — Your password was changed",
    fa: {
      heading: "رمز عبور شما تغییر کرد 🔒",
      lines: [
        "رمز عبور حساب کاربری شما با موفقیت تغییر کرد.",
        `زمان: ${params.whenFa}`,
        `نشانی IP: ${params.ip}`,
        "به‌منظور امنیت، تمام نشست‌های دیگر از سیستم خارج شدند.",
      ],
      muted: `اگر این تغییر کار شما نبوده است، فوراً با پشتیبانی تماس بگیرید: ${params.supportUrl}`,
    },
    en: {
      heading: "Your password was changed 🔒",
      lines: [
        "The password for your account was changed successfully.",
        `Time: ${params.whenEn}`,
        `IP address: ${params.ip}`,
        "For your security, all other sessions were signed out.",
      ],
      muted: `If this wasn't you, contact support immediately: ${params.supportUrl}`,
    },
  };
  return {
    subject: "رمز عبور شما تغییر کرد | Your CineConnect password was changed",
    html: renderBilingualEmail(data),
    text: renderBilingualText(data),
  };
}
