// Sunset Vice Cover Studio — canvas renderer. Draws a multi-panel poster-style
// cover from photos + caption, entirely with code (no external assets).
// Layouts are original compositions in the spirit of a diagonal multi-panel
// poster; all lettering, sun, skyline and palms are drawn here.

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const GRADES = {
  'vice-sunset': {
    name: 'Vice Sunset', swatch: 'linear-gradient(135deg,#ff7a59,#ff4fa3 55%,#2ec4b6)',
    sky: ['#ff9a5c', '#ff5e8a', '#7b2f8e'], sun: '#ffd23f', accent: '#ff4fa3',
    tint: 'rgba(255, 78, 140, 0.20)', wash: 'rgba(255, 122, 89, 0.10)', ink: '#1d1026',
  },
  'neon-night': {
    name: 'Neon Night', swatch: 'linear-gradient(135deg,#7b5cff,#ff4fd8 55%,#00e5ff)',
    sky: ['#2b1055', '#7b2fbe', '#ff2e88'], sun: '#00e5ff', accent: '#00e5ff',
    tint: 'rgba(123, 47, 190, 0.28)', wash: 'rgba(0, 229, 255, 0.08)', ink: '#0d0618',
  },
  'palm-noir': {
    name: 'Palm Noir', swatch: 'linear-gradient(135deg,#1a1a1a,#8a6d2f 55%,#ffd23f)',
    sky: ['#3a2c14', '#1a1a1a', '#000000'], sun: '#ffd23f', accent: '#ffd23f',
    tint: 'rgba(0, 0, 0, 0.30)', wash: 'rgba(255, 210, 63, 0.07)', ink: '#000000',
  },
  'pastel-dawn': {
    name: 'Pastel Dawn', swatch: 'linear-gradient(135deg,#ffd6e8,#a8d8ff 55%,#fff3b0)',
    sky: ['#ffe3ef', '#bfe3ff', '#fff3b0'], sun: '#ff9a5c', accent: '#ff8fb6',
    tint: 'rgba(255, 143, 182, 0.14)', wash: 'rgba(168, 216, 255, 0.10)', ink: '#33203a',
  },
};

export const TEMPLATES = {
  'vice-grid': { name: 'Vice Grid', blurb: 'Diagonal collage, big foot title' },
  'neon-split': { name: 'Neon Split', blurb: 'Two tall panels, title band' },
  'sunset-stack': { name: 'Sunset Stack', blurb: 'Full-bleed hero, inset snaps' },
};

const SLOT_NAMES = { hero: 'Hero', top: 'Top', bottom: 'Lower', strip: 'Strip' };
export function slotName(slot) { return SLOT_NAMES[slot] ?? slot; }

export function defaultState() {
  return {
    template: 'vice-grid',
    grade: 'vice-sunset',
    size: '1080x1080',
    title: 'SUNSET HEIST',
    subtitle: 'TALES FROM SOL BAY',
    tagline: 'One last job under the neon sun.',
    titlePos: 'bottom',
    titleColor: '#ffffff',
    art: { sun: true, skyline: true, palms: true, grain: true },
    panels: [
      { slot: 'hero', photo: 'pier', zoom: 1, dx: 0, dy: 0 },
      { slot: 'top', photo: 'boulevard', zoom: 1, dx: 0, dy: 0 },
      { slot: 'bottom', photo: 'pier', zoom: 1.2, dx: 0, dy: -0.05 },
      { slot: 'strip', photo: 'boulevard', zoom: 1.1, dx: 0, dy: 0 },
    ],
    selected: 0,
  };
}

