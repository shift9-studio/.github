/* Procedural PBR texture factory — rust, concrete, brushed metal, steel plate,
   chalkboard, code screens, floor branding. Everything is generated at runtime
   (no downloads), with real normal maps derived from height via Sobel, so the
   sets read as photographed material under the post stack instead of flat color. */
import * as THREE from 'three/webgpu';

type Ctx = CanvasRenderingContext2D;

function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

/* deterministic-ish multi-octave value noise painted with soft radial blobs */
function paintNoise(ctx: Ctx, w: number, h: number, octaves: number, alpha: number, seedShift = 0) {
  let n = 0;
  for (let o = 0; o < octaves; o++) {
    const count = 40 * (o + 1) ** 2;
    const r = Math.max(2, (w / 6) / (o + 1) ** 1.4);
    for (let i = 0; i < count; i++) {
      n++;
      const x = (Math.sin(n * 127.1 + seedShift) * 43758.5453) % 1 * w;
      const y = (Math.sin(n * 311.7 + seedShift) * 12543.3) % 1 * h;
      const v = ((Math.sin(n * 74.7 + seedShift) * 9631.4) % 1 + 1) / 2;
      const g = ctx.createRadialGradient(Math.abs(x), Math.abs(y), 0, Math.abs(x), Math.abs(y), r);
      const lum = Math.floor(v * 255);
      g.addColorStop(0, `rgba(${lum},${lum},${lum},${alpha / (o + 1)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.abs(x) - r, Math.abs(y) - r, r * 2, r * 2);
    }
  }
}

/* Sobel height→normal */
function normalFrom(src: HTMLCanvasElement, strength = 1.5): THREE.CanvasTexture {
  const w = src.width, h = src.height;
  const [out, octx] = canvas(w, h);
  const data = src.getContext('2d')!.getImageData(0, 0, w, h).data;
  const hAt = (x: number, y: number) => data[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  const img = octx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * strength;
    const dy = (hAt(x, y + 1) - hAt(x, y - 1)) * strength;
    const inv = 1 / Math.hypot(dx, dy, 1);
    const i = (y * w + x) * 4;
    img.data[i] = (-dx * inv * 0.5 + 0.5) * 255;
    img.data[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
    img.data[i + 2] = inv * 255;
    img.data[i + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(out);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function tex(c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export interface PBRSet { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture; roughnessMap?: THREE.CanvasTexture; }

/* ── rusted industrial steel (Midnight Return walls) ── */
export function rustSteel(size = 512, seed = 0): PBRSet {
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = '#5a4f45'; ctx.fillRect(0, 0, size, size);
  paintNoise(ctx, size, size, 3, 0.35, seed);
  // rust blooms: warm patches
  ctx.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 90; i++) {
    const x = (Math.sin(i * 91.3 + seed) * 47000 % 1 + 1) / 2 * size;
    const y = (Math.sin(i * 53.7 + seed) * 31000 % 1 + 1) / 2 * size;
    const r = 8 + ((Math.sin(i * 17.9) * 999 % 1 + 1) / 2) * 46;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(146,74,34,0.55)'); g.addColorStop(0.6, 'rgba(96,48,26,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  // drip streaks
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 60; i++) {
    const x = (Math.sin(i * 41.7 + seed) * 5000 % 1 + 1) / 2 * size;
    const y0 = (Math.sin(i * 23.3 + seed) * 700 % 1 + 1) / 2 * size * 0.6;
    const len = 30 + ((Math.sin(i * 3.1) * 99 % 1 + 1) / 2) * 120;
    const grad = ctx.createLinearGradient(0, y0, 0, y0 + len);
    grad.addColorStop(0, '#6e3a1c'); grad.addColorStop(1, 'rgba(40,24,14,0)');
    ctx.fillStyle = grad; ctx.fillRect(x, y0, 1.6 + (i % 3), len);
  }
  ctx.globalAlpha = 1;
  // panel seams
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 3;
  for (const p of [0.33, 0.66]) { ctx.beginPath(); ctx.moveTo(0, size * p); ctx.lineTo(size, size * p); ctx.stroke(); }
  // height for normal: reuse luminance + seams
  const [hc, hctx] = canvas(size, size);
  hctx.drawImage(c, 0, 0);
  return { map: tex(c), normalMap: normalFrom(hc, 2.2) };
}

/* ── raw concrete (floors) ── */
export function concrete(size = 512, tone = '#8d8f92'): PBRSet {
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = tone; ctx.fillRect(0, 0, size, size);
  paintNoise(ctx, size, size, 3, 0.16, 7);
  // speckle
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() - 0.5) * 22;
    img.data[i] += v; img.data[i + 1] += v; img.data[i + 2] += v;
  }
  ctx.putImageData(img, 0, 0);
  // faint stains
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * size, y = Math.random() * size, r = 30 + Math.random() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, '#3a3c40'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  const [hc, hctx] = canvas(size, size); hctx.drawImage(c, 0, 0);
  return { map: tex(c), normalMap: normalFrom(hc, 0.8) };
}

/* ── brushed dark metal (consoles, press) ── */
export function brushedMetal(size = 512, tone = '#2e3136', vertical = false): PBRSet {
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = tone; ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.10;
  for (let i = 0; i < 1400; i++) {
    const p = Math.random() * size, len = 40 + Math.random() * 200, o = Math.random() * size;
    const lum = 120 + Math.random() * 110 | 0;
    ctx.strokeStyle = `rgb(${lum},${lum},${lum + 6})`; ctx.lineWidth = 0.7;
    ctx.beginPath();
    if (vertical) { ctx.moveTo(p, o); ctx.lineTo(p, o + len); } else { ctx.moveTo(o, p); ctx.lineTo(o + len, p); }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const [hc, hctx] = canvas(size, size); hctx.drawImage(c, 0, 0);
  return { map: tex(c), normalMap: normalFrom(hc, 0.5) };
}

/* ── steel floor plate with embossed text (SHIFT-9 stamp) ── */
export function stampedPlate(text: string, w = 1024, h = 512): PBRSet {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#26262a'; ctx.fillRect(0, 0, w, h);
  paintNoise(ctx, w, h, 3, 0.3, 3);
  ctx.globalAlpha = 0.5; ctx.fillStyle = '#151517'; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
  // height map: bright = raised letters
  const [hc, hctx] = canvas(w, h);
  hctx.fillStyle = '#808080'; hctx.fillRect(0, 0, w, h);
  paintNoise(hctx, w, h, 2, 0.2, 9);
  const drawText = (target: Ctx, fill: string) => {
    target.font = `900 ${h * 0.42}px Arial, sans-serif`;
    target.textAlign = 'center'; target.textBaseline = 'middle';
    (target as Ctx & { letterSpacing?: string }).letterSpacing = `${h * 0.04}px`;
    target.fillStyle = fill;
    target.fillText(text, w / 2, h / 2);
  };
  drawText(hctx, '#e8e8e8');
  drawText(ctx, 'rgba(118,120,126,0.8)');   // catch light on the raised faces
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3;
  ctx.font = `900 ${h * 0.42}px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeText(text, w / 2, h / 2);
  return { map: tex(c), normalMap: normalFrom(hc, 2.6) };
}

/* ── subtle painted floor branding (kitchen "SHIFT-9") ── */
export function floorBrand(text: string, color = 'rgba(120,122,128,0.85)') {
  const [c, ctx] = canvas(1024, 320);
  ctx.clearRect(0, 0, 1024, 320);
  ctx.font = '900 200px Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '14px';
  ctx.fillStyle = color;
  ctx.fillText(text, 512, 168);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/* ── chalk schematic blackboard (Game Design Forge) ── */
export function chalkboard(w = 1024, h = 512) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#20242a'; ctx.fillRect(0, 0, w, h);
  paintNoise(ctx, w, h, 2, 0.08, 5);
  ctx.strokeStyle = 'rgba(220,224,230,0.5)'; ctx.lineWidth = 2; ctx.font = '18px monospace';
  ctx.fillStyle = 'rgba(220,224,230,0.5)';
  const box = (x: number, y: number, bw: number, bh: number, label: string) => {
    ctx.strokeRect(x, y, bw, bh); ctx.fillText(label, x + 8, y + 22);
  };
  box(60, 60, 190, 90, 'INPUT'); box(60, 220, 190, 90, 'STATE'); box(60, 380, 190, 80, 'FSM');
  box(420, 140, 220, 110, 'LOOP dt'); box(430, 340, 200, 90, 'RENDER');
  box(760, 80, 200, 100, 'PHYSICS'); box(760, 300, 200, 110, 'FEEL++');
  ctx.beginPath(); ctx.moveTo(250, 105); ctx.lineTo(420, 180); ctx.moveTo(250, 265); ctx.lineTo(420, 210);
  ctx.moveTo(640, 195); ctx.lineTo(760, 130); ctx.moveTo(640, 205); ctx.lineTo(760, 350);
  ctx.moveTo(530, 250); ctx.lineTo(530, 340); ctx.stroke();
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.25 + Math.random() * 0.3;
    ctx.beginPath();
    const x = Math.random() * w, y = Math.random() * h;
    ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 30); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return tex(c);
}

/* ── animated code screen (returns texture + redraw) ── */
export function codeScreen(w = 512, h = 320, accent = '#7fd4ff') {
  const [c, ctx] = canvas(w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const draw = (tt: number) => {
    ctx.fillStyle = '#0b1016'; ctx.fillRect(0, 0, w, h);
    ctx.font = '12px monospace';
    const lines = (h - 24) / 16 | 0;
    for (let i = 0; i < lines; i++) {
      const n = (i * 31 + (tt * 2 | 0)) % 40;
      const indent = (n % 4) * 18;
      const len = 40 + (Math.sin(i * 3.7 + (tt | 0)) + 1) * 90;
      ctx.fillStyle = i % 7 === 0 ? accent : (i % 5 === 0 ? '#8a93a6' : '#3f65d9');
      ctx.fillRect(14 + indent, 14 + i * 16, len, 8);
      ctx.fillStyle = '#22304a'; ctx.fillRect(14 + indent + len + 8, 14 + i * 16, 30, 8);
    }
    const cy = 14 + (((tt * 3 | 0) % lines) * 16);
    if ((tt * 2 | 0) % 2) { ctx.fillStyle = '#e8f4ff'; ctx.fillRect(6, cy, 4, 10); }
    t.needsUpdate = true;
  };
  draw(0);
  return { tex: t, draw };
}

/* ── glowing neon tube sign from a path (WinFix wrench) ── */
export function neonWrench(size = 512) {
  const [c, ctx] = canvas(size, size);
  ctx.clearRect(0, 0, size, size);
  const path = () => {
    ctx.beginPath();
    // open-end wrench silhouette, diagonal
    ctx.moveTo(120, 392);
    ctx.lineTo(300, 212);
    ctx.arc(330, 182, 42, 2.35, 5.9, false);
    ctx.lineTo(392, 120);
    ctx.arc(360, 152, 46, 5.9, 2.35, true);
    ctx.lineTo(150, 422);
    ctx.arc(135, 407, 21, 0.8, 3.9, false);
    ctx.closePath();
  };
  for (const [blur, alpha, width] of [[26, 0.5, 10], [12, 0.8, 7], [0, 1, 4]] as const) {
    ctx.save();
    ctx.shadowColor = 'rgba(235,245,255,0.9)'; ctx.shadowBlur = blur;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    path(); ctx.stroke();
    ctx.restore();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/* ── clean cabinet fronts (kitchen uppers) ── */
export function cabinetFronts(w = 1024, h = 256, doors = 4) {
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#f2f3f5'; ctx.fillRect(0, 0, w, h);
  const dw = w / doors;
  for (let i = 0; i < doors; i++) {
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 3;
    ctx.strokeRect(i * dw + 4, 4, dw - 8, h - 8);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(i * dw + 4, 4, 2, h - 8);
  }
  const [hc, hctx] = canvas(w, h);
  hctx.fillStyle = '#aaa'; hctx.fillRect(0, 0, w, h);
  hctx.strokeStyle = '#555'; hctx.lineWidth = 4;
  for (let i = 0; i < doors; i++) hctx.strokeRect(i * dw + 4, 4, dw - 8, h - 8);
  return { map: tex(c), normalMap: normalFrom(hc, 1.4) };
}

/* ── arcade cabinet side art ── */
export function arcadeSideArt(w = 256, h = 640) {
  const [c, ctx] = canvas(w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1a1024'); g.addColorStop(1, '#0c0a14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const stripe = (x0: number, col: string) => {
    ctx.strokeStyle = col; ctx.lineWidth = 10; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(x0, h); ctx.lineTo(x0 + 120, 0); ctx.stroke();
    ctx.globalAlpha = 1;
  };
  stripe(30, '#ff00aa'); stripe(70, '#00e5ff'); stripe(110, '#ffe000');
  // voxel ball motif
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    if (Math.hypot(i - 2, j - 2) < 2.5) { ctx.fillStyle = (i + j) % 2 ? '#ff8800' : '#ff5500'; ctx.fillRect(150 + i * 14, 120 + j * 14, 13, 13); }
  }
  return tex(c);
}
