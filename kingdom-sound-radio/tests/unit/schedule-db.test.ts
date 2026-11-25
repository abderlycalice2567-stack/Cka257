import { afterAll, describe, expect, it } from "vitest";
import postgres from "postgres";

// Integration test against TEST_DATABASE_URL (a separate, migrated database).
const url = process.env.TEST_DATABASE_URL || "postgres://ksr:ksr_dev_only@localhost:5432/ksr_test";
const sql = postgres(url, { onnotice: () => {} });
afterAll(() => sql.end());

describe("schedule_slots() — station time → UTC", () => {
  it("converts New York local times to UTC across the March DST change", async () => {
    // Sundays 08:00 local around 2026-03-08 (DST starts that day in the US).
    const rows = await sql<{ starts_at: Date }[]>`
      SELECT starts_at FROM schedule_slots(ARRAY[0]::smallint[], '08:00', 60, 'America/New_York', '2026-03-01', 14)`;
    expect(rows.map((r) => r.starts_at.toISOString())).toEqual(["2026-03-01T13:00:00.000Z", "2026-03-08T12:00:00.000Z"]);
  });

  it("handles November fall-back", async () => {
    const rows = await sql<{ starts_at: Date }[]>`
      SELECT starts_at FROM schedule_slots(ARRAY[0]::smallint[], '18:00', 60, 'America/New_York', '2026-10-25', 14)`;
    expect(rows.map((r) => r.starts_at.toISOString())).toEqual(["2026-10-25T22:00:00.000Z", "2026-11-01T23:00:00.000Z"]);
  });

  it("respects weekdays, durations and validity windows", async () => {
    const rows = await sql<{ starts_at: Date; ends_at: Date }[]>`
      SELECT * FROM schedule_slots(ARRAY[1,3,5]::smallint[], '21:30', 120, 'America/New_York', '2026-06-01', 7, '2026-06-02', '2026-06-05')`;
    // Mon 1st excluded by valid_from; Wed 3rd + Fri 5th remain.
    expect(rows).toHaveLength(2);
    expect(rows[0]!.starts_at.toISOString()).toBe("2026-06-04T01:30:00.000Z");
    expect(+rows[0]!.ends_at - +rows[0]!.starts_at).toBe(120 * 60000);
  });

  it("supports overnight programs that cross midnight", async () => {
    const rows = await sql<{ starts_at: Date; ends_at: Date }[]>`
      SELECT * FROM schedule_slots(ARRAY[6]::smallint[], '23:00', 180, 'America/New_York', '2026-07-04', 1)`;
    expect(rows[0]!.ends_at.toISOString()).toBe("2026-07-05T06:00:00.000Z");
  });
});

describe("database guarantees", () => {
  it("refuses to publish an episode without a rights review", async () => {
    await expect(sql.begin(async (tx) => {
      const [p] = await tx<{ id: string }[]>`INSERT INTO programs (slug, title) VALUES ('t-rights', '{"en":"T"}') RETURNING id`;
      await tx`INSERT INTO episodes (program_id, slug, title, status, published_at) VALUES (${p!.id}, 'e', 'E', 'published', now())`;
    })).rejects.toThrow(/published_requires_rights/);
  });

  it("refuses to approve a testimony without publication consent", async () => {
    await expect(sql`INSERT INTO testimonies (name, body, consent_publish, status) VALUES ('A', 'B', false, 'approved')`).rejects.toThrow(/approval_requires_consent/);
  });

  it("only accepts HTTPS stream URLs", async () => {
    await expect(sql.begin(async (tx) => {
      const [s] = await tx<{ id: string }[]>`INSERT INTO stations (slug, name) VALUES ('t-station', 'T') RETURNING id`;
      await tx`INSERT INTO stream_endpoints (station_id, label, url, bitrate_kbps) VALUES (${s!.id}, 'x', 'http://insecure', 128)`;
    })).rejects.toThrow(/stream_endpoints_url_check/);
  });

  it("records each Stripe object at most once (idempotent webhooks)", async () => {
    await sql.begin(async (tx) => {
      await tx`INSERT INTO donations (amount_cents, currency, status, provider, provider_ref) VALUES (100, 'usd', 'pending', 'stripe', 'cs_test_1')`;
      await tx`INSERT INTO donations (amount_cents, currency, status, provider, provider_ref) VALUES (100, 'usd', 'succeeded', 'stripe', 'cs_test_1')
               ON CONFLICT (provider_ref) DO UPDATE SET status = EXCLUDED.status`;
      const rows = await tx`SELECT status FROM donations WHERE provider_ref = 'cs_test_1'`;
      expect(rows).toHaveLength(1);
      expect(rows[0]!.status).toBe("succeeded");
      throw new Error("rollback");
    }).catch((e) => {
      if (e.message !== "rollback") throw e;
    });
  });
});
