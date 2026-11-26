# Deployment checklist

## Private preview (sales demo)

- [ ] Vercel project created with **Root Directory** set to `gunter-automotive`
- [ ] Preview access controlled: `PREVIEW_USERNAME`/`PREVIEW_PASSWORD` set, **or** Vercel Deployment Protection enabled
- [ ] `SITE_MODE=preview` (or unset). Confirm the `X-Robots-Tag: noindex` header and a `Disallow: /` robots.txt
- [ ] Either demo mode (no `SUPABASE_*`), or a **sandbox** Supabase project plus Resend with **test recipients only**
- [ ] `npm run typecheck && npm run lint && npm test` pass, and `npm run test:e2e` passes against the preview
- [ ] Share the link privately. Never post it publicly.

## Production (only after Phase 4 sign-off)

### Launch gate (all required)
- [ ] Written owner approval of copy, services, images and privacy notice
- [ ] Every item in `docs/OWNER-DISCOVERY.md` resolved, and `src/config/business.ts` updated with verified values
- [ ] Services the owner approved set to `approved: true`. FAQ answers supplied, or the questions removed.
- [ ] Workshop photos replaced with owner-supplied images (rights confirmed), or the route left hidden
- [ ] Placeholder wordmark replaced with the owner's logo
- [ ] `/privacy` brackets resolved: controller, contact, vendors, retention, last-updated date
- [ ] Domain/DNS access confirmed with the domain owner

### Infrastructure
- [ ] Separate production Supabase project, with the migration applied, RLS verified (anon read returns nothing), backups enabled (PITR if on a paid plan)
- [ ] Resend sending domain verified (SPF/DKIM). `LEAD_NOTIFY_TO` set to the owner-designated recipient.
- [ ] Production env vars: `NEXT_PUBLIC_SITE_URL`, `SITE_MODE=live`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `LEAD_NOTIFY_FROM`, `LEAD_NOTIFY_TO`. Preview credentials **not** set.
- [ ] Schedule `scripts/retry-notifications.mjs` (e.g. hourly GitHub Action or cron with the same env vars)
- [ ] Multi-instance rate limiting: add a shared store (Upstash Redis) or a Vercel WAF rate-limit rule for `/api/leads`
- [ ] Optional: Cloudflare Turnstile if spam gets past the honeypot and timing check

### Redesign migration (existing site)
- [ ] Inventory existing URLs (crawl plus Search Console). Map 301 redirects in `next.config.mjs` `redirects()`.
- [ ] Carry over useful existing content with owner approval
- [ ] Record baseline analytics (form submissions, calls) before the switch, then compare after

### Go-live verification
- [ ] Owner submits a real test request on production and confirms the email arrives. Delete the test lead afterwards.
- [ ] Simulate a notification failure (wrong API key in preview) and confirm the lead is stored with `notify_error`, then retried
- [ ] Lighthouse lab run: LCP ≤ 2.5 s, CLS ≤ 0.1, no accessibility errors. Field INP and LCP reviewed once data exists.
- [ ] Sitemap submitted in Search Console. JSON-LD validated (only if `schemaVerified`).
- [ ] Hand over the repository, deployment access, credentials (via a password manager, never email) and the maintenance plan