// Panel polygons per template, in normalised [x, y] coords. A null polygon hides the slot.
function polygonsFor(template) {
  if (template === 'neon-split') {
    return {
      hero: [[0, 0], [0.56, 0], [0.44, 1], [0, 1]],
      top: [[0.56, 0], [1, 0], [1, 1], [0.44, 1]],
      bottom: 'inset1',
      strip: 'inset2',
    };
  }
  if (template === 'sunset-stack') {
    return { hero: [[0, 0], [1, 0], [1, 1], [0, 1]], top: 'inset1', bottom: 'inset2', strip: null };
  }
  return {
    hero: [[0, 0], [0.60, 0], [0.65, 0.84], [0, 0.84]],
    top: [[0.60, 0], [1, 0], [1, 0.42], [0.625, 0.42]],
    bottom: [[0.625, 0.42], [1, 0.42], [1, 0.84], [0.65, 0.84]],
    strip: [[0, 0.84], [1, 0.84], [1, 1], [0, 1]],
  };
}

// Inset (polaroid-style) panels for the split/stack templates.
function insetPoly(kind, W, H) {
  const defs = {
    inset1: { x: 0.055, y: 0.30, s: 0.20, rot: -6 },
    inset2: { x: 0.75, y: 0.65, s: 0.20, rot: 5 },
  };
  const d = defs[kind];
  const s = d.s * W;
  const cx = d.x * W + s / 2;
  const cy = d.y * H + s / 2;
  const a = (d.rot * Math.PI) / 180;
  const pts = [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]];
  return pts.map(([px, py]) => [
    (cx + px * Math.cos(a) - py * Math.sin(a)) / W,
    (cy + px * Math.sin(a) + py * Math.cos(a)) / H,
  ]);
}

export function panelPolygons(template, W, H) {
  const raw = polygonsFor(template);
  const out = {};
  for (const [slot, poly] of Object.entries(raw)) {
    if (!poly) { out[slot] = null; continue; }
    if (typeof poly === 'string') { out[slot] = insetPoly(poly, W, H); continue; }
    out[slot] = poly;
  }
  return out;
}

function polyPath(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([nx, ny], i) => {
    if (i === 0) ctx.moveTo(nx * W, ny * H);
    else ctx.lineTo(nx * W, ny * H);
  });
  ctx.closePath();
}

function bbox(poly, W, H) {
  const xs = poly.map((p) => p[0] * W);
  const ys = poly.map((p) => p[1] * H);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs);
  const y0 = Math.min(...ys); const y1 = Math.max(...ys);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPhoto(ctx, poly, img, panel, W, H) {
  const box = bbox(poly, W, H);
  polyPath(ctx, poly, W, H);
  ctx.save();
  ctx.clip();
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const base = Math.max(box.w / iw, box.h / ih);
    const dw = iw * base * panel.zoom;
    const dh = ih * base * panel.zoom;
    const cx = box.x + box.w / 2 + (panel.dx || 0) * box.w;
    const cy = box.y + box.h / 2 + (panel.dy || 0) * box.h;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, '#3a2b52'); g.addColorStop(1, '#1a1226');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  ctx.restore();
}

function strokeDivider(ctx, poly, W, H, color, width) {
  polyPath(ctx, poly, W, H);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawSun(ctx, cx, cy, r, color) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.2);
  glow.addColorStop(0, color + 'cc');
  glow.addColorStop(1, color + '00');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'screen';
  const core = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
  core.addColorStop(0, '#fffbe8');
  core.addColorStop(0.55, color);
  core.addColorStop(1, color + 'e6');
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSkyline(ctx, x, y, w, h, color, seed) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = color;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.05 + rnd() * 0.07);
    const bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    if (rnd() > 0.6) ctx.fillRect(bx + bw * 0.3, y + h - bh - h * 0.12, bw * 0.16, h * 0.12);
    bx += bw + w * 0.012;
  }
}

function drawPalm(ctx, x, y, s, color, lean) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const topX = x + lean * s;
  const topY = y - s;
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s * 0.3, y - s * 0.55, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, s * 0.038);
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 26) * (Math.PI / 180);
    const len = s * (0.42 + (i % 3) * 0.07);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + s * 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.3 - s * 0.12, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(topX, topY, s * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

let noiseCanvas = null;
function grainTile() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 160; noiseCanvas.height = 160;
  const nctx = noiseCanvas.getContext('2d');
  const data = nctx.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 20);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

