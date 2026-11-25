import { apiError, json, limitPublic } from "@/lib/api";
import { ensureOccurrences, occurrencesBetween } from "@/modules/schedule";
import { getStation } from "@/modules/content";

export const dynamic = "force-dynamic";

/** GET /api/v1/schedule?from=ISO&to=ISO (max 14 days). Times are UTC; `timezone` is the station zone. */
export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  await ensureOccurrences();
  const u = new URL(req.url).searchParams;
  const from = u.get("from") ? new Date(u.get("from")!) : new Date(Date.now() - 3600000);
  const to = u.get("to") ? new Date(u.get("to")!) : new Date(from.getTime() + 7 * 86400000);
  if (isNaN(+from) || isNaN(+to) || to <= from) return apiError(422, "invalid", "Invalid from/to");
  if (to.getTime() - from.getTime() > 14 * 86400000) return apiError(422, "invalid", "Range may not exceed 14 days");
  const [station, items] = await Promise.all([getStation(), occurrencesBetween(from, to, { includeCancelled: true })]);
  return json({ timezone: station.timezone, from, to, items }, { cache: "public, max-age=60" });
}
