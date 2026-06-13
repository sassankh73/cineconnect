"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useLang } from "@/app/providers";
import { TalentCard } from "@/components/TalentCard";
import { CREATOR_PLANS } from "@/lib/constants";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

export default function CreatorDashboard() {
  const { lang } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();
  const fa = lang === "fa";

  const [collections, setCollections] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!loading && (!user || (user.role !== "creator" && user.role !== "admin"))) router.push("/login?tab=creator");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/creator/bookmarks").then((r) => r.json()).then((d) => setCollections(d.collections || {})).catch(() => {});
  }, []);

  if (loading) return <div className="container-cine py-24 text-center text-white/50">…</div>;

  const collectionNames = Object.keys(collections);

  return (
    <div className="container-cine py-10">
      <EmailVerificationBanner />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-white">{fa ? "داشبورد سازنده" : "Creator Dashboard"}</h1>
        <Link href="/talents" className="btn-primary btn-sm">{fa ? "جستجوی استعدادها" : "Search talent"}</Link>
      </div>

      {/* quick actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <ActionCard href="/talents" icon="🔍" title={fa ? "جستجوی پیشرفته" : "Advanced search"} desc={fa ? "فیلتر بر اساس حرفه، شهر، تجربه و مهارت" : "Filter by profession, city, experience, skills"} />
        <ActionCard href="#collections" icon="🔖" title={fa ? "مجموعه‌های ذخیره‌شده" : "Saved collections"} desc={fa ? "بازیگران را در لیست‌های نام‌گذاری‌شده ذخیره کنید" : "Bookmark talent into named lists"} />
        <ActionCard href="#plan" icon="⭐" title={fa ? "پلن اشتراک" : "Subscription"} desc={fa ? "وضعیت پلن و سقف تماس" : "Plan status and contact limit"} />
      </div>

      {/* plan status */}
      <section id="plan" className="card mb-8 p-6">
        <h2 className="mb-4 font-display text-xl font-semibold text-gold">{fa ? "پلن اشتراک" : "Subscription plan"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CREATOR_PLANS.map((pl) => (
            <div key={pl.id} className="rounded-xl border border-white/12 bg-charcoal-800 p-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-white">{pl.name}</span>
                <span className="badge-gold">{pl.contacts_per_month === "unlimited" ? (fa ? "نامحدود" : "Unlimited") : `${pl.contacts_per_month}/${fa ? "ماه" : "mo"}`}</span>
              </div>
              <p className="mt-2 text-sm text-white/55">
                {pl.contacts_per_month === "unlimited"
                  ? (fa ? "تماس نامحدود با استعدادها" : "Unlimited talent contacts")
                  : (fa ? `تا ${pl.contacts_per_month} درخواست تماس در ماه` : `Up to ${pl.contacts_per_month} contact requests/month`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* bookmark collections */}
      <section id="collections">
        <h2 className="mb-4 font-display text-xl font-semibold text-gold">{fa ? "مجموعه‌های من" : "My collections"}</h2>
        {collectionNames.length === 0 ? (
          <div className="card p-8 text-center text-white/55">
            {fa ? "هنوز مجموعه‌ای نساخته‌اید. از صفحه هر استعداد، او را به یک مجموعه اضافه کنید." : "No collections yet. Add talent to a collection from any profile page."}
            <div className="mt-4"><Link href="/talents" className="btn-ghost btn-sm">{fa ? "شروع جستجو" : "Start searching"}</Link></div>
          </div>
        ) : (
          <div className="space-y-8">
            {collectionNames.map((name) => (
              <div key={name}>
                <h3 className="mb-3 flex items-center gap-2 text-white/85"><span className="text-gold">🔖</span> {name} <span className="text-sm text-white/40">({collections[name].length})</span></h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {collections[name].map((t) => <TalentCard key={t.id} t={t} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ActionCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="card p-5 transition hover:border-gold/40 hover:shadow-gold">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-xl">{icon}</span>
      <h3 className="mt-3 font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs text-white/55">{desc}</p>
    </Link>
  );
}
