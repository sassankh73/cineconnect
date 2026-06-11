"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useLang } from "../providers";
import { TalentCard, type TalentCardData } from "@/components/TalentCard";
import { Select } from "@/components/fields";
import {
  PRIMARY_PROFESSIONS, EXPERIENCE_LEVELS, GENDERS,
  AVAILABILITY_OPTIONS, SPECIAL_SKILLS, LANGUAGES, IRAN_PROVINCES,
} from "@/lib/constants";

const SORTS = [
  { value: "newest", fa: "جدیدترین", en: "Newest" },
  { value: "most_viewed", fa: "پربازدیدترین", en: "Most viewed" },
  { value: "experience_level", fa: "سطح تجربه", en: "Experience" },
];

export default function TalentsPage() {
  const { lang } = useLang();
  const { user, loading } = useAuth();
  const fa = lang === "fa";

  const [talents, setTalents] = useState<TalentCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({ sort: "newest" });
  const [showFilters, setShowFilters] = useState(false);

  const isCreator = user?.role === "creator" || user?.role === "admin";

  const load = useCallback(async () => {
    if (!isCreator) return;
    setFetching(true);
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && qs.set(k, v));
    const res = await fetch(`/api/talents?${qs.toString()}`);
    if (res.ok) {
      const d = await res.json();
      setTalents(d.talents ?? []);
      setTotal(d.total ?? 0);
    }
    setFetching(false);
  }, [filters, isCreator]);

  useEffect(() => { load(); }, [load]);

  const setF = (k: string, v: string) => setFilters((s) => ({ ...s, [k]: v }));
  const clear = () => setFilters({ sort: "newest" });

  // ---- access gate: browse is creator-only ----
  if (loading) return <div className="container-cine py-24 text-center text-white/50">…</div>;
  if (!isCreator) {
    return (
      <div className="container-cine flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-3xl text-gold">🔒</span>
        <h1 className="mt-6 font-display text-2xl font-bold text-white">{fa ? "ویژه سازندگان فیلم" : "Filmmakers only"}</h1>
        <p className="mt-3 max-w-md text-white/60">
          {fa ? "مرور و جستجوی استعدادها تنها برای سازندگان فیلم ثبت‌نام‌شده در دسترس است." : "Browsing and searching talent is available to registered filmmakers only."}
        </p>
        <div className="mt-7 flex gap-3">
          <Link href="/login?tab=creator" className="btn-primary">{fa ? "ورود سازنده" : "Filmmaker login"}</Link>
          <Link href="/register/creator" className="btn-ghost">{fa ? "ثبت‌نام رایگان" : "Register free"}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-cine py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{fa ? "مرور استعدادها" : "Browse Talent"}</h1>
          <p className="text-sm text-white/50">{total.toLocaleString("fa-IR")} {fa ? "پروفایل فعال" : "active profiles"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44">
            <Select value={filters.sort} onChange={(v) => setF("sort", v)} options={SORTS.map((s) => ({ value: s.value, label: fa ? s.fa : s.en }))} placeholder={fa ? "مرتب‌سازی" : "Sort"} />
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className="btn-ghost btn-sm lg:hidden">{fa ? "فیلترها" : "Filters"}</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* filter sidebar */}
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="card sticky top-20 space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{fa ? "فیلترها" : "Filters"}</h3>
              <button onClick={clear} className="text-xs text-crimson-light">{fa ? "پاک کردن" : "Clear"}</button>
            </div>
            <input className="input" placeholder={fa ? "جستجو…" : "Search…"} value={filters.q || ""} onChange={(e) => setF("q", e.target.value)} />
            <FilterSelect label={fa ? "حرفه" : "Profession"} value={filters.profession} onChange={(v) => setF("profession", v)} options={PRIMARY_PROFESSIONS} />
            <FilterSelect label={fa ? "استان" : "Province"} value={filters.city} onChange={(v) => setF("city", v)} options={IRAN_PROVINCES} />
            <FilterSelect label={fa ? "سطح تجربه" : "Experience"} value={filters.experience_level} onChange={(v) => setF("experience_level", v)} options={EXPERIENCE_LEVELS.map((e) => ({ value: e.value, label: e.label_fa }))} />
            <FilterSelect label={fa ? "جنسیت" : "Gender"} value={filters.gender} onChange={(v) => setF("gender", v)} options={GENDERS} />
            <FilterSelect label={fa ? "دسترس‌پذیری" : "Availability"} value={filters.availability} onChange={(v) => setF("availability", v)} options={AVAILABILITY_OPTIONS} />
            <FilterSelect label={fa ? "مهارت ویژه" : "Special skill"} value={filters.special_skills} onChange={(v) => setF("special_skills", v)} options={SPECIAL_SKILLS} />
            <FilterSelect label={fa ? "زبان" : "Language"} value={filters.language} onChange={(v) => setF("language", v)} options={LANGUAGES} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" type="number" placeholder={fa ? "سن از" : "Age min"} value={filters.age_min || ""} onChange={(e) => setF("age_min", e.target.value)} />
              <input className="input" type="number" placeholder={fa ? "سن تا" : "Age max"} value={filters.age_max || ""} onChange={(e) => setF("age_max", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" type="number" placeholder={fa ? "قد از" : "Height min"} value={filters.height_min || ""} onChange={(e) => setF("height_min", e.target.value)} />
              <input className="input" type="number" placeholder={fa ? "قد تا" : "Height max"} value={filters.height_max || ""} onChange={(e) => setF("height_max", e.target.value)} />
            </div>
          </div>
        </aside>

        {/* results grid */}
        <div>
          {fetching ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card aspect-[3/4] animate-pulse bg-charcoal-700/40" />
              ))}
            </div>
          ) : talents.length === 0 ? (
            <div className="card flex h-64 items-center justify-center text-white/50">{fa ? "نتیجه‌ای یافت نشد" : "No results"}</div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {talents.map((t) => <TalentCard key={t.id} t={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: readonly string[] | { value: string; label: string }[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-white/50">{label}</label>
      <Select value={value || ""} onChange={onChange} options={options} placeholder="همه" />
    </div>
  );
}
