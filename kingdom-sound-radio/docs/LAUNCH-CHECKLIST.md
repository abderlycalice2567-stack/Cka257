# Production acceptance checklist (spec Part XXI)

Status key: **✅ built & tested** · **🟡 built, needs station account/configuration or manual test** · **⬜ not built yet**

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Actual live radio stream is operational | 🟡 | Player, stream management and reconnection are built. No stream URL has been provided yet; the site honestly shows "Stream not configured". |
| 2 | AutoDJ takes over when a live presenter disconnects | 🟡 | AzuraCast configuration (BROADCASTING-SETUP.md); test on the station's server. |
| 3 | Audio continues during internal navigation | ✅ | Verified in e2e. (Switching *language* reloads the layout and stops audio.) |
| 4 | Live metadata updates correctly | 🟡 | Program metadata from the schedule ✅; track/listener data needs AzuraCast connected. |
| 5 | Broadcasting status reflects actual stream conditions | ✅ | Never shows live unless audio plays; "On air" only when the engine reports online. |
| 6 | Weekly schedules function correctly | ✅ | |
| 7 | Timezone conversion works | ✅ | DST integration tests; browser shows local time. |
| 8 | Recurring broadcasts are generated correctly | ✅ | Rolling 3-week window; manual edits preserved. |
| 9 | Broadcast recordings can be imported | 🟡 | Manual upload ✅; automatic AzuraCast import ⬜ (worker phase). |
| 10 | Recordings can be processed and published | 🟡 | Upload, duration probe, review/rights/publish ✅; FFmpeg normalisation/transcription ⬜. |
| 11 | Previous broadcasts are searchable | ✅ | Full-text + filters. |
| 12 | Episode filters return accurate content | ✅ | |
| 13 | Podcast RSS feeds pass validation | 🟡 | Feeds generated with required tags; run an external validator with real artwork (1400–3000 px). |
| 14 | External platform links are configured | 🟡 | Admin built; needs the station's platform accounts. |
| 15 | External integrations are tested | 🟡 | "I tested it" verification gate built; nothing marked verified yet (correctly). |
| 16 | Subscriber registration works | ✅ | |
| 17 | Authentication and password recovery work | 🟡 | ✅ in code/tests; email delivery needs `RESEND_API_KEY`. Google/Apple sign-in ⬜. |
| 18 | Favorites and listening history synchronize | ✅ | |
| 19 | Program reminders work | 🟡 | Reminders saved; sending reminder emails/push ⬜. |
| 20 | Notification preferences are respected | 🟡 | Stored; no notifications are sent yet, so nothing can violate them. |
| 21 | Community submissions are moderated | ✅ | |
| 22 | Confidential submissions are protected | ✅ | Staff-only, assignment-scoped, audited, retention filter. Scheduled purge ⬜. |
| 23 | Donations and payment webhooks work | 🟡 | Checkout + verified, idempotent webhook built and unit-tested; needs Stripe keys + live test. |
| 24 | Administrative permissions are enforced | ✅ | Server-side + 2-step. |
| 25 | Administrative audit logs work | ✅ | |
| 26 | Mobile layouts are tested | 🟡 | Emulated iPhone checked; real-device pass pending. |
| 27 | PWA installation is tested | 🟡 | Manifest + service worker built; install test on devices pending. |
| 28 | Accessibility testing is completed | ⬜ | Built with semantic HTML, labels, focus styles, reduced motion; audit not done. |
| 29 | Performance testing is completed | ⬜ | |
| 30 | Streaming capacity is tested | ⬜ | Needs AzuraCast server. |
| 31 | Backup and recovery procedures are tested | ⬜ | Procedure in OPERATIONS.md. |
| 32 | Copyright and licensing arrangements are reviewed | ⬜ | Station/legal. |
| 33 | Privacy policies are reviewed | ⬜ | Templates in Admin → Content → Pages. |
| 34 | Production demo data is removed | 🟡 | One-click purge in Admin → Launch readiness. |
| 35 | All visible buttons and forms are functional | ✅ | Giving shows "not connected" instead of a dead button until Stripe is configured. |
| 36 | Source code and documentation are delivered | ✅ | This repository. |

Also not built yet from the wider brief: native mobile apps, live chat/polls/song requests, audio/video testimony uploads, volunteer/guest applications, membership tiers, advertising scheduling, AI features, video library, Smart TV/speaker apps, analytics dashboards beyond the admin dashboard.
