// The Kingdom Sound Radio — service worker.
// Network-first for public pages and the schedule API, with an offline copy.
// Never caches account, admin, auth, media streams or form submissions.
const VERSION = "ksr-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const PRIVATE = /^\/(admin|api\/v1\/(account|favorites|follows|listening|notifications|reminders|donations|prayer|testimon))|\/(account|sign-in|sign-up|reset-password|verify-email|forgot-password)/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(["/icon.svg", "/icon-192.png", "/icon-512.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // live streams and third parties pass through
  if (PRIVATE.test(url.pathname) || url.pathname.startsWith("/media/")) return;

  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|woff2)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(STATIC).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }

  const cacheable = req.mode === "navigate" || url.pathname.startsWith("/api/v1/schedule");
  if (!cacheable) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && !res.headers.get("cache-control")?.includes("no-store")) {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || new Response("You are offline. Previously visited pages and the schedule remain available.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }))),
  );
});
