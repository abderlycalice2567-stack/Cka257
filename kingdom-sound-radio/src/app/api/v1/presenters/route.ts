import { json, limitPublic } from "@/lib/api";
import { listPresenters } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  return json({ items: await listPresenters() }, { cache: "public, max-age=300" });
}
