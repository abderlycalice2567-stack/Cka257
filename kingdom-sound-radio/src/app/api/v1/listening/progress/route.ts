import { sql } from "@/lib/db";
import { apiError, json, sameOrigin } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { progressSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "forbidden", "Cross-origin request refused");
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthenticated", "Sign in required");
  const body = progressSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return apiError(422, "invalid", "Invalid progress payload");
  const { episodeId, position, completed } = body.data;
  await sql`INSERT INTO playback_progress (user_id, episode_id, position_seconds, completed, updated_at)
            SELECT ${user.id}, id, ${position}, ${completed}, now() FROM episodes WHERE id = ${episodeId} AND status = 'published'
            ON CONFLICT (user_id, episode_id) DO UPDATE
              SET position_seconds = EXCLUDED.position_seconds, completed = EXCLUDED.completed, updated_at = now()`;
  return json({ ok: true });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthenticated", "Sign in required");
  const id = new URL(req.url).searchParams.get("episodeId");
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return apiError(422, "invalid", "episodeId required");
  const rows = await sql<{ position_seconds: number; completed: boolean }[]>`
    SELECT position_seconds, completed FROM playback_progress WHERE user_id = ${user.id} AND episode_id = ${id}`;
  return json(rows[0] ?? { position_seconds: 0, completed: false });
}
