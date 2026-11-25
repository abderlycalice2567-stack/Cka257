# Decisions and inputs needed from the station

Nothing below has been assumed in production configuration. Items marked ★ block launch.

## Identity & legal
- ★ Official domain name (proposed `thekingdomsoundradio.com`) and who owns the registrar/DNS accounts.
- ★ Final logo and brand assets (the current mark is a placeholder).
- ★ Legal entity, operating location and whether donations are tax-deductible (controls receipt wording).
- ★ Privacy policy, terms and accessibility statement text (templates provided; legal review recommended).
- ★ Music licensing arrangements for streaming, podcasts and downloads.
- Security contact for vulnerability reports.

## Broadcasting
- ★ Existing streaming provider (if any) and whether to move to a self-hosted AzuraCast VPS.
- Station time zone (assumed America/New_York) and broadcasting languages per program.
- ★ Initial weekly schedule, program list and descriptions.
- ★ Presenter names, titles, approved photos and biographies (current profiles are labelled placeholders).
- Studio equipment and remote-presenter setup.

## Distribution & accounts
- Existing Spotify/Apple Podcasts/YouTube/social accounts and feeds.
- ★ Accounts for: database (Supabase or other), app hosting, storage (R2/S3), email (Resend), payments (Stripe), uptime monitoring — registered to the station.

## Product choices
- Social sign-in (Google/Apple) — yes/no.
- Native mobile apps timeline (affects adding token-based API auth).
- Membership tiers / exclusive content — yes/no and pricing.
- Advertising acceptance policy and sponsor approval workflow.
- Whether testimonies may include audio/video uploads (needs storage + moderation capacity).
- Live chat / song requests / polls (needs moderation staffing).
- Default site language (currently English, with automatic detection).

## Capacity & budget
- Expected concurrent listeners (sizes the streaming server and bandwidth).
- Monthly infrastructure budget (the brief's ~US$150/month estimate excludes bandwidth spikes, licensing and payment fees).
- Development team capacity for the remaining phases.
