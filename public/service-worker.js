const CACHE_NAME = 'geopoint-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Necessário para habilitar a instalação no PC e Android
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});