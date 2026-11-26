/**
 * Lead form validation — shared by the browser (inline errors) and the server
 * (authoritative). The server never trusts the client's result.
 */
import { z } from "zod";

export const SERVICE_OPTIONS = [
  { value: "general-repair", label: "General repair" },
  { value: "diagnostics", label: "Diagnostics" },
  { value: "maintenance", label: "Maintenance" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

const serviceValues = SERVICE_OPTIONS.map((o) => o.value) as [string, ...string[]];

export const LIMITS = { name: 100, phone: 30, email: 254, make: 50, model: 50, description: 2000, descriptionMin: 10 } as const;

/** Strip control characters, normalise unicode, trim. Newlines are kept only when `multiline`. */
export function sanitizeText(input: unknown, multiline = false): string {
  if (typeof input !== "string") return "";
  let s = input.normalize("NFC").replace(/\r\n?/g, "\n");
  s = s.replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁠-⁩﻿]/g : /[\u0000-\u001F\u007F​-‏‪-‮⁠-⁩﻿]/g, " ");
  s = multiline ? s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n") : s.replace(/\s+/g, " ");
  return s.trim();
}

const text = (max: number, multiline = false) =>
  z.preprocess((v) => sanitizeText(v, multiline), z.string().max(max, `Please keep this under ${max} characters.`));

const optionalText = (max: number) => text(max).transform((v) => (v === "" ? null : v));

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const leadSchema = z
  .object({
    name: text(LIMITS.name).refine((v) => v.length >= 2, "Enter your name."),
    phone: optionalText(LIMITS.phone).refine((v) => {
      if (v === null) return true;
      if (!/^[0-9+().\-\s]+$/.test(v)) return false;
      const digits = v.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }, "Enter a valid phone number, including area code."),
    email: optionalText(LIMITS.email)
      .transform((v) => (v ? v.toLowerCase() : v))
      .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Enter a valid email address."),
    service: z.preprocess((v) => sanitizeText(v), z.enum(serviceValues, "Choose the type of service.")),
    description: text(LIMITS.description, true).refine(
      (v) => v.length >= LIMITS.descriptionMin,
      "Describe what you're noticing (at least a few words).",
    ),
    vehicleYear: z
      .preprocess((v) => {
        const s = sanitizeText(typeof v === "number" ? String(v) : v);
        return s === "" ? null : /^\d{4}$/.test(s) ? Number(s) : NaN;
      }, z.number("Enter a four-digit year.").int().nullable())
      .refine((v) => v === null || (v >= 1900 && v <= new Date().getFullYear() + 2), "Enter a valid model year."),
    vehicleMake: optionalText(LIMITS.make),
    vehicleModel: optionalText(LIMITS.model),
    preferredDate: optionalText(10).refine((v) => {
      if (v === null) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
      const d = new Date(`${v}T00:00:00Z`);
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return false;
      const max = new Date();
      max.setUTCFullYear(max.getUTCFullYear() + 1);
      // Allow "yesterday" in UTC so visitors west of UTC can still pick their local today.
      const min = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
      return v >= min && v <= max.toISOString().slice(0, 10);
    }, "Choose a date between today and one year from now."),
    consent: z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean()).refine((v) => v, "Please confirm we may contact you about this request."),
    marketingConsent: z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean()),
    idempotencyKey: z.uuid("Please reload the page and try again."),
    /** Honeypot: hidden from people, must stay empty. */
    website: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().max(0, "Unable to submit this form.")),
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email) {
      const message = "Enter a phone number or an email address so we can reach you.";
      ctx.addIssue({ code: "custom", path: ["phone"], message });
      ctx.addIssue({ code: "custom", path: ["email"], message });
    }
  });

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadField = keyof LeadInput;
export type FieldErrors = Partial<Record<LeadField, string>>;

export function validateLead(raw: unknown): { ok: true; data: LeadInput } | { ok: false; errors: FieldErrors } {
  const parsed = leadSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as LeadField | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export { todayIso };
