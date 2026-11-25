import { json, limitPublic } from "@/lib/api";
import { isLocale } from "@/lib/i18n/config";
import { getStation, recentDevotionals } from "@/modules/content";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const l = new URL(req.url).searchParams.get("locale");
  const station = await getStation();
  return json({ items: await recentDevotionals(isLocale(l) ? l : "en", station.timezone, 30) }, { cache: "public, max-age=600" });
}
