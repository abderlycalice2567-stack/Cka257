"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email";
import { audit } from "@/lib/audit";
import type { FormState } from "@/lib/forms";
import { hashPassword, verifyPassword, DUMMY_HASH } from "@/lib/auth/password";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { clientIp, createSession, destroyAllSessions, destroySession, getCurrentUser } from "@/lib/auth/session";
import { createCheckoutSession } from "@/lib/stripe";
import { isLocale } from "@/lib/i18n/config";
import {
  accountSettingsSchema,
  contactSchema,
  donationSchema,
  eventRegistrationSchema,
  fieldErrors,
  forgotSchema,
  formObject,
  honeypot,
  newsletterSchema,
  notificationSchema,
  prayerSchema,
  resetSchema,
  signInSchema,
  signUpSchema,
  sponsorshipSchema,
  testimonySchema,
} from "@/lib/validation";

async function limited(bucket: string, limit = 5, windowMs = 60_000) {
  return !rateLimit(`${bucket}:${await clientIp()}`, limit, windowMs).ok;
}

/** Bots that fill the honeypot get a fake success and nothing is stored. */
function isBot(fd: FormData) {
  return !honeypot.safeParse({ website: fd.get("website") ?? "" }).success;
}

// ------------------------------------------------------------------ community forms
export async function submitContact(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (await limited("contact")) return { error: "rate" };
  const r = contactSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  await sql`INSERT INTO contact_messages (name, email, topic, body) VALUES (${r.data.name}, ${r.data.email}, ${r.data.topic}, ${r.data.body})`;
  return { ok: true };
}

export async function submitPrayer(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (await limited("prayer")) return { error: "rate" };
  const r = prayerSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  const user = await getCurrentUser();
  await sql`INSERT INTO prayer_requests (user_id, name, email, body, visibility)
            VALUES (${user?.id ?? null}, ${r.data.name}, ${r.data.email ?? null}, ${r.data.body}, ${r.data.visibility})`;
  return { ok: true };
}

export async function submitTestimony(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (await limited("testimony")) return { error: "rate" };
  const r = testimonySchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  const user = await getCurrentUser();
  await sql`INSERT INTO testimonies (user_id, name, email, body, consent_publish)
            VALUES (${user?.id ?? null}, ${r.data.name}, ${r.data.email ?? null}, ${r.data.body}, ${r.data.consent_publish})`;
  await sql`INSERT INTO consent_records (user_id, email, kind, granted, source)
            VALUES (${user?.id ?? null}, ${r.data.email ?? null}, 'testimony_publication', ${r.data.consent_publish}, 'testimony_form')`;
  return { ok: true };
}

export async function subscribeNewsletter(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (await limited("newsletter")) return { error: "rate" };
  const r = newsletterSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  await sql`INSERT INTO newsletter_subscribers (email, locale, consent_marketing)
            VALUES (${r.data.email}, ${r.data.locale}, true)
            ON CONFLICT (email) DO UPDATE SET locale = EXCLUDED.locale, consent_marketing = true, unsubscribed_at = NULL, consented_at = now()`;
  await sql`INSERT INTO consent_records (email, kind, granted, source) VALUES (${r.data.email}, 'marketing_email', true, 'newsletter_form')`;
  return { ok: true };
}

export async function submitSponsorship(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (await limited("sponsor")) return { error: "rate" };
  const r = sponsorshipSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  await sql`INSERT INTO sponsorship_inquiries (name, organization, email, message)
            VALUES (${r.data.name}, ${r.data.organization}, ${r.data.email}, ${r.data.message})`;
  return { ok: true };
}

export async function registerForEvent(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (await limited("event")) return { error: "rate" };
  const r = eventRegistrationSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  const user = await getCurrentUser();
  const rows = await sql<{ id: string }[]>`
    INSERT INTO event_registrations (event_id, user_id, name, email)
    SELECT e.id, ${user?.id ?? null}, ${r.data.name}, ${r.data.email} FROM events e
     WHERE e.id = ${r.data.event_id} AND e.status = 'published' AND e.registration_enabled
       AND (e.capacity IS NULL OR (SELECT count(*) FROM event_registrations x WHERE x.event_id = e.id) < e.capacity)
    ON CONFLICT (event_id, email) DO NOTHING RETURNING id`;
  if (!rows.length) {
    const dup = await sql`SELECT 1 FROM event_registrations WHERE event_id = ${r.data.event_id} AND email = ${r.data.email}`;
    if (!dup.length) return { error: "invalid", message: "closed" };
  }
  return { ok: true };
}

