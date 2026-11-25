import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { buildIcs } from "@/lib/xml";
import { limitPublic } from "@/lib/api";
import { pick } from "@/lib/i18n/config";
import type { Tr } from "@/modules/catalog";
import { ensureOccurrences } from "@/modules/schedule";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req, "ics", 30);
  if (limited) return limited;
  await ensureOccurrences();
  const url = new URL(req.url);
  const program = url.searchParams.get("program");
  const category = url.searchParams.get("category");
  const rows = await sql<{ id: string; starts_at: Date; ends_at: Date; status: string; slug: string; title: Tr; summary: Tr }[]>`
    SELECT o.id, o.starts_at, o.ends_at, o.status, p.slug, p.title, p.summary
      FROM broadcast_occurrences o JOIN programs p ON p.id = o.program_id AND p.status = 'published'
      LEFT JOIN categories c ON c.id = p.category_id
     WHERE o.starts_at > now() - interval '1 day' AND o.starts_at < now() + interval '21 days'
       ${program ? sql`AND p.slug = ${program}` : sql``}
       ${category ? sql`AND c.slug = ${category}` : sql``}
     ORDER BY o.starts_at LIMIT 500`;
  const ics = buildIcs(
    program && rows[0] ? `${pick(rows[0].title, "en")} — The Kingdom Sound Radio` : "The Kingdom Sound Radio",
    rows.map((r) => ({
      uid: `${r.id}@kingdom-sound-radio`,
      start: r.starts_at,
      end: r.ends_at,
      summary: pick(r.title, "en"),
      description: pick(r.summary, "en"),
      url: `${env.appUrl}/en/programs/${r.slug}`,
      cancelled: r.status === "cancelled",
    })),
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${program ?? "schedule"}.ics"`,
      "Cache-Control": "public, max-age=600",
    },
  });
}
