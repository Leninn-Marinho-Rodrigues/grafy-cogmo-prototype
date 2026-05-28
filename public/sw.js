const CACHE_NAME = "grafy-shell-v1";
const scopeUrl = self.registration.scope;
const OFFLINE_URL = new URL("offline.html", scopeUrl).toString();
const APP_SHELL = ["", "index.html", "offline.html", "manifest.json", "grafy-icon.svg"].map((path) =>
  new URL(path, scopeUrl).toString()
);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === "GET" && response.status === 200) cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
