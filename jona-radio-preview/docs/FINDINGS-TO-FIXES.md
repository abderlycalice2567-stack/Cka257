# Findings-to-Fixes Matrix (F-01 … F-09)

How each assessment finding is addressed in this demonstration. Each row states
what is **Implemented** in the demo, what is **Planned** (design/doc only), and
what is **Owner-dependent** (requires the owner's domain/hosting access and
cannot be done in a preview).

Status legend: ✅ implemented in demo · 🟡 partially / demonstrated · 📝 documented/planned · 🔑 owner-dependent

| # | Finding | In this demo | Status | Where |
|---|---------|--------------|--------|-------|
| **F-01** | Missing security headers | HSTS (`max-age`, no preload/includeSubDomains by default), **nonce-based CSP** with `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP. CSP tuned so the radio player (Zeno.fm `connect-src`/`media-src`) and fonts still work. | ✅ | `src/middleware.ts`, `src/lib/csp.ts`, `next.config.mjs` |
| **F-02** | Technology / version disclosure | `poweredByHeader:false` removes `X-Powered-By`; no `generator` meta; no framework version strings exposed; production source maps off; generic error pages. | ✅ | `next.config.mjs`, `src/app/not-found.tsx` |
| **F-03** | Email authentication (SPF/DKIM/DMARC) | Cannot touch DNS in a preview. Full example records + deployment checklist provided. Demo forms send no email. | 📝 🔑 | [`EMAIL-DNS-CONFIG.md`](EMAIL-DNS-CONFIG.md) |
| **F-04** | DNSSEC & CAA | Owner-controlled DNS. Eligibility, rollout, validation & rollback plan + example CAA provided. | 📝 🔑 | [`DNS-SECURITY-PLAN.md`](DNS-SECURITY-PLAN.md) |
| **F-05** | Third-party script integrity | Dependencies bundled & version-controlled; **fonts self-hosted** (no runtime Google Fonts); **zero third-party JS** in the app shell; icons inline; strict `script-src`. SRI guidance (and why it's unsuitable for dynamic vendor scripts) documented. | ✅ 📝 | `src/app/layout.tsx`, `src/components/icons.tsx`, [`SECURITY.md`](SECURITY.md) |
| **F-06** | Insecure HTTP references | All assets same-origin/HTTPS; `next.config` allows no remote image hosts; CSP `upgrade-insecure-requests`; no `http://` strings; canonical URLs via `metadataBase`. | ✅ | `next.config.mjs`, `src/lib/csp.ts`, `src/app/layout.tsx` |
| **F-07** | Contact form & spam protection | **Server-side validation** (zod), honeypot, in-memory rate limiting, consent + accessible errors, CSRF posture (same-origin `form-action`, JSON+same-site). **No data stored or sent.** CAPTCHA/Turnstile documented as production step. | ✅ 📝 | `src/app/api/*`, `src/lib/validation.ts`, `src/lib/rate-limit.ts`, `src/components/forms/*` |
| **F-08** | Third-party dependency concentration | Minimal deps; streaming is the only external runtime dependency, with graceful fallback (offline state, retry, non-blocking metadata). Monitoring readiness documented. | ✅ 📝 | `src/components/player/*`, [`SECURITY.md`](SECURITY.md) |
| **F-09** | WordPress / plugin patch surface | Chose **Next.js/TypeScript** (smaller, controlled surface) and explain the trade-offs honestly (no claim that leaving WordPress removes all risk). WordPress hardening checklist included for the alternative path. | ✅ 📝 | [`PRODUCTION-MIGRATION.md`](PRODUCTION-MIGRATION.md) |

## Important honesty notes

- Missing headers / old-looking versions on the current site are **hardening
  opportunities**, not confirmed exploitable vulnerabilities. This demo does not
  claim the live site is compromised.
- The odd `WordPress 7.1.4` generator value observed on the live site is **not**
  treated as proof of a real installed version.
- Obscuring versions (F-02) is **not** a substitute for patching (F-09).
- HSTS here intentionally omits `preload`/`includeSubDomains` because a preview
  cannot commit the whole domain tree; see `SECURITY.md`.

## What still requires the owner (🔑)

SPF/DKIM/DMARC publication · DNSSEC/CAA · backups & monitoring on real hosting ·
MFA on admin accounts · patching any existing WordPress · authorization to use
the station's live stream · a signed scope for any active security testing.
