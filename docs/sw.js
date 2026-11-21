// Offline support. Network first (always the newest files when online), falling back
// to the saved copy when offline or the network is too slow.
// Bump VERSION when shipping changes; it also shows in the Pictures screen.
const VERSION = 'doodle-v5';
const FILES = ['./', 'index.html', 'style.css', 'stickers.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const TIMEOUT_MS = 4000;

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache (GitHub Pages lets it keep files
  // for 10 minutes), so a new version never gets cached with old files mixed in.
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(req.url, { cache: 'no-cache', signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      clearTimeout(timer);
      return (await cache.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
