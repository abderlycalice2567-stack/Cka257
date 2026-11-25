import type { ReactNode } from "react";

export function AdminHeader({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {intro && <p className="mt-1 max-w-3xl text-sm text-muted">{intro}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const ok = typeof sp.ok === "string" ? sp.ok : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  if (!ok && !error) return null;
  return (
    <p role={error ? "alert" : "status"} className={`mb-6 rounded-xl border px-4 py-3 text-sm ${error ? "border-live/40 bg-live/10" : "border-gold/40 bg-gold/10"}`}>
      {error ?? ok}
    </p>
  );
}

export function Panel({ title, children, className = "", actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`card p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: string; tone?: "ok" | "warn" | "muted" }) {
  const color = tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "text-live" : "";
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${color}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "warn" | "gold" }) {
  const cls = {
    muted: "border-line text-muted",
    ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warn: "border-live/40 bg-live/10 text-live",
    gold: "border-gold/50 bg-gold/10 text-fg",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

export function Input({ name, label, defaultValue, type = "text", required, hint, placeholder, className = "" }: { name: string; label: string; defaultValue?: string | number | null; type?: string; required?: boolean; hint?: string; placeholder?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}{required && <span className="text-live"> *</span>}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? undefined} required={required} placeholder={placeholder} className="input" />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({ name, label, defaultValue, rows = 4, hint, className = "" }: { name: string; label: string; defaultValue?: string | null; rows?: number; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <textarea name={name} rows={rows} defaultValue={defaultValue ?? undefined} className="input" />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#D4AF37]" />
      {label}
    </label>
  );
}

/** English / French / Haitian Creole inputs for a translatable field. */
export function TrFields({ name, label, value, textarea, rows = 3, required }: { name: string; label: string; value?: Partial<Record<"en" | "fr" | "ht", string>> | null; textarea?: boolean; rows?: number; required?: boolean }) {
  const langs = [["en", "English"], ["fr", "Français"], ["ht", "Kreyòl"]] as const;
  return (
    <fieldset className="space-y-2">
      <legend className="label">{label}{required && <span className="text-live"> *</span>}</legend>
      <div className="grid gap-2 md:grid-cols-3">
        {langs.map(([l, n]) => (
          <label key={l} className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase text-muted">{n}</span>
            {textarea ? (
              <textarea name={`${name}_${l}`} rows={rows} defaultValue={value?.[l] ?? ""} className="input" />
            ) : (
              <input name={`${name}_${l}`} defaultValue={value?.[l] ?? ""} className="input" required={required && l === "en"} />
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Submit({ children, className = "btn-gold btn-sm" }: { children: ReactNode; className?: string }) {
  return <button type="submit" className={className}>{children}</button>;
}

export const STATUS_TONE: Record<string, "muted" | "ok" | "warn" | "gold"> = {
  published: "ok", approved: "ok", answered: "ok", active: "ok", succeeded: "ok",
  awaiting_review: "gold", pending: "gold", processing: "gold", scheduled: "muted", new: "gold",
  rejected: "warn", failed: "warn", cancelled: "warn", suspended: "warn", archived: "muted", draft: "muted",
};
