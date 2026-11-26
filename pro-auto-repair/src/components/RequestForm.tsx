"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { SERVICE_OTHER, validateLead, type FieldErrors } from "@/lib/validation";

type Option = { slug: string; name: string };
type Status = "idle" | "submitting" | "error";

const labels: Record<string, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  service: "Service needed",
  description: "What do you need help with?",
  vehicleYear: "Vehicle year",
  vehicleMake: "Vehicle make",
  vehicleModel: "Vehicle model",
  preferredDate: "Preferred date",
  consent: "Consent",
};

export function RequestForm({ services, demo, initialService }: { services: Option[]; demo: boolean; initialService?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(Date.now());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  function showErrors(next: FieldErrors) {
    setErrors(next);
    setStatus("idle");
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return; // duplicate-submit guard
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const str = (k: string) => String(form.get(k) ?? "");
    const payload = {
      name: str("name"),
      phone: str("phone"),
      email: str("email"),
      service: str("service"),
      description: str("description"),
      vehicleYear: str("vehicleYear"),
      vehicleMake: str("vehicleMake"),
      vehicleModel: str("vehicleModel"),
      preferredDate: str("preferredDate"),
      consent: form.get("consent") === "on",
      marketingConsent: form.get("marketingConsent") === "on",
      leaveBlank: str("leaveBlank"),
      elapsedMs: Date.now() - openedAt.current,
    };

    const local = validateLead(payload);
    if (!local.ok) return showErrors(local.errors);
    setErrors({});
    setStatus("submitting");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 201 && body.mode === "live") {
        window.dispatchEvent(new CustomEvent("lead:submitted")); // analytics hook, no personal data
        router.push(`/thank-you?mode=live${body.receipt ? `&ref=${encodeURIComponent(body.receipt)}` : ""}`);
        return;
      }
      if (res.ok && body.mode === "demo") {
        router.push("/thank-you?mode=demo");
        return;
      }
      if (res.status === 400 && body.fields) return showErrors(body.fields);
      if (res.status === 429) {
        setFormError("Too many requests from this connection. Please wait a few minutes and try again.");
      } else {
        setFormError("We could not save your request just now. Nothing was sent. Your answers are still here — please try again.");
      }
    } catch {
      setFormError("We could not reach the server. Nothing was sent. Check your connection and try again.");
    }
    setStatus("error");
  }

  const errorKeys = Object.keys(errors).filter((k) => labels[k]);
  const describe = (name: string, hint?: boolean) =>
    [errors[name] && `${name}-error`, hint && `${name}-hint`].filter(Boolean).join(" ") || undefined;
  const fieldError = (name: string) =>
    errors[name] && (
      <p id={`${name}-error`} className="field-error">
        {errors[name]}
      </p>
    );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-8">
      {demo && (
        <div role="note" className="rounded-lg border-2 border-[#8A6D00] bg-[#FFF4CC] px-4 py-3 text-[#4A3A00]">
          <strong>Demo mode.</strong> This form checks your answers but does not store or send them. No one will
          be contacted.
        </div>
      )}

      {errorKeys.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-lg border-2 border-[#B42318] bg-[#FEF3F2] px-4 py-3">
          <h2 className="font-sans text-base font-bold text-[#B42318]">Please fix {errorKeys.length === 1 ? "this field" : "these fields"}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {errorKeys.map((k) => (
              <li key={k}>
                <a href={`#${k}`} className="text-[#B42318] underline">
                  {labels[k]}: {errors[k]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold text-navy">Your details</legend>
        <p className="text-sm text-muted">
          Fields marked <span aria-hidden="true">*</span>
          <span className="sr-only">with an asterisk</span> are required.
        </p>
        <div>
          <label htmlFor="name" className="field-label">Name *</label>
          <input id="name" name="name" type="text" autoComplete="name" required maxLength={100} className="field-input" aria-invalid={Boolean(errors.name)} aria-describedby={describe("name")} />
          {fieldError("name")}
        </div>
        <div>
          <p id="contact-hint" className="text-sm text-muted">Give at least one way to reach you: phone or email. *</p>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="field-label">Phone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={30} className="field-input" aria-invalid={Boolean(errors.phone)} aria-describedby={["contact-hint", errors.phone && "phone-error"].filter(Boolean).join(" ")} />
              {fieldError("phone")}
            </div>
            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" maxLength={254} className="field-input" aria-invalid={Boolean(errors.email)} aria-describedby={["contact-hint", errors.email && "email-error"].filter(Boolean).join(" ")} />
              {fieldError("email")}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold text-navy">Your vehicle <span className="font-sans text-sm font-normal text-muted">(optional)</span></legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="vehicleYear" className="field-label">Year</label>
            <input id="vehicleYear" name="vehicleYear" type="text" inputMode="numeric" maxLength={4} placeholder="e.g. 2016" className="field-input" aria-invalid={Boolean(errors.vehicleYear)} aria-describedby={describe("vehicleYear")} />
            {fieldError("vehicleYear")}
          </div>
          <div>
            <label htmlFor="vehicleMake" className="field-label">Make</label>
            <input id="vehicleMake" name="vehicleMake" type="text" maxLength={50} className="field-input" aria-invalid={Boolean(errors.vehicleMake)} aria-describedby={describe("vehicleMake")} />
            {fieldError("vehicleMake")}
          </div>
          <div>
            <label htmlFor="vehicleModel" className="field-label">Model</label>
            <input id="vehicleModel" name="vehicleModel" type="text" maxLength={50} className="field-input" aria-invalid={Boolean(errors.vehicleModel)} aria-describedby={describe("vehicleModel")} />
            {fieldError("vehicleModel")}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold text-navy">Your request</legend>
        <div>
          <label htmlFor="service" className="field-label">Service needed *</label>
          <select id="service" name="service" required defaultValue={initialService ?? ""} className="field-input" aria-invalid={Boolean(errors.service)} aria-describedby={describe("service")}>
            <option value="" disabled>Choose a service</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
            <option value={SERVICE_OTHER}>Not sure / something else</option>
          </select>
          {fieldError("service")}
        </div>
        <div>
          <label htmlFor="description" className="field-label">What do you need help with? *</label>
          <p id="description-hint" className="mt-1 text-sm text-muted">Symptoms, warning lights, noises, or the maintenance you are due for.</p>
          <textarea id="description" name="description" rows={5} required maxLength={2000} className="field-input" aria-invalid={Boolean(errors.description)} aria-describedby={describe("description", true)} />
          {fieldError("description")}
        </div>
        <div className="sm:max-w-xs">
          <label htmlFor="preferredDate" className="field-label">Preferred date <span className="font-normal text-muted">(optional)</span></label>
          <p id="preferredDate-hint" className="mt-1 text-sm text-muted">This is a request, not a booking. The shop will confirm availability with you.</p>
          <input id="preferredDate" name="preferredDate" type="date" className="field-input" aria-invalid={Boolean(errors.preferredDate)} aria-describedby={describe("preferredDate", true)} />
          {fieldError("preferredDate")}
        </div>
      </fieldset>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="leaveBlank">Leave this field blank</label>
        <input id="leaveBlank" name="leaveBlank" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="space-y-4">
        <legend className="sr-only">Consent</legend>
        <div>
          <label className="flex min-h-[44px] items-start gap-3">
            <input id="consent" name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-teal" aria-invalid={Boolean(errors.consent)} aria-describedby={describe("consent")} />
            <span>I agree to be contacted about this request using the details above. * See the <a href="/privacy" className="font-semibold text-teal underline">privacy notice</a>.</span>
          </label>
          {fieldError("consent")}
        </div>
        <label className="flex min-h-[44px] items-start gap-3">
          <input name="marketingConsent" type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-teal" />
          <span>Optional: I would also like occasional service reminders and offers.</span>
        </label>
      </fieldset>

      <div aria-live="assertive">
        {formError && (
          <p role="alert" className="rounded-lg border-2 border-[#B42318] bg-[#FEF3F2] px-4 py-3 font-medium text-[#B42318]">
            {formError}
          </p>
        )}
      </div>

      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto">
        {status === "submitting" ? "Sending…" : status === "error" ? "Try again" : demo ? "Check my request (demo)" : "Send request"}
      </button>
    </form>
  );
}
