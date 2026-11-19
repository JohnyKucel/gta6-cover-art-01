// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo
// loaded; ?shot=cover shows the cover alone at its export size.
// Query params: template, grade, size, photo, photo2, photo3, photo4 (sample keys),
// caption (title), subtitle, tagline, titlepos, titlecolor, titlestretch, titlesize,
// dy, dy2, dy3, dy4 (vertical pan per panel, -0.35..0.35).
// window.__shotReady is set once painted.
import { TEMPLATES, GRADES, SIZES } from './cover.js';

function applyParams(params, state, photos) {
  const t = params.get('template');
  if (t && TEMPLATES[t]) state.template = t;
  const g = params.get('grade');
  if (g && GRADES[g]) state.grade = g;
  const s = params.get('size');
  if (s && SIZES[s]) state.size = s;
  const caption = params.get('caption');
  if (caption) state.title = caption;
  const sub = params.get('subtitle');
  if (sub) state.subtitle = sub;
  const tag = params.get('tagline');
  if (tag) state.tagline = tag;
  const pos = params.get('titlepos');
  if (pos && ['top', 'bottom', 'center'].includes(pos)) state.titlePos = pos;
  const color = params.get('titlecolor');
  if (color) state.titleColor = color;
  const stretch = params.get('titlestretch');
  if (stretch && ['normal', 'wide', 'condensed'].includes(stretch)) state.titleStretch = stretch;
  const tsize = Number(params.get('titlesize') || '0');
  if (tsize > 0) state.titleSize = Math.max(0.7, Math.min(1.3, tsize));
  const keys = ['photo', 'photo2', 'photo3', 'photo4'];
  keys.forEach((key, i) => {
    const v = params.get(key);
    if (v && photos.has(v) && state.panels[i]) state.panels[i].photo = v;
  });
  const zoom = Number(params.get('zoom') || '0');
  if (zoom > 0 && state.panels[0]) state.panels[0].zoom = zoom;
  ['dy', 'dy2', 'dy3', 'dy4'].forEach((key, i) => {
    const v = Number(params.get(key) || '0');
    if (v !== 0 && state.panels[i]) state.panels[i].dy = v;
  });
}

export async function runShot(shot, params, state, photos, redraw) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  applyParams(params, state, photos);
  const titleInput = document.getElementById('title');
  if (titleInput) titleInput.value = state.title;
  const subInput = document.getElementById('subtitle');
  if (subInput) subInput.value = state.subtitle;
  const tagInput = document.getElementById('tagline');
  if (tagInput) tagInput.value = state.tagline;
  const stretchInput = document.getElementById('titleStretch');
  if (stretchInput) stretchInput.value = state.titleStretch;
  const sizeInput = document.getElementById('titleSize');
  if (sizeInput) sizeInput.value = String(state.titleSize);
  const presetInput = document.getElementById('tagPreset');
  if (presetInput) {
    presetInput.value = [...presetInput.options].some((o) => o.value === state.tagline) ? state.tagline : '';
  }
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
