// End-to-end smoke test against a running server (default http://localhost:3001).
// Usage: BASE_URL=http://localhost:3001 ADMIN_EMAIL=... ADMIN_PASSWORD=... node tests/e2e/smoke.mjs
// Requires Playwright with Chromium. Creates a throwaway subscriber and test content.
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://localhost:3001";
const results = [];
let failures = 0;

function check(name, cond, detail = "") {
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!cond) failures++;
}

function totp(b32) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, val = 0;
  const out = [];
  for (const c of b32.replace(/\s/g, "")) {
    val = (val << 5) | A.indexOf(c);
    bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const mac = createHmac("sha1", Buffer.from(out)).update(msg).digest();
  const o = mac[mac.length - 1] & 15;
  return String((((mac[o] & 127) << 24) | (mac[o + 1] << 16) | (mac[o + 2] << 8) | mac[o + 3]) % 1e6).padStart(6, "0");
}

async function get(p, init) {
  return fetch(BASE + p, { redirect: "manual", ...init });
}

// ---------------------------------------------------------------- HTTP-level checks
const pages = ["", "/live", "/programs", "/programs/kingdom-conversations", "/programs/the-word-today/walking-in-faith", "/schedule", "/podcasts", "/podcasts?q=faith", "/presenters", "/presenters/morning-host", "/news", "/devotionals", "/events", "/community", "/prayer", "/testimonies", "/about", "/mission", "/leadership", "/faq", "/privacy", "/terms", "/accessibility", "/support", "/contact", "/search?q=prayer", "/sign-in", "/sign-up", "/forgot-password"];
for (const l of ["en", "fr", "ht"]) {
  const bad = [];
  for (const p of pages) {
    const r = await get(`/${l}${p}`);
    if (r.status !== 200) bad.push(`${p}=${r.status}`);
  }
  check(`all ${pages.length} public pages return 200 (${l})`, bad.length === 0, bad.join(", "));
}
check("unknown program slug returns 404", (await get("/en/programs/does-not-exist")).status === 404);
check("unknown page returns 404", (await get("/en/not-a-page")).status === 404);
check("root redirects to a language", [307, 308].includes((await get("/")).status));
check("Accept-Language fr → /fr", ((await get("/", { headers: { "accept-language": "fr-CA,fr;q=0.9" } })).headers.get("location") || "").endsWith("/fr"));

