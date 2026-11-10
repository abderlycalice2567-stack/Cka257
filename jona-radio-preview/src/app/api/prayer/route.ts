import { NextResponse } from "next/server";
import { prayerSchema } from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/rate-limit";

/**
 * DEMO prayer-request endpoint. Validates input, then DISCARDS it.
 * Synthetic data only — nothing is stored or delivered to anyone (per spec:
 * "submissions must use synthetic data only and must not be delivered").
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "prayer"), 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de demandes. Merci de réessayer dans un instant." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const parsed = prayerSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (fieldErrors.company) return NextResponse.json({ ok: true, demo: true });
    return NextResponse.json({ ok: false, fieldErrors }, { status: 422 });
  }

  // Intentionally NO storage, NO logging of the intention text.
  return NextResponse.json({
    ok: true,
    demo: true,
    message:
      "Intention reçue (démonstration). Rien n’a été enregistré ni partagé. En production, un flux respectueux de la vie privée serait mis en place, avec consentement explicite et accès restreint.",
  });
}
