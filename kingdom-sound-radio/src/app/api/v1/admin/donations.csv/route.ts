import { sql } from "@/lib/db";
import { apiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getCurrentUser, isAdminSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

const csv = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formula injection and quote every field.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  const u = await getCurrentUser();
  if (!isAdminSession(u) || !hasPermission(u!.permissions, "finance.view")) return apiError(403, "forbidden", "Not permitted");
  const rows = await sql<{ created_at: Date; amount_cents: number; currency: string; recurring: boolean; status: string; email: string | null; provider_ref: string; campaign: string | null }[]>`
    SELECT d.created_at, d.amount_cents::int, d.currency, d.recurring, d.status, d.email, d.provider_ref, c.slug AS campaign
      FROM donations d LEFT JOIN fundraising_campaigns c ON c.id = d.campaign_id ORDER BY d.created_at DESC`;
  await audit(u!.id, "finance.export", "donations", null, { rows: rows.length });
  const lines = [["date", "amount", "currency", "recurring", "status", "email", "provider_ref", "campaign"].map(csv).join(",")];
  for (const r of rows) lines.push([r.created_at.toISOString(), (r.amount_cents / 100).toFixed(2), r.currency, r.recurring, r.status, r.email, r.provider_ref, r.campaign].map(csv).join(","));
  return new Response(lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="donations-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store" },
  });
}
