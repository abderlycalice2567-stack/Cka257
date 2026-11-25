import { json, limitPublic } from "@/lib/api";
import { listCategories } from "@/modules/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  return json({ items: await listCategories() }, { cache: "public, max-age=3600" });
}
