"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LIMITS, SERVICE_OPTIONS, validateLead, type FieldErrors, type LeadField } from "@/lib/leads/schema";
import { track } from "@/lib/track";

type Props = {
  /** True when no backend is configured: the form validates but nothing is stored or sent. */
  demo: boolean;
  /** Server-generated key so a double-click or retry can never create two leads. */
  idempotencyKey: string;
  today: string;
  defaultService?: string;
  /** Error carried back from a no-JavaScript form post. */
  initialError?: string | null;
  businessName: string;
};

const FIELD_ORDER: LeadField[] = ["name", "phone", "email", "service", "description", "vehicleYear", "vehicleMake", "vehicleModel", "preferredDate", "consent"];

const FIELD_LABELS: Partial<Record<LeadField, string>> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  service: "Service",
  description: "What are you noticing?",
  vehicleYear: "Year",
  vehicleMake: "Make",
  vehicleModel: "Model",
  preferredDate: "Preferred date",
  consent: "Consent",
};

export function RequestForm({ demo, idempotencyKey, today, defaultService, initialError, businessName }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(initialError ?? null);
  const [canRetry, setCanRetry] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const busy = status !== "idle";

  function focusSummary() {
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return; // duplicate-submit guard
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const local = validateLead(raw);
    if (!local.ok) {
      setErrors(local.errors);
      setFormError("Please check the highlighted fields.");
      setCanRetry(false);
      focusSummary();
      return;
    }
    setErrors({});
    setFormError(null);
    setStatus("submitting");
    track("request_form_submit");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw),
      });
      const body = (await res.json().catch(() => ({}))) as { receipt?: string; demo?: boolean; error?: string; fields?: FieldErrors };
      if (res.status === 201 && body.receipt) {
        setStatus("done");
        track("request_form_success");
        router.push(`/thank-you?receipt=${encodeURIComponent(body.receipt)}`);
        return;
      }
      if (res.status === 200 && body.demo) {
        setStatus("done");
        track("request_form_success", { demo: true });
        router.push("/thank-you?demo=1");
        return;
      }
      track("request_form_error", { status: res.status });
      if (res.status === 400) {
        setErrors(body.fields ?? {});
        setFormError(body.error ?? "Please check the highlighted fields.");
        setCanRetry(false);
      } else if (res.status === 429) {
        setFormError(body.error ?? "Too many requests. Please wait a few minutes and try again.");
        setCanRetry(true);
      } else {
        setFormError("We couldn't save your request right now. Your details are still here — please try again.");
        setCanRetry(true);
      }
    } catch {
      track("request_form_error", { status: 0 });
      setFormError("We couldn't reach the server. Check your connection — your details are still here — and try again.");
      setCanRetry(true);
    }
    setStatus("idle");
    focusSummary();
  }

  function clearError(field: LeadField) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const describe = (field: LeadField, hint?: string) => [errors[field] ? `${field}-error` : null, hint ?? null].filter(Boolean).join(" ") || undefined;

  const err = (field: LeadField) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-brand-dark">
        <svg aria-hidden="true" className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6M12 16.5v.5" />
        </svg>
        <span>
          <span className="sr-only">Error: </span>
          {errors[field]}
        </span>
      </p>
    ) : null;

  const errorFields = FIELD_ORDER.filter((f) => errors[f]);

  return (
    <form
      ref={formRef}
      action="/api/leads"
      method="post"
      noValidate
      onSubmit={onSubmit}
      onInput={(e) => {
        if (!started.current) {
          started.current = true;
          track("request_form_start");
        }
        const name = (e.target as HTMLInputElement).name as LeadField;
        if (name) clearError(name);
        // The contact rule spans both fields: fixing one clears the other.
        if (name === "phone") clearError("email");
        if (name === "email") clearError("phone");
      }}
      className="space-y-8"
    >
      {demo ? (
        <div role="note" className="rounded-card border-2 border-dashed border-navy-800 bg-navy-50 p-4">
          <p className="font-display font-bold">Demo mode</p>
          <p className="mt-1 text-[15px] leading-relaxed text-navy-600">
            This preview is not connected to {businessName}. You can try the form, but nothing you enter will be stored or sent to anyone.
          </p>
        </div>
      ) : null}

      {formError ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-card border-2 border-brand bg-brand-tint p-4">
          <p className="font-display font-bold text-navy-800">{formError}</p>
          {errorFields.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
              {errorFields.map((f) => (
                <li key={f}>
                  <a href={`#${f}`} className="font-medium text-brand-dark underline underline-offset-2">
                    {FIELD_LABELS[f]}: {errors[f]}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {canRetry ? (
            <button type="submit" className="btn-primary mt-3" disabled={busy}>
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-navy-600">
        Fields marked <span className="font-semibold text-navy-800">(required)</span> must be completed. Everything else is optional.
      </p>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold">About you</legend>
        <div>
          <label htmlFor="name" className="field-label">
            Name <span className="font-normal text-navy-600">(required)</span>
          </label>
          <input id="name" name="name" type="text" autoComplete="name" required maxLength={LIMITS.name} className="field-input" aria-invalid={!!errors.name} aria-describedby={describe("name")} />
          {err("name")}
        </div>
        <div>
          <p id="contact-hint" className="text-sm text-navy-600">
            Give at least one way to reach you <span className="font-semibold text-navy-800">(required)</span>.
          </p>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="field-label">
                Phone
              </label>
              <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={LIMITS.phone} className="field-input" aria-invalid={!!errors.phone} aria-describedby={describe("phone", "contact-hint")} />
              {err("phone")}
            </div>
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input id="email" name="email" type="email" autoComplete="email" maxLength={LIMITS.email} className="field-input" aria-invalid={!!errors.email} aria-describedby={describe("email", "contact-hint")} />
              {err("email")}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold">What you need</legend>
        <div>
          <label htmlFor="service" className="field-label">
            Service <span className="font-normal text-navy-600">(required)</span>
          </label>
          <select id="service" name="service" required defaultValue={defaultService ?? ""} className="field-input" aria-invalid={!!errors.service} aria-describedby={describe("service")}>
            <option value="" disabled>
              Choose one
            </option>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {err("service")}
        </div>
        <div>
          <label htmlFor="description" className="field-label">
            What are you noticing? <span className="font-normal text-navy-600">(required)</span>
          </label>
          <p id="description-hint" className="mb-1.5 text-sm text-navy-600">
            Symptoms, warning lights, noises, when it happens — whatever you can share.
          </p>
          <textarea id="description" name="description" required rows={5} maxLength={LIMITS.description} className="field-input" aria-invalid={!!errors.description} aria-describedby={describe("description", "description-hint")} />
          {err("description")}
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold">
          Your vehicle <span className="font-sans text-base font-normal text-navy-600">(optional)</span>
        </legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="vehicleYear" className="field-label">
              Year
            </label>
            <input id="vehicleYear" name="vehicleYear" type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="e.g. 2015" className="field-input" aria-invalid={!!errors.vehicleYear} aria-describedby={describe("vehicleYear")} />
            {err("vehicleYear")}
          </div>
          <div>
            <label htmlFor="vehicleMake" className="field-label">
              Make
            </label>
            <input id="vehicleMake" name="vehicleMake" type="text" maxLength={LIMITS.make} className="field-input" aria-invalid={!!errors.vehicleMake} aria-describedby={describe("vehicleMake")} />
            {err("vehicleMake")}
          </div>
          <div>
            <label htmlFor="vehicleModel" className="field-label">
              Model
            </label>
            <input id="vehicleModel" name="vehicleModel" type="text" maxLength={LIMITS.model} className="field-input" aria-invalid={!!errors.vehicleModel} aria-describedby={describe("vehicleModel")} />
            {err("vehicleModel")}
          </div>
        </div>
        <div className="sm:max-w-xs">
          <label htmlFor="preferredDate" className="field-label">
            Preferred date
          </label>
          <p id="preferredDate-hint" className="mb-1.5 text-sm text-navy-600">
            A request only — this does not book an appointment.
          </p>
          <input id="preferredDate" name="preferredDate" type="date" min={today} className="field-input" aria-invalid={!!errors.preferredDate} aria-describedby={describe("preferredDate", "preferredDate-hint")} />
          {err("preferredDate")}
        </div>
      </fieldset>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="space-y-4 rounded-card border border-navy-100 bg-navy-50 p-5">
        <div>
          <div className="flex items-start gap-3">
            <input id="consent" name="consent" type="checkbox" required className="mt-0.5 h-6 w-6 shrink-0 accent-[#14283F]" aria-invalid={!!errors.consent} aria-describedby={describe("consent")} />
            <label htmlFor="consent" className="text-[15px] leading-relaxed">
              I agree that {businessName} may contact me by the phone number or email above about this request <span className="text-navy-600">(required)</span>. See the{" "}
              <Link href="/privacy" className="font-semibold text-brand underline underline-offset-2">
                privacy notice
              </Link>
              .
            </label>
          </div>
          {err("consent")}
        </div>
        <div className="flex items-start gap-3">
          <input id="marketingConsent" name="marketingConsent" type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-[#14283F]" />
          <label htmlFor="marketingConsent" className="text-[15px] leading-relaxed">
            Optional: I&apos;d also like to receive occasional updates and offers from {businessName}. This is not needed to send a request.
          </label>
        </div>
      </div>

      <div>
        <button type="submit" className="btn-primary w-full px-8 sm:w-auto" aria-disabled={busy} disabled={busy}>
          {status === "submitting" ? "Sending…" : demo ? "Send request (demo)" : "Send request"}
        </button>
        <p className="mt-3 text-sm text-navy-600" aria-live="polite">
          {status === "submitting" ? "Sending your request…" : "Sending a request doesn't book an appointment or confirm a quote."}
        </p>
      </div>
    </form>
  );
}
