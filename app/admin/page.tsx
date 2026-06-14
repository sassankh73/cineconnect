"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, CreditCard, AlertTriangle, FileText,
  Bell, ShieldCheck, Film, LogOut, RefreshCw, X, Eye, EyeOff,
  Trash2, CheckCircle, XCircle, Mail, RotateCcw, Search,
  UserX, UserCheck, Key,
} from "@/components/icons";
import { useAuth } from "@/app/providers";

// ─── Types ──────────────────────────────────────────────────────────────────
interface AdminData {
  stats: {
    totalUsers: number; players: number; activePlayers: number;
    pendingReviewPlayers: number; suspendedPlayers: number;
    creators: number; pendingCreators: number; activeCreators: number;
    pendingPayments: number; openReports: number; totalSessions: number;
  };
  users: UserRow[];
  players: PlayerRow[];
  creators: CreatorRow[];
  pendingPayments: PaymentRow[];
  allPayments: PaymentRow[];
  reports: ReportRow[];
  auditLogs: AuditRow[];
}

interface UserRow {
  id: string; email: string; role: string; email_verified: boolean;
  is_active: boolean; last_login_at?: string; created_at: string;
  failed_login_attempts: number; lockout_until?: string;
  full_name_persian?: string; full_name_latin?: string; avatar_url?: string;
  provider?: string;
}

interface PlayerRow {
  id: string; userId: string; full_name_persian: string; full_name_latin: string;
  primary_profession: string; status: string; tier: number;
  view_count: number; created_at: string;
}

interface CreatorRow {
  id: string; userId: string; full_name: string; company?: string;
  role_title?: string; plan: string; contacts_used_this_month: number;
  created_at: string; email?: string; email_verified?: boolean;
  is_active?: boolean; last_login_at?: string;
  approval_status?: string;
  cinema_id_data?: string;
  cinema_id_filename?: string;
  cinema_id_uploaded_at?: string;
}

interface PaymentRow {
  id: string; playerId: string; tier: number; amount_toman: number;
  method: string; status: string; receipt_ref?: string;
  created_at: string; confirmed_at?: string;
  playerName?: string; playerTier?: number; playerEmail?: string;
}

interface ReportRow {
  id: string; playerId: string; reason: string; status: string; created_at: string;
}

interface AuditRow {
  id: string; userId?: string; action: string; detail: string;
  ip?: string; created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview",   label: "نمای کلی",       icon: LayoutDashboard },
  { key: "users",      label: "کاربران",          icon: Users },
  { key: "creators",   label: "سازندگان",         icon: Film },
  { key: "payments",   label: "پرداخت‌ها",        icon: CreditCard },
  { key: "moderation", label: "مدیریت پروفایل",   icon: AlertTriangle },
  { key: "reports",    label: "گزارش‌ها",          icon: FileText },
  { key: "audit",      label: "لاگ حسابرسی",      icon: ShieldCheck },
  { key: "notify",     label: "اطلاع‌رسانی",      icon: Bell },
] as const;

type Tab = (typeof TABS)[number]["key"];

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e", pending_payment: "#f59e0b", pending_review: "#3b82f6",
  suspended: "#ef4444", expired: "#6b7280",
};

