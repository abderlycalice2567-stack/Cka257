import { describe, expect, it } from "vitest";
import { fieldErrors, leadSchema, looksLikeBot } from "@/lib/validation";

const valid = {
  name: "Jamie Doe",
  phone: "(404) 555-0100",
  email: "",
  service: "diagnostics",
  description: "Check engine light came on yesterday.",
  consent: true,
};

describe("leadSchema", () => {
  it("accepts a minimal valid request and normalises empty optionals to null", () => {
    const r = leadSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBeNull();
      expect(r.data.vehicleYear).toBeNull();
      expect(r.data.marketingConsent).toBe(false);
    }
  });

  it("requires at least one contact method", () => {
    const r = leadSchema.safeParse({ ...valid, phone: "", email: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.phone).toMatch(/phone number or an email/);
      expect(e.email).toMatch(/phone number or an email/);
    }
  });

  it("reports the contact error together with other field errors", () => {
    const r = leadSchema.safeParse({ ...valid, phone: "", email: "", name: "", consent: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error))).toEqual(expect.arrayContaining(["name", "phone", "email", "consent"]));
  });

  it("accepts email-only contact", () => {
    expect(leadSchema.safeParse({ ...valid, phone: "", email: "jamie@example.com" }).success).toBe(true);
  });

  it.each([
    ["name", "J", "name"],
    ["email", "not-an-email", "email"],
    ["phone", "12345", "phone"],
    ["vehicleYear", "1800", "vehicleYear"],
    ["description", "short", "description"],
    ["service", "towing", "service"],
    ["preferredDate", "2001-01-01", "preferredDate"],
    ["preferredDate", "31/12/2030", "preferredDate"],
  ])("rejects invalid %s", (field, value, errKey) => {
    const r = leadSchema.safeParse({ ...valid, [field]: value });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)[errKey]).toBeTruthy();
  });

  it("requires contact consent", () => {
    const r = leadSchema.safeParse({ ...valid, consent: false });
    expect(r.success).toBe(false);
  });

  it("enforces length limits", () => {
    expect(leadSchema.safeParse({ ...valid, description: "x".repeat(2001) }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, name: "x".repeat(101) }).success).toBe(false);
  });

  it("strips control characters and trims", () => {
    const r = leadSchema.safeParse({ ...valid, name: "  Jamie\u0000 Doe\u0007 " });
    expect(r.success && r.data.name).toBe("Jamie Doe");
  });

  it("accepts a preferred date in the near future", () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    expect(leadSchema.safeParse({ ...valid, preferredDate: d.toISOString().slice(0, 10) }).success).toBe(true);
  });
});

describe("looksLikeBot", () => {
  it("flags filled honeypot", () => expect(looksLikeBot({ website: "http://spam" })).toBe(true));
  it("flags instant submissions", () => expect(looksLikeBot({ startedAt: 1000 }, 2000)).toBe(true));
  it("passes normal submissions", () => expect(looksLikeBot({ website: "", startedAt: 1000 }, 60_000)).toBe(false));
});
