import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { base32Decode, base32Encode, decryptSecret, encryptSecret, hotp, verifyTotp } from "@/lib/auth/totp";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { hasPermission } from "@/lib/auth/permissions";
import { verifyStripeSignature } from "@/lib/stripe";
import { buildCsp } from "@/lib/csp";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("TOTP (RFC 6238 / RFC 4226)", () => {
  // RFC 6238 appendix B, SHA-1 secret "12345678901234567890", 8 digits.
  const secret = Buffer.from("12345678901234567890");
  it.each([
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
  ])("matches RFC vector at T=%i", (t, code) => {
    expect(hotp(secret, Math.floor(t / 30), 8)).toBe(code);
  });

  it("round-trips base32", () => {
    expect(base32Decode(base32Encode(secret)).equals(secret)).toBe(true);
  });

  it("accepts the current code, rejects reuse and garbage", () => {
    const b32 = base32Encode(secret);
    const now = 1_700_000_000_000;
    const code = hotp(secret, Math.floor(now / 30000));
    const step = verifyTotp(b32, code, now);
    expect(step).toBe(Math.floor(now / 30000));
    expect(verifyTotp(b32, code, now, step)).toBeNull(); // replay
    expect(verifyTotp(b32, "000000", now)).toBeNull();
    expect(verifyTotp(b32, "12345", now)).toBeNull();
  });

  it("allows one step of clock drift but not two", () => {
    const b32 = base32Encode(secret);
    const now = 1_700_000_000_000;
    const step = Math.floor(now / 30000);
    expect(verifyTotp(b32, hotp(secret, step - 1), now)).toBe(step - 1);
    expect(verifyTotp(b32, hotp(secret, step + 2), now)).toBeNull();
  });

  it("encrypts secrets at rest and detects tampering", () => {
    process.env.APP_SECRET = "x".repeat(40);
    const blob = encryptSecret("JBSWY3DPEHPK3PXP");
    expect(blob).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptSecret(blob)).toBe("JBSWY3DPEHPK3PXP");
    const parts = blob.split(".");
    parts[3] = Buffer.from("tampered!").toString("base64");
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
});

describe("passwords and tokens", () => {
  it("hashes with scrypt and verifies", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(h.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(await verifyPassword("correct horse battery staple", h)).toBe(true);
    expect(await verifyPassword("wrong password", h)).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });

  it("produces unique high-entropy tokens and stores only hashes", () => {
    const a = newToken();
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(newToken()).not.toBe(a);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("checks permissions exactly", () => {
    expect(hasPermission(["admin.access"], "admin.access")).toBe(true);
    expect(hasPermission(new Set(["admin.access"]), "users.manage")).toBe(false);
  });
});

describe("Stripe webhook signatures", () => {
  const secret = "whsec_test";
  const payload = '{"id":"evt_1"}';
  const sign = (t: number, body = payload) => createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  it("accepts a valid recent signature", () => {
    const t = 1_700_000_000;
    expect(verifyStripeSignature(payload, `t=${t},v1=${sign(t)}`, secret, t + 10)).toBe(true);
  });
  it("rejects stale, altered or missing signatures", () => {
    const t = 1_700_000_000;
    expect(verifyStripeSignature(payload, `t=${t},v1=${sign(t)}`, secret, t + 301)).toBe(false);
    expect(verifyStripeSignature('{"id":"evt_2"}', `t=${t},v1=${sign(t)}`, secret, t)).toBe(false);
    expect(verifyStripeSignature(payload, null, secret, t)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${t},v1=deadbeef`, secret, t)).toBe(false);
  });
});

describe("CSP and rate limiting", () => {
  it("uses nonce + strict-dynamic and forbids framing and plugins", () => {
    const csp = buildCsp("abc");
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self'");
  });
  it("only allows eval in development", () => {
    expect(buildCsp("abc", { dev: true })).toContain("'unsafe-eval'");
  });
  it("limits per key and window", () => {
    resetRateLimits();
    const now = 1000;
    const results = Array.from({ length: 6 }, () => rateLimit("k", 5, 60000, now).ok);
    expect(results).toEqual([true, true, true, true, true, false]);
    expect(rateLimit("k", 5, 60000, now + 60001).ok).toBe(true);
    expect(rateLimit("other", 5, 60000, now).ok).toBe(true);
  });
});
