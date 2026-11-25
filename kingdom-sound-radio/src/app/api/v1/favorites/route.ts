import { z } from "zod";
import { sql } from "@/lib/db";
import { apiError, json, sameOrigin } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return apiError(401, "unauthenticated", "Sign in required");
  const items = await sql`SELECT f.episode_id, e.title, p.slug AS program_slug, e.slug, f.created_at
                            FROM favorites f JOIN episodes e ON e.id = f.episode_id JOIN programs p ON p.id = e.program_id
                           WHERE f.user_id = ${u.id} ORDER BY f.created_at DESC`;
  return json({ items });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "forbidden", "Cross-origin request refused");
  const u = await getCurrentUser();
  if (!u) return apiError(401, "unauthenticated", "Sign in required");
  const body = z.object({ episodeId: z.uuid() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return apiError(422, "invalid", "episodeId required");
  const rows = await sql`INSERT INTO favorites (user_id, episode_id)
                         SELECT ${u.id}, id FROM episodes WHERE id = ${body.data.episodeId} AND status = 'published'
                         ON CONFLICT DO NOTHING RETURNING episode_id`;
  return json({ ok: true, created: rows.length > 0 }, { status: rows.length ? 201 : 200 });
}
