# Owner discovery — launch blockers

Until every item below is confirmed **in writing by the owner**, this project is a sales demo, not an authorized website. Record each answer and update `src/config/business.ts` / `src/content/services.ts`.

| # | Question | Where it goes | Answer |
|---|---|---|---|
| 1 | Legal and display business name | `business.name`, `nameVerified` | |
| 2 | Is 706-227-1810 correct and OK to publish? | `business.phone` | |
| 3 | Exact location — publish a street address or just "Athens, GA"? | `location`, `streetAddress` | |
| 4 | Service area wording | `serviceArea` | |
| 5 | Weekly and holiday hours | `hours` | |
| 6 | Existing website/domain? Who owns it? | Redirect plan | |
| 7 | Which services are offered (mowing, edging, routine maintenance, others)? | `approvedServices`, service copy | |
| 8 | What's included and excluded for each service | `services.ts` scope/exclusions | |
| 9 | Pricing policy (publish nothing, "free estimate", etc.) | FAQ answers | |
| 10 | Answers to all FAQ questions | `services.ts` | |
| 11 | Logo and brand colors (approve the proposed palette?) | Header, `tailwind.config.ts` | |
| 12 | Photos of real work, and confirmation of image rights | `projects` | |
| 13 | Real reviews and where they come from | `reviews` | |
| 14 | Owner story, team, licensing/insurance (only if real) | `aboutStory` | |
| 15 | Response-time wording | `responseTime` | |
| 16 | Who receives lead emails? | `LEAD_NOTIFY_TO` | |
| 17 | Data retention period and privacy contact | `/privacy`, retention SQL | |
| 18 | Request form (current) or real-time booking? | Scope for phase two | |
| 19 | Public email address? | `business.email` | |
