"use client";

import { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-navy-900">
        {label} {required && <span className="text-gold-700">*</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-slate">
          {hint}
        </p>
      )}
      <div className="mt-1.5" aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}>
        {children}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-navy-900 shadow-sm placeholder:text-slate/60 focus:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-500";

/** Visually-hidden honeypot field (F-07). Real users never see or fill it. */
export function Honeypot({ name = "company" }: { name?: string }) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
      <label htmlFor={name}>Ne pas remplir</label>
      <input id={name} name={name} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
