'use strict';
(() => {

// ---------- settings ----------
const COLORS = ['#e8413c', '#f7902b', '#ffd23f', '#8ac926', '#2a9d4b', '#4cc9f0',
                '#3a6ff0', '#8e5cd9', '#ff7eb6', '#f4c095', '#8b5a2b', '#2b2b2b'];
const SIZES = [6, 14, 28];          // brush width in CSS px
const ERASER_SCALE = 2.4;
const MAX_DPR = 1.5;                // plenty sharp for crayons, keeps memory low
const UNDO_MAX = 8;
const SAVE_DELAY = 800;
const PALM_WIDTH = 90;              // touches wider than this (CSS px) are ignored
const FILL_TOLERANCE = 100;

const $ = s => document.querySelector(s);
const stage = $('#stage');
const canvas = $('#paper');
const ctx = canvas.getContext('2d');
const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

let tool = 'marker';
let color = COLORS[0];
let sizeIdx = 1;
let pageId = null;        // id of the page on screen
let hasContent = false;   // anything drawn on this page yet
let unsaved = false;      // changed since last save
const undo = [];
const strokes = new Map(); // pointerId -> stroke state (several fingers at once)

// ---------- paper ----------
function paper() {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

// Grow the canvas to cover the stage (never shrink, so rotating keeps the drawing).
function fitCanvas(minW = 0, minH = 0) {
  const r = stage.getBoundingClientRect();
  const W = Math.max(canvas.width, Math.ceil(r.width * dpr), minW);
  const H = Math.max(canvas.height, Math.ceil(r.height * dpr), minH);
  if (W === canvas.width && H === canvas.height) return;
  let old = null;
  if (canvas.width && canvas.height) {
    old = document.createElement('canvas');
    old.width = canvas.width; old.height = canvas.height;
    old.getContext('2d').drawImage(canvas, 0, 0);
  }
  canvas.width = W; canvas.height = H;
  canvas.style.width = W / dpr + 'px';
  canvas.style.height = H / dpr + 'px';
  paper();
  if (old) ctx.drawImage(old, 0, 0);
}
function resetCanvas() { canvas.width = 0; canvas.height = 0; fitCanvas(); }

new ResizeObserver(() => fitCanvas()).observe(stage);

function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * canvas.width / r.width,
           y: (e.clientY - r.top) * canvas.height / r.height };
}

// ---------- brushes ----------
const patterns = new Map();
// Crayon = a solid colour with fixed paper-grain holes. The pattern is anchored to
// the canvas, so going over the same spot keeps the same grain, like real crayon.
function crayonPattern(c) {
  if (patterns.has(c)) return patterns.get(c);
  const n = document.createElement('canvas');
  n.width = n.height = 96;
  const g = n.getContext('2d');
  g.fillStyle = c; g.fillRect(0, 0, 96, 96);
  const img = g.getImageData(0, 0, 96, 96), a = img.data;
  for (let y = 0; y < 96; y += 2) for (let x = 0; x < 96; x += 2) {
    if (Math.random() < 0.28) {   // well under 0.59, so holes never join up and the bucket can't leak
      a[(y * 96 + x) * 4 + 3] = 0; a[(y * 96 + x + 1) * 4 + 3] = 0;
      a[((y + 1) * 96 + x) * 4 + 3] = 0; a[((y + 1) * 96 + x + 1) * 4 + 3] = 0;
    }
  }
  g.putImageData(img, 0, 0);
  const p = ctx.createPattern(n, 'repeat');
  patterns.set(c, p);
  return p;
}

function style(s, d) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = s.w;
  let paint;
  switch (s.tool) {
    case 'eraser': paint = '#fff'; break;
    case 'rainbow': s.hue = (s.hue + d * 0.35 / dpr) % 360; paint = `hsl(${s.hue} 90% 55%)`; break;
    case 'crayon': paint = crayonPattern(s.color); ctx.lineWidth = s.w * (0.9 + Math.random() * 0.2); break;
    default: paint = s.color;
  }
  ctx.strokeStyle = paint; ctx.fillStyle = paint;
}

