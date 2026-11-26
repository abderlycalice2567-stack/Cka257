import "server-only";
import { createHash } from "node:crypto";
import type { LeadBackend } from "./env";
import type { LeadInput } from "./schema";

/**
 * Supabase access through PostgREST using the service-role key.
 * Server-only: this module must never be imported from a client component.
 */

export class StorageError extends Error {
  constructor(public readonly code: string) {
    super(`lead storage failed: ${code}`);
  }
}

export type LeadRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  email: string | null;
  service: string;
  details: Record<string, unknown>;
};

/** Opaque, stable receipt derived from the idempotency key (never the DB id). */
export function receiptFor(idempotencyKey: string): string {
  return `LAR-${createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 10).toUpperCase()}`;
}

async function rest(backend: LeadBackend, path: string, init: RequestInit & { prefer?: string } = {}): Promise<Response> {
  const { prefer, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(`${backend.supabaseUrl}/rest/v1/${path}`, {
      ...rest,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        apikey: backend.serviceRoleKey,
        Authorization: `Bearer ${backend.serviceRoleKey}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
    });
  } catch {
    throw new StorageError("network");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Persist a lead. Returns the row when it was newly created, or null when the
 * same idempotency key was already stored (duplicate submission).
 * A database trigger creates the matching `lead_notifications` row in the same
 * transaction, so a stored lead always has a pending notification.
 */
export async function insertLead(backend: LeadBackend, lead: LeadInput, source: string): Promise<LeadRow | null> {
  const receipt = receiptFor(lead.idempotencyKey);
  const body = {
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    service: lead.service,
    details: {
      description: lead.description,
      vehicle_year: lead.vehicleYear,
      vehicle_make: lead.vehicleMake,
      vehicle_model: lead.vehicleModel,
      preferred_date: lead.preferredDate,
      marketing_consent: lead.marketingConsent,
      receipt,
    },
    consent_at: new Date().toISOString(),
    source,
    idempotency_key: lead.idempotencyKey,
  };
  const res = await rest(backend, "leads?on_conflict=idempotency_key", {
    method: "POST",
    body: JSON.stringify(body),
    prefer: "resolution=ignore-duplicates,return=representation",
  });
  if (!res.ok) throw new StorageError(`http_${res.status}`);
  const rows = (await res.json().catch(() => null)) as LeadRow[] | null;
  if (!Array.isArray(rows)) throw new StorageError("bad_response");
  return rows[0] ?? null;
}

export async function markNotification(
  backend: LeadBackend,
  leadId: string,
  result: { sent: true } | { sent: false; errorCode: string; attempts: number },
): Promise<void> {
  const now = new Date().toISOString();
  const patch = result.sent
    ? { status: "sent", sent_at: now, last_attempt_at: now, last_error: null }
    : { status: "pending", last_attempt_at: now, last_error: result.errorCode.slice(0, 60), attempts: result.attempts };
  const res = await rest(backend, `lead_notifications?lead_id=eq.${encodeURIComponent(leadId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    prefer: "return=minimal",
  });
  if (!res.ok) throw new StorageError(`http_${res.status}`);
}

export type PendingNotification = { lead_id: string; attempts: number; leads: LeadRow };

export const MAX_NOTIFY_ATTEMPTS = 12;

export async function listPendingNotifications(backend: LeadBackend, limit = 20): Promise<PendingNotification[]> {
  const res = await rest(
    backend,
    `lead_notifications?status=eq.pending&attempts=lt.${MAX_NOTIFY_ATTEMPTS}&select=lead_id,attempts,leads(id,created_at,name,phone,email,service,details)&order=last_attempt_at.asc.nullsfirst&limit=${limit}`,
  );
  if (!res.ok) throw new StorageError(`http_${res.status}`);
  const rows = (await res.json().catch(() => null)) as PendingNotification[] | null;
  if (!Array.isArray(rows)) throw new StorageError("bad_response");
  return rows.filter((r) => r.leads);
}
