# Deployment checklist

Until every launch blocker below is resolved this is a sales demo, not an
authorized production website.

## A. Private preview (allowed now)

- [ ] Vercel project with **Root Directory** = `lopez-auto-repair`
- [ ] `PREVIEW_PASSWORD` set; `ALLOW_INDEXING` unset
- [ ] `NEXT_PUBLIC_SITE_URL` = the preview URL
- [ ] Either demo mode (no backend variables), or a **sandbox** Supabase
      project + Resend key with `LEAD_NOTIFY_TO` = a test inbox
- [ ] `npm run test:e2e` passes against the preview
      (`BASE_URL=… PREVIEW_PASSWORD=… npm run test:e2e`)
- [ ] Preview banner and "Illustrative placeholder" labels visible
- [ ] Share the URL and password privately only

## B. Owner discovery — launch blockers

Get each of these from the owner, in writing:

- [ ] Legal / display name
- [ ] Exact location (city is currently **unconfirmed**) and service area
- [ ] Phone number
- [ ] Weekly and holiday hours
- [ ] Current website / domain ownership and DNS access; approval of any migration
- [ ] Approved service list and per-service copy
- [ ] Pricing / estimate policy (answers the open FAQ items)
- [ ] Logo and image rights; photos for hero, services and workshop
- [ ] Real, attributable reviews (or none)
- [ ] Response-time wording for the request page
- [ ] Lead recipient email
- [ ] Privacy contact and lead retention period
- [ ] Request form vs. real-time booking (booking is out of MVP scope)

## C. Apply the owner's answers

- [ ] `src/config/business.ts`: fill verified fields; leave anything unverified `null`
- [ ] `src/content/services.ts`: final copy, `approved: true` per approved
      service, FAQ answers, real gallery assets (or empty the gallery to remove
      the Workshop page and nav link)
- [ ] Replace the wordmark in `src/components/Logo.tsx` and the SVG
      illustrations with approved assets and descriptive alt text
- [ ] Finish `src/app/privacy/page.tsx`; schedule the retention job noted in
      the migration
- [ ] Set `ownerApproved: true` **last**, then confirm no "pending"
      placeholders remain and the `AutoRepair` JSON-LD contains only confirmed facts
- [ ] If replacing an existing site: inventory its URLs, add 301 redirects in
      `next.config.mjs`, carry over useful content, record baseline analytics

## D. Production

- [ ] Separate **production** Supabase project; run `db/migrations/0001_leads.sql`
- [ ] Confirm RLS is on for `leads` and `lead_notifications` with no policies;
      `anon` cannot read (`curl` with the anon key returns nothing)
- [ ] Supabase backups / point-in-time recovery enabled; dashboard access
      limited to authorized staff with 2FA
- [ ] Production env vars set in Vercel (Production scope only):
      `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
      `EMAIL_FROM` (verified domain), `LEAD_NOTIFY_TO` (owner-approved),
      `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`
- [ ] Cron running (`vercel.json`); schedule fits the Vercel plan
- [ ] Shared rate limiting enabled (Vercel WAF rule on `POST /api/leads`)
- [ ] Domain + DNS connected, HTTPS working, `www`/apex redirect chosen
- [ ] Phase 3 test pass repeated on production: 375/768/1440 px, keyboard and
      focus, contrast, form errors, successful submission, forced notification
      failure and retry, rate limit, broken links, Lighthouse
- [ ] Test submission made **with the owner**, who confirms the email arrived
      and can find the lead in the dashboard; delete test leads afterwards
- [ ] **Written owner sign-off received**
- [ ] Only then: remove `PREVIEW_PASSWORD`, set `ALLOW_INDEXING=true`, redeploy,
      verify `robots.txt` and `sitemap.xml`, submit the sitemap

## E. Handover

- [ ] Repository access transferred or shared
- [ ] Credentials delivered through a password manager / secure share — never
      email or chat
- [ ] Owner shown how to review leads and update their `status`
- [ ] Maintenance plan agreed: dependency updates, uptime and failed-notification
      monitoring (`lead.notification_failed` in logs; `pending` outbox rows),
      who to contact
