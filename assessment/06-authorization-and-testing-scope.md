# Document F — Authorization & Testing Scope (Rules of Engagement)

> **STATUS: PROPOSAL ONLY — NOT YET AUTHORIZED.**
> No active testing, scanning, exploitation, credential testing, or intrusive probing may occur until the owner signs a written authorization defining scope. This document is a *methodology and permission framework*, not a set of attack instructions.

## 1. Why authorization is mandatory
Active security testing of a system you do not own — scanning, fuzzing, login testing, exploitation — can be unlawful and disruptive without the owner's explicit, written consent. Everything below is gated on that consent.

## 2. Authorization form must specify
- **Owner/authorizer:** name, role, signature, date, proof of authority over the domain/host.
- **In-scope assets:** exact domains/subdomains (e.g. `jonaradio.net`, `www.`), IPs/hosts, and explicitly the **WordPress application**. Note third parties (Zeno.fm, Hostinger, GTranslate) are **out of scope** unless their operators separately authorize.
- **Out of scope:** anything not listed; all third-party infrastructure; destructive actions.
- **Permitted methods & intensity:** non-destructive only; rate limits / max request rate; whether authenticated testing (test account) is allowed.
- **Testing window:** dates/times (ideally low-traffic), to protect listeners.
- **Emergency contacts:** 24/7 contact on both sides; a "stop" signal.
- **Data handling:** how any findings/evidence are stored and deleted; confidentiality.
- **Explicit prohibitions:** no DoS/stress testing, no data exfiltration, no persistence, no social engineering, no credential brute-forcing, no third-party pivoting — unless each is *separately and explicitly* authorized.

## 3. Proposed methodology (once authorized) — non-destructive

1. **Scope confirmation & asset discovery (authorized):** enumerate in-scope hosts/subdomains, confirm ownership, baseline the live TLS configuration and certificate chain.
2. **Configuration & transport validation:** verify header/HSTS/CSP deployment, TLS cipher/version posture, redirect integrity — confirm the Document B items against the live stack.
3. **CMS & dependency verification:** confirm the **actual** WordPress core + plugin/theme versions and cross-reference against published advisories to determine *genuine* exposure (closes F-09). Non-destructive version/patch validation only.
4. **Web-application review (OWASP Top 10, non-destructive):** input-handling, authentication/session design, access-control and CSRF review using safe, benign test inputs — **no malicious payloads, no control bypass, no data extraction.**
5. **Authentication/session hygiene (if a test account is provided):** cookie flags, session handling, login protections, MFA availability. **No brute-forcing.**
6. **Infrastructure config review (authorized surface only):** exposed-service and configuration review within scope; **no DoS, no intrusive port sweeps beyond agreed limits.**
7. **Controlled proof-of-concept (only on prior agreement):** the *minimum* safe demonstration needed to confirm a finding, with the owner's sign-off, no real data touched.
8. **Operational-security interview:** backups/restore tests, admin-access management, logging/monitoring, incident-response & disaster-recovery readiness.
9. **Reporting:** each finding with evidence, confidence, confirmed-vs-suspected status, impact, severity, remediation, and complexity (as in Document B), plus a remediation roadmap and a re-test offer.

## 4. Safety commitments
- Stop immediately on request or on any sign of service disruption.
- Stay within agreed rate limits and windows; protect the live stream and listeners.
- Report any critical finding promptly and confidentially.
- Never exceed the written scope; when in doubt, ask first.

## 5. Explicitly excluded unless separately authorized in writing
Denial-of-service / load testing · credential brute-forcing · phishing / social engineering · data exfiltration or modification · installing persistence · testing Zeno.fm, Hostinger, or any third-party system.
