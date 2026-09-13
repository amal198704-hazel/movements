const CACHE_NAME = "movement-register-v1.01";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

// Install Event - Pre-cache core app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network-first strategy for dynamic Google Script & Cloudinary calls,
// Cache-first fallback for local static shell
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Let API calls (Google Script & Cloudinary) bypass the service worker cache
  if (url.includes("script.google.com") || url.includes("cloudinary.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache external fonts and icons on the fly
        if (
          networkResponse.status === 200 &&
          (url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com"))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
