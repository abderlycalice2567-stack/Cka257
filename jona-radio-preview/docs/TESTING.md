# Testing & Validation Evidence

Commands and results captured on **2026-11-10** in the development environment
(Next.js 14.2.35, Node 20). Re-runnable with `npm run build`, `npm run lint`,
`npm run typecheck`, and curl against `npm start`.

## Automated checks

| Check | Command | Result |
|-------|---------|--------|
| Production build | `npm run build` | ✓ Compiled successfully; 25 routes generated |
| Lint | `npm run lint` | ✓ No ESLint warnings or errors |
| Types | `npm run typecheck` | ✓ `tsc --noEmit` exit 0 |

First-load JS ≈ 87–104 kB per route (lean; no third-party runtime JS).

## Security headers (live, `GET /`)

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), autoplay=(self), camera=(), display-capture=(),
  encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(),
  microphone=(), payment=(), usb=()
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=15552000
X-Robots-Tag: noindex, nofollow, noarchive
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none';
  frame-ancestors 'none'; form-action 'self';
  script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:; font-src 'self';
  connect-src 'self' https://stream.zeno.fm https://api.zeno.fm;
  media-src 'self' blob: https://stream.zeno.fm https://api.zeno.fm;
  worker-src 'self' blob:; manifest-src 'self'; frame-src 'none';
  upgrade-insecure-requests
```

- **`X-Powered-By`: absent** ✓ (F-02)
- **Per-request nonce rotates** ✓ — two requests returned different
  `nonce-…` values.
- `robots.txt` = `Disallow: /` by default ✓; `/admin` carries `noindex,nofollow`.

## Demo forms (F-07) — live `POST`

| Case | Request | Result |
|------|---------|--------|
| Valid contact | well-formed + `consent:true` | `200 {ok:true,demo:true}` |
| Invalid | short message, `consent:false`, bad email | `422` with field errors |
| Honeypot filled | `company:"evilcorp"` | `200 {ok:true}` and **dropped silently** |
| Valid prayer | well-formed | `200 {ok:true,demo:true}` |
| Rate limit | 6 rapid POSTs | `200 200 200 200 429 429` (limit = 5/min) |

No data is persisted or logged in any case.

## Routes smoke test

All public routes + `/admin` returned **200**; `/presentation` returned 200
after rebuild (it 404'd once against a stale build predating the route);
unknown program/news slugs correctly returned **404**.

## Player honesty

With **no** `NEXT_PUBLIC_STREAM_URL`, the UI shows **"Démo hors ligne"** and the
controls are disabled — the player never claims "En direct" without a real
connection. With a configured HTTPS stream, "En direct" appears only on the
browser `playing` event.

## Not automated here (recommended before a live demo)

- **Lighthouse** (Performance/Accessibility/Best-Practices/SEO) in a
  production-like deploy — targets are 90+/95+/95+/90+ (targets, not guarantees).
- Cross-device manual pass (iOS Safari, Android Chrome, tablet, desktop).
- Screen-reader pass (VoiceOver/NVDA) on player and forms.
- CSP regression check after adding any new asset/integration.
