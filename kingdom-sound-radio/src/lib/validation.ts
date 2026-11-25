import { z } from "zod";

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const locale = z.enum(["en", "fr", "ht"]);

/** Honeypot: real users never fill the hidden "website" field. */
export const honeypot = z.object({ website: z.string().max(0).optional().or(z.literal("")) });

export const contactSchema = z.object({
  name: text(2, 100),
  email,
  topic: z.enum(["general", "programs", "technical", "partnership", "pastoral"]).default("general"),
  body: text(10, 4000),
  consent: checkbox.refine((v) => v, "consent"),
});

export const prayerSchema = z.object({
  name: text(1, 100),
  email: email.optional().or(z.literal("").transform(() => undefined)),
  body: text(5, 3000),
  visibility: z.enum(["private", "public_anonymous", "public_named"]).default("private"),
  consent: checkbox.refine((v) => v, "consent"),
});

export const testimonySchema = z.object({
  name: text(1, 100),
  email: email.optional().or(z.literal("").transform(() => undefined)),
  body: text(20, 5000),
  consent_publish: checkbox,
  consent: checkbox.refine((v) => v, "consent"),
});

export const newsletterSchema = z.object({
  email,
  locale: locale.default("en"),
  consent_marketing: checkbox.refine((v) => v, "consent"),
});

export const sponsorshipSchema = z.object({
  name: text(2, 100),
  organization: text(2, 160),
  email,
  message: text(10, 4000),
});

export const eventRegistrationSchema = z.object({
  event_id: z.uuid(),
  name: text(2, 100),
  email,
});

export const passwordSchema = z.string().min(10).max(200);

export const signUpSchema = z.object({
  display_name: text(2, 80),
  email,
  password: passwordSchema,
  locale: locale.default("en"),
  consent: checkbox.refine((v) => v, "consent"),
  marketing: checkbox.optional(),
});

export const signInSchema = z.object({ email, password: z.string().min(1).max(200) });
export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });

export const accountSettingsSchema = z.object({ display_name: text(2, 80), locale });
export const notificationSchema = z.object({
  email_program_updates: checkbox,
  email_reminders: checkbox,
  email_marketing: checkbox,
});

export const progressSchema = z.object({
  episodeId: z.uuid(),
  position: z.number().int().min(0).max(86400),
  completed: z.boolean().default(false),
});

export const donationSchema = z.object({
  amount: z.coerce.number().min(1).max(50000),
  recurring: checkbox,
  campaign_id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
});

export type FieldErrors = Record<string, string>;

export function fieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

export function formObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}
