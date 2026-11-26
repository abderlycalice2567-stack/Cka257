import { NextResponse, type NextRequest } from "next/server";

/**
 * Preview protection.
 *  - When PREVIEW_PASSWORD is set, every page requires HTTP Basic auth.
 *  - Unless ALLOW_INDEXING=true, every response carries X-Robots-Tag: noindex.
 * The cron endpoint authenticates with its own bearer secret instead.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(request: NextRequest) {
  const password = process.env.PREVIEW_PASSWORD;
  const { pathname } = request.nextUrl;

  if (password && !pathname.startsWith("/api/cron/")) {
    const header = request.headers.get("authorization") ?? "";
    let ok = false;
    if (header.startsWith("Basic ")) {
      try {
        const decoded = atob(header.slice(6));
        ok = timingSafeEqual(decoded.slice(decoded.indexOf(":") + 1), password);
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      return new NextResponse("Private preview — authentication required.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Private preview", charset="UTF-8"',
          "X-Robots-Tag": "noindex, nofollow",
          "Cache-Control": "no-store",
        },
      });
    }
  }

  const response = NextResponse.next();
  if (process.env.ALLOW_INDEXING !== "true" || pathname.startsWith("/api") || pathname === "/thank-you") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
