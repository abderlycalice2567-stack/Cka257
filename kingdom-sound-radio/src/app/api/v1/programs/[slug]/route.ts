import { apiError, json, limitPublic } from "@/lib/api";
import { episodesForProgram, getProgram } from "@/modules/catalog";
import { nextAiring, programRules } from "@/modules/schedule";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const p = await getProgram((await ctx.params).slug);
  if (!p) return apiError(404, "not_found", "Program not found");
  const [episodes, next, schedule] = await Promise.all([episodesForProgram(p.id, 20), nextAiring(p.id), programRules(p.id)]);
  return json({ program: p, schedule, nextAiring: next, episodes: episodes.map(({ transcript: _t, ...e }) => e) }, { cache: "public, max-age=60" });
}
