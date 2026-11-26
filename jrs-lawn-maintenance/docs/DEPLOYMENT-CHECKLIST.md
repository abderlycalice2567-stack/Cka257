# Deployment checklist

## A. Private preview (sales demo)

- [ ] Create a Vercel project with **Root Directory = `jrs-lawn-maintenance`**.
- [ ] Preview env vars: `PREVIEW_PASSWORD` (strong, shared privately), `NEXT_PUBLIC_PROTOTYPE=true`, `ALLOW_INDEXING=false`, `NEXT_PUBLIC_SITE_URL=<preview URL>`.
- [ ] Leave `SUPABASE_*` unset for pure demo mode, **or** connect a *sandbox* Supabase project:
  - [ ] Run `supabase/migrations/*.sql`.
  - [ ] Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server env only, never `NEXT_PUBLIC_`).
  - [ ] Set `RESEND_API_KEY`, `EMAIL_FROM` (verified domain) and `LEAD_NOTIFY_TO` = **test recipients only**.
  - [ ] Set `CRON_SECRET`.
- [ ] Open the preview and confirm the password prompt, the "Private prototype" banner and an `X-Robots-Tag: noindex` header.
- [ ] Run `npm run test:e2e` against the preview with the preview credentials.
- [ ] Run Lighthouse on mobile for `/` and `/request`: LCP ≤ 2.5 s, CLS ≤ 0.1, and no accessibility issues.

## B. Before production (owner sign-off required)

- [ ] Get **written owner approval** of copy, services, palette and images.
- [ ] Resolve everything in [OWNER-DISCOVERY.md](OWNER-DISCOVERY.md), then update `src/config/business.ts` and flip each `verified` flag.
- [ ] Set `approvedServices` and remove unapproved services' copy if they won't be offered.
- [ ] Replace illustrative SVGs with owner-approved photos and fill `projects` (alt text and captions). Add real reviews only, with their source.
- [ ] Replace the text "JRS" mark with the owner's logo, if they have one.
- [ ] Have the owner review `/privacy`: retention period, contact method, vendors. Update "Last updated".
- [ ] Production Supabase project: run the migration, enable backups (PITR if the plan allows), make sure only authorized staff have dashboard accounts, and turn on MFA for them.
- [ ] Production Resend: verified sending domain (SPF/DKIM). `LEAD_NOTIFY_TO` = owner-approved recipient.
- [ ] Replace the in-memory rate limiter with a shared store (Upstash Redis / Postgres) and consider adding Cloudflare Turnstile.
- [ ] Vercel Cron for `/api/cron/notify` (`vercel.json`, daily on Hobby; switch to hourly on Pro).
- [ ] Domain/DNS access from the owner. Set `NEXT_PUBLIC_SITE_URL` to the final https URL.
- [ ] If an existing site is found: inventory its URLs, map 301 redirects (`next.config.mjs` `redirects()`), and record analytics before and after.
- [ ] Test the production form **with the owner**: submission → email received → row visible in the dashboard.
- [ ] Simulate an email failure (bad API key on preview) → lead still stored → cron delivers it after the fix.
- [ ] Final env: remove `PREVIEW_PASSWORD`, set `NEXT_PUBLIC_PROTOTYPE=false` and `ALLOW_INDEXING=true` **only after sign-off**.
- [ ] Submit `sitemap.xml` in Google Search Console and check the `LocalBusiness` JSON-LD in the Rich Results Test.

## C. Handover

- [ ] Hand over the repository, Vercel, Supabase and Resend access through a password manager (never by email or chat).
- [ ] Walk the owner through viewing and updating lead `status` in the Supabase Table editor.
- [ ] Maintenance plan: dependency updates monthly (`npm outdated`, `npm audit`), apply the retention cleanup per policy, check failed notifications (`notification_status = 'failed'`) weekly.
