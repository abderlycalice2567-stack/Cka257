/** Per-request Content-Security-Policy. Scripts only run with the request nonce. */
export function buildCsp(nonce: string, opts: { dev?: boolean } = {}) {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(opts.dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(opts.dev ? ["ws:"] : [])],
    "manifest-src": ["'self'"],
  };
  if (!opts.dev) directives["upgrade-insecure-requests"] = [];
  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}

/** Checks an HTTP Basic Authorization header against the preview credentials. */
export function checkBasicAuth(header: string | null, user: string, password: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const i = decoded.indexOf(":");
  if (i < 0) return false;
  const a = decoded.slice(0, i);
  const b = decoded.slice(i + 1);
  // Compare full strings without early exit.
  const expected = `${user}:${password}`;
  const given = `${a}:${b}`;
  let diff = given.length ^ expected.length;
  for (let k = 0; k < Math.max(given.length, expected.length); k++) diff |= (given.charCodeAt(k) || 0) ^ (expected.charCodeAt(k) || 0);
  return diff === 0;
}
