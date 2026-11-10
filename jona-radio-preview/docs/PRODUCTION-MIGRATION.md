# Production Migration & Deployment Plan

How this demo becomes a production site **on the owner's own infrastructure,
after authorization**. Nothing here is executed against the owner's systems.

## Architecture choice & trade-offs (F-09)

**Chosen for the demo: Next.js + TypeScript + Tailwind.** Honest trade-offs:

| | Next.js (this demo) | Keep WordPress (hardened) |
|---|---|---|
| Attack surface | Small, code-reviewed, few deps | Larger (core + plugins/themes) |
| Content editing | Needs a CMS layer (headless CMS or a small admin) | Familiar WP editor out of the box |
| Ongoing patching | npm dependency updates | Frequent WP core/plugin updates |
| Hosting | Node host / static+serverless (Vercel, Netlify, container) | PHP + MySQL (current Hostinger) |
| Owner self-service | Lower unless a CMS is added | Higher immediately |

> **We do not claim moving off WordPress removes all vulnerabilities.** It
> changes and shrinks the surface; discipline (updates, auth, backups,
> monitoring) still determines real security.

If the owner prefers staying on WordPress, apply the hardening checklist below
instead of migrating.

### Headless content option

For owner self-editing without WordPress's surface: pair this frontend with a
headless CMS (e.g. Payload, Sanity, Strapi) or keep WordPress purely as a
headless API behind the new frontend. The current `/admin` demo illustrates the
intended editing UX.

## Deployment (preview → production)

1. **Preview (now):** deploy to a *separate* agency domain, HTTPS, **unindexed**
   (`NEXT_PUBLIC_ALLOW_INDEXING` unset/false) and **access-gated**
   (`PREVIEW_AUTH_ENABLED=true`). Never the owner's domain/host.
2. **Content load:** replace demo placeholders with owner-supplied content;
   obtain written permission to use the live Zeno.fm stream (set
   `NEXT_PUBLIC_STREAM_URL`), or use a licensed source.
3. **Pre-launch checks:** `npm run build`, `lint`, `typecheck`; header/CSP review;
   Lighthouse; accessibility pass; form behaviour (validation, rate limit).
4. **DNS & email:** publish SPF/DKIM/DMARC (`EMAIL-DNS-CONFIG.md`) and CAA/DNSSEC
   (`DNS-SECURITY-PLAN.md`) under the owner's control. Prepare TLS on the target.
5. **Cutover:** stage under a subdomain, verify, then switch DNS with lowered
   TTLs and a rollback plan. HSTS `max-age` low at first, then raise;
   `includeSubDomains`/`preload` only once HTTPS is guaranteed everywhere.
6. **Post-launch:** enable monitoring, confirm backups, submit sitemap (once
   indexing is intended).

## CI/CD & code quality (security-by-design)

- Pipeline: install → `lint` → `typecheck` → `build` → deploy on green.
- `npm audit` / dependency scanning (e.g. Dependabot) on a schedule.
- Secrets only in the host's env store; none in the repo.
- Production error handling returns generic messages; no stack traces to users;
  logs exclude personal data and form contents.

## Operational readiness

- **Backups:** automated + periodic **restore tests** (a backup never restored
  is not a backup).
- **Monitoring:** uptime + **stream-health** check (Zeno.fm dependency), error
  alerting, a `/` health check.
- **Access:** MFA on all admin/hosting accounts; least-privilege roles; audit log.
- **Incident response:** documented contacts, steps, and a stream-outage fallback.

## WordPress hardening checklist (only if staying on WordPress — F-09)

- [ ] Supported WP core + PHP; remove unused plugins/themes
- [ ] Minimal, trusted plugins; keep Elementor/Blocksy/Fluent Forms updated
- [ ] Safe automatic security updates
- [ ] Least-privilege admin roles; unique strong passwords
- [ ] **MFA** on all logins; brute-force protection on `wp-login.php`
- [ ] Disable file editing (`DISALLOW_FILE_EDIT`), `WP_DEBUG=false` in prod
- [ ] Security headers at the server/LiteSpeed/`.htaccess` level (per `SECURITY.md`)
- [ ] Tested backups; staging environment; vulnerability-advisory monitoring
