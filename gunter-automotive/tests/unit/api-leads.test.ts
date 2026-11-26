import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `after()` needs a Next request scope; run the callback inline in tests.
const afterCallbacks: (() => Promise<void>)[] = [];
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => Promise<void>) => afterCallbacks.push(fn) }));

const { POST } = await import("@/app/api/leads/route");
const { resetRateLimits } = await import("@/lib/rate-limit");

const body = {
  name: "Jamie Doe",
  email: "jamie@example.com",
  service: "repair",
  description: "Grinding noise when braking.",
  consent: true,
  startedAt: Date.now() - 60_000,
};

const req = (data: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7", ...headers },
    body: typeof data === "string" ? data : JSON.stringify(data),
  });

beforeEach(() => {
  resetRateLimits();
  afterCallbacks.length = 0;
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/leads: demo mode (no database configured)", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  });

  it("returns 201 with a demo receipt and stores nothing", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await POST(req(body));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mode).toBe("demo");
    expect(json.receiptId).toMatch(/^demo-/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 with field errors for invalid input", async () => {
    const res = await POST(req({ ...body, email: "nope", description: "" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("validation_failed");
    expect(json.fields.email).toBeTruthy();
    expect(json.fields.description).toBeTruthy();
  });

  it("returns 400 for malformed JSON and 415 for non-JSON", async () => {
    expect((await POST(req("{bad"))).status).toBe(400);
    const r = new NextRequest("http://localhost:3000/api/leads", { method: "POST", headers: { "content-type": "text/plain" }, body: "x" });
    expect((await POST(r)).status).toBe(415);
  });

  it("rejects cross-origin posts", async () => {
    expect((await POST(req(body, { origin: "https://evil.example" }))).status).toBe(403);
  });

  it("rate-limits after 5 requests per window", async () => {
    for (let i = 0; i < 5; i++) expect((await POST(req(body))).status).toBe(201);
    const res = await POST(req(body));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });

  it("silently drops honeypot submissions", async () => {
    const res = await POST(req({ ...body, website: "spam.example" }));
    expect(res.status).toBe(201);
    expect((await res.json()).mode).toBe("accepted");
  });
});

describe("POST /api/leads: with storage", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://db.example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("LEAD_NOTIFY_FROM", "Leads <leads@example.com>");
    vi.stubEnv("LEAD_NOTIFY_TO", "owner@example.com");
  });

  it("stores the lead, returns 201, then notifies and records the result", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        if (url.includes("/rest/v1/leads?select=id") && init?.method === "POST") return new Response(JSON.stringify([{ id: "11111111-2222-3333-4444-555555555555" }]), { status: 201 });
        if (url.startsWith("https://api.resend.com")) return new Response("{}", { status: 200 });
        return new Response(null, { status: 204 });
      }),
    );
    const res = await POST(req(body, { "idempotency-key": "abcdef12-3456" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ receiptId: "11111111-2222-3333-4444-555555555555", mode: "stored" });

    const insert = JSON.parse(String(calls[0]!.init!.body));
    expect(insert.idempotency_key).toBe("abcdef12-3456");
    expect(insert.details.description).toBe(body.description);
    expect(insert.consent_at).toBeTruthy();
    expect(calls[0]!.init!.headers).toMatchObject({ Authorization: "Bearer service-key" });

    expect(afterCallbacks).toHaveLength(1);
    await afterCallbacks[0]!();
    expect(calls.some((c) => c.url === "https://api.resend.com/emails")).toBe(true);
    const patch = calls.find((c) => c.init?.method === "PATCH")!;
    expect(JSON.parse(String(patch.init!.body))).toMatchObject({ notify_attempts: 1, notify_error: null });
  });

  it("returns 503 when storage fails and never notifies", async () => {
    const fetchSpy = vi.fn(async () => new Response("down", { status: 500 }));
    vi.stubGlobal("fetch", fetchSpy);
    const res = await POST(req(body));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("storage_unavailable");
    expect(afterCallbacks).toHaveLength(0);
  });

  it("returns the original receipt for a duplicate idempotency key without re-notifying", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === "POST") return new Response("{}", { status: 409 });
        if (url.includes("idempotency_key=eq.")) return new Response(JSON.stringify([{ id: "existing-id-0001" }]), { status: 200 });
        return new Response(null, { status: 500 });
      }),
    );
    const res = await POST(req(body, { "idempotency-key": "abcdef12-3456" }));
    expect(res.status).toBe(201);
    expect((await res.json()).receiptId).toBe("existing-id-0001");
    expect(afterCallbacks).toHaveLength(0);
  });

  it("never logs customer details", async () => {
    const logs: string[] = [];
    for (const m of ["info", "warn", "error"] as const) vi.spyOn(console, m).mockImplementation((...args: unknown[]) => void logs.push(String(args[0])));
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 500 })));
    await POST(req(body));
    const all = logs.join("\n");
    expect(all).not.toContain(body.name);
    expect(all).not.toContain(body.email);
    expect(all).not.toContain(body.description);
  });
});
