# Staff manual

Sign in at `/en/sign-in` and open **/admin**. The first time, you'll set up two-step verification: open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy), choose *Enter a setup key*, type the key shown, then enter the 6-digit code. After that, every new sign-in asks for a code. Lost your phone? Ask a Super Administrator to **Reset 2-step** in *Users & roles*.

You only see the sections your role allows.

## Everyone with admin access
- **Dashboard** — stream status, listeners (when AzuraCast is connected), subscribers, items waiting for review, and setup alerts. Numbers are always real; "—" means "not available yet".
- **Launch readiness** — what's done and what still needs a person to confirm.

## Program Director
- **Programs** — create a program, write its title/summary/description in English (French and Kreyòl optional but recommended), pick a category, languages, presenters and cover art. Tick *Publish a podcast RSS feed* to get a feed URL for Apple/Spotify.
- **Schedule** — add a recurring rule (program, days, start time in station time, duration). The system refuses overlaps unless you tick *Allow overlap*. Upcoming broadcasts are generated three weeks ahead. To change a single airing, **Cancel** it (optionally with a reason shown to listeners) or add a **Special broadcast**. Edited airings are never overwritten by later rule changes.
- **Presenters** — publish only names, photos and biographies the presenter approved.

## Producer / Editor — episodes
1. **Episodes & media → New episode / upload**: choose the program, title, description, language, scripture references, topics, and upload the audio (MP3, M4A, OGG or WAV, up to 95 MB). Add chapters as lines like `12:30 Interview begins`, and the transcript if you have one.
2. The episode starts as **awaiting review** and is **private** — not on the site, not in podcast feeds.
3. An **Editor** reviews it, ticks the rights confirmation (music licences, guest consent, privacy) and clicks **→ published**. Publishing is refused without that confirmation.
4. To take something down, move it to **archived**.

## Editor — content
- **Content → Articles** (one per language), **Devotionals** (per day and language; use public-domain or licensed Bible text and name the translation), **Events** (with optional registration and capacity), **Pages** (About, Mission, Leadership, FAQ, Privacy, Terms, Accessibility). Pages marked *template* still need review — legal pages should be checked by the station's counsel.
- **Homepage** — show/hide and reorder homepage sections.

## Moderator / Prayer team
- **Community** — testimonies can only be approved if the person gave publication consent. Contact messages can be marked read or archived.
- Prayer requests: **private** requests are never shown publicly. Moderators with full prayer access can assign a request to a prayer team member and approve public (anonymous/first-name) requests for the prayer wall. Prayer team members see only the requests assigned to them and can mark them *answered*. Viewing the list is recorded in the audit log.

## Finance Manager
- **Finance** — donations recorded from Stripe, campaigns, sponsorship inquiries, CSV export. Card details never reach this system.

## Station Director / Super Administrator
- **Broadcasting** — stream URLs and the AzuraCast connection (see BROADCASTING-SETUP.md), station name, time zone, tagline.
- **Integrations** — paste the public URL of each platform (Spotify show, Apple Podcasts show, YouTube channel, TuneIn listing…), enable it, test the link yourself, then click **I tested it**. Only tested integrations appear on the site.
- **Users & roles** — add/remove roles, suspend accounts, reset 2-step. Role changes sign the person out so new access applies immediately.
- **Audit log** — who did what and when.

## Presenter quick guide
- You receive streamer credentials from the station (AzuraCast). Connect your broadcasting software to the server/port/mount given to you, using your own username and password — never share them.
- If you disconnect, AutoDJ/fallback continues automatically.
- Your profile on the website is edited by the Program Director; send them your approved photo and bio.
