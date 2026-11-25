import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Stripe integration using the REST API (hosted Checkout). Card data
 * never touches this application. Untested against a live account until the
 * station provides keys — see docs/LAUNCH-CHECKLIST.md.
 */
export async function createCheckoutSession(opts: {
  amountCents: number;
  currency: string;
  recurring: boolean;
  successUrl: string;
  cancelUrl: string;
  email?: string;
  campaignId?: string | null;
  userId?: string | null;
}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  const p = new URLSearchParams();
  p.set("mode", opts.recurring ? "subscription" : "payment");
  p.set("success_url", opts.successUrl);
  p.set("cancel_url", opts.cancelUrl);
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", opts.currency);
  p.set("line_items[0][price_data][unit_amount]", String(opts.amountCents));
  p.set("line_items[0][price_data][product_data][name]", opts.recurring ? "Monthly partnership" : "Donation");
  if (opts.recurring) p.set("line_items[0][price_data][recurring][interval]", "month");
  if (opts.email) p.set("customer_email", opts.email);
  if (opts.campaignId) p.set("metadata[campaign_id]", opts.campaignId);
  if (opts.userId) p.set("metadata[user_id]", opts.userId);
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: p,
  });
  if (!res.ok) throw new Error(`Stripe error ${res.status}`);
  return (await res.json()) as { id: string; url: string };
}

/** Verifies a Stripe-Signature header (v1 scheme) with a 5-minute tolerance. */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  ) as Record<string, string>;
  const t = Number(parts.t);
  const sigs = header
    .split(",")
    .filter((kv) => kv.trim().startsWith("v1="))
    .map((kv) => kv.trim().slice(3));
  if (!t || !sigs.length || Math.abs(nowSec - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
