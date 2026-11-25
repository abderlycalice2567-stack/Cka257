# Architecture

## Overview

```
Listeners ──► CDN / WAF (Cloudflare) ──► Next.js app (public site + admin + API)
                                            │
                                            ├── PostgreSQL (Supabase or managed Postgres)
                                            ├── Media storage (local disk in this build → S3/R2 in production)
                                            ├── Broadcasting engine API (AzuraCast, read-only, server-side)
                                            ├── Email (Resend) · Payments (Stripe Checkout + webhook)
                                            └── Background worker (planned: audio normalisation, transcription, notifications)

Studio / remote presenters ──► AzuraCast (Liquidsoap + Icecast) ──► HTTPS stream ──► browsers, apps, directories
```

The **broadcast never flows through the web app**: the browser plays the Icecast/AzuraCast HTTPS mount directly. Website deploys, outages or maintenance cannot interrupt the radio. The app only reads the engine's public now-playing API (cached ≤15 s) and stores the stream URLs.

## Application structure (modular monolith)

```
src/
  app/
    [locale]/            public site (en, fr, ht) — pages, server actions (actions.ts)
    admin/               admin area (own root layout) — pages, server actions (actions.ts)
    api/v1/              JSON API (public reads, authenticated writes, webhooks, exports)
    feeds/               podcast RSS
    media/[...key]       media delivery with access control + HTTP Range
    sitemap.ts robots.ts manifest.ts
  modules/               data access by domain: catalog, schedule, content, account, feeds
  lib/                   auth (password, sessions, TOTP, permissions), csp, i18n, validation,
                         rate-limit, email, stripe, media storage, radio adapter, xml (RSS/ICS), markdown
  components/            player, site chrome, forms, admin UI
  proxy.ts               per-request: locale routing, CSP nonce, security headers, noindex
db/migrations/           plain SQL, applied in order by scripts/migrate.mjs
scripts/                 migrate, seed (sample content), create-admin
tests/unit, tests/e2e    Vitest (incl. DB integration) and Playwright smoke test
```

## Data model (PostgreSQL)

Implemented tables (see `db/migrations/001_init.sql`):

- **Identity**: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions`, `email_tokens`, `notification_preferences` (+ TOTP columns from `004_admin_mfa.sql`).
- **Station**: `stations` (name, tagline, **timezone**), `stream_endpoints` (HTTPS-only by CHECK constraint), `site_settings` (now-playing provider, homepage layout).
- **Programming**: `categories`, `presenters`, `programs`, `program_presenters`, `seasons`, `broadcast_schedules` (recurring rule in station local time), `broadcast_occurrences` (concrete UTC airings), `episodes`, `episode_chapters`, `broadcast_recordings`, `media_assets`.
- **Editorial**: `articles` (per language), `devotionals` (per day + language), `pages` (editable about/legal pages), `events`, `event_registrations`.
- **Engagement**: `favorites`, `follows`, `playback_progress`, `listening_history`, `broadcast_reminders`.
- **Community**: `prayer_requests` (visibility, assignment, retention date), `testimonies` (consent), `contact_messages`, `newsletter_subscribers`, `consent_records`.
- **Finance**: `fundraising_campaigns`, `donations` (unique `provider_ref` ⇒ idempotent webhooks), `sponsorship_inquiries`.
- **Operations**: `platform_integrations`, `background_jobs`, `audit_logs`.

### Program / episode / occurrence / recording

The four entities from the brief are separate: a **program** has many **episodes**; a **schedule rule** generates many **broadcast occurrences**; an occurrence may reference the episode it aired (`episode_id`) and may produce **recordings** (`broadcast_recordings` → `media_assets`). An episode can air many times without duplication.

### Time zones

Rules are stored as local wall-clock time (`start_time`, `weekdays`) and expanded by the SQL function `schedule_slots()` using `AT TIME ZONE`, so DST transitions are handled by PostgreSQL's tz database (integration-tested for March and November). `materialize_occurrences()` keeps a rolling 3-week window and never overwrites occurrences an editor changed (`manually_edited`). All timestamps are `timestamptz` (UTC); the browser converts to the listener's zone.

### Integrity rules enforced by the database (not just the UI)

- An episode cannot be `published` unless `rights_confirmed` is true and `published_at` is set.
- A testimony cannot be `approved` without `consent_publish`.
- Stream URLs must be `https://`.
- One donation row per Stripe object.

