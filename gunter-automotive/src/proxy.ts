import { NextResponse, type NextRequest } from "next/server";

/**
 * Preview protection.
 *  - Unless SITE_MODE=live, every response carries X-Robots-Tag: noindex.
 *  - When PREVIEW_USERNAME and PREVIEW_PASSWORD are set, HTTP Basic Auth is
 *    required for every route (set these on every Vercel preview, or use
 *    Vercel Deployment Protection instead).
 */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(request: NextRequest) {
  const live = process.env.SITE_MODE === "live";
  const user = process.env.PREVIEW_USERNAME;
  const pass = process.env.PREVIEW_PASSWORD;

  if (!live && user && pass) {
    const header = request.headers.get("authorization") ?? "";
    let ok = false;
    if (header.startsWith("Basic ")) {
      try {
        const [u, ...rest] = atob(header.slice(6)).split(":");
        ok = timingSafeEqual(u ?? "", user) && timingSafeEqual(rest.join(":"), pass);
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      return new NextResponse("Private preview. Authentication required.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Gunter Automotive preview", charset="UTF-8"', "X-Robots-Tag": "noindex, nofollow" },
      });
    }
  }

  const response = NextResponse.next();
  if (!live || request.nextUrl.pathname.startsWith("/api") || request.nextUrl.pathname.startsWith("/thank-you")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
