"use client";

import { useState } from "react";
import { useLang } from "../providers";
import { Reveal } from "@/components/Reveal";

const FAQ = [
  {
    cat: { fa: "ثبت‌نام و حساب کاربری", en: "Registration & Account" },
    items: [
      {
        q: { fa: "چطور به عنوان بازیگر یا عوامل فیلم ثبت‌نام کنم؟", en: "How do I register as talent or crew?" },
        a: { fa: "روی «ثبت‌نام بازیگر / عوامل» کلیک کنید و فرم پنج‌مرحله‌ای را تکمیل کنید: اطلاعات حساب، اطلاعات حرفه‌ای، بارگذاری رسانه (عکس، ویدیو رزومه، نمونه صدا)، انتخاب سطح و پرداخت، و تأیید نهایی. کل فرآیند معمولاً ۱۵ تا ۲۰ دقیقه طول می‌کشد.", en: "Click 'Register as Talent / Crew' and complete the 5-step wizard: account info, professional details, media uploads (photo, video reel, voice sample), tier & payment, and final confirmation. The whole process takes about 15–20 minutes." },
      },
      {
        q: { fa: "آیا می‌توانم بعداً اطلاعاتم را ویرایش کنم؟", en: "Can I update my profile later?" },
        a: { fa: "بله، از داشبورد بازیگر می‌توانید همه فیلدها — از جمله عکس، بیوگرافی، مهارت‌ها و رزومه — را هر زمان ویرایش کنید. تغییرات بلافاصله اعمال می‌شود.", en: "Yes — from your player dashboard you can edit any field including photos, bio, skills and resume at any time. Changes apply immediately." },
      },
      {
        q: { fa: "چه تخصص‌هایی می‌توانند در سینه‌کانکت ثبت‌نام کنند؟", en: "Which professions can register on CineConnect?" },
        a: { fa: "هر تخصصی که در پشت یا جلوی دوربین کار می‌کند: بازیگر (زن/مرد)، فیلمبردار، تدوینگر، طراح صدا، دوبلور، بدلکار، طراح لباس، فیلمنامه‌نویس، دستیار کارگردان و ده‌ها حرفه دیگر.", en: "Any craft in front of or behind the camera: actors (male/female), cinematographers, editors, sound designers, voice actors, stunt performers, costume designers, screenwriters, assistant directors, and dozens more." },
      },
      {
        q: { fa: "اگر رمز عبورم را فراموش کردم چه کار کنم؟", en: "What if I forget my password?" },
        a: { fa: "از صفحه ورود روی «فراموشی رمز عبور» کلیک کنید. ایمیل بازنشانی به آدرس ثبت‌شده‌تان ارسال می‌شود. لینک بازنشانی ۱۵ دقیقه اعتبار دارد و تک‌بار مصرف است.", en: "Click 'Forgot password' on the login page. A reset link is sent to your registered email. The link is valid for 15 minutes and single-use." },
      },
    ],
  },
  {
    cat: { fa: "پرداخت و سطوح", en: "Payment & Tiers" },
    items: [
      {
        q: { fa: "هزینه ثبت‌نام بازیگر چقدر است؟", en: "How much does talent registration cost?" },
        a: { fa: "هزینه بر اساس سطح تجربه متفاوت است: تازه‌کار (سطح ۱) ۵۰٬۰۰۰ تومان، آموزش‌دیده (سطح ۲) ۱۰۰٬۰۰۰ تومان، حرفه‌ای (سطح ۳) ۱۵۰٬۰۰۰ تومان و بسیار حرفه‌ای (سطح ۴) ۲۰۰٬۰۰۰ تومان. اعتبار پروفایل ۱۲ ماه است.", en: "Fees vary by experience tier: Tier 1 (Beginner) 50,000 Toman; Tier 2 (Trained) 100,000; Tier 3 (Professional) 150,000; Tier 4 (Elite) 200,000 Toman. All profiles are valid for 12 months." },
      },
      {
        q: { fa: "روش‌های پرداخت چیست؟", en: "What payment methods are accepted?" },
        a: { fa: "در حال حاضر پرداخت از طریق کارت به کارت انجام می‌شود. شما تصویر رسید واریزی را بارگذاری می‌کنید و مدیر حداکثر تا ۲۴ ساعت آن را تأیید می‌کند. درگاه پرداخت آنلاین به‌زودی اضافه خواهد شد.", en: "Currently via bank transfer (card-to-card). You upload your receipt image and an admin confirms it within 24 hours. An online payment gateway is coming soon." },
      },
      {
        q: { fa: "پروفایلم چه زمانی فعال و قابل مشاهده می‌شود؟", en: "When does my profile go live?" },
        a: { fa: "پروفایل شما بلافاصله پس از تأیید پرداخت توسط مدیر در نتایج جستجو نمایش داده می‌شود. تأیید معمولاً ظرف ۲۴ ساعت انجام می‌شود و از طریق ایمیل اطلاع‌رسانی خواهید شد.", en: "Your profile appears in search results immediately after an admin confirms your payment. Confirmation typically happens within 24 hours and you'll receive an email notification." },
      },
      {
        q: { fa: "آیا امکان استرداد هزینه وجود دارد؟", en: "Is there a refund policy?" },
        a: { fa: "اگر پرداخت شما هنوز تأیید نشده باشد، استرداد کامل انجام می‌شود. برای پروفایل‌های فعال، در صورت نقص فنی از سمت پلتفرم، استرداد نسبی بررسی می‌شود. با تیم پشتیبانی تماس بگیرید.", en: "If your payment hasn't been confirmed yet, a full refund is issued. For active profiles, partial refunds are reviewed only in cases of platform-side technical failure. Contact support to initiate." },
      },
    ],
  },
  {
    cat: { fa: "برای سازندگان فیلم", en: "For Filmmakers / Creators" },
    items: [
      {
        q: { fa: "برای ثبت‌نام به عنوان سازنده چه مدارکی نیاز است؟", en: "What documents do I need to register as a creator?" },
        a: { fa: "برای تأیید هویت و صلاحیت، باید تصویر کارت سینمایی (کارت عضویت خانه سینما یا مجوز معتبر تهیه‌کنندگی / کارگردانی) را در هنگام ثبت‌نام بارگذاری کنید. حساب شما پس از بررسی و تأیید توسط مدیر فعال می‌شود.", en: "To verify your identity and credentials, you must upload your Cinema Card (Cinema House membership card or a valid production/directing license) during registration. Your account is activated after admin review." },
      },
      {
        q: { fa: "تا تأیید حسابم چه امکاناتی دارم؟", en: "What can I do while waiting for account approval?" },
        a: { fa: "پس از ثبت‌نام، حساب شما در وضعیت «در انتظار تأیید» قرار می‌گیرد. تا تأیید مدیر، امکان مشاهده پروفایل بازیگران وجود ندارد. معمولاً ظرف ۴۸ ساعت بررسی انجام می‌شود.", en: "After registration your account enters 'Pending Approval' status. You cannot view talent profiles until admin approval, which typically takes up to 48 hours." },
      },
      {
        q: { fa: "چطور با یک بازیگر تماس بگیرم؟", en: "How do I contact a talent?" },
        a: { fa: "پس از تأیید حساب، از دکمه «تماس با این استعداد» در پروفایل استفاده کنید. شماره تماس فقط پس از ارسال درخواست تماس باز می‌شود و از سهمیه ماهانه شما کسر می‌شود.", en: "After account approval, use the 'Contact this talent' button on their profile. The phone number unlocks only after you submit a contact request, which counts toward your monthly quota." },
      },
      {
        q: { fa: "محدودیت تماس ماهانه چقدر است؟", en: "What are the monthly contact limits?" },
        a: { fa: "پلن رایگان: ۳ تماس — پلن Basic: ۱۰ تماس در ماه — پلن Pro: تماس نامحدود. سهمیه در ابتدای هر ماه شمسی تمدید می‌شود.", en: "Free plan: 3 contacts — Basic plan: 10 contacts/month — Pro plan: unlimited contacts. Quota resets at the start of each calendar month." },
      },
      {
        q: { fa: "آیا می‌توانم بازیگران را ذخیره و دسته‌بندی کنم؟", en: "Can I save and organize talent?" },
        a: { fa: "بله، از قابلیت «مجموعه» در داشبورد سازنده استفاده کنید. می‌توانید لیست‌های نام‌گذاری‌شده دلخواه بسازید و بازیگران را در آن‌ها ذخیره و مقایسه کنید.", en: "Yes — use the 'Collections' feature in your creator dashboard to build named lists, save talent profiles, and compare candidates for your project." },
      },
    ],
  },
  {
    cat: { fa: "برای بازیگران و عوامل", en: "For Talent & Crew" },
    items: [
      {
        q: { fa: "اطلاعات تماسم برای چه کسانی نمایش داده می‌شود؟", en: "Who can see my contact details?" },
        a: { fa: "شماره تماس شما تا زمانی که یک سازنده تأیید شده درخواست تماس ارسال نکرده، پنهان است. ایمیل شما هرگز در هیچ صفحه‌ای نمایش داده نمی‌شود.", en: "Your phone number is hidden until a verified creator submits a contact request. Your email is never shown anywhere on the platform." },
      },
      {
        q: { fa: "چند عکس و ویدیو می‌توانم بارگذاری کنم؟", en: "How many photos and videos can I upload?" },
        a: { fa: "تا ۱۰ عکس گالری، ۱ ویدیو رزومه (حداکثر ۳ دقیقه)، ۱ نمونه صدا و ۱ رزومه PDF می‌توانید بارگذاری کنید. عکس پروفایل اصلی نیز به صورت جداگانه قابل تنظیم است.", en: "Up to 10 gallery photos, 1 video reel (max 3 min), 1 voice sample, and 1 PDF resume. Your main profile photo is managed separately." },
      },
      {
        q: { fa: "چطور بفهمم چه کسانی پروفایلم را دیده‌اند؟", en: "Can I see who viewed my profile?" },
        a: { fa: "تعداد کل بازدیدهای پروفایل در داشبورد بازیگر نمایش داده می‌شود. هویت بازدیدکنندگان برای حفظ حریم خصوصی سازندگان افشا نمی‌شود.", en: "Total profile view counts are shown on your player dashboard. Viewer identities are kept private to protect creator privacy." },
      },
    ],
  },
  {
    cat: { fa: "فنی و پشتیبانی", en: "Technical & Support" },
    items: [
      {
        q: { fa: "محدودیت حجم فایل‌ها چیست؟", en: "What are the file size limits?" },
        a: { fa: "عکس پروفایل و گالری: تا ۵ مگابایت | ویدیو رزومه: تا ۵۰۰ مگابایت (حداکثر ۳ دقیقه) | نمونه صدا: تا ۲۰ مگابایت | رزومه PDF: تا ۱۰ مگابایت | کارت سینمایی: تا ۵ مگابایت.", en: "Profile & gallery photos: up to 5MB | Video reel: up to 500MB (max 3 min) | Voice sample: up to 20MB | PDF resume: up to 10MB | Cinema Card: up to 5MB." },
      },
      {
        q: { fa: "مرورگرهای پشتیبانی‌شده کدام‌اند؟", en: "Which browsers are supported?" },
        a: { fa: "پلتفرم با آخرین نسخه‌های Chrome، Firefox، Safari و Edge به خوبی کار می‌کند. برای بهترین تجربه، از Chrome 110+ یا Safari 16+ استفاده کنید.", en: "The platform works well on the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, use Chrome 110+ or Safari 16+." },
      },
      {
        q: { fa: "در صورت بروز مشکل فنی با چه کسی تماس بگیرم؟", en: "Who should I contact for technical issues?" },
        a: { fa: "از صفحه «تماس با ما» پیام بفرستید. تیم پشتیبانی در روزهای شنبه تا چهارشنبه، ساعت ۹ صبح تا ۵ بعد از ظهر پاسخگو است.", en: "Send a message via the 'Contact Us' page. Our support team responds Saturday–Wednesday, 9am–5pm Tehran time." },
      },
    ],
  },
  {
    cat: { fa: "حریم خصوصی و امنیت", en: "Privacy & Security" },
    items: [
      {
        q: { fa: "آیا کد ملی من نمایش داده می‌شود؟", en: "Is my National ID ever displayed?" },
        a: { fa: "خیر. کد ملی با رمزنگاری AES-256-GCM ذخیره می‌شود و هرگز در هیچ صفحه، پاسخ API یا گزارشی نمایش داده نمی‌شود. فقط برای صحت‌سنجی اولیه هویت استفاده می‌شود.", en: "Never. Your National ID is stored encrypted with AES-256-GCM and is never shown in any page, API response, or report. It is used solely for initial identity verification." },
      },
      {
        q: { fa: "توکن‌های ورود چگونه ذخیره می‌شوند؟", en: "How are login tokens stored?" },
        a: { fa: "توکن‌های احراز هویت (JWT) فقط در کوکی‌های HttpOnly و SameSite ذخیره می‌شوند. هرگز در LocalStorage یا SessionStorage قرار نمی‌گیرند تا در برابر حملات XSS محافظت شوند.", en: "Auth tokens (JWTs) are stored only in HttpOnly, SameSite cookies. They are never placed in localStorage or sessionStorage, protecting against XSS attacks." },
      },
      {
        q: { fa: "آیا اطلاعاتم با شخص ثالث به اشتراک گذاشته می‌شود؟", en: "Is my data shared with third parties?" },
        a: { fa: "خیر. ما اطلاعات شما را با هیچ شخص ثالثی به اشتراک نمی‌گذاریم. پلتفرم سینه‌کانکت هیچ آگهی تبلیغاتی نمایش نمی‌دهد و اسپانسر ندارد.", en: "No. We do not share your data with any third parties. CineConnect displays no advertising and has no commercial sponsors accessing your data." },
      },
    ],
  },
];

