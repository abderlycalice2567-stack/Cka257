import "server-only";
import type { LeadStore, NewLead, StoredLead } from "./types";

/**
 * Lead storage via Supabase's PostgREST API using the service-role key.
 * Server-only: the key bypasses row-level security and must never reach the browser.
 * Errors thrown here deliberately contain no customer data.
 */
export class SupabaseLeadStore implements LeadStore {
  constructor(
    private readonly url: string,
    private readonly key: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async req(path: string, init: RequestInit & { prefer?: string } = {}) {
    const { prefer, ...rest } = init;
    const res = await this.fetchImpl(`${this.url.replace(/\/$/, "")}/rest/v1/${path}`, {
      ...rest,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`storage request failed (${res.status})`);
    const body = await res.text();
    return body ? JSON.parse(body) : null;
  }

  async insert(lead: NewLead) {
    const rows = (await this.req("leads?on_conflict=idempotency_key", {
      method: "POST",
      prefer: "return=representation,resolution=ignore-duplicates",
      body: JSON.stringify(lead),
    })) as StoredLead[] | null;
    if (rows && rows[0]) return { lead: rows[0], duplicate: false };
    const existing = (await this.req(`leads?idempotency_key=eq.${encodeURIComponent(lead.idempotency_key)}&select=*&limit=1`)) as StoredLead[];
    if (!existing[0]) throw new Error("storage returned no row");
    return { lead: existing[0], duplicate: true };
  }

  async updateNotification(id: string, patch: Parameters<LeadStore["updateNotification"]>[1]) {
    await this.req(`leads?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(patch) });
  }

  async pendingNotifications({ maxAttempts, limit, sinceIso }: { maxAttempts: number; limit: number; sinceIso: string }) {
    const q = new URLSearchParams({
      select: "*",
      notification_status: "neq.sent",
      notification_attempts: `lt.${maxAttempts}`,
      created_at: `gte.${sinceIso}`,
      order: "created_at.asc",
      limit: String(limit),
    });
    return (await this.req(`leads?${q}`)) as StoredLead[];
  }
}
