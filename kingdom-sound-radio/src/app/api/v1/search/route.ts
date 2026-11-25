import { apiError, json, limitPublic } from "@/lib/api";
import { searchEpisodes } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req, "search", 60);
  if (limited) return limited;
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return apiError(422, "invalid", "q is required");
  const res = await searchEpisodes({ q, pageSize: 20 });
  return json({ query: q, total: res.total, items: res.items.map(({ transcript: _t, ...e }) => e) });
}
