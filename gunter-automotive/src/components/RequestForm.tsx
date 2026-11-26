"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fieldErrors, leadSchema, SERVICE_LABELS, SERVICE_OPTIONS } from "@/lib/validation";

type Status = "idle" | "submitting" | "error";
type Values = Record<string, string | boolean>;

const FIELD_ORDER = ["name", "phone", "email", "vehicleYear", "vehicleMake", "vehicleModel", "service", "description", "preferredDate", "consent"];
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  vehicleYear: "Vehicle year",
  vehicleMake: "Make",
  vehicleModel: "Model",
  service: "Service needed",
  description: "Describe what you need",
  preferredDate: "Preferred date",
  consent: "Contact consent",
};

function todayIso(offsetYears = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RequestForm({ defaultService }: { defaultService?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    name: "",
    phone: "",
    email: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    service: SERVICE_OPTIONS.includes(defaultService as never) ? (defaultService as string) : "",
    description: "",
    preferredDate: "",
    consent: false,
    marketingConsent: false,
    website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [dateBounds, setDateBounds] = useState<{ min?: string; max?: string }>({});
  const startedAt = useRef<number | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    idempotencyKey.current = crypto.randomUUID();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dates depend on the visitor's clock, so set after hydration
    setDateBounds({ min: todayIso(), max: todayIso(1) });
  }, []);

  const set = (name: string, value: string | boolean) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name] || ((name === "phone" || name === "email") && (errors.phone || errors.email))) {
      setErrors((e) => {
        const next = { ...e };
        delete next[name];
        if (name === "phone" || name === "email") {
          delete next.phone;
          delete next.email;
        }
        return next;
      });
    }
  };

  const payload = () => ({ ...values, startedAt: startedAt.current ?? undefined });

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return; // prevents double submission
    setFormError(null);

    const parsed = leadSchema.safeParse(payload());
    if (!parsed.success) return showErrors(fieldErrors(parsed.error));

    setStatus("submitting");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current ?? crypto.randomUUID() },
        body: JSON.stringify(payload()),
      });
      const data = (await res.json().catch(() => ({}))) as { receiptId?: string; mode?: string; fields?: Record<string, string>; message?: string };
      if (res.status === 201 && data.receiptId) {
        const qs = new URLSearchParams({ r: data.receiptId });
        if (data.mode === "demo") qs.set("demo", "1");
        router.push(`/thank-you?${qs.toString()}`);
        return; // keep the button disabled while navigating
      }
      setStatus("error");
      if (res.status === 400 && data.fields) return showErrors(data.fields);
      setFormError(
        res.status === 429
          ? data.message ?? "Too many requests. Please wait a few minutes and try again."
          : data.message ?? "Something went wrong and your request was not sent. Your details are still here, so please try again.",
      );
    } catch {
      setStatus("error");
      setFormError("We couldn't reach the server, so your request was not sent. Check your connection and try again. Your details are still here.");
    }
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  const errorList = FIELD_ORDER.filter((f) => errors[f]);
  const hasPhoneEmailError = Boolean(errors.phone && errors.email && errors.phone === errors.email);

  const fieldProps = (name: string, describedBy?: string) => ({
    id: name,
    name,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": [errors[name] ? `${name}-error` : null, describedBy].filter(Boolean).join(" ") || undefined,
  });

  const err = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className="field-error">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-8" aria-describedby="form-intro">
      <p id="form-intro" className="text-sm text-ink-muted">
        Fields marked <span aria-hidden>*</span>
        <span className="sr-only">with an asterisk</span> are required. This sends a request. It doesn&apos;t book an appointment or confirm a
        quote.
      </p>

      <div ref={summaryRef} tabIndex={-1} aria-live="assertive" className="outline-none">
        {(errorList.length > 0 || formError) && (
          <div className="rounded-card border-2 border-red-700 bg-red-50 p-4" role="alert">
            {formError ? (
              <p className="font-semibold text-red-900">{formError}</p>
            ) : (
              <>
                <p className="font-semibold text-red-900">Please fix {errorList.length === 1 ? "this field" : `these ${errorList.length} fields`}:</p>
                <ul className="mt-2 list-disc pl-5 text-red-900">
                  {errorList.map((f) => (
                    <li key={f}>
                      <a href={`#${f}`} className="underline">
                        {FIELD_LABELS[f]}: {errors[f]}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <fieldset className="space-y-4">
        <legend className="font-display text-xl font-bold text-brand">Your details</legend>
        <div>
          <label htmlFor="name" className="field-label">
            Name <span aria-hidden>*</span>
          </label>
          <input {...fieldProps("name")} className="field-input" autoComplete="name" required maxLength={100} value={values.name as string} onChange={(e) => set("name", e.target.value)} />
          {err("name")}
        </div>
        <p id="contact-hint" className="text-sm text-ink-muted">
          Give at least one way to reach you: phone, email, or both. <span aria-hidden>*</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="field-label">
              Phone
            </label>
            <input {...fieldProps("phone", "contact-hint")} className="field-input" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={values.phone as string} onChange={(e) => set("phone", e.target.value)} />
            {err("phone")}
          </div>
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              {...fieldProps("email", "contact-hint")}
              aria-describedby={[errors.email && !hasPhoneEmailError ? "email-error" : null, hasPhoneEmailError ? "phone-error" : null, "contact-hint"].filter(Boolean).join(" ")}
              className="field-input"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={values.email as string}
              onChange={(e) => set("email", e.target.value)}
            />
            {!hasPhoneEmailError && err("email")}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-xl font-bold text-brand">Your vehicle (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr_1fr]">
          <div>
            <label htmlFor="vehicleYear" className="field-label">
              Year
            </label>
            <input {...fieldProps("vehicleYear")} className="field-input" inputMode="numeric" maxLength={4} placeholder="e.g. 2018" value={values.vehicleYear as string} onChange={(e) => set("vehicleYear", e.target.value)} />
            {err("vehicleYear")}
          </div>
          <div>
            <label htmlFor="vehicleMake" className="field-label">
              Make
            </label>
            <input {...fieldProps("vehicleMake")} className="field-input" maxLength={40} placeholder="e.g. Toyota" value={values.vehicleMake as string} onChange={(e) => set("vehicleMake", e.target.value)} />
            {err("vehicleMake")}
          </div>
          <div>
            <label htmlFor="vehicleModel" className="field-label">
              Model
            </label>
            <input {...fieldProps("vehicleModel")} className="field-input" maxLength={60} placeholder="e.g. Camry" value={values.vehicleModel as string} onChange={(e) => set("vehicleModel", e.target.value)} />
            {err("vehicleModel")}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-xl font-bold text-brand">What you need</legend>
        <div>
          <label htmlFor="service" className="field-label">
            Service needed <span aria-hidden>*</span>
          </label>
          <select {...fieldProps("service")} className="field-input" required value={values.service as string} onChange={(e) => set("service", e.target.value)}>
            <option value="">Choose one…</option>
            {SERVICE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {SERVICE_LABELS[s]}
              </option>
            ))}
          </select>
          {err("service")}
        </div>
        <div>
          <label htmlFor="description" className="field-label">
            Describe what you need <span aria-hidden>*</span>
          </label>
          <p id="description-hint" className="mb-1 text-sm text-ink-muted">
            What are you noticing, when does it happen, and is anything urgent? Please don&apos;t include payment or ID details.
          </p>
          <textarea {...fieldProps("description", "description-hint")} className="field-input min-h-[8rem]" required maxLength={2000} rows={5} value={values.description as string} onChange={(e) => set("description", e.target.value)} />
          <div className="flex justify-between gap-4">
            {err("description")}
            <span className="ml-auto mt-1 text-xs text-ink-muted" aria-hidden>
              {(values.description as string).length}/2000
            </span>
          </div>
        </div>
        <div className="max-w-xs">
          <label htmlFor="preferredDate" className="field-label">
            Preferred date
          </label>
          <p id="date-hint" className="mb-1 text-sm text-ink-muted">
            Optional. This is a preference, not a confirmed appointment.
          </p>
          <input {...fieldProps("preferredDate", "date-hint")} className="field-input" type="date" min={dateBounds.min} max={dateBounds.max} value={values.preferredDate as string} onChange={(e) => set("preferredDate", e.target.value)} />
          {err("preferredDate")}
        </div>
      </fieldset>

      {/* Honeypot: hidden from people and assistive tech, attractive to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={values.website as string} onChange={(e) => set("website", e.target.value)} />
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Consent</legend>
        <div className="flex gap-3">
          <input
            {...fieldProps("consent")}
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-brand"
            checked={values.consent as boolean}
            onChange={(e) => set("consent", e.target.checked)}
          />
          <label htmlFor="consent" className="text-sm">
            I agree that the shop may contact me by phone or email about <strong>this request</strong>, and I&apos;ve read the{" "}
            <a href="/privacy" className="font-semibold text-amber-800 underline">
              privacy notice
            </a>
            . <span aria-hidden>*</span>
          </label>
        </div>
        <div className="pl-8">
          {err("consent")}
        </div>
        <div className="flex gap-3">
          <input id="marketingConsent" name="marketingConsent" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brand" checked={values.marketingConsent as boolean} onChange={(e) => set("marketingConsent", e.target.checked)} />
          <label htmlFor="marketingConsent" className="text-sm text-ink-muted">
            Optional: I&apos;d also like to receive occasional updates and offers. You can opt out at any time. This doesn&apos;t affect your request.
          </label>
        </div>
      </fieldset>

      <div>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status === "submitting"} aria-disabled={status === "submitting"}>
          {status === "submitting" ? "Sending your request…" : status === "error" && formError ? "Try again" : "Send service request"}
        </button>
        <p className="mt-3 text-sm text-ink-muted" role="status" aria-live="polite">
          {status === "submitting" ? "Sending your request. Please wait." : ""}
        </p>
      </div>
    </form>
  );
}
