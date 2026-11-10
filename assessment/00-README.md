# Jona Radio (jonaradio.net) — External Security Assessment

**Target:** https://www.jonaradio.net → canonical https://jonaradio.net/
**Assessment type:** Preliminary, **passive / non-intrusive external review** (public-visitor vantage only)
**Observation date:** 2026-11-10 (UTC)
**Access level:** External visitor only. No credentials, hosting, server, or source-code access was used or attempted.

---

## Scope and method (read first)

This assessment was produced using **only lawful, non-intrusive observation of publicly available information**, equivalent to what any ordinary site visitor or search engine can see:

- Fetching public pages (home page, `/contact/`) and reading returned HTTP response headers and HTML.
- Public DNS record lookups.
- The public `robots.txt` and XML sitemap.
- The public Certificate Transparency log record (crt.sh).

**No active penetration testing, vulnerability scanning, authentication attempts, payload submission, directory brute-forcing, or stream disruption was performed.** Active testing (Document E) is a *proposal only* and must not begin until the site owner grants explicit written authorization.

Findings are graded by verification status: **Confirmed** (directly observed), **Suspected** (indicated but not verifiable passively), or **Not assessed** (requires authorized testing).

## Documents

| # | File | Audience |
|---|------|----------|
| A | [`01-executive-summary.md`](01-executive-summary.md) | Owner / non-technical |
| B | [`02-technical-assessment.md`](02-technical-assessment.md) | Technical |
| C | [`03-improvement-roadmap.md`](03-improvement-roadmap.md) | Owner + implementer |
| D | [`04-commercial-proposal.md`](04-commercial-proposal.md) | Owner (commercial) |
| E | [`05-owner-outreach.md`](05-owner-outreach.md) | Draft outreach message |
| F | [`06-authorization-and-testing-scope.md`](06-authorization-and-testing-scope.md) | Rules of engagement (pre-authorization) |

## One-paragraph summary

Jona Radio is a WordPress-based French-language Christian internet-radio site hosted on Hostinger, streaming via Zeno.fm over HTTPS. Transport security fundamentals are **sound** (valid certificate, HTTPS enforced, secure streaming, CDN in front). The observable gaps are **configuration-hardening and hygiene items** — chiefly missing HTTP security response headers (HSTS, a real Content-Security-Policy, etc.), minor version/technology disclosure, and absent email-authentication DNS records (SPF/DMARC). **No confirmed, exploitable vulnerability was found**, and none is claimed. The improvements recommended are low-risk, high-value hardening measures appropriate for a small broadcaster.
