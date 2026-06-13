// Shared API response helpers. Every error response carries BOTH a stable
// `error` key (for client-side i18n mapping) AND ready-to-show FA + EN messages
// (spec.ai_generation_rules: "All API responses must include both FA and EN
// error messages").

import { NextResponse } from "next/server";
import { dict } from "./i18n";

type ErrorKey = keyof typeof dict.errors;

export function fail(
  key: ErrorKey | string,
  status: number,
  extra?: Record<string, unknown>
): NextResponse {
  const entry = (dict.errors as Record<string, { fa: string; en: string } | undefined>)[key];
  const message = entry ?? dict.errors.server;
  return NextResponse.json(
    { ok: false, error: key, message: { fa: message.fa, en: message.en }, ...extra },
    { status }
  );
}

export function ok(data: Record<string, unknown> = {}, status = 200): NextResponse {
  return NextResponse.json({ ok: true, ...data }, { status });
}

// Absolute base URL for building email links / OAuth redirect URIs.
// Prefers the configured public URL; falls back to the request's own origin.
export function baseUrl(req: Request): string {
  const configured = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function dashboardPath(role: "player" | "creator" | "admin"): string {
  if (role === "admin") return "/admin";
  if (role === "creator") return "/dashboard/creator";
  return "/dashboard/player";
}
