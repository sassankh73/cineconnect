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
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [approvalLoading, setApprovalLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "creator" && user.role !== "admin"))) {
      router.push("/login?tab=creator");
    }
  }, [loading, user, router]);

  useEffect(() => {
    // Fetch creator approval status
    fetch("/api/creator/profile")
      .then((r) => r.json())
      .then((d) => setApprovalStatus(d.approval_status ?? "approved"))
      .catch(() => setApprovalStatus("approved"))
      .finally(() => setApprovalLoading(false));
  }, []);

  useEffect(() => {
    if (approvalStatus === "approved") {
      fetch("/api/creator/bookmarks")
        .then((r) => r.json())
        .then((d) => setCollections(d.collections || {}))
        .catch(() => {});
    }
  }, [approvalStatus]);

  if (loading || approvalLoading) return <div className="container-cine py-24 text-center text-white/50">…</div>;

  // ── Pending approval state ─────────────────────────────────────────────────
  if (approvalStatus === "pending") {
    return (
      <div className="container-cine py-14 max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-8 text-center space-y-5"
          style={{ background: "rgba(201,168,76,0.06)", border: "2px solid rgba(201,168,76,0.3)" }}
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl"
            style={{ background: "rgba(201,168,76,0.15)" }}>
            🕐
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            {fa ? "حساب شما در انتظار تأیید است" : "Your account is pending approval"}
          </h1>
          <p className="text-white/65 leading-8 text-sm">
            {fa
              ? "مدارک شما (کارت سینمایی) دریافت شد و توسط تیم سینه‌کانکت در حال بررسی است. معمولاً این فرآیند تا ۴۸ ساعت طول می‌کشد. پس از تأیید، ایمیل اطلاع‌رسانی دریافت خواهید کرد و می‌توانید به پروفایل بازیگران دسترسی داشته باشید."
              : "Your Cinema Card has been received and is being reviewed by the CineConnect team. This process typically takes up to 48 hours. You'll receive an email once approved and will then have full access to talent profiles."}
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { icon: "📤", fa: "مدارک ارسال شد", en: "Documents submitted" },
              { icon: "🔍", fa: "در حال بررسی", en: "Under review" },
              { icon: "🔒", fa: "دسترسی در انتظار", en: "Access pending" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-xs text-white/55">{fa ? s.fa : s.en}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 pt-2">
            {fa
              ? "اگر پس از ۴۸ ساعت تأییدیه‌ای دریافت نکردید، با تیم پشتیبانی تماس بگیرید."
              : "If you haven't received confirmation after 48 hours, please contact our support team."}
          </p>
          <a href="/contact" className="btn-ghost btn-sm inline-block">
            {fa ? "تماس با پشتیبانی" : "Contact support"}
          </a>
        </div>
      </div>
    );
  }

  // ── Rejected state ─────────────────────────────────────────────────────────
  if (approvalStatus === "rejected") {
    return (
      <div className="container-cine py-14 max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-8 text-center space-y-5"
          style={{ background: "rgba(139,26,26,0.1)", border: "2px solid rgba(239,68,68,0.3)" }}
        >
          <div className="text-5xl">❌</div>
          <h1 className="font-display text-2xl font-bold text-white">
            {fa ? "تأیید حساب رد شد" : "Account verification rejected"}
          </h1>
          <p className="text-white/65 leading-8 text-sm">
            {fa
              ? "متأسفانه مدارک ارسالی شما تأیید نشد. لطفاً با تیم پشتیبانی تماس بگیرید تا دلیل رد شدن را بدانید و در صورت نیاز، مدارک معتبرتری ارائه دهید."
              : "Unfortunately your submitted documents were not approved. Please contact support to understand the reason and, if needed, submit more appropriate credentials."}
          </p>
          <a href="/contact" className="btn-primary btn-sm inline-block">
            {fa ? "تماس با پشتیبانی" : "Contact support"}
          </a>
        </div>
      </div>
    );
  }

  // ── Approved: full dashboard ───────────────────────────────────────────────
  const collectionNames = Object.keys(collections);

  return (
    <div className="container-cine py-10">
      <EmailVerificationBanner />

      {/* Approved badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
        ✅ {fa ? "حساب تأییدشده" : "Verified account"}
      </div>

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
