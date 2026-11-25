import { z } from "zod";
import { sql } from "@/lib/db";
import { apiError, json, sameOrigin } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";

const schema = z.object({ kind: z.enum(["live", "episode"]), episodeId: z.uuid().optional() });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "forbidden", "Cross-origin request refused");
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthenticated", "Sign in required");
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success || (body.data.kind === "episode" && !body.data.episodeId)) return apiError(422, "invalid", "Invalid payload");
  await sql`INSERT INTO listening_history (user_id, kind, episode_id) VALUES (${user.id}, ${body.data.kind}, ${body.data.episodeId ?? null})`;
  return json({ ok: true });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthenticated", "Sign in required");
  const rows = await sql`SELECT h.kind, h.episode_id, e.title, h.started_at FROM listening_history h
                         LEFT JOIN episodes e ON e.id = h.episode_id WHERE h.user_id = ${user.id}
                         ORDER BY h.started_at DESC LIMIT 50`;
  return json({ items: rows });
}
