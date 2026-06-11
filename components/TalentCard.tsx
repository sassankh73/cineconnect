"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/app/providers";
import { dict } from "@/lib/i18n";
import { EXPERIENCE_LEVELS } from "@/lib/constants";

export interface TalentCardData {
  id: string;
  full_name_persian: string;
  primary_profession: string;
  city: string;
  experience_level: string;
  tier: number;
  profile_photo?: string;
}

function tierLabel(level: string) {
  return EXPERIENCE_LEVELS.find((e) => e.value === level)?.label_fa ?? level;
}

export function TalentCard({ t }: { t: TalentCardData }) {
  const { lang } = useLang();
  const initials = t.full_name_persian?.trim()?.charAt(0) || "?";

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <Link
        href={`/talent/${t.id}`}
        className="card group block overflow-hidden transition-shadow hover:shadow-gold"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-charcoal-700">
          {t.profile_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.profile_photo}
              alt={t.full_name_persian}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-charcoal-600 to-charcoal-800">
              <span className="font-display text-5xl text-gold/40">{initials}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-charcoal to-transparent" />
          <span className="badge-gold absolute end-2 top-2">{tierLabel(t.experience_level)}</span>
        </div>

        <div className="space-y-1 p-4">
          <h3 className="truncate font-display text-lg font-semibold text-white">{t.full_name_persian}</h3>
          <p className="truncate text-sm text-gold/90">{t.primary_profession}</p>
          <div className="flex items-center gap-1.5 text-xs text-white/55">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {t.city}
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-gold transition group-hover:text-gold-light">
              {dict.common.viewProfile[lang]} ←
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
