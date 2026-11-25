# The Kingdom Sound Radio — web platform

*Broadcasting Faith. Connecting Communities. Transforming Lives.*

The website and administration system for The Kingdom Sound Radio: live radio player, programs, schedules, replays and podcasts, presenters, community features, subscriber accounts, giving, and a role-based admin with two-step verification. English, French and Haitian Creole.

> **Status: working pre-launch build (phases 1–4 of the roadmap, partially 5).** Everything described here runs against a real PostgreSQL database and is covered by automated tests. Content in the database is **sample data, clearly labelled**, and must be replaced by the station's real content. The live stream, AzuraCast, email, Stripe and external platforms are wired in the code but **not connected** until the station provides accounts — see [docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md).

## Quick start (local)

Requirements: Node.js 20+ (22 recommended), PostgreSQL 15+, ffmpeg/ffprobe (for sample audio and upload duration).

```bash
cp .env.example .env.local          # then fill in DATABASE_URL and APP_SECRET
npm ci
npm run db:migrate                  # apply db/migrations/*.sql
npm run db:seed                     # optional: clearly-labelled sample content
ADMIN_EMAIL=you@example.org npm run admin:create   # prints a one-time password
npm run build && npm start          # http://localhost:3000
```

Sign in at `/en/sign-in`, then open `/admin`. On first admin sign-in you enrol an authenticator app (TOTP); it is required for every staff account.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js development server / production build / production server |
| `npm run lint` · `npm run typecheck` | ESLint (Next + React hooks rules) · `tsc --noEmit` |
| `npm test` | Vitest unit + database integration tests (uses `TEST_DATABASE_URL`) |
| `npm run test:e2e` | Playwright end-to-end smoke test against a running server (`BASE_URL`, optional `ADMIN_EMAIL`/`ADMIN_PASSWORD`) |
| `npm run db:migrate` · `db:seed` · `db:reset` | Migrations · sample content · drop & recreate (refuses in production) |
| `npm run admin:create` | Create or promote a Super Administrator |

## What's inside

- **Public site** (`/en`, `/fr`, `/ht`): home (sections configurable in admin), live radio, programs, program and episode pages, interactive schedule with automatic local-time conversion and calendar export, replay/podcast library with search and filters, presenters, news, devotionals, events with registration, community hub, prayer requests, testimonies, support/giving, contact, FAQ and legal pages, site search.
- **Persistent player**: one audio element for the whole site; live stream with quality selection, reconnection back-off, honest status (never shows “live” unless audio is actually playing), sleep timer, lock-screen controls; on-demand episodes with seek, ±15/30 s, 0.75–2× speed, chapters, queue, resume (synced to the account when signed in), share-at-timestamp.
- **Accounts**: email/password sign-up, verification, password reset, favorites, follows, reminders, listening history, continue-listening, notification preferences, data export and account deletion.
- **Admin** (`/admin`): dashboard with real metrics only, broadcasting (streams + AzuraCast connection), schedule (recurring rules, conflict detection, cancellations, specials), programs, episodes & media (upload, chapters, transcript, review → rights confirmation → publish workflow), presenters, content (articles, devotionals, events, pages), homepage layout, community moderation (prayer with assignment, testimonies with consent enforcement, messages), finance (donations, campaigns, sponsorship inquiries, CSV export), integrations (enable + “I tested it” verification), users & roles, audit log, launch readiness + sample-content purge.
- **Distribution**: podcast RSS per program and network-wide (`/feeds/podcasts/<program>.xml`, `/feeds/podcasts.xml`), JSON API (`/api/v1/…`), sitemap with hreflang, structured data.
- **PWA**: manifest, service worker (offline copy of visited public pages and the schedule; never caches private pages).

## Documentation

| Document | For |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data model, decisions and deviations from the brief |
| [docs/API.md](docs/API.md) · [docs/api/openapi.yaml](docs/api/openapi.yaml) | API reference |
| [docs/SECURITY.md](docs/SECURITY.md) | Security controls and remaining work |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment (Supabase/Postgres, Vercel or Node host, storage, env) |
| [docs/BROADCASTING-SETUP.md](docs/BROADCASTING-SETUP.md) | AzuraCast/Icecast studio setup and connecting it to the site |
| [docs/ADMIN-MANUAL.md](docs/ADMIN-MANUAL.md) | Staff guide (administrators, editors, presenters, moderators) |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Backups, monitoring, incident response, maintenance |
| [docs/TESTING.md](docs/TESTING.md) | Test suites and the results of the latest run |
| [docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md) | Spec acceptance checklist with honest status |
| [docs/PHASE-REPORT.md](docs/PHASE-REPORT.md) | What was built per phase, limitations, dependencies, next steps |
| [docs/DECISIONS-NEEDED.md](docs/DECISIONS-NEEDED.md) | Items the station must confirm before production |
