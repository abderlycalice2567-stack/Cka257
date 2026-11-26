#!/usr/bin/env node
/**
 * Dependency-free smoke test against a RUNNING server.
 *   npm run build && npm start        (in one terminal)
 *   npm run test:e2e                  (in another)   BASE_URL defaults to http://localhost:3000
 * If PREVIEW_PASSWORD is set on the server, export the same value here.
 *
 * Checks: every route responds, one <h1> per page, unique titles, no broken
 * internal links, preview is noindex, security headers, the lead API contract
 * (demo/400/429) and that demo mode never claims a request was sent.
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const auth = process.env.PREVIEW_PASSWORD ? { Authorization: `Basic ${Buffer.from(`preview:${process.env.PREVIEW_PASSWORD}`).toString("base64")}` } : {};
const ROUTES = ["/", "/services", "/services/general-repair", "/services/diagnostics", "/services/maintenance", "/about", "/workshop", "/request", "/contact", "/privacy", "/thank-you"];

let failures = 0;
const check = (ok, label) => {
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}`);
};
const get = (path, init = {}) => fetch(BASE + path, { redirect: "manual", ...init, headers: { ...auth, ...(init.headers || {}) } });

const titles = new Map();
const links = new Set();
for (const route of ROUTES) {
  const res = await get(route);
  const html = await res.text();
  check(res.status === 200, `${route} → 200`);
  check((html.match(/<h1[\s>]/g) || []).length === 1, `${route} has exactly one <h1>`);
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
  check(title.length > 0 && !titles.has(title), `${route} has a unique <title> (${title})`);
  titles.set(title, route);
  check(/<meta name="description" content="[^"]+/.test(html), `${route} has a meta description`);
  check(/<link rel="canonical"/.test(html), `${route} has a canonical URL`);
  check((res.headers.get("x-robots-tag") || "").includes("noindex"), `${route} sends X-Robots-Tag: noindex (preview)`);
  check(/<meta name="robots" content="noindex/.test(html), `${route} has a noindex meta tag (preview)`);
  check(!/tel:/.test(html), `${route} shows no call link while the phone is unverified`);
  check(!/application\/ld\+json/.test(html), `${route} emits no structured data while unverified`);
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) if (!m[1].startsWith("/_next")) links.add(m[1]);
}

for (const link of links) {
  const res = await get(link);
  check(res.status === 200, `internal link ${link} → ${res.status}`);
}

const home = await get("/");
for (const h of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "strict-transport-security"]) {
  check(home.headers.has(h), `security header ${h}`);
}
check((await get("/does-not-exist")).status === 404, "unknown route → 404");
check(/Disallow: \/\s*$/m.test(await (await get("/robots.txt")).text()), "robots.txt disallows everything (preview)");
check((await get("/sitemap.xml")).status === 200, "sitemap.xml → 200");
check((await get("/api/cron/retry-notifications")).status === 401, "cron endpoint rejects unauthenticated calls");

// Lead API contract (uses a throwaway IP so the rate-limit check is isolated).
const ip = `192.0.2.${Math.floor(Math.random() * 250) + 1}`;
const post = (body) => get("/api/leads", { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": ip }, body: JSON.stringify(body) });
const valid = { name: "Smoke Test", email: "smoke@example.invalid", service: "not-sure", description: "Automated smoke test — please ignore.", consent: true, idempotencyKey: crypto.randomUUID(), website: "" };

const bad = await post({ ...valid, name: "", email: "" });
const badBody = await bad.json();
check(bad.status === 400 && badBody.fields?.name && badBody.fields?.email, "POST /api/leads invalid → 400 with field errors");

const good = await post(valid);
const goodBody = await good.json();
if (good.status === 200 && goodBody.demo) {
  check(!goodBody.receipt && /NOT stored or sent/.test(goodBody.message), "demo mode: no receipt, says nothing was stored or sent");
  const ty = await (await get("/thank-you?demo=1")).text();
  check(/Nothing was sent/.test(ty) && !/we have your request/i.test(ty), "demo thank-you page never claims the request was sent");
} else {
  check(good.status === 201 && /^LAR-[0-9A-F]{10}$/.test(goodBody.receipt), "live mode: 201 with opaque receipt (a TEST lead was stored)");
}

let limited = false;
for (let i = 0; i < 6 && !limited; i++) limited = (await post(valid)).status === 429;
check(limited, "POST /api/leads → 429 after repeated submissions");

console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
