import { apiError, json, limitPublic } from "@/lib/api";
import { getPresenter, programsForPresenter } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const p = await getPresenter((await ctx.params).slug);
  if (!p) return apiError(404, "not_found", "Presenter not found");
  return json({ presenter: p, programs: await programsForPresenter(p.id) }, { cache: "public, max-age=300" });
}
