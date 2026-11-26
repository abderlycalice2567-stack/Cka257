import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional HTTP Basic gate for the private preview.
 * Active only when PREVIEW_USERNAME and PREVIEW_PASSWORD are set and the site
 * is not in production mode.
 */
export function middleware(request: NextRequest) {
  const user = process.env.PREVIEW_USERNAME;
  const pass = process.env.PREVIEW_PASSWORD;
  if (process.env.SITE_MODE === "production" || !user || !pass) return NextResponse.next();

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(":");
      if (sep > -1 && safeEqual(decoded.slice(0, sep), user) && safeEqual(decoded.slice(sep + 1), pass)) {
        return NextResponse.next();
      }
    } catch {
      /* fall through to 401 */
    }
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Private preview", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
