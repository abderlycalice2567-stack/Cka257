export const env = {
  appUrl: (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  allowIndexing: process.env.ALLOW_INDEXING === "true",
  mediaDir: process.env.MEDIA_DIR || "./data/media",
  emailConfigured: Boolean(process.env.RESEND_API_KEY),
  stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  isProduction: process.env.NODE_ENV === "production",
};
