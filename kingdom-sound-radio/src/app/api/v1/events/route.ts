import { json, limitPublic } from "@/lib/api";
import { upcomingEvents } from "@/modules/content";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  return json({ items: await upcomingEvents(50) }, { cache: "public, max-age=300" });
}
