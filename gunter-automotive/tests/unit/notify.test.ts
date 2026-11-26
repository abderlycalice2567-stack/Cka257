import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildEmail, notifyOwner } from "@/lib/notify";
import { leadSchema } from "@/lib/validation";

const lead = leadSchema.parse({
  name: "Jamie <script>",
  email: "jamie@example.com",
  service: "maintenance",
  description: "Oil change due & tyre check",
  consent: true,
});

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("LEAD_NOTIFY_FROM", "Leads <leads@example.com>");
  vi.stubEnv("LEAD_NOTIFY_TO", "owner@example.com, backup@example.com");
});
afterEach(() => vi.unstubAllEnvs());

describe("notifyOwner", () => {
  it("escapes HTML and states that nothing is confirmed", () => {
    const { html, text } = buildEmail(lead, "abc12345-0000");
    expect(html).toContain("Jamie &lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(text).toMatch(/No appointment or quote has been confirmed/);
  });

  it("retries 5xx then succeeds", async () => {
    const f = vi.fn().mockResolvedValueOnce(new Response("", { status: 502 })).mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const r = await notifyOwner(lead, "id-1", { fetchImpl: f, backoffMs: 1 });
    expect(r).toEqual({ ok: true, attempts: 2 });
    const sent = JSON.parse(f.mock.calls[0]![1].body);
    expect(sent.to).toEqual(["owner@example.com", "backup@example.com"]);
    expect(sent.reply_to).toBe("jamie@example.com");
  });

  it("gives up after max attempts and reports the error code", async () => {
    const f = vi.fn().mockRejectedValue(new Error("boom"));
    const r = await notifyOwner(lead, "id-1", { fetchImpl: f, backoffMs: 1, maxAttempts: 3 });
    expect(r).toEqual({ ok: false, attempts: 3, code: "network" });
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-retryable 4xx", async () => {
    const f = vi.fn().mockResolvedValue(new Response("", { status: 422 }));
    const r = await notifyOwner(lead, "id-1", { fetchImpl: f, backoffMs: 1 });
    expect(r.ok).toBe(false);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("reports not_configured without email settings", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await notifyOwner(lead, "id-1")).toEqual({ ok: false, attempts: 0, code: "not_configured" });
  });
});
