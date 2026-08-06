/* Set 12 — Just a Pinch ("kitchen", z 20). Composition ported from
   reference/shift9-scene.js buildKitchen (island/back-wall/tablet envelope,
   softbox key, dust, steam, recipe-card idle beat are the contract), fidelity
   raised to the user's Set-12 reference image (2026-07-21): monolithic white
   island on a plinth shadow line, inset sink + chrome gooseneck tap, cabinet
   wall with hairline door seams, proud side towers, a recessed warm-lit prop
   niche, dark-bezel tablet running the live Pinch interface, SHIFT-9 painted
   on the stage floor. Hyper-real material + cinematic lighting pass (user
   directives, this session): image-based lighting on every PBR surface,
   clear-coated stone worktop with mineral speckle, painted-lacquer island and
   cabinets with orange-peel micro-relief, mirror chrome, glass/ceramic props,
   textured concrete stage floor, cool rim lights, warm under-cabinet strip,
   layered key-panel bloom. Recorded deviations from the reference builder,
   all toward the user's image: key panel lowered into frame, key cone
   tightened, light cone faded to a haze, island painted white. */
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { stageEnv } from '../environment';
import type { SetBuilder } from './index';

/* ── shared, generated-once assets (survive set streaming in/out) ────────── */

const smoothstep01 = (e0: number, e1: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const texCache = new Map<string, CanvasTexture>();
const cached = (key: string, make: () => CanvasTexture): CanvasTexture => {
  let t = texCache.get(key);
  if (!t) {
    t = make();
    texCache.set(key, t);
  }
  return t;
};

/** Fine monochrome noise — roughness/bump micro-variation ("orange peel"). */
const noiseTex = (key: string, base: number, amp: number, scale: number): CanvasTexture =>
  cached(key, () => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d')!;
    const img = x.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.max(0, Math.min(255, base + (Math.random() - 0.5) * 2 * amp));
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(scale, scale);
    return t;
  });

/** White quartz/marble worktop — domain-warped turbulent veining (real archviz
    technique), near-white with faint warm-grey veins and fine mineral flecks.
    Reads as photographed stone without a photo scan (Poly Haven is firewalled). */
