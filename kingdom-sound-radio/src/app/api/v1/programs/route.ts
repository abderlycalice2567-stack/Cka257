import { json, limitPublic } from "@/lib/api";
import { listPrograms } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const u = new URL(req.url).searchParams;
  const items = await listPrograms({ category: u.get("category") || undefined, language: u.get("language") || undefined, featured: u.get("featured") === "true" });
  return json({ items: items.map(({ cover_key, ...p }) => ({ ...p, cover_url: cover_key ? `/media/${cover_key}` : null })) }, { cache: "public, max-age=60" });
}
