import { describe, expect, it } from "vitest";
import { looksAutomated, sanitizeText, validateLead } from "@/lib/leads/schema";
import { validBody } from "./support";

describe("lead validation", () => {
  it("accepts a complete valid request", () => {
    const r = validateLead(validBody());
    expect(r.ok).toBe(true);
  });

  it("requires name, service, description and consent", () => {
    const r = validateLead(validBody({ name: "  ", service: "", description: "short", consent: false }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["consent", "description", "name", "service"]);
  });

  it("requires at least one contact method", () => {
    const r = validateLead(validBody({ phone: "", email: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.phone).toMatch(/phone number or an email/);
      expect(r.errors.email).toBeDefined();
    }
    expect(validateLead(validBody({ phone: "", email: "a@example.com" })).ok).toBe(true);
  });

  it("rejects malformed phone, email, ZIP and date", () => {
    const r = validateLead(validBody({ phone: "123", email: "nope", zip: "3060", preferredDate: "2026-02-30" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "phone", "preferredDate", "zip"]);
  });

  it("enforces length limits", () => {
    const r = validateLead(validBody({ description: "x".repeat(2001), accessNotes: "y".repeat(501) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["accessNotes", "description"]);
  });

  it("rejects unknown option values", () => {
    expect(validateLead(validBody({ service: "tree-removal" })).ok).toBe(false);
    expect(validateLead(validBody({ frequency: "daily" })).ok).toBe(false);
  });

  it("sanitizes control and bidi characters", () => {
    expect(sanitizeText("  Hi\u0000 there‮\r\nok  ")).toBe("Hi there\nok");
    const r = validateLead(validBody({ name: "\u0007Jane​" }));
    expect(r.ok && r.data.name).toBe("Jane");
  });

  it("flags honeypot and too-fast submissions as automated", () => {
    const fill = (o: Record<string, unknown>) => {
      const r = validateLead(validBody(o));
      if (!r.ok) throw new Error("invalid");
      return looksAutomated(r.data);
    };
    expect(fill({})).toBe(false);
    expect(fill({ website: "http://spam" })).toBe(true);
    expect(fill({ elapsedMs: 400 })).toBe(true);
  });
});
