import { json, limitPublic, paging } from "@/lib/api";
import { searchEpisodes } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const url = new URL(req.url);
  const u = url.searchParams;
  const { page, pageSize } = paging(url);
  const res = await searchEpisodes({
    q: u.get("q") || undefined,
    program: u.get("program") || undefined,
    category: u.get("category") || undefined,
    language: u.get("language") || undefined,
    presenter: u.get("presenter") || undefined,
    page,
    pageSize,
  });
  return json(
    { ...res, items: res.items.map(({ transcript: _t, audio_key, ...e }) => ({ ...e, audio_url: audio_key ? `/media/${audio_key}` : null })) },
    { cache: "public, max-age=60" },
  );
}
