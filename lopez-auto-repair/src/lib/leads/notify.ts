import "server-only";
import { business } from "@/config/business";
import type { EmailConfig } from "./env";
import type { LeadRow } from "./store";
import { SERVICE_OPTIONS } from "./schema";

export class NotifyError extends Error {
  constructor(public readonly code: string) {
    super(`lead notification failed: ${code}`);
  }
}

function line(label: string, value: unknown): string {
  return `${label}: ${value === null || value === undefined || value === "" ? "—" : String(value)}`;
}

/** Plain-text only: customer input is never interpreted as HTML. */
export function buildNotification(lead: LeadRow): { subject: string; text: string } {
  const d = lead.details;
  const service = SERVICE_OPTIONS.find((o) => o.value === lead.service)?.label ?? lead.service;
  const prefix = business.ownerApproved ? "" : "[TEST — private demo] ";
  const text = [
    `New service request from the ${business.name} website.`,
    "",
    line("Receipt", d.receipt),
    line("Received", lead.created_at),
    "",
    line("Name", lead.name),
    line("Phone", lead.phone),
    line("Email", lead.email),
    "",
    line("Service", service),
    line("Vehicle", [d.vehicle_year, d.vehicle_make, d.vehicle_model].filter(Boolean).join(" ")),
    line("Preferred date (a request, not a booking)", d.preferred_date),
    line("Marketing consent", d.marketing_consent ? "Yes" : "No"),
    "",
    "What they're noticing:",
    String(d.description ?? ""),
    "",
    "The customer has been told this is a receipt only — no appointment or quote has been confirmed.",
  ].join("\n");
  return { subject: `${prefix}New service request — ${service}`, text };
}

async function sendOnce(config: EmailConfig, lead: LeadRow): Promise<void> {
  const { subject, text } = buildNotification(lead);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        // Lets the provider de-duplicate if a retry races a slow success.
        "Idempotency-Key": `lead-${lead.id}`,
      },
      body: JSON.stringify({ from: config.from, to: [config.to], subject, text }),
    });
  } catch {
    throw new NotifyError("network");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new NotifyError(`http_${res.status}`);
}

/** Try to notify the owner, with a short in-request retry. Throws NotifyError on final failure. */
export async function notifyOwner(config: EmailConfig | null, lead: LeadRow, attempts = 2, delayMs = 400): Promise<void> {
  if (!config) throw new NotifyError("email_not_configured");
  let last: NotifyError = new NotifyError("unknown");
  for (let i = 0; i < attempts; i++) {
    try {
      await sendOnce(config, lead);
      return;
    } catch (err) {
      last = err instanceof NotifyError ? err : new NotifyError("unknown");
      // Client errors (bad key, invalid sender) will not fix themselves on retry.
      if (/^http_4(?!29)/.test(last.code)) break;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last;
}
