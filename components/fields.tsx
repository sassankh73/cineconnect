"use client";

import type { ReactNode } from "react";

// Reusable form primitives with consistent labels + Persian error display.

export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="ms-1 text-crimson-light">*</span>}
        {!required && <span className="ms-1 text-xs text-white/35">(اختیاری)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-white/40">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  error,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input ${error ? "input-error" : ""}`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | { value: string; label: string }[];
  placeholder?: string;
  error?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input ${error ? "input-error" : ""}`}
    >
      <option value="">{placeholder || "— انتخاب کنید —"}</option>
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )
      )}
    </select>
  );
}

export function CheckboxPills({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? "border-gold bg-gold/15 text-gold"
                : "border-white/15 bg-white/5 text-white/70 hover:border-white/30"
            }`}
          >
            {active ? "✓ " : ""}
            {o}
          </button>
        );
      })}
    </div>
  );
}
