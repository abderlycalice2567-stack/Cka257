import { json, limitPublic } from "@/lib/api";
import { visiblePlatforms } from "@/modules/content";

export const dynamic = "force-dynamic";

/** Only integrations that staff enabled and verified are listed. */
export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  return json({ items: await visiblePlatforms() }, { cache: "public, max-age=300" });
}
