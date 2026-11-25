import "server-only";
import { sql } from "@/lib/db";
import { clientIp } from "@/lib/auth/session";

/** Records a sensitive action. Never include secrets or submission bodies in metadata. */
export async function audit(
  actorId: string | null,
  action: string,
  entityType?: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  await sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, ip)
            VALUES (${actorId}, ${action}, ${entityType ?? null}, ${entityId ?? null}, ${sql.json(metadata as never)}, ${await clientIp()})`;
}
