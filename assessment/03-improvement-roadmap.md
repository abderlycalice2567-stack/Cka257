# Document C — Prioritized Security Improvement Roadmap

Based on the confirmed, passive observations in Document B. All items are low-risk hardening — **none is an emergency.** Effort and required access are noted so the owner knows what we'd need.

## Immediate — 0–7 days (quick wins, low effort)

| # | Action | Addresses | Effort | Owner access needed |
|---|--------|-----------|--------|---------------------|
| 1 | Add core security headers (HSTS with modest max-age, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy`) via LiteSpeed/`.htaccess` or a header plugin | F-01 | 1–2 h | Hosting panel / WP admin |
| 2 | Publish **SPF + DMARC** DNS records (restrictive if little/no mail is sent) | F-03 | 1 h | DNS provider |
| 3 | Suppress `X-Powered-By` and the `generator` meta | F-02 | 30 min | Hosting / WP |
| 4 | Confirm & enable contact-form anti-spam (CAPTCHA/honeypot) | F-07 | 30 min | WP admin |

## Short-term — 8–30 days (hardening + hygiene)

| # | Action | Addresses | Effort | Access |
|---|--------|-----------|--------|--------|
| 5 | Design and deploy a real **Content-Security-Policy** (test in report-only mode first) | F-01 | 0.5–1 day | WP admin |
| 6 | Add a **CAA** record; evaluate **DNSSEC** | F-04 | 1–2 h | DNS provider |
| 7 | Fix stray `http://` config references; force HTTPS site URLs | F-06 | 30 min | WP admin |
| 8 | Full inventory + update of WordPress core, themes, plugins; remove anything unused; enable safe auto-updates | F-09 | 0.5 day | WP admin |
| 9 | Apply **SRI** to stable third-party scripts; self-host Google Fonts | F-05, F-08 | 0.5 day | WP admin |
| 10 | Confirm **MFA on all admin accounts** and review admin user list / password strength | (ops) | 1–2 h | WP admin |

## Medium-term — 31–90 days (resilience & assurance)

| # | Action | Benefit | Effort | Access |
|---|--------|---------|--------|--------|
| 11 | Verify a **tested backup & restore** routine (not just "backups exist") | Recovery from hack/error | 0.5–1 day | Hosting / WP |
| 12 | Add a **WAF / security plugin** + brute-force protection on `wp-login.php` | Blocks common automated attacks | 0.5 day | Hosting / WP |
| 13 | Enable **logging & monitoring** (login attempts, file-change detection, uptime/stream monitor) | Early detection | 0.5–1 day | Hosting / WP |
| 14 | Document a lightweight **incident-response & stream-outage plan** (incl. Zeno.fm fallback) | Faster recovery | 0.5 day | Owner input |
| 15 | Conduct an **authorized** external + light web-app assessment (Document F) to validate F-09 and close the passive-visibility gap | Confirms real exposure | Scoped engagement | Written authorization |

## Verification targets (re-check after remediation)
- Security-header presence (HSTS/CSP/etc.).
- SPF/DMARC/CAA resolve correctly; DMARC not `p=none` long-term.
- `X-Powered-By`/`generator` no longer disclosed.
- No `http://` resource loads; CSP not in report-only.
