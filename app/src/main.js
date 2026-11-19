// Sunset Vice Cover Studio — editor wiring: controls, photo library, drag-to-pan,
// zoom, export, and the ?shot= scenes used for screenshots.
import { drawCover, defaultState, GRADES, TEMPLATES, SIZES, slotName, hitPanel } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
const photos = new Map();
let uploadCount = 0;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadLibrary() {
  for (const key of ['pier', 'boulevard']) {
    try {
      const img = await loadImage(`samples/${key}.jpg`);
      photos.set(key, { img, label: key === 'pier' ? 'Pier (sample)' : 'Boulevard (sample)' });
    } catch { /* a missing sample leaves the panel on its gradient */ }
  }
}

function selectedPanel() { return state.panels[state.selected]; }

function redraw() {
  const [w, h] = SIZES[state.size] || SIZES['1080x1080'];
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  drawCover(canvas, state, new Map([...photos].map(([k, v]) => [k, v.img])));
  syncControls();
}

function syncControls() {
  document.querySelectorAll('#templates .card').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.template === state.template));
  });
  document.querySelectorAll('#grades .swatch').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
  });
  document.querySelectorAll('#sizes .size').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.size === state.size));
  });
  document.querySelectorAll('#panelList .panel-row').forEach((row, i) => {
    const pick = row.querySelector('.pick');
    pick.setAttribute('aria-pressed', String(i === state.selected));
    const sel = row.querySelector('select');
    if (sel.value !== state.panels[i].photo) sel.value = state.panels[i].photo;
  });
  const zoom = document.getElementById('zoom');
  if (document.activeElement !== zoom) zoom.value = String(selectedPanel().zoom);
}

function buildControls() {
  const tWrap = document.getElementById('templates');
  for (const [id, t] of Object.entries(TEMPLATES)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'card'; b.dataset.template = id;
    b.innerHTML = `${t.name}<small>${t.blurb}</small>`;
    b.addEventListener('click', () => { state.template = id; redraw(); });
    tWrap.appendChild(b);
  }
  const gWrap = document.getElementById('grades');
  for (const [id, g] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.dataset.grade = id;
    b.style.background = g.swatch; b.title = g.name; b.setAttribute('aria-label', g.name);
    b.addEventListener('click', () => { state.grade = id; redraw(); });
    gWrap.appendChild(b);
  }
  const sWrap = document.getElementById('sizes');
  for (const id of Object.keys(SIZES)) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'size'; b.dataset.size = id; b.textContent = id.replace('x', ' × ');
    b.addEventListener('click', () => { state.size = id; redraw(); });
    sWrap.appendChild(b);
  }
  const list = document.getElementById('panelList');
  state.panels.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row';
    const pick = document.createElement('button');
    pick.type = 'button'; pick.className = 'pick'; pick.textContent = slotName(p.slot);
    pick.addEventListener('click', () => { state.selected = i; redraw(); });
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', `Photo for ${slotName(p.slot)} panel`);
    sel.addEventListener('change', () => { state.panels[i].photo = sel.value; redraw(); });
    row.append(pick, sel);
    list.appendChild(row);
  });
  refreshPhotoSelects();
}

function refreshPhotoSelects() {
  document.querySelectorAll('#panelList .panel-row select').forEach((sel, i) => {
    const cur = state.panels[i].photo;
    sel.innerHTML = '';
    for (const [key, v] of photos) {
      const o = document.createElement('option');
      o.value = key; o.textContent = v.label;
      sel.appendChild(o);
    }
    sel.value = photos.has(cur) ? cur : [...photos.keys()][0];
    if (sel.value) state.panels[i].photo = sel.value;
  });
}

