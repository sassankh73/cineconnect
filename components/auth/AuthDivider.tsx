"use client";

import { useLang } from "@/app/providers";
import { dict } from "@/lib/i18n";

// "یا / OR" divider line used between the credentials form and OAuth buttons.
export function AuthDivider() {
  const { lang } = useLang();
  return (
    <div className="my-6 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-white/12" />
      <span className="text-xs uppercase tracking-wide text-white/40">
        {dict.auth.orContinueWith[lang]}
      </span>
      <span className="h-px flex-1 bg-white/12" />
    </div>
  );
}
