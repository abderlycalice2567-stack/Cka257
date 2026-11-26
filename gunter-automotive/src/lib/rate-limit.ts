// Fixed-window in-memory limiter. Fine for a single instance / preview. On
// Vercel each serverless instance has its own memory, so production should
// back this with a shared store (e.g. Upstash Redis) or a WAF rule.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return { ok: true, resetAt: now + windowMs };
  }
  b.count += 1;
  return { ok: b.count <= limit, resetAt: b.resetAt };
}

export function resetRateLimits() {
  buckets.clear();
}
