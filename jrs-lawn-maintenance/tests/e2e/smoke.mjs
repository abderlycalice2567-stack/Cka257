// End-to-end smoke test against a running server.
// Usage: BASE_URL=http://localhost:3000 node tests/e2e/smoke.mjs
// Expects the server in DEMO MODE (no SUPABASE_* env). Writes screenshots to test-results/.
// Optional: PREVIEW_USER / PREVIEW_PASSWORD if the preview gate is on.
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const auth = process.env.PREVIEW_PASSWORD ? { username: process.env.PREVIEW_USER || "preview", password: process.env.PREVIEW_PASSWORD } : undefined;
const authHeader = auth ? { authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}` } : {};
fs.mkdirSync("test-results", { recursive: true });

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
};
const get = (p, init = {}) => fetch(BASE + p, { redirect: "manual", ...init, headers: { ...authHeader, ...(init.headers || {}) } });

// ---------------------------------------------------------------- HTTP checks
const PAGES = ["/", "/services", "/services/mowing", "/services/edging", "/services/routine-lawn-maintenance", "/about", "/request", "/contact", "/privacy", "/thank-you"];
const bad = [];
for (const p of PAGES) if ((await get(p)).status !== 200) bad.push(p);
check(`${PAGES.length} routes return 200`, bad.length === 0, bad.join(", "));
check("/projects is omitted (404) while there are no approved photos", (await get("/projects")).status === 404);
check("unknown service returns 404", (await get("/services/tree-removal")).status === 404);
if (auth) check("preview gate rejects unauthenticated requests", (await fetch(BASE + "/")).status === 401);

const h = (await get("/")).headers;
check("noindex header on preview", (h.get("x-robots-tag") || "").includes("noindex"));
check("CSP with nonce", /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/.test(h.get("content-security-policy") || ""));
check("security headers", h.get("x-frame-options") === "DENY" && h.get("x-content-type-options") === "nosniff");
check("robots.txt disallows all on preview", /Disallow: \//.test(await (await get("/robots.txt")).text()));
const home = await (await get("/")).text();
check("one <h1> on home", (home.match(/<h1[\s>]/g) || []).length === 1);
check("no tel: link while phone is unverified", !home.includes('href="tel:'));
check("no fabricated reviews/ratings markup", !/aggregateRating|ratingValue/i.test(home));

// ---------------------------------------------------------------- Browser checks
const browser = await chromium.launch();
async function axe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] })).violations.map((v) => `${v.id}(${v.nodes.length})`));
  check(`axe: no WCAG A/AA violations — ${label}`, res.length === 0, res.join(", "));
}

for (const [w, hgt] of [[375, 812], [768, 1024], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, httpCredentials: auth });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  for (const p of ["/", "/services/mowing", "/request", "/contact"]) {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${w}px ${p}: no horizontal scroll`, overflow <= 0, `overflow=${overflow}`);
    await page.screenshot({ path: `test-results/${w}${p === "/" ? "-home" : p.replaceAll("/", "-")}.png`, fullPage: true });
    if (w !== 768) await axe(page, `${w}px ${p}`);
  }
  // touch targets on mobile
  if (w === 375) {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("header a, header button, .fixed a, footer a")]
        .filter((el) => el.offsetParent !== null)
        .map((el) => [el.textContent.trim(), el.getBoundingClientRect().height])
        .filter(([, hh]) => hh < 44),
    );
    check("375px: nav/sticky/footer targets ≥ 44px tall", small.length === 0, JSON.stringify(small));
    check("375px: sticky request bar visible, no call button", (await page.locator(".fixed >> text=Request lawn service").isVisible()) && (await page.locator('.fixed a[href^="tel:"]').count()) === 0);
    // mobile menu: open, Escape closes and returns focus
    const btn = page.getByRole("button", { name: "Open menu" });
    await btn.click();
    check("mobile menu opens", await page.locator("#mobile-menu").isVisible());
    await page.keyboard.press("Escape");
    check("Escape closes mobile menu and restores focus", !(await page.locator("#mobile-menu").isVisible()) && (await page.evaluate(() => document.activeElement?.getAttribute("aria-controls"))) === "mobile-menu");
  }
  check(`${w}px: no console errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await ctx.close();
}

// Keyboard + form flow (desktop)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, httpCredentials: auth });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  check("first Tab focuses the skip link", (await page.evaluate(() => document.activeElement?.textContent)) === "Skip to main content");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check("focused element has a visible outline", outline !== "none", outline);

  await page.goto(BASE + "/request?service=edging", { waitUntil: "networkidle" });
  check("demo-mode notice shown on request form", await page.getByText("Demo mode").isVisible());
  check("service preselected from query", (await page.locator("#field-service").inputValue()) === "edging");
  await page.locator("#field-service").selectOption("");
  await page.getByRole("button", { name: "Request lawn service" }).click();
  const summary = page.locator('[role="alert"]').first();
  check("empty submit shows error summary", await summary.isVisible());
  check("error summary receives focus", await summary.evaluate((el) => el === document.activeElement));
  check("invalid fields marked aria-invalid", (await page.locator('[aria-invalid="true"]').count()) >= 4);

  await page.fill("#field-name", "E2E Test");
  await page.fill("#field-email", "e2e@example.com");
  await page.locator("#field-service").selectOption("mowing");
  await page.fill("#field-description", "Quarter-acre front and back yard, test submission.");
  await page.fill("#field-zip", "30601");
  await page.locator("#field-frequency").selectOption("weekly");
  await page.check("#field-consent");
  await page.waitForTimeout(2600); // human fill-time threshold
  await page.getByRole("button", { name: "Request lawn service" }).click();
  await page.waitForURL(/\/thank-you\?r=DEMO-/, { timeout: 10000 });
  check("demo submit lands on thank-you with DEMO receipt", true);
  check("thank-you clearly says the request was NOT sent", await page.getByText("This request was not sent.").isVisible());
  await page.screenshot({ path: "test-results/1280-thank-you.png", fullPage: true });
  await axe(page, "thank-you");
  await ctx.close();
}
await browser.close();

// API contract
const ip = { "x-forwarded-for": `192.0.2.${Math.floor(Math.random() * 200) + 1}`, "content-type": "application/json", origin: BASE };
check("API 400 on invalid payload", (await get("/api/leads", { method: "POST", headers: ip, body: "{}" })).status === 400);
check("API 403 on cross-site origin", (await get("/api/leads", { method: "POST", headers: { ...ip, origin: "https://evil.example" }, body: "{}" })).status === 403);
let last = 0;
for (let i = 0; i < 6; i++) last = (await get("/api/leads", { method: "POST", headers: ip, body: "{}" })).status;
check("API 429 after repeated submissions", last === 429);
check("cron endpoint requires secret", (await get("/api/cron/notify")).status === 401);

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
