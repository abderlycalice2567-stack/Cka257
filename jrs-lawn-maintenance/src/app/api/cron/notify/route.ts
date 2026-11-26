import { timingSafeEqual } from "node:crypto";
import { leadInfrastructure } from "@/lib/leads/deps";
import { retryPendingNotifications } from "@/lib/leads/service";

export const dynamic = "force-dynamic";

function authorized(req: Request, secret: string) {
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Scheduled job (vercel.json) that retries owner notifications that haven't been delivered. */
export async function GET(req: Request) {
  const { env, store, mailer } = leadInfrastructure();
  if (!authorized(req, env.cronSecret)) return new Response("Unauthorized", { status: 401 });
  if (!store) return Response.json({ skipped: "demo mode" });
  try {
    const result = await retryPendingNotifications({ store, mailer, to: env.notifyTo });
    return Response.json(result);
  } catch (err) {
    console.error(`[leads] retry job failed: ${err instanceof Error ? err.message : "unknown"}`);
    return Response.json({ error: "retry job failed" }, { status: 503 });
  }
}
