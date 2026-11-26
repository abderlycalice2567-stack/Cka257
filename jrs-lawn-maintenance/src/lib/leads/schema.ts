/**
 * Request-form validation, shared by the browser (instant inline errors) and
 * the API route (authoritative). Never trust the client copy alone.
 */
import { z } from "zod";

export const SERVICE_OPTIONS = [
  { value: "mowing", label: "Mowing" },
  { value: "edging", label: "Edging" },
  { value: "routine-lawn-maintenance", label: "Routine lawn maintenance" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const YARD_SIZE_OPTIONS = [
  { value: "small", label: "Small (e.g. townhouse or small lot)" },
  { value: "medium", label: "Medium (typical suburban lot)" },
  { value: "large", label: "Large (half acre or more)" },
  { value: "not-sure", label: "Not sure" },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "one-time", label: "One-time visit" },
  { value: "weekly", label: "Weekly" },
  { value: "every-two-weeks", label: "Every two weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

type Values<T extends readonly { value: string }[]> = T[number]["value"];
const values = <T extends readonly { value: string }[]>(o: T) => o.map((x) => x.value) as [Values<T>, ...Values<T>[]];

export const LIMITS = { name: 100, phone: 30, email: 254, description: 2000, accessNotes: 500 } as const;

/** Removes control characters (keeps newlines/tabs), normalises line endings and trims. */
export function sanitizeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
    .trim();
}

const text = (max: number) => z.string().transform(sanitizeText).pipe(z.string().max(max, `Please keep this under ${max} characters.`));
const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? "" : sanitizeText(v)))
    .pipe(z.string().max(max, `Please keep this under ${max} characters.`));
const optionalEnum = <T extends [string, ...string[]]>(vals: T) =>
  z.union([z.enum(vals), z.literal("")]).optional().transform((v) => (v ? v : undefined));

function isRealDate(s: string) {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export const leadSchema = z
  .object({
    name: text(LIMITS.name).pipe(z.string().min(1, "Please enter your name.")),
    phone: optionalText(LIMITS.phone).refine(
      (v) => v === "" || (/^[0-9+().\-\s]+$/.test(v) && v.replace(/\D/g, "").length >= 10),
      "Please enter a valid phone number, including area code.",
    ),
    email: optionalText(LIMITS.email).refine((v) => v === "" || z.email().safeParse(v).success, "Please enter a valid email address."),
    service: z.enum(values(SERVICE_OPTIONS), { error: "Please choose a service." }),
    description: text(LIMITS.description).pipe(z.string().min(10, "Please add a short description (at least 10 characters).")),
    zip: optionalText(5).refine((v) => v === "" || /^\d{5}$/.test(v), "Please enter a 5-digit ZIP code."),
    yardSize: optionalEnum(values(YARD_SIZE_OPTIONS)),
    frequency: optionalEnum(values(FREQUENCY_OPTIONS)),
    accessNotes: optionalText(LIMITS.accessNotes),
    preferredDate: optionalText(10).refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && isRealDate(v)), "Please enter a valid date."),
    consent: z.literal(true, { error: "Please confirm we may contact you about this request." }),
    marketingConsent: z.boolean().optional().default(false),
    idempotencyKey: z.uuid({ error: "Please reload the page and try again." }),
    /** Honeypot: hidden from people, often filled by bots. */
    website: z.string().max(200).optional().default(""),
    /** Milliseconds between form render and submit (bot timing check). */
    elapsedMs: z.number().int().nonnegative().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email) {
      const message = "Please give a phone number or an email address so the owner can reply.";
      ctx.addIssue({ code: "custom", path: ["phone"], message });
      ctx.addIssue({ code: "custom", path: ["email"], message });
    }
  });

export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;
export type FieldErrors = Partial<Record<keyof LeadInput, string>>;

export function validateLead(input: unknown): { ok: true; data: LeadData } | { ok: false; errors: FieldErrors } {
  const r = leadSchema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  const errors: FieldErrors = {};
  for (const issue of r.error.issues) {
    const key = (issue.path[0] ?? "form") as keyof LeadInput;
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}

/** Minimum human fill time; faster submissions are treated as automated. */
export const MIN_FILL_MS = 2500;

export function looksAutomated(data: LeadData): boolean {
  return data.website.trim() !== "" || (data.elapsedMs !== undefined && data.elapsedMs < MIN_FILL_MS);
}

export function labelFor(options: readonly { value: string; label: string }[], value: string | undefined): string {
  return options.find((o) => o.value === value)?.label ?? "—";
}
