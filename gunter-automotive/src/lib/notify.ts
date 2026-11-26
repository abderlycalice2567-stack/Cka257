import "server-only";
import { business } from "@/config/business";
import { emailConfig } from "@/lib/env";
import { SERVICE_LABELS, type Lead } from "@/lib/validation";

export type NotifyResult = { ok: true; attempts: number } | { ok: false; attempts: number; code: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function buildEmail(lead: Lead, receiptId: string) {
  const rows: [string, string | null][] = [
    ["Receipt", receiptId],
    ["Name", lead.name],
    ["Phone", lead.phone],
    ["Email", lead.email],
    ["Service", SERVICE_LABELS[lead.service]],
    ["Vehicle", [lead.vehicleYear, lead.vehicleMake, lead.vehicleModel].filter(Boolean).join(" ") || null],
    ["Preferred date (request only)", lead.preferredDate],
    ["Marketing consent", lead.marketingConsent ? "Yes" : "No"],
  ];
  const textBody = [
    `New service request for ${business.name}`,
    "",
    ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "",
    "Description:",
    lead.description,
    "",
    "This is a request only. No appointment or quote has been confirmed to the customer.",
  ].join("\n");
  const html = `<h2>New service request</h2><table>${rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><th align="left" style="padding:4px 12px 4px 0">${esc(k)}</th><td>${esc(v!)}</td></tr>`)
    .join("")}</table><h3>Description</h3><p style="white-space:pre-wrap">${esc(lead.description)}</p><p><em>This is a request only. No appointment or quote has been confirmed to the customer.</em></p>`;
  return { subject: `New service request (${SERVICE_LABELS[lead.service]}) [${receiptId.slice(0, 8)}]`, text: textBody, html };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send the owner notification through Resend's HTTP API, retrying transient
 * failures with backoff. Failures are returned (never thrown) so the caller
 * can record them; the stored lead is never lost because of email trouble.
 */
export async function notifyOwner(
  lead: Lead,
  receiptId: string,
  opts: { fetchImpl?: typeof fetch; maxAttempts?: number; backoffMs?: number } = {},
): Promise<NotifyResult> {
  const cfg = emailConfig();
  if (!cfg) return { ok: false, attempts: 0, code: "not_configured" };
  const { fetchImpl = fetch, maxAttempts = 3, backoffMs = 500 } = opts;
  const { subject, text, html } = buildEmail(lead, receiptId);

  let code = "unknown";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `lead-${receiptId}` },
        body: JSON.stringify({ from: cfg.from, to: cfg.to, subject, text, html, ...(lead.email ? { reply_to: lead.email } : {}) }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true, attempts: attempt };
      code = `http_${res.status}`;
      // 4xx other than 429 won't succeed on retry.
      if (res.status < 500 && res.status !== 429) break;
    } catch {
      code = "network";
    }
    if (attempt < maxAttempts) await sleep(backoffMs * 2 ** (attempt - 1));
  }
  return { ok: false, attempts: maxAttempts, code };
}
