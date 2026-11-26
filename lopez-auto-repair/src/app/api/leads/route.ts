import { NextResponse, type NextRequest } from "next/server";
import { getEmailConfig, getLeadBackend } from "@/lib/leads/env";
import { logEvent } from "@/lib/leads/log";
import { NotifyError, notifyOwner } from "@/lib/leads/notify";
import { rateLimit } from "@/lib/leads/rate-limit";
import { validateLead } from "@/lib/leads/schema";
import { insertLead, markNotification, receiptFor, StorageError } from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function sameHost(origin: string, host: string | null): boolean {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * POST /api/leads
 *   201 { receipt }                 lead stored (owner notification attempted; never blocks the receipt)
 *   200 { demo: true }              DEMO MODE — validated only, nothing stored or sent
 *   400 { error, fields? }          invalid input
 *   429 { error }                   rate limited (Retry-After header)
 *   503 { error }                   storage failure — safe to retry with the same idempotency key
 *
 * Also accepts a plain HTML form post (no JavaScript) and answers with a redirect.
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded");

  const respond = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) => {
    if (isForm) {
      const url = new URL(status < 300 ? "/thank-you" : "/request", req.url);
      if (status === 201 && typeof body.receipt === "string") url.searchParams.set("receipt", body.receipt);
      else if (status === 200) url.searchParams.set("demo", "1");
      else url.searchParams.set("error", status === 400 ? "invalid" : status === 429 ? "rate" : "unavailable");
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
  };

  // Cross-site form posts are refused (browsers send Origin on POST).
  const origin = req.headers.get("origin");
  if (origin && !sameHost(origin, req.headers.get("host"))) {
    return respond(400, { error: "Invalid request origin." });
  }

  const limit = rateLimit(`leads:${clientIp(req)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    logEvent("warn", "lead.rate_limited");
    return respond(429, { error: "Too many requests. Please wait a few minutes and try again." }, { "Retry-After": String(limit.retryAfterSeconds) });
  }

  let raw: unknown;
  try {
    const bodyText = await req.text();
    if (Buffer.byteLength(bodyText) > MAX_BODY_BYTES) return respond(400, { error: "Request is too large." });
    raw = isForm ? Object.fromEntries(new URLSearchParams(bodyText)) : JSON.parse(bodyText);
  } catch {
    return respond(400, { error: "Request body could not be read." });
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return respond(400, { error: "Request body could not be read." });

  const result = validateLead(raw);
  if (!result.ok) return respond(400, { error: "Please check the highlighted fields.", fields: result.errors });
  const lead = result.data;

  const backend = getLeadBackend();
  if (!backend) {
    // DEMO MODE: never claim the request was stored or sent.
    logEvent("info", "lead.demo_validated");
    return respond(200, { demo: true, message: "Demo mode: your request was validated but NOT stored or sent." });
  }

  const receipt = receiptFor(lead.idempotencyKey);
  let row;
  try {
    row = await insertLead(backend, lead, "website:request-form");
  } catch (err) {
    logEvent("error", "lead.storage_failed", { code: err instanceof StorageError ? err.code : "unknown" });
    return respond(503, { error: "We couldn't save your request right now. Please try again in a moment." }, { "Retry-After": "30" });
  }

  if (row === null) {
    // Duplicate submission of an already-stored request: same receipt, no second notification.
    logEvent("info", "lead.duplicate_ignored", { receipt });
    return respond(201, { receipt });
  }

  // The lead is safely stored. Notification problems are logged and retried
  // later by /api/cron/retry-notifications — they never fail the request.
  try {
    await notifyOwner(getEmailConfig(), row);
    await markNotification(backend, row.id, { sent: true });
    logEvent("info", "lead.stored_and_notified", { receipt });
  } catch (err) {
    const code = err instanceof NotifyError || err instanceof StorageError ? err.code : "unknown";
    logEvent("error", "lead.notification_failed", { receipt, code });
    if (err instanceof NotifyError) {
      await markNotification(backend, row.id, { sent: false, errorCode: code, attempts: 1 }).catch(() => {
        logEvent("error", "lead.notification_mark_failed", { receipt });
      });
    }
  }

  return respond(201, { receipt });
}
