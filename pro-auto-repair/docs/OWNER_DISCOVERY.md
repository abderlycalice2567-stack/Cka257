# Owner discovery — launch blockers

Until every item is answered this is a sales demo, not an authorized production website.
The right-hand column says where each answer goes.

| # | Question | Goes in |
|---|---|---|
| 1 | Legal and display name | `business.name` |
| 2 | Exact address / city (prototype says only "Georgia") | `business.address`, `city` |
| 3 | Phone number for customers | `business.phone`, `phoneDisplay` |
| 4 | Weekly and holiday hours | `business.hours` |
| 5 | Current website, and who controls the domain and DNS | redirects, deployment |
| 6 | Approved service list and wording (three are proposed) | `approvedServices`, `content/services.ts` |
| 7 | Service area, makes/models serviced | `business.serviceArea`, service copy |
| 8 | Pricing and estimate policy (answers the FAQ) | `business.faqAnswers` |
| 9 | Logo files | `Logo.tsx`, `app/icon.svg` |
| 10 | Photos with usage rights | `business.gallery` |
| 11 | Real reviews with source and permission | `business.reviews` |
| 12 | Team members and credentials that can be named | `business.team`, `credentials` |
| 13 | Response time the shop will commit to | `business.responseExpectation` |
| 14 | Who receives lead emails | `LEAD_NOTIFY_TO` |
| 15 | Privacy contact and retention period | `/privacy`, migration retention job |
| 16 | Request form (built) or real-time booking (phase two)? | scope |
| 17 | Owner story for the About page | `business.story` |

FAQ answer ids: `home-info`, `home-date`, `home-estimate`, `diag-symptoms`, `diag-cost`,
`repair-estimate`, `repair-vehicles`, `maint-interval`, `maint-date`.
