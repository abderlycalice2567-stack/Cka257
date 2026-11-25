import { apiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { exportUserData } from "@/modules/account";
import { audit } from "@/lib/audit";

/** Personal data export (download). */
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return apiError(401, "unauthenticated", "Sign in required");
  const data = await exportUserData(u.id);
  await audit(u.id, "account.data_export", "user", u.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kingdom-sound-account-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
