import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/leads/route";
import { resetRateLimits } from "@/lib/leads/rate-limit";
import { valid } from "../support/fixtures";

const ENV_KEYS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "EMAIL_FROM", "LEAD_NOTIFY_TO"] as const;

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function liveEnv() {
  process.env.SUPABASE_URL = "https://db.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  process.env.RESEND_API_KEY = "re_test";
  process.env.EMAIL_FROM = "Requests <requests@test.invalid>";
  process.env.LEAD_NOTIFY_TO = "owner@test.invalid";
}

const storedRow = { id: "11111111-1111-4111-8111-111111111111", created_at: "2026-01-01T00:00:00Z", name: "Test Person", phone: "(770) 555-0100", email: null, service: "diagnostics", details: { receipt: "LAR-X", description: "d" } };

type Call = { url: string; init: RequestInit };

/** Routes fake fetch calls by URL; records every call. */
function mockFetch(handlers: { leads?: () => Response; email?: () => Response; mark?: () => Response }) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init: RequestInit = {}) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.includes("/rest/v1/leads")) return (handlers.leads ?? (() => Response.json([storedRow], { status: 201 })))();
      if (url.includes("api.resend.com")) return (handlers.email ?? (() => Response.json({ id: "e1" })))();
      if (url.includes("/rest/v1/lead_notifications")) return (handlers.mark ?? (() => new Response(null, { status: 204 })))();
      throw new Error(`unexpected fetch ${url}`);
    }),
  );
  return calls;
}

describe("POST /api/leads", () => {
  beforeEach(() => {
    resetRateLimits();
    for (const k of ENV_KEYS) delete process.env[k];
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("demo mode: validates, makes no network calls, and never claims the request was sent", async () => {
    const calls = mockFetch({});
    const res = await post(valid);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.demo).toBe(true);
    expect(body.receipt).toBeUndefined();
    expect(body.message).toMatch(/NOT stored or sent/);
    expect(calls).toHaveLength(0);
  });

  it("400 with field errors for invalid input, malformed JSON and oversized bodies", async () => {
    const res = await post({ ...valid, name: "", phone: "" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fields.name).toBeDefined();
    expect(body.fields.phone).toBeDefined();
    expect((await post("{not json")).status).toBe(400);
    expect((await post({ ...valid, description: "x".repeat(20000) })).status).toBe(400);
    expect((await post([valid])).status).toBe(400);
  });

  it("400 for cross-origin posts", async () => {
    const res = await post(valid, { origin: "https://evil.example", host: "localhost" });
    expect(res.status).toBe(400);
  });

  it("429 with Retry-After once the per-IP limit is exceeded", async () => {
    for (let i = 0; i < 5; i++) expect((await post(valid)).status).toBe(200);
    const res = await post(valid);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await post(valid, { "x-forwarded-for": "198.51.100.7" })).status).toBe(200);
  });

  it("201 with an opaque receipt: stores the lead, notifies the owner, marks it sent", async () => {
    liveEnv();
    const calls = mockFetch({});
    const res = await post(valid);
    expect(res.status).toBe(201);
    const { receipt } = await res.json();
    expect(receipt).toMatch(/^LAR-[0-9A-F]{10}$/);
    expect(receipt).not.toContain(storedRow.id);

    const insert = calls.find((c) => c.url.includes("/rest/v1/leads"))!;
    const sent = JSON.parse(String(insert.init.body));
    expect(sent).toMatchObject({ name: "Test Person", service: "diagnostics", source: "website:request-form", idempotency_key: valid.idempotencyKey });
    expect(sent.details).toMatchObject({ vehicle_year: 2015, vehicle_make: "Honda", receipt });
    expect(sent.consent_at).toBeTruthy();
    expect((insert.init.headers as Record<string, string>).Prefer).toContain("ignore-duplicates");

    const email = calls.find((c) => c.url.includes("resend"))!;
    const mail = JSON.parse(String(email.init.body));
    expect(mail.to).toEqual(["owner@test.invalid"]);
    expect(mail.subject).toMatch(/^\[TEST/);
    expect(mail.html).toBeUndefined();

    const mark = calls.find((c) => c.url.includes("lead_notifications"))!;
    expect(JSON.parse(String(mark.init.body)).status).toBe("sent");
  });

  it("503 when storage fails — and no notification is attempted", async () => {
    liveEnv();
    const calls = mockFetch({ leads: () => new Response("boom", { status: 500 }) });
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(calls.some((c) => c.url.includes("resend"))).toBe(false);
  });

  it("notification failure: lead stays stored, receipt still returned, outbox left pending, error logged without customer data", async () => {
    liveEnv();
    const calls = mockFetch({ email: () => new Response("down", { status: 500 }) });
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect(calls.filter((c) => c.url.includes("resend"))).toHaveLength(2); // in-request retry
    const mark = JSON.parse(String(calls.find((c) => c.url.includes("lead_notifications"))!.init.body));
    expect(mark).toMatchObject({ status: "pending", last_error: "http_500", attempts: 1 });
    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("lead.notification_failed");
    expect(logged).not.toMatch(/Test Person|555-0100|Check engine/);
  });

  it("missing email config: lead is stored and queued, not lost", async () => {
    liveEnv();
    delete process.env.RESEND_API_KEY;
    const calls = mockFetch({});
    expect((await post(valid)).status).toBe(201);
    expect(calls.some((c) => c.url.includes("resend"))).toBe(false);
    expect(JSON.parse(String(calls.find((c) => c.url.includes("lead_notifications"))!.init.body)).last_error).toBe("email_not_configured");
  });

  it("duplicate submission: same receipt, no second notification", async () => {
    liveEnv();
    mockFetch({});
    const first = await (await post(valid)).json();
    const calls = mockFetch({ leads: () => Response.json([], { status: 201 }) });
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect((await res.json()).receipt).toBe(first.receipt);
    expect(calls.some((c) => c.url.includes("resend"))).toBe(false);
  });

  it("no-JavaScript form posts are answered with a redirect", async () => {
    const form = new URLSearchParams(valid as Record<string, string>).toString();
    const ok = await post(form, { "content-type": "application/x-www-form-urlencoded" });
    expect(ok.status).toBe(303);
    expect(ok.headers.get("location")).toBe("http://localhost/thank-you?demo=1");
    const bad = await post("name=x", { "content-type": "application/x-www-form-urlencoded" });
    expect(bad.headers.get("location")).toBe("http://localhost/request?error=invalid");
  });
});
