# Document B — Technical External Security Assessment

**Target:** jonaradio.net (`www` → apex 301) · **Observation date:** 2026-11-10 UTC
**Method:** Passive / non-intrusive only (see `00-README.md`). All findings below were obtained from ordinary HTTP(S) requests, public DNS, `robots.txt`, the XML sitemap, and the public Certificate Transparency log.

---

## 1. Technology & infrastructure overview (Confirmed unless noted)

| Item | Observation | Source |
|------|-------------|--------|
| Purpose | French-language ("fr-FR") Christian internet-radio station; pages: home, À propos, Contact, Programme, Événements, shows/blog | HTML, sitemap |
| CMS | WordPress | `generator` meta, `wp-json`, `wp-content` paths, `x-redirect-by: WordPress` |
| Declared WP version | `WordPress 7.1.4` — **does not match any real WordPress release** (WP is on the 6.x line). Likely a spoofed/plugin-altered `generator` value; **true version undetermined** | `generator` meta |
| Page builder | Elementor (asset versions 3.24.0 / 3.24.3 seen) + Header-Footer-Elementor 2.9.6 | `?ver=` asset strings |
| Theme | Blocksy 2.1.58 + Blocksy Companion 2.1.61 | asset paths |
| Forms | Fluent Forms 6.2.17 (contact form id 3, POST, nonce-protected) | `/contact/` HTML |
| Radio plugin | `radio-station` 1.0.6 | asset paths, `wp-json/radio/` |
| Email marketing | Hostinger Reach (`cdn-reach.hostinger.com/js/embed.js`) | script tag |
| Translation | GTranslate widget (`cdn.gtranslate.net`) | script tag |
| JS libraries | jQuery 3.7.1, jquery-migrate 3.4.1, moment.js 2.30.1 | `?ver=` strings |
| Runtime | PHP 8.3.36 (disclosed) | `x-powered-by` header |
| Web server / cache | LiteSpeed (`x-litespeed-cache: hit/miss`) | headers |
| Hosting | Hostinger (`platform: hostinger`, `panel: hpanel`) | headers |
| CDN / edge | Hostinger hCDN (`server: hcdn`, `x-hcdn-*`, `www...cdn.hstgr.net`) | headers, DNS |
| Protocols | HTTP/2 and HTTP/3 (`alt-svc: h3`) | headers |

**Streaming architecture:** Custom lightweight JavaScript `<audio>` player (no heavy third-party iframe player — a positive). Live stream: `https://stream.zeno.fm/xm1ez6cnnrhvv`; now-playing metadata: `https://api.zeno.fm/mounts/metadata/subscribe/xm1ez6cnnrhvv`. **Both over HTTPS (Confirmed).**

**DNS (Confirmed):** A `213.210.57.213`, `147.93.77.39`; AAAA present (IPv6 enabled); `www` is a CNAME to `www.jonaradio.net.cdn.hstgr.net`; nameservers `*.dns-parking.com` (Hostinger). **No MX, no apex SPF/TXT, no `_dmarc` record, no CAA record, DNSSEC not enabled (AD=false).**

**Third-party origins referenced:** zeno.fm, cdn.gtranslate.net, cdn-reach.hostinger.com, fonts.googleapis.com, plus outbound social links (youtube, facebook, tiktok) and a developer-credit link to `digitalturb.com`.

---

## 2. Findings

Severity is calibrated conservatively: **a missing header or an old-looking version is not, by itself, rated High/Critical.**

