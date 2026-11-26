import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, checkBasicAuth } from "@/lib/csp";

/**
 * Runs on every page/API request:
 *  1. Private-preview gate (HTTP Basic auth) when PREVIEW_PASSWORD is set.
 *  2. noindex on everything unless ALLOW_INDEXING=true (owner-approved launch only).
 *  3. Per-request CSP nonce.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const previewPassword = process.env.PREVIEW_PASSWORD;
  const isCron = pathname.startsWith("/api/cron/"); // protected by CRON_SECRET instead

  if (previewPassword && !isCron) {
    const user = process.env.PREVIEW_USER || "preview";
    if (!checkBasicAuth(request.headers.get("authorization"), user, previewPassword)) {
      return new NextResponse("Private preview — authentication required.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Private preview", charset="UTF-8"', "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
      });
    }
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, { dev: process.env.NODE_ENV !== "production" });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (process.env.NODE_ENV === "production") response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (process.env.ALLOW_INDEXING !== "true" || pathname.startsWith("/api") || pathname === "/thank-you") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (previewPassword) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|.*\\.(?:png|jpg|svg|ico|webp|woff2)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