const PLAN_COLORS: Record<string, string> = {
  free: "#6b7280", basic: "#3b82f6", pro: "#C9A84C",
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [notify, setNotify] = useState("");
  const [notifyTarget, setNotifyTarget] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [creatorSearch, setCreatorSearch] = useState("");

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ userId: string; email: string } | null>(null);
  const [newPw, setNewPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [cinemaIdModal, setCinemaIdModal] = useState<{ src: string; filename: string; name: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ creatorId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/admin/login");
  }, [user, authLoading, router]);

  // ── Load admin data ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin");
      if (!res.ok) { router.replace("/admin/login"); return; }
      setData(await res.json());
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => { if (user?.role === "admin") load(); }, [user, load]);

  // ── Generic action dispatcher ──────────────────────────────────────────────
  async function act(action: string, id?: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, ...extra }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionMsg(`خطا: ${json.error || "ناشناخته"}`);
      return false;
    }
    await load();
    return true;
  }

  // ── Change password ────────────────────────────────────────────────────────
  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModal) return;
    setPwLoading(true);
    try {
      const ok = await act("change_user_password", passwordModal.userId, { newPassword: newPw });
      if (ok) {
        setPasswordModal(null);
        setNewPw("");
        setActionMsg("رمز عبور با موفقیت تغییر کرد و جلسه‌های کاربر باطل شد.");
      }
    } finally {
      setPwLoading(false);
    }
  }

  if (authLoading || !user) return null;

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filteredUsers = (data?.users ?? []).filter((u) =>
    !userSearch ||
    u.email.includes(userSearch) ||
    (u.full_name_persian ?? "").includes(userSearch) ||
    (u.full_name_latin ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCreators = (data?.creators ?? []).filter((c) =>
    !creatorSearch ||
    (c.email ?? "").includes(creatorSearch) ||
    c.full_name.includes(creatorSearch) ||
    (c.company ?? "").includes(creatorSearch)
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ background: "#0D0D0D", color: "#fff", direction: "rtl" }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: "rgba(13,13,13,0.95)", borderColor: "rgba(201,168,76,0.15)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#8B1A1A,#C9A84C)" }}
          >
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold" style={{ color: "#C9A84C" }}>پنل مدیریت CineConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin" : ""}`} />
            بازخوانی
          </button>
          <button
            onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.replace("/admin/login"))}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(139,26,26,0.2)", color: "#ef4444" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            خروج
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-52px)]">
        {/* Sidebar */}
        <nav
          className="w-52 shrink-0 border-l flex flex-col gap-1 p-3 pt-4"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(26,26,46,0.3)" }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-right w-full transition-all"
              style={{
                background: tab === key ? "rgba(201,168,76,0.12)" : "transparent",
                color: tab === key ? "#C9A84C" : "rgba(255,255,255,0.45)",
                borderRight: tab === key ? "2px solid #C9A84C" : "2px solid transparent",
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Action feedback banner */}
          <AnimatePresence>
            {actionMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                {actionMsg}
                <button onClick={() => setActionMsg("")} className="mr-auto"><X className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingData && !data ? (
            <div className="flex items-center justify-center h-64 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              در حال بارگذاری…
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {tab === "overview" && data && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold" style={{ color: "#C9A84C" }}>نمای کلی</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { label: "کل کاربران",       value: data.stats.totalUsers,           color: "#C9A84C" },
                      { label: "بازیگران فعال",     value: data.stats.activePlayers,         color: "#22c55e" },
                      { label: "در انتظار تأیید",   value: data.stats.pendingReviewPlayers,  color: "#3b82f6" },
                      { label: "سازندگان",          value: data.stats.creators,              color: "#a78bfa" },
<<<<<<< HEAD
                      { label: "سازنده در انتظار",  value: data.stats.pendingCreators ?? 0,  color: "#f59e0b" },
=======
>>>>>>> a5c16ff1ac5df596fa852aecc90308462fbd669e
                      { label: "پرداخت معلق",       value: data.stats.pendingPayments,       color: "#f59e0b" },
                      { label: "گزارش‌های باز",     value: data.stats.openReports,           color: "#ef4444" },
                      { label: "تعلیقی",            value: data.stats.suspendedPlayers,      color: "#8B1A1A" },
                      { label: "جلسات فعال",        value: data.stats.totalSessions,         color: "#06b6d4" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-4"
                        style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent audit */}
                  <div className="rounded-xl p-4"
                    style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "#C9A84C" }}>آخرین رویدادها</h3>
                    <div className="space-y-1.5">
                      {data.auditLogs.slice(0, 8).map((l) => (
                        <div key={l.id} className="flex items-center gap-3 text-xs"
                          style={{ color: "rgba(255,255,255,0.5)" }}>
                          <span className="shrink-0 font-mono" style={{ color: "rgba(201,168,76,0.6)" }}>
                            {new Date(l.created_at).toLocaleString("fa-IR")}
                          </span>
                          <span className="font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{l.action}</span>
                          <span className="truncate">{l.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── USERS ── */}
              {tab === "users" && data && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold" style={{ color: "#C9A84C" }}>مدیریت کاربران</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>
                      {filteredUsers.length} کاربر
                    </span>
                  </div>

                  <div className="relative max-w-xs">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                      style={{ color: "rgba(255,255,255,0.3)" }} />
                    <input
                      value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="جستجوی ایمیل یا نام…"
                      className="w-full rounded-lg px-3 pr-9 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    />
                  </div>

                  <div className="overflow-x-auto rounded-xl"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "rgba(26,26,46,0.9)" }}>
                          {["ایمیل", "نقش", "وضعیت", "تأیید ایمیل", "آخرین ورود", "عملیات"].map((h) => (
                            <th key={h} className="px-4 py-3 text-right text-xs font-medium"
                              style={{ color: "rgba(255,255,255,0.4)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, i) => (
                          <tr key={u.id} style={{
                            background: i % 2 === 0 ? "rgba(26,26,46,0.4)" : "rgba(13,13,13,0.4)",
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                          }}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-xs"
                                style={{ direction: "ltr", color: "rgba(255,255,255,0.85)" }}>{u.email}</div>
                              {u.full_name_persian && (
                                <div className="text-xs mt-0.5"
                                  style={{ color: "rgba(255,255,255,0.4)" }}>{u.full_name_persian}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                background: u.role === "admin"
                                  ? "rgba(139,26,26,0.3)"
                                  : u.role === "creator" ? "rgba(167,139,250,0.2)" : "rgba(201,168,76,0.15)",
                                color: u.role === "admin" ? "#ef4444"
                                  : u.role === "creator" ? "#a78bfa" : "#C9A84C",
                              }}>
                                {u.role === "admin" ? "مدیر" : u.role === "creator" ? "سازنده" : "بازیگر"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-xs"
                                style={{ color: u.is_active ? "#22c55e" : "#ef4444" }}>
                                {u.is_active
                                  ? <CheckCircle className="w-3 h-3" />
                                  : <XCircle className="w-3 h-3" />}
                                {u.is_active ? "فعال" : "غیرفعال"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-center"
                              style={{ color: u.email_verified ? "#22c55e" : "#f59e0b" }}>
                              {u.email_verified ? "✓" : "✗"}
                            </td>
                            <td className="px-4 py-3 text-xs"
                              style={{ color: "rgba(255,255,255,0.35)", direction: "ltr" }}>
                              {u.last_login_at
                                ? new Date(u.last_login_at).toLocaleDateString("fa-IR") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                <ActionBtn icon={Eye} label="جزئیات" color="rgba(255,255,255,0.12)"
                                  onClick={() => setSelectedUser(u)} />
                                <ActionBtn icon={Key} label="رمز" color="rgba(201,168,76,0.2)"
                                  onClick={() => { setPasswordModal({ userId: u.id, email: u.email }); setNewPw(""); }} />
                                <ActionBtn
                                  icon={u.email_verified ? XCircle : Mail}
                                  label={u.email_verified ? "لغو تأیید" : "تأیید"}
                                  color={u.email_verified ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)"}
                                  onClick={() => act("toggle_email_verified", u.id, { value: !u.email_verified })}
                                />
                                {u.role !== "admin" && (
                                  <ActionBtn
                                    icon={u.is_active ? UserX : UserCheck}
                                    label={u.is_active ? "تعلیق" : "بازگشایی"}
                                    color={u.is_active ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}
                                    onClick={() => act(u.is_active ? "suspend_user" : "unsuspend_user", u.id)}
                                  />
                                )}
                                <ActionBtn icon={RotateCcw} label="خروج اجباری"
                                  color="rgba(239,68,68,0.15)"
                                  onClick={() => act("force_logout_user", u.id)} />
                                {u.role !== "admin" && (
                                  <ActionBtn icon={Trash2} label="حذف" color="rgba(139,26,26,0.3)"
                                    onClick={() => {
                                      if (confirm(`حذف حساب ${u.email}؟ این عمل برگشت‌پذیر نیست.`))
                                        act("delete_user", u.id);
                                    }} />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── CREATORS ── */}
              {tab === "creators" && data && (
<<<<<<< HEAD
                <div className="space-y-5">
=======
                <div className="space-y-4">
>>>>>>> a5c16ff1ac5df596fa852aecc90308462fbd669e
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold" style={{ color: "#C9A84C" }}>مدیریت سازندگان</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>
<<<<<<< HEAD
                      {data.creators.length} سازنده
                    </span>
                    {data.stats.pendingCreators > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                        {data.stats.pendingCreators} در انتظار تأیید
                      </span>
                    )}
                  </div>

                  {/* ── Pending creators section ── */}
                  {data.creators.filter((c) => c.approval_status === "pending").length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                        ⏳ در انتظار تأیید کارت سینمایی ({data.creators.filter((c) => c.approval_status === "pending").length})
                      </h3>
                      {data.creators.filter((c) => c.approval_status === "pending").map((c) => (
                        <div key={c.id}
                          className="rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4"
                          style={{ background: "rgba(26,26,46,0.7)", border: "1px solid rgba(245,158,11,0.3)" }}>
                          <div>
                            <div className="font-semibold text-sm" style={{ color: "#fff" }}>{c.full_name}</div>
                            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)", direction: "ltr" }}>
                              {c.email ?? "—"} {c.company ? `· ${c.company}` : ""}
                            </div>
                            {c.cinema_id_filename && (
                              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                                📎 {c.cinema_id_filename}
                                {c.cinema_id_uploaded_at && (
                                  <span className="mr-1">
                                    · {new Date(c.cinema_id_uploaded_at).toLocaleDateString("fa-IR")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {c.cinema_id_data && (
                              <button
                                onClick={() => setCinemaIdModal({
                                  src: c.cinema_id_data!,
                                  filename: c.cinema_id_filename ?? "cinema_id",
                                  name: c.full_name,
                                })}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}
                              >
                                👁 مشاهده مدرک
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                const ok = await act("approve_creator", c.id);
                                if (ok) setActionMsg(`حساب ${c.full_name} تأیید شد.`);
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e" }}
                            >
                              ✓ تأیید
                            </button>
                            <button
                              onClick={() => { setRejectModal({ creatorId: c.id, name: c.full_name }); setRejectReason(""); }}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}
                            >
                              ✗ رد
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Search + full table ── */}
=======
                      {filteredCreators.length} سازنده
                    </span>
                  </div>

>>>>>>> a5c16ff1ac5df596fa852aecc90308462fbd669e
                  <div className="relative max-w-xs">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                      style={{ color: "rgba(255,255,255,0.3)" }} />
                    <input
                      value={creatorSearch} onChange={(e) => setCreatorSearch(e.target.value)}
                      placeholder="جستجوی ایمیل، نام یا شرکت…"
                      className="w-full rounded-lg px-3 pr-9 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    />
                  </div>

                  <div className="overflow-x-auto rounded-xl"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "rgba(26,26,46,0.9)" }}>
<<<<<<< HEAD
                          {["نام", "ایمیل", "پلن", "تأیید مدارک", "وضعیت", "عملیات"].map((h) => (
=======
                          {["نام", "ایمیل", "پلن", "تماس‌ها", "وضعیت", "تأیید ایمیل", "عملیات"].map((h) => (
>>>>>>> a5c16ff1ac5df596fa852aecc90308462fbd669e
                            <th key={h} className="px-4 py-3 text-right text-xs font-medium"
                              style={{ color: "rgba(255,255,255,0.4)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCreators.map((c, i) => (
                          <tr key={c.id} style={{
                            background: i % 2 === 0 ? "rgba(26,26,46,0.4)" : "rgba(13,13,13,0.4)",
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                          }}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-xs"
                                style={{ color: "rgba(255,255,255,0.85)" }}>{c.full_name}</div>
                              {c.company && (
                                <div className="text-xs mt-0.5"
                                  style={{ color: "rgba(255,255,255,0.4)" }}>{c.company}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs"
                              style={{ direction: "ltr", color: "rgba(255,255,255,0.55)" }}>
                              {c.email || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                                background: `${PLAN_COLORS[c.plan] ?? "#6b7280"}22`,
                                color: PLAN_COLORS[c.plan] ?? "#6b7280",
                              }}>
                                {c.plan}
                              </span>
                            </td>
<<<<<<< HEAD
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                background: c.approval_status === "approved"
                                  ? "rgba(34,197,94,0.15)"
                                  : c.approval_status === "rejected" ? "rgba(239,68,68,0.15)"
                                  : c.approval_status === "pending" ? "rgba(245,158,11,0.15)"
                                  : "rgba(255,255,255,0.08)",
                                color: c.approval_status === "approved" ? "#22c55e"
                                  : c.approval_status === "rejected" ? "#ef4444"
                                  : c.approval_status === "pending" ? "#f59e0b"
                                  : "#9ca3af",
                              }}>
                                {c.approval_status === "approved" ? "✓ تأیید"
                                  : c.approval_status === "rejected" ? "✗ رد"
                                  : c.approval_status === "pending" ? "⏳ معلق"
                                  : "—"}
                              </span>
=======
                            <td className="px-4 py-3 text-xs text-center"
                              style={{ color: "rgba(255,255,255,0.55)" }}>
                              {c.contacts_used_this_month}
>>>>>>> a5c16ff1ac5df596fa852aecc90308462fbd669e
                            </td>
                            <td className="px-4 py-3 text-xs"
                              style={{ color: c.is_active ? "#22c55e" : "#ef4444" }}>
                              {c.is_active ? "فعال" : "غیرفعال"}
                            </td>
<<<<<<< HEAD
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                {c.cinema_id_data && (
                                  <ActionBtn icon={Eye} label="مدرک"
                                    color="rgba(59,130,246,0.2)"
                                    onClick={() => setCinemaIdModal({
                                      src: c.cinema_id_data!,
                                      filename: c.cinema_id_filename ?? "cinema_id",
                                      name: c.full_name,
                                    })} />
                                )}
                                {c.approval_status !== "approved" && (
                                  <ActionBtn icon={CheckCircle} label="تأیید"
                                    color="rgba(34,197,94,0.2)"
                                    onClick={() => act("approve_creator", c.id).then((ok) => {
                                      if (ok) setActionMsg(`حساب ${c.full_name} تأیید شد.`);
                                    })} />
                                )}
                                {c.approval_status !== "rejected" && (
                                  <ActionBtn icon={XCircle} label="رد"
                                    color="rgba(239,68,68,0.2)"
                                    onClick={() => { setRejectModal({ creatorId: c.id, name: c.full_name }); setRejectReason(""); }} />
                                )}
=======
                            <td className="px-4 py-3 text-xs text-center"
                              style={{ color: c.email_verified ? "#22c55e" : "#f59e0b" }}>
                              {c.email_verified ? "✓" : "✗"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                {/* Change plan inline */}
>>>>>>> a5c16ff1ac5df596fa852aecc90308462fbd669e
                                <select
                                  defaultValue={c.plan}
                                  onChange={(e) => act("change_creator_plan", c.id, { plan: e.target.value })}
                                  className="text-xs rounded px-2 py-1 outline-none"
                                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                                >
                                  <option value="free">free</option>
                                  <option value="basic">basic</option>
                                  <option value="pro">pro</option>
                                </select>
                                <ActionBtn icon={Key} label="رمز" color="rgba(201,168,76,0.2)"
                                  onClick={() => {
                                    setPasswordModal({ userId: c.userId, email: c.email ?? c.full_name });
                                    setNewPw("");
                                  }} />
                                <ActionBtn
                                  icon={c.is_active ? UserX : UserCheck}
                                  label={c.is_active ? "تعلیق" : "بازگشایی"}
                                  color={c.is_active ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}
                                  onClick={() => act(c.is_active ? "suspend_user" : "unsuspend_user", c.userId)}
                                />
                                <ActionBtn icon={RotateCcw} label="خروج اجباری"
                                  color="rgba(239,68,68,0.15)"
                                  onClick={() => act("force_logout_user", c.userId)} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── PAYMENTS ── */}
              {tab === "payments" && data && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold" style={{ color: "#C9A84C" }}>مدیریت پرداخت‌ها</h2>

                  {data.pendingPayments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: "#f59e0b" }}>
                        در انتظار تأیید ({data.pendingPayments.length})
                      </h3>
                      <div className="space-y-2">
                        {data.pendingPayments.map((p) => (
                          <div key={p.id}
                            className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                            style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(245,158,11,0.2)" }}>
                            <div>
                              <span className="font-medium text-sm"
                                style={{ color: "#fff" }}>{p.playerName || p.playerId}</span>
                              {p.playerEmail && (
                                <span className="text-xs mr-2"
                                  style={{ color: "rgba(255,255,255,0.4)", direction: "ltr" }}>{p.playerEmail}</span>
                              )}
                              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                                Tier {p.playerTier} · {p.amount_toman.toLocaleString()} تومان · {p.method === "bank_transfer" ? "کارت به کارت" : "درگاه"}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => act("confirm_payment", p.id)}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e" }}>
                                ✓ تأیید
                              </button>
                              <button onClick={() => act("reject_payment", p.id)}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                                ✗ رد
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2"
                      style={{ color: "rgba(255,255,255,0.5)" }}>تاریخچه پرداخت‌ها</h3>
                    <div className="overflow-x-auto rounded-xl"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: "rgba(26,26,46,0.9)" }}>
                            {["بازیگر", "مقدار", "روش", "وضعیت", "تاریخ"].map((h) => (
                              <th key={h} className="px-4 py-3 text-right text-xs font-medium"
                                style={{ color: "rgba(255,255,255,0.4)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(data.allPayments ?? data.pendingPayments).map((p, i) => (
                            <tr key={p.id} style={{
                              background: i % 2 === 0 ? "rgba(26,26,46,0.4)" : "rgba(13,13,13,0.4)",
                              borderTop: "1px solid rgba(255,255,255,0.04)",
                            }}>
                              <td className="px-4 py-2.5 text-xs"
                                style={{ color: "rgba(255,255,255,0.75)" }}>{p.playerName || p.playerId}</td>
                              <td className="px-4 py-2.5 text-xs"
                                style={{ color: "rgba(255,255,255,0.55)" }}>{p.amount_toman.toLocaleString()} ت</td>
                              <td className="px-4 py-2.5 text-xs"
                                style={{ color: "rgba(255,255,255,0.55)" }}>{p.method === "bank_transfer" ? "بانک" : "آنلاین"}</td>
                              <td className="px-4 py-2.5">
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                  background: p.status === "confirmed"
                                    ? "rgba(34,197,94,0.15)"
                                    : p.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                                  color: p.status === "confirmed" ? "#22c55e"
                                    : p.status === "rejected" ? "#ef4444" : "#f59e0b",
                                }}>
                                  {p.status === "confirmed" ? "تأیید" : p.status === "rejected" ? "رد" : "معلق"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs"
                                style={{ color: "rgba(255,255,255,0.35)", direction: "ltr" }}>
                                {new Date(p.created_at).toLocaleDateString("fa-IR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MODERATION ── */}
              {tab === "moderation" && data && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold" style={{ color: "#C9A84C" }}>مدیریت پروفایل بازیگران</h2>
                  <div className="overflow-x-auto rounded-xl"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "rgba(26,26,46,0.9)" }}>
                          {["نام", "حرفه", "Tier", "وضعیت", "بازدید", "عملیات"].map((h) => (
                            <th key={h} className="px-4 py-3 text-right text-xs font-medium"
                              style={{ color: "rgba(255,255,255,0.4)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.players.map((p, i) => (
                          <tr key={p.id} style={{
                            background: i % 2 === 0 ? "rgba(26,26,46,0.4)" : "rgba(13,13,13,0.4)",
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                          }}>
                            <td className="px-4 py-2.5 text-xs font-medium"
                              style={{ color: "rgba(255,255,255,0.85)" }}>{p.full_name_persian}</td>
                            <td className="px-4 py-2.5 text-xs"
                              style={{ color: "rgba(255,255,255,0.5)" }}>{p.primary_profession}</td>
                            <td className="px-4 py-2.5 text-xs text-center"
                              style={{ color: "#C9A84C" }}>{p.tier}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                background: `${STATUS_COLORS[p.status] ?? "#6b7280"}22`,
                                color: STATUS_COLORS[p.status] ?? "#6b7280",
                              }}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-center"
                              style={{ color: "rgba(255,255,255,0.4)" }}>{p.view_count}</td>
                            <td className="px-4 py-2.5">
                              {p.status !== "suspended" ? (
                                <ActionBtn icon={UserX} label="تعلیق" color="rgba(239,68,68,0.2)"
                                  onClick={() => act("suspend", p.id)} />
                              ) : (
                                <ActionBtn icon={UserCheck} label="بازگشایی" color="rgba(34,197,94,0.2)"
                                  onClick={() => act("unsuspend", p.id)} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── REPORTS ── */}
              {tab === "reports" && data && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold" style={{ color: "#C9A84C" }}>گزارش‌های کاربران</h2>
                  {data.reports.length === 0 ? (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>گزارشی وجود ندارد.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.reports.map((r) => (
                        <div key={r.id}
                          className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                          style={{
                            background: "rgba(26,26,46,0.6)",
                            border: `1px solid ${r.status === "open" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}`,
                          }}>
                          <div>
                            <div className="text-sm font-medium"
                              style={{ color: "rgba(255,255,255,0.8)" }}>{r.reason}</div>
                            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                              پروفایل: {r.playerId} · {new Date(r.created_at).toLocaleDateString("fa-IR")}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              background: r.status === "open" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                              color: r.status === "open" ? "#ef4444" : "#22c55e",
                            }}>
                              {r.status === "open" ? "باز" : r.status === "reviewed" ? "بررسی شد" : "رد شد"}
                            </span>
                            {r.status === "open" && (
                              <>
                                <ActionBtn icon={CheckCircle} label="حل شد" color="rgba(34,197,94,0.2)"
                                  onClick={() => act("resolve_report", r.id)} />
                                <ActionBtn icon={XCircle} label="رد" color="rgba(239,68,68,0.2)"
                                  onClick={() => act("dismiss_report", r.id)} />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── AUDIT LOG ── */}
              {tab === "audit" && data && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold" style={{ color: "#C9A84C" }}>لاگ حسابرسی</h2>
                  <div className="overflow-x-auto rounded-xl"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "rgba(26,26,46,0.9)" }}>
                          {["زمان", "اقدام", "جزئیات", "کاربر", "IP"].map((h) => (
                            <th key={h} className="px-4 py-3 text-right font-medium"
                              style={{ color: "rgba(255,255,255,0.4)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.auditLogs.map((l, i) => (
                          <tr key={l.id} style={{
                            background: i % 2 === 0 ? "rgba(26,26,46,0.4)" : "rgba(13,13,13,0.4)",
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                          }}>
                            <td className="px-4 py-2" style={{ color: "rgba(201,168,76,0.6)", direction: "ltr", whiteSpace: "nowrap" }}>
                              {new Date(l.created_at).toLocaleString("fa-IR")}
                            </td>
                            <td className="px-4 py-2 font-mono"
                              style={{ color: "rgba(255,255,255,0.7)" }}>{l.action}</td>
                            <td className="px-4 py-2"
                              style={{ color: "rgba(255,255,255,0.4)" }}>{l.detail}</td>
                            <td className="px-4 py-2 font-mono"
                              style={{ color: "rgba(255,255,255,0.35)", direction: "ltr" }}>
                              {l.userId?.slice(0, 8) || "—"}
                            </td>
                            <td className="px-4 py-2 font-mono"
                              style={{ color: "rgba(255,255,255,0.25)", direction: "ltr" }}>
                              {l.ip || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── NOTIFY ── */}
              {tab === "notify" && (
                <div className="space-y-4 max-w-lg">
                  <h2 className="text-lg font-bold" style={{ color: "#C9A84C" }}>ارسال اطلاعیه</h2>
                  <div className="rounded-xl p-5 space-y-4"
                    style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                        هدف (خالی = همه کاربران)
                      </label>
                      <input
                        value={notifyTarget} onChange={(e) => setNotifyTarget(e.target.value)}
                        placeholder="User ID (اختیاری)"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", direction: "ltr" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5"
                        style={{ color: "rgba(255,255,255,0.5)" }}>متن پیام</label>
                      <textarea
                        rows={4} value={notify} onChange={(e) => setNotify(e.target.value)}
                        placeholder="متن اطلاعیه…"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        const ok = await act("notify", undefined, {
                          message: notify, userId: notifyTarget || undefined,
                        });
                        if (ok) { setNotify(""); setNotifyTarget(""); setActionMsg("اطلاعیه ارسال شد."); }
                      }}
                      disabled={!notify.trim()}
                      className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        background: notify.trim()
                          ? "linear-gradient(135deg,#C9A84C,#8B1A1A)" : "rgba(255,255,255,0.08)",
                        color: notify.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                        cursor: notify.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      ارسال اطلاعیه
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── User Detail Modal ── */}
      <AnimatePresence>
        {selectedUser && (
          <Modal onClose={() => setSelectedUser(null)} title={`جزئیات: ${selectedUser.email}`}>
            <div className="space-y-3 text-sm">
              {([
                ["ID", selectedUser.id],
                ["ایمیل", selectedUser.email],
                ["نقش", selectedUser.role],
                ["نام فارسی", selectedUser.full_name_persian ?? "—"],
                ["نام لاتین", selectedUser.full_name_latin ?? "—"],
                ["Provider", selectedUser.provider ?? "credentials"],
                ["وضعیت حساب", selectedUser.is_active ? "فعال" : "غیرفعال"],
                ["تأیید ایمیل", selectedUser.email_verified ? "✓ تأیید شده" : "✗ تأیید نشده"],
                ["تلاش‌های ناموفق", String(selectedUser.failed_login_attempts)],
                ["قفل تا", selectedUser.lockout_until
                  ? new Date(selectedUser.lockout_until).toLocaleString("fa-IR") : "—"],
                ["آخرین ورود", selectedUser.last_login_at
                  ? new Date(selectedUser.last_login_at).toLocaleString("fa-IR") : "—"],
                ["ساخته شده", new Date(selectedUser.created_at).toLocaleString("fa-IR")],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-1.5 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                  <span style={{ direction: "ltr", color: "rgba(255,255,255,0.8)", wordBreak: "break-all" }}>{v}</span>
                </div>
              ))}

              <div className="flex gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => {
                    setPasswordModal({ userId: selectedUser.id, email: selectedUser.email });
                    setSelectedUser(null);
                    setNewPw("");
                  }}
                  className="flex-1 min-w-[120px] py-2 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
                >
                  تغییر رمز عبور
                </button>
                <button
                  onClick={() => {
                    act("toggle_email_verified", selectedUser.id, { value: !selectedUser.email_verified });
                    setSelectedUser(null);
                  }}
                  className="flex-1 min-w-[120px] py-2 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
                >
                  {selectedUser.email_verified ? "لغو تأیید ایمیل" : "تأیید ایمیل"}
                </button>
                <button
                  onClick={() => {
                    act("force_logout_user", selectedUser.id);
                    setSelectedUser(null);
                    setActionMsg("جلسه‌های کاربر باطل شد.");
                  }}
                  className="flex-1 min-w-[120px] py-2 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                >
                  خروج اجباری
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

<<<<<<< HEAD
      {/* ── Cinema ID Viewer Modal ── */}
      <AnimatePresence>
        {cinemaIdModal && (
          <Modal onClose={() => setCinemaIdModal(null)} title={`کارت سینمایی: ${cinemaIdModal.name}`}>
            <div className="space-y-4">
              {cinemaIdModal.src.startsWith("data:image") ? (
                <img
                  src={cinemaIdModal.src}
                  alt="Cinema ID"
                  className="w-full rounded-xl object-contain"
                  style={{ maxHeight: "60vh", background: "rgba(0,0,0,0.3)" }}
                />
              ) : cinemaIdModal.src.startsWith("data:application/pdf") ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{cinemaIdModal.filename}</p>
                  <a
                    href={cinemaIdModal.src}
                    download={cinemaIdModal.filename}
                    className="mt-3 inline-block text-xs px-4 py-2 rounded-lg"
                    style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C" }}
                  >
                    ⬇ دانلود PDF
                  </a>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>فایل قابل نمایش نیست.</p>
              )}
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>📎 {cinemaIdModal.filename}</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Reject Creator Modal ── */}
      <AnimatePresence>
        {rejectModal && (
          <Modal onClose={() => setRejectModal(null)} title={`رد مدارک: ${rejectModal.name}`}>
            <div className="space-y-4">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                دلیل رد را وارد کنید. این پیام برای سازنده ارسال می‌شود.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثال: تصویر کارت واضح نیست یا مدرک معتبر نمی‌باشد."
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setRejectModal(null)}
                  className="flex-1 py-2 rounded-lg text-sm"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await act("reject_creator", rejectModal.creatorId, { message: rejectReason });
                    if (ok) {
                      setActionMsg(`مدارک ${rejectModal.name} رد شد.`);
                      setRejectModal(null);
                    }
                  }}
                  className="flex-[2] py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "rgba(239,68,68,0.3)", color: "#ef4444" }}
                >
                  رد مدارک
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

=======
>>>>>>> a5c16ff1ac5df596fa852aecc90308462fbd669e
      {/* ── Change Password Modal ── */}
      <AnimatePresence>
        {passwordModal && (
          <Modal onClose={() => setPasswordModal(null)} title={`تغییر رمز: ${passwordModal.email}`}>
            <form onSubmit={handleChangePw} className="space-y-4">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                رمز جدید را وارد کنید. پس از ذخیره، تمام جلسه‌های فعال این کاربر باطل می‌شود.
              </p>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  required minLength={8}
                  value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="رمز جدید (حداقل ۸ کاراکتر)"
                  className="w-full rounded-lg px-4 pl-10 py-2.5 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    color: "#fff", direction: "ltr",
                  }}
                />
                <button type="button" onClick={() => setShowNewPw((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPasswordModal(null)}
                  className="flex-1 py-2 rounded-lg text-sm"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                  انصراف
                </button>
                <button type="submit" disabled={pwLoading || newPw.length < 8}
                  className="flex-[2] py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: newPw.length >= 8
                      ? "linear-gradient(135deg,#C9A84C,#8B1A1A)" : "rgba(255,255,255,0.08)",
                    color: newPw.length >= 8 ? "#fff" : "rgba(255,255,255,0.3)",
                    cursor: newPw.length >= 8 ? "pointer" : "not-allowed",
                  }}>
                  {pwLoading ? "در حال تغییر…" : "ذخیره رمز"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ActionBtn({
  icon: Icon, label, color, onClick,
}: {
  icon: React.ElementType; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
      style={{ background: color, color: "#fff", whiteSpace: "nowrap" }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

function Modal({
  onClose, title, children,
}: {
  onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
        style={{ background: "#1A1A2E", border: "1px solid rgba(201,168,76,0.2)", direction: "rtl" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-sm" style={{ color: "#C9A84C" }}>{title}</h3>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.3)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
