// Roam Access pilot — service worker.
// Caches the app shell (hashed Next.js assets, fonts, icons) so the app opens
// fast and shows a friendly page offline. It NEVER caches /api: profiles hold
// disability information and must only ever come fresh from the server.
const VERSION = 'ra-pilot-v1';
const CACHE = `${VERSION}-static`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/fonts/inter-latin-var.woff2'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // map tiles, Clerk: browser default
  if (url.pathname.startsWith('/api/')) return;         // personal data: never cached

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Content-hashed build output never changes: cache first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  // Fonts, icons, map worker: serve cached, refresh in the background.
  if (/^\/(fonts|icons|maplibre)\//.test(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const fresh = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    }));
  }
});
