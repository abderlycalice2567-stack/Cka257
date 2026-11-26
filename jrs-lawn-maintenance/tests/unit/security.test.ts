import { describe, expect, it } from "vitest";
import { buildCsp, checkBasicAuth } from "@/lib/csp";

describe("preview gate", () => {
  const hdr = (u: string, p: string) => `Basic ${btoa(`${u}:${p}`)}`;
  it("accepts only the configured credentials", () => {
    expect(checkBasicAuth(hdr("preview", "s3cret"), "preview", "s3cret")).toBe(true);
    expect(checkBasicAuth(hdr("preview", "wrong"), "preview", "s3cret")).toBe(false);
    expect(checkBasicAuth(hdr("other", "s3cret"), "preview", "s3cret")).toBe(false);
    expect(checkBasicAuth(null, "preview", "s3cret")).toBe(false);
    expect(checkBasicAuth("Basic !!!", "preview", "s3cret")).toBe(false);
    expect(checkBasicAuth(hdr("preview", "pa:ss"), "preview", "pa:ss")).toBe(true);
  });
});

describe("CSP", () => {
  it("uses a nonce and disallows framing and plugins", () => {
    const csp = buildCsp("abc");
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });
});
