# Operations

## Backups & disaster recovery

| What | How | Frequency | Retention |
|---|---|---|---|
| PostgreSQL | Managed daily backups + point-in-time recovery (Supabase/managed PG); plus a weekly `pg_dump` to separate offsite storage | daily / weekly | 30 days / 6 months |
| Media | Bucket versioning + replication (S3/R2), or volume snapshots for disk storage | daily | 30 days |
| AzuraCast | Built-in backup (settings + media) to offsite storage | daily | 14 days |
| Configuration | Environment variables documented in the host; infrastructure notes in this repo | on change | — |

**Restore test (quarterly):** restore the latest DB backup into a scratch database, run `npm run db:migrate` (should be a no-op), start the app against it, and run `npm run test:e2e` read-only checks. Record the date and duration. Target: RPO ≤ 24 h, RTO ≤ 4 h for the website; the radio keeps broadcasting independently.

**Stream fallback:** AzuraCast fallback playlist + AutoDJ. If the VPS fails, the website shows "Stream unavailable" honestly; restore AzuraCast from backup on a new VPS and update DNS for `stream.`.

## Monitoring (to set up)

- Uptime checks (1–5 min) on the homepage, `/api/v1/radio/status`, and the default stream URL; alert by email/SMS.
- Error monitoring (Sentry or equivalent) for the app — not wired yet.
- AzuraCast notifications for stream offline and disk usage.
- Weekly review of the **Admin → Audit log** for failed sign-ins and MFA failures.

## Routine maintenance

| Task | Cadence |
|---|---|
| `npm audit --omit=dev`; update Next.js/React patch releases | monthly (immediately for security advisories) |
| Review roles; remove staff who left; confirm everyone has 2-step | quarterly |
| Purge prayer requests past their retention date (`DELETE FROM prayer_requests WHERE retain_until < now()`) — automate in the worker | monthly |
| Check podcast feeds in a validator after template changes | on change |
| Restore test | quarterly |
| CSP review after adding any embed or third-party script | on change |

## Incident response (summary)

1. **Contain**: suspend affected accounts (*Users & roles*), revoke sessions (role change or suspension does this), rotate exposed secrets in the host.
2. **Assess**: audit log, host logs, database changes since the last backup.
3. **Recover**: restore from backup if data was altered; redeploy a known-good build.
4. **Notify**: the station leadership; listeners/donors if personal data was affected, per applicable law.
5. **Review**: write up the cause and the fix.

## Capacity

Streaming bandwidth ≈ listeners × bitrate. Example: 100 concurrent × 128 kbps ≈ 12.8 Mbps; sustained for 30 days ≈ 4.15 TB. The web app itself carries no audio stream traffic; episode downloads should be served from the storage CDN.
