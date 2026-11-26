#!/usr/bin/env node
// Browser smoke test against a running server (default http://localhost:3000).
//   npm run build && npm start &   then   npm run test:e2e
// Checks every route at 375/768/1440px (status, one H1, no horizontal scroll,
// no console errors), the request form's error and demo-success paths, the
// mobile menu, and the skip link. Screenshots go to tests/e2e/screenshots/.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

// Playwright is resolved via require so a globally installed copy (NODE_PATH) works too.
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = new URL("./screenshots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const routes = ["/", "/services", "/services/maintenance", "/services/diagnostics", "/services/repair", "/about", "/workshop", "/request", "/contact", "/privacy", "/thank-you"];
const widths = [375, 768, 1440];
const failures = [];
const fail = (msg) => { failures.push(msg); console.error("  ✗", msg); };
const ok = (msg) => console.log("  ✓", msg);

const browser = await chromium.launch();
try {
  for (const width of widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    console.log(`\n@ ${width}px`);
    for (const route of routes) {
      const res = await page.goto(BASE + route, { waitUntil: "networkidle" });
      const status = res?.status();
      const h1 = await page.locator("h1").count();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const robots = res?.headers()["x-robots-tag"] ?? "";
      if (status !== 200) fail(`${route} status ${status}`);
      if (h1 !== 1) fail(`${route} has ${h1} <h1> elements`);
      if (overflow > 0) fail(`${route} horizontal overflow ${overflow}px`);
      if (!robots.includes("noindex")) fail(`${route} missing noindex header in preview`);
      // Touch targets: interactive elements in main nav/CTAs at least 44px tall.
      const small = await page.$$eval("header a, header button, main a.btn-primary, main a.btn-secondary, main button", (els) =>
        els.filter((e) => e.offsetParent !== null).map((e) => ({ t: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 30), h: e.getBoundingClientRect().height })).filter((x) => x.h < 44),
      );
      if (small.length) fail(`${route} small touch targets: ${JSON.stringify(small)}`);
      if (width !== 768 && ["/", "/request", "/services/diagnostics", "/contact"].includes(route)) {
        await page.screenshot({ path: `${SHOTS}${route === "/" ? "home" : route.slice(1).replace(/\//g, "-")}-${width}.png`, fullPage: true });
      }
    }
    if (errors.length) fail(`console errors at ${width}px: ${errors.slice(0, 3).join(" | ")}`);
    else ok(`all ${routes.length} routes rendered cleanly`);
    await ctx.close();
  }

  // 404
  {
    const page = await browser.newPage();
    const res = await page.goto(BASE + "/services/towing");
    res?.status() === 404 ? ok("unknown service returns 404") : fail(`unknown service status ${res?.status()}`);
    await page.close();
  }

  // Mobile menu + sticky actions (phone unverified → no call button)
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/");
    const menuBtn = page.getByRole("button", { name: "Open menu" });
    await menuBtn.click();
    (await page.locator("#mobile-nav").isVisible()) ? ok("mobile menu opens") : fail("mobile menu did not open");
    await page.keyboard.press("Escape");
    (await page.locator("#mobile-nav").isHidden()) ? ok("Escape closes mobile menu") : fail("Escape did not close menu");
    (await page.locator('a[href^="tel:"]').count()) === 0 ? ok("no call links while phone is unverified") : fail("tel: link present without verified phone");
    await ctx.close();
  }

  // Skip link
  {
    const page = await browser.newPage();
    await page.goto(BASE + "/");
    await page.keyboard.press("Tab");
    const text = await page.evaluate(() => document.activeElement?.textContent);
    text?.includes("Skip to main content") ? ok("skip link is first focusable element") : fail(`first focus was "${text}"`);
    await page.close();
  }

  // Request form: errors, then demo success
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/request?service=diagnostics");
    (await page.locator("#service").inputValue()) === "diagnostics" ? ok("service preselected from query") : fail("service not preselected");
    await page.getByRole("button", { name: "Send service request" }).click();
    await page.locator("form [role=alert]").waitFor();
    const invalid = await page.locator('[aria-invalid="true"]').count();
    invalid >= 4 ? ok(`empty submit flags ${invalid} invalid fields`) : fail(`only ${invalid} invalid fields on empty submit`);
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-live"));
    focused === "assertive" ? ok("focus moves to error summary") : fail("focus did not move to error summary");
    await page.screenshot({ path: `${SHOTS}request-errors-375.png`, fullPage: true });

    await page.fill("#name", "Test Customer");
    await page.fill("#email", "test@example.com");
    await page.fill("#vehicleYear", "2018");
    await page.fill("#vehicleMake", "Toyota");
    await page.fill("#vehicleModel", "Camry");
    await page.fill("#description", "Check engine light came on this morning.");
    await page.check("#consent");
    await page.waitForTimeout(3100); // spam guard rejects sub-3s submissions
    await page.getByRole("button", { name: /Send service request|Try again/ }).click();
    await page.waitForURL(/\/thank-you\?/);
    const body = await page.textContent("main");
    body?.includes("nothing was stored and nobody was contacted") ? ok("demo submission lands on honest demo receipt") : fail("demo receipt text missing");
    await page.screenshot({ path: `${SHOTS}thank-you-demo-375.png`, fullPage: true });
    await ctx.close();
  }

  // API status codes
  {
    const r = await fetch(BASE + "/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    r.status === 400 ? ok("API returns 400 for invalid payload") : fail(`API invalid payload status ${r.status}`);
  }
} finally {
  await browser.close();
}

console.log(failures.length ? `\n${failures.length} failure(s)` : "\nAll smoke checks passed");
process.exit(failures.length ? 1 : 0);
