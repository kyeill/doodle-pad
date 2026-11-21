# Doodle Pad

A drawing app for little kids (built for ages 2 and 4) on a Galaxy tablet. It's an
original app, installed from the browser to the home screen. It works offline, and every
drawing stays on the tablet itself. No account, no ads, no internet needed after the
first load.

## What's on screen

- **Left: tools.** Marker, crayon (with a paper-grain texture), rainbow (changes
  colour as you draw), stars (stamps stars along the line), paint bucket (fills an
  enclosed shape), eraser.
- **Right: 12 colours, 3 brush sizes, undo, pictures, new page.**
- Several fingers can draw at once, so both kids can draw together.

## Toddler-proofing

- **New page** and **delete picture** only work if you *hold* the button (an orange
  ring fills up). A quick tap just wiggles it.
- Nothing is ever lost by accident: every page saves itself automatically and shows
  up under **Pictures**. Tap a picture to keep drawing on it.
- Pinch-zoom, text selection, long-press menus and pull-to-refresh are disabled.
- When installed, the Android back gesture closes the Pictures screen instead of
  leaving the app.
- Wide touches (a resting palm) are ignored.

## Saving a drawing to the tablet's photos

Pictures → the share button (arrow) on a picture → pick Gallery, Google Photos, Messages, etc.

## Files

Everything the site serves is in `docs/` (GitHub Pages serves it as-is; there's no build step).

| File | What it is |
| --- | --- |
| `index.html` | Layout and the hand-drawn tool icons |
| `style.css` | Look and the landscape/portrait layouts |
| `app.js` | Drawing, brushes, paint bucket, undo, saving, Pictures |
| `sw.js` | Offline support. **Bump `VERSION` on every change** or tablets keep the old copy |
| `manifest.webmanifest` | Home-screen install settings (full screen, landscape) |
| `icon-*.png` | Home-screen icon |

Local preview: the `doodle-pad` entry in the root `.claude/launch.json` (port 8779).
