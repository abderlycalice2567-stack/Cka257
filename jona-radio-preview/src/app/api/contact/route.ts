import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/rate-limit";

/**
 * DEMO contact endpoint. Validates input server-side and returns a result.
 * It DOES NOT store, email, or forward any data to Jona Radio or any third
 * party (section: Demo forms must not collect/retain real information).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(clientKey(req, "contact"), 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives. Merci de réessayer dans un instant." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    // Honeypot filled → pretend success, drop silently (anti-spam).
    if (fieldErrors.company) {
      return NextResponse.json({ ok: true, demo: true });
    }
    return NextResponse.json({ ok: false, fieldErrors }, { status: 422 });
  }

  // NO persistence. We deliberately do not log message contents (F-07 / privacy).
  return NextResponse.json({
    ok: true,
    demo: true,
    message:
      "Message validé (démonstration). Aucune donnée n’a été enregistrée ni transmise. En production, il serait envoyé par e-mail authentifié à la station.",
  });
}
