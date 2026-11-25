# Deployment

Three environments — **development, staging, production** — each with its own database, storage bucket, secrets and Stripe mode. Never point staging at production data.

All accounts (domain, DNS/CDN, hosting, database, storage, AzuraCast VPS, Stripe, Resend, Apple/Spotify/YouTube) should be **registered to the station**, with the agency invited as a member.

## 1. Database (Supabase Postgres or any managed PostgreSQL 15+)

1. Create the project/database. Enable daily backups and point-in-time recovery.
2. Use the **pooled** connection string for the app (`DATABASE_URL`), with `sslmode=require`.
3. Run migrations from CI or a trusted machine: `DATABASE_URL=… npm run db:migrate`.
4. **Do not** run `db:seed` in production. Create the first administrator with `ADMIN_EMAIL=… npm run admin:create` and enrol 2-step on first sign-in.
5. Required extensions: `pgcrypto`, `citext` (created by migration 001; available on Supabase).

## 2. Media storage

This build stores uploads on local disk (`MEDIA_DIR`). For production:

- **Single VPS/container host** (Docker, Render, Fly, a VM): mount a persistent volume at `MEDIA_DIR` and include it in backups. Works as-is.
- **Serverless (Vercel)**: local disk is ephemeral — implement the S3/R2 adapter in `src/lib/media/storage.ts` (same `saveUpload / statKey / streamKey / removeKey` interface) and switch to presigned direct uploads. Serve public media from the bucket's CDN domain (`media.<domain>`).

## 3. Application hosting

Any Node 20+ host. Build with `npm ci && npm run build`, run with `npm start` (port from `PORT`).

Environment variables (see `.env.example`):

| Variable | Required | Notes |
|---|---|---|
| `APP_URL` | yes | Public origin, e.g. `https://thekingdomsoundradio.com` (feeds, emails, canonicals) |
| `DATABASE_URL` | yes | Pooled, TLS |
| `APP_SECRET` | yes | ≥32 random chars; encrypts TOTP secrets. Rotating it invalidates enrolled authenticators |
| `MEDIA_DIR` | yes (disk storage) | Persistent path |
| `ALLOW_INDEXING` | at launch | `true` only for production when ready to be indexed |
| `RESEND_API_KEY`, `EMAIL_FROM` | for email | Verified sending domain (SPF/DKIM/DMARC) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | for giving | Webhook endpoint: `https://<domain>/api/v1/webhooks/payments`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` |
| `RADIO_WEBHOOK_SECRET` | optional | AzuraCast web hook → `/api/v1/webhooks/radio` with header `X-Webhook-Token` |
| `DATABASE_POOL_SIZE` | optional | Default 10 |

Behind a proxy/CDN, make sure `X-Forwarded-For` and `Host` are forwarded (rate limits, origin checks).

## 4. Domains (proposed)

| Host | Points to |
|---|---|
| `thekingdomsoundradio.com` | App (via CDN) |
| `admin.…` (optional) | Same app; add IP allow-listing / Cloudflare Access in front of `/admin` |
| `studio.…` | AzuraCast control panel (VPS) — restrict access |
| `stream.…` | AzuraCast/Icecast public mounts (HTTPS) |
| `media.…` | Storage bucket CDN |
| `status.…` | External uptime page (e.g. a hosted status service) |

DNS hardening: CAA records, DNSSEC, SPF/DKIM/DMARC for the email domain.

## 5. CDN / security edge (Cloudflare recommended)

Proxy the app hostname; enable WAF managed rules, bot fight mode, rate-limiting rules for `/api/*` and form posts, and cache rules for `/_next/static/*` and `/media/*`. Do **not** cache HTML for signed-in users (the app sends `private, no-store` on account/admin pages).

## 6. Release process

1. CI: `npm ci && npm run lint && npm run typecheck && npm test && npm run build`.
2. Apply migrations to staging, deploy, run `npm run test:e2e` against staging.
3. Apply migrations to production (migrations are additive; take a backup first), deploy, smoke-check `/api/v1/radio/status`.
