import { createHmac, timingSafeEqual } from "node:crypto";
import { sql } from "@/lib/db";
import { apiError, json } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Broadcasting-engine webhook (AzuraCast "Generic Web Hook"). Authenticated by
 * a shared secret in the `X-Webhook-Token` header. It records engine events
 * (stream online/offline, live DJ connect/disconnect) in the audit log so staff
 * can see interruptions; now-playing itself is read from the engine API.
 */
export async function POST(req: Request) {
  const secret = process.env.RADIO_WEBHOOK_SECRET;
  if (!secret) return apiError(503, "unconfigured", "Radio webhook is not configured");
  const token = req.headers.get("x-webhook-token") ?? "";
  const a = createHmac("sha256", "cmp").update(token).digest();
  const b = createHmac("sha256", "cmp").update(secret).digest();
  if (!timingSafeEqual(a, b)) return apiError(401, "unauthorized", "Invalid token");
  const body = (await req.json().catch(() => null)) as { is_online?: boolean; live?: { is_live?: boolean; streamer_name?: string } } | null;
  if (!body) return apiError(422, "invalid", "Invalid payload");
  await sql`INSERT INTO audit_logs (action, entity_type, metadata)
            VALUES ('radio.engine_event', 'station', ${sql.json({ online: body.is_online ?? null, live: body.live?.is_live ?? null, streamer: body.live?.streamer_name ?? null })})`;
  return json({ ok: true });
}