export default function FAQPage() {
  const { lang } = useLang();
  const [open, setOpen] = useState<string | null>("0-0");

  const totalItems = FAQ.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="container-cine py-16">
      <Reveal>
        <p className="eyebrow">{lang === "fa" ? "سوالات متداول" : "FAQ"}</p>
        <h1 className="section-title">{lang === "fa" ? "پاسخ پرسش‌های شما" : "Your questions answered"}</h1>
        <p className="mt-3 text-sm text-white/50">
          {lang === "fa"
            ? `${totalItems} سوال در ${FAQ.length} دسته‌بندی`
            : `${totalItems} questions across ${FAQ.length} categories`}
        </p>
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
                      <span
                        className="shrink-0 text-gold transition-transform duration-200"
                        style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                      >＋</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-white/8 px-5 py-4 text-sm leading-8 text-white/65">
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

      <Reveal delay={0.3}>
        <div className="mt-14 rounded-2xl border border-gold/20 bg-gold/5 p-8 text-center">
          <p className="font-display text-lg font-semibold text-white">
            {lang === "fa" ? "سوال شما اینجا نیست؟" : "Don't see your question?"}
          </p>
          <p className="mt-2 text-sm text-white/55">
            {lang === "fa" ? "تیم پشتیبانی ما آماده پاسخگویی است." : "Our support team is ready to help."}
          </p>
          <a href="/contact" className="btn-primary btn-sm mt-4 inline-block">
            {lang === "fa" ? "تماس با ما" : "Contact us"}
          </a>
        </div>
      </Reveal>
    </div>
  );
}
