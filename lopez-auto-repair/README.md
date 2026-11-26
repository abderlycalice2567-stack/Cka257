# Lopez Auto Repair — private sales prototype

> **Status: private sales demo, not an authorized production website.**
> Service categories, copy, branding and functionality are proposals. Nothing
> here is a verified business claim. Do not publish, index, or contact
> customers without written owner approval (see
> [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)).

Responsive marketing site with a "Request service" lead form.
Next.js App Router · TypeScript · Tailwind CSS · Supabase Postgres (server-only
writes) · Resend (notification email) · Vercel.

## Quick start

```bash
npm install
cp .env.example .env.local   # leave the backend values empty for demo mode
npm run dev                  # http://localhost:3000
```

### Demo mode

With `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` unset the site runs in
**demo mode**: the form validates input on client and server, but stores and
sends nothing. The form is labelled "Demo mode", the API answers
`200 { demo: true }` (never a receipt), and the confirmation page says
"Nothing was sent".

## What is and isn't verified

All business facts live in `src/config/business.ts`. `null` means "not
confirmed" and the UI hides that item, or shows a dashed "pending owner
confirmation" placeholder while `ownerApproved` is `false`.

| Item | Current state | Effect |
|---|---|---|
| Phone | unverified (`null`) | No call links anywhere, including the mobile sticky bar |
| Hours, street address, directions | unverified | Hidden; placeholder in preview |
| City (Lawrenceville, GA) | **unconfirmed** | Shown with "(location to be confirmed)" in preview; used in the proposed title |
| Services | proposed, `approved: false` | Shown in preview only; an approved build hides unapproved services |
| Owner story, team, credentials | none | Placeholder only — nothing invented |
| Reviews | none | Proof module shows no reviews |
| FAQ answers that are shop policy | `null` | Placeholder in preview, hidden when approved |
| Photos | none | Original SVG illustrations, each labelled "Illustrative placeholder" |
| Structured data (`AutoRepair`) | off | Emitted only when `ownerApproved` is true, with confirmed fields only |

Flipping `ownerApproved` to `true` removes the preview banner, placeholders and
unapproved content. Do that only at Phase 4.

## Project layout

```
src/config/business.ts        business facts + verification flags
src/content/services.ts       service copy, process steps, FAQ, gallery
src/components/               Header, Footer, Hero, ServiceCard, Gallery, FAQ,
                              RequestForm, ContactPanel, CTA, …
src/app/                      routes: / /services /services/[slug] /about
                              /workshop /request /contact /privacy /thank-you
src/app/api/leads/route.ts    POST lead endpoint
src/app/api/cron/retry-notifications/route.ts   notification retry
src/lib/leads/                schema (shared validation), store, notify,
                              rate-limit, env, log
src/proxy.ts                  preview password + noindex header
db/migrations/0001_leads.sql  database schema
```

## Lead flow

visitor → `/request` → `POST /api/leads` → server validation → row in `leads`
→ owner notified by email → `/thank-you` receipt → owner contacts customer.

| Response | Meaning |
|---|---|
| `201 { receipt }` | Stored. Receipt is opaque (`LAR-XXXXXXXXXX`), not the database id |
| `200 { demo: true }` | Demo mode — nothing stored or sent |
| `400 { error, fields }` | Invalid input (per-field messages) |
| `429` + `Retry-After` | Rate limited (5 requests / 10 min / IP) |
| `503` + `Retry-After` | Storage failure — safe to retry |

- **Validation**: one zod schema (`src/lib/leads/schema.ts`) runs in the
  browser for inline errors and again on the server. Text is trimmed,
  control/bidi characters stripped, lengths capped; body size capped at 16 KB.
- **Required**: name, phone *or* email, service, description, contact consent.
  Vehicle year/make/model and preferred date are optional. Marketing consent is
  a separate, optional checkbox.
- **Duplicates**: each page load gets an idempotency key; the database has a
  unique constraint on it, so double-clicks and retries return the same receipt
  and create one lead.
- **Notification failure never loses a lead**: a database trigger creates a
  `lead_notifications` outbox row in the same transaction as the lead. The
  email is tried twice in-request; on failure the row stays `pending`, the
  error *code* is logged, and `/api/cron/retry-notifications` retries it
  (up to 12 attempts). The visitor still gets their receipt.
- **Spam**: honeypot field, same-origin check, rate limit.
- **Logging**: event names, receipts and error codes only — never customer
  details.
- **No JavaScript**: the form posts natively and the API answers with a
  redirect.

Not in the MVP, by design: payments, accounts, live scheduling, a custom CRM.
The owner reviews leads in the Supabase dashboard (Table Editor).

## Connecting the backend (sandbox first)

1. Create a Supabase project **for preview** (production gets its own).
2. Run `db/migrations/0001_leads.sql` in the SQL editor.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only; never
   `NEXT_PUBLIC_`).
4. Set `RESEND_API_KEY`, `EMAIL_FROM`, and `LEAD_NOTIFY_TO`. **In the private
   demo `LEAD_NOTIFY_TO` must be a test recipient.** Preview emails are
   subject-prefixed `[TEST — private demo]`.
5. Set `CRON_SECRET` (Vercel Cron sends it automatically).

## Preview privacy

- `PREVIEW_PASSWORD` set → every page needs HTTP Basic auth (any username).
- Unless `ALLOW_INDEXING=true` **and** `ownerApproved` is true: `noindex` meta
  tag, `X-Robots-Tag: noindex` header and `robots.txt` `Disallow: /`.
  These are baked in at build time — rebuild after changing them.

## Tests

```bash
npm run typecheck
npm run lint
npm test                 # unit: validation, rate limit, API contract
                         # (201/200-demo/400/429/503, notification failure,
                         #  duplicates, no-JS redirect) — backend is mocked
npm run build && npm start
npm run test:e2e         # smoke test against the running server
                         # (BASE_URL=…, PREVIEW_PASSWORD=… if set)
```

Manual checks before any launch (Phase 3): 375 / 768 / 1440 px layouts,
keyboard-only navigation with visible focus, screen-reader pass on the form,
Lighthouse lab run (targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1), a real
submission against the sandbox database, and a forced notification failure
(set a bad `RESEND_API_KEY`, submit, confirm the lead is stored and the outbox
row is `pending`, restore the key, call the cron endpoint).

## Design tokens

Navy `#14283F`, red `#B83A32`, white. Manrope headings, Inter body
(self-hosted via `@fontsource`, no third-party font requests). 1200 px max
width, 12-column grid, 16 px mobile gutters, 12 px card corners, 44 px minimum
touch targets. Contrast: navy on white 14.9:1; white on red and red on white
5.7:1 (AA). **Red on navy is 2.6:1 — don't use red text on navy.**

## Known limitations

- The rate limiter is in-memory per server instance. Add a shared limiter
  (Vercel WAF rule or Redis) for production.
- `vercel.json` schedules the retry cron every 10 minutes, which needs a Vercel
  plan that allows sub-daily crons. On Hobby, change the schedule to daily or
  call the endpoint from another scheduler.
- The CSP allows inline scripts (required by Next.js without nonces).
- No analytics is installed. Conversion events (`request_form_start/submit/
  success/error`, `phone_click`, `directions_click`) are emitted as a
  `lar:track` DOM event (`src/lib/track.ts`) for an owner-approved tool to
  consume; update the privacy page before adding one.
- The privacy page is a draft describing what this code does; retention period,
  privacy contact and final vendors are owner decisions.