function star(s, p) {
  const r = s.w * (0.9 + Math.random() * 0.8) + 5 * dpr;
  const rot = Math.random() * Math.PI;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r, a = rot + i * Math.PI / 5;
    ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle = s.color;
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, r * 0.2);
  ctx.fill(); ctx.stroke();
}

function dab(s, p) {
  if (s.tool === 'stars') return star(s, p);
  style(s, 0);
  ctx.beginPath(); ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill();
}

function segment(s, p) {
  const d = Math.hypot(p.x - s.p1.x, p.y - s.p1.y);
  if (d < 0.5) return;
  if (s.tool === 'stars') {
    s.acc += d;
    if (s.acc >= s.w * 1.8 + 12 * dpr) { s.acc = 0; star(s, p); }
    s.p1 = p;
    return;
  }
  // smooth: curve from the last midpoint to the new midpoint, through the last point
  const mid = { x: (s.p1.x + p.x) / 2, y: (s.p1.y + p.y) / 2 };
  style(s, d);
  ctx.beginPath(); ctx.moveTo(s.mid.x, s.mid.y);
  ctx.quadraticCurveTo(s.p1.x, s.p1.y, mid.x, mid.y);
  ctx.stroke();
  s.mid = mid; s.p1 = p;
}

function finish(s) {
  if (s.tool === 'stars') return;
  style(s, 0);
  ctx.beginPath(); ctx.moveTo(s.mid.x, s.mid.y); ctx.lineTo(s.p1.x, s.p1.y); ctx.stroke();
}

// ---------- paint bucket ----------
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

function floodFill(x0, y0, hex) {
  const W = canvas.width, H = canvas.height;
  if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return false;
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  const [fr, fg, fb] = hexRgb(hex);
  const k0 = (y0 * W + x0) * 4, tr = d[k0], tg = d[k0 + 1], tb = d[k0 + 2];
  if (Math.abs(tr - fr) + Math.abs(tg - fg) + Math.abs(tb - fb) < 30) return false;
  const mask = new Uint8Array(W * H);
  const ok = i => {
    if (mask[i]) return false;
    const k = i * 4;
    return Math.abs(d[k] - tr) + Math.abs(d[k + 1] - tg) + Math.abs(d[k + 2] - tb) <= FILL_TOLERANCE;
  };
  const stack = [x0, y0];
  while (stack.length) {
    const y = stack.pop(), x = stack.pop(), row = y * W;
    if (!ok(row + x)) continue;
    let l = x, r = x;
    while (l > 0 && ok(row + l - 1)) l--;
    while (r < W - 1 && ok(row + r + 1)) r++;
    for (let i = l; i <= r; i++) mask[row + i] = 1;
    for (const ny of [y - 1, y + 1]) {
      if (ny < 0 || ny >= H) continue;
      let open = false;
      for (let i = l; i <= r; i++) {
        const good = ok(ny * W + i);
        if (good && !open) { stack.push(i, ny); open = true; } else if (!good) open = false;
      }
    }
  }
  // grow by one pixel so the soft edge next to the outline gets coloured too
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (mask[i] !== 1) continue;
    if (x > 0 && !mask[i - 1]) mask[i - 1] = 2;
    if (x < W - 1 && !mask[i + 1]) mask[i + 1] = 2;
    if (y > 0 && !mask[i - W]) mask[i - W] = 2;
    if (y < H - 1 && !mask[i + W]) mask[i + W] = 2;
  }
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const k = i * 4; d[k] = fr; d[k + 1] = fg; d[k + 2] = fb; d[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return true;
}

// ---------- drawing input ----------
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' && e.width > PALM_WIDTH) return;
  e.preventDefault();
  if (!e.isPrimary && e.pointerType !== 'touch') return;
  const pushed = strokes.size === 0;
  if (pushed) pushUndo();
  const p = pos(e);
  if (tool === 'fill') {
    if (floodFill(Math.floor(p.x), Math.floor(p.y), color)) { changed(); scheduleSave(); }
    else if (pushed) undo.pop();
    return;
  }
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  const w = SIZES[sizeIdx] * dpr * (tool === 'eraser' ? ERASER_SCALE : 1);
  const s = { tool, color, w, p1: p, mid: p, hue: Math.random() * 360, acc: 0 };
  strokes.set(e.pointerId, s);
  dab(s, p);
  changed();
});

