"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

// ---------------- Language context (Persian RTL default) ----------------
type LangCtx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const LanguageContext = createContext<LangCtx | null>(null);

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <Providers>");
  return ctx;
}

// ---------------- Auth (session) context ----------------
export type SessionUser = {
  id: string;
  role: "player" | "creator" | "admin";
  fullName: string;
  email: string;
};

type AuthCtx = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <Providers>");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // sync <html> dir/lang attributes whenever language changes
  useEffect(() => {
    const dir = lang === "fa" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    try {
      localStorage.setItem("cc_lang", lang);
    } catch {}
  }, [lang]);

  // restore stored language on first mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cc_lang") as Lang | null;
      if (stored === "en" || stored === "fa") setLangState(stored);
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((p) => (p === "fa" ? "en" : "fa")), []);

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === "fa" ? "rtl" : "ltr", setLang, toggle }}>
      <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>
    </LanguageContext.Provider>
  );
}
