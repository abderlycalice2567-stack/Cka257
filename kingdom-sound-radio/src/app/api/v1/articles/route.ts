import { json, limitPublic } from "@/lib/api";
import { isLocale } from "@/lib/i18n/config";
import { listArticles } from "@/modules/content";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const l = new URL(req.url).searchParams.get("locale");
  return json({ items: await listArticles(isLocale(l) ? l : "en", 50) }, { cache: "public, max-age=120" });
}
