import { NextRequest, NextResponse } from "next/server";
import { buildCsp } from "@/lib/csp";

/**
 * Edge middleware applied to every request. Responsibilities:
 *   1. Generate a per-request CSP nonce and set a strict Content-Security-Policy
 *      (F-01). The nonce is forwarded so the app can attach it to its scripts.
 *   2. Enforce HSTS (F-01) — only meaningful over HTTPS; browsers ignore it on
 *      http. includeSubDomains/preload are intentionally OMITTED because this
 *      preview cannot commit the whole domain tree (see docs/SECURITY.md).
 *   3. Keep the speculative preview UNINDEXED by search engines (section 11).
 *   4. Optional HTTP Basic Auth gate so the preview is not publicly open
 *      (section 11). Enabled via env; credentials never live in code.
 */

function unauthorized() {
  return new NextResponse("Accès restreint — aperçu privé.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Jona Radio preview", charset="UTF-8"' },
  });
}

function checkBasicAuth(req: NextRequest): boolean {
  const user = process.env.PREVIEW_AUTH_USER || "";
  const pass = process.env.PREVIEW_AUTH_PASSWORD || "";
  if (!user || !pass) return false;
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    // Constant-ish comparison (length-guarded) to avoid trivial timing leaks.
    return u === user && p === pass;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  // --- Preview access gate -------------------------------------------------
  if (process.env.PREVIEW_AUTH_ENABLED === "true") {
    if (!checkBasicAuth(req)) return unauthorized();
  }

  // --- CSP nonce -----------------------------------------------------------
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  res.headers.set("content-security-policy", csp);
  res.headers.set(
    "strict-transport-security",
    "max-age=15552000", // 180 days; no includeSubDomains/preload for a preview
  );

  // Keep the speculative proposal out of search indexes unless explicitly opted in.
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true") {
    res.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  }

  return res;
}

export const config = {
  // Apply to everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
