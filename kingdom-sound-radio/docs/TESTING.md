# Testing

## Suites

| Suite | Command | Covers |
|---|---|---|
| Unit + DB integration (Vitest) | `npm test` | TOTP against RFC 6238 vectors, drift and replay; secret encryption/tamper detection; scrypt; tokens; permissions; Stripe signature verification; CSP; rate limiting; i18n key coverage (FR/HT vs EN); locale negotiation; RSS/ICS output; Markdown injection safety; form validation; slugs; **schedule expansion across DST in PostgreSQL**; DB-enforced rules (publish needs rights review, testimony approval needs consent, HTTPS-only streams, idempotent donations) |
| End-to-end (Playwright, real browser + server + DB) | `BASE_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run test:e2e` | 29 public pages × 3 languages; 404s; locale redirects; security headers and rotating nonce; noindex/robots; honest radio status; schedule API and ICS; RSS; pagination; HTTP Range; traversal refusal; auth/CSRF on APIs; webhook signature refusal; no console/CSP errors; live player "not configured" state; **episode playback continues across navigation**; contact and prayer forms; sign-up, favorites, dashboard, data export; subscriber blocked from admin; **admin forced through TOTP**; audio upload → private → publish refused without rights → publish → public media → RSS; audit log |
| Static | `npm run lint`, `npm run typecheck` | ESLint (Next core-web-vitals, TypeScript, React hooks rules), strict TypeScript |

## Latest results — 2026-11-25 (development container, Node 22, PostgreSQL 16, Next 16.4.6)

```
npm run lint        → no problems
npm run typecheck   → exit 0
npm run build       → compiled successfully (all routes)
npm test            → 3 files, 37 tests passed
npm run test:e2e    → 46 passed, 0 failed
npm audit --omit=dev → found 0 vulnerabilities
```

Two real defects were found by the end-to-end run and fixed before these results: episodes did not start when `preload="none"` (metadata never loaded before `play()`), and an admin selector issue in the test itself.

## Not yet performed (required before launch)

- Lighthouse / Core Web Vitals on production infrastructure (targets: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 at p75).
- WCAG 2.2 AA audit with screen readers (VoiceOver, NVDA) and keyboard-only pass.
- Real-device testing (iOS Safari, Android Chrome), PWA install, lock-screen controls.
- Streaming load test against the AzuraCast server.
- Payment flow with Stripe test keys, then a live test donation and refund.
- Email delivery (verification, reset) through the real provider.
- Podcast feed validation in a feed validator and Apple/Spotify submission.
- Independent security test.
- Backup restore test.
