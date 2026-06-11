"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth, useLang } from "@/app/providers";
import { EXPERIENCE_LEVELS } from "@/lib/constants";

export default function TalentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const { user } = useAuth();
  const fa = lang === "fa";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactErr, setContactErr] = useState("");
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [collection, setCollection] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/talents/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); if (d?.talent?.phone) setPhone(d.talent.phone); })
      .finally(() => setLoading(false));
  }, [id]);

  async function sendContact() {
    setSending(true); setContactErr("");
    const res = await fetch(`/api/talents/${id}/contact`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }),
    });
    const d = await res.json();
    if (res.ok) { setPhone(d.phone); setContactOpen(false); }
    else setContactErr(d.error === "limit_reached" ? (fa ? "سقف تماس ماهانه شما پر شده است." : "Monthly contact limit reached.") : (fa ? "خطا در ارسال." : "Failed."));
    setSending(false);
  }

  async function saveBookmark() {
    if (!collection.trim()) return;
    await fetch("/api/creator/bookmarks", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: id, collection }),
    });
    setSaved(true); setBookmarkOpen(false);
  }

  if (loading) return <div className="container-cine py-24 text-center text-white/50">…</div>;
  if (!data || data.error) return <div className="container-cine py-24 text-center text-white/60">{fa ? "پروفایل یافت نشد." : "Profile not found."}</div>;

  const t = data.talent;
  const isCreator = user?.role === "creator" || user?.role === "admin";

  // ---- PUBLIC PREVIEW (guest / player) ----
  if (data.access === "public_preview") {
    return (
      <div className="container-cine py-12">
        <div className="card mx-auto max-w-2xl overflow-hidden">
          <div className="relative aspect-[16/9] bg-charcoal-700">
            {t.profile_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.profile_photo} alt={t.full_name_persian} className="h-full w-full object-cover" />
            ) : <div className="flex h-full items-center justify-center font-display text-6xl text-gold/30">{t.full_name_persian?.charAt(0)}</div>}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal to-transparent" />
          </div>
          <div className="p-6 text-center">
            <h1 className="font-display text-2xl font-bold text-white">{t.full_name_persian}</h1>
            <p className="mt-1 text-gold">{t.primary_profession}</p>
            <p className="mt-1 text-sm text-white/55">{t.city}</p>
            <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm text-white/70">
              {fa ? "برای مشاهده پروفایل کامل، نمونه‌کارها و تماس، به‌عنوان سازنده فیلم وارد شوید." : "Sign in as a filmmaker to see the full profile, portfolio and contact."}
            </div>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/login?tab=creator" className="btn-primary">{fa ? "ورود سازنده" : "Filmmaker login"}</Link>
              <Link href="/register/creator" className="btn-ghost">{fa ? "ثبت‌نام" : "Register"}</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tierLabel = EXPERIENCE_LEVELS.find((e) => e.value === t.experience_level)?.label_fa ?? t.experience_level;

  // ---- CREATOR FULL ----
  return (
    <div className="container-cine py-10">
      <Link href="/talents" className="mb-4 inline-block text-sm text-white/50 hover:text-gold">← {fa ? "بازگشت به فهرست" : "Back to list"}</Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* main */}
        <div className="space-y-6">
          {/* hero */}
          <div className="card overflow-hidden">
            <div className="relative aspect-[21/9] bg-charcoal-700">
              {t.profile_photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.profile_photo} alt={t.full_name_persian} className="h-full w-full object-cover" />
              ) : <div className="flex h-full items-center justify-center font-display text-7xl text-gold/30">{t.full_name_persian?.charAt(0)}</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-transparent" />
              <div className="absolute bottom-4 start-5">
                <h1 className="font-display text-3xl font-bold text-white">{t.full_name_persian}</h1>
                <p className="text-gold">{t.primary_profession}{t.secondary_professions?.length ? ` · ${t.secondary_professions.join("، ")}` : ""}</p>
                <p dir="ltr" className="text-sm text-white/60">{t.full_name_latin}</p>
              </div>
              <span className="badge-gold absolute end-4 top-4">{tierLabel}</span>
            </div>
          </div>

          {/* video reel */}
          {t.media?.video_reel && (
            <section className="card p-5">
              <h2 className="mb-3 font-display text-lg font-semibold text-gold">{fa ? "ویدیو رزومه" : "Video Reel"}</h2>
              <video controls className="w-full rounded-lg" src={t.media.video_reel} />
            </section>
          )}

          {/* voice sample */}
          {t.media?.voice_sample && (
            <section className="card p-5">
              <h2 className="mb-3 font-display text-lg font-semibold text-gold">{fa ? "نمونه صدا" : "Voice Sample"}</h2>
              <audio controls className="w-full" src={t.media.voice_sample} />
            </section>
          )}

          {/* photo gallery */}
          {t.media?.portfolio_photos?.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 font-display text-lg font-semibold text-gold">{fa ? "گالری" : "Gallery"}</h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {t.media.portfolio_photos.map((ph: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={ph} alt="" className="aspect-square w-full rounded-lg object-cover" />
                ))}
              </div>
            </section>
          )}

          {/* professional info */}
          <section className="card space-y-5 p-6">
            <h2 className="font-display text-lg font-semibold text-gold">{fa ? "اطلاعات حرفه‌ای" : "Professional Info"}</h2>
            <InfoGrid rows={[
              [fa ? "سطح تجربه" : "Experience level", tierLabel],
              [fa ? "سال‌های تجربه" : "Years of experience", String(t.years_experience)],
              [fa ? "شهر / استان" : "City / Province", `${t.city}، ${t.province}`],
              [fa ? "جنسیت" : "Gender", t.gender],
              [fa ? "دسترس‌پذیری" : "Availability", t.availability],
              [fa ? "آمادگی سفر" : "Willing to travel", t.willing_to_travel ? (fa ? "بله" : "Yes") : (fa ? "خیر" : "No")],
              [fa ? "دستمزد روزانه" : "Daily rate", t.daily_rate || "—"],
              [fa ? "عضویت صنفی" : "Union", t.union_membership || "—"],
            ]} />
            {t.languages_spoken?.length > 0 && <Chips title={fa ? "زبان‌ها" : "Languages"} items={t.languages_spoken} />}
            {t.special_skills?.length > 0 && <Chips title={fa ? "مهارت‌های ویژه" : "Special skills"} items={t.special_skills} />}
            {t.education_training?.length > 0 && <Chips title={fa ? "تحصیلات" : "Education"} items={t.education_training} />}
            {t.education_detail && <Para title={fa ? "توضیح تحصیلات" : "Education detail"} text={t.education_detail} />}
            {t.awards && <Para title={fa ? "جوایز" : "Awards"} text={t.awards} />}
            {(t.physical_attributes?.height_cm || t.physical_attributes?.body_type) && (
              <InfoGrid rows={[
                [fa ? "قد" : "Height", t.physical_attributes.height_cm ? `${t.physical_attributes.height_cm} cm` : "—"],
                [fa ? "وزن" : "Weight", t.physical_attributes.weight_kg ? `${t.physical_attributes.weight_kg} kg` : "—"],
                [fa ? "رنگ چشم" : "Eye color", t.physical_attributes.eye_color || "—"],
                [fa ? "رنگ مو" : "Hair color", t.physical_attributes.hair_color || "—"],
                [fa ? "هیکل" : "Body type", t.physical_attributes.body_type || "—"],
              ]} />
            )}
            {t.notable_projects?.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-white/80">{fa ? "پروژه‌های مهم" : "Notable projects"}</p>
                <ul className="space-y-1 text-sm text-white/65">
                  {t.notable_projects.map((pr: any, i: number) => (
                    <li key={i}>• {pr.title} {pr.year ? `(${pr.year})` : ""} — {pr.role}{pr.production ? `، ${pr.production}` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-2 text-sm">
              {t.instagram && <a dir="ltr" href={t.instagram.startsWith("http") ? t.instagram : `https://instagram.com/${t.instagram.replace("@", "")}`} target="_blank" className="text-gold hover:underline">Instagram ↗</a>}
              {t.imdb_link && <a dir="ltr" href={t.imdb_link} target="_blank" className="text-gold hover:underline">IMDb ↗</a>}
              {t.website && <a dir="ltr" href={t.website} target="_blank" className="text-gold hover:underline">Website ↗</a>}
            </div>
          </section>
        </div>

        {/* sidebar actions */}
        <aside className="space-y-4">
          <div className="card sticky top-20 space-y-3 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">{fa ? "بازدید پروفایل" : "Profile views"}</span>
              <span className="font-semibold text-white">{(t.view_count || 0).toLocaleString("fa-IR")}</span>
            </div>

            {/* contact (phone gated) */}
            {phone ? (
              <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-center">
                <p className="text-xs text-white/60">{fa ? "شماره تماس" : "Phone"}</p>
                <p dir="ltr" className="mt-1 font-display text-lg font-bold text-gold">{phone}</p>
              </div>
            ) : (
              <button onClick={() => setContactOpen(true)} disabled={!isCreator} className="btn-crimson w-full">
                {fa ? "تماس با این استعداد" : "Contact this talent"}
              </button>
            )}
            <p className="text-center text-[11px] text-white/40">
              {fa ? "شماره تماس فقط پس از ارسال درخواست تماس نمایش داده می‌شود." : "Phone is revealed only after a contact request."}
            </p>

            {/* CV download (logged-in creators only) */}
            {t.media?.cv_pdf && (
              <a href={t.media.cv_pdf} download className="btn-ghost w-full">{fa ? "دانلود رزومه (PDF)" : "Download CV (PDF)"}</a>
            )}

            {/* bookmark */}
            {isCreator && (
              saved ? (
                <div className="rounded-lg bg-gold/10 py-2 text-center text-sm text-gold">{fa ? "ذخیره شد ✓" : "Saved ✓"}</div>
              ) : (
                <button onClick={() => setBookmarkOpen((s) => !s)} className="btn-ghost w-full">{fa ? "افزودن به مجموعه" : "Add to collection"}</button>
              )
            )}
            {bookmarkOpen && (
              <div className="space-y-2">
                <input className="input" placeholder={fa ? "نام مجموعه (مثلاً کست فیلم X)" : "Collection name"} value={collection} onChange={(e) => setCollection(e.target.value)} />
                <button onClick={saveBookmark} className="btn-primary btn-sm w-full">{fa ? "ذخیره" : "Save"}</button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* contact modal */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setContactOpen(false)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-white">{fa ? "ارسال درخواست تماس" : "Send contact request"}</h3>
            <p className="mt-1 text-sm text-white/55">{fa ? "با ارسال این درخواست، شماره تماس برای شما باز می‌شود و یک تماس از سقف ماهانه شما کسر خواهد شد." : "Sending this unlocks the phone and uses one of your monthly contacts."}</p>
            <textarea className="input mt-4 min-h-28" placeholder={fa ? "پیام شما به این استعداد…" : "Your message…"} value={message} onChange={(e) => setMessage(e.target.value)} />
            {contactErr && <p className="mt-2 text-sm text-crimson-light">{contactErr}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setContactOpen(false)} className="btn-ghost btn-sm">{fa ? "انصراف" : "Cancel"}</button>
              <button onClick={sendContact} disabled={sending} className="btn-crimson btn-sm">{sending ? "…" : (fa ? "ارسال" : "Send")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between border-b border-white/5 pb-1.5">
          <dt className="text-white/45">{k}</dt>
          <dd className="text-white/85">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
function Chips({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white/80">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => <span key={i} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">{i}</span>)}
      </div>
    </div>
  );
}
function Para({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-white/80">{title}</p>
      <p className="text-sm leading-7 text-white/65">{text}</p>
    </div>
  );
}
