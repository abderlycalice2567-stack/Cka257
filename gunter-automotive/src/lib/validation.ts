import { z } from "zod";

export const SERVICE_OPTIONS = ["maintenance", "diagnostics", "repair", "not-sure"] as const;
export const SERVICE_LABELS: Record<(typeof SERVICE_OPTIONS)[number], string> = {
  maintenance: "Maintenance",
  diagnostics: "Diagnostics",
  repair: "Repair",
  "not-sure": "Not sure / something else",
};

// Strip control characters (keep newlines/tabs in free text) and trim.
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
const text = (max: number) => z.string().transform(clean).pipe(z.string().max(max, `Please keep this under ${max} characters.`));
const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? clean(v) : ""))
    .pipe(z.string().max(max, `Please keep this under ${max} characters.`))
    .transform((v) => (v === "" ? null : v));

const currentYear = new Date().getFullYear();

export const leadSchema = z
  .object({
    name: text(100).pipe(z.string().min(2, "Please enter your name.")),
    phone: optionalText(30).refine(
      (v) => v === null || (/^[+()\d\s.-]+$/.test(v) && v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 15),
      "Please enter a valid phone number, including area code.",
    ),
    email: optionalText(254).refine((v) => v === null || z.email().safeParse(v).success, "Please enter a valid email address."),
    vehicleYear: optionalText(4).refine(
      (v) => v === null || (/^\d{4}$/.test(v) && Number(v) >= 1950 && Number(v) <= currentYear + 1),
      `Please enter a year between 1950 and ${currentYear + 1}.`,
    ),
    vehicleMake: optionalText(40),
    vehicleModel: optionalText(60),
    service: z.enum(SERVICE_OPTIONS, { error: "Please choose the kind of service you need." }),
    description: text(2000).pipe(z.string().min(10, "Please describe what you need in a few words (at least 10 characters).")),
    preferredDate: optionalText(10).refine((v) => {
      if (v === null) return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
      const d = new Date(`${v}T12:00:00Z`);
      if (Number.isNaN(d.getTime())) return false;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const max = new Date(today);
      max.setUTCFullYear(max.getUTCFullYear() + 1);
      return d >= today && d <= max;
    }, "Please choose a date between today and one year from now."),
    consent: z.literal(true, { error: "Please confirm we may contact you about this request." }),
    marketingConsent: z.boolean().optional().default(false),
    // Spam controls (not stored).
    website: z.string().optional(), // honeypot: real users never fill this
    startedAt: z.number().optional(), // ms timestamp when the form was rendered
  })
  .superRefine(
    (v, ctx) => {
      // Runs even when other fields failed (see `when`), so every error shows at once.
      // Values may be untransformed here, so check them defensively.
      const present = (x: unknown) => typeof x === "string" && x.trim() !== "";
      if (!present(v?.phone) && !present(v?.email)) {
        const message = "Please give a phone number or an email address so the shop can reach you.";
        ctx.addIssue({ code: "custom", path: ["phone"], message });
        ctx.addIssue({ code: "custom", path: ["email"], message });
      }
    },
    { when: (payload) => typeof payload.value === "object" && payload.value !== null },
  );

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

/** Flatten zod issues into a { field: firstMessage } map for inline errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Heuristic bot check. Returns true when the submission looks automated. */
export function looksLikeBot(lead: Pick<Lead, "website" | "startedAt">, now = Date.now()): boolean {
  if (lead.website && lead.website.trim() !== "") return true;
  if (typeof lead.startedAt === "number" && now - lead.startedAt < 3000) return true;
  return false;
}
