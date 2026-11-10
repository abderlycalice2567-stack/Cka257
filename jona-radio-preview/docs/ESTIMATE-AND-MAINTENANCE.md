# Implementation Estimate & Maintenance

> Indicative planning figures to frame the proposal. **Not a quote** — final
> numbers depend on scope, content readiness, and the owner's choices. Currency
> and rates are left to the agency.

## One-time implementation (effort, not price)

| Work item | Est. effort | Owner input / access needed |
|-----------|-------------|-----------------------------|
| Design finalization (brand, pages, responsive) | 2–4 days | Logo/brand assets, feedback |
| Frontend build-out (this codebase → final content) | 4–7 days | Final copy, program list, images |
| Live player integration (authorized stream) | 0.5–1 day | Written OK to use Zeno.fm mount |
| Content editing layer (headless CMS or admin) | 3–6 days | Decision on CMS approach |
| Forms → authenticated email + anti-abuse (CAPTCHA/Turnstile) | 1–2 days | Mail service choice, keys |
| Security headers/CSP hardening & QA | 1 day | — |
| Accessibility (WCAG 2.2 AA) + performance pass | 1–2 days | — |
| DNS & email records (SPF/DKIM/DMARC, CAA, DNSSEC) | 0.5–1 day | **Domain/registrar access** |
| Backups, monitoring, incident-response setup | 1–2 days | **Hosting access** |
| Deployment + cutover | 0.5–1 day | DNS control, launch window |

**Indicative total: ~3–5 weeks** of focused work, depending on content and the
CMS decision. The bulk of calendar time is usually content and approvals.

## Ongoing maintenance (recurring)

| Plan element | Cadence |
|--------------|---------|
| Dependency updates + `npm audit` review | Monthly |
| Security header/CSP review | Quarterly |
| Backup **restore test** | Quarterly |
| Uptime + stream-health monitoring | Continuous (alerting) |
| Content/editorial support (optional) | As needed |
| DMARC report review | Weekly → monthly after enforcement |
| Periodic authorized security re-assessment | 6–12 months |

## Required from the owner

Brand assets · final content · written authorization to use the live stream ·
registrar/DNS access (email & DNS security) · hosting access (backups,
monitoring, any WordPress patching) · a chosen mail provider · a launch window.

## Assumptions & exclusions

- Excludes paid third-party services (payment provider fees, premium monitoring,
  email-sending volumes, stock imagery licensing).
- Active penetration testing is a **separate** engagement under written scope.
- Legal/privacy text requires the owner's (and, if needed, counsel's) review.
