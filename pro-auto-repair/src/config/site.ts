/** Deployment-level switches. Server-side only values are read lazily. */

export const isProductionSite = process.env.SITE_MODE === "production";
export const isPreview = !isProductionSite;
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function backendStatus() {
  const storage = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const email = Boolean(
    process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_FROM && process.env.LEAD_NOTIFY_TO,
  );
  return { storage, email, demo: !storage };
}
