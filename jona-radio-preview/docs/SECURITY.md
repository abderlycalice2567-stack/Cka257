# Security Design Notes

Security-by-design decisions in this demo, with rationale. Addresses F-01, F-02,
F-05, F-06, F-08 directly (see `FINDINGS-TO-FIXES.md` for the full map).

## HTTP response headers (F-01)

Set in two places:

- **Static, request-independent** headers in `next.config.mjs` → `headers()`:
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (camera/mic/geolocation/payment/usb all `()`; `autoplay=(self)`
  for the player), `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy`,
  `Cross-Origin-Resource-Policy`, `X-DNS-Prefetch-Control: off`.
- **Per-request** headers in `src/middleware.ts`: the CSP (nonce changes each
  request) and `Strict-Transport-Security: max-age=15552000`.

### Why HSTS has no `preload` / `includeSubDomains`

A speculative preview cannot guarantee HTTPS across every current and future
subdomain, and `preload` is effectively irreversible. We ship a conservative
180-day `max-age` only. For production on the owner's apex domain, once HTTPS is
confirmed everywhere, upgrade to `includeSubDomains` and consider `preload`.

## Content-Security-Policy (F-01, F-05, F-06)

Built in `src/lib/csp.ts`, emitted per request with a fresh nonce.

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';        ← clickjacking protection (supersedes XFO)
form-action 'self';
script-src 'self' 'nonce-…' 'strict-dynamic';   ← no 'unsafe-inline' for scripts
style-src 'self' 'unsafe-inline';                ← see note below
img-src 'self' data: blob:;
font-src 'self';                                  ← fonts are self-hosted
connect-src 'self' https://stream.zeno.fm https://api.zeno.fm [+ configured];
media-src 'self' blob: https://stream.zeno.fm [+ configured];
worker-src 'self' blob:; manifest-src 'self'; frame-src 'none';
upgrade-insecure-requests
```

Notes / honest limitations:

- **`style-src 'unsafe-inline'`** is retained because Next.js, Tailwind and
  `next/font` emit inline `<style>`/style attributes that cannot currently carry
  a nonce. Styles cannot execute script, so the risk is limited. This is a known
  ecosystem constraint, documented rather than hidden.
- **`'unsafe-eval'`** is added **only** in development (Next dev tooling needs
  it); it is absent in production.
- **Streaming origins** are added explicitly (the exact Zeno.fm hosts, plus any
  `NEXT_PUBLIC_STREAM_*` origins) instead of a broad `https:` wildcard.

## Technology disclosure (F-02)

`poweredByHeader: false`; no `generator` meta tag; no version query strings on
assets (Next content-hashes them); `productionBrowserSourceMaps: false`; generic
404. Remember: this is obscurity, **not** a substitute for patching.

## Third-party scripts & integrity (F-05)

- **Zero third-party JavaScript** in the application shell. Icons are inline SVG
  (`src/components/icons.tsx`); there is no analytics/tag-manager/font CDN at
  runtime.
- **Fonts are self-hosted** via `next/font` (downloaded at build, served from
  our origin) — no runtime request to Google Fonts.
- **SRI**: for any *static, versioned* third-party asset added later, attach an
  `integrity` hash. SRI is **unsuitable for dynamically-updated vendor scripts**
  (e.g. a translation widget whose file changes without a version change) because
  the hash would break on every silent update; for those, prefer removing them,
  self-hosting a pinned copy, or isolating them — and rely on the strict CSP.

## Insecure references & mixed content (F-06)

All resources are same-origin and HTTPS. `next.config` declares **no** remote
image patterns, so no off-origin image can slip in. CSP `upgrade-insecure-requests`
is a backstop. Canonical/OG URLs derive from `NEXT_PUBLIC_SITE_URL`.

## Forms (F-07)

Server-side `zod` validation is authoritative; client validation is a courtesy.
Honeypot field + per-IP in-memory rate limiting. Consent is required and errors
are accessible (`role="alert"`, `aria-describedby`). CSRF posture: same-origin
`form-action`, JSON body, no cross-site cookie auth. **Nothing is persisted or
transmitted** — message/intention text is never logged.

## Dependency concentration & resilience (F-08)

The only external runtime dependency is the audio stream. The player fails
gracefully: explicit offline/error states, a retry action, and best-effort
now-playing metadata that never blocks playback. Production monitoring
(uptime + stream health) is described in `PRODUCTION-MIGRATION.md`.

## Secrets & configuration

No secrets in the repo. All config is environment-based (`.env.example` documents
the variables; `.env*` is git-ignored). Preview credentials live in the host's
environment settings only.

## Preview exposure (section 11)

`middleware.ts` keeps the preview `noindex` (also `robots.ts` disallows all)
unless `NEXT_PUBLIC_ALLOW_INDEXING=true`, and can require HTTP Basic Auth
(`PREVIEW_AUTH_*`). Deploy only to a separate agency preview URL — never the
owner's infrastructure.
