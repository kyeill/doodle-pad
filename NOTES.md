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

- **The offline cache serves stale files.** After editing, bump `VERSION` in `sw.js`. In
  the local preview, unregister the service worker and clear caches before reloading,
  or you'll test the old CSS.
- **Crayon grain vs. paint bucket.** The crayon's holes have to stay below about 59%
  coverage, or they link up and the bucket fill leaks through crayon outlines. It's
  28% now, in 2×2 blocks.
- **An SVG with `width:auto; height:66%` inside a grid button** grew past the button
  (84px in a 60px button) in portrait. Size icons in explicit units.
- **Fill with no change:** if the bucket is tapped on a spot that's already that colour,
  its undo snapshot is removed again, but only if that tap took one. Otherwise it would
  delete an older undo step.

## Ideas not built (ask first)

- Colouring pages (original line art to fill with the bucket)
- Gentle sounds on taps
- Stickers / stamps beyond stars
