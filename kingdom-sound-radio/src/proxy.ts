import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/csp";
import { isLocale, negotiateLocale } from "@/lib/i18n/config";

const LOCALE_FREE = /^\/(admin|api|feeds|media|sw\.js|manifest\.webmanifest|robots\.txt|sitemap\.xml|icon|apple-icon|favicon)/;

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Locale routing: "/" and any un-prefixed public path get a language prefix.
  const first = pathname.split("/")[1];
  if (!LOCALE_FREE.test(pathname) && !isLocale(first)) {
    const cookieLocale = request.cookies.get("ksr_locale")?.value;
    const locale = isLocale(cookieLocale) ? cookieLocale : negotiateLocale(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, { dev: process.env.NODE_ENV !== "production" });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  if (process.env.ALLOW_INDEXING !== "true" || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (pathname.startsWith("/admin") || pathname.includes("/account")) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|.*\\.(?:png|jpg|svg|ico|webp|mp3|woff2)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
