const CACHE="touken-diary-v14";
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon.svg"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("touken-diary-") && key !== CACHE)
          .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  // HTMLはネットワーク優先。古い画面を表示し続けないようにする。
  if (req.method === "GET" && (req.destination === "serviceworker" || new URL(req.url).pathname.endsWith("/sw.js"))) {
    event.respondWith(fetch(req, {cache:"no-store"}));
    return;
  }
  if (req.method === "GET" && (req.mode === "navigate" || req.destination === "document")) {
    event.respondWith(
      fetch(req, { cache: "no-store" })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