## Authentication & authorization

- Passwords: scrypt (N=16384, r=8, p=1), constant-time compare; dummy hash for unknown emails.
- Sessions: 256-bit random token in an `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookie; only its SHA-256 is stored; 30-day expiry; all sessions revoked on password reset, role change or suspension.
- **Staff two-step verification**: TOTP (RFC 6238, SHA-1, 6 digits, ±1 step) with replay protection; secrets encrypted at rest with AES-256-GCM (key derived from `APP_SECRET`). Admin pages, admin actions and private media require a session that completed TOTP. The development-only opt-out (`ADMIN_MFA_REQUIRED=false`) is ignored in production.
- RBAC: permissions are checked **server-side in every admin page and server action** (`requirePermission`). Roles: Super Administrator, Station Director, Program Director, Presenter, Producer, Editor, Moderator, Prayer Team Member, Finance Manager, Subscriber.

## Decisions and deviations from the brief (documented as required)

| Brief | This build | Why / path to the brief |
|---|---|---|
| Monorepo `apps/web`, `apps/admin`, `apps/worker`, `packages/*` | Single Next.js app with clear module boundaries (`modules/`, `lib/`, `app/admin`) | The brief also asks for a modular monolith without unnecessary complexity. Admin shares auth, DB and types; splitting adds build/deploy overhead with no benefit at launch. A worker app can be added alongside without restructuring. |
| Supabase (DB + auth) | Plain PostgreSQL via `postgres` driver; own auth | Runs unchanged on Supabase Postgres (use its connection string). Own auth gives TOTP-gated admin sessions and server-side RBAC without coupling to a vendor SDK. Supabase Auth/Google/Apple sign-in can be added later (see DECISIONS-NEEDED). |
| shadcn/ui | Tailwind + a small in-house component set | Fewer dependencies; consistent brand tokens; same accessibility patterns. |
| Cloudflare R2 / S3 media | Local-disk adapter with the same interface (`lib/media/storage.ts`) | No storage account yet. Swap the adapter for S3/R2 and move uploads to presigned direct-to-bucket uploads (current upload limit 95 MB via server actions). |
| Redis + BullMQ workers, FFmpeg normalisation, transcription | `background_jobs` table + ffprobe duration on upload | No worker host yet. The job table and statuses (`processing`, `failed`) exist; the worker is the next phase. |
| OneSignal / Web Push, email reminders | Preferences and reminders stored; delivery not implemented | Requires email/push provider accounts. |
| Google/Apple sign-in | Not implemented | Needs OAuth app registration under the station's accounts. |
| Rate limiting | In-memory per instance | Correct for one instance; use Redis/Upstash or the CDN's rate limiting when running several. |
| Sentry, Matomo/GA | Not wired | Needs accounts; no third-party scripts are loaded, which also keeps the strict CSP intact. |

## Internationalisation

Locale-prefixed URLs (`/en`, `/fr`, `/ht`), negotiated from `Accept-Language` or a remembered choice. Interface strings in `src/lib/i18n/dictionaries/*` (a unit test enforces that French and Creole cover every English key). Content is translatable per field (`jsonb {en, fr, ht}`) for programs, categories, presenters and events; articles, devotionals and pages are written per language; episodes have a language. Missing translations fall back to English. **Creole and French copy were drafted for the preview and must be reviewed by native speakers.**

## Performance notes

- No third-party runtime JavaScript; fonts self-hosted by `next/font`.
- Server-rendered pages; client JS limited to the player, forms and small widgets.
- DB indexes on occurrence time ranges, episode status/date, full-text search (`GIN` on a generated `tsvector`).
- Media served with long-lived cache headers when public; Range requests for seeking. In production, put media and the stream on a CDN.
- Core Web Vitals have **not** been measured on production infrastructure yet.
