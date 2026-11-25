# Security

## Controls in place (implemented and tested)

| Area | Control | Where |
|---|---|---|
| Transport | HSTS (1 year, includeSubDomains) in production; `upgrade-insecure-requests`; stream URLs must be HTTPS (DB constraint) | `src/proxy.ts`, migration 001 |
| XSS | Per-request nonce CSP with `strict-dynamic`, no `unsafe-inline` scripts, no `unsafe-eval` in production; React escaping; Markdown renderer builds elements, never HTML; JSON-LD escapes `<` | `src/lib/csp.ts`, `src/lib/markdown.tsx` |
| Clickjacking / isolation | `frame-ancestors 'none'`, `X-Frame-Options: DENY`, COOP `same-origin`, CORP on media | `next.config.mjs`, media route |
| CSRF | Server actions carry Next's origin check; JSON writes require same-origin `Origin`; `SameSite=Lax` session cookie | `src/lib/api.ts` |
| Authentication | scrypt hashing; timing-equalised unknown-user path; generic error messages; reset tokens single-use, 1 h, hashed; all sessions revoked on reset | `src/lib/auth/*`, `actions.ts` |
| Staff MFA | Mandatory TOTP for any admin page/action/private media; AES-256-GCM-encrypted secrets; replay protection; attempt rate limit; admin reset path | `src/lib/auth/totp.ts`, `requirePermission` |
| Authorization | Server-side permission checks in every admin page and action; least-privilege roles; prayer team limited to assigned requests; role change/suspension revokes sessions | `src/lib/auth/session.ts`, `app/admin/actions.ts` |
| Input validation | zod schemas for every public form/API; admin inputs normalised and length-limited; parameterised SQL everywhere (postgres.js tagged templates) | `src/lib/validation.ts`, `src/lib/admin.ts` |
| Abuse | Per-IP rate limits (forms, sign-in, sign-up, reset, MFA, API); honeypot field | `src/lib/rate-limit.ts` |
| Uploads | Type detected from file bytes (not extension/MIME); size limits; random storage keys; path traversal refused; unpublished media hidden from the public | `src/lib/media/storage.ts`, media route |
| Payments | Stripe hosted Checkout (no card data here); webhook signature verification with 5-min tolerance; idempotent recording | `src/lib/stripe.ts`, webhook route |
| Privacy | Prayer requests: private by default, staff-only, 180-day retention filter, viewing is audited; testimony publication requires recorded consent (DB-enforced); data export and account deletion; consent records | migrations, community admin |
| Audit | Sign-ins (incl. failures), MFA, role/status changes, publishing, moderation, uploads, settings, exports, sample purge | `audit_logs` |
| Information leakage | No `X-Powered-By`; generic 404 for private media; no secrets in client bundles; noindex/robots until launch; `Cache-Control: no-store` on admin/account | proxy, config |
| Dependencies | Next 16.4.6 / React 19.3.1 / zod 4.6.7 — `npm audit --omit=dev` reported **0 vulnerabilities** at build time (2026-11-25) | `package.json` |

## Not yet done (required before launch)

- **Independent security test** (authenticated penetration test of admin, upload and payment flows) — not performed.
- **Distributed rate limiting** (Redis/Upstash or CDN rules) when running more than one instance.
- **WAF/DDoS** protection at the CDN (Cloudflare) and bot protection (e.g. Turnstile) on public forms if spam appears.
- **Malware scanning** of uploads (e.g. ClamAV in the worker) — files are type-checked but not scanned.
- **Email verification enforcement** for community submissions (currently optional).
- **Automated purge job** for expired prayer requests (they are hidden after 180 days; physical deletion should run on a schedule).
- **Backups/restore tests**, **error monitoring (Sentry)** and **alerting** — see OPERATIONS.md.
- **Secrets management** in the hosting platform (never `.env` files on servers; rotate `APP_SECRET` only with a TOTP re-enrolment plan).
- Review the **verify-email link** behaviour with corporate mail scanners (link is single-use on GET).

## Reporting

Security issues should be reported privately to the station's designated security contact (to be confirmed — see DECISIONS-NEEDED.md).
