# Owner discovery: launch blockers

Until every row is confirmed **in writing by the owner**, this is a sales demo specification, not an authorized production website.
Facts came from earlier prospect research and have **not** been independently re-verified.

| Item | Current state in code | Where to set it |
|---|---|---|
| Legal and display name | Display "Gunter Automotive"; legal name `null` | `business.name`, `business.legalName` |
| Exact location (city, street, ZIP) | `null`: shows "Georgia", directions hidden | `business.address` |
| Phone | `null`: all call buttons hidden | `business.phone`, `business.phoneDisplay` |
| Weekly and holiday hours | `null`: "Hours to be confirmed" | `business.hours`, `business.holidayHoursNote` |
| Current website and domain ownership | Unknown | Redirect map in `next.config.mjs` |
| Approved service list and scope | 3 draft services, `approved: false` | `src/content/services.ts` |
| Service area | `null` (no invented service-area pages) | `business.serviceArea` |
| Pricing and estimate policy | Not stated anywhere | FAQ answers |
| Logo | Placeholder wordmark | `src/components/Logo.tsx`, `src/app/icon.svg` |
| Photos and image rights | Illustrative placeholders only | `src/content/workshop.ts`, Hero, About |
| Real reviews | None shown, and the reviews module is omitted | Add only real, attributable reviews |
| Owner story, team, credentials | Draft notes | `business.story`, `/about` |
| Response-time promise | `null` | `business.responseTime` |
| Lead recipient(s) | Test recipients only | `LEAD_NOTIFY_TO` |
| Privacy contact and retention period | Bracketed placeholders | `/privacy`, migration retention job |
| Request form vs real-time booking | Request form (MVP). Preferred date is a request only. | Phase two if booking is wanted |
| Structured data | Disabled | `business.schemaVerified = true` once identity is verified |
