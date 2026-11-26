import { randomBytes } from "node:crypto";
import { FREQUENCY_OPTIONS, SERVICE_OPTIONS, YARD_SIZE_OPTIONS, labelFor, type LeadData } from "./schema";
import type { LeadStore, Mailer, NewLead, StoredLead } from "./types";

const RECEIPT_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

/** Opaque, human-friendly receipt ID — not the database primary key. */
export function makeReceiptCode(prefix = "JRS"): string {
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += RECEIPT_ALPHABET[b % RECEIPT_ALPHABET.length];
  return `${prefix}-${out.slice(0, 4)}-${out.slice(4)}`;
}

export function toNewLead(data: LeadData, now = new Date()): NewLead {
  return {
    receipt_code: makeReceiptCode(),
    idempotency_key: data.idempotencyKey,
    name: data.name,
    phone: data.phone || null,
    email: data.email || null,
    service: data.service,
    details: {
      description: data.description,
      ...(data.zip ? { zip: data.zip } : {}),
      ...(data.yardSize ? { yard_size: data.yardSize } : {}),
      ...(data.frequency ? { frequency: data.frequency } : {}),
      ...(data.accessNotes ? { access_notes: data.accessNotes } : {}),
      ...(data.preferredDate ? { preferred_date: data.preferredDate } : {}),
      marketing_consent: data.marketingConsent,
    },
    consent_at: now.toISOString(),
    source: "website:request-form",
  };
}

export function buildNotification(lead: StoredLead | NewLead) {
  const d = lead.details;
  const lines = [
    "A new lawn service request was submitted on the website.",
    "",
    `Receipt:    ${lead.receipt_code}`,
    `Name:       ${lead.name}`,
    `Phone:      ${lead.phone ?? "—"}`,
    `Email:      ${lead.email ?? "—"}`,
    `Service:    ${labelFor(SERVICE_OPTIONS, lead.service)}`,
    `ZIP:        ${d.zip ?? "—"}`,
    `Yard size:  ${labelFor(YARD_SIZE_OPTIONS, d.yard_size)}`,
    `Frequency:  ${labelFor(FREQUENCY_OPTIONS, d.frequency)}`,
    `Preferred date (request only, not booked): ${d.preferred_date ?? "—"}`,
    "",
    "Description:",
    d.description,
    "",
    "Access notes:",
    d.access_notes || "—",
    "",
    `Marketing consent: ${d.marketing_consent ? "yes" : "no"}`,
    "",
    "The customer has been told this is a request only — no appointment or price has been confirmed.",
  ];
  return {
    subject: `New lawn service request — ${labelFor(SERVICE_OPTIONS, lead.service)} (${lead.receipt_code})`,
    text: lines.join("\n"),
    replyTo: lead.email ?? undefined,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends the owner notification with a few quick retries, then records the
 * outcome on the lead. A failure never deletes or hides the stored lead;
 * the scheduled retry job (/api/cron/notify) picks it up later.
 * Logs carry only the lead ID — never customer details.
 */
export async function notifyOwner(
  lead: StoredLead,
  deps: { store: LeadStore; mailer: Mailer; to: string[]; attempts?: number; backoffMs?: number; log?: Pick<Console, "info" | "error"> },
): Promise<boolean> {
  const { store, mailer, to, attempts = 3, backoffMs = 750, log = console } = deps;
  const mail = buildNotification(lead);
  let tries = lead.notification_attempts;
  let lastError = "";
  for (let i = 0; i < attempts; i++) {
    tries++;
    try {
      if (to.length === 0) throw new Error("no notification recipient configured");
      await mailer.send({ to, ...mail });
      await store.updateNotification(lead.id, { notification_status: "sent", notification_attempts: tries, last_notification_error: null, notified_at: new Date().toISOString() });
      log.info(`[leads] notification sent lead=${lead.id} attempts=${tries}`);
      return true;
    } catch (err) {
      lastError = err instanceof Error ? err.message.slice(0, 200) : "unknown error";
      log.error(`[leads] notification attempt failed lead=${lead.id} attempt=${tries} error="${lastError}"`);
      if (i < attempts - 1) await sleep(backoffMs * 2 ** i);
    }
  }
  try {
    await store.updateNotification(lead.id, { notification_status: "failed", notification_attempts: tries, last_notification_error: lastError, notified_at: null });
  } catch {
    log.error(`[leads] could not record notification failure lead=${lead.id}`);
  }
  return false;
}

/** Retries pending/failed notifications. Called by the scheduled job. */
export async function retryPendingNotifications(deps: { store: LeadStore; mailer: Mailer; to: string[]; maxAttempts?: number; log?: Pick<Console, "info" | "error"> }) {
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const pending = await deps.store.pendingNotifications({ maxAttempts: deps.maxAttempts ?? 12, limit: 25, sinceIso: since });
  let sent = 0;
  for (const lead of pending) {
    if (await notifyOwner(lead, { ...deps, attempts: 1 })) sent++;
  }
  return { checked: pending.length, sent };
}
