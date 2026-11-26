import { describe, expect, it } from "vitest";
import { sanitizeText, validateLead } from "@/lib/leads/schema";
import { valid } from "../support/fixtures";


describe("validateLead", () => {
  it("accepts a valid request and normalises optional fields", () => {
    const r = validateLead(valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.email).toBeNull();
    expect(r.data.vehicleYear).toBe(2015);
    expect(r.data.preferredDate).toBeNull();
    expect(r.data.marketingConsent).toBe(false);
  });

  it("accepts email-only contact and only the required fields", () => {
    const r = validateLead({ name: "Al B", email: "A@Example.com", service: "not-sure", description: "Strange noise when braking", consent: true, idempotencyKey: valid.idempotencyKey });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.email).toBe("a@example.com");
  });

  it("requires phone or email", () => {
    const r = validateLead({ ...valid, phone: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.phone).toMatch(/phone number or an email/);
      expect(r.errors.email).toBeDefined();
    }
  });

  it("requires name, service, description and consent", () => {
    const r = validateLead({ ...valid, name: " ", service: "", description: "short", consent: undefined });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["consent", "description", "name", "service"]);
  });

  it("rejects unknown services, bad phones, bad emails and bad years", () => {
    for (const patch of [{ service: "free-oil" }, { phone: "call me" }, { phone: "12345" }, { email: "nope@" }, { vehicleYear: "15" }, { vehicleYear: "1850" }]) {
      expect(validateLead({ ...valid, ...patch }).ok, JSON.stringify(patch)).toBe(false);
    }
  });

  it("rejects past, far-future and malformed preferred dates; accepts a near date", () => {
    const soon = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    expect(validateLead({ ...valid, preferredDate: soon }).ok).toBe(true);
    for (const preferredDate of ["2001-01-01", "2999-01-01", "2026-02-31", "tomorrow"]) {
      expect(validateLead({ ...valid, preferredDate }).ok, preferredDate).toBe(false);
    }
  });

  it("enforces length limits", () => {
    expect(validateLead({ ...valid, name: "x".repeat(101) }).ok).toBe(false);
    expect(validateLead({ ...valid, description: "x".repeat(2001) }).ok).toBe(false);
  });

  it("rejects a filled honeypot and a missing/invalid idempotency key", () => {
    expect(validateLead({ ...valid, website: "http://spam.example" }).ok).toBe(false);
    expect(validateLead({ ...valid, idempotencyKey: "abc" }).ok).toBe(false);
  });

  it("sanitises control characters and collapses whitespace", () => {
    expect(sanitizeText("  a\u0000b\t\tc‮  ")).toBe("a b c");
    expect(sanitizeText("line1\r\n\n\n\nline2", true)).toBe("line1\n\nline2");
    const r = validateLead({ ...valid, name: "Test\u0007   Person\n" });
    expect(r.ok && r.data.name).toBe("Test Person");
  });
});
