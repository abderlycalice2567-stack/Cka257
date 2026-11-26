import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { backendStatus } from "@/config/site";
import { notifyOwner, persistLead, StorageError } from "@/lib/leads";
import { findDuplicate, rateLimit, rememberSubmission } from "@/lib/rate-limit";
import { validateLead } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const noStore = { "Cache-Control": "no-store" };

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400, headers: noStore });
  }

  const limit = rateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) throw new Error("too large");
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400, headers: noStore });
  }

  const result = validateLead(payload);
  if (!result.ok) {
    return NextResponse.json({ error: "invalid_input", fields: result.errors }, { status: 400, headers: noStore });
  }
  const lead = result.data;
  const { demo } = backendStatus();

  // Spam signals: filled honeypot or an implausibly fast submit. Rejected outright —
  // we never tell anyone a request was received when it was not stored.
  if (lead.leaveBlank || (lead.elapsedMs !== undefined && lead.elapsedMs < 1500)) {
    console.warn("[leads] submission rejected by spam filter");
    return NextResponse.json({ error: "rejected" }, { status: 400, headers: noStore });
  }

  // Demo mode: validation only. Nothing is stored or sent, and the response says so.
  if (demo) {
    return NextResponse.json({ receipt: null, mode: "demo" }, { status: 200, headers: noStore });
  }

  const fingerprint = createHash("sha256")
    .update(JSON.stringify([lead.name, lead.phone, lead.email, lead.service, lead.description, lead.preferredDate]))
    .digest("hex");
  const duplicate = findDuplicate(fingerprint);
  if (duplicate) {
    return NextResponse.json({ receipt: duplicate, mode: "live" }, { status: 201, headers: noStore });
  }

  let id: string;
  try {
    ({ id } = await persistLead(lead));
  } catch (err) {
    if (!(err instanceof StorageError)) console.error("[leads] unexpected storage error");
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503, headers: { ...noStore, "Retry-After": "30" } });
  }

  // Opaque receipt: derived from the lead id, but not the id itself.
  const receipt = createHash("sha256").update(id).digest("hex").slice(0, 10).toUpperCase();
  rememberSubmission(fingerprint, receipt);

  // The lead is safely stored; a notification failure is logged and retried, never surfaced as a lost request.
  await notifyOwner(lead, id);

  return NextResponse.json({ receipt, mode: "live" }, { status: 201, headers: noStore });
}
