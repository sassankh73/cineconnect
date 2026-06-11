"use client";

import { useState } from "react";
import { useLang } from "../providers";
import { Reveal } from "@/components/Reveal";

// FAQ accordion — categories per spec: Registration, Payment, For Creators, Technical, Privacy.
const FAQ = [
  {
    cat: { fa: "ثبت‌نام", en: "Registration" },
    items: [
      { q: { fa: "چطور به عنوان بازیگر ثبت‌نام کنم؟", en: "How do I register as talent?" }, a: { fa: "روی «ثبت‌نام بازیگر / عوامل» کلیک کنید و فرم پنج‌مرحله‌ای را تکمیل کنید: اطلاعات حساب، اطلاعات حرفه‌ای، بارگذاری رسانه، انتخاب سطح و پرداخت، و تأیید.", en: "Click 'Register as Talent' and complete the 5-step wizard: account info, professional info, media uploads, tier & payment, and confirmation." } },
      { q: { fa: "آیا می‌توانم بعداً اطلاعاتم را ویرایش کنم؟", en: "Can I edit my info later?" }, a: { fa: "بله، از داشبورد بازیگر می‌توانید همه فیلدها و رسانه‌ها را ویرایش یا جایگزین کنید.", en: "Yes — from your player dashboard you can edit any field and replace media." } },
    ],
  },
  {
    cat: { fa: "پرداخت", en: "Payment" },
    items: [
      { q: { fa: "هزینه ثبت‌نام چقدر است؟", en: "What is the registration fee?" }, a: { fa: "بسته به سطح تجربه: تازه‌کار ۵۰٬۰۰۰، آموزش‌دیده ۱۰۰٬۰۰۰، حرفه‌ای ۱۵۰٬۰۰۰ و بسیار حرفه‌ای ۲۰۰٬۰۰۰ تومان. اعتبار پروفایل ۱۲ ماه است.", en: "Depending on tier: Tier 1 50,000; Tier 2 100,000; Tier 3 150,000; Tier 4 200,000 Toman. Profiles are valid for 12 months." } },
      { q: { fa: "کارت به کارت را چطور تأیید می‌کنید؟", en: "How is bank transfer confirmed?" }, a: { fa: "تصویر رسید را بارگذاری می‌کنید و مدیر حداکثر تا ۲۴ ساعت آن را به‌صورت دستی تأیید می‌کند. پروفایل تا تأیید پرداخت نمایش داده نمی‌شود.", en: "Upload your receipt image and an admin confirms it manually within 24 hours. Profiles stay hidden until payment is confirmed." } },
    ],
  },
  {
    cat: { fa: "برای سازندگان", en: "For Creators" },
    items: [
      { q: { fa: "چطور با یک بازیگر تماس بگیرم؟", en: "How do I contact a talent?" }, a: { fa: "از دکمه «تماس با این استعداد» در پروفایل استفاده کنید. شماره تماس فقط پس از ارسال درخواست تماس برای شما باز می‌شود.", en: "Use the 'Contact this talent' button on the profile. The phone number unlocks only after you send a contact request." } },
      { q: { fa: "محدودیت تماس چقدر است؟", en: "What are the contact limits?" }, a: { fa: "پلن Basic تا ۱۰ تماس در ماه و پلن Pro تماس نامحدود دارد.", en: "The Basic plan allows up to 10 contacts/month; Pro is unlimited." } },
    ],
  },
  {
    cat: { fa: "فنی", en: "Technical" },
    items: [
      { q: { fa: "محدودیت حجم فایل‌ها چیست؟", en: "What are the file size limits?" }, a: { fa: "عکس پروفایل و گالری تا ۵ مگابایت، ویدیو رزومه تا ۵۰۰ مگابایت (حداکثر ۳ دقیقه)، نمونه صدا تا ۲۰ مگابایت و رزومه PDF تا ۱۰ مگابایت.", en: "Photos up to 5MB, video reel up to 500MB (max 3 min), voice sample up to 20MB, CV PDF up to 10MB." } },
    ],
  },
  {
    cat: { fa: "حریم خصوصی", en: "Privacy" },
    items: [
      { q: { fa: "آیا کد ملی من نمایش داده می‌شود؟", en: "Is my National ID displayed?" }, a: { fa: "خیر. کد ملی رمزنگاری‌شده ذخیره می‌شود و هرگز در هیچ صفحه یا پاسخی نمایش داده نمی‌شود.", en: "No. Your National ID is stored encrypted and is never displayed anywhere." } },
      { q: { fa: "شماره تماسم برای چه کسانی دیده می‌شود؟", en: "Who can see my phone number?" }, a: { fa: "شماره تماس شما تا زمانی که یک سازنده درخواست تماس ارسال نکرده، پنهان است.", en: "Your phone is hidden until a creator sends you a contact request." } },
    ],
  },
];

export default function FAQPage() {
  const { lang } = useLang();
  const [open, setOpen] = useState<string | null>("0-0");

  return (
    <div className="container-cine py-16">
      <Reveal>
        <p className="eyebrow">{lang === "fa" ? "سوالات متداول" : "FAQ"}</p>
        <h1 className="section-title">{lang === "fa" ? "پاسخ پرسش‌های شما" : "Your questions answered"}</h1>
      </Reveal>

      <div className="mt-10 space-y-10">
        {FAQ.map((group, gi) => (
          <Reveal key={gi} delay={0.05 * gi}>
            <h2 className="mb-4 font-display text-xl font-semibold text-gold">{group.cat[lang]}</h2>
            <div className="space-y-3">
              {group.items.map((item, ii) => {
                const id = `${gi}-${ii}`;
                const isOpen = open === id;
                return (
                  <div key={id} className="card overflow-hidden">
                    <button
                      onClick={() => setOpen(isOpen ? null : id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-medium text-white">{item.q[lang]}</span>
                      <span className={`text-gold transition-transform ${isOpen ? "rotate-45" : ""}`}>＋</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-white/8 px-5 py-4 text-sm leading-7 text-white/65">
                        {item.a[lang]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
