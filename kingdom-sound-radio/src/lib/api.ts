import "server-only";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export function json(data: unknown, init: ResponseInit & { cache?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.cache) headers.set("Cache-Control", init.cache);
  return NextResponse.json(data, { ...init, headers });
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export function ipOf(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

/** 120 requests/minute per IP for public reads; returns a 429 response when exceeded. */
export function limitPublic(req: Request, bucket = "api", limit = 120) {
  const r = rateLimit(`${bucket}:${ipOf(req)}`, limit, 60_000);
  return r.ok ? null : apiError(429, "rate_limited", "Too many requests");
}

/** Same-origin check for cookie-authenticated JSON writes (CSRF defence). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") || req.headers.get("host"));
  } catch {
    return false;
  }
}

export function paging(url: URL, max = 50) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(max, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));
  return { page, pageSize };
}
