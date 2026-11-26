import { describe, expect, it } from "vitest";
import { sanitize, validateLead } from "@/lib/validation";

const base = {
  name: "Test Driver",
  email: "driver@example.com",
  service: "diagnostics",
  description: "Check engine light came on yesterday.",
  consent: true,
};

describe("validateLead", () => {
  it("accepts the minimum required fields", () => {
    const r = validateLead(base);
    expect(r.ok).toBe(true);
  });

  it("requires phone or email", () => {
    const r = validateLead({ ...base, email: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveProperty("phone");
  });

  it("accepts phone only", () => {
    expect(validateLead({ ...base, email: "", phone: "(404) 555-0100" }).ok).toBe(true);
  });

  it("requires name, service, description and consent", () => {
    const r = validateLead({ email: "a@example.com", name: "", service: "", description: "", consent: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["consent", "description", "name", "service"]);
    const none = validateLead({ name: "", service: "", description: "", consent: false });
    if (!none.ok) expect(none.errors).toHaveProperty("phone");
  });

  it("rejects unknown services, bad emails and out-of-range years", () => {
    expect(validateLead({ ...base, service: "rocket-repair" }).ok).toBe(false);
    expect(validateLead({ ...base, email: "nope" }).ok).toBe(false);
    expect(validateLead({ ...base, vehicleYear: "1800" }).ok).toBe(false);
    expect(validateLead({ ...base, vehicleYear: "2016" }).ok).toBe(true);
  });

  it("rejects past and malformed preferred dates", () => {
    expect(validateLead({ ...base, preferredDate: "2001-01-01" }).ok).toBe(false);
    expect(validateLead({ ...base, preferredDate: "tomorrow" }).ok).toBe(false);
    const soon = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    expect(validateLead({ ...base, preferredDate: soon }).ok).toBe(true);
  });

  it("enforces length limits", () => {
    expect(validateLead({ ...base, description: "x".repeat(2001) }).ok).toBe(false);
    expect(validateLead({ ...base, name: "x".repeat(101) }).ok).toBe(false);
  });

  it("sanitizes control characters and whitespace", () => {
    expect(sanitize("  a\u0000b \t c  ")).toBe("a b c");
    expect(sanitize("line1\n\n\n\nline2", { multiline: true })).toBe("line1\n\nline2");
    const r = validateLead({ ...base, name: "  Test\u0007   Driver " });
    expect(r.ok && r.data.name).toBe("Test Driver");
  });
});
