"use client";

import { useLang } from "../providers";
import { Reveal } from "@/components/Reveal";

export default function AboutPage() {
  const { lang } = useLang();
  const fa = lang === "fa";

  return (
    <div className="container-cine py-16">
      <Reveal>
        <p className="eyebrow">{fa ? "درباره ما" : "About us"}</p>
        <h1 className="section-title max-w-3xl">
          {fa ? "سینه‌کانکت؛ پلی میان استعداد و فرصت" : "CineConnect — a bridge between talent and opportunity"}
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="card mt-10 space-y-5 p-8 text-white/75 leading-8">
          <p>
            {fa
              ? "سینه‌کانکت یک پلتفرم تخصصی برای صنعت سینما، تلویزیون، سریال و فیلم کوتاه ایران است. هدف ما ساده است: کاری کنیم استعدادها دیده شوند و سازندگان فیلم سریع‌تر و دقیق‌تر، عوامل مورد نیاز خود را پیدا کنند."
              : "CineConnect is a dedicated platform for Iran's film, television, serial and short-film industry. Our mission is simple: help talent get discovered, and help creators find the crew they need faster and more accurately."}
          </p>
          <p>
            {fa
              ? "از بازیگر و فیلمبردار گرفته تا طراح صدا، تدوینگر، طراح لباس، بدلکار و دوبلور — همه‌ی تخصص‌های پشت و جلوی دوربین در یک ثبت‌نام حرفه‌ای گرد هم می‌آیند."
              : "From actors and cinematographers to sound designers, editors, costume designers, stunt performers and voice actors — every craft in front of and behind the camera, in one professional registry."}
          </p>
          <p>
            {fa
              ? "حریم خصوصی و امنیت داده‌ها برای ما اولویت است. اطلاعات حساس مانند کد ملی رمزنگاری می‌شود و شماره تماس بازیگران تا پیش از ارسال درخواست تماس، برای سازندگان نمایش داده نمی‌شود."
              : "Privacy and data security are a priority. Sensitive data like National ID is encrypted, and a talent's phone number is never shown to creators until a contact request is sent."}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
