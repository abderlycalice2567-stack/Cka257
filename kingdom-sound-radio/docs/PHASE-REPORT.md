# Phase report

Following the brief's execution order. "Built" means implemented against the real database and covered by tests unless noted.

## 1–3. Foundation, database, authentication & permissions — built
- **Implemented**: Next.js 16 / React 19 / TypeScript (strict) / Tailwind; brand tokens (Midnight Navy, Royal Gold, Ivory, Slate, Live Red), Sora + Inter, light/dark themes; 4 SQL migrations (40+ tables); migration runner; sample seed; email/password auth, verification, reset; sessions; RBAC with 10 roles / 17 permissions; mandatory TOTP for staff; audit log.
- **Files**: `db/migrations/*`, `scripts/*`, `src/lib/auth/*`, `src/lib/db.ts`, `src/proxy.ts`, `src/lib/csp.ts`.
- **Decisions**: plain PostgreSQL + own auth instead of Supabase Auth; single app instead of monorepo (see ARCHITECTURE.md).
- **Tests**: RFC 6238 vectors, password/token, permission, CSP, rate-limit unit tests; e2e auth flows.
- **Limitations**: no Google/Apple sign-in; in-memory rate limiting.
- **Dependencies**: production database, `APP_SECRET`, email provider.

## 4–5. Broadcasting infrastructure & persistent player — website side built
- **Implemented**: stream endpoint management (HTTPS-only), AzuraCast now-playing adapter (swappable), honest status model, global player (live + on-demand, reconnection back-off, quality, sleep timer, speed, chapters, queue, resume, share-at-time, Media Session), radio webhook.
- **Not implemented here**: the AzuraCast/Icecast server itself (separate VPS; setup guide written).
- **Tests**: e2e playback across navigation, "not configured" state, now-playing never guessing.
- **Dependencies**: station's VPS and stream; music licences.

## 6–8. Programs, presenters, schedules, recordings & replays — built
- **Implemented**: programs/categories/presenters CRUD (translatable), recurring schedules in station time with DST-safe expansion, conflict detection, cancellations/specials, public schedule with local-time conversion and ICS export; episodes with upload (byte-sniffed type, ffprobe duration), chapters, transcripts, 10-status editorial workflow with DB-enforced rights review; private-until-published media with HTTP Range.
- **Limitations**: recording import from AzuraCast and FFmpeg normalisation/transcription not yet automated.

## 9–10. Podcast distribution & external integrations — built (accounts pending)
- **Implemented**: per-program and network RSS; integration registry with enable + human verification gate; external links per program.
- **Dependencies**: Apple/Spotify/YouTube/directory accounts and approvals.

## 11–12. Subscriber dashboard & community — built
- **Implemented**: favorites, follows, reminders, continue listening, history, notification preferences, data export, account deletion; prayer requests (visibility, assignment, retention), testimonies (consent), contact, newsletter (consent records), events with registration.
- **Limitations**: notifications not delivered; live chat/polls/song requests and media testimonies not built.

## 13. Administrative operations — built
Dashboard (real metrics only), broadcasting, schedule, programs, episodes, presenters, content, homepage layout, community, finance (+CSV), integrations, users & roles, audit log, launch readiness + sample purge.

## 14. Donations & monetisation — partially built
Stripe hosted Checkout (one-time + monthly) and verified idempotent webhook; campaigns; sponsorship inquiries. Untested against a live Stripe account. Advertising/sponsorship scheduling, memberships and merchandise not built.

## 15. Automation & analytics — not built
`background_jobs` table exists; no worker yet. Analytics limited to the admin dashboard; engine listener stats when AzuraCast is connected.

## 16. Security & accessibility — security built, audits pending
See SECURITY.md. Accessibility: semantic markup, labels, focus states, keyboard-operable player, reduced motion, transcripts/chapters — formal audit pending.

## 17. Production testing — partial
Automated suites pass (TESTING.md). Performance, accessibility, device, load, payment, email and restore tests pending.

## 18. Deployment & documentation — documentation built, deployment pending
Not deployed (no production accounts). Docs: README, ARCHITECTURE, API + OpenAPI, SECURITY, DEPLOYMENT, BROADCASTING-SETUP, ADMIN-MANUAL (incl. presenter guide), OPERATIONS, TESTING, LAUNCH-CHECKLIST, DECISIONS-NEEDED.

## Recommended next steps
1. Station confirms the items in DECISIONS-NEEDED.md and creates the accounts.
2. Stand up AzuraCast; connect stream + engine; licensing.
3. Staging deployment (managed Postgres, R2/S3 adapter, Resend, Stripe test mode); run all suites there.
4. Worker: recording import, FFmpeg normalisation, transcription, reminder/notification delivery, prayer purge.
5. Real content, native-speaker review of FR/HT, legal page review, sample purge.
6. Audits (accessibility, performance, security), load test, restore test → launch.
