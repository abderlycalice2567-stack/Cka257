import "server-only";
import { storageConfig } from "@/lib/env";
import type { Lead } from "@/lib/validation";

export class StorageError extends Error {
  constructor(public code: string) {
    super(`storage_error:${code}`);
  }
}

export type StoredLead = { id: string; duplicate: boolean };

/** Row shape written to public.leads (see db/migrations/001_leads.sql). */
export function toRow(lead: Lead, idempotencyKey: string | null, source: string) {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    service: lead.service,
    details: {
      vehicle_year: lead.vehicleYear,
      vehicle_make: lead.vehicleMake,
      vehicle_model: lead.vehicleModel,
      description: lead.description,
      preferred_date: lead.preferredDate, // a request, not a booking
      marketing_consent: lead.marketingConsent,
    },
    consent_at: new Date().toISOString(),
    marketing_consent_at: lead.marketingConsent ? new Date().toISOString() : null,
    source,
    idempotency_key: idempotencyKey,
  };
}

/**
 * Persist a lead using the Supabase REST API (PostgREST) with the
 * service-role key. Server-only: the key never reaches the browser.
 * A repeated idempotency key returns the original lead instead of a duplicate.
 */
export async function storeLead(lead: Lead, idempotencyKey: string | null, source: string, fetchImpl: typeof fetch = fetch): Promise<StoredLead> {
  const cfg = storageConfig();
  if (!cfg) throw new StorageError("not_configured");
  const headers = {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
    "Content-Type": "application/json",
  };

  let res: Response;
  try {
    res = await fetchImpl(`${cfg.url}/rest/v1/leads?select=id`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(toRow(lead, idempotencyKey, source)),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new StorageError("network");
  }

  if (res.status === 201) {
    const rows = (await res.json()) as { id: string }[];
    const id = rows[0]?.id;
    if (!id) throw new StorageError("no_id");
    return { id, duplicate: false };
  }

  // 409 = unique violation on idempotency_key: the same submission was retried.
  if (res.status === 409 && idempotencyKey) {
    const existing = await fetchImpl(
      `${cfg.url}/rest/v1/leads?select=id&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`,
      { headers, signal: AbortSignal.timeout(8000) },
    ).catch(() => null);
    const rows = existing?.ok ? ((await existing.json()) as { id: string }[]) : [];
    if (rows[0]?.id) return { id: rows[0].id, duplicate: true };
  }

  throw new StorageError(`http_${res.status}`);
}

/** Record the outcome of a notification attempt on the stored lead. */
export async function recordNotification(id: string, ok: boolean, errorCode: string | null, attempts: number, fetchImpl: typeof fetch = fetch) {
  const cfg = storageConfig();
  if (!cfg) return;
  await fetchImpl(`${cfg.url}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      notified_at: ok ? new Date().toISOString() : null,
      notify_attempts: attempts,
      notify_error: ok ? null : errorCode,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => undefined);
}