const h = (await get("/en")).headers;
check("CSP with per-request nonce", /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/.test(h.get("content-security-policy") || ""));
const n1 = /nonce-([^']+)/.exec(h.get("content-security-policy") || "")?.[1];
const n2 = /nonce-([^']+)/.exec((await get("/en")).headers.get("content-security-policy") || "")?.[1];
check("nonce rotates per request", n1 && n2 && n1 !== n2);
check("X-Frame-Options DENY", h.get("x-frame-options") === "DENY");
check("nosniff", h.get("x-content-type-options") === "nosniff");
check("no X-Powered-By", !h.get("x-powered-by"));
check("noindex while ALLOW_INDEXING is off", (h.get("x-robots-tag") || "").includes("noindex"));
check("robots.txt disallows all (pre-launch)", (await (await get("/robots.txt")).text()).includes("Disallow: /"));

const np = await (await get("/api/v1/radio/now-playing?locale=ht")).json();
check("now-playing never claims online without an engine", np.online === null && np.engine === "none");
const status = await (await get("/api/v1/radio/status")).json();
check("radio status reports stream configuration honestly", typeof status.configured === "boolean");
const sched = await (await get("/api/v1/schedule")).json();
check("schedule API returns UTC occurrences + station timezone", sched.timezone === "America/New_York" && sched.items.length > 0);
const ics = await (await get("/api/v1/schedule/ics?program=kingdom-conversations")).text();
check("ICS export is valid iCalendar", ics.startsWith("BEGIN:VCALENDAR") && ics.includes("BEGIN:VEVENT"));
const rss = await (await get("/feeds/podcasts/the-word-today.xml")).text();
check("program podcast RSS has enclosures + iTunes tags", rss.includes("<enclosure") && rss.includes("itunes:duration"));
check("sample-only unreviewed episodes are not in feeds", !(await (await get("/feeds/podcasts.xml")).text()).includes("Parable of the Sower"));
const eps = await (await get("/api/v1/episodes?pageSize=1")).json();
check("episodes API paginates", eps.pageSize === 1 && eps.total > 1);

const audioUrl = eps.items[0].audio_url;
const range = await get(audioUrl, { headers: { range: "bytes=0-1023" } });
check("published media supports HTTP Range (206)", range.status === 206 && range.headers.get("content-range")?.startsWith("bytes 0-1023/"));
check("path traversal on media is refused", (await get("/media/..%2f..%2fetc%2fpasswd")).status === 404);

check("progress API requires sign-in", (await get("/api/v1/listening/progress", { method: "POST", headers: { origin: BASE, "content-type": "application/json" }, body: "{}" })).status === 401);
check("progress API rejects cross-origin", (await get("/api/v1/listening/progress", { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}" })).status === 403);
check("admin redirects anonymous users", [307, 308].includes((await get("/admin")).status));
check("payment webhook refuses unsigned events", [400, 503].includes((await get("/api/v1/webhooks/payments", { method: "POST", body: "{}" })).status));

// ---------------------------------------------------------------- browser flows
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

await page.goto(`${BASE}/en`);
check("no CSP violations or JS errors on home", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));

// Player: live without a stream must say so; an episode must actually play.
await page.getByRole("button", { name: "Listen live" }).first().click();
await page.waitForTimeout(400);
const bar = page.getByRole("region", { name: "Now playing" });
check("live player shows 'Stream not configured' (no fake live)", await bar.getByText("Stream not configured").first().isVisible().catch(() => false));
await page.goto(`${BASE}/en/programs/the-word-today/walking-in-faith`);
await page.locator("main").getByRole("button", { name: "Play", exact: true }).first().click();
await page.waitForTimeout(2500);
const playing = await page.evaluate(() => { const a = document.querySelector("audio"); return !!a && !a.paused && a.currentTime > 0; });
check("episode audio plays in the persistent player", playing);
await page.getByRole("link", { name: "Schedule" }).first().click();
await page.waitForURL(/\/en\/schedule/);
await page.waitForTimeout(800);
const still = await page.evaluate(() => { const a = document.querySelector("audio"); return !!a && !a.paused; });
check("audio keeps playing across client-side navigation", still);
await page.evaluate(() => document.querySelector("audio")?.pause());

// Forms
await page.goto(`${BASE}/en/contact`);
await page.fill("#f-name", "E2E Tester");
await page.fill("#f-email", "e2e@example.org");
await page.fill("#f-body", "Hello from the automated end-to-end test.");
await page.check('input[name="consent"]');
await page.locator('main button[type="submit"]').first().click();
check("contact form stores and confirms", await page.getByText("we received your message").waitFor({ timeout: 8000 }).then(() => true, () => false));

await page.goto(`${BASE}/en/prayer`);
await page.fill("#f-name", "E2E");
await page.fill("#f-body", "Automated test prayer request — please ignore.");
await page.check('input[name="consent"]');
await page.locator('main button[type="submit"]').first().click();
check("prayer request accepted", await page.getByText("Our prayer team will pray with you").waitFor({ timeout: 8000 }).then(() => true, () => false));

// Subscriber
const email = `e2e+${Date.now()}@example.org`;
await page.goto(`${BASE}/en/sign-up`);
await page.fill("#f-display_name", "E2E Listener");
await page.fill("#f-email", email);
await page.fill("#f-password", "correct horse battery staple");
await page.check('input[name="consent"]');
await page.locator('main button[type="submit"]').first().click();
await page.waitForURL(/\/en\/account/, { timeout: 10000 });
check("sign-up creates an account and signs in", page.url().includes("/en/account"));
await page.goto(`${BASE}/en/programs/the-word-today/walking-in-faith`);
await page.getByRole("button", { name: "Save" }).click();
await page.waitForTimeout(800);
await page.goto(`${BASE}/en/account`);
check("saved episode appears on dashboard", await page.getByRole("link", { name: "Walking in Faith — Hebrews 11" }).first().isVisible());
const exp = await page.request.get(`${BASE}/api/v1/account/export`);
check("personal data export downloads JSON", exp.status() === 200 && (await exp.json()).user.email === email);
const subAdmin = await page.request.get(`${BASE}/admin`, { maxRedirects: 0 });
check("subscriber cannot open admin", [307, 308].includes(subAdmin.status()) && (subAdmin.headers().location || "").includes("forbidden"));

// Admin with MFA
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const a = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ap = await a.newPage();
  await ap.goto(`${BASE}/en/sign-in?next=/admin`);
  await ap.fill("#f-email", process.env.ADMIN_EMAIL);
  await ap.fill("#f-password", process.env.ADMIN_PASSWORD);
  await ap.locator('main button[type="submit"]').first().click();
  await ap.waitForURL(/\/admin\/mfa/, { timeout: 10000 });
  check("admin is forced through two-step verification", ap.url().includes("/admin/mfa"));
  if (ap.url().includes("/setup")) {
    await ap.getByRole("button", { name: "Generate my setup key" }).click();
    const key = (await ap.locator("p.select-all").innerText()).replace(/\s/g, "");
    fs.writeFileSync(path.resolve(process.env.MFA_KEY_FILE || "/tmp/ksr-e2e-mfa.txt"), key);
    await ap.fill('input[name="code"]', totp(key));
    await ap.locator('main button[type="submit"]').first().click();
  } else {
    const key = fs.readFileSync(path.resolve(process.env.MFA_KEY_FILE || "/tmp/ksr-e2e-mfa.txt"), "utf8").trim();
    await new Promise((r) => setTimeout(r, 31000 - (Date.now() % 30000))); // fresh step (replay protection)
    await ap.fill('input[name="code"]', totp(key));
    await ap.locator('main button[type="submit"]').first().click();
  }
  await ap.waitForURL(`${BASE}/admin`, { timeout: 10000 });
  check("valid TOTP opens the dashboard", await ap.getByRole("heading", { name: "Dashboard" }).isVisible());

  // Upload → review → publish → feed
  const tone = "/tmp/ksr-e2e-tone.mp3";
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=f=330:d=5", "-c:a", "libmp3lame", "-b:a", "64k", tone]);
  await ap.goto(`${BASE}/admin/episodes/new`);
  await ap.selectOption('select[name="program_id"]', { label: "The Word Today" });
  const title = `E2E upload ${Date.now()}`;
  await ap.fill('input[name="title"]', title);
  await ap.setInputFiles('input[name="audio"]', tone);
  await ap.fill('textarea[name="chapters"]', "0:00 Start\n0:03 End");
  await ap.click('button:has-text("Create episode")');
  await ap.waitForURL(/\/admin\/episodes\/[0-9a-f-]{36}/, { timeout: 15000 });
  check("audio upload creates an episode awaiting review", await ap.getByText("awaiting review").first().isVisible());
  const epAudio = await ap.locator("audio").getAttribute("src");
  check("unpublished audio is hidden from the public", (await get(epAudio)).status === 404);
  await ap.click('button[value="published"]');
  check("publishing without rights review is refused", await ap.getByText("Confirm the copyright").waitFor({ timeout: 8000 }).then(() => true, () => false));
  await ap.check('input[name="rights_confirmed"]');
  await ap.click('button[value="published"]');
  await ap.waitForTimeout(800);
  check("publishing after rights review succeeds", await ap.getByText("Status changed to published").isVisible().catch(() => false));
  check("published audio becomes public", (await get(epAudio)).status === 200);
  check("published episode enters the program feed", (await (await get("/feeds/podcasts/the-word-today.xml")).text()).includes(title));

  await ap.goto(`${BASE}/admin/audit`);
  check("audit log records publishing", await ap.getByText("episode.status").first().isVisible());
  await a.close();
} else {
  results.push("SKIP  admin flows (set ADMIN_EMAIL and ADMIN_PASSWORD)");
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
