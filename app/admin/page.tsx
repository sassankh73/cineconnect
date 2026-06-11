"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useLang } from "@/app/providers";

export default function AdminPanel() {
  const { lang } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();
  const fa = lang === "fa";

  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("overview");
  const [notifyMsg, setNotifyMsg] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/login");
  }, [loading, user, router]);

  const load = useCallback(() => {
    fetch("/api/admin").then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(action: string, id?: string, extra: Record<string, any> = {}) {
    await fetch("/api/admin/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, ...extra }) });
    load();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ users: data.users, players: data.players, payments: data.pendingPayments }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "cineconnect-export.json"; a.click();
  }

  if (loading || !data) return <div className="container-cine py-24 text-center text-white/50">…</div>;
  if (data.error) return <div className="container-cine py-24 text-center text-crimson-light">{fa ? "دسترسی غیرمجاز" : "Forbidden"}</div>;

  const tabs = [
    { id: "overview", fa: "نمای کلی", en: "Overview" },
    { id: "users", fa: "کاربران", en: "Users" },
    { id: "payments", fa: "پرداخت‌ها", en: "Payments" },
    { id: "moderation", fa: "تعدیل پروفایل", en: "Moderation" },
    { id: "reports", fa: "گزارش‌ها", en: "Reports" },
    { id: "audit", fa: "گزارش حسابرسی", en: "Audit log" },
    { id: "notify", fa: "اعلان سیستم", en: "Notify" },
  ];

  return (
    <div className="container-cine py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">{fa ? "پنل مدیریت" : "Admin Panel"}</h1>
        <button onClick={exportData} className="btn-ghost btn-sm">{fa ? "خروجی داده" : "Export data"}</button>
      </div>

      {/* stat strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          [fa ? "بازیگران" : "Players", data.stats.players],
          [fa ? "فعال" : "Active", data.stats.activePlayers],
          [fa ? "سازندگان" : "Creators", data.stats.creators],
          [fa ? "پرداخت معلق" : "Pending pay", data.stats.pendingPayments],
          [fa ? "گزارش باز" : "Open reports", data.stats.openReports],
        ].map(([l, v]) => (
          <div key={l as string} className="card p-4">
            <div className="font-display text-2xl font-bold text-gold">{(v as number).toLocaleString("fa-IR")}</div>
            <div className="text-xs text-white/55">{l as string}</div>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/8">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`whitespace-nowrap px-4 py-2.5 text-sm transition ${tab === tb.id ? "border-b-2 border-gold text-gold" : "text-white/55 hover:text-white"}`}>
            {fa ? tb.fa : tb.en}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card p-6 text-sm leading-7 text-white/70">
          {fa ? "از این پنل می‌توانید کاربران، پرداخت‌ها، تعدیل پروفایل‌ها، گزارش‌ها و گزارش حسابرسی را مدیریت کنید." : "Manage users, payments, moderation, reports and the audit log from this panel."}
        </div>
      )}

      {tab === "users" && (
        <Table head={[fa ? "نام/ایمیل" : "Name/Email", fa ? "نقش" : "Role", fa ? "تأیید ایمیل" : "Verified", fa ? "تاریخ" : "Date"]}>
          {data.users.map((u: any) => (
            <tr key={u.id} className="border-b border-white/5">
              <td className="px-3 py-2.5 text-white/85">{u.email}</td>
              <td className="px-3 py-2.5"><span className="badge-gold">{u.role}</span></td>
              <td className="px-3 py-2.5 text-white/60">{u.email_verified ? "✓" : "—"}</td>
              <td className="px-3 py-2.5 text-white/50">{new Date(u.created_at).toLocaleDateString("fa-IR")}</td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "payments" && (
        <Table head={[fa ? "بازیگر" : "Player", fa ? "سطح" : "Tier", fa ? "مبلغ" : "Amount", fa ? "روش" : "Method", fa ? "اقدام" : "Action"]}>
          {data.pendingPayments.length === 0 ? (
            <tr><td colSpan={5} className="px-3 py-8 text-center text-white/50">{fa ? "پرداخت معلقی وجود ندارد." : "No pending payments."}</td></tr>
          ) : data.pendingPayments.map((p: any) => (
            <tr key={p.id} className="border-b border-white/5">
              <td className="px-3 py-2.5 text-white/85">{p.playerName}</td>
              <td className="px-3 py-2.5">Tier {p.tier}</td>
              <td className="px-3 py-2.5 text-gold">{p.amount_toman?.toLocaleString("fa-IR")}</td>
              <td className="px-3 py-2.5 text-white/60">{p.method === "bank_transfer" ? (fa ? "کارت به کارت" : "Bank") : (fa ? "آنلاین" : "Online")}</td>
              <td className="px-3 py-2.5">
                <div className="flex gap-2">
                  <button onClick={() => act("confirm_payment", p.id)} className="rounded bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30">{fa ? "تأیید" : "Confirm"}</button>
                  <button onClick={() => act("reject_payment", p.id)} className="rounded bg-crimson/20 px-3 py-1 text-xs text-crimson-light hover:bg-crimson/30">{fa ? "رد" : "Reject"}</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "moderation" && (
        <Table head={[fa ? "بازیگر" : "Player", fa ? "حرفه" : "Profession", fa ? "وضعیت" : "Status", fa ? "اقدام" : "Action"]}>
          {data.players.map((p: any) => (
            <tr key={p.id} className="border-b border-white/5">
              <td className="px-3 py-2.5 text-white/85">{p.full_name_persian}</td>
              <td className="px-3 py-2.5 text-white/60">{p.primary_profession}</td>
              <td className="px-3 py-2.5"><span className={p.status === "active" ? "text-emerald-400" : p.status === "suspended" ? "text-crimson-light" : "text-amber-300"}>{p.status}</span></td>
              <td className="px-3 py-2.5">
                {p.status === "suspended" ? (
                  <button onClick={() => act("unsuspend", p.id)} className="rounded bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">{fa ? "رفع تعلیق" : "Unsuspend"}</button>
                ) : (
                  <button onClick={() => act("suspend", p.id)} className="rounded bg-crimson/20 px-3 py-1 text-xs text-crimson-light">{fa ? "تعلیق فوری" : "Suspend"}</button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "reports" && (
        <Table head={[fa ? "بازیگر" : "Player", fa ? "دلیل" : "Reason", fa ? "وضعیت" : "Status", fa ? "اقدام" : "Action"]}>
          {data.reports.length === 0 ? (
            <tr><td colSpan={4} className="px-3 py-8 text-center text-white/50">{fa ? "گزارشی وجود ندارد." : "No reports."}</td></tr>
          ) : data.reports.map((r: any) => (
            <tr key={r.id} className="border-b border-white/5">
              <td className="px-3 py-2.5 text-white/85">{r.playerId}</td>
              <td className="px-3 py-2.5 text-white/60">{r.reason}</td>
              <td className="px-3 py-2.5 text-white/60">{r.status}</td>
              <td className="px-3 py-2.5">{r.status === "open" && <button onClick={() => act("resolve_report", r.id)} className="rounded bg-gold/20 px-3 py-1 text-xs text-gold">{fa ? "بررسی شد" : "Resolve"}</button>}</td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "audit" && (
        <Table head={[fa ? "اقدام" : "Action", fa ? "جزئیات" : "Detail", "IP", fa ? "زمان" : "Time"]}>
          {data.auditLogs.map((a: any) => (
            <tr key={a.id} className="border-b border-white/5">
              <td className="px-3 py-2.5 text-gold">{a.action}</td>
              <td className="px-3 py-2.5 text-white/70">{a.detail}</td>
              <td className="px-3 py-2.5 text-white/40" dir="ltr">{a.ip}</td>
              <td className="px-3 py-2.5 text-white/50">{new Date(a.created_at).toLocaleString("fa-IR")}</td>
            </tr>
          ))}
        </Table>
      )}

      {tab === "notify" && (
        <div className="card max-w-lg p-6">
          <h3 className="font-display text-lg font-semibold text-white">{fa ? "ارسال اعلان به همه کاربران" : "Broadcast notification"}</h3>
          <textarea className="input mt-4 min-h-28" value={notifyMsg} onChange={(e) => setNotifyMsg(e.target.value)} placeholder={fa ? "متن اعلان…" : "Notification text…"} />
          <button onClick={() => { if (notifyMsg.trim()) { act("notify", undefined, { message: notifyMsg }); setNotifyMsg(""); } }} className="btn-primary mt-3">{fa ? "ارسال" : "Send"}</button>
        </div>
      )}
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b border-white/10 text-start text-xs text-white/50">
            {head.map((h) => <th key={h} className="px-3 py-3 text-start font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
