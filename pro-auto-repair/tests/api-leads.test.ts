import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/leads/route";
import { resetRateLimitState } from "@/lib/rate-limit";

const valid = {
  name: "Test Driver",
  email: "driver@example.com",
  service: "general-repairs",
  description: "Grinding noise when braking.",
  consent: true,
  elapsedMs: 9000,
};

let ip = 0;
const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ip}`, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const live = () => {
  vi.stubEnv("SUPABASE_URL", "https://db.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("LEAD_NOTIFY_FROM", "from@test.dev");
  vi.stubEnv("LEAD_NOTIFY_TO", "to@test.dev");
};

beforeEach(() => {
  resetRateLimitState();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/leads", () => {
  it("demo mode: validates but never stores, sends or claims delivery", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ receipt: null, mode: "demo" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 with field errors for invalid input and malformed JSON", async () => {
    const res = await post({ ...valid, email: "", name: "" });
    expect(res.status).toBe(400);
    expect((await res.json()).fields).toHaveProperty("name");
    expect((await post("{not json")).status).toBe(400);
  });

  it("returns 429 after the per-client limit", async () => {
    const headers = { "x-forwarded-for": "203.0.113.9" };
    for (let i = 0; i < 5; i++) expect((await post(valid, headers)).status).toBe(200);
    const res = await post(valid, headers);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });

  it("live: stores the lead, notifies, and returns 201 with an opaque receipt", async () => {
    live();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await post(valid);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.receipt).toMatch(/^[A-F0-9]{10}$/);
    const [insertUrl, insertInit] = fetchMock.mock.calls[0];
    expect(insertUrl).toBe("https://db.test/rest/v1/leads");
    const row = JSON.parse(insertInit.body);
    expect(row).toMatchObject({ name: "Test Driver", service: "general-repairs", status: "new" });
    expect(row.id).not.toContain(body.receipt.toLowerCase());
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.resend.com/emails");
  });

  it("live: returns 503 when storage fails and does not notify", async () => {
    live();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("live: a failed notification is retried and never loses the stored lead", async () => {
    live();
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("resend") ? new Response(null, { status: 500 }) : new Response(null, { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const pending = post(valid);
    await vi.runAllTimersAsync();
    const res = await pending;
    vi.useRealTimers();
    expect(res.status).toBe(201);
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("resend"))).toHaveLength(3);
  });

  it("live: an identical resubmission returns the same receipt without a second insert", async () => {
    live();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = await (await post(valid)).json();
    const calls = fetchMock.mock.calls.length;
    const second = await (await post(valid)).json();
    expect(second.receipt).toBe(first.receipt);
    expect(fetchMock.mock.calls.length).toBe(calls);
  });

  it("rejects honeypot submissions without storing", async () => {
    live();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await post({ ...valid, leaveBlank: "Spam Co" });
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never logs customer details", async () => {
    live();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    await post(valid);
    const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls);
    expect(logged).not.toContain("driver@example.com");
    expect(logged).not.toContain("Test Driver");
  });
});