### F-01 · HTTP security response headers largely absent
- **Component:** All HTTP responses (site-wide).
- **Evidence (2026-11-10):** Only `Content-Security-Policy: upgrade-insecure-requests` is returned. **Absent:** `Strict-Transport-Security` (HSTS), a real `Content-Security-Policy` (no `default-src`/`script-src` etc.), `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`.
- **Verification:** Confirmed.
- **Implication:** Reduced defense-in-depth. HSTS absence leaves a theoretical SSL-stripping window on first visit (partly mitigated: the site already redirects to HTTPS and sends `upgrade-insecure-requests`). No CSP means that *if* a script-injection flaw existed elsewhere, there is no second line of defense. Missing `X-Frame-Options` permits framing (clickjacking surface).
- **Business impact:** Low in isolation; meaningful as cumulative hardening. These do **not** indicate a current breach.
- **Severity:** **Low** (HSTS/CSP: Low–Medium as defense-in-depth).
- **Remediation:** Add headers at LiteSpeed/`.htaccess` or via a WordPress header plugin: `Strict-Transport-Security: max-age=15552000; includeSubDomains` (start with a shorter max-age), a scoped `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `X-Frame-Options: SAMEORIGIN`.
- **Complexity:** Low. **Further authorized testing required:** No.

### F-02 · Technology / version information disclosure
- **Component:** Response headers + HTML.
- **Evidence:** `X-Powered-By: PHP/8.3.36`; `generator` meta exposing (spoofed) WP + Elementor versions; plugin/theme versions leaked via `?ver=` query strings (Elementor, Blocksy 2.1.58, Fluent Forms 6.2.17, radio-station 1.0.6, etc.).
- **Verification:** Confirmed.
- **Implication:** Aids an attacker's fingerprinting/version-matching. The spoofed `WordPress 7.1.4` value partially obscures the core version, but plugin versions remain clearly enumerable.
- **Severity:** **Informational / Low.**
- **Remediation:** Suppress `X-Powered-By` (`expose_php = Off` / server header removal), remove the `generator` meta, and strip/obfuscate `?ver=` where practical. (Hardening, not a vulnerability.)
- **Complexity:** Low. **Further testing required:** No.

### F-03 · No email-authentication DNS records (SPF / DMARC / DKIM)
- **Component:** DNS zone for `jonaradio.net`.
- **Evidence:** No MX record; apex TXT empty (no `v=spf1`); `_dmarc.jonaradio.net` returns no TXT.
- **Verification:** Confirmed (passive DNS).
- **Implication:** The domain is more easily spoofable in phishing/impersonation emails ("from" jonaradio.net). Even for a domain that sends little mail, a `-all` SPF and a `p=reject` DMARC materially reduce abuse.
- **Business impact:** Brand/trust and deliverability risk if the station ever emails listeners; spoofing risk regardless.
- **Severity:** **Low–Medium.**
- **Remediation:** Publish SPF (restrictive if no mail is sent, e.g. `v=spf1 -all`), a DMARC record (`v=DMARC1; p=reject; rua=...`), and DKIM if/when sending mail.
- **Complexity:** Low. **Further testing required:** No.

### F-04 · DNSSEC and CAA not enabled
- **Component:** DNS zone.
- **Evidence:** `AD=false` / no DS record; no CAA record.
- **Verification:** Confirmed.
- **Implication:** No DNSSEC = DNS responses are not cryptographically validated. No CAA = no restriction on which CAs may issue certificates for the domain.
- **Severity:** **Low / Informational.**
- **Remediation:** Enable DNSSEC at the DNS provider; add a CAA record pinning the chosen CA (e.g. Let's Encrypt).
- **Complexity:** Low–Medium (provider-dependent). **Further testing required:** No.

### F-05 · No Subresource Integrity (SRI) on third-party scripts
- **Component:** External `<script>`/stylesheet includes (gtranslate, hostinger-reach, Google Fonts).
- **Evidence:** `integrity=` attribute count = 0 across home and contact pages.
- **Verification:** Confirmed.
- **Implication:** If a third-party CDN were compromised, altered script would execute unchecked (supply-chain surface). Note: SRI is not always feasible for frequently-updated vendor scripts.
- **Severity:** **Low.**
- **Remediation:** Apply SRI hashes where the vendor supports stable versioned URLs; minimize non-essential third-party scripts.
- **Complexity:** Low–Medium. **Further testing required:** No.

### F-06 · Minor mixed-content configuration string
- **Component:** Elementor JS config.
- **Evidence:** `uploadUrl":"http://jonaradio.net/wp-content/uploads"` embedded in page config (an `http://` string), while page resources otherwise load over HTTPS.
- **Verification:** Confirmed (string present). Actual insecure load mitigated by `upgrade-insecure-requests`.
- **Severity:** **Informational.**
- **Remediation:** Set WordPress site/home URL and Elementor base to `https://`; run a search-replace for stray `http://` references.
- **Complexity:** Low. **Further testing required:** No.

