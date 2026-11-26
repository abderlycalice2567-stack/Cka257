import { describe, expect, it } from "vitest";
import { SupabaseLeadStore } from "@/lib/leads/supabase-store";
import { toNewLead } from "@/lib/leads/service";
import { validateLead } from "@/lib/leads/schema";
import { validBody } from "./support";

function lead() {
  const r = validateLead(validBody());
  if (!r.ok) throw new Error("invalid");
  return toNewLead(r.data);
}

describe("SupabaseLeadStore", () => {
  it("inserts with the service key, ignoring duplicate idempotency keys", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify([{ id: "u1", receipt_code: "JRS-AAAA-BBBB" }]), { status: 201 });
    }) as unknown as typeof fetch;
    const store = new SupabaseLeadStore("https://proj.supabase.co/", "service-key", fake);
    const r = await store.insert(lead());
    expect(r.duplicate).toBe(false);
    expect(calls[0]!.url).toBe("https://proj.supabase.co/rest/v1/leads?on_conflict=idempotency_key");
    const h = calls[0]!.init.headers as Record<string, string>;
    expect(h.apikey).toBe("service-key");
    expect(h.Prefer).toContain("resolution=ignore-duplicates");
  });

  it("falls back to fetching the existing row on a duplicate", async () => {
    let n = 0;
    const fake = (async () => {
      n++;
      return n === 1 ? new Response("[]", { status: 201 }) : new Response(JSON.stringify([{ id: "u1", receipt_code: "JRS-AAAA-BBBB" }]), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await new SupabaseLeadStore("https://proj.supabase.co", "k", fake).insert(lead());
    expect(r).toMatchObject({ duplicate: true, lead: { receipt_code: "JRS-AAAA-BBBB" } });
  });

  it("throws a detail-free error on failure", async () => {
    const fake = (async () => new Response("boom", { status: 500 })) as unknown as typeof fetch;
    await expect(new SupabaseLeadStore("https://p.supabase.co", "k", fake).insert(lead())).rejects.toThrow("storage request failed (500)");
  });
});
