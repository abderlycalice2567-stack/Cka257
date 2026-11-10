# Jona Radio — Redesign Proposal (Demo)

> **Independent proof-of-concept. NOT the official Jona Radio website.**
> Not affiliated with, endorsed by, or connected to Jona Radio (jonaradio.net).
> Built in an isolated development environment. No connection is made to the
> owner's domain, hosting, WordPress, or any private system.

A modern, premium redesign demonstration for the Christian internet-radio
station **Jona Radio**, built with **Next.js 14 (App Router) · TypeScript ·
Tailwind CSS**. Primary language: **French**.

It is a *working* demonstration (real pages, a real persistent audio player,
real server-side form validation, security headers), intended to be shown to
the station owner during a sales meeting — see the guided **`/presentation`**
route.

---

## Quick start

```bash
cp .env.example .env.local      # configure (see below)
npm install
npm run dev                     # http://localhost:3000
```

Production-like:

```bash
npm run build && npm start
```

Checks:

```bash
npm run lint        # eslint (next/core-web-vitals)
npm run typecheck   # tsc --noEmit
```

## Configuration (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public base URL of the **preview** (example only, not the official domain). |
| `NEXT_PUBLIC_STREAM_URL` | HTTPS stream for the demo player. The station's public Zeno.fm mount may be used **only if permitted**, else a licensed demo source, else leave blank (player shows a clearly-labelled offline state). |
| `NEXT_PUBLIC_STREAM_METADATA_URL` | Optional HTTPS now-playing (SSE/JSON) endpoint. |
| `PREVIEW_AUTH_ENABLED` / `PREVIEW_AUTH_USER` / `PREVIEW_AUTH_PASSWORD` | HTTP Basic Auth gate for the private preview (section 11). Set in host env, never in code. |
| `NEXT_PUBLIC_ALLOW_INDEXING` | Leave `false` to keep the speculative preview out of search engines. |

The player **never** reports "live" unless the browser `<audio>` element
actually connects to a stream.

## Routes

Public site: `/` · `/ecouter-en-direct` · `/nos-emissions` (+ `/[slug]`) ·
`/a-propos` · `/actualites` (+ `/[slug]`) · `/contact` ·
`/demandes-de-priere` · `/soutenir` · `/confidentialite` · `/mentions-legales`

Other: `/presentation` (guided sales mode) · `/admin` (simulated CMS, synthetic
data) · demo APIs `/api/contact`, `/api/prayer`.

## Project layout

```
src/
  app/                 # App Router pages, API route handlers, robots, sitemap
  components/
    admin/             # simulated CMS dashboard
    brand/ layout/     # logo, header, footer, demo banner
    forms/             # contact / prayer / donation (demo) + shared fields
    player/            # persistent audio player (context, bar, panels)
    ui/                # section, cards, reveal, page header, notices
  lib/                 # site config, demo content, validation, CSP, rate-limit
  middleware.ts        # per-request CSP nonce, HSTS, noindex, preview gate
docs/                  # security matrix, migration, DNS/email, estimate, testing
```

## Security & honesty posture

- Security-by-design: strict headers + **per-request nonce CSP** (no
  `unsafe-inline` for scripts), self-hosted fonts, no unnecessary third parties,
  server-validated forms, **no real data collected**, no secrets in code.
- All placeholder content is clearly labelled **démo / à confirmer**. No
  invented testimonials, audience numbers, schedules, biographies or
  affiliations. No legal/privacy compliance is claimed.
- See **[`docs/FINDINGS-TO-FIXES.md`](docs/FINDINGS-TO-FIXES.md)** for how the
  demo maps to assessment findings F-01…F-09, and the other `docs/` files for
  production migration, DNS/email config, estimate, and testing evidence.

## Deployment (preview)

Deploy to a **separate** HTTPS preview URL (e.g.
`jona-radio-preview.example-agency.com`) — never the owner's infrastructure.
Keep it unindexed and access-restricted. See
[`docs/PRODUCTION-MIGRATION.md`](docs/PRODUCTION-MIGRATION.md).
