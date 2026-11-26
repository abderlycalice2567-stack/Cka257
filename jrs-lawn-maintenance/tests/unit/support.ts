import type { LeadStore, Mailer, NewLead, StoredLead } from "@/lib/leads/types";

export class MemoryStore implements LeadStore {
  rows: StoredLead[] = [];
  failInsert = false;
  async insert(lead: NewLead) {
    if (this.failInsert) throw new Error("storage request failed (500)");
    const existing = this.rows.find((r) => r.idempotency_key === lead.idempotency_key);
    if (existing) return { lead: existing, duplicate: true };
    const row: StoredLead = { ...lead, id: `id-${this.rows.length + 1}`, created_at: new Date().toISOString(), status: "new", notification_status: "pending", notification_attempts: 0 };
    this.rows.push(row);
    return { lead: row, duplicate: false };
  }
  async updateNotification(id: string, patch: Parameters<LeadStore["updateNotification"]>[1]) {
    const r = this.rows.find((x) => x.id === id)!;
    Object.assign(r, patch);
  }
  async pendingNotifications({ maxAttempts }: { maxAttempts: number }) {
    return this.rows.filter((r) => r.notification_status !== "sent" && r.notification_attempts < maxAttempts);
  }
}

export class FakeMailer implements Mailer {
  sent: { to: string[]; subject: string; text: string }[] = [];
  failTimes = 0;
  async send(mail: { to: string[]; subject: string; text: string }) {
    if (this.failTimes > 0) {
      this.failTimes--;
      throw new Error("email provider returned 500");
    }
    this.sent.push(mail);
  }
}

export const silentLog = { info() {}, warn() {}, error() {} };

export function validBody(over: Record<string, unknown> = {}) {
  return {
    name: "Test Customer",
    phone: "706-555-0100",
    email: "",
    service: "mowing",
    description: "Front and back yard, about a quarter acre.",
    zip: "30601",
    yardSize: "medium",
    frequency: "every-two-weeks",
    accessNotes: "Side gate is unlocked.",
    preferredDate: "",
    consent: true,
    marketingConsent: false,
    idempotencyKey: crypto.randomUUID(),
    website: "",
    elapsedMs: 30_000,
    ...over,
  };
}
