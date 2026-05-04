/**
 * Element 78 service worker.
 *
 * Two responsibilities right now:
 *   1. Web Push: render a notification when the server pushes one, and
 *      route the click to the right URL inside the PWA.
 *   2. Lightweight network resilience: cache the app shell (icons,
 *      offline page) so a member opening a backgrounded PWA while on
 *      a flaky cell signal sees the brand mark instead of a chrome
 *      "no internet" error. We deliberately do NOT cache HTML or API
 *      responses — those should always be fresh from the network.
 *
 * Versioning: bump SW_VERSION to invalidate the cache. The "activate"
 * step purges anything that doesn't match.
 */

const SW_VERSION = "e78-v1";
const SHELL_CACHE = `${SW_VERSION}-shell`;

const SHELL_ASSETS = [
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/coach/icon-192.png",
  "/icons/coach/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== SHELL_CACHE).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  // Only intercept same-origin GETs for shell assets — let everything else
  // (HTML pages, Supabase, Stripe, Daily, etc.) go straight to the network.
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isShellAsset = SHELL_ASSETS.some((a) => url.pathname === a);
  if (!isShellAsset) return;

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(SHELL_CACHE).then((cache) => cache.put(req, copy));
      return res;
    }).catch(() => cached)),
  );
});

self.addEventListener("push", (event) => {
  // The server (web-push) sends a JSON body shaped like
  //   { title, body, url?, tag?, kind? }
  // We render a notification that mirrors the in-app brand language and
  // routes clicks back into the PWA.
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_e) { /* not json */ }

  const title = data.title || "Element 78";
  const body = data.body || "Tap to open the app.";
  const url = data.url || "/home";
  const tag = data.tag || data.kind || "e78-default";
  const isCoach = url.startsWith("/trainer");

  const options = {
    body,
    tag,
    renotify: true,
    icon: isCoach ? "/icons/coach/icon-192.png" : "/icons/icon-192.png",
    badge: isCoach ? "/icons/coach/icon-192.png" : "/icons/icon-192.png",
    data: { url },
    vibrate: [200, 60, 200],
    requireInteraction: data.kind === "live_call",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/home";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // If the PWA is already open, focus it and route there.
      for (const client of all) {
        try {
          await client.focus();
          if ("navigate" in client) await client.navigate(target);
          return;
        } catch (_) { /* can't focus that one */ }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
