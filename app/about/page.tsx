"use client";

import { useLang } from "../providers";
import { Reveal } from "@/components/Reveal";

const STATS = [
  { fa: "۱۰٬۰۰۰+", en: "10,000+", labelFa: "استعداد ثبت‌شده", labelEn: "Registered talent" },
  { fa: "۵۰۰+", en: "500+", labelFa: "سازنده تأییدشده", labelEn: "Verified creators" },
  { fa: "۳۰+", en: "30+", labelFa: "تخصص سینمایی", labelEn: "Film professions" },
  { fa: "۲۴ ساعته", en: "24/7", labelFa: "در دسترس", labelEn: "Accessible" },
];

const VALUES = [
  {
    icon: "🎬",
    fa: { title: "تخصص‌محور", body: "سینه‌کانکت منحصراً برای صنعت سینما و تلویزیون ایران طراحی شده — نه یک پلتفرم عمومی استخدام، بلکه یک رجیستری حرفه‌ای تخصصی." },
    en: { title: "Industry-first", body: "CineConnect is built exclusively for Iran's film and television industry — not a general job board, but a dedicated professional registry for every craft in the frame." },
  },
  {
    icon: "🔒",
    fa: { title: "حریم خصوصی در اولویت", body: "کد ملی رمزنگاری‌شده ذخیره می‌شود، شماره تماس فقط پس از درخواست باز می‌شود، و توکن‌های ورود هرگز در مرورگر ذخیره نمی‌شوند." },
    en: { title: "Privacy by design", body: "National IDs are encrypted, phone numbers unlock only on request, and session tokens never touch localStorage. Your data belongs to you." },
  },
  {
    icon: "✅",
    fa: { title: "تأیید هویت دوطرفه", body: "هم بازیگران (از طریق پرداخت و تأیید) و هم سازندگان (از طریق کارت سینمایی) تأیید می‌شوند تا اطمینان از اصالت هر دو طرف داشته باشید." },
    en: { title: "Dual verification", body: "Both talent (via payment confirmation) and creators (via Cinema Card) are verified — so every interaction on the platform happens between real, credentialed professionals." },
  },
  {
    icon: "🌐",
    fa: { title: "دوزبانه", body: "رابط کاربری به فارسی و انگلیسی در دسترس است و پشتیبانی از راست‌به‌چپ (RTL) کامل است — برای بازیگران و سازندگان ایرانی مقیم خارج از کشور نیز مناسب است." },
    en: { title: "Bilingual", body: "Full Persian and English interface with complete RTL support — making CineConnect accessible to Iranian talent and creators wherever they are in the world." },
  },
];

const HOW_IT_WORKS = [
  {
    step: "۱", stepEn: "1",
    fa: { title: "ثبت‌نام", body: "بازیگر یا عوامل فیلم فرم ثبت‌نام را تکمیل می‌کنند، رسانه‌هایشان را بارگذاری می‌کنند و هزینه سطح انتخابی را پرداخت می‌کنند." },
    en: { title: "Register", body: "Talent completes the registration form, uploads their media portfolio, and pays the fee for their chosen experience tier." },
  },
  {
    step: "۲", stepEn: "2",
    fa: { title: "تأیید مدیر", body: "تیم سینه‌کانکت پرداخت را تأیید می‌کند. برای سازندگان، کارت سینمایی بررسی و هویت تأیید می‌شود." },
    en: { title: "Admin review", body: "The CineConnect team confirms payment. For creators, the Cinema Card is reviewed and identity verified before access is granted." },
  },
  {
    step: "۳", stepEn: "3",
    fa: { title: "جستجو و کشف", body: "سازندگان فیلم با فیلترهای پیشرفته (حرفه، شهر، تجربه، مهارت، جنسیت، سن) بازیگران و عوامل مورد نیاز را پیدا می‌کنند." },
    en: { title: "Search & discover", body: "Filmmakers use advanced filters — profession, city, experience, skills, gender, age range — to find exactly the talent they need for their production." },
  },
  {
    step: "۴", stepEn: "4",
    fa: { title: "تماس امن", body: "سازنده درخواست تماس ارسال می‌کند، شماره تماس بازیگر باز می‌شود. همه‌چیز ثبت و قابل پیگیری است." },
    en: { title: "Secure contact", body: "The creator submits a contact request, the talent's phone number unlocks, and the connection is made. Every contact request is logged for accountability." },
  },
];