function bindInputs() {
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const tagline = document.getElementById('tagline');
  title.addEventListener('input', () => { state.title = title.value; redraw(); });
  subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; redraw(); });
  tagline.addEventListener('input', () => { state.tagline = tagline.value; redraw(); });
  document.getElementById('titlePos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
  document.getElementById('titleColor').addEventListener('change', (e) => { state.titleColor = e.target.value; redraw(); });
  document.getElementById('zoom').addEventListener('input', (e) => {
    selectedPanel().zoom = Number(e.target.value);
    redraw();
  });
  for (const [id, key] of [['artSun', 'sun'], ['artSkyline', 'skyline'], ['artPalms', 'palms'], ['artGrain', 'grain']]) {
    document.getElementById(id).addEventListener('change', (e) => { state.art[key] = e.target.checked; redraw(); });
  }
  document.getElementById('samplePier').addEventListener('click', () => {
    if (photos.has('pier')) { selectedPanel().photo = 'pier'; redraw(); }
  });
  document.getElementById('sampleBlvd').addEventListener('click', () => {
    if (photos.has('boulevard')) { selectedPanel().photo = 'boulevard'; redraw(); }
  });
  document.getElementById('upload').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, 4);
    for (const file of files) {
      uploadCount += 1;
      const key = `up${uploadCount}`;
      try {
        const img = await loadImage(URL.createObjectURL(file));
        photos.set(key, { img, label: file.name.length > 22 ? file.name.slice(0, 20) + '…' : file.name });
      } catch { /* unreadable file: skip it */ }
    }
    if (files.length) {
      selectedPanel().photo = `up${uploadCount}`;
      refreshPhotoSelects();
      redraw();
      status.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} added to the selected panel.`;
    }
    e.target.value = '';
  });
  document.getElementById('surprise').addEventListener('click', () => {
    const templates = Object.keys(TEMPLATES);
    const grades = Object.keys(GRADES);
    const colors = ['#ffffff', '#ffd23f', '#ff7eb6', '#7ef0ff'];
    const keys = [...photos.keys()];
    state.template = templates[Math.floor(Math.random() * templates.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.titleColor = colors[Math.floor(Math.random() * colors.length)];
    state.titlePos = ['bottom', 'top', 'center'][Math.floor(Math.random() * 3)];
    state.panels.forEach((p) => {
      p.photo = keys[Math.floor(Math.random() * keys.length)];
      p.zoom = 1 + Math.random() * 0.4;
      p.dx = (Math.random() - 0.5) * 0.2;
      p.dy = (Math.random() - 0.5) * 0.2;
    });
    document.getElementById('titlePos').value = state.titlePos;
    document.getElementById('titleColor').value = state.titleColor;
    redraw();
    status.textContent = 'Shuffled template, grade and photos.';
  });
  document.getElementById('export').addEventListener('click', () => {
    const [w, h] = SIZES[state.size];
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    drawCover(off, state, new Map([...photos].map(([k, v]) => [k, v.img])));
    off.toBlob((blob) => {
      if (!blob) { status.textContent = 'Export failed — try again.'; return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sunset-vice-cover-${state.size}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      status.textContent = `Saved sunset-vice-cover-${state.size}.png (${w} × ${h}).`;
    }, 'image/png');
  });
}

function bindCanvasGestures() {
  let dragging = false;
  let lastX = 0; let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const slot = hitPanel(state, x, y, canvas.width, canvas.height);
    if (slot) {
      const idx = state.panels.findIndex((p) => p.slot === slot);
      if (idx >= 0) state.selected = idx;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      redraw();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const p = selectedPanel();
    p.dx = Math.max(-0.35, Math.min(0.35, p.dx + ((e.clientX - lastX) / rect.width) * 0.9));
    p.dy = Math.max(-0.35, Math.min(0.35, p.dy + ((e.clientY - lastY) / rect.height) * 0.9));
    lastX = e.clientX; lastY = e.clientY;
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = selectedPanel();
    p.zoom = Math.max(1, Math.min(2.5, p.zoom * (1 - e.deltaY * 0.001)));
    redraw();
  }, { passive: false });
}

buildControls();
bindInputs();
bindCanvasGestures();
await loadLibrary();
refreshPhotoSelects();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  await runShot(shot, params, state, photos, redraw);
} else {
  redraw();
}
