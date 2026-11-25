import { sql } from "@/lib/db";
import { apiError, json } from "@/lib/api";
import { verifyStripeSignature } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type CheckoutSession = {
  id: string;
  mode: "payment" | "subscription";
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
};

/**
 * Stripe webhook. Verifies the signature, then records donations
 * idempotently (provider_ref is unique, so retries never double-count).
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return apiError(503, "unconfigured", "Payments are not configured");
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return apiError(400, "bad_signature", "Invalid signature");
  }
  const event = JSON.parse(payload) as { type: string; data: { object: CheckoutSession } };
  const s = event.data.object;

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const status = s.payment_status === "paid" || s.payment_status === "no_payment_required" ? "succeeded" : "pending";
    const uuid = /^[0-9a-f-]{36}$/;
    const userId = s.metadata?.user_id && uuid.test(s.metadata.user_id) ? s.metadata.user_id : null;
    const campaignId = s.metadata?.campaign_id && uuid.test(s.metadata.campaign_id) ? s.metadata.campaign_id : null;
    if (s.amount_total && s.amount_total > 0) {
      await sql`
        INSERT INTO donations (user_id, campaign_id, amount_cents, currency, recurring, status, provider, provider_ref, email)
        VALUES (
          (SELECT id FROM users WHERE id = ${userId}),
          (SELECT id FROM fundraising_campaigns WHERE id = ${campaignId}),
          ${s.amount_total}, ${s.currency ?? "usd"}, ${s.mode === "subscription"}, ${status}, 'stripe', ${s.id},
          ${s.customer_details?.email ?? null})
        ON CONFLICT (provider_ref) DO UPDATE SET status = EXCLUDED.status`;
    }
  } else if (event.type === "checkout.session.async_payment_failed") {
    await sql`UPDATE donations SET status = 'failed' WHERE provider_ref = ${s.id}`;
  }
  return json({ received: true });
}
