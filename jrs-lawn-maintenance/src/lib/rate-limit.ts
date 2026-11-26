// Fixed-window in-memory limiter. Good for a single instance / low-traffic
// prototype. Serverless instances don't share memory, so production should
// back this with a shared store (e.g. Upstash Redis or a Postgres function) —
// see docs/DEPLOYMENT-CHECKLIST.md.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return { ok: true, retryAfterSec: 0 };
  }
  b.count += 1;
  return { ok: b.count <= limit, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
}

export function resetRateLimits() {
  buckets.clear();
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
