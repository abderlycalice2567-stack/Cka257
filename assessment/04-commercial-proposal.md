# Document D — Cybersecurity Improvement Proposal (Commercial)

**Prepared for:** the owner of Jona Radio · **Prepared by:** [Your consulting firm]
**Basis:** preliminary, non-intrusive external review dated 2026-11-10

> **Honesty principle:** This proposal separates **confirmed needs** (we observed the gap) from **optional improvements** and from **items requiring your authorization to verify.** We have not inflated risk to create work. Your site showed **no confirmed vulnerability and no sign of compromise.**

## Why us / why now
Jona Radio's foundations are good (valid HTTPS, secure streaming, CDN). The opportunity is to convert a "mostly fine" site into a **well-hardened, monitored, recoverable** one — the difference that matters the day a plugin flaw is disclosed or someone tries to impersonate your domain.

## Service packages

### Package 1 — Essential Hardening (confirmed needs) · *one-off*
Addresses the items we directly observed.
- Security response headers (HSTS, CSP, and the rest) — F-01
- SPF/DMARC email-spoofing protection — F-03
- Version/technology disclosure cleanup — F-02
- Contact-form anti-spam + HTTPS config fixes — F-06, F-07
- CAA record; DNSSEC assessment — F-04
**Outcome:** the full "Immediate" + most of "Short-term" roadmap, verified. **Access needed:** hosting panel + DNS + WP admin.

### Package 2 — WordPress Care Plan (optional, recurring) · *monthly*
The single most valuable ongoing service for a WordPress site.
- Scheduled core/theme/plugin updates with pre-update backups
- Vulnerability-advisory monitoring for your specific plugin set
- Tested backups + documented restore
- Uptime + **stream-status monitoring** (incl. Zeno.fm dependency)
- Brute-force / WAF protection and login hardening (MFA)

### Package 3 — Authorized Security Assessment (requires written permission) · *scoped project*
Validates what passive review cannot: real patch status, web-app testing (OWASP Top 10, non-destructive), auth/session review, infrastructure config. Delivered under the rules of engagement in Document F.

### Package 4 — Monitoring & Resilience Retainer (optional) · *ongoing*
File-integrity/login monitoring, incident-response support, periodic re-assessment, quarterly posture report.

## How each benefits you
| Service | Benefit to Jona Radio |
|---------|-----------------------|
| Headers + HTTPS hardening | Stronger browser-side protection; better security scores; listener trust |
| SPF/DMARC | Stops others sending fake "@jonaradio.net" email; protects reputation |
| Care plan | Removes the #1 real-world risk (unpatched plugins); peace of mind |
| Backups/monitoring | Fast recovery; minimal downtime for listeners |
| Authorized assessment | Replaces assumptions with evidence; confirms you're actually secure |

## Suggested engagement path
1. **Package 1** (fast, visible wins) →
2. **Package 2** care plan (ongoing protection) →
3. **Package 3** authorized assessment once trust is established →
4. Optional **Package 4** retainer.

*(Pricing to be set per your firm's rates; scope above is deliberately modular so the owner can start small.)*
