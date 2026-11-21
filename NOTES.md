# Notes

## Decisions

- **Original app.** It was started from a request to rebuild Pok Pok from its APK. That
  was declined (someone else's commercial app). Don't use its code, art or sounds.
- Drawings live only in the tablet's browser storage (IndexedDB `doodle-pad`, store
  `pages`). There's no cloud copy, so clearing Chrome's site data for the app deletes them.
  The app asks for persistent storage, which Chrome grants to installed apps.
- The canvas is capped at 1.5× pixel density, with 8 undo steps, to keep memory low on a tablet.
- The canvas only grows and never shrinks, so rotating the tablet doesn't crop a drawing.
  When installed, the app is locked to landscape anyway.

## Traps already paid for

- **Updates didn't reach the tablet (fixed in v4, 2026-11-20).** The stickers shipped in v3,
  but he said they "didn't work". Two causes. (1) v3's service worker served the saved
  copy first and only updated in the background. Android *resumes* an installed app
  rather than reloading it, so "open it twice" never loaded the new files. (2) GitHub
  Pages sends `max-age=600`, so the new worker could cache old `app.js` next to new
  `index.html`, and with that mix "Stickers" just draws lines. Now the worker is network-first
  with `cache: 'no-cache'`, installs with `cache: 'reload'`, the app checks for an
  update every time it comes back on screen, and it reloads itself (after saving, never
  mid-stroke) when a new version takes over. The running version shows faintly in
  the Pictures header. Still bump `VERSION` in `sw.js` on every change.
- **"Failed to load page" in Samsung Kids' My Browser on the newer tablet (v6, 2026-11-20).**
  The older tablet was fine. Even the plain icon PNG flashed and then failed there, so
  the cause wasn't the app's code. v4's network-first worker had a 4s timeout that
  returned `Response.error()` when nothing was saved, so it could produce exactly
  that error. v6 is cache-first for the app's files, has no timeout, and on any
  failure falls through to a plain `fetch(req)`. It never returns an error of its own.
  He needs offline access, so removing the worker was rejected. Updates still work
  because they're driven by the `sw.js` byte change + controllerchange reload, not by
  the fetch strategy. **Bump VERSION on every change** or cache-first keeps old files.
  If the newer tablet still fails on v6, the cause is Samsung Kids / My Browser, and
  the APK is the answer.
- **v6 didn't fix it. The real cause, found with diag.html (v7, 2026-11-20):** on the newer
  tablet (SM-X230, Android 16, Samsung Kids My Browser = Android WebView, Chrome 157),
  diag.html loaded and stayed while controlled by the v6 helper. Storage and the helper
  were fine. Anything served **from the saved copy** (index, icon PNG) flashed, then showed
  "Failed to go to website". Anything the helper **fetched from the network** worked
  (diag.html, and sports-daily, whose helper is network-first with `fetch(e.request)`).
  Working theory: Samsung Kids approves pages as they come from the network, so a
  storage-served page looks unapproved. The older tablet's Samsung Kids doesn't do
  this. v7 is network-first with the untouched `fetch(e.request)` and falls back to the
  saved copy only when the network fails. **Don't go back to cache-first.** Unknown: whether
  offline (saved copy) works inside Samsung Kids on that tablet.
- **Local preview shows the old version** until the service worker updates. Unregister
  it and clear caches, or load twice.
- **Crayon grain vs. paint bucket.** The crayon's holes have to stay below about 59%
  coverage, or they link up and the bucket fill leaks through crayon outlines. It's
  28% now, in 2×2 blocks.
- **An SVG with `width:auto; height:66%` inside a grid button** grew past the button
  (84px in a 60px button) in portrait. Size icons in explicit units.
- **Fill with no change:** if the bucket is tapped on a spot that's already that colour,
  its undo snapshot is removed again, but only if that tap took one. Otherwise it would
  delete an older undo step.

- **The hold-to-confirm ring uses requestAnimationFrame.** In a hidden or background
  browser pane, the frame timer is throttled, so a scripted "hold New page" can finish
  long after the script moves on and wipe whatever the test drew afterwards. Don't
  combine a scripted hold with drawing in the same test.
- **The browser pane zooms emulated viewports**, so screenshots show a crop. Check layout
  by measuring elements (getBoundingClientRect), not by eye.

## Stickers

- 10 animals added 2026-11-20 at his request. They are original round-face drawings in
  `stickers.js` (100×100 SVG each). `buildSticker` in `app.js` turns each one into a
  die-cut sticker at load time: the art, a white border made by stamping the
  silhouette in a ring of 24 offsets, and a soft shadow.
- The tray takes over the colour palette's spot while the tool is on, since
  colours don't apply to stickers.

## Ideas not built (ask first)

- Colouring pages (original line art to fill with the bucket)
- Gentle sounds on taps
