import { apiError, json, limitPublic } from "@/lib/api";
import { episodeChapters, getEpisodeById } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return apiError(404, "not_found", "Episode not found");
  const e = await getEpisodeById(id);
  if (!e) return apiError(404, "not_found", "Episode not found");
  const { audio_key, ...rest } = e;
  return json({ episode: { ...rest, audio_url: audio_key ? `/media/${audio_key}` : null }, chapters: await episodeChapters(id) }, { cache: "public, max-age=60" });
}
