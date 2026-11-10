/**
 * Content-Security-Policy builder (F-01, F-05, F-06).
 *
 * Principles applied:
 *  - script-src is nonce-based with 'strict-dynamic' — NO 'unsafe-inline' for
 *    scripts, NO blanket https: wildcard in production.
 *  - style-src allows 'unsafe-inline' because Next.js + Tailwind + next/font
 *    emit inline <style>/style attributes that cannot currently carry a nonce.
 *    This is a documented, accepted limitation (see docs/SECURITY.md), not an
 *    oversight. Styles cannot execute code, so the risk is low.
 *  - connect-src / media-src are restricted to 'self' plus ONLY the exact
 *    streaming origins in use (derived from env), avoiding unnecessary wildcards.
 *  - 'unsafe-eval' is added ONLY in development (Next dev tooling needs it).
 */

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null; // never allow insecure origins (F-06)
    return u.origin;
  } catch {
    return null;
  }
}

export function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";

  // Known public streaming provider used by the station today (Zeno.fm).
  const defaultStreamOrigins = ["https://stream.zeno.fm", "https://api.zeno.fm"];
  const envOrigins = [
    originOf(process.env.NEXT_PUBLIC_STREAM_URL),
    originOf(process.env.NEXT_PUBLIC_STREAM_METADATA_URL),
  ].filter(Boolean) as string[];

  const streamOrigins = Array.from(new Set([...defaultStreamOrigins, ...envOrigins]));

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "base-uri": "'self'",
    "object-src": "'none'",
    "frame-ancestors": "'none'", // clickjacking protection (replaces X-Frame-Options)
    "form-action": "'self'",
    "script-src": scriptSrc,
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' data: blob:",
    "font-src": "'self'",
    "connect-src": ["'self'", ...streamOrigins].join(" "),
    "media-src": ["'self'", "blob:", ...streamOrigins].join(" "),
    "worker-src": "'self' blob:",
    "manifest-src": "'self'",
    "frame-src": "'none'",
  };

  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v}`);
  parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}
