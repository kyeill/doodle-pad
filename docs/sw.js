// Offline support.
// - The app's own files are served from the copy saved on the tablet: instant, and
//   works with no internet.
// - New versions arrive by changing this file: the browser checks it directly with
//   GitHub, installs the new copy, and app.js reloads into it. So bump VERSION on
//   every change, or tablets keep the old files.
// - If anything here fails (no saved copy, a browser that blocks storage, ...), the
//   request goes to the network exactly as if this helper didn't exist. It never
//   returns an error of its own. (v4 did, and a restricted browser showed
//   "Failed to load page".)
// VERSION also shows in the Pictures screen.
const VERSION = 'doodle-v6';
const FILES = ['./', 'index.html', 'style.css', 'stickers.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache (GitHub Pages lets it keep files
  // for 10 minutes), so a new version never gets saved with old files mixed in.
  // If saving fails, the install fails and the previous version simply stays.
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .catch(() => {})
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(savedOrNetwork(req));
});

async function savedOrNetwork(req) {
  try {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
  } catch {}
  return fetch(req);
}
