import { clientIp, rateLimit } from "../rate-limit";
import { looksAutomated, validateLead } from "./schema";
import { makeReceiptCode, notifyOwner, toNewLead } from "./service";
import type { LeadStore, Mailer, StoredLead } from "./types";

export const MAX_BODY_BYTES = 16 * 1024;
export const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

export type LeadDeps = {
  /** null = demo mode: validate, but never store or send anything. */
  store: LeadStore | null;
  mailer: Mailer;
  notifyTo: string[];
  /** Schedules work after the response is sent (Next's `after`). */
  defer: (task: () => Promise<unknown>) => void;
  log?: Pick<Console, "info" | "warn" | "error">;
};

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });

/**
 * POST /api/leads
 * 201 { receipt, demo }   stored (or validated only, in demo mode)
 * 400 { error, fieldErrors? }  invalid input
 * 403 cross-site request · 413 body too large · 429 rate limited · 503 storage failure
 */
export async function handleLeadPost(req: Request, deps: LeadDeps): Promise<Response> {
  const log = deps.log ?? console;

  // Basic cross-site protection: browsers send Origin on POST; it must match our host.
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return json(403, { error: "Cross-site requests are not allowed." });
    } catch {
      return json(403, { error: "Cross-site requests are not allowed." });
    }
  }

  const rl = rateLimit(`lead:${clientIp(req.headers)}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
  if (!rl.ok) {
    return json(429, { error: "Too many requests from this connection. Please wait a few minutes and try again." }, { "Retry-After": String(rl.retryAfterSec) });
  }

  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return json(400, { error: "Expected a JSON request." });
  }
  const raw = await req.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return json(413, { error: "Request is too large." });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "Malformed request." });
  }

  const v = validateLead(body);
  if (!v.ok) return json(400, { error: "Please correct the highlighted fields.", fieldErrors: v.errors });

  // Bots: respond like success so they don't adapt, but store and send nothing.
  if (looksAutomated(v.data)) {
    log.warn("[leads] submission dropped by spam checks");
    return json(201, { receipt: makeReceiptCode(deps.store ? "JRS" : "DEMO"), demo: !deps.store });
  }

  if (!deps.store) {
    return json(201, { receipt: makeReceiptCode("DEMO"), demo: true });
  }

  let stored: StoredLead;
  let duplicate = false;
  try {
    const r = await deps.store.insert(toNewLead(v.data));
    stored = r.lead;
    duplicate = r.duplicate;
  } catch (err) {
    log.error(`[leads] storage failure: ${err instanceof Error ? err.message : "unknown"}`);
    return json(503, { error: "We couldn't save your request just now. Please try again in a moment." });
  }

  if (!duplicate && stored.notification_status !== "sent") {
    const store = deps.store;
    deps.defer(() => notifyOwner(stored, { store, mailer: deps.mailer, to: deps.notifyTo, log }));
  }
  log.info(`[leads] stored lead=${stored.id}${duplicate ? " (duplicate submit)" : ""}`);
  return json(201, { receipt: stored.receipt_code, demo: false });
}
