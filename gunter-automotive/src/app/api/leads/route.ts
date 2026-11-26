import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { isDemoMode } from "@/lib/env";
import { recordNotification, StorageError, storeLead } from "@/lib/leads";
import { log } from "@/lib/log";
import { notifyOwner } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, leadSchema, looksLikeBot } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: NextRequest) {
  // Same-origin check: browsers always send Origin on cross-site POSTs.
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return json({ error: "forbidden" }, 403);

  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return json({ error: "invalid_request", message: "Expected JSON." }, 415);
  }

  const limit = rateLimit(`lead:${clientIp(req)}`, RATE_LIMIT.max, RATE_LIMIT.windowMs);
  if (!limit.ok) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return json({ error: "rate_limited", message: "Too many requests. Please wait a few minutes and try again." }, 429, { "Retry-After": String(retryAfter) });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "invalid_request", message: "Request too large." }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_request", message: "Malformed JSON." }, 400);
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation_failed", fields: fieldErrors(parsed.error) }, 400);
  }
  const lead = parsed.data;

  // Silently accept obvious bots so they don't learn to adapt; nothing is stored.
  if (looksLikeBot(lead)) {
    log.warn("lead.bot_rejected");
    return json({ receiptId: crypto.randomUUID(), mode: "accepted" }, 201);
  }

  const idemHeader = req.headers.get("idempotency-key");
  const idempotencyKey = idemHeader && /^[A-Za-z0-9-]{8,64}$/.test(idemHeader) ? idemHeader : null;

  if (isDemoMode()) {
    // Demo mode: nothing is stored and nobody is notified. The UI says so plainly.
    log.info("lead.demo_accepted");
    return json({ receiptId: `demo-${crypto.randomUUID()}`, mode: "demo" }, 201);
  }

  let stored;
  try {
    stored = await storeLead(lead, idempotencyKey, "website:/request");
  } catch (err) {
    log.error("lead.store_failed", { code: err instanceof StorageError ? err.code : "unknown" });
    return json({ error: "storage_unavailable", message: "We couldn't save your request just now. Please try again in a moment." }, 503);
  }

  if (stored.duplicate) {
    log.info("lead.duplicate", { receipt: stored.id });
    return json({ receiptId: stored.id, mode: "stored" }, 201);
  }

  log.info("lead.stored", { receipt: stored.id });

  // Notify after the response so the visitor isn't kept waiting. Failures are
  // recorded on the lead (notify_error) and retried by scripts/retry-notifications.mjs.
  after(async () => {
    const result = await notifyOwner(lead, stored.id);
    await recordNotification(stored.id, result.ok, result.ok ? null : result.code, result.attempts);
    if (result.ok) log.info("lead.notified", { receipt: stored.id, attempts: result.attempts });
    else log.error("lead.notify_failed", { receipt: stored.id, code: result.code, attempts: result.attempts });
  });

  return json({ receiptId: stored.id, mode: "stored" }, 201);
}
