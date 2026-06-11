"use client";

import Link from "next/link";
import { useLang } from "@/app/providers";
import { dict } from "@/lib/i18n";

// CineConnect wordmark — gold film-reel glyph + bilingual name.
export function Logo({ compact = false }: { compact?: boolean }) {
  const { lang } = useLang();
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="CineConnect">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold-sheen shadow-gold">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-charcoal" fill="currentColor" aria-hidden>
          <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 2v2h2V6H6Zm0 4v2h2v-2H6Zm0 4v2h2v-2H6Zm10-8v2h2V6h-2Zm0 4v2h2v-2h-2Zm0 4v2h2v-2h-2ZM10 6v12h4V6h-4Z" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-wide text-white">
          {lang === "fa" ? dict.brand.fa : dict.brand.en}
        </span>
        {!compact && (
          <span className="text-[10px] font-medium tracking-[0.18em] text-gold/80">
            {lang === "fa" ? dict.brand.en : dict.brand.fa}
          </span>
        )}
      </span>
    </Link>
  );
}