canvas.addEventListener('pointermove', e => {
  const s = strokes.get(e.pointerId);
  if (!s) return;
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  for (const ev of (list.length ? list : [e])) segment(s, pos(ev));
});

function endStroke(e) {
  const s = strokes.get(e.pointerId);
  if (!s) return;
  finish(s);
  strokes.delete(e.pointerId);
  if (strokes.size === 0) scheduleSave();
}
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);

function changed() { hasContent = true; unsaved = true; updUndo(); }

// ---------- undo ----------
const undoBtn = $('#undo');
function pushUndo() {
  const c = document.createElement('canvas');
  c.width = canvas.width; c.height = canvas.height;
  c.getContext('2d').drawImage(canvas, 0, 0);
  undo.push(c);
  if (undo.length > UNDO_MAX) undo.shift();
}
function updUndo() { undoBtn.classList.toggle('off', undo.length === 0); }
undoBtn.addEventListener('click', () => {
  if (strokes.size) return;
  const c = undo.pop();
  if (!c) return wiggle(undoBtn);
  paper(); ctx.drawImage(c, 0, 0);
  unsaved = true; scheduleSave(); updUndo();
});

// ---------- tool, colour, size pickers ----------
function setInk(c) { color = c; document.documentElement.style.setProperty('--ink', c); }

document.querySelectorAll('.tool').forEach(b => b.addEventListener('pointerdown', () => {
  tool = b.dataset.tool;
  document.querySelectorAll('.tool').forEach(x => x.classList.toggle('on', x === b));
}));

const colorsEl = $('#colors');
COLORS.forEach((c, i) => {
  const b = document.createElement('button');
  b.className = 'sw' + (i === 0 ? ' on' : '');
  b.style.setProperty('--c', c);
  b.setAttribute('aria-label', 'Colour ' + (i + 1));
  b.addEventListener('pointerdown', () => {
    setInk(c);
    colorsEl.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b));
    if (tool === 'eraser') {   // picking a colour while erasing means "I want to draw"
      tool = 'marker';
      document.querySelectorAll('.tool').forEach(x => x.classList.toggle('on', x.dataset.tool === 'marker'));
    }
  });
  colorsEl.appendChild(b);
});
setInk(COLORS[0]);

document.querySelectorAll('.size').forEach(b => b.addEventListener('pointerdown', () => {
  sizeIdx = +b.dataset.size;
  document.querySelectorAll('.size').forEach(x => x.classList.toggle('on', x === b));
}));

// ---------- hold-to-confirm buttons (toddler-proof) ----------
function wiggle(el) { el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle'); }

function holdButton(el, ms, onDone, canStart) {
  let t0 = 0, raf = 0, active = false;
  const stop = () => { active = false; cancelAnimationFrame(raf); el.style.setProperty('--p', 0); };
  const tick = () => {
    const p = Math.min(1, (performance.now() - t0) / ms);
    el.style.setProperty('--p', p);
    if (p >= 1) { stop(); onDone(); } else raf = requestAnimationFrame(tick);
  };
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    if (canStart && !canStart()) return wiggle(el);
    try { el.setPointerCapture(e.pointerId); } catch {}
    active = true; t0 = performance.now(); tick();
  });
  const cancel = () => { if (active) { stop(); wiggle(el); } };
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('click', e => e.stopPropagation());
}

// ---------- storage (IndexedDB, on this tablet only) ----------
const DB = (() => {
  let opening;
  const open = () => opening || (opening = new Promise((res, rej) => {
    const r = indexedDB.open('doodle-pad', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('pages', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('pages', mode);
      const req = fn(t.objectStore('pages'));
      t.oncomplete = () => res(req.result);
      t.onerror = t.onabort = () => rej(t.error);
    });
  };
  return {
    put: rec => run('readwrite', s => s.put(rec)),
    get: id => run('readonly', s => s.get(id)),
    del: id => run('readwrite', s => s.delete(id)),
    all: () => run('readonly', s => s.getAll()),
  };
})();

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function startPage(id) { pageId = id; store.set('doodle:current', id); }

const toBlob = (c, type, q) => new Promise(res => c.toBlob(res, type, q));
function thumbBlob() {
  const k = 480 / Math.max(canvas.width, canvas.height);
  const t = document.createElement('canvas');
  t.width = Math.round(canvas.width * k); t.height = Math.round(canvas.height * k);
  const g = t.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(canvas, 0, 0, t.width, t.height);
  return toBlob(t, 'image/jpeg', 0.85);
}

let saveTimer = 0, saving = null;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, SAVE_DELAY); }

