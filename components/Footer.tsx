"use client";

import Link from "next/link";
import { useLang } from "@/app/providers";
import { dict } from "@/lib/i18n";
import { Logo } from "./Logo";

export function Footer() {
  const { lang } = useLang();
  const year = new Date().getFullYear();

  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: lang === "fa" ? "پلتفرم" : "Platform",
      links: [
        { label: dict.nav.talents[lang], href: "/talents" },
        { label: dict.nav.registerPlayer[lang], href: "/register/player" },
        { label: dict.nav.loginCreator[lang], href: "/register/creator" },
      ],
    },
    {
      title: lang === "fa" ? "اطلاعات" : "Info",
      links: [
        { label: dict.nav.about[lang], href: "/about" },
        { label: dict.nav.faq[lang], href: "/faq" },
        { label: dict.nav.contact[lang], href: "/contact" },
        { label: lang === "fa" ? "قوانین و مقررات" : "Terms", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-white/8 bg-charcoal-800">
      <div className="container-cine grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
            {lang === "fa"
              ? "سینه‌کانکت — پل میان استعدادهای سینمای ایران و سازندگان فیلم. جایی که استعداد، فرصت پیدا می‌کند."
              : "CineConnect — bridging Iranian film talent with creators. Where talent finds opportunity."}
          </p>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="mb-3 text-sm font-semibold text-gold">{c.title}</h4>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/60 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/8">
        <div className="container-cine flex flex-col items-center justify-between gap-3 py-5 text-center text-xs text-white/45 sm:flex-row sm:text-start">
          <p>
            © {year} {dict.brand[lang]} — {dict.footer.rights[lang]}
          </p>
          <p className="max-w-md">{dict.footer.privacyNote[lang]}</p>
        </div>
      </div>
    </footer>
  );
}
