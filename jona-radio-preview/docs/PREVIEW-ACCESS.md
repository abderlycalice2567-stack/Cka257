# Preview URL & Demo Access

> The preview must live on a **separate agency domain** over HTTPS — never on
> jonaradio.net or the owner's hosting. Keep it unindexed and access-restricted.

## Example preview URL (illustrative)

```
https://jona-radio-preview.example-agency.com
```

This is an example placeholder, not a live address. Set the real one in
`NEXT_PUBLIC_SITE_URL`.

## Deploying the preview (any Node/Next host)

1. `cp .env.example .env.local` and set:
   - `NEXT_PUBLIC_SITE_URL` = the preview URL
   - `NEXT_PUBLIC_STREAM_URL` = authorized HTTPS stream (or leave blank)
   - `PREVIEW_AUTH_ENABLED=true`, `PREVIEW_AUTH_USER`, `PREVIEW_AUTH_PASSWORD`
   - leave `NEXT_PUBLIC_ALLOW_INDEXING` unset/`false`
2. `npm ci && npm run build`
3. `npm start` (or deploy to Vercel/Netlify/a container; set the same env vars
   in the host's dashboard — **never commit secrets**).

On a static/serverless host, the middleware (CSP nonce, HSTS, noindex, Basic
Auth gate) runs at the edge automatically.

## Access during a live presentation

- Open the preview URL; the browser prompts for the Basic Auth credentials if
  `PREVIEW_AUTH_ENABLED=true`. Share them privately with attendees only.
- Start at **`/presentation`** for the guided walkthrough, then open the site.
- The persistent player works across pages; if no stream is authorized yet, it
  shows a clearly-labelled offline state (the demo still presents fully).

## Guardrails (section 11)

- No connection to jonaradio.net or the owner's infrastructure.
- Unindexed (`robots.txt` disallow-all + `noindex` headers) and access-gated.
- No real donations or sensitive submissions; no owner private data used.
- The banner on every page states it is an independent, unofficial proposal.
