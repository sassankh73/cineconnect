"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useLang } from "@/app/providers";
import { Field, TextInput, Select } from "@/components/fields";
import { AVAILABILITY_OPTIONS, IRAN_PROVINCES, UPLOAD_LIMITS } from "@/lib/constants";
import { uploadFile, humanLimit } from "@/lib/upload-client";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

const STATUS_LABEL: Record<string, { fa: string; cls: string }> = {
  pending_payment: { fa: "در انتظار پرداخت", cls: "text-amber-300" },
  pending_review: { fa: "در انتظار تأیید پرداخت", cls: "text-amber-300" },
  active: { fa: "فعال و قابل مشاهده", cls: "text-emerald-400" },
  suspended: { fa: "معلق", cls: "text-crimson-light" },
  expired: { fa: "منقضی‌شده", cls: "text-white/50" },
};

export default function PlayerDashboard() {
  const { lang } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();
  const fa = lang === "fa";

  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"overview" | "edit" | "media" | "notifications">("overview");
  const [form, setForm] = useState<any>({});
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "player")) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    fetch("/api/player/me").then((r) => r.json()).then((d) => { setData(d); setForm(d.player || {}); });
  }, []);

  async function save() {
    const res = await fetch("/api/player/me", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name_persian: form.full_name_persian, city: form.city, province: form.province,
        phone: form.phone, availability: form.availability, daily_rate: form.daily_rate,
        instagram: form.instagram, awards: form.awards, willing_to_travel: form.willing_to_travel,
      }),
    });
    if (res.ok) { setSavedMsg(fa ? "ذخیره شد ✓" : "Saved ✓"); setTimeout(() => setSavedMsg(""), 2500); }
  }

  async function replaceMedia(kind: keyof typeof UPLOAD_LIMITS, file: File) {
    try {
      const url = await uploadFile(kind as any, file);
      const media = { ...(data.player.media || {}), [kind]: url };
      await fetch("/api/player/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ media }) });
      setData((d: any) => ({ ...d, player: { ...d.player, media } }));
    } catch { /* size/type errors surfaced by server */ }
  }

  async function requestDeletion() {
    if (!confirm(fa ? "آیا از درخواست حذف حساب مطمئن هستید؟" : "Request account deletion?")) return;
    await fetch("/api/player/me", { method: "DELETE" });
    alert(fa ? "درخواست حذف ثبت شد." : "Deletion requested.");
  }

  if (loading || !data) return <div className="container-cine py-24 text-center text-white/50">…</div>;
  if (data.error) return <div className="container-cine py-24 text-center text-white/60">{fa ? "پروفایلی یافت نشد." : "No profile."}</div>;

  const p = data.player;
  const st = STATUS_LABEL[p.status] || STATUS_LABEL.pending_payment;
  const tabs = [
    { id: "overview", fa: "نمای کلی", en: "Overview" },
    { id: "edit", fa: "ویرایش پروفایل", en: "Edit profile" },
    { id: "media", fa: "رسانه", en: "Media" },
    { id: "notifications", fa: "اعلان‌ها", en: "Notifications" },
  ] as const;

  return (
    <div className="container-cine py-10">
      <EmailVerificationBanner />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{p.full_name_persian}</h1>
          <p className="text-sm">{fa ? "وضعیت:" : "Status:"} <span className={st.cls}>{st.fa}</span></p>
        </div>
        <Link href={`/talent/${p.id}`} className="btn-ghost btn-sm">{fa ? "مشاهده پروفایل عمومی" : "View public profile"}</Link>
      </div>

      {/* pay banner if pending */}
      {(p.status === "pending_payment") && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
          <span>{fa ? "پروفایل شما تا تکمیل پرداخت پنهان است." : "Your profile is hidden until payment is completed."}</span>
          <Link href="/register/player" className="btn-primary btn-sm">{fa ? "تکمیل پرداخت" : "Complete payment"}</Link>
        </div>
      )}

      {/* stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={fa ? "بازدید پروفایل" : "Profile views"} value={p.view_count} />
        <Stat label={fa ? "درخواست تماس" : "Contact requests"} value={p.contact_request_count} />
        <Stat label={fa ? "سطح" : "Tier"} value={`Tier ${p.tier}`} />
        <Stat label={fa ? "اعتبار تا" : "Valid until"} value={p.expires_at ? new Date(p.expires_at).toLocaleDateString("fa-IR") : "—"} small />
      </div>

      {/* tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/8">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`whitespace-nowrap px-4 py-2.5 text-sm transition ${tab === tb.id ? "border-b-2 border-gold text-gold" : "text-white/55 hover:text-white"}`}>
            {fa ? tb.fa : tb.en}{tb.id === "notifications" && data.notifications?.some((n: any) => !n.read) ? " •" : ""}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card p-6 text-sm leading-7 text-white/70">
          <p>{fa ? "به داشبورد سینه‌کانکت خوش آمدید. از این بخش می‌توانید پروفایل، رسانه و اعلان‌های خود را مدیریت کنید." : "Welcome to your CineConnect dashboard. Manage your profile, media and notifications here."}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Row k={fa ? "حرفه اصلی" : "Profession"} v={p.primary_profession} />
            <Row k={fa ? "شهر" : "City"} v={p.city} />
            <Row k={fa ? "دسترس‌پذیری" : "Availability"} v={p.availability} />
          </dl>
        </div>
      )}

      {tab === "edit" && (
        <div className="card space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={fa ? "نام و نام خانوادگی" : "Full name"}><TextInput value={form.full_name_persian || ""} onChange={(v) => setForm({ ...form, full_name_persian: v })} /></Field>
            <Field label={fa ? "شماره تماس" : "Phone"} hint={fa ? "تا درخواست تماس پنهان است" : "Hidden until contact request"}><TextInput dir="ltr" value={form.phone || ""} onChange={(v) => setForm({ ...form, phone: v })} /></Field>
            <Field label={fa ? "شهر" : "City"}><TextInput value={form.city || ""} onChange={(v) => setForm({ ...form, city: v })} /></Field>
            <Field label={fa ? "استان" : "Province"}><Select value={form.province || ""} onChange={(v) => setForm({ ...form, province: v })} options={IRAN_PROVINCES} /></Field>
            <Field label={fa ? "دسترس‌پذیری" : "Availability"}><Select value={form.availability || ""} onChange={(v) => setForm({ ...form, availability: v })} options={AVAILABILITY_OPTIONS} /></Field>
            <Field label={fa ? "دستمزد روزانه" : "Daily rate"}><TextInput value={form.daily_rate || ""} onChange={(v) => setForm({ ...form, daily_rate: v })} /></Field>
            <Field label="Instagram"><TextInput dir="ltr" value={form.instagram || ""} onChange={(v) => setForm({ ...form, instagram: v })} /></Field>
          </div>
          <Field label={fa ? "جوایز و افتخارات" : "Awards"}><textarea className="input min-h-20" value={form.awards || ""} onChange={(e) => setForm({ ...form, awards: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm text-white/75">
            <input type="checkbox" checked={!!form.willing_to_travel} onChange={(e) => setForm({ ...form, willing_to_travel: e.target.checked })} className="h-4 w-4 accent-[#C9A84C]" />
            {fa ? "آمادگی سفر دارم" : "Willing to travel"}
          </label>
          <div className="flex items-center gap-3">
            <button onClick={save} className="btn-primary">{fa ? "ذخیره تغییرات" : "Save changes"}</button>
            {savedMsg && <span className="text-sm text-emerald-400">{savedMsg}</span>}
          </div>
        </div>
      )}

      {tab === "media" && (
        <div className="card space-y-4 p-6">
          {(["profile_photo", "video_reel", "voice_sample", "cv_pdf"] as const).map((kind) => (
            <div key={kind} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-charcoal-800 p-4">
              <div>
                <p className="text-sm font-medium text-white">{
                  kind === "profile_photo" ? (fa ? "عکس پروفایل" : "Profile photo") :
                  kind === "video_reel" ? (fa ? "ویدیو رزومه" : "Video reel") :
                  kind === "voice_sample" ? (fa ? "نمونه صدا" : "Voice sample") : (fa ? "رزومه PDF" : "CV PDF")
                }</p>
                <p className="text-xs text-white/45">{p.media?.[kind] ? (fa ? "بارگذاری شده" : "Uploaded") : (fa ? "خالی" : "Empty")} · {humanLimit(kind)}</p>
              </div>
              <label className="btn-ghost btn-sm cursor-pointer">
                <input type="file" accept={UPLOAD_LIMITS[kind].accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceMedia(kind, f); }} />
                {p.media?.[kind] ? (fa ? "جایگزینی" : "Replace") : (fa ? "بارگذاری" : "Upload")}
              </label>
            </div>
          ))}
        </div>
      )}

      {tab === "notifications" && (
        <div className="space-y-3">
          {(data.notifications || []).length === 0 ? (
            <div className="card p-8 text-center text-white/50">{fa ? "اعلانی ندارید." : "No notifications."}</div>
          ) : data.notifications.map((n: any) => (
            <div key={n.id} className={`card p-4 ${!n.read ? "border-gold/30" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{n.title}</p>
                <span className="text-xs text-white/40">{new Date(n.created_at).toLocaleDateString("fa-IR")}</span>
              </div>
              <p className="mt-1 text-sm text-white/65">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* account deletion */}
      <div className="mt-10 border-t border-white/8 pt-6">
        <button onClick={requestDeletion} className="text-sm text-crimson-light hover:underline">{fa ? "درخواست حذف حساب کاربری" : "Request account deletion"}</button>
      </div>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: any; small?: boolean }) {
  return (
    <div className="card p-4">
      <div className={`font-display font-bold text-gold ${small ? "text-base" : "text-2xl"}`}>{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</div>
      <div className="mt-1 text-xs text-white/55">{label}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-xs text-white/45">{k}</dt><dd className="text-white/85">{v}</dd></div>;
}