async function saveNow() {
  clearTimeout(saveTimer);
  while (saving) await saving;
  if (!unsaved || !hasContent) return;
  unsaved = false;
  const id = pageId;
  saving = (async () => {
    try {
      const [image, thumb] = await Promise.all([toBlob(canvas, 'image/png'), thumbBlob()]);
      await DB.put({ id, updated: Date.now(), w: canvas.width, h: canvas.height, image, thumb });
    } catch (err) { unsaved = true; console.warn('save failed', err); }
  })();
  await saving;
  saving = null;
}
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
window.addEventListener('pagehide', () => saveNow());

async function openPage(id) {
  await saveNow();
  let rec;
  try { rec = await DB.get(id); } catch {}
  if (!rec) return false;
  const bmp = await createImageBitmap(rec.image);
  resetCanvas();
  fitCanvas(bmp.width, bmp.height);
  ctx.drawImage(bmp, 0, 0);
  startPage(id);
  hasContent = true; unsaved = false;
  undo.length = 0; updUndo();
  return true;
}

function blankPage() {
  undo.length = 0; updUndo();
  resetCanvas();
  startPage(newId());
  hasContent = false; unsaved = false;
  stage.classList.remove('flip'); void stage.offsetWidth; stage.classList.add('flip');
}

holdButton($('#new-page'), 800, async () => { await saveNow(); blankPage(); }, () => hasContent);

// ---------- gallery ----------
const gallery = $('#gallery'), grid = $('#grid'), tpl = $('#card-tpl');
let urls = [];

async function openGallery() {
  if (strokes.size) return;
  await saveNow();
  let recs = [];
  try { recs = await DB.all(); } catch {}
  recs.sort((a, b) => b.updated - a.updated);
  grid.replaceChildren();
  for (const rec of recs) {
    const card = tpl.content.firstElementChild.cloneNode(true);
    const url = URL.createObjectURL(rec.thumb); urls.push(url);
    const img = card.querySelector('img');
    img.src = url; img.width = rec.w; img.height = rec.h;
    if (rec.id === pageId) card.classList.add('current');
    img.addEventListener('click', async () => { if (await openPage(rec.id)) closeGallery(); });
    card.querySelector('.share').addEventListener('click', e => { e.stopPropagation(); share(rec); });
    holdButton(card.querySelector('.del'), 1000, async () => {
      try { await DB.del(rec.id); } catch {}
      card.remove();
      if (rec.id === pageId) { unsaved = false; blankPage(); }
      $('#empty').hidden = grid.children.length > 0;
    });
    grid.appendChild(card);
  }
  $('#empty').hidden = recs.length > 0;
  gallery.hidden = false;
  grid.scrollTop = 0;
}
function closeGallery() {
  gallery.hidden = true;
  grid.replaceChildren();
  urls.forEach(URL.revokeObjectURL); urls = [];
}
$('#open-gallery').addEventListener('click', openGallery);
$('#close-gallery').addEventListener('click', closeGallery);

async function share(rec) {
  const stamp = new Date(rec.updated).toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const file = new File([rec.image], `drawing-${stamp}.png`, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); } catch {}
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

// ---------- kid-proofing ----------
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
// When installed to the home screen, the Android back gesture closes the gallery
// instead of the app. Chrome only honours this after a tap, so it re-arms on each touch.
const installed = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
let trapArmed = false;
document.addEventListener('pointerdown', () => {
  if (installed && !trapArmed) { history.pushState({ doodle: 1 }, ''); trapArmed = true; }
}, true);
window.addEventListener('popstate', () => { trapArmed = false; if (!gallery.hidden) closeGallery(); });

// ---------- start ----------
(async () => {
  fitCanvas();
  updUndo();
  const cur = store.get('doodle:current');
  if (!(cur && await openPage(cur).catch(() => false))) startPage(cur || newId());
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();

})();