function drawGrain(ctx, W, H, amount) {
  const tile = grainTile();
  const pat = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function fitSize(ctx, text, maxW, start, min, weight, family) {
  let size = start;
  const set = () => { ctx.font = `${weight} ${size}px ${family}`; try { ctx.letterSpacing = '2px'; } catch { /* older canvas */ } };
  set();
  while (size > min && ctx.measureText(text).width > maxW) { size -= 2; set(); }
  return size;
}

const TITLE_FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT = '"Helvetica Neue", Arial, sans-serif';

function scrim(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function drawTitleBlock(ctx, S, grade, x, y, maxW, align, W, H) {
  const title = (S.title || '').trim().toUpperCase();
  const sub = (S.subtitle || '').trim().toUpperCase();
  const tag = (S.tagline || '').trim();
  // Measure first, then shrink the whole block if it would run past the edge.
  let ss = sub ? fitSize(ctx, sub, maxW, Math.round(H * 0.028), 12, '700', BODY_FONT) : 0;
  let ts = title ? fitSize(ctx, title, maxW, Math.round(H * 0.105), 20, '900', TITLE_FONT) : 0;
  let gs = tag ? fitSize(ctx, tag, maxW, Math.round(H * 0.024), 11, '400', BODY_FONT) : 0;
  const total = (sub ? ss * 1.5 : 0) + (title ? ts * 1.28 : 0) + (tag ? gs * 1.6 : 0);
  const avail = H * 0.985 - y;
  if (total > avail && total > 0) {
    const k = avail / total;
    ss *= k; ts *= k; gs *= k;
  }
  ctx.save();
  ctx.textAlign = align;
  const ax = align === 'center' ? x + maxW / 2 : x;
  let cy = y;
  if (sub) {
    ctx.font = `700 ${ss}px ${BODY_FONT}`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, ax, cy);
    cy += ss * 1.5;
  }
  if (title) {
    ctx.font = `900 ${ts}px ${TITLE_FONT}`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = Math.max(3, ts * 0.09);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = ts * 0.18;
    ctx.shadowOffsetY = ts * 0.05;
    ctx.strokeText(title, ax, cy + ts * 0.92);
    ctx.fillStyle = S.titleColor || '#ffffff';
    ctx.fillText(title, ax, cy + ts * 0.92);
    ctx.shadowColor = 'transparent';
    cy += ts * 1.28;
  }
  if (tag) {
    ctx.font = `italic 400 ${gs}px ${BODY_FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(tag, ax, cy);
  }
  ctx.restore();
}

function tintPanel(ctx, poly, W, H, grade) {
  polyPath(ctx, poly, W, H);
  ctx.save();
  ctx.clip();
  const box = bbox(poly, W, H);
  const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, grade.tint);
  ctx.fillStyle = g;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

function drawViceGrid(ctx, S, grade, polys, photos, W, H) {
  for (const p of S.panels) {
    const poly = polys[p.slot];
    if (!poly) continue;
    drawPhoto(ctx, poly, photos.get(p.photo), p, W, H);
    tintPanel(ctx, poly, W, H, grade);
  }
  // The sun rises half-clipped over the poster's top edge, so it never hides a face.
  if (S.art.sun) drawSun(ctx, 0.30 * W, 0.01 * H, Math.min(W, H) * 0.075, grade.sun);
  for (const p of S.panels) {
    const poly = polys[p.slot];
    if (poly) strokeDivider(ctx, poly, W, H, '#ffffff', Math.max(4, W * 0.007));
  }
  if (S.art.palms) {
    ctx.save();
    polyPath(ctx, polys.strip, W, H); ctx.clip();
    drawPalm(ctx, 0.88 * W, 1.0 * H, H * 0.13, 'rgba(8,3,16,0.9)', -0.25);
    drawPalm(ctx, 0.96 * W, 1.0 * H, H * 0.09, 'rgba(8,3,16,0.9)', 0.3);
    ctx.restore();
  }
  const pos = S.titlePos || 'bottom';
  if (pos === 'top') {
    scrim(ctx, 0, 0, W, H * 0.30);
    drawTitleBlock(ctx, S, grade, 0.045 * W, 0.045 * H, 0.58 * W, 'left', W, H);
  } else if (pos === 'center') {
    scrim(ctx, 0, H * 0.34, W, H * 0.36);
    drawTitleBlock(ctx, S, grade, 0.045 * W, H * 0.40, 0.58 * W, 'left', W, H);
  } else {
    scrim(ctx, 0, H * 0.70, W, H * 0.30);
    drawTitleBlock(ctx, S, grade, 0.045 * W, H * 0.862, 0.62 * W, 'left', W, H);
  }
}

function drawNeonSplit(ctx, S, grade, polys, photos, W, H) {
  for (const slot of ['hero', 'top']) {
    const p = S.panels.find((q) => q.slot === slot);
    const poly = polys[slot];
    if (p && poly) { drawPhoto(ctx, poly, photos.get(p.photo), p, W, H); tintPanel(ctx, poly, W, H, grade); }
  }
  strokeDivider(ctx, polys.hero, W, H, '#ffffff', Math.max(4, W * 0.007));
  strokeDivider(ctx, polys.top, W, H, '#ffffff', Math.max(4, W * 0.007));
  const pos = S.titlePos || 'center';
  const bandY = pos === 'top' ? 0.08 : pos === 'bottom' ? 0.66 : 0.40;
  const bandH = 0.18;
  const band = ctx.createLinearGradient(0, bandY * H, W, bandY * H);
  band.addColorStop(0, grade.sky[0]);
  band.addColorStop(0.5, grade.sky[1]);
  band.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY * H, W, bandH * H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, bandY * H, W, Math.max(3, W * 0.004));
  ctx.fillRect(0, (bandY + bandH) * H - Math.max(3, W * 0.004), W, Math.max(3, W * 0.004));
  if (S.art.sun) drawSun(ctx, 0.5 * W, (bandY + bandH / 2) * H, Math.min(W, H) * 0.10, grade.sun);
  if (S.art.palms) {
    drawPalm(ctx, 0.06 * W, (bandY + bandH) * H, H * 0.10, 'rgba(8,3,16,0.85)', -0.2);
    drawPalm(ctx, 0.94 * W, (bandY + bandH) * H, H * 0.10, 'rgba(8,3,16,0.85)', 0.2);
  }
  for (const slot of ['bottom', 'strip']) {
    const p = S.panels.find((q) => q.slot === slot);
    const poly = polys[slot];
    if (!p || !poly) continue;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = W * 0.02; ctx.shadowOffsetY = W * 0.006;
    drawPhoto(ctx, poly, photos.get(p.photo), p, W, H);
    ctx.restore();
    strokeDivider(ctx, poly, W, H, '#ffffff', Math.max(4, W * 0.008));
  }
  const title = (S.title || '').trim().toUpperCase();
  const sub = (S.subtitle || '').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  const cy = (bandY + bandH / 2) * H;
  if (sub) {
    const ss = fitSize(ctx, sub, 0.8 * W, Math.round(H * 0.026), 11, '700', BODY_FONT);
    ctx.font = `700 ${ss}px ${BODY_FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, W / 2, cy - H * 0.055);
  }
  if (title) {
    const ts = fitSize(ctx, title, 0.86 * W, Math.round(H * 0.085), 20, '900', TITLE_FONT);
    ctx.font = `900 ${ts}px ${TITLE_FONT}`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = Math.max(3, ts * 0.09);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = ts * 0.16; ctx.shadowOffsetY = ts * 0.04;
    ctx.strokeText(title, W / 2, cy + ts * 0.32);
    ctx.fillStyle = S.titleColor || '#ffffff';
    ctx.fillText(title, W / 2, cy + ts * 0.32);
  }
  ctx.restore();
  if (S.tagline) {
    ctx.save();
    const gs = fitSize(ctx, S.tagline, 0.8 * W, Math.round(H * 0.024), 11, '400', BODY_FONT);
    const stripH = gs * 2.4;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, (bandY + bandH) * H, W, stripH);
    ctx.textAlign = 'center';
    ctx.font = `italic 400 ${gs}px ${BODY_FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(S.tagline, W / 2, (bandY + bandH) * H + gs * 1.6);
    ctx.restore();
  }
}

function drawSunsetStack(ctx, S, grade, polys, photos, W, H) {
  const hero = S.panels.find((q) => q.slot === 'hero');
  drawPhoto(ctx, polys.hero, photos.get(hero.photo), hero, W, H);
  tintPanel(ctx, polys.hero, W, H, grade);
  const skyH = 0.30 * H;
  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.6, grade.sky[1]);
  sky.addColorStop(1, grade.sky[1] + '00');
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, skyH);
  ctx.restore();
  if (S.art.sun) drawSun(ctx, 0.80 * W, 0.15 * H, Math.min(W, H) * 0.085, grade.sun);
  if (S.art.skyline) drawSkyline(ctx, 0, 0.26 * H, W, 0.08 * H, 'rgba(10,4,20,0.7)', 21);
  if (S.art.palms) {
    drawPalm(ctx, 0.06 * W, 0.335 * H, H * 0.11, 'rgba(8,3,16,0.9)', -0.25);
    drawPalm(ctx, 0.13 * W, 0.335 * H, H * 0.075, 'rgba(8,3,16,0.9)', 0.3);
  }
  for (const slot of ['top', 'bottom']) {
    const p = S.panels.find((q) => q.slot === slot);
    const poly = polys[slot];
    if (!p || !poly) continue;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = W * 0.02; ctx.shadowOffsetY = W * 0.006;
    drawPhoto(ctx, poly, photos.get(p.photo), p, W, H);
    ctx.restore();
    strokeDivider(ctx, poly, W, H, '#ffffff', Math.max(4, W * 0.008));
  }
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, W * 0.01);
  ctx.strokeRect(0, 0, W, H);
  ctx.restore();
  const pos = S.titlePos || 'top';
  if (pos === 'bottom') {
    scrim(ctx, 0, H * 0.66, W, H * 0.34);
    drawTitleBlock(ctx, S, grade, 0.045 * W, H * 0.80, 0.55 * W, 'left', W, H);
  } else if (pos === 'center') {
    scrim(ctx, 0, H * 0.36, W, H * 0.34);
    drawTitleBlock(ctx, S, grade, 0.045 * W, H * 0.42, 0.55 * W, 'left', W, H);
  } else {
    drawTitleBlock(ctx, S, grade, 0.045 * W, 0.04 * H, 0.62 * W, 'left', W, H);
  }
}

/** Draws the full cover for state S onto canvas (at the canvas's own size). */
export function drawCover(canvas, S, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[S.grade] || GRADES['vice-sunset'];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grade.ink;
  ctx.fillRect(0, 0, W, H);
  const polys = panelPolygons(S.template, W, H);
  if (S.template === 'neon-split') drawNeonSplit(ctx, S, grade, polys, photos, W, H);
  else if (S.template === 'sunset-stack') drawSunsetStack(ctx, S, grade, polys, photos, W, H);
  else drawViceGrid(ctx, S, grade, polys, photos, W, H);
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, 'rgba(255,255,255,0)');
  wash.addColorStop(1, grade.wash);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  if (S.art && S.art.grain) drawGrain(ctx, W, H, 0.16);
  drawVignette(ctx, W, H);
}

/** Point-in-polygon hit test, in canvas pixel coords. Returns the slot or null. */
export function hitPanel(S, x, y, W, H) {
  const polys = panelPolygons(S.template, W, H);
  const nx = x / W; const ny = y / H;
  for (const p of S.panels) {
    const poly = polys[p.slot];
    if (!poly) continue;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
      if (((yi > ny) !== (yj > ny)) && (nx < ((xj - xi) * (ny - yi)) / (yj - yi) + xi)) inside = !inside;
    }
    if (inside) return p.slot;
  }
  return null;
}
