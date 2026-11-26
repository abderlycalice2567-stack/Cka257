# Gunter Automotive: website prototype

> **Status: private sales prototype.** This is not an authorized production website. Business facts (phone, hours, address, services,
> story, photos, reviews) are **unverified** and are either hidden or shown as clearly labelled drafts. Do not publish, point a domain at
> it, or contact customers without written owner approval. See [`docs/OWNER-DISCOVERY.md`](docs/OWNER-DISCOVERY.md).

Built from the *Gunter Automotive: website architecture & developer handoff v1.0* spec.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 3
- Supabase Postgres via the REST API, with **server-only** writes using the service-role key (no SDK dependency)
- Resend for transactional email (HTTP API)
- Intended host: Vercel, with separate preview and production environments

## Quick start

```bash
npm install
cp .env.example .env.local   # leave SUPABASE_* empty for demo mode
npm run dev                  # http://localhost:3000
```

In **demo mode** (no database configured) the request form validates fully, but the API stores nothing and sends nothing. The receipt page
states *"nothing was stored and nobody was contacted"*. The site never claims a request was sent when it wasn't.

## Project layout

| Path | What |
|---|---|
| `src/config/business.ts` | **All business facts.** `null` = unverified, and the UI hides it. |
| `src/content/services.ts` | Service copy (maintenance, diagnostics, repair), each with `approved: false` |
| `src/content/faq.ts`, `src/content/workshop.ts` | FAQ (owner supplies answers) and gallery entries (illustrative placeholders) |
| `src/app/**` | Routes: `/`, `/services`, `/services/[slug]`, `/about`, `/workshop`, `/request`, `/contact`, `/privacy`, `/thank-you` |
| `src/app/api/leads/route.ts` | `POST /api/leads` |
| `src/components/` | Header, Footer, Hero, ServiceCard, Gallery, FAQ, RequestForm, ContactPanel, CTA, StickyActions, … |
| `src/lib/validation.ts` | Shared zod schema (client and server) |
| `src/lib/leads.ts`, `src/lib/notify.ts` | Storage (Supabase REST) and owner notification (Resend, with retries) |
| `src/proxy.ts` | Preview Basic Auth and `X-Robots-Tag: noindex` |
| `db/migrations/001_leads.sql` | `leads` table with RLS on and no public access |
| `scripts/retry-notifications.mjs` | Re-sends notifications for stored leads whose email failed |

## How content behaves

`SITE_MODE=preview` (the default) shows draft services, FAQ placeholders and illustrative images, all labelled, with a "Private preview"
banner. Every response is `noindex`, `robots.txt` disallows everything and the sitemap is empty.

`SITE_MODE=live` hides anything unapproved: services with `approved: false`, unanswered FAQs, and `/workshop` when no approved photos exist.
AutoRepair JSON-LD is emitted only when `business.schemaVerified` is `true`, and only with confirmed fields. Call buttons and directions
appear only once `phone` and `address` are set.

## Lead flow

`/request` → client validation → `POST /api/leads` (same-origin check, rate limit of 5 per 10 minutes per IP, 16 KB body cap, zod
validation, honeypot and minimum fill time) → insert into `leads` → **201** with an opaque receipt ID → `/thank-you`. After the
response, the owner notification is sent with up to 3 attempts and backoff, and the outcome is recorded on the lead (`notified_at`,
`notify_attempts`, `notify_error`). An email failure never loses a lead: run `npm run leads:retry-notifications` on a schedule.

API responses: `201` receipt, `400` validation (`fields` map for inline errors), `403` cross-origin, `413`/`415` bad request,
`429` rate limited (`Retry-After`), `503` storage failure. Logs contain receipt IDs and error codes only, never customer details.

Duplicate submissions are prevented by disabling the button and sending a per-form `Idempotency-Key`. A unique constraint means a retried
request returns the original receipt without a second notification.

## Database setup

1. Create a Supabase project per environment (preview, production).
2. Run `db/migrations/001_leads.sql` in the SQL editor.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as **server-side** environment variables only.
4. Staff review leads in the Supabase table editor using their own least-privilege accounts. A custom CRM is phase two.

RLS is enabled with no policies, so the `anon`/`authenticated` roles cannot read or write. Agree on a retention period with the owner and
schedule the delete shown in the migration.

## Tests

```bash
npm run typecheck && npm run lint
npm test                    # unit: validation, API route (demo/storage/errors/429/dupes/log hygiene), notifications
npm run build && npm start &
npm run test:e2e            # Playwright smoke: all routes at 375/768/1440px, form errors and demo submit, mobile menu, skip link
```

The e2e script writes screenshots to `tests/e2e/screenshots/` (gitignored). Set `BASE_URL` to test another server. Do not point it at
production with a real database: it submits a request.

## More docs

- [`docs/DEPLOYMENT-CHECKLIST.md`](docs/DEPLOYMENT-CHECKLIST.md): preview and production deployment, and the launch gate
- [`docs/OWNER-DISCOVERY.md`](docs/OWNER-DISCOVERY.md): facts to confirm before anything goes public
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md): contrast results and the manual QA checklist
