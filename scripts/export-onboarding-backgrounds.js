#!/usr/bin/env node
/**
 * Exports onboarding gradient backgrounds as 9:16 PNGs (pure JS, no native deps).
 * Requires: npm install pngjs
 * Output: brand-assets/onboarding-background-coral-9x16.png, onboarding-background-blue-9x16.png
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const W = 1080;
const H = 1920;
const BASE = { r: 245, g: 240, b: 235 };
const OUT_DIR = path.join(__dirname, '..', 'brand-assets');

function parseColor(s) {
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return { r: 0, g: 0, b: 0, a: 0 };
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

// Linear gradient: start/end in 0..1 coords. Returns t in 0..1 for point (nx,ny) in 0..1.
function gradientT(nx, ny, start, end) {
  const dx = end.x - start.x, dy = end.y - start.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-10) return 0;
  let t = ((nx - start.x) * dx + (ny - start.y) * dy) / len2;
  return Math.max(0, Math.min(1, t));
}

function sampleStops(t, stops) {
  const parsed = stops.map(([loc, color]) => ({ loc, ...parseColor(color) }));
  if (t <= parsed[0].loc) return [parsed[0].r, parsed[0].g, parsed[0].b, parsed[0].a];
  if (t >= parsed[parsed.length - 1].loc) {
    const p = parsed[parsed.length - 1];
    return [p.r, p.g, p.b, p.a];
  }
  for (let i = 0; i < parsed.length - 1; i++) {
    const a = parsed[i], b = parsed[i + 1];
    if (t >= a.loc && t <= b.loc) {
      const u = (t - a.loc) / (b.loc - a.loc);
      return [
        Math.round(a.r + u * (b.r - a.r)),
        Math.round(a.g + u * (b.g - a.g)),
        Math.round(a.b + u * (b.b - a.b)),
        a.a + u * (b.a - a.a),
      ];
    }
  }
  return [0, 0, 0, 0];
}

function blendOver(bottom, top) {
  const [tr, tg, tb, ta] = top;
  if (ta <= 0) return bottom;
  if (ta >= 1) return top;
  const a = 1 - ta;
  return [
    Math.round(bottom[0] * a + tr * ta),
    Math.round(bottom[1] * a + tg * ta),
    Math.round(bottom[2] * a + tb * ta),
    Math.min(1, bottom[3] + ta * (1 - bottom[3])),
  ];
}

function drawLayer(w, h, start, end, stops, basePixels) {
  const out = basePixels.slice();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w, ny = y / h;
      const t = gradientT(nx, ny, start, end);
      const [r, g, b, a] = sampleStops(t, stops);
      const idx = (w * y + x) << 2;
      const bottom = [out[idx], out[idx + 1], out[idx + 2], out[idx + 3] / 255];
      const top = [r, g, b, a];
      const blended = blendOver(bottom, top);
      out[idx] = blended[0];
      out[idx + 1] = blended[1];
      out[idx + 2] = blended[2];
      out[idx + 3] = Math.round(blended[3] * 255);
    }
  }
  return out;
}

function renderCoral() {
  let pixels = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    pixels[i * 4] = BASE.r;
    pixels[i * 4 + 1] = BASE.g;
    pixels[i * 4 + 2] = BASE.b;
    pixels[i * 4 + 3] = 255;
  }
  const layer1 = [
    [0, 'rgba(232, 168, 124, 0.95)'],
    [0.2, 'rgba(238, 196, 160, 0.7)'],
    [0.4, 'rgba(242, 228, 216, 0.4)'],
    [0.6, 'rgba(245, 240, 235, 0.1)'],
    [1, 'rgba(245, 240, 235, 0)'],
  ];
  const layer2 = [
    [0, 'rgba(245, 240, 235, 0)'],
    [0.5, 'rgba(245, 240, 235, 0)'],
    [0.75, 'rgba(197, 228, 240, 0.2)'],
    [1, 'rgba(168, 216, 232, 0.35)'],
  ];
  pixels = drawLayer(W, H, { x: 0, y: 0 }, { x: 1, y: 0.8 }, layer1, pixels);
  pixels = drawLayer(W, H, { x: 0, y: 0 }, { x: 1, y: 1 }, layer2, pixels);
  return pixels;
}

function renderBlue() {
  let pixels = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    pixels[i * 4] = BASE.r;
    pixels[i * 4 + 1] = BASE.g;
    pixels[i * 4 + 2] = BASE.b;
    pixels[i * 4 + 3] = 255;
  }
  const layer1 = [
    [0, 'rgba(168, 216, 232, 0.8)'],
    [0.3, 'rgba(197, 228, 240, 0.6)'],
    [0.55, 'rgba(197, 228, 240, 0.35)'],
    [1, 'rgba(245, 240, 235, 0.1)'],
  ];
  const layer2 = [
    [0, 'rgba(245, 240, 235, 0)'],
    [0.5, 'rgba(245, 240, 235, 0)'],
    [0.75, 'rgba(232, 168, 124, 0.25)'],
    [1, 'rgba(238, 196, 160, 0.4)'],
  ];
  pixels = drawLayer(W, H, { x: 0.8, y: 0 }, { x: 0.2, y: 1 }, layer1, pixels);
  pixels = drawLayer(W, H, { x: 0.5, y: 0 }, { x: 0, y: 1 }, layer2, pixels);
  return pixels;
}

function writePng(pixels, filepath) {
  const png = new PNG({ width: W, height: H });
  for (let i = 0; i < pixels.length; i++) png.data[i] = pixels[i];
  return new Promise((resolve, reject) => {
    png.pack()
      .pipe(fs.createWriteStream(filepath))
      .on('finish', resolve)
      .on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const coralPath = path.join(OUT_DIR, 'onboarding-background-coral-9x16.png');
  await writePng(renderCoral(), coralPath);
  console.log('Wrote', coralPath);

  const bluePath = path.join(OUT_DIR, 'onboarding-background-blue-9x16.png');
  await writePng(renderBlue(), bluePath);
  console.log('Wrote', bluePath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
