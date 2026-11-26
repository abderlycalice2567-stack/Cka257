import "server-only";

export type LeadBackend = { supabaseUrl: string; serviceRoleKey: string };
export type EmailConfig = { apiKey: string; from: string; to: string };

/** null → DEMO MODE: nothing is stored or sent, and the UI says so. */
export function getLeadBackend(): LeadBackend | null {
  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) return null;
  return { supabaseUrl, serviceRoleKey };
}

export function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const to = process.env.LEAD_NOTIFY_TO?.trim();
  if (!apiKey || !from || !to) return null;
  return { apiKey, from, to };
}

export function isDemoMode(): boolean {
  return getLeadBackend() === null;
}