// ------------------------------------------------------------------ auth
function safeNext(next: unknown, locale: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : `/${locale}/account`;
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  if (isBot(fd)) return { ok: true };
  if (await limited("signup", 5, 10 * 60_000)) return { error: "rate" };
  const r = signUpSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  const exists = await sql`SELECT 1 FROM users WHERE email = ${r.data.email}`;
  if (exists.length) return { error: "exists" };
  const hash = await hashPassword(r.data.password);
  const [u] = await sql<{ id: string }[]>`
    INSERT INTO users (email, password_hash, display_name, locale)
    VALUES (${r.data.email}, ${hash}, ${r.data.display_name}, ${r.data.locale}) RETURNING id`;
  const id = u!.id;
  await sql`INSERT INTO user_roles (user_id, role_key) VALUES (${id}, 'subscriber')`;
  await sql`INSERT INTO notification_preferences (user_id, email_marketing) VALUES (${id}, ${!!r.data.marketing})`;
  await sql`INSERT INTO consent_records (user_id, email, kind, granted, source) VALUES
            (${id}, ${r.data.email}, 'privacy_policy', true, 'signup'),
            (${id}, ${r.data.email}, 'marketing_email', ${!!r.data.marketing}, 'signup')`;
  await sendVerification(id, r.data.email, r.data.locale);
  await createSession(id);
  redirect(`/${r.data.locale}/account?welcome=1`);
}

async function sendVerification(userId: string, email: string, locale: string) {
  const token = newToken();
  await sql`INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at)
            VALUES (${hashToken(token)}, ${userId}, 'verify', now() + interval '48 hours')`;
  await sendMail({
    to: email,
    subject: "Verify your email — The Kingdom Sound Radio",
    text: `Welcome! Confirm your email address:\n\n${env.appUrl}/${locale}/verify-email?token=${token}\n\nThis link expires in 48 hours.`,
  });
}

export async function resendVerification(): Promise<void> {
  const u = await getCurrentUser();
  if (!u || u.emailVerified) return;
  if (await limited("verify-resend", 3, 10 * 60_000)) return;
  await sendVerification(u.id, u.email, u.locale);
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  if (await limited("signin", 8, 5 * 60_000)) return { error: "rate" };
  const r = signInSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "auth" };
  const rows = await sql<{ id: string; password_hash: string; locale: string }[]>`
    SELECT id, password_hash, locale FROM users WHERE email = ${r.data.email} AND status = 'active'`;
  const u = rows[0];
  const ok = await verifyPassword(r.data.password, u?.password_hash ?? DUMMY_HASH);
  if (!u || !ok) {
    await audit(null, "auth.sign_in_failed", "user", null, { emailDomain: r.data.email.split("@")[1] });
    return { error: "auth" };
  }
  await createSession(u.id);
  await audit(u.id, "auth.sign_in", "user", u.id);
  const locale = String(fd.get("locale") || u.locale);
  redirect(safeNext(fd.get("next"), isLocale(locale) ? locale : "en"));
}

export async function signOut(fd: FormData) {
  await destroySession();
  const locale = String(fd.get("locale") || "en");
  redirect(`/${isLocale(locale) ? locale : "en"}`);
}

export async function requestReset(_: FormState, fd: FormData): Promise<FormState> {
  if (await limited("forgot", 3, 10 * 60_000)) return { error: "rate" };
  const r = forgotSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  const rows = await sql<{ id: string; locale: string }[]>`SELECT id, locale FROM users WHERE email = ${r.data.email} AND status = 'active'`;
  const u = rows[0];
  if (u) {
    const token = newToken();
    await sql`INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at)
              VALUES (${hashToken(token)}, ${u.id}, 'reset', now() + interval '1 hour')`;
    await sendMail({
      to: r.data.email,
      subject: "Reset your password — The Kingdom Sound Radio",
      text: `Use this link to choose a new password (valid for 1 hour):\n\n${env.appUrl}/${u.locale}/reset-password?token=${token}\n\nIf you didn't ask for this, you can ignore this email.`,
    });
  }
  // Same response whether or not the account exists (no account enumeration).
  return { ok: true };
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  if (await limited("reset", 5, 10 * 60_000)) return { error: "rate" };
  const r = resetSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  const rows = await sql<{ user_id: string }[]>`
    UPDATE email_tokens SET used_at = now()
     WHERE token_hash = ${hashToken(r.data.token)} AND purpose = 'reset' AND used_at IS NULL AND expires_at > now()
     RETURNING user_id`;
  const t = rows[0];
  if (!t) return { error: "token" };
  await sql`UPDATE users SET password_hash = ${await hashPassword(r.data.password)}, updated_at = now() WHERE id = ${t.user_id}`;
  await destroyAllSessions(t.user_id);
  await audit(t.user_id, "auth.password_reset", "user", t.user_id);
  return { ok: true };
}

