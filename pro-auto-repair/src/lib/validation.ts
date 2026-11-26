import { z } from "zod";
import { services } from "@/content/services";

/** Strip control characters and collapse runs of whitespace; trims the result. */
export function sanitize(input: string, { multiline = false } = {}): string {
  // eslint-disable-next-line no-control-regex
  const noControl = input.replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, " ");
  const collapsed = multiline
    ? noControl.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n")
    : noControl.replace(/\s+/g, " ");
  return collapsed.trim();
}

const text = (max: number, multiline = false) =>
  z
    .string()
    .max(max * 2) // hard cap on raw input before sanitizing
    .transform((v) => sanitize(v, { multiline }))
    .pipe(z.string().max(max, `Please keep this under ${max} characters.`));

const optionalText = (max: number) => text(max).optional().or(z.literal("")).transform((v) => v || undefined);

const currentYear = new Date().getFullYear();
const serviceSlugs = services.map((s) => s.slug);
export const SERVICE_OTHER = "other";

export const leadSchema = z
  .object({
    name: text(100).pipe(z.string().min(2, "Enter your name.")),
    phone: optionalText(30).refine(
      (v) => v === undefined || (/^[0-9+().\-\s]+$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15),
      "Enter a valid phone number.",
    ),
    email: optionalText(254).refine(
      (v) => v === undefined || z.string().email().safeParse(v).success,
      "Enter a valid email address.",
    ),
    service: z
      .string()
      .refine((v) => serviceSlugs.includes(v) || v === SERVICE_OTHER, "Choose the service you need."),
    description: text(2000, true).pipe(z.string().min(10, "Describe what you need in a sentence or two.")),
    vehicleYear: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .refine(
        (v) => v === undefined || (Number.isInteger(v) && v >= 1950 && v <= currentYear + 1),
        `Enter a year between 1950 and ${currentYear + 1}.`,
      ),
    vehicleMake: optionalText(50),
    vehicleModel: optionalText(50),
    preferredDate: optionalText(10).refine((v) => {
      if (v === undefined) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
      const d = new Date(`${v}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) return false;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      // allow "today" in any timezone
      return d.getTime() >= today.getTime() - 86_400_000 && d.getTime() <= today.getTime() + 366 * 86_400_000;
    }, "Choose a date within the next 12 months."),
    consent: z.literal(true, { errorMap: () => ({ message: "Please confirm we may contact you about this request." }) }),
    marketingConsent: z.boolean().optional().default(false),
    /** Honeypot — must stay empty. */
    leaveBlank: z.string().max(200).optional(),
    /** Milliseconds the form was open; used as a soft bot signal. */
    elapsedMs: z.number().int().nonnegative().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email) {
      const message = "Enter a phone number or an email address so the shop can reply.";
      ctx.addIssue({ code: "custom", path: ["phone"], message });
      ctx.addIssue({ code: "custom", path: ["email"], message });
    }
  });

export type LeadInput = z.infer<typeof leadSchema>;
export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function validateLead(data: unknown):
  | { ok: true; data: LeadInput }
  | { ok: false; errors: FieldErrors } {
  const result = leadSchema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const errors = toFieldErrors(result.error);
  // zod skips the cross-field check when other fields fail; report it in the same pass.
  const raw = (data ?? {}) as Record<string, unknown>;
  const blank = (v: unknown) => typeof v !== "string" || v.trim() === "";
  if (blank(raw.phone) && blank(raw.email)) {
    errors.phone = errors.email = "Enter a phone number or an email address so the shop can reply.";
  }
  return { ok: false, errors };
}
