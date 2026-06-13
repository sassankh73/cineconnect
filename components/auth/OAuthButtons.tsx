"use client";

import { useLang } from "@/app/providers";
import { dict } from "@/lib/i18n";

// Social sign-in buttons (Google / Apple / Microsoft) with official-style
// branding. Each links to the server-side OAuth start route; providers that
// aren't configured degrade gracefully (the route redirects back with a
// friendly "not configured" message).
type Provider = "google" | "apple" | "microsoft";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true" fill="#fff">
    <path d="M13.36 9.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.18-1.54 2.67-.39 6.62 1.1 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.15.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.29-.88-2.31-3.49zM11.2 3.04c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.69-.92 2.69.97.08 1.97-.49 2.58-1.22z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path fill="#F25022" d="M0 0h7.6v7.6H0z" />
    <path fill="#7FBA00" d="M8.4 0H16v7.6H8.4z" />
    <path fill="#00A4EF" d="M0 8.4h7.6V16H0z" />
    <path fill="#FFB900" d="M8.4 8.4H16V16H8.4z" />
  </svg>
);

const PROVIDERS: { id: Provider; label: string; icon: () => JSX.Element }[] = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "apple", label: "Apple", icon: AppleIcon },
  { id: "microsoft", label: "Microsoft", icon: MicrosoftIcon },
];

export function OAuthButtons() {
  const { lang } = useLang();
  return (
    <div className="space-y-2.5">
      {PROVIDERS.map(({ id, label, icon: Icon }) => (
        <a
          key={id}
          href={`/api/auth/oauth/${id}`}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-white/35 hover:bg-white/[0.06]"
        >
          <Icon />
          <span>
            {dict.auth.continueWith[lang]} {label}
          </span>
        </a>
      ))}
    </div>
  );
}
