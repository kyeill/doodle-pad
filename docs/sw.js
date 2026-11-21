// Offline support: internet first, the saved copy only when there's no connection.
//
// Why internet first: on the newer kids' tablet (Galaxy SM-X230, Android 16, Samsung
// Kids "My Browser"), any page or file handed over from the saved copy briefly showed
// and was then replaced by "Failed to go to website", while the same address fetched
// from the internet worked (diag.html, sports-daily). Samsung Kids appears to approve
// pages as they come from the internet, so a page served from storage looks
// unapproved. v3 and v6 served from storage first and failed there.
//
// - The request is passed on exactly as the browser made it, fetch(e.request), like
//   sports-daily's helper, which works on that tablet.
// - Every successful load refreshes the saved copy, so offline gets the latest.
// - New versions still arrive by changing this file (the browser checks it directly),
//   and app.js reloads into them. Bump VERSION on every change.
// VERSION also shows in the Pictures screen.
const VERSION = 'doodle-v9';
const FILES = ['./', 'index.html', 'style.css', 'stickers.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache (GitHub Pages lets it keep files
  // for 10 minutes), so the offline copy is never saved with old files mixed in.
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
  e.respondWith(internetThenSaved(req));
});

async function internetThenSaved(req) {
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
    }
    return res;
  } catch (err) {
    // no connection: use the saved copy, or fail the same way the browser would
    try {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
    } catch {}
    throw err;
  }
}
