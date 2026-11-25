import { programFeed } from "@/modules/feeds";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const m = /^([a-z0-9-]{1,80})\.xml$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  const xml = await programFeed(m[1]!);
  if (!xml) return new Response("Not found", { status: 404 });
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
