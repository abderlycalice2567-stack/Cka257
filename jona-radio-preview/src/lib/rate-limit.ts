/**
 * Minimal in-memory, best-effort rate limiter for the DEMO form endpoints
 * (F-07). This is intentionally simple and process-local — adequate for a
 * preview. Production should use a shared store (e.g. Redis/Upstash) or the
 * host's edge rate limiting; see docs/PRODUCTION-MIGRATION.md.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count };
}

export function clientKey(req: Request, scope: string) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || "local";
  return `${scope}:${ip}`;
}