export default function AboutPage() {
  const { lang } = useLang();
  const fa = lang === "fa";

  return (
    <div className="container-cine py-16 space-y-20">

      {/* ── Hero ── */}
      <Reveal>
        <p className="eyebrow">{fa ? "درباره ما" : "About us"}</p>
        <h1 className="section-title max-w-3xl">
          {fa ? "سینه‌کانکت؛ پلی میان استعداد و فرصت" : "CineConnect — where talent meets opportunity"}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-9 text-white/65">
          {fa
            ? "سینه‌کانکت یک پلتفرم تخصصی برای صنعت سینما، تلویزیون، سریال و فیلم کوتاه ایران است. ما این فضا را ساختیم تا استعدادها دیده شوند و سازندگان فیلم سریع‌تر، دقیق‌تر و با اطمینان بیشتر، عوامل مورد نیاز خود را پیدا کنند."
            : "CineConnect is a dedicated platform for Iran's film, television, serial and short-film industry. We built this space so talent gets discovered, and filmmakers find the crew they need — faster, more accurately, and with confidence."}
        </p>
      </Reveal>

      {/* ── Stats ── */}
      <Reveal delay={0.1}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={i} className="card p-6 text-center">
              <p className="font-display text-3xl font-bold text-gold">{fa ? s.fa : s.en}</p>
              <p className="mt-2 text-sm text-white/55">{fa ? s.labelFa : s.labelEn}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Mission ── */}
      <Reveal delay={0.1}>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="card p-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold/70">{fa ? "مأموریت ما" : "Our mission"}</p>
            <h2 className="font-display text-2xl font-bold text-white">
              {fa ? "دیده شدن حق هر استعداد است" : "Every talent deserves to be seen"}
            </h2>
            <p className="leading-8 text-white/65 text-sm">
              {fa
                ? "سال‌هاست که بسیاری از بازیگران و عوامل فیلم با تجربه و مهارت بالا، به دلیل فقدان یک بستر رسمی و قابل اعتماد، نمی‌توانند خود را به سازندگان فیلم معرفی کنند. ما این شکاف را با یک رجیستری حرفه‌ای، قابل جستجو و مبتنی بر تأیید هویت پر می‌کنیم."
                : "For years, skilled and experienced actors and crew have had no formal, trusted platform to present themselves to filmmakers. We fill that gap with a professional, searchable registry built on identity verification and mutual accountability."}
            </p>
          </div>
          <div className="card p-8 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold/70">{fa ? "چشم‌انداز ما" : "Our vision"}</p>
            <h2 className="font-display text-2xl font-bold text-white">
              {fa ? "استاندارد صنعت سینمای ایران" : "The standard for Iranian cinema industry"}
            </h2>
            <p className="leading-8 text-white/65 text-sm">
              {fa
                ? "هدف ما این است که سینه‌کانکت به مرجع اصلی صنعت سینما و تلویزیون ایران تبدیل شود — جایی که هر کارگردان، تهیه‌کننده و مدیر تولید، اولین و مطمئن‌ترین ابزار جستجوی عوامل خود را در اینجا پیدا کند."
                : "Our vision is for CineConnect to become the primary reference point for Iran's film and TV industry — the first and most trusted tool every director, producer and production manager turns to when casting and crewing up."}
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── How it works ── */}
      <Reveal delay={0.1}>
        <p className="eyebrow">{fa ? "چطور کار می‌کند" : "How it works"}</p>
        <h2 className="section-title">{fa ? "چهار گام ساده" : "Four simple steps"}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="card p-6 space-y-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #C9A84C, #8B1A1A)", color: "#fff" }}
              >
                {fa ? step.step : step.stepEn}
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{fa ? step.fa.title : step.en.title}</h3>
              <p className="text-sm leading-7 text-white/60">{fa ? step.fa.body : step.en.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Values ── */}
      <Reveal delay={0.1}>
        <p className="eyebrow">{fa ? "ارزش‌های ما" : "Our values"}</p>
        <h2 className="section-title">{fa ? "چه چیزی ما را متمایز می‌کند" : "What sets us apart"}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <div key={i} className="card p-6 flex gap-4">
              <span className="text-3xl shrink-0">{v.icon}</span>
              <div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">{fa ? v.fa.title : v.en.title}</h3>
                <p className="text-sm leading-7 text-white/60">{fa ? v.fa.body : v.en.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Who we serve ── */}
      <Reveal delay={0.1}>
        <div className="card p-8 space-y-5 leading-8 text-white/70 text-sm">
          <h2 className="font-display text-2xl font-bold text-white">
            {fa ? "برای چه کسانی ساخته شده‌ایم؟" : "Who is CineConnect for?"}
          </h2>
          <p>
            {fa
              ? "از بازیگر و فیلمبردار گرفته تا طراح صدا، تدوینگر، طراح لباس، بدلکار و دوبلور — همه‌ی تخصص‌های پشت و جلوی دوربین در یک رجیستری حرفه‌ای گرد هم می‌آیند."
              : "From actors and cinematographers to sound designers, editors, costume designers, stunt performers and voice actors — every craft in front of and behind the camera, in one professional registry."}
          </p>
          <p>
            {fa
              ? "در سمت مقابل، کارگردانان، تهیه‌کنندگان، مدیران تولید، دستیاران کارگردان و هر کسی که در پروژه‌های سینمایی و تلویزیونی ایران نیاز به یافتن عوامل دارد، می‌توانند با ثبت‌نام رایگان و تأیید هویت، به پایگاه داده کامل ما دسترسی داشته باشند."
              : "On the other side, directors, producers, production managers, assistant directors, and anyone sourcing crew for Iranian film and TV projects can access our full database after free registration and identity verification."}
          </p>
          <p>
            {fa
              ? "ما هم‌چنین برای بازیگران و عوامل ایرانی مقیم خارج از کشور که می‌خواهند برای پروژه‌های ایرانی در دسترس باشند، رابط کاربری انگلیسی و پشتیبانی کامل فراهم کرده‌ایم."
              : "We also fully support Iranian talent and creators based abroad who want to stay connected to the domestic industry, with a complete English-language interface."}
          </p>
        </div>
      </Reveal>

      {/* ── Privacy commitment ── */}
      <Reveal delay={0.1}>
        <div
          className="rounded-2xl p-8 space-y-4"
          style={{ background: "linear-gradient(135deg, rgba(139,26,26,0.15) 0%, rgba(201,168,76,0.05) 100%)", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <h2 className="font-display text-2xl font-bold text-white">
            {fa ? "تعهد ما به حریم خصوصی" : "Our privacy commitment"}
          </h2>
          <p className="text-sm leading-8 text-white/65">
            {fa
              ? "حریم خصوصی و امنیت داده‌ها برای ما یک اولویت اساسی است، نه یک گزینه اضافی. کد ملی با رمزنگاری AES-256-GCM ذخیره می‌شود و هرگز در هیچ پاسخ API یا صفحه‌ای نمایش داده نمی‌شود. شماره تماس بازیگران تا پیش از ارسال درخواست تماس، برای سازندگان پنهان می‌ماند. توکن‌های احراز هویت فقط در کوکی‌های HttpOnly ذخیره می‌شوند. پلتفرم هیچ تبلیغاتی نمایش نمی‌دهد و اطلاعات شما با هیچ شخص ثالثی به اشتراک گذاشته نمی‌شود."
              : "Privacy and data security are a foundational priority, not an afterthought. National IDs are encrypted with AES-256-GCM and never appear in any API response or page. Talent phone numbers are hidden from creators until a contact request is submitted. Auth tokens live only in HttpOnly cookies. The platform shows no advertising and shares your data with no third parties."}
          </p>
        </div>
      </Reveal>

    </div>
  );
}
