/* sw.js — 簡單離線快取（Cache First + 網路後援） */
const VERSION = 'v1.0.0';
const CACHE_NAME = `vocab1000-${VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && (fresh.type === 'basic' || fresh.type === 'opaque')) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      if (req.mode === 'navigate') {
        const offline = await cache.match('./vocab_trainer_offline.html');
        if (offline) return offline;
      }
      throw err;
    }
  })());
});

