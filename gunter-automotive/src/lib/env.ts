import "server-only";

/** Server-only configuration. Never import this from a client component. */
export function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

export function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_NOTIFY_FROM;
  const to = process.env.LEAD_NOTIFY_TO?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return apiKey && from && to.length ? { apiKey, from, to } : null;
}

/** Demo mode = no database configured. Nothing is stored or sent. */
export const isDemoMode = () => storageConfig() === null;
