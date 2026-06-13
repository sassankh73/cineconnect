// Welcome email — sent AFTER email verification completes. Bilingual (FA + EN).
import { renderBilingualEmail, renderBilingualText, type BilingualEmailInput } from "../layout";

export function welcomeEmail(params: { dashboardUrl: string; supportUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const data: BilingualEmailInput = {
    preheader: "حساب شما فعال شد — Your account is verified. Here's how to get started.",
    fa: {
      heading: "حساب شما فعال شد ✅",
      lines: [
        "ایمیل شما با موفقیت تأیید شد و اکنون به همه امکانات دسترسی دارید.",
        "گام‌های بعدی: ۱) پروفایل خود را کامل کنید  ۲) رسانه (عکس/ویدیو/رزومه) بارگذاری کنید  ۳) سطح خود را فعال کنید تا برای سازندگان دیده شوید.",
      ],
      button: { label: "ورود به داشبورد", url: params.dashboardUrl },
      muted: `سؤالی دارید؟ با پشتیبانی تماس بگیرید: ${params.supportUrl}`,
    },
    en: {
      heading: "Your account is active ✅",
      lines: [
        "Your email is verified and you now have full access.",
        "Next steps: 1) Complete your profile  2) Upload your media (photo/video/CV)  3) Activate your tier so filmmakers can discover you.",
      ],
      button: { label: "Go to dashboard", url: params.dashboardUrl },
      muted: `Questions? Contact support: ${params.supportUrl}`,
    },
  };
  return {
    subject: "به سینه‌کانکت خوش آمدید | Welcome to CineConnect",
    html: renderBilingualEmail(data),
    text: renderBilingualText(data),
  };
}
