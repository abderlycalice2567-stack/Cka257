export type NotificationStatus = "pending" | "sent" | "failed";

/** Row shape for the `leads` table (see supabase/migrations). */
export type NewLead = {
  receipt_code: string;
  idempotency_key: string;
  name: string;
  phone: string | null;
  email: string | null;
  service: string;
  details: {
    description: string;
    zip?: string;
    yard_size?: string;
    frequency?: string;
    access_notes?: string;
    preferred_date?: string;
    marketing_consent: boolean;
  };
  consent_at: string;
  source: string;
};

export type StoredLead = NewLead & {
  id: string;
  created_at: string;
  status: string;
  notification_status: NotificationStatus;
  notification_attempts: number;
};

export interface LeadStore {
  /** Inserts a lead; if the idempotency key was already used, returns the existing row instead. */
  insert(lead: NewLead): Promise<{ lead: StoredLead; duplicate: boolean }>;
  updateNotification(id: string, patch: { notification_status: NotificationStatus; notification_attempts: number; last_notification_error: string | null; notified_at: string | null }): Promise<void>;
  /** Leads whose owner notification hasn't succeeded yet (for the retry job). */
  pendingNotifications(opts: { maxAttempts: number; limit: number; sinceIso: string }): Promise<StoredLead[]>;
}

export interface Mailer {
  send(mail: { to: string[]; subject: string; text: string; replyTo?: string }): Promise<void>;
}
