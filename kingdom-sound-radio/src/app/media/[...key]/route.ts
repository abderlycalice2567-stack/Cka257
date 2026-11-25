import { Readable } from "node:stream";
import { sql } from "@/lib/db";
import { getCurrentUser, isAdminSession } from "@/lib/auth/session";
import { statKey, streamKey } from "@/lib/media/storage";

export const dynamic = "force-dynamic";

/**
 * Serves stored media. Unpublished assets (e.g. a recording awaiting rights
 * review) are only available to staff. Supports HTTP Range for seeking.
 */
export async function GET(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await ctx.params;
  const key = parts.join("/");
  const rows = await sql<{ mime_type: string; public: boolean }[]>`
    SELECT a.mime_type,
           (EXISTS (SELECT 1 FROM episodes e WHERE e.audio_asset_id = a.id AND e.status = 'published' AND e.published_at <= now())
            OR EXISTS (SELECT 1 FROM episodes e WHERE e.cover_asset_id = a.id AND e.status = 'published')
            OR EXISTS (SELECT 1 FROM programs p WHERE p.cover_asset_id = a.id AND p.status = 'published')
            OR EXISTS (SELECT 1 FROM presenters pr WHERE pr.photo_asset_id = a.id AND pr.published)) AS public
      FROM media_assets a WHERE a.storage_key = ${key}`;
  const asset = rows[0];
  if (!asset) return new Response("Not found", { status: 404 });
  if (!asset.public) {
    if (!isAdminSession(await getCurrentUser())) return new Response("Not found", { status: 404 });
  }

  let size: number;
  try {
    size = (await statKey(key)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": asset.mime_type,
    "Accept-Ranges": "bytes",
    "Cache-Control": asset.public ? "public, max-age=86400" : "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-site",
  });

  const range = req.headers.get("range");
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    start = Math.max(0, start);
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(Readable.toWeb(streamKey(key, { start, end })) as ReadableStream, { status: 206, headers });
  }
  headers.set("Content-Length", String(size));
  return new Response(Readable.toWeb(streamKey(key)) as ReadableStream, { status: 200, headers });
}
