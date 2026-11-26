import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/leads/rate-limit";

describe("rateLimit", () => {
  beforeEach(resetRateLimits);

  it("allows up to the limit, then blocks until the window resets", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("ip", 3, 1000, 0).allowed).toBe(true);
    const blocked = rateLimit("ip", 3, 1000, 500);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
    expect(rateLimit("ip", 3, 1000, 1001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    expect(rateLimit("a", 1, 1000, 0).allowed).toBe(true);
    expect(rateLimit("a", 1, 1000, 1).allowed).toBe(false);
    expect(rateLimit("b", 1, 1000, 1).allowed).toBe(true);
  });
});
