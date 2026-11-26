/**
 * In-memory fixed-window rate limiter and duplicate guard.
 *
 * Good enough for a single-instance preview. On serverless (Vercel) each
 * instance has its own memory, so before production swap this for a shared
 * store (e.g. Upstash/Vercel KV) — see docs/DEPLOYMENT_CHECKLIST.md.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const recent = new Map<string, { expiresAt: number; receipt: string }>();

function sweep(now: number) {
  if (buckets.size + recent.size < 5000) return;
  buckets.forEach((b, k) => b.resetAt <= now && buckets.delete(k));
  recent.forEach((r, k) => r.expiresAt <= now && recent.delete(k));
}

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60_000, now = Date.now()) {
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Returns the earlier receipt if the same payload fingerprint was accepted recently. */
export function findDuplicate(fingerprint: string, now = Date.now()): string | null {
  const hit = recent.get(fingerprint);
  return hit && hit.expiresAt > now ? hit.receipt : null;
}

export function rememberSubmission(fingerprint: string, receipt: string, ttlMs = 10 * 60_000, now = Date.now()) {
  recent.set(fingerprint, { expiresAt: now + ttlMs, receipt });
}

export function resetRateLimitState() {
  buckets.clear();
  recent.clear();
}
