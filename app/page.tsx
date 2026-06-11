"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLang } from "./providers";
import { dict } from "@/lib/i18n";
import { PRIMARY_PROFESSIONS } from "@/lib/constants";
import { FilmStripTicker } from "@/components/FilmStripTicker";
import { Reveal } from "@/components/Reveal";
import { StatCounter } from "@/components/StatCounter";
import { TalentCard, type TalentCardData } from "@/components/TalentCard";

export default function LandingPage() {
  const { lang } = useLang();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 140]); // subtle parallax
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.25]);

  const [featured, setFeatured] = useState<TalentCardData[]>([]);
  const [stats, setStats] = useState({ talents: 0, productions: 0, cities: 0 });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setFeatured(d.featured ?? []);
        setStats(d.stats ?? { talents: 0, productions: 0, cities: 0 });
      })
      .catch(() => {});
  }, []);

  const H = dict.home;

  return (
    <div>
      {/* 1) SIGNATURE film-strip ticker */}
      <FilmStripTicker />

      {/* 2) Fullscreen parallax hero */}
      <section className="relative flex min-h-[82vh] items-center overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="pointer-events-none absolute inset-0 bg-charcoal-fade"
        >
          <div className="absolute -top-40 start-1/4 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute bottom-0 end-1/4 h-96 w-96 rounded-full bg-crimson/10 blur-3xl" />
        </motion.div>

        <div className="container-cine relative z-10 py-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow mx-auto"
          >
            {lang === "fa" ? "پلتفرم تخصصی سینمای ایران" : "Iranian Film Industry Platform"}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mx-auto max-w-4xl font-display text-4xl font-bold leading-tight text-white sm:text-6xl"
          >
            {lang === "fa" ? dict.tagline.fa : dict.tagline.en}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-white/65"
          >
            {lang === "fa"
              ? "از بازیگر و فیلمبردار تا طراح صدا و بدلکار — استعدادهای سینمای ایران را در یک‌جا پیدا کنید."
              : "From actors and cinematographers to sound designers and stunt performers — discover Iranian film talent in one place."}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/register/player" className="btn-primary w-full sm:w-auto">
              {H.ctaPrimary[lang]}
            </Link>
            <Link href="/login?tab=creator" className="btn-ghost w-full sm:w-auto">
              {H.ctaSecondary[lang]}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3) How it works */}
      <section className="container-cine py-20">
        <Reveal>
          <div className="text-center">
            <p className="eyebrow">{H.howItWorks[lang]}</p>
            <h2 className="section-title">{lang === "fa" ? "سه گام تا فرصت بعدی" : "Three steps to your next opportunity"}</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "۱", t: H.step1[lang], d: H.step1d[lang] },
            { n: "۲", t: H.step2[lang], d: H.step2d[lang] },
            { n: "۳", t: H.step3[lang], d: H.step3d[lang] },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div className="card h-full p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-sheen font-display text-xl font-bold text-charcoal">
                  {s.n}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-white">{s.t}</h3>
                <p className="mt-2 text-sm leading-7 text-white/60">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4) Featured profiles (rotating showcase) */}
      {featured.length > 0 && (
        <section className="container-cine py-12">
          <Reveal>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="eyebrow">{H.featured[lang]}</p>
                <h2 className="section-title">{lang === "fa" ? "چهره‌های منتخب" : "Selected Faces"}</h2>
              </div>
              <Link href="/talents" className="hidden text-sm text-gold hover:text-gold-light sm:block">
                {lang === "fa" ? "مشاهده همه ←" : "View all ←"}
              </Link>
            </div>
          </Reveal>
          <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
            {featured.map((t) => (
              <div key={t.id} className="w-56 shrink-0">
                <TalentCard t={t} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5) Professions list */}
      <section className="container-cine py-20">
        <Reveal>
          <div className="text-center">
            <p className="eyebrow">{H.professions[lang]}</p>
            <h2 className="section-title">{lang === "fa" ? "هر تخصصی که نیاز دارید" : "Every craft you need"}</h2>
          </div>
        </Reveal>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {PRIMARY_PROFESSIONS.filter((p) => p !== "سایر").map((p, i) => (
            <Reveal key={p} delay={Math.min(i * 0.03, 0.4)}>
              <span className="rounded-full border border-white/10 bg-panel/60 px-4 py-2 text-sm text-white/75 transition hover:border-gold/50 hover:text-gold">
                {p}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6) Testimonials */}
      <section className="container-cine py-12">
        <Reveal>
          <h2 className="section-title text-center">{H.testimonials[lang]}</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { q: "از طریق سینه‌کانکت برای فیلم کوتاهم یک بدلکار حرفه‌ای پیدا کردم.", a: "کارگردان مستقل" },
            { q: "پروفایلم بعد از دو هفته دیده شد و برای یک سریال دعوت شدم.", a: "بازیگر تئاتر" },
            { q: "کستینگ کل یک پروژه را از این‌جا انجام دادیم. سریع و دقیق.", a: "مدیر کستینگ" },
          ].map((c, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <figure className="card h-full p-7">
                <div className="font-display text-4xl text-gold/50">“</div>
                <blockquote className="-mt-3 text-sm leading-7 text-white/80">{c.q}</blockquote>
                <figcaption className="mt-4 text-xs font-semibold text-gold">— {c.a}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7) Animated stats */}
      <section className="border-y border-white/8 bg-charcoal-800 py-16">
        <div className="container-cine grid grid-cols-1 gap-10 sm:grid-cols-3">
          <StatCounter value={Math.max(stats.talents, 120)} label={H.statsTalents[lang]} />
          <StatCounter value={Math.max(stats.productions, 48)} label={H.statsProductions[lang]} />
          <StatCounter value={Math.max(stats.cities, 24)} label={H.statsCities[lang]} />
        </div>
      </section>

      {/* CTA band */}
      <section className="container-cine py-20">
        <Reveal>
          <div className="card relative overflow-hidden p-10 text-center sm:p-14">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
            <h2 className="section-title">{lang === "fa" ? "آماده‌اید دیده شوید؟" : "Ready to be discovered?"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/60">
              {lang === "fa"
                ? "همین حالا پروفایل حرفه‌ای خود را بسازید و در معرض دید سازندگان سینما قرار بگیرید."
                : "Build your professional profile today and get in front of film creators."}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register/player" className="btn-primary">{H.ctaPrimary[lang]}</Link>
              <Link href="/register/creator" className="btn-crimson">
                {lang === "fa" ? "ثبت‌نام سازنده فیلم" : "Register as Filmmaker"}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
