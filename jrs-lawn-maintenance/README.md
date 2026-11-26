# James Russell Smith Lawn Maintenance — website prototype

> **Status: private sales prototype. NOT an authorized production website.**
> Business facts come from earlier prospect research and have **not been verified with the owner**. All services, copy, branding and imagery are proposals. Don't publish, index or show this to customers without the owner's written approval. See [docs/OWNER-DISCOVERY.md](docs/OWNER-DISCOVERY.md).

A responsive marketing site whose main goal is getting completed **"Request lawn service"** forms. Built with Next.js (App Router) + TypeScript + Tailwind CSS. Leads go to Supabase Postgres, written only from the server. The owner is notified by email through Resend. It's meant to be deployed on Vercel.

## Quick start

```bash
npm ci
cp .env.example .env.local     # leave SUPABASE_* empty to run in demo mode
npm run dev                    # http://localhost:3000
```

### Demo mode (the default)

When `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are unset:

- The request form shows a **"Demo mode"** notice.
- The API still validates every submission and returns 201 with a `DEMO-XXXX-XXXX` reference. **Nothing is stored and nothing is emailed.**
- The thank-you page says **"This request was not sent."** It never claims a request was delivered.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Dev server / production build / production server |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm test` | Vitest unit tests: validation, API handler (201/400/403/413/429/503), idempotency, spam checks, notification retry, Supabase adapter, preview gate, CSP |
| `npm run test:e2e` | Playwright smoke test against a running server (see [Testing](#testing)) |

## Project layout

```
src/
  config/business.ts        Business facts, each with a `verified` flag. Unverified = hidden in the UI.
  content/services.ts       Service copy (problem, scope, exclusions, process, FAQ) + homepage FAQ
  app/                      Routes: / /services /services/[slug] /about /projects /request
                            /contact /privacy /thank-you, robots.txt, sitemap.xml
  app/api/leads/route.ts    POST endpoint (logic in src/lib/leads/handler.ts)
  app/api/cron/notify/      Scheduled retry for owner notifications that haven't been delivered
  components/               Header, Footer, Hero, ServiceCard, Gallery, FAQ, RequestForm,
                            ContactPanel, CTA, Process, StickyActions, MobileMenu, …
  lib/leads/                schema (shared client/server validation), service, Supabase store, Resend mailer
  proxy.ts                  Preview password gate, noindex, per-request CSP nonce
supabase/migrations/        `leads` table, RLS on, no public access
public/images/              Original SVG illustrations, labelled "Illustrative image" in the UI
tests/unit, tests/e2e
```

## How "unverified" is handled

`src/config/business.ts` is the single switchboard. Until a field is marked `verified: true`:

| Item | Behavior while unverified |
|---|---|
| Phone (706-227-1810, from research) | No `tel:` links anywhere. The mobile sticky bar shows only "Request lawn service". |
| Hours, service area, email, address | Hidden. In prototype mode, `/contact` lists them as "pending owner confirmation". |
| Business name | No LocalBusiness JSON-LD is emitted. |
| Projects / reviews | `/projects` returns 404 and is dropped from the nav and sitemap. The homepage proof module is hidden. Nothing is faked. |
| About story | Generic line plus a "Draft for owner review" note. |
| Services | All three are shown, marked as proposals, while `NEXT_PUBLIC_PROTOTYPE=true`. At launch only the slugs in `approvedServices` are shown. |
| Response time | Generic "the owner will contact you". No promise is made. |

No prices, guarantees, ratings, staff or credentials appear anywhere.

## Lead flow

```
visitor → /request → POST /api/leads
  → origin check → rate limit (5 per 10 min per IP) → JSON + 16 KB size limit
  → zod validation (same schema the browser uses) → honeypot + fill-time spam check
  → insert into Supabase (idempotency key: a retry or double-click reuses the same row)
  → 201 { receipt: "JRS-XXXX-XXXX" } → /thank-you (receipt only, no appointment or quote)
  → after the response: email the owner (3 tries with backoff)
       → on failure: lead kept, notification_status = 'failed'
       → /api/cron/notify retries pending/failed notifications (Vercel Cron, CRON_SECRET)
```

API responses: **201** created · **400** invalid (with `fieldErrors`) · **403** cross-site · **413** too large · **429** rate-limited (`Retry-After`) · **503** storage failure. Logs record the lead ID only, never customer details.

Data model (`supabase/migrations/20261126000000_create_leads.sql`): `id, created_at, receipt_code, idempotency_key, name, phone?, email?, service, details jsonb, status ('new'), consent_at, source`, plus notification-tracking columns. `details` holds description, ZIP, yard size, frequency, access notes, preferred date and marketing consent. RLS is enabled and forced, and `anon`/`authenticated` have no grants. The owner reads leads in the Supabase dashboard. A custom CRM is phase two.

## Design system

Palette (proposed): pine `#28543A`, tan `#DCC8A4`, white, plus derived shades `#1E3F2C`, `#1B2A21`, `#F7F2E8` and muted text `#4A5A50`. Every text/background pair used was checked against WCAG AA:

| Pair | Ratio |
|---|---|
| pine on white / white on pine | 8.68 |
| pine on tan | 5.31 |
| ink `#1B2A21` on tan | 9.17 |
| muted on white / muted on cream | 7.32 / 6.56 |

Fonts: Manrope (headings) and Inter (body), self-hosted via `@fontsource-variable`, with system fallbacks. Layout: 1200px max width, 12-column grid on desktop, single column with 16px gutters on mobile, 8px spacing scale, 12px card corners, 44px minimum touch targets.

Images are original SVG illustrations, always captioned "Illustrative image". Replace them with owner-approved photos. Project photos go in `business.projects` with real alt text and captions.

## Security & privacy

- Preview gate: HTTP Basic auth on every page and API route when `PREVIEW_PASSWORD` is set. Static SVG/fonts aren't gated.
- noindex: an `X-Robots-Tag` header, a robots meta tag, and a `robots.txt` that disallows everything unless `ALLOW_INDEXING=true`.
- Headers: CSP with a per-request nonce and `strict-dynamic`, HSTS (production), `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy.
- The service-role key and email key are read only on the server (`src/lib/env.ts` imports `server-only`).
- Rate limiting is in-memory per instance. **Before real traffic**, back it with a shared store (Upstash Redis or a Postgres function) and consider Cloudflare Turnstile. See the checklist.
- `/privacy` describes what the code actually does: vendors, no analytics cookies, no accounts or payments. The owner must set the retention period.

## Testing

```bash
npm run build && npx next start -p 3100 &
BASE_URL=http://localhost:3100 npm run test:e2e    # add PREVIEW_USER/PREVIEW_PASSWORD if gated
```

The smoke test (50 checks) covers:

- every route returns 200, and the 404 cases
- headers, robots, one H1 per page, no `tel:` links or ratings while unverified
- no horizontal scroll at **375 / 768 / 1440 px**
- **axe-core WCAG 2.1 A/AA** checks at 375 and 1440 px
- touch targets of at least 44px, the mobile menu (Escape closes it and returns focus), the skip link and a visible focus outline
- the error summary takes focus and fields get `aria-invalid`
- a full demo submission ends with "not sent" on the thank-you page
- API 400/403/429 and cron 401

Screenshots are saved to `test-results/`.

Not covered automatically, so test these manually against a sandbox Supabase project and a Resend test recipient before launch: a real stored lead, real email delivery, and recovery after an email failure via `curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/notify`. Core Web Vitals targets (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) need a Lighthouse run on the Vercel preview, and field data once live.

## Deployment

See [docs/DEPLOYMENT-CHECKLIST.md](docs/DEPLOYMENT-CHECKLIST.md).
