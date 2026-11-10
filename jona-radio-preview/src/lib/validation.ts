import { z } from "zod";

/**
 * Shared validation schemas (used by both client and the demo API route
 * handlers). Server-side validation is the authority (F-07).
 */

const str = (max: number) => z.string().trim().max(max);

export const contactSchema = z.object({
  name: str(120).min(2, "Veuillez indiquer votre nom."),
  email: z.string().trim().email("Adresse e-mail invalide.").max(180),
  subject: str(160).min(2, "Veuillez indiquer un sujet."),
  message: str(4000).min(10, "Votre message est un peu court."),
  // Honeypot: must stay empty. Bots tend to fill every field (F-07).
  company: z.string().max(0).optional().default(""),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est requis." }),
  }),
});

export const prayerSchema = z.object({
  firstName: str(80).min(1, "Un prénom (ou un pseudonyme) est requis."),
  intention: str(2000).min(5, "Merci de préciser votre intention."),
  isPublic: z.boolean().default(false),
  company: z.string().max(0).optional().default(""),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Le consentement est requis." }),
  }),
});

export const donationSchema = z.object({
  amount: z.coerce.number().positive("Montant invalide.").max(100000),
  frequency: z.enum(["once", "monthly"]),
  firstName: str(80).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type PrayerInput = z.infer<typeof prayerSchema>;
export type DonationInput = z.infer<typeof donationSchema>;