### F-07 · Public contact form without visible anti-automation
- **Component:** `/contact/` (Fluent Forms id 3).
- **Evidence:** Form present with a Fluent Forms nonce; **no visible CAPTCHA/Turnstile/hCaptcha** markup detected.
- **Verification:** Confirmed (absence of visible widget); server-side spam controls (e.g. honeypot/Akismet) **cannot be confirmed passively**.
- **Implication:** Potential spam/abuse vector (not an injection finding). A nonce is CSRF hygiene, not anti-spam.
- **Severity:** **Low / Informational.**
- **Remediation:** Enable Fluent Forms' built-in CAPTCHA/honeypot or Cloudflare Turnstile; confirm rate-limiting.
- **Complexity:** Low. **Further testing required:** Light (owner-confirmable).

### F-08 · Third-party dependency concentration (availability / privacy)
- **Component:** Zeno.fm (stream), GTranslate, Hostinger Reach, Google Fonts.
- **Evidence:** Each loaded from its own external origin.
- **Implication:** Stream availability is bound to Zeno.fm uptime; each third party is an availability, privacy, and supply-chain consideration. This is normal for a small broadcaster, noted for completeness.
- **Severity:** **Informational.**
- **Remediation:** Document the dependencies, confirm a fallback/stream-status plan, consider self-hosting fonts.
- **Complexity:** Low–Medium. **Further testing required:** No.

### F-09 · WordPress + multiple plugins = patch-management surface
- **Component:** WordPress core, Elementor, Blocksy (+companion), Fluent Forms, radio-station, Header-Footer-Elementor, Hostinger Reach.
- **Evidence:** Plugin/theme set enumerable from asset paths; several versions appear recent (jQuery 3.7.1, Elementor 3.24.x, PHP 8.3). **We cannot confirm from outside whether every component is fully patched**, and we do **not** assert any specific CVE applies.
- **Implication:** The realistic primary risk for a site like this is an unpatched plugin/theme or core flaw, exploited after public disclosure.
- **Severity:** **Informational** (passively) → requires authorized verification to rate.
- **Remediation:** Keep core/plugins/themes current; remove unused plugins; subscribe to vulnerability advisories; enable auto-updates where safe.
- **Complexity:** Ongoing/operational. **Further testing required:** Yes (authorized, see Document F).

---

## 3. Positive observations (confirmed strengths)

- **Valid TLS certificate** (Let's Encrypt), issued 2026-10-06, valid to 2027-01-04, covering `jonaradio.net` + `www` (public CT log). Short-lived/auto-renewing lifecycle is good practice. *(Note: live chain depth/ciphers could not be independently verified from this vantage; see limitations.)*
- **HTTPS enforced:** `www` → apex `301`; `Content-Security-Policy: upgrade-insecure-requests` present; no loaded `http://` resources observed (one config string aside, F-06).
- **Secure streaming** over HTTPS (Zeno.fm).
- **CDN / LiteSpeed cache** in front (performance + a degree of volumetric resilience).
- **HTTP/2 + HTTP/3** supported.
- **Sane `robots.txt`** (`/wp-admin/` disallowed, `admin-ajax.php` allowed — standard).
- **Modern PHP 8.3** and current jQuery 3.7.1.
- **Lightweight custom audio player** rather than a heavy third-party embed.

## 4. Limitations of this assessment

- Passive, single-point-in-time (2026-11-10), external-only.
- The live TLS chain/cipher suite and HSTS-preload status were **not** independently validated end-to-end from this environment; certificate facts come from the public CT record and response behavior.
- True WordPress core version, patch levels, server-side form protections, admin-login hardening (MFA), backup/restore posture, and any actual exploitability were **not** assessed and **require owner authorization** (Document F).
- No vulnerability is claimed as exploitable; all "Suspected/Informational" items are flagged as such.
