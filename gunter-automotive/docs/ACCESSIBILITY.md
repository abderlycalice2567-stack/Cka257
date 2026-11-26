# Accessibility

Target: WCAG 2.2 AA.

## Contrast (computed, WCAG relative luminance)

| Use | Colors | Ratio | Result |
|---|---|---|---|
| Body text ink on cream | `#1B2430` on `#FAF8F2` | 14.74:1 | Pass |
| Muted text on cream | `#4A5563` on `#FAF8F2` | 7.14:1 | Pass |
| Muted text on white | `#4A5563` on `#FFFFFF` | 7.58:1 | Pass |
| Headings brand on cream | `#19334D` on `#FAF8F2` | 12.19:1 | Pass |
| Button text brand-800 on amber | `#0E1E2C` on `#D39B38` | 6.86:1 | Pass |
| Amber-800 links on cream | `#7A5313` on `#FAF8F2` | 6.43:1 | Pass |
| Amber-800 links on white | `#7A5313` on `#FFFFFF` | 6.83:1 | Pass |
| Cream on brand (hero/footer) | `#FAF8F2` on `#19334D` | 12.19:1 | Pass |
| Brand-100 on brand (secondary text) | `#D5DEE8` on `#19334D` | 9.52:1 | Pass |
| Brand-200 on brand (hero note) | `#A9BBCF` on `#19334D` | 6.59:1 | Pass |
| Amber-300 on brand (eyebrows) | `#E4BB6E` on `#19334D` | 7.17:1 | Pass |
| Amber-800 on amber-100 (draft notes) | `#7A5313` on `#F6E8CC` | 5.64:1 | Pass |
| Raw amber #D39B38 on cream (NOT used for text) | `#D39B38` on `#FAF8F2` | 2.32:1 | Fail (decorative only) |

The proposed amber `#D39B38` is used only as a **background** (buttons) or for decoration. Amber **text** on light surfaces uses
`#7A5313` (`amber-800`).

## Built in

- Skip link, landmarks, one `<h1>` per page, logical heading order
- Visible 3px focus ring (amber on light surfaces, cream on dark ones)
- Touch targets of at least 44px (verified by the e2e script)
- Mobile menu: `aria-expanded`/`aria-controls`, closes on Escape and returns focus
- FAQ uses native `<details>` (works with keyboard and without JavaScript)
- Form: real `<label>`s and `<fieldset>`/`<legend>`, `aria-invalid` + `aria-describedby` inline errors, an error summary that receives focus and links to each field, a polite status while sending, and entered data kept on failure
- `prefers-reduced-motion` respected
- Placeholder images exposed as `role="img"` with "Illustrative placeholder" labels

## Manual QA before launch

- [ ] Keyboard-only pass through every page and the full form
- [ ] VoiceOver (iOS Safari) and NVDA (Firefox/Chrome) pass on `/request`
- [ ] 200% zoom and 320px width: no loss of content
- [ ] axe DevTools / Lighthouse: zero violations
