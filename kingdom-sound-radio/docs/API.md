# API reference (v1)

Base path: `/api/v1`. JSON responses. Errors use `{ "error": { "code", "message", "details?" } }` with appropriate status codes (400, 401, 403, 404, 405, 422, 429, 503). Public endpoints are rate-limited per IP (120/min by default; search 60/min; calendar 30/min). A machine-readable description is in [api/openapi.yaml](api/openapi.yaml).

Authenticated endpoints use the website session cookie and require a same-origin `Origin` header for writes (CSRF defence). **Token authentication for native mobile apps is not implemented yet** — see DECISIONS-NEEDED.

## Public

| Method | Path | Notes |
|---|---|---|
| GET | `/radio/status` | Stream endpoints + engine health (`online` is `null` when no engine is connected — never guessed) |
| GET | `/radio/now-playing?locale=` | Current program from the schedule, next program, engine track/listeners if available |
| GET | `/programs?category=&language=&featured=true` | Published programs |
| GET | `/programs/{slug}` | Program, recurring schedule, next airing, recent episodes |
| GET | `/schedule?from=&to=` | Occurrences (UTC) in a window ≤14 days, plus station `timezone` |
| GET | `/schedule/ics?program=&category=` | iCalendar download (next 3 weeks) |
| GET | `/episodes?q=&program=&category=&language=&presenter=&page=&pageSize=` | Published episodes, full-text search, pagination |
| GET | `/episodes/{id}` | Episode + chapters |
| GET | `/presenters` · `/presenters/{slug}` | Published presenters (+ their programs) |
| GET | `/categories` | Program categories |
| GET | `/articles?locale=` · `/devotionals?locale=` · `/events` | Editorial content |
| GET | `/search?q=` | Episode search |
| GET | `/platforms` | Only integrations staff enabled **and** verified |

Feeds: `GET /feeds/podcasts.xml`, `GET /feeds/podcasts/{program}.xml` (RSS 2.0 + iTunes + Podcasting 2.0 namespaces; only published, rights-confirmed episodes with audio).

## Authenticated (subscriber)

| Method | Path | Notes |
|---|---|---|
| GET / PATCH | `/account` | Profile; PATCH `{display_name, locale}` |
| GET | `/account/export` | Personal data export (JSON download) |
| GET / POST | `/favorites` | POST `{episodeId}` |
| DELETE | `/favorites/{episodeId}` | 204 |
| GET / POST | `/listening/progress` | POST `{episodeId, position, completed}`; GET `?episodeId=` |
| GET / POST | `/listening/history` | POST `{kind: "live"|"episode", episodeId?}` |

Follows, reminders, notification preferences, prayer requests, testimonies, event registration, newsletter and checkout are implemented as **server actions** used by the website (see `src/app/[locale]/actions.ts`). Equivalent JSON endpoints for native apps are listed as next steps.

## Staff

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/donations.csv` | `finance.view` (+ completed 2-step); spreadsheet-injection-safe |

## Webhooks

| Method | Path | Verification |
|---|---|---|
| POST | `/webhooks/payments` | Stripe `Stripe-Signature` (HMAC-SHA256, 5-min tolerance); idempotent by Stripe object id |
| POST | `/webhooks/radio` | `X-Webhook-Token` shared secret (`RADIO_WEBHOOK_SECRET`); records engine events in the audit log |
