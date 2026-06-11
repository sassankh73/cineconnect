"use client";

import { useState } from "react";
import { useLang } from "../providers";
import { Reveal } from "@/components/Reveal";
import { Field, TextInput } from "@/components/fields";

export default function ContactPage() {
  const { lang } = useLang();
  const fa = lang === "fa";
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="container-cine py-16">
      <Reveal>
        <p className="eyebrow">{fa ? "تماس با ما" : "Contact"}</p>
        <h1 className="section-title">{fa ? "در ارتباط باشید" : "Get in touch"}</h1>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* form */}
        <Reveal>
          <div className="card p-8">
            {sent ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-2xl text-gold">✓</div>
                <p className="mt-4 text-white/80">{fa ? "پیام شما دریافت شد. به‌زودی پاسخ می‌دهیم." : "Your message was received. We'll respond soon."}</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
                <Field label={fa ? "نام" : "Name"} required>
                  <TextInput value={form.name} onChange={set("name")} required />
                </Field>
                <Field label={fa ? "ایمیل" : "Email"} required>
                  <TextInput type="email" value={form.email} onChange={set("email")} required />
                </Field>
                <Field label={fa ? "موضوع" : "Subject"} required>
                  <TextInput value={form.subject} onChange={set("subject")} required />
                </Field>
                <Field label={fa ? "پیام" : "Message"} required>
                  <textarea
                    className="input min-h-32"
                    value={form.message}
                    onChange={(e) => set("message")(e.target.value)}
                    required
                  />
                </Field>
                <button type="submit" className="btn-primary w-full">{fa ? "ارسال پیام" : "Send message"}</button>
              </form>
            )}
          </div>
        </Reveal>

        {/* info */}
        <Reveal delay={0.1}>
          <div className="space-y-4">
            {[
              { icon: "📍", t: fa ? "نشانی" : "Address", v: fa ? "تهران، خیابان ولیعصر، مجتمع سینمایی، طبقه ۳" : "Tehran, Valiasr St., Cinema Complex, 3rd floor" },
              { icon: "✆", t: fa ? "تلفن" : "Phone", v: "۰۲۱ - ۱۲۳۴ ۵۶۷۸" },
              { icon: "✉", t: fa ? "ایمیل" : "Email", v: "info@cineconnect.ir" },
            ].map((c) => (
              <div key={c.t} className="card flex items-center gap-4 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-lg text-gold">{c.icon}</span>
                <div>
                  <div className="text-xs text-white/50">{c.t}</div>
                  <div className="text-sm text-white/85">{c.v}</div>
                </div>
              </div>
            ))}
            <div className="card overflow-hidden">
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-charcoal-700 to-charcoal-800 text-sm text-white/40">
                {fa ? "نقشه (Google Map) — اختیاری" : "Map embed (Google Map) — optional"}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
