import "server-only";
import type { Mailer } from "./types";

/** Transactional email via Resend's HTTP API. */
export class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(mail: { to: string[]; subject: string; text: string; replyTo?: string }) {
    const res = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`email provider returned ${res.status}`);
  }
}

/** Used when email isn't configured: always fails so the lead stays queued for retry. */
export class UnconfiguredMailer implements Mailer {
  async send(): Promise<void> {
    throw new Error("email not configured");
  }
}
