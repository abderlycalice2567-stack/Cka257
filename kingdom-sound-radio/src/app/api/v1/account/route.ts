import { sql } from "@/lib/db";
import { apiError, json, sameOrigin } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { accountSettingsSchema } from "@/lib/validation";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return apiError(401, "unauthenticated", "Sign in required");
  return json({ id: u.id, email: u.email, displayName: u.displayName, locale: u.locale, emailVerified: u.emailVerified, roles: u.roles });
}

export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "forbidden", "Cross-origin request refused");
  const u = await getCurrentUser();
  if (!u) return apiError(401, "unauthenticated", "Sign in required");
  const body = accountSettingsSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return apiError(422, "invalid", "Invalid account payload");
  await sql`UPDATE users SET display_name = ${body.data.display_name}, locale = ${body.data.locale}, updated_at = now() WHERE id = ${u.id}`;
  return json({ ok: true });
}
