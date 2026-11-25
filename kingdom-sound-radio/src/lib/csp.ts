/**
 * Builds the per-request Content-Security-Policy. Scripts are allowed only with
 * the request nonce ('strict-dynamic' lets Next's own chunks load). Media and
 * connect sources include the configured stream hosts.
 */
export function buildCsp(nonce: string, opts: { dev?: boolean; mediaHosts?: string[] } = {}) {
  const media = ["'self'", "blob:", "https:"];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'", "https://checkout.stripe.com"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(opts.dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    // Live streams can live on any HTTPS host the station configures (AzuraCast,
    // Icecast, Zeno…). Stream URLs are validated as https:// at write time.
    "media-src": [...media, ...(opts.mediaHosts ?? [])],
    // Now-playing metadata is fetched server-side, so the browser only talks to us.
    "connect-src": ["'self'"],
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
    "frame-src": ["https://www.youtube-nocookie.com", "https://open.spotify.com"],
  };
  if (!opts.dev) directives["upgrade-insecure-requests"] = [];
  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}
