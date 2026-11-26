import "server-only";

/** Server-side configuration. Secrets are never exposed to the browser. */
export function serverEnv() {
  const e = process.env;
  const supabaseUrl = e.SUPABASE_URL?.trim() || "";
  const supabaseKey = e.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  const notifyTo = (e.LEAD_NOTIFY_TO || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    supabaseUrl,
    supabaseKey,
    resendKey: e.RESEND_API_KEY?.trim() || "",
    emailFrom: e.EMAIL_FROM?.trim() || "",
    notifyTo,
    cronSecret: e.CRON_SECRET?.trim() || "",
    /** Demo mode: no database configured → requests are validated but never stored or sent. */
    demoMode: !(supabaseUrl && supabaseKey),
    emailConfigured: Boolean(e.RESEND_API_KEY && e.EMAIL_FROM && notifyTo.length),
  };
}
