# Test instructions

## Automated

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

`npm test` covers validation rules and the lead API: demo mode stores/sends nothing, 400 on
invalid input, 429 after the limit, 201 with opaque receipt, 503 on storage failure, a failed
notification is retried without losing the stored lead, duplicate resubmission, honeypot
rejection, and no customer data in logs.

## Manual — run at 375, 768 and 1440 px

Layout
- [ ] No horizontal scroll on any route; text readable without zoom
- [ ] Mobile: menu button opens/closes (also with Esc); sticky "Request repair service" bar
      visible on every page except `/request` and `/thank-you`; no Call button while phone is unverified
- [ ] Desktop: header nav plus primary CTA; hero is a text/image split

Keyboard and accessibility
- [ ] Tab from the top: "Skip to main content" appears first and works
- [ ] Every link, button, FAQ row and form control is reachable with a visible focus ring
- [ ] One `h1` per page; headings in order
- [ ] Contrast spot check (WCAG AA): navy and grey text on white/tinted panels, white on teal
      buttons, white on navy footer, error red on white
- [ ] Screen reader: form errors are announced; error summary links jump to the fields

Request form
- [ ] Submit empty → summary plus inline errors, focus moves to the summary
- [ ] Phone and email both empty → both flagged; either one alone is accepted
- [ ] Bad email, year 1800, past date → specific messages
- [ ] Demo mode → result page states nothing was stored or sent
- [ ] Live sandbox → row appears in `leads`, test inbox receives the email, receipt page shows a
      reference and says it is not an appointment or quote
- [ ] Notification failure: set an invalid `RESEND_API_KEY` → visitor still gets a receipt, row
      has `notified_at = null`, error is logged without customer details
- [ ] Storage failure: set an invalid `SUPABASE_URL` → "could not save" message, answers kept,
      "Try again" works after fixing it
- [ ] Spam limits: 6 quick submissions from one client → 429 message
- [ ] Double-click submit → one row only

Site hygiene
- [ ] Preview: `curl -I` shows `X-Robots-Tag: noindex`; `/robots.txt` disallows all
- [ ] `/thank-you` is noindex in every mode
- [ ] No broken links (crawl all header, footer and in-page links); unknown URL shows the 404 page
- [ ] Lighthouse lab run on `/` and `/request` (mobile)
