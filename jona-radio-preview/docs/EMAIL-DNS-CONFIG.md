# Email Authentication Configuration (F-03)

> **Do not publish these records until the owner authorizes domain changes and
> each record is verified.** The values below are templates/examples — the real
> values depend on which mail services the station uses. Nothing here is active,
> and we do not claim spoofing protection is in place.

Goal: let receivers verify that mail claiming to be from `jonaradio.net` is
legitimate, reducing impersonation/phishing and improving deliverability.

## 1. Inventory first

List every system that sends mail *as* `@jonaradio.net`:

- Hosting/cPanel mailboxes (e.g. Hostinger mail)
- Transactional/form email (e.g. the contact form in production)
- Newsletter/marketing (e.g. Hostinger Reach, Mailchimp, Brevo…)

You can only write a correct SPF/DKIM policy once this list is complete.

## 2. SPF (TXT at the apex)

One — and only one — SPF record. Example if sending only via Hostinger:

```
jonaradio.net.  TXT  "v=spf1 include:_spf.hostinger.com -all"
```

- Add an `include:` for **each** authorized sender.
- `-all` (hard fail) once confident; start with `~all` (soft fail) during rollout.
- If the domain sends **no** mail at all: `"v=spf1 -all"`.

## 3. DKIM (per-sender, provided by each mail service)

Each sender gives a public key to publish, e.g.:

```
<selector>._domainkey.jonaradio.net.  TXT  "v=DKIM1; k=rsa; p=<public-key>"
```

Enable DKIM signing in each provider and publish its selector record. Use the
provider's own selector name (do not invent one).

## 4. DMARC (TXT at `_dmarc`)

Start in monitor mode, then tighten:

```
# Phase 1 — observe (no impact on delivery)
_dmarc.jonaradio.net.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@jonaradio.net; fo=1; adkim=s; aspf=s"

# Phase 2 — quarantine a fraction
_dmarc.jonaradio.net.  TXT  "v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@jonaradio.net"

# Phase 3 — enforce
_dmarc.jonaradio.net.  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@jonaradio.net"
```

Only reach `p=reject` after aggregate reports show all legitimate mail passes
SPF and/or DKIM with alignment.

## 5. Form-notification handling (production)

- Send contact/prayer notifications via an **authenticated** service (SMTP auth
  or an API like Postmark/Brevo/SES) from an aligned domain — never unauthenticated `mail()`.
- Keep DKIM aligned with the From domain so DMARC passes.
- Store secrets in environment variables / a secrets manager, never in code.

## Deployment checklist

- [ ] Sender inventory complete and signed off by the owner
- [ ] SPF published (single record, all senders, `~all` → `-all`)
- [ ] DKIM enabled at every provider and selector(s) published
- [ ] DMARC `p=none` with `rua` mailbox monitored
- [ ] Aggregate reports reviewed for ≥ 1–2 weeks
- [ ] Move DMARC to `quarantine`, then `reject`
- [ ] Re-test with a mail-auth checker; document final records & rollback notes
