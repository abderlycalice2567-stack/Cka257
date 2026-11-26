# Deployment checklist

## A. Private preview (allowed now)

- [ ] Vercel project with root directory `pro-auto-repair`
- [ ] `SITE_MODE=preview` (or unset) in the Preview environment
- [ ] Access control on: Vercel Deployment Protection, or `PREVIEW_USERNAME` + `PREVIEW_PASSWORD`
- [ ] Confirm `X-Robots-Tag: noindex` header and `Disallow: /` in `/robots.txt`
- [ ] Either leave backend variables empty (demo mode) or use a **separate preview** Supabase
      project and a **test** `LEAD_NOTIFY_TO` inbox. Never the owner's or a customer's address.

## B. Before production (all required)

Owner sign-off
- [ ] Written owner approval of design, copy and service list
- [ ] Everything in `docs/OWNER_DISCOVERY.md` resolved and entered in `src/config/business.ts`
- [ ] Existing-site owner approves the migration; domain and DNS access granted
- [ ] Privacy text, retention period and privacy contact approved

Content
- [ ] All "Preview note" boxes gone (search the built site for `Preview note`)
- [ ] All `illustrative: true` gallery items replaced with rights-cleared photos, or gallery emptied
- [ ] Owner logo replaces the text wordmark (`src/components/Logo.tsx`, `src/app/icon.svg`)
- [ ] Page titles/descriptions revised for the confirmed city and services

Redesign / SEO
- [ ] Inventory existing URLs (crawl + analytics + Search Console)
- [ ] Map 301 redirects in `next.config.mjs` `redirects()`; keep valuable content
- [ ] Baseline analytics captured for before/after comparison
- [ ] `identityVerified: true` only when name, address, phone and hours are confirmed

Infrastructure
- [ ] Separate **production** Supabase project; migration applied; backups enabled
- [ ] Production env vars set in Vercel (Production scope only); service-role key not in Preview
- [ ] Resend sending domain verified (SPF/DKIM); `LEAD_NOTIFY_TO` = owner-authorized recipient
- [ ] Rate limiter moved to a shared store; scheduled re-send for `notified_at is null`
- [ ] Retention job enabled per the agreed period
- [ ] Least-privilege dashboard access for named staff only; credentials handed over via a
      password manager, never email or chat

Go-live
- [ ] `SITE_MODE=production`, `SITE_URL=https://<domain>`; remove preview credentials
- [ ] Run `docs/TESTING.md` against production; submit a real test request **with the owner**
- [ ] Verify the noindex header is gone, `/sitemap.xml` lists the right URLs, HTTPS + HSTS active
- [ ] Lighthouse lab check (targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; confirm with field
      data at p75 once it exists)
- [ ] Maintenance plan agreed (dependency updates, backups, who handles lead issues)
