"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { business } from "@/config/business";
import { FREQUENCY_OPTIONS, LIMITS, SERVICE_OPTIONS, YARD_SIZE_OPTIONS, validateLead, type FieldErrors, type LeadInput } from "@/lib/leads/schema";

type Values = {
  name: string;
  phone: string;
  email: string;
  service: string;
  description: string;
  zip: string;
  yardSize: string;
  frequency: string;
  accessNotes: string;
  preferredDate: string;
  consent: boolean;
  marketingConsent: boolean;
  website: string;
};

const EMPTY: Values = { name: "", phone: "", email: "", service: "", description: "", zip: "", yardSize: "", frequency: "", accessNotes: "", preferredDate: "", consent: false, marketingConsent: false, website: "" };

const FIELD_ORDER: (keyof Values)[] = ["name", "phone", "email", "service", "description", "zip", "yardSize", "frequency", "preferredDate", "accessNotes", "consent"];
const FIELD_LABELS: Partial<Record<keyof Values, string>> = { name: "Name", phone: "Phone", email: "Email", service: "Service", description: "Description", zip: "ZIP code", yardSize: "Yard size", frequency: "Frequency", preferredDate: "Preferred date", accessNotes: "Access notes", consent: "Contact consent" };

function uuid(): string {
  // randomUUID needs a secure context (HTTPS/localhost); fall back for plain-HTTP LAN testing.
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function RequestForm({ demo, initialService }: { demo: boolean; initialService?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ ...EMPTY, service: initialService ?? "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [formError, setFormError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  // One key per form fill: retries after a failure reuse it, so the server never stores a duplicate.
  const idempotencyKey = useRef<string>("");
  const startedAt = useRef<number>(0);

  useEffect(() => {
    idempotencyKey.current = uuid();
    startedAt.current = Date.now();
    // Set the date picker's minimum to "today" in the visitor's timezone (client-only to avoid hydration mismatch).
    const d = new Date();
    if (dateRef.current) dateRef.current.min = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const payload = (v: Values): LeadInput => ({
    ...v,
    service: v.service as LeadInput["service"],
    yardSize: v.yardSize as LeadInput["yardSize"],
    frequency: v.frequency as LeadInput["frequency"],
    consent: v.consent as true,
    idempotencyKey: idempotencyKey.current || "00000000-0000-4000-8000-000000000000",
    elapsedMs: startedAt.current ? Date.now() - startedAt.current : undefined,
  });

  const clientErrors = (v: Values) => {
    const r = validateLead(payload(v));
    return r.ok ? {} : r.errors;
  };

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key] || showSummary) {
      const e = clientErrors(next);
      setErrors((prev) => {
        const merged = { ...prev, [key]: e[key as keyof FieldErrors] };
        // Phone/email are validated together.
        if (key === "phone" || key === "email") {
          merged.phone = e.phone;
          merged.email = e.email;
        }
        return merged;
      });
    }
  }

  function blur(key: keyof Values) {
    setTouched((t) => ({ ...t, [key]: true }));
    const e = clientErrors(values);
    setErrors((prev) => ({ ...prev, [key]: e[key as keyof FieldErrors] }));
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (status === "submitting") return; // prevent double submits
    const e = clientErrors(values);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      setShowSummary(true);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    setShowSummary(false);
    setFormError("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(values)) });
      const body = (await res.json().catch(() => ({}))) as { receipt?: string; demo?: boolean; error?: string; fieldErrors?: FieldErrors };
      if (res.status === 201 && body.receipt) {
        router.push(`/thank-you?r=${encodeURIComponent(body.receipt)}`);
        return;
      }
      if (res.status === 400 && body.fieldErrors) {
        setErrors(body.fieldErrors);
        setShowSummary(true);
        setStatus("idle");
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }
      setFormError(body.error || "Something went wrong sending your request. Please try again.");
      setStatus("error");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again — your answers are still here.");
      setStatus("error");
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  const errorList = FIELD_ORDER.filter((k) => errors[k as keyof FieldErrors]);
  const submitting = status === "submitting";

  return (
    <form noValidate onSubmit={onSubmit} aria-describedby="form-intro" className="space-y-8">
      {demo && (
        <div role="note" className="rounded-card border-2 border-dashed border-pine bg-tan-light p-4 text-pine-ink">
          <p className="font-heading font-bold">Demo mode</p>
          <p className="mt-1 text-sm">This prototype isn&apos;t connected to a database or email. You can try the form, but nothing you enter will be saved or sent to anyone.</p>
        </div>
      )}

      <p id="form-intro" className="text-muted">
        Fields marked <span aria-hidden="true">*</span>
        <span className="sr-only">required</span> are required. Give at least a phone number or an email.
      </p>

      {showSummary && errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="error-summary-title" className="rounded-card border-2 border-red-700 bg-red-50 p-4 text-red-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-700/40">
          <h2 id="error-summary-title" className="font-heading font-bold">
            Please fix {errorList.length === 1 ? "1 problem" : `${errorList.length} problems`} before sending
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorList.map((k) => (
              <li key={k}>
                <a href={`#field-${k}`} className="underline">
                  {FIELD_LABELS[k]}: {errors[k as keyof FieldErrors]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="font-heading text-xl font-bold text-pine-ink">Your details</legend>
        <Field id="name" label="Name" required error={errors.name}>
          <input {...common("name")} type="text" autoComplete="name" maxLength={LIMITS.name} value={values.name} onChange={(e) => update("name", e.target.value)} onBlur={() => blur("name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="phone" label="Phone" hint="Phone or email required" error={errors.phone}>
            <input {...common("phone")} type="tel" autoComplete="tel" inputMode="tel" maxLength={LIMITS.phone} value={values.phone} onChange={(e) => update("phone", e.target.value)} onBlur={() => blur("phone")} />
          </Field>
          <Field id="email" label="Email" hint="Phone or email required" error={errors.email}>
            <input {...common("email")} type="email" autoComplete="email" maxLength={LIMITS.email} value={values.email} onChange={(e) => update("email", e.target.value)} onBlur={() => blur("email")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-heading text-xl font-bold text-pine-ink">About the job</legend>
        <Field id="service" label="Service" required error={errors.service}>
          <select {...common("service")} value={values.service} onChange={(e) => update("service", e.target.value)} onBlur={() => blur("service")}>
            <option value="">Choose a service…</option>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="description" label="Describe what you need" required hint={`A sentence or two about your yard and what you'd like done (max ${LIMITS.description} characters).`} error={errors.description}>
          <textarea {...common("description")} rows={5} maxLength={LIMITS.description} value={values.description} onChange={(e) => update("description", e.target.value)} onBlur={() => blur("description")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="zip" label="Property ZIP code" error={errors.zip}>
            <input {...common("zip")} type="text" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={values.zip} onChange={(e) => update("zip", e.target.value.replace(/\D/g, ""))} onBlur={() => blur("zip")} />
          </Field>
          <Field id="yardSize" label="Yard size" error={errors.yardSize}>
            <select {...common("yardSize")} value={values.yardSize} onChange={(e) => update("yardSize", e.target.value)}>
              <option value="">Select…</option>
              {YARD_SIZE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="frequency" label="How often?" error={errors.frequency}>
            <select {...common("frequency")} value={values.frequency} onChange={(e) => update("frequency", e.target.value)}>
              <option value="">Select…</option>
              {FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field id="preferredDate" label="Preferred start date" hint="This is a preference only — it is not a booking." error={errors.preferredDate}>
          <input {...common("preferredDate")} ref={dateRef} type="date" value={values.preferredDate} onChange={(e) => update("preferredDate", e.target.value)} onBlur={() => blur("preferredDate")} className={`${inputClass} sm:max-w-xs`} />
        </Field>
        <Field id="accessNotes" label="Access notes" hint="Gate codes, pets, parking — anything that helps. Please don't include passwords or payment details." error={errors.accessNotes}>
          <textarea {...common("accessNotes")} rows={3} maxLength={LIMITS.accessNotes} value={values.accessNotes} onChange={(e) => update("accessNotes", e.target.value)} onBlur={() => blur("accessNotes")} />
        </Field>
      </fieldset>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="field-website">Website</label>
        <input id="field-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))} />
      </div>

      <fieldset className="space-y-4">
        <legend className="font-heading text-xl font-bold text-pine-ink">Consent</legend>
        <div>
          <div className="flex items-start gap-3">
            <input
              id="field-consent"
              type="checkbox"
              checked={values.consent}
              onChange={(e) => update("consent", e.target.checked)}
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? "error-consent" : undefined}
              className="mt-1 h-6 w-6 shrink-0 accent-pine"
            />
            <label htmlFor="field-consent" className="text-pine-ink">
              I agree that {business.name} may contact me by phone or email about this request. <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span> See our{" "}
              <Link href="/privacy" className="text-pine underline underline-offset-2">
                privacy notice
              </Link>
              .
            </label>
          </div>
          {errors.consent && (
            <p id="error-consent" className="mt-2 text-sm font-semibold text-red-800">
              {errors.consent}
            </p>
          )}
        </div>
        <div className="flex items-start gap-3">
          <input id="field-marketingConsent" type="checkbox" checked={values.marketingConsent} onChange={(e) => update("marketingConsent", e.target.checked)} className="mt-1 h-6 w-6 shrink-0 accent-pine" />
          <label htmlFor="field-marketingConsent" className="text-pine-ink">
            Optional: I&apos;d also like occasional updates about seasonal services. You can say no and still send this request.
          </label>
        </div>
      </fieldset>

      <div ref={statusRef} tabIndex={-1} aria-live="polite" className="focus:outline-none">
        {status === "error" && formError && (
          <div role="alert" className="rounded-card border-2 border-red-700 bg-red-50 p-4 text-red-900">
            <p className="font-semibold">{formError}</p>
            <p className="mt-1 text-sm">Your answers are still filled in. Use the button below to try again.</p>
          </div>
        )}
        {submitting && <p className="sr-only">Sending your request…</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={submitting} aria-disabled={submitting} className="inline-flex min-h-touch items-center justify-center rounded-card bg-pine px-8 py-3 font-heading text-lg font-bold text-white hover:bg-pine-dark disabled:cursor-wait disabled:opacity-70">
          {submitting ? "Sending…" : status === "error" ? "Try again" : "Request lawn service"}
        </button>
        <p className="text-sm text-muted">Sending this form is a request only. It doesn&apos;t book an appointment or confirm a price.</p>
      </div>
    </form>
  );

  function common(key: keyof Values) {
    const err = errors[key as keyof FieldErrors];
    const describedBy = [`hint-${key}`, err ? `error-${key}` : ""].filter(Boolean).join(" ");
    return {
      id: `field-${key}`,
      name: key,
      "aria-invalid": err ? true : undefined,
      "aria-describedby": describedBy,
      "aria-required": key === "name" || key === "service" || key === "description" ? true : undefined,
      className: inputClass,
    } as const;
  }
}

const inputClass =
  "block w-full min-h-touch rounded-card border-2 border-pine/30 bg-white px-4 py-2 text-base text-pine-ink placeholder:text-muted focus:border-pine aria-[invalid=true]:border-red-700";

function Field({ id, label, required, hint, error, children }: { id: string; label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={`field-${id}`} className="block font-heading font-semibold text-pine-ink">
        {label}
        {required && (
          <>
            {" "}
            <span aria-hidden="true">*</span>
          </>
        )}
      </label>
      <p id={`hint-${id}`} className={hint ? "mt-1 text-sm text-muted" : "sr-only"}>
        {hint ?? ""}
      </p>
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`error-${id}`} className="mt-2 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
