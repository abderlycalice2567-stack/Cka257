import { sql } from "@/lib/db";
import { apiError, json, sameOrigin } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return apiError(403, "forbidden", "Cross-origin request refused");
  const u = await getCurrentUser();
  if (!u) return apiError(401, "unauthenticated", "Sign in required");
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return apiError(404, "not_found", "Not found");
  await sql`DELETE FROM favorites WHERE user_id = ${u.id} AND episode_id = ${id}`;
  return new Response(null, { status: 204 });
}

export async function GET() {
  return json({ error: { code: "method_not_allowed", message: "Use DELETE" } }, { status: 405 });
}
