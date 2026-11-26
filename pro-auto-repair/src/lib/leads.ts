import { randomUUID } from "node:crypto";
import type { LeadInput } from "@/lib/validation";

/**
 * Server-only lead persistence and owner notification.
 * Talks to Supabase (PostgREST) and Resend over fetch so the service-role key
 * never leaves the server and no SDK ends up in a client bundle.
 * Logs never include customer details — only ids and status codes.
 */

export class StorageError extends Error {}

export type StoredLead = { id: string };

function leadRow(input: LeadInput, id: string) {
  return {
    id,
    name: input.name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    service: input.service,
    details: {
      description: input.description,
      vehicle_year: input.vehicleYear ?? null,
      vehicle_make: input.vehicleMake ?? null,
      vehicle_model: input.vehicleModel ?? null,
      preferred_date: input.preferredDate ?? null,
      marketing_consent: input.marketingConsent,
    },
    status: "new",
    consent_at: new Date().toISOString(),
    source: "website-request-form",
  };
}

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new StorageError("storage not configured");
  return {
    endpoint: `${url}/rest/v1/leads`,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  };
}

export async function persistLead(input: LeadInput): Promise<StoredLead> {
  const { endpoint, headers } = supabase();
  const id = randomUUID();
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(leadRow(input, id)),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[leads] storage request failed", { reason: err instanceof Error ? err.name : "unknown" });
    throw new StorageError("storage unreachable");
  }
  if (!res.ok) {
    console.error("[leads] storage rejected insert", { status: res.status });
    throw new StorageError(`storage status ${res.status}`);
  }
  return { id };
}

async function markNotified(id: string) {
  try {
    const { endpoint, headers } = supabase();
    await fetch(`${endpoint}?id=eq.${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ notified_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch {
    console.error("[leads] could not mark lead as notified", { id });
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function emailBody(input: LeadInput, id: string) {
  const rows: [string, string | number | undefined][] = [
    ["Name", input.name],
    ["Phone", input.phone],
    ["Email", input.email],
    ["Service", input.service],
    ["Vehicle", [input.vehicleYear, input.vehicleMake, input.vehicleModel].filter(Boolean).join(" ") || undefined],
    ["Preferred date (request only)", input.preferredDate],
    ["Details", input.description],
    ["Lead ID", id],
  ];
  const present = rows.filter(([, v]) => v !== undefined && v !== "");
  return {
    text: present.map(([k, v]) => `${k}: ${v}`).join("\n"),
    html: `<table>${present
      .map(([k, v]) => `<tr><th align="left" valign="top">${escapeHtml(k)}</th><td>${escapeHtml(String(v)).replace(/\n/g, "<br>")}</td></tr>`)
      .join("")}</table>`,
  };
}

/**
 * Notify the authorized recipient. Retries with backoff; never throws.
 * The lead is already stored, so a failure here is logged and the row keeps
 * `notified_at = null` for later follow-up (see README, "Un-notified leads").
 */
export async function notifyOwner(input: LeadInput, id: string, attempts = 3, baseDelayMs = 500): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_NOTIFY_FROM;
  const to = process.env.LEAD_NOTIFY_TO;
  if (!apiKey || !from || !to) {
    console.warn("[leads] notification skipped: email not configured", { id });
    return false;
  }
  const body = emailBody(input, id);
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          // Lets the provider de-duplicate if a retry lands after a slow success.
          "Idempotency-Key": `lead-${id}`,
        },
        body: JSON.stringify({ from, to: [to], subject: "New service request from the website", ...body }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (res.ok) {
        await markNotified(id);
        return true;
      }
      console.error("[leads] notification rejected", { id, attempt, status: res.status });
      if (res.status >= 400 && res.status < 500 && res.status !== 429) break; // not retryable
    } catch (err) {
      console.error("[leads] notification request failed", { id, attempt, reason: err instanceof Error ? err.name : "unknown" });
    }
    if (attempt < attempts) await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
  }
  console.error("[leads] notification FAILED after retries; lead remains stored with notified_at = null", { id });
  return false;
}
