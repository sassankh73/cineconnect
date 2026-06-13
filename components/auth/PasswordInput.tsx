"use client";

import { useState } from "react";

// Password field with a show/hide toggle. Mirrors the styling of
// components/fields.tsx → TextInput.
export function PasswordInput({
  value,
  onChange,
  error,
  placeholder,
  autoComplete = "current-password",
  id,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={`input pe-11 ${error ? "input-error" : ""}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 end-0 flex items-center px-3 text-white/45 hover:text-gold"
        tabIndex={-1}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 4.24A9.1 9.1 0 0112 4c5 0 9 4 10 8a13.2 13.2 0 01-2.27 3.32M6.6 6.6A13.3 13.3 0 002 12c1 4 5 8 10 8a9.3 9.3 0 004.4-1.1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
