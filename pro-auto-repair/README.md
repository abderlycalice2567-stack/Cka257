# Pro Auto Repair — private website prototype

> **Status: private sales prototype.** This is a redesign proposal, not the business's
> website. Service copy, branding and functionality are proposals that the owner has not
> approved. Phone, hours, address and city are unconfirmed and therefore not shown anywhere.
> Do not publish, index or use it to contact customers without written owner approval.

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase Postgres (server-only writes) ·
Resend (transactional email) · Vercel.

## Quick start

```bash
npm install
cp .env.example .env.local   # leave backend values empty for demo mode
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit + API route tests (Vitest) |

## Modes

**Demo mode** (default — no `SUPABASE_*` variables). The request form validates input on the
client and server, but stores and sends nothing. The form and the result page both say so
explicitly; the site never claims a request was received.

**Live mode** (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set). Leads are inserted into
`public.leads`, then a notification email is sent if `RESEND_API_KEY`, `LEAD_NOTIFY_FROM` and
`LEAD_NOTIFY_TO` are set. In a preview, `LEAD_NOTIFY_TO` must be a test inbox.

**Preview vs production** (`SITE_MODE`). Anything other than `production` adds a preview
banner, `noindex` meta, an `X-Robots-Tag: noindex` header and a disallow-all `robots.txt`.
Set `PREVIEW_USERNAME` and `PREVIEW_PASSWORD` to put the preview behind HTTP Basic auth
(or use Vercel Deployment Protection).

## Where things live

| Path | What |
|---|---|
| `src/config/business.ts` | Every business fact. `null` = unconfirmed = hidden. |
| `src/content/services.ts` | Service copy, process steps, FAQ questions |
| `src/config/site.ts` | Preview/production and backend switches |
| `src/components/` | Header, Footer, Hero, ServiceCard, Gallery, FAQ, RequestForm, ContactPanel, CTA |
| `src/app/api/leads/route.ts` | `POST /api/leads` |
| `src/lib/validation.ts` | Shared zod schema + sanitizing (client and server) |
| `src/lib/leads.ts` | Supabase insert + Resend notification with retry |
| `src/lib/rate-limit.ts` | Rate limit + duplicate guard (in-memory) |
| `supabase/migrations/0001_create_leads.sql` | Database migration |
| `docs/` | Deployment checklist, owner discovery, test plan |

### Filling in verified facts

Edit `src/config/business.ts`. Components react automatically:

- `phone` → call links appear in the footer, contact page and the mobile sticky bar.
- `hours`, `address`, `directionsUrl`, `serviceArea` → shown on Contact and in the footer.
- `story`, `team`, `credentials`, `reviews`, `faqAnswers` → replace the dashed "Preview note"
  boxes. In production, unanswered FAQs and empty modules are hidden rather than shown empty.
- `approvedServices` → list of approved slugs; unapproved services and their routes disappear.
- `gallery` → set `src` to a file in `/public` and `illustrative: false`. Empty array removes
  the Workshop page, nav link and homepage section.
- `identityVerified: true` (plus address and phone) → emits `AutoRepair` JSON-LD in production.

## API

`POST /api/leads` (JSON)

| Status | Meaning |
|---|---|
| `201` `{ receipt, mode: "live" }` | Lead stored. `receipt` is an opaque reference, not the row id. |
| `200` `{ receipt: null, mode: "demo" }` | Demo mode: validated only, nothing stored or sent. |
| `400` `{ error, fields? }` | Invalid input (per-field messages) or rejected as spam |
| `429` | Rate limited (5 per 10 minutes per client; `Retry-After` set) |
| `503` | Storage failure — nothing saved; the form keeps the visitor's answers and offers a retry |

Required: `name`, `phone` or `email`, `service`, `description`, `consent`. Optional:
`vehicleYear`, `vehicleMake`, `vehicleModel`, `preferredDate` (a request, not a booking),
`marketingConsent` (separate, unticked by default).

Protections: zod validation on both sides, control-character stripping and length caps, 16 KB
body limit, honeypot field, minimum fill time, per-client rate limit, duplicate-payload guard
(an identical resubmission within 10 minutes returns the original receipt), disabled submit
button while sending. Logs contain ids and status codes only, never customer details.

### Notification failure

The lead is stored first. The email is then attempted up to 3 times with backoff. If all
attempts fail the visitor still gets their receipt, the failure is logged, and the row keeps
`notified_at = null`. Find leads that still need follow-up with:

```sql
select id, created_at, name, service from public.leads
where notified_at is null order by created_at;
```

## Database

Run `supabase/migrations/0001_create_leads.sql` in the Supabase SQL editor (or `supabase db push`).
Row level security is on with no policies and grants to `anon`/`authenticated` are revoked, so
the table is reachable only with the service-role key (server) and the Supabase dashboard,
which is how the owner manages leads in the MVP. `notified_at` is an addition to the handoff
data model, needed for the retry requirement.

## Known limits of this prototype

- Rate limiting and duplicate detection are in-memory, so they are per server instance. Move
  them to a shared store (e.g. Upstash Redis) before production on serverless.
- Email retry is in-request. A scheduled job that re-sends rows with `notified_at is null`
  is the production-grade follow-up.
- Images are original SVG placeholders labeled "Illustrative"; there are no real photos.
- The privacy page is a draft describing the prototype, not reviewed legal text.
- No analytics is installed. Hooks are ready: a `lead:submitted` window event and
  `data-track="phone-click" | "directions-click"` attributes.
- The existing site has not been audited here: URL inventory and 301 map are still to do.

See `docs/DEPLOYMENT_CHECKLIST.md`, `docs/OWNER_DISCOVERY.md` and `docs/TESTING.md`.
