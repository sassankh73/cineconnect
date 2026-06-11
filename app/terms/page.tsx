"use client";

import { useLang } from "../providers";
import { Reveal } from "@/components/Reveal";

export default function TermsPage() {
  const { lang } = useLang();
  const fa = lang === "fa";

  const sections = [
    { t: fa ? "۱. پذیرش قوانین" : "1. Acceptance of terms", b: fa ? "با ثبت‌نام و استفاده از سینه‌کانکت، شما این قوانین و سیاست حریم خصوصی را می‌پذیرید." : "By registering and using CineConnect you accept these terms and the privacy policy." },
    { t: fa ? "۲. حساب کاربری" : "2. Accounts", b: fa ? "شما مسئول حفظ امنیت رمز عبور و اطلاعات حساب خود هستید. اطلاعات ارائه‌شده باید صحیح باشد." : "You are responsible for keeping your password and account secure. Provided information must be accurate." },
    { t: fa ? "۳. پرداخت و اعتبار" : "3. Payment & validity", b: fa ? "پروفایل پس از تأیید پرداخت فعال می‌شود و اعتبار آن ۱۲ ماه است. تمدید با نرخ تخفیف‌دار انجام می‌شود." : "Profiles activate after payment confirmation and remain valid for 12 months. Renewal is offered at a discounted rate." },
    { t: fa ? "۴. حریم خصوصی" : "4. Privacy", b: fa ? "کد ملی رمزنگاری می‌شود و هرگز نمایش داده نمی‌شود. شماره تماس تا ارسال درخواست تماس پنهان است. این پلتفرم مطابق GDPR و قوانین حریم خصوصی ایران عمل می‌کند." : "National ID is encrypted and never displayed. Phone numbers stay hidden until a contact request. The platform complies with GDPR and Iranian data-privacy law." },
    { t: fa ? "۵. رفتار کاربران" : "5. Conduct", b: fa ? "هرگونه محتوای نامناسب یا سوءاستفاده ممکن است منجر به تعلیق فوری حساب توسط مدیر شود." : "Inappropriate content or misuse may lead to immediate account suspension by an administrator." },
  ];

  return (
    <div className="container-cine py-16">
      <Reveal>
        <p className="eyebrow">{fa ? "قوانین و مقررات" : "Terms"}</p>
        <h1 className="section-title">{fa ? "قوانین و مقررات استفاده" : "Terms of Service"}</h1>
        <p className="mt-3 text-sm text-white/45">{fa ? "آخرین به‌روزرسانی: ۱۴۰۵" : "Last updated: 2026"}</p>
      </Reveal>
      <div className="card mt-8 space-y-6 p-8">
        {sections.map((s) => (
          <div key={s.t}>
            <h3 className="font-display text-lg font-semibold text-gold">{s.t}</h3>
            <p className="mt-1.5 text-sm leading-7 text-white/70">{s.b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
