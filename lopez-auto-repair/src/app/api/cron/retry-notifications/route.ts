import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getEmailConfig, getLeadBackend } from "@/lib/leads/env";
import { logEvent } from "@/lib/leads/log";
import { NotifyError, notifyOwner } from "@/lib/leads/notify";
import { listPendingNotifications, markNotification, StorageError } from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Re-sends owner notifications for stored leads whose notification is still
 * pending. Scheduled by vercel.json; protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const backend = getLeadBackend();
  if (!backend) return NextResponse.json({ demo: true, retried: 0 });

  let sent = 0;
  let failed = 0;
  try {
    const pending = await listPendingNotifications(backend);
    const email = getEmailConfig();
    for (const item of pending) {
      try {
        await notifyOwner(email, item.leads, 1);
        await markNotification(backend, item.lead_id, { sent: true });
        sent += 1;
      } catch (err) {
        failed += 1;
        const code = err instanceof NotifyError || err instanceof StorageError ? err.code : "unknown";
        logEvent("error", "lead.notification_retry_failed", { code, attempts: item.attempts + 1 });
        if (err instanceof NotifyError) {
          await markNotification(backend, item.lead_id, { sent: false, errorCode: code, attempts: item.attempts + 1 }).catch(() => undefined);
        }
      }
    }
  } catch (err) {
    logEvent("error", "lead.notification_retry_unavailable", { code: err instanceof StorageError ? err.code : "unknown" });
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
  logEvent("info", "lead.notification_retry_done", { sent, failed });
  return NextResponse.json({ sent, failed });
}
