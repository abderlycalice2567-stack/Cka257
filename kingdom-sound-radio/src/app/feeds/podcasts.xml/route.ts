import { networkFeed } from "@/modules/feeds";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(await networkFeed(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