const counterTex = (): CanvasTexture =>
  cached('counter', () => {
    const S = 1024;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d')!;
    x.fillStyle = '#f4f5f7';
    x.fillRect(0, 0, S, S);
    // value-noise field + fractal turbulence, sampled to place vein strokes
    const rand = (i: number, j: number): number => {
      const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const smooth = (t: number): number => t * t * (3 - 2 * t);
    const vnoise = (px: number, py: number): number => {
      const xi = Math.floor(px);
      const yi = Math.floor(py);
      const xf = smooth(px - xi);
      const yf = smooth(py - yi);
      const a = rand(xi, yi);
      const b = rand(xi + 1, yi);
      const c2 = rand(xi, yi + 1);
      const d = rand(xi + 1, yi + 1);
      return a + (b - a) * xf + (c2 - a) * yf + (a - b - c2 + d) * xf * yf;
    };
    const fbm = (px: number, py: number): number => {
      let v = 0;
      let amp = 0.5;
      let f = 1;
      for (let o = 0; o < 5; o++) {
        v += amp * vnoise(px * f, py * f);
        f *= 2;
        amp *= 0.5;
      }
      return v;
    };
    // draw veins where a domain-warped ridged field is near a threshold
    const img = x.getImageData(0, 0, S, S);
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const u = (px / S) * 6;
        const v = (py / S) * 6;
        const warp = fbm(u + 5.2, v + 1.3) * 2.4;
        const ridged = Math.abs(fbm(u + warp, v - warp) - 0.5);
        const vein = smoothstep01(0.03, 0.0, ridged); // 1 on the vein line
        const soft = smoothstep01(0.09, 0.02, ridged) * 0.35;
        const fleck = rand(px * 1.7, py * 1.3) > 0.985 ? 0.08 : 0;
        const dark = vein * 0.14 + soft * 0.06 + fleck;
        const i4 = (py * S + px) * 4;
        img.data[i4] = 244 - dark * 150;
        img.data[i4 + 1] = 245 - dark * 148;
        img.data[i4 + 2] = 247 - dark * 140;
        img.data[i4 + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(1.6, 0.9);
    return t;
  });

/** Poured-concrete stage floor — mottled patches, aggregate, trowel drift. */
const concreteTex = (): CanvasTexture =>
  cached('concrete', () => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d')!;
    x.fillStyle = '#212227';
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 46; i++) {
      // broad tonal blotches
      const r = 40 + Math.random() * 110;
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const lift = Math.random() < 0.5;
      const grd = x.createRadialGradient(px, py, 0, px, py, r);
      grd.addColorStop(0, lift ? 'rgba(58,60,68,0.16)' : 'rgba(10,10,13,0.18)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = grd;
      x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    for (let i = 0; i < 5200; i++) {
      // fine aggregate
      const g = 18 + Math.random() * 48;
      x.fillStyle = `rgba(${g},${g},${g + 4},${0.2 + Math.random() * 0.5})`;
      x.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
    }
    for (let i = 0; i < 26; i++) {
      // faint trowel arcs
      x.strokeStyle = `rgba(255,255,255,${0.008 + Math.random() * 0.014})`;
      x.lineWidth = 6 + Math.random() * 16;
      x.beginPath();
      x.arc(
        Math.random() * 512,
        Math.random() * 512,
        60 + Math.random() * 160,
        0,
        Math.PI * (0.3 + Math.random()),
      );
      x.stroke();
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(3, 3);
    return t;
  });

/* Soft elliptical contact shadow — bakes the photo's grounded look without a
   renderer-wide shadow-map change (engine core is Phase 2 contract). */
const contactShadow = (w: number, d: number, opacity: number): Mesh => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const grd = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, `rgba(0,0,0,${opacity})`);
  grd.addColorStop(0.55, `rgba(0,0,0,${opacity * 0.55})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = grd;
  x.fillRect(0, 0, 256, 256);
  const m = new Mesh(
    new PlaneGeometry(w, d),
    new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
};

/* Vertical soft-shadow gradient — ambient occlusion where the niche recess
   tucks under the cabinet row. */
const aoStrip = (w: number, h: number, opacity: number): Mesh => {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 128;
  const x = c.getContext('2d')!;
  const grd = x.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, `rgba(0,0,0,${opacity})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = grd;
  x.fillRect(0, 0, 8, 128);
  return new Mesh(
    new PlaneGeometry(w, h),
    new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }),
  );
};

/* The tablet's Pinch interface — warm food-forward layout (no cyber chrome),
   with the reference's idle beat: the recipe cards cycle every 2 s. */
