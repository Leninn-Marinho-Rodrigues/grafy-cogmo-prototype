const CACHE_NAME = "grafy-shell-v3-oauth-safe-cache";
const scopeUrl = self.registration.scope;
const OFFLINE_URL = new URL("offline.html", scopeUrl).toString();
const APP_SHELL = ["", "index.html", "offline.html", "manifest.json", "grafy-icon.svg"].map((path) =>
  new URL(path, scopeUrl).toString()
);
const SAME_ORIGIN_PREFIX = new URL(scopeUrl).origin;

const shouldCacheRequest = (request, response) => {
  const url = new URL(request.url);
  if (url.origin !== SAME_ORIGIN_PREFIX) return false;
  if (!url.href.startsWith(scopeUrl)) return false;
  if (url.pathname.includes("/api/")) return false;
  if (request.cache === "only-if-cached") return false;
  return response.status === 200 && (response.type === "basic" || response.type === "default");
};

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
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          if (shouldCacheRequest(event.request, response)) {
            caches.open(CACHE_NAME).then((cache) => cache.put(new URL("", scopeUrl).toString(), clone));
          }
          return response;
        })
        .catch(() => caches.match(new URL("", scopeUrl).toString()).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (shouldCacheRequest(event.request, response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
