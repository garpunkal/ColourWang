// This is a basic service worker for offline support
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('colourwang-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/assets/icon-192.png',
        '/assets/icon-512.png',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