const drawPinchScreen = (
  x: CanvasRenderingContext2D,
  w: number,
  h: number,
  card: number,
): void => {
  const cardColors = ['#ffb3a0', '#a0d8b0', '#f5d78e']; // reference palette, verbatim
  x.fillStyle = '#fbfefd';
  x.fillRect(0, 0, w, h);
  // header — coral dot + wordmark bar
  x.fillStyle = '#e8785e';
  x.beginPath();
  x.arc(26, 26, 9, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#3c4a48';
  x.fillRect(44, 20, 108, 12);
  x.fillStyle = '#17b3a6';
  x.beginPath();
  x.roundRect(w - 96, 14, 80, 26, 13);
  x.fill();
  // hero — plated dish photo (left) + copy lines (right)
  x.fillStyle = '#f0e6da';
  x.beginPath();
  x.roundRect(18, 54, 180, 128, 12);
  x.fill();
  x.fillStyle = '#fdfdfb';
  x.beginPath();
  x.arc(108, 118, 52, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#e09a5e';
  x.beginPath();
  x.arc(108, 118, 38, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#8fae62';
  x.beginPath();
  x.arc(92, 106, 10, 0, Math.PI * 2);
  x.arc(122, 126, 8, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#374644';
  x.fillRect(216, 62, 168, 14);
  x.fillRect(216, 84, 132, 14);
  x.fillStyle = '#9fb0ad';
  x.fillRect(216, 112, 176, 8);
  x.fillRect(216, 128, 158, 8);
  x.fillRect(216, 144, 166, 8);
  x.fillStyle = '#17b3a6';
  x.beginPath();
  x.roundRect(216, 162, 96, 24, 12);
  x.fill();
  // recipe card row — active card carries the cycling accent
  for (let i = 0; i < 3; i++) {
    const cx = 18 + i * 128;
    x.fillStyle = '#ffffff';
    x.beginPath();
    x.roundRect(cx, 198, 116, 84, 10);
    x.fill();
    x.fillStyle = i === card ? cardColors[card] : '#e4ebe9';
    x.beginPath();
    x.roundRect(cx, 198, 116, 46, 10);
    x.fill();
    x.fillStyle = '#9fb0ad';
    x.fillRect(cx + 10, 254, 84 - i * 14, 7);
    x.fillRect(cx + 10, 266, 62, 6);
  }
};

export const buildKitchen: SetBuilder = (engine, g, anims) => {
  const env = stageEnv(engine.renderer);

  // ── cinematic light rig ──
  // key — softbox panel low enough to sit in frame at the mark
  const key = engine.softbox(g, 0, 6.0, 0, 3.6, 2.1, 85);
  key.angle = 0.58; // tighten the pool so it hugs the island like the photo
  key.penumbra = 0.85;
  // volumetric haze cone — soft-edged, gently breathing (cinema stack)
  const volMat = new ShaderMaterial({
    vertexShader:
      'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        float body = pow(vUv.y, 2.6);
        float edge = pow(sin(vUv.x * 3.14159), 2.4);
        float drift = 0.9 + 0.1 * sin(uTime * 0.35 + vUv.y * 8.0 + vUv.x * 6.0);
        gl_FragColor = vec4(vec3(1.0), body * edge * drift * 0.006);
      }`,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const vol = new Mesh(new ConeGeometry(3.0, 5.9, 48, 1, true), volMat);
  vol.position.set(0, 5.9 / 2, 0);
  vol.rotation.y = Math.PI; // seam to the back
  g.add(vol);
  anims.push((t) => {
    volMat.uniforms.uTime.value = t;
  });
  // ── Phase 4 rig (3d-master-modeler) — cool clinical studio, not warm ──
  // the RectAreaLight KEY is emitted by softbox() above. This adds fill+rim.
  // faint halo so the panel itself reads as a glowing source (not the wall)
  const halo = engine.glow(0xffffff, 4.6);
  halo.material.opacity = 0.09;
  halo.position.set(0, 6.05, 0);
  g.add(halo);
  // FILL — cool, front-right, soft, ~1/4 key: opens the shadowed white faces
  //   without punching a hotspot (kept forward of the wall on purpose)
  const fill = new PointLight(0xe8eefc, 26, 22, 2);
  fill.position.set(3.4, 2.0, 6.0);
  g.add(fill);
  // even top-down wash on the back unit — placed HIGH and pulled back so its
  //   falloff pool lands above frame, not as a blob on the backsplash centre
  const ambientLift = new PointLight(0xf2f5fb, 10, 30, 1.4);
  ambientLift.position.set(0, 7.0, -1.0);
  g.add(ambientLift);
  // RIM — white, behind and above, draws the edge line off the black void
  for (const rx of [-5.6, 5.6]) {
    const rim = new PointLight(0xf0f4ff, 6, 9, 2);
    rim.position.set(rx, 3.4, -4.6);
    g.add(rim);
  }

  // ── materials — the hyper-real pass ──
  const peel = noiseTex('peel', 176, 26, 6); // painted-lacquer orange peel
  const satin = new MeshPhysicalMaterial({
    color: 0xe9ebee,
    roughness: 0.42,
    roughnessMap: peel,
    bumpMap: peel,
    bumpScale: 0.0035,
    metalness: 0.03,
    clearcoat: 0.28,
    clearcoatRoughness: 0.5,
    envMap: env,
    envMapIntensity: 0.35,
  });
  const stone = new MeshPhysicalMaterial({
    color: 0xffffff,
    map: counterTex(),
    roughness: 0.26,
    roughnessMap: noiseTex('stone-r', 150, 40, 3),
    metalness: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
    envMap: env,
    envMapIntensity: 0.5,
  });
  const cabinet = new MeshPhysicalMaterial({
    color: 0xe2e4e7,
    roughness: 0.5,
    roughnessMap: peel,
    bumpMap: peel,
    bumpScale: 0.0025,
    clearcoat: 0.18,
    clearcoatRoughness: 0.6,
    envMap: env,
    envMapIntensity: 0.28,
  });
  const towerMat = new MeshPhysicalMaterial({
    color: 0xf4f5f7,
    roughness: 0.4,
    roughnessMap: peel,
    bumpMap: peel,
    bumpScale: 0.003,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
    envMap: env,
    envMapIntensity: 0.32,
  });
  const seamDark = new MeshStandardMaterial({ color: 0x8d9096, roughness: 0.6 });

  // ── textured concrete overlay on the shared stage floor ──
  const concrete = new Mesh(
    new CircleGeometry(9, 64),
    new MeshStandardMaterial({
      map: concreteTex(),
      bumpMap: concreteTex(),
      bumpScale: 0.012,
      color: 0xbfc2c8,
      roughness: 0.88,
      metalness: 0.05,
    }),
  );
  concrete.rotation.x = -Math.PI / 2;
  concrete.position.y = 0.006;
  concrete.receiveShadow = true;
  g.add(concrete);

  // ── the island — reference envelope 6 × 1.15 × 1.6, top slab 6.2 × 0.07 ──
  const island = new Mesh(new RoundedBoxGeometry(6, 1.15, 1.6, 3, 0.03), satin);
  island.position.y = 0.575;
  island.castShadow = island.receiveShadow = true;
  g.add(island);
  const top = new Mesh(new RoundedBoxGeometry(6.2, 0.07, 1.75, 3, 0.018), stone);
  top.position.y = 1.185;
  top.castShadow = top.receiveShadow = true;
  g.add(top);
  // recessed dark plinth — the photo's island floats on a shadow line
  const plinth = new Mesh(
    new BoxGeometry(5.7, 0.09, 1.45),
    new MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.9 }),
  );
  plinth.position.y = 0.045;
  g.add(plinth);
  // faint front-panel seam, left third, as in the photo
  const seam = new Mesh(
    new BoxGeometry(0.008, 1.05, 0.008),
    new MeshStandardMaterial({ color: 0xb8bbc0, roughness: 0.6 }),
  );
  seam.position.set(-1.55, 0.6, 0.802);
  g.add(seam);
  const islandShadow = contactShadow(7.4, 2.9, 0.5);
  islandShadow.position.y = 0.012;
  g.add(islandShadow);

  // ── sink — a real recessed undermount basin, not a flat plate ──
  const steel = new MeshStandardMaterial({
    color: 0xb7bcc1,
    roughness: 0.3,
    roughnessMap: noiseTex('steel-r', 70, 30, 4),
    metalness: 1.0,
    envMap: env,
    envMapIntensity: 1.1,
  });
  const steelDark = new MeshStandardMaterial({
    color: 0x8f959b,
    roughness: 0.38,
    metalness: 1.0,
    envMap: env,
    envMapIntensity: 0.8,
  });
  const sink = new Group();
  const BW = 0.82;
  const BD = 0.44;
  const DEPTH = 0.13;
  // thin polished rim framing the cut in the worktop
  const rim = new Mesh(new BoxGeometry(BW + 0.06, 0.014, BD + 0.06), steel);
  rim.position.y = 0.004;
  sink.add(rim);
  // four basin walls + floor, tucked below the worktop surface
  const wallMat = steelDark;
  const wLR = new BoxGeometry(0.012, DEPTH, BD);
  for (const wx of [-BW / 2, BW / 2]) {
    const w = new Mesh(wLR, wallMat);
    w.position.set(wx, -DEPTH / 2, 0);
    sink.add(w);
  }
  const wFB = new BoxGeometry(BW, DEPTH, 0.012);
  for (const wz of [-BD / 2, BD / 2]) {
    const w = new Mesh(wFB, wallMat);
    w.position.set(0, -DEPTH / 2, wz);
    sink.add(w);
  }
  const basinFloor = new Mesh(new BoxGeometry(BW, 0.012, BD), steelDark);
  basinFloor.position.y = -DEPTH;
  basinFloor.receiveShadow = true;
  sink.add(basinFloor);
  // drain disc
  const drain = new Mesh(new CylinderGeometry(0.03, 0.03, 0.006, 20), steel);
  drain.position.set(0, -DEPTH + 0.006, 0);
  sink.add(drain);
  sink.position.set(1.72, 1.222, -0.02);
  g.add(sink);

  // ── gooseneck tap — one continuous swept tube (TubeGeometry) + lever ──
  const brushed = new MeshStandardMaterial({
    color: 0xc2c7cc,
    roughness: 0.22,
    roughnessMap: noiseTex('brushed-r', 60, 34, 6),
    metalness: 1.0,
    envMap: env,
    envMapIntensity: 1.25,
  });
  const tap = new Group();
  const base = new Mesh(new CylinderGeometry(0.04, 0.05, 0.045, 28), brushed);
  base.position.y = 0.022;
  tap.add(base);
  // the gooseneck: rises, arcs forward over the basin, drops to the spout
  const curve = new CatmullRomCurve3([
    new Vector3(0, 0.04, 0),
    new Vector3(0, 0.34, 0),
    new Vector3(0, 0.5, 0.03),
    new Vector3(0, 0.56, 0.14),
    new Vector3(0, 0.5, 0.24),
    new Vector3(0, 0.42, 0.26),
  ]);
  const neck = new Mesh(new TubeGeometry(curve, 48, 0.02, 18, false), brushed);
  tap.add(neck);
  // aerator tip at the spout
  const aerator = new Mesh(new CylinderGeometry(0.026, 0.022, 0.03, 20), brushed);
  aerator.position.set(0, 0.405, 0.26);
  tap.add(aerator);
  // single-lever handle, angled up off the base
  const lever = new Mesh(new CylinderGeometry(0.012, 0.012, 0.17, 16), brushed);
  lever.position.set(0.055, 0.12, -0.02);
  lever.rotation.z = Math.PI / 5;
  tap.add(lever);
  const leverCap = new Mesh(new SphereGeometry(0.016, 16, 12), brushed);
  leverCap.position.set(0.11, 0.19, -0.02);
  tap.add(leverCap);
  tap.position.set(2.18, 1.222, -0.42);
  tap.traverse((o) => {
    o.castShadow = true;
  });
  g.add(tap);

  // ── back unit — reference envelope 4.6 wide × 2.4 high around (0, 2.6) ──
  for (const tx of [-1.9, 1.9]) {
    const tower = new Mesh(new RoundedBoxGeometry(0.8, 2.44, 0.56, 3, 0.025), towerMat);
    tower.position.set(tx, 2.6, -2.19);
    tower.castShadow = tower.receiveShadow = true;
    g.add(tower);
  }
  const cabinets = new Mesh(new RoundedBoxGeometry(3.0, 1.0, 0.5, 3, 0.02), cabinet);
  cabinets.position.set(0, 3.3, -2.2);
  cabinets.castShadow = cabinets.receiveShadow = true;
  g.add(cabinets);
  for (const sx of [-0.5, 0.5]) {
    const ds = new Mesh(new BoxGeometry(0.01, 0.96, 0.03), seamDark);
    ds.position.set(sx, 3.3, -1.943);
    g.add(ds);
  }
  // the niche — a real recess: lit back panel, shelf, warm light, shadows
  const nicheBack = new Mesh(
    new BoxGeometry(3.0, 1.34, 0.05),
    // fully matte: the reference backsplash is flat clean white, no specular
    // catch of the key panel (that read as a glow blob before)
    new MeshStandardMaterial({ color: 0xdcdee2, roughness: 0.92, metalness: 0 }),
  );
  nicheBack.position.set(0, 2.13, -2.44);
  g.add(nicheBack);
  const nicheShelf = new Mesh(new BoxGeometry(3.0, 0.06, 0.56), stone);
  nicheShelf.position.set(0, 1.5, -2.19);
  nicheShelf.receiveShadow = true;
  g.add(nicheShelf);
  const nicheBase = new Mesh(new RoundedBoxGeometry(3.0, 0.4, 0.5, 2, 0.015), cabinet);
  nicheBase.position.set(0, 1.27, -2.2);
  g.add(nicheBase);
  const nicheAO = aoStrip(2.96, 0.7, 0.7);
  nicheAO.position.set(0, 2.45, -2.41);
  g.add(nicheAO);
  const nicheLight = new PointLight(0xfff3e2, 0.3, 2.6, 2);
  nicheLight.position.set(0, 2.35, -1.9);
  g.add(nicheLight);
  // warm under-cabinet strip — premium kitchen cue, feeds the niche glow
  const strip = new Mesh(
    new BoxGeometry(2.9, 0.015, 0.02),
    new MeshBasicMaterial({ color: 0xfff2df }),
  );
  strip.position.set(0, 2.792, -1.96);
  g.add(strip);
  const stripLight = new PointLight(0xffe9cf, 0.22, 1.4, 2);
  stripLight.position.set(0, 2.7, -2.05);
  g.add(stripLight);

  // ── fitted-kitchen detailing (3d-master-modeler Phase 2 refinement) ──
  const reveal = new MeshStandardMaterial({ color: 0x9a9ea3, roughness: 0.7 });
  // undermount shadow line under the worktop front lip — gives the slab weight
  const underReveal = new Mesh(new BoxGeometry(6.2, 0.02, 0.02), reveal);
  underReveal.position.set(0, 1.14, 0.86);
  g.add(underReveal);
  // handleless finger-pull reveals: thin dark gaps top-of-drawer / under-cabinet
  const islandPull = new Mesh(new BoxGeometry(2.7, 0.02, 0.018), reveal);
  islandPull.position.set(-0.05, 1.11, 0.802);
  g.add(islandPull);
  for (const cx of [-1.0, 0, 1.0]) {
    // vertical door seams on the upper cabinet fronts (three fitted doors)
    const v = new Mesh(new BoxGeometry(0.01, 0.9, 0.012), seamDark);
    v.position.set(cx, 3.3, -1.94);
    g.add(v);
  }
  // toe-kick shadow reveal at the base of the back towers
  const toeKick = new Mesh(new BoxGeometry(4.6, 0.12, 0.02), reveal);
  toeKick.position.set(0, 1.44, -1.92);
  g.add(toeKick);
  // tablet kickstand — the slab now rests on the counter instead of floating
  const stand = new Mesh(
    new BoxGeometry(0.3, 0.24, 0.02),
    new MeshStandardMaterial({ color: 0x14161a, roughness: 0.5, metalness: 0.4, envMap: env }),
  );
  stand.position.set(-1.5, 1.44, -0.02);
  stand.rotation.x = 0.42;
  stand.castShadow = true;
  g.add(stand);
  // props on the shelf — real refractive-glass vases, turned from a silhouette
  //   profile (LatheGeometry). MeshPhysicalMaterial transmission = true glass:
  //   light passes through, refracts (IOR 1.5), picks up the rim highlight.
  const glassVase = (
    profile: [number, number][],
    tint: number,
    tintDepth: number,
  ): Mesh => {
    const pts = profile.map(([r, y]) => new Vector2(r, y));
    const geo = new LatheGeometry(pts, 48);
    const mat = new MeshPhysicalMaterial({
      color: tint,
      roughness: 0.06,
      metalness: 0,
      transmission: 1,
      ior: 1.5,
      thickness: tintDepth,
      attenuationColor: tint,
      attenuationDistance: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMap: env,
      envMapIntensity: 0.9,
      transparent: true,
    });
    const m = new Mesh(geo, mat);
    m.castShadow = true;
    return m;
  };
  // tall slim carafe — clear glass
  const vaseA = glassVase(
    [
      [0.0, 0.0],
      [0.055, 0.0],
      [0.06, 0.02],
      [0.06, 0.24],
      [0.03, 0.3],
      [0.028, 0.34],
      [0.03, 0.36],
      [0.0, 0.36],
    ],
    0xeef4f2,
    0.05,
  );
  vaseA.position.set(-0.42, 1.53, -2.12);
  g.add(vaseA);
  // rounded bud vase — faint sea-green glass
  const vaseB = glassVase(
    [
      [0.0, 0.0],
      [0.05, 0.0],
      [0.075, 0.06],
      [0.07, 0.13],
      [0.04, 0.19],
      [0.038, 0.22],
      [0.0, 0.22],
    ],
    0xd8e8e0,
    0.06,
  );
  vaseB.position.set(-0.58, 1.53, -2.18);
  g.add(vaseB);
  // low tumbler — clear, thick base
  const vaseC = glassVase(
    [
      [0.0, 0.0],
      [0.06, 0.0],
      [0.062, 0.02],
      [0.055, 0.1],
      [0.05, 0.12],
      [0.0, 0.12],
    ],
    0xeef2f4,
    0.07,
  );
  vaseC.position.set(-0.2, 1.53, -2.16);
  g.add(vaseC);
  const backShadow = contactShadow(5.2, 1.6, 0.45);
  backShadow.position.set(0, 0.012, -2.2);
  g.add(backShadow);

  // ── the tablet — reference position/tilt, dark bezel + live Pinch screen ──
  const tc = document.createElement('canvas');
  tc.width = 416;
  tc.height = 296;
  const tcx = tc.getContext('2d')!;
  drawPinchScreen(tcx, 416, 296, 0);
  const ttex = new CanvasTexture(tc);
  ttex.colorSpace = SRGBColorSpace;
  const tablet = new Group();
  const bezel = new Mesh(
    new RoundedBoxGeometry(0.85, 0.6, 0.04, 3, 0.012),
    new MeshStandardMaterial({
      color: 0x191b1e,
      roughness: 0.35,
      roughnessMap: noiseTex('bezel-r', 90, 20, 2),
      metalness: 0.6,
      envMap: env,
      envMapIntensity: 0.6,
    }),
  );
  tablet.add(bezel);
  const screen = new Mesh(
    new PlaneGeometry(0.79, 0.545),
    new MeshBasicMaterial({ map: ttex }),
  );
  screen.position.z = 0.021;
  tablet.add(screen);
  tablet.position.set(-1.5, 1.55, 0.1);
  tablet.rotation.x = -0.18;
  bezel.castShadow = true;
  g.add(tablet);
  const tg = engine.glow(0x9fe8ec, 1.4);
  tg.material.opacity = 0.55;
  tg.position.copy(tablet.position);
  g.add(tg);
  const pl = new PointLight(0xbfeef0, 5, 4);
  pl.position.set(-1.5, 1.6, 0.5);
  g.add(pl);

  // ── SHIFT-9 painted on the stage floor, in front of the island ──
  const fc = document.createElement('canvas');
  fc.width = 1024;
  fc.height = 256;
  const fx = fc.getContext('2d')!;
  fx.fillStyle = '#6f747b';
  fx.font = 'italic 900 148px "Arial Black", "Helvetica Neue", Arial, sans-serif';
  fx.textAlign = 'center';
  fx.textBaseline = 'middle';
  fx.fillText('SHIFT-9', 512, 132);
  const floorText = new Mesh(
    new PlaneGeometry(2.6, 0.65),
    new MeshBasicMaterial({
      map: new CanvasTexture(fc),
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  floorText.rotation.x = -Math.PI / 2;
  floorText.position.set(0, 0.013, 3.0);
  g.add(floorText);

  // atmosphere — reference contract, verbatim
  anims.push(engine.dustPlane(g, 0xffffff, 5, 6, 0, 3.5, -1));

  // idle beat: tablet cycles recipe cards; soft steam rises off the counter
  const wisps: ReturnType<typeof engine.glow>[] = [];
  for (let i = 0; i < 3; i++) {
    const s = engine.glow(0xffffff, 0.9);
    s.material.opacity = 0;
    g.add(s);
    wisps.push(s);
  }
  let cardShown = -1;
  anims.push((t) => {
    const ci = ((t / 2) | 0) % 3;
    if (ci !== cardShown) {
      cardShown = ci;
      drawPinchScreen(tcx, 416, 296, ci);
      ttex.needsUpdate = true;
    }
    const k = engine.idleK(g);
    wisps.forEach((s, i) => {
      const c = (t * 0.3 + i / 3) % 1;
      s.position.set(1.6 + Math.sin(t + i) * 0.15, 1.35 + c * 1.6, 0.2);
      s.material.opacity = k * (1 - c) * 0.16;
    });
  });
};

/* Colour note (CLAUDE.md token rule): this file paints a 3D film set, not UI —
   hex values here are set-dressing pigments from the reference scene and the
   user's Set-12 reference image, matching the studio app's existing convention
   (constants.ts / projects.ts carry the same literal scene colours). */
