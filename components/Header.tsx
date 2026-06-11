"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth, useLang } from "@/app/providers";
import { dict } from "@/lib/i18n";
import { Logo } from "./Logo";

export function Header() {
  const { lang, toggle } = useLang();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const T = (k: keyof typeof dict.nav) => dict.nav[k][lang];

  const links: { href: string; key: keyof typeof dict.nav }[] = [
    { href: "/", key: "home" },
    { href: "/talents", key: "talents" },
    { href: "/about", key: "about" },
    { href: "/faq", key: "faq" },
    { href: "/contact", key: "contact" },
  ];

  const dashHref =
    user?.role === "admin" ? "/admin" : user?.role === "creator" ? "/dashboard/creator" : "/dashboard/player";

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-charcoal/85 backdrop-blur-md">
      <div className="container-cine flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "text-gold" : "text-white/75 hover:text-white"
                }`}
              >
                {T(l.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language toggle (Persian / English) */}
          <button
            onClick={toggle}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-gold/60 hover:text-gold"
            aria-label="Toggle language"
          >
            {lang === "fa" ? "EN" : "فا"}
          </button>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link href={dashHref} className="btn-ghost btn-sm">
                {user.role === "admin" ? T("admin") : T("dashboard")}
              </Link>
              <button onClick={handleLogout} className="text-sm text-white/60 hover:text-crimson-light">
                {T("logout")}
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="btn-ghost btn-sm">
                {T("login")}
              </Link>
              <Link href="/register/player" className="btn-primary btn-sm">
                {T("registerPlayer")}
              </Link>
            </div>
          )}

          {/* mobile menu button */}
          <button
            className="rounded-md border border-white/15 p-2 text-white/80 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="border-t border-white/8 bg-charcoal-800 md:hidden">
          <div className="container-cine flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-gold"
              >
                {T(l.key)}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/8 pt-3">
              {user ? (
                <>
                  <Link href={dashHref} onClick={() => setOpen(false)} className="btn-ghost btn-sm">
                    {user.role === "admin" ? T("admin") : T("dashboard")}
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost btn-sm">
                    {T("logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
                    {T("login")}
                  </Link>
                  <Link href="/register/player" onClick={() => setOpen(false)} className="btn-primary btn-sm">
                    {T("registerPlayer")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