// ------------------------------------------------------------------ subscriber actions
async function mustUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("Not signed in");
  return u;
}

export async function toggleFavorite(episodeId: string, path: string) {
  const u = await mustUser();
  const del = await sql`DELETE FROM favorites WHERE user_id = ${u.id} AND episode_id = ${episodeId} RETURNING 1`;
  if (!del.length) {
    await sql`INSERT INTO favorites (user_id, episode_id)
              SELECT ${u.id}, id FROM episodes WHERE id = ${episodeId} AND status = 'published' ON CONFLICT DO NOTHING`;
  }
  revalidatePath(path);
  return !del.length;
}

export async function toggleFollow(targetType: "program" | "presenter", targetId: string, path: string) {
  const u = await mustUser();
  if (targetType !== "program" && targetType !== "presenter") throw new Error("Invalid target");
  const del = await sql`DELETE FROM follows WHERE user_id = ${u.id} AND target_type = ${targetType} AND target_id = ${targetId} RETURNING 1`;
  if (!del.length) {
    const exists =
      targetType === "program"
        ? await sql`SELECT 1 FROM programs WHERE id = ${targetId} AND status = 'published'`
        : await sql`SELECT 1 FROM presenters WHERE id = ${targetId} AND published`;
    if (exists.length) await sql`INSERT INTO follows (user_id, target_type, target_id) VALUES (${u.id}, ${targetType}, ${targetId}) ON CONFLICT DO NOTHING`;
  }
  revalidatePath(path);
  return !del.length;
}

export async function toggleReminder(programId: string, path: string) {
  const u = await mustUser();
  const del = await sql`DELETE FROM broadcast_reminders WHERE user_id = ${u.id} AND program_id = ${programId} RETURNING 1`;
  if (!del.length) {
    await sql`INSERT INTO broadcast_reminders (user_id, program_id)
              SELECT ${u.id}, id FROM programs WHERE id = ${programId} AND status = 'published' ON CONFLICT DO NOTHING`;
  }
  revalidatePath(path);
  return !del.length;
}

export async function updateSettings(_: FormState, fd: FormData): Promise<FormState> {
  const u = await mustUser();
  const r = accountSettingsSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  await sql`UPDATE users SET display_name = ${r.data.display_name}, locale = ${r.data.locale}, updated_at = now() WHERE id = ${u.id}`;
  revalidatePath(`/${r.data.locale}/account`);
  return { ok: true };
}

export async function updateNotifications(_: FormState, fd: FormData): Promise<FormState> {
  const u = await mustUser();
  const r = notificationSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid" };
  await sql`INSERT INTO notification_preferences (user_id, email_program_updates, email_reminders, email_marketing, updated_at)
            VALUES (${u.id}, ${r.data.email_program_updates}, ${r.data.email_reminders}, ${r.data.email_marketing}, now())
            ON CONFLICT (user_id) DO UPDATE SET email_program_updates = EXCLUDED.email_program_updates,
              email_reminders = EXCLUDED.email_reminders, email_marketing = EXCLUDED.email_marketing, updated_at = now()`;
  await sql`INSERT INTO consent_records (user_id, email, kind, granted, source)
            VALUES (${u.id}, ${u.email}, 'marketing_email', ${r.data.email_marketing}, 'account_settings')`;
  return { ok: true };
}

export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const u = await mustUser();
  if (fd.get("confirm") !== "DELETE") return { error: "invalid", fields: { confirm: "confirm" } };
  if (u.isStaff) return { error: "invalid", message: "staff" };
  await audit(u.id, "account.deleted", "user", u.id);
  // Submissions keep their content (moderation/retention) but lose the link to the account.
  await sql`DELETE FROM users WHERE id = ${u.id}`;
  await destroySession();
  redirect(`/${u.locale}?deleted=1`);
}

// ------------------------------------------------------------------ giving
export async function startCheckout(_: FormState, fd: FormData): Promise<FormState> {
  if (!env.stripeConfigured) return { error: "unconfigured" };
  if (await limited("checkout", 5)) return { error: "rate" };
  const r = donationSchema.safeParse(formObject(fd));
  if (!r.success) return { error: "invalid", fields: fieldErrors(r.error) };
  const locale = isLocale(String(fd.get("locale"))) ? String(fd.get("locale")) : "en";
  const user = await getCurrentUser();
  const session = await createCheckoutSession({
    amountCents: Math.round(r.data.amount * 100),
    currency: "usd",
    recurring: r.data.recurring,
    successUrl: `${env.appUrl}/${locale}/support?status=thanks`,
    cancelUrl: `${env.appUrl}/${locale}/support?status=cancelled`,
    email: user?.email,
    campaignId: r.data.campaign_id ?? null,
    userId: user?.id ?? null,
  });
  redirect(session.url);
}
