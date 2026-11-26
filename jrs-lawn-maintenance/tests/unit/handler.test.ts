import { beforeEach, describe, expect, it } from "vitest";
import { handleLeadPost, RATE_LIMIT, type LeadDeps } from "@/lib/leads/handler";
import { buildNotification, notifyOwner, retryPendingNotifications } from "@/lib/leads/service";
import { resetRateLimits } from "@/lib/rate-limit";
import { FakeMailer, MemoryStore, silentLog, validBody } from "./support";

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", origin: "http://localhost:3000", "x-forwarded-for": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

let store: MemoryStore;
let mailer: FakeMailer;
let deferred: (() => Promise<unknown>)[];
let deps: LeadDeps;

beforeEach(() => {
  resetRateLimits();
  store = new MemoryStore();
  mailer = new FakeMailer();
  deferred = [];
  deps = { store, mailer, notifyTo: ["owner-test@example.com"], defer: (t) => deferred.push(t), log: silentLog };
});

const runDeferred = () => Promise.all(deferred.map((t) => t()));

describe("POST /api/leads", () => {
  it("stores a valid lead, returns 201 with an opaque receipt and notifies after responding", async () => {
    const res = await handleLeadPost(post(validBody()), deps);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.demo).toBe(false);
    expect(body.receipt).toMatch(/^JRS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(body.receipt).not.toContain(store.rows[0]!.id);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]!.details).toMatchObject({ zip: "30601", yard_size: "medium", frequency: "every-two-weeks", marketing_consent: false });
    expect(store.rows[0]!.consent_at).toBeTruthy();
    expect(mailer.sent).toHaveLength(0); // deferred until after the response
    await runDeferred();
    expect(mailer.sent).toHaveLength(1);
    expect(store.rows[0]!.notification_status).toBe("sent");
  });

  it("demo mode validates but never stores or sends, and says so", async () => {
    const res = await handleLeadPost(post(validBody()), { ...deps, store: null });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ demo: true });
    expect(body.receipt).toMatch(/^DEMO-/);
    expect(deferred).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("returns 400 with field errors for invalid input", async () => {
    const res = await handleLeadPost(post(validBody({ name: "", consent: false })), deps);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fieldErrors.name).toBeDefined();
    expect(body.fieldErrors.consent).toBeDefined();
    expect(store.rows).toHaveLength(0);
  });

  it("returns 400 for non-JSON or malformed bodies, 413 for oversized ones", async () => {
    expect((await handleLeadPost(post("{oops"), deps)).status).toBe(400);
    expect((await handleLeadPost(post("a=b", { "content-type": "application/x-www-form-urlencoded" }), deps)).status).toBe(400);
    expect((await handleLeadPost(post(JSON.stringify({ pad: "x".repeat(20_000) })), deps)).status).toBe(413);
  });

  it("rejects cross-site requests", async () => {
    const res = await handleLeadPost(post(validBody(), { origin: "https://evil.example" }), deps);
    expect(res.status).toBe(403);
  });

  it("treats a repeated idempotency key as the same request (no duplicate lead or email)", async () => {
    const body = validBody();
    const a = await (await handleLeadPost(post(body), deps)).json();
    const b = await (await handleLeadPost(post(body), deps)).json();
    expect(b.receipt).toBe(a.receipt);
    expect(store.rows).toHaveLength(1);
    await runDeferred();
    expect(mailer.sent).toHaveLength(1);
  });

  it("rate-limits per IP with 429 and Retry-After", async () => {
    for (let i = 0; i < RATE_LIMIT.limit; i++) expect((await handleLeadPost(post(validBody()), deps)).status).toBe(201);
    const res = await handleLeadPost(post(validBody()), deps);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    // a different IP is unaffected
    expect((await handleLeadPost(post(validBody(), { "x-forwarded-for": "198.51.100.9" }), deps)).status).toBe(201);
  });

  it("returns 503 when storage fails, without leaking details", async () => {
    store.failInsert = true;
    const res = await handleLeadPost(post(validBody()), deps);
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toMatch(/500|storage request/);
  });

  it("silently drops bot submissions (honeypot) without storing", async () => {
    const res = await handleLeadPost(post(validBody({ website: "spam" })), deps);
    expect(res.status).toBe(201);
    expect(store.rows).toHaveLength(0);
  });
});

describe("owner notification", () => {
  it("keeps the lead and records failure when email keeps failing; retry job delivers later", async () => {
    const logs: string[] = [];
    const log = { info: (m: string) => logs.push(m), error: (m: string) => logs.push(m) };
    await handleLeadPost(post(validBody({ name: "Secret Name", phone: "706-555-0199" })), deps);
    mailer.failTimes = 3;
    const lead = store.rows[0]!;
    const ok = await notifyOwner(lead, { store, mailer, to: deps.notifyTo, backoffMs: 1, log });
    expect(ok).toBe(false);
    expect(store.rows).toHaveLength(1);
    expect(lead.notification_status).toBe("failed");
    expect(lead.notification_attempts).toBe(3);
    // logs never contain customer details
    expect(logs.join("\n")).not.toMatch(/Secret Name|706-555-0199/);

    const r = await retryPendingNotifications({ store, mailer, to: deps.notifyTo, log });
    expect(r).toEqual({ checked: 1, sent: 1 });
    expect(lead.notification_status).toBe("sent");
  });

  it("retries within a single attempt run before succeeding", async () => {
    await handleLeadPost(post(validBody()), deps);
    mailer.failTimes = 1;
    expect(await notifyOwner(store.rows[0]!, { store, mailer, to: deps.notifyTo, backoffMs: 1, log: silentLog })).toBe(true);
    expect(store.rows[0]!.notification_attempts).toBe(2);
  });

  it("notification text says it is a request, not a booking", async () => {
    await handleLeadPost(post(validBody({ preferredDate: "2027-04-01" })), deps);
    const mail = buildNotification(store.rows[0]!);
    expect(mail.text).toMatch(/not booked/);
    expect(mail.text).toMatch(/no appointment or price has been confirmed/);
  });
});
