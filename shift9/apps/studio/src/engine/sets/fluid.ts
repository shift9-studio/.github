/* Set 11 — Flow State ("fluid", z -3). Composition ported from
   reference/shift9-scene.js buildFluid (obsidian pool + a glowing blue hero at
   ~y1.9, blue key/rim rig, blue dust, expanding voice-ripple idle beat — that's
   the contract), fidelity raised to the user's Set-11 reference brief
   (2026-07-22): "A dark, obsidian studio space containing a perfectly clear
   vessel with glowing, low-viscosity blue fluid. Lit to emphasize refraction
   and complex laminar flow patterns." So the churning shader-orb becomes a real
   turned glass vessel (LatheGeometry, MeshPhysicalMaterial transmission=1 — the
   kitchen's proven refractive-glass trick) standing on a machined obsidian
   plinth, filled with an emissive low-viscosity fluid that flows in laminar
   sheets and is refracted through the curved glass. Cinema stack inherited from
   the engine (N8AO + bloom + film grade, RectAreaLight softbox, stageEnv IBL,
   fixed dust). Formal cool 3-point rig matched to the reference's obsidian mood:
   wash HIGH and BACK, cool fill at ~1/4 key, blue rim for void separation, plus
   the fluid's own blue light pooling on the wet floor.

   Flow State is local, on-device voice dictation (accent #0033FF) — the ripple
   idle beat reads as speech landing on the pool. */
import {
  AdditiveBlending,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  ConeGeometry,
  DoubleSide,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { stageEnv } from '../environment';
import type { SetBuilder } from './index';

/* ── shared, generated-once assets (survive set streaming in/out) ────────── */

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

/** Polished-obsidian stage floor — near-black volcanic glass with faint swirled
    banding and a scatter of tiny bright inclusions that the wet clearcoat can
    catch. Reads as a mirror-dark pool without a photo scan (egress is blocked). */
const obsidianTex = (): CanvasTexture =>
  cached('obsidian', () => {
    const S = 1024;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d')!;
    x.fillStyle = '#04060c';
    x.fillRect(0, 0, S, S);
    // broad swirled banding — the flow-banding of cooled volcanic glass
    for (let i = 0; i < 22; i++) {
      x.strokeStyle = `rgba(${18 + Math.random() * 26},${22 + Math.random() * 30},${40 + Math.random() * 50},${0.05 + Math.random() * 0.08})`;
      x.lineWidth = 40 + Math.random() * 120;
      x.beginPath();
      const cx = Math.random() * S;
      const cy = Math.random() * S;
      x.arc(cx, cy, 120 + Math.random() * 360, Math.random() * 6.28, Math.random() * 6.28);
      x.stroke();
    }
    // faint cool sheen blotches
    for (let i = 0; i < 30; i++) {
      const r = 60 + Math.random() * 180;
      const px = Math.random() * S;
      const py = Math.random() * S;
      const grd = x.createRadialGradient(px, py, 0, px, py, r);
      grd.addColorStop(0, 'rgba(30,44,72,0.10)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = grd;
      x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    // tiny bright mineral inclusions
    for (let i = 0; i < 900; i++) {
      const g = 60 + Math.random() * 90;
      x.fillStyle = `rgba(${g},${g + 10},${g + 30},${0.15 + Math.random() * 0.4})`;
      x.fillRect(Math.random() * S, Math.random() * S, 1, 1);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  });

/* Soft blue radial decal — the fluid's own glow pooling on the wet obsidian
   directly under the vessel (additive, sits just above the pool surface). */
const glowPool = (r: number, color: string): Mesh => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const grd = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, color);
  grd.addColorStop(0.4, color.replace('1)', '0.35)'));
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = grd;
  x.fillRect(0, 0, 256, 256);
  const m = new Mesh(
    new PlaneGeometry(r, r),
    new MeshBasicMaterial({
      map: new CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
};

/* ── the hero fluid shader — emissive low-viscosity blue liquid, flowing in
   laminar sheets. Opaque (so the glass vessel's transmission pass captures and
   refracts it), unlit, tuned bright so bloom lifts the highlights into a glow.
   3D value-noise fbm drives drifting sheets + caustic streaks; a fresnel rim
   and a radial core make the body read as luminous volume, not a flat ball. */
const FLUID_VERT = `
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vPos = position;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const FLUID_FRAG = `
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vView;
  float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9,78.2,37.7))) * 43758.5453); }
  float noise(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y), f.z);
  }
  float fbm(vec3 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }
  void main(){
    vec3 p = vPos * 2.4;
    float flow = uTime * 0.28;
    // laminar drift: the field scrolls slowly upward, warped by a slower swirl
    float swirl = fbm(vPos * 1.1 + vec3(0.0, flow * 0.5, uTime * 0.06));
    vec3 q = p; q.y -= flow;
    float sheets = fbm(q + swirl * 1.3);
    // thin caustic streaks riding the sheets
    float streak = abs(sin(vPos.y * 7.0 + swirl * 5.0 + uTime * 0.7));
    streak = pow(streak, 3.0);
    float lam = sheets * 0.75 + streak * 0.35;
    // fresnel rim + radial core → luminous volume
    float fres = pow(1.0 - max(dot(normalize(vN), normalize(vView)), 0.0), 2.2);
    float core = smoothstep(1.05, 0.0, length(vPos));
    float e = clamp(lam * 0.85 + core * 0.55 + fres * 0.65, 0.0, 1.3);
    vec3 deep = vec3(0.0, 0.06, 0.42);   // deep electric blue (#0033FF family)
    vec3 lit  = vec3(0.30, 0.60, 1.0);   // bright glowing blue-white
    vec3 col = mix(deep, lit, clamp(e, 0.0, 1.0));
    col += fres * vec3(0.12, 0.34, 0.85);
    gl_FragColor = vec4(col, 1.0);
  }`;

export const buildFluid: SetBuilder = (engine, g, anims) => {
  const env = stageEnv(engine.renderer);

  // ── the obsidian pool — wet volcanic-glass floor, mirror-dark, over the
  //    shared soundstage floor. Low roughness + clearcoat so the blue glow and
  //    the vessel silhouette pool as a soft reflection. ──
  const pool = new Mesh(
    // radius 12 (engine floor is 9) and lifted 20mm clear: covers the shared
    //   disc with no coincident edge to z-fight, and pushes its own rim out of
    //   frame even at the wide mark so no hard disc-edge line reads
    new CircleGeometry(12, 96),
    new MeshPhysicalMaterial({
      color: 0x04060c,
      map: obsidianTex(),
      roughness: 0.24,
      roughnessMap: noiseTex('obsidian-r', 40, 26, 4),
      metalness: 0.5,
      // wet clearcoat kept, but broadened: a tight coat turned the vessel's
      //   reflection into a hard "comet" streak — a softer coat pools it into a
      //   diffuse blue glow, which reads as polished-but-real studio obsidian
      clearcoat: 0.9,
      clearcoatRoughness: 0.4,
      envMap: env,
      envMapIntensity: 0.75,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.02;
  pool.receiveShadow = true;
  g.add(pool);
  // the fluid's glow spilling onto the wet floor under the vessel
  const spill = glowPool(5.2, 'rgba(22,70,225,1)');
  spill.position.y = 0.03;
  g.add(spill);

  // ── cool 3-point rig matched to the obsidian mood ──
  // key — cool-white softbox HIGH and pulled BACK so the panel and its falloff
  //   sit above frame at the mark (reference chiaroscuro: the source is felt,
  //   not stared at); tight angle to hug the vessel.
  const key = engine.softbox(g, 0, 9.0, -0.8, 1.9, 1.2, 78, 0xeaf0ff);
  key.angle = 0.48;
  key.penumbra = 0.9;
  // FILL — cool blue, front-right, soft, ~1/4 key: opens the shadowed glass
  //   side without punching a hotspot (kept forward of the vessel on purpose)
  const fill = new PointLight(0x6a8cff, 14, 22, 2);
  fill.position.set(3.0, 3.0, 5.2); // higher so its wet-floor reflection stays soft, not a blob
  g.add(fill);
  // RIM — bright blue-white, behind and above, lifts the glass edge off the void
  for (const rx of [-3.4, 3.4]) {
    const rim = new PointLight(0x9fc0ff, 7, 10, 2);
    rim.position.set(rx, 3.4, -3.6);
    g.add(rim);
  }
  // the fluid's own light — blue point at the vessel core, washes the plinth and
  //   pools blue on the obsidian (the reference's "glowing fluid" as a source)
  const fluidLight = new PointLight(0x2a5cff, 5, 9, 2);
  fluidLight.position.set(0, 1.8, 0);
  g.add(fluidLight);

  // volumetric key haze — soft cool cone, very low opacity, gently breathing
  const volMat = new ShaderMaterial({
    vertexShader:
      'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        float body = pow(vUv.y, 2.6);
        float edge = pow(sin(vUv.x * 3.14159), 2.4);
        float drift = 0.9 + 0.1 * sin(uTime * 0.3 + vUv.y * 8.0 + vUv.x * 6.0);
        gl_FragColor = vec4(vec3(0.82, 0.88, 1.0), body * edge * drift * 0.007);
      }`,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const vol = new Mesh(new ConeGeometry(3.0, 6.2, 48, 1, true), volMat);
  vol.position.set(0, 6.2 / 2, -0.6);
  vol.rotation.y = Math.PI;
  g.add(vol);

  // ── the machined obsidian plinth the vessel stands on ──
  const plinthMat = new MeshPhysicalMaterial({
    color: 0x07080d,
    roughness: 0.2,
    roughnessMap: noiseTex('plinth-r', 60, 22, 3),
    metalness: 0.4,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    envMap: env,
    envMapIntensity: 0.6,
  });
  // turned profile — chamfered foot, tapered body, a slim inset seat on top
  const plinth = new Mesh(
    new LatheGeometry(
      [
        [0.0, 0.0],
        [0.78, 0.0],
        [0.8, 0.03],
        [0.8, 0.06],
        [0.7, 0.1],
        [0.66, 0.78],
        [0.64, 0.82],
        [0.5, 0.85],
        [0.46, 0.85],
        [0.46, 0.83],
        [0.0, 0.83],
      ].map(([r, y]) => new Vector2(r, y)),
      64,
    ),
    plinthMat,
  );
  // receiveShadow only — a cast plinth shadow projected forward onto the
  //   blue-lit pool as a hard geometric wedge; N8AO + the dark obsidian already
  //   ground it, so the cast shadow is pure liability here
  plinth.receiveShadow = true;
  g.add(plinth);
  // brushed-steel collar ring where the vessel meets the plinth (product cue)
  const steel = new MeshStandardMaterial({
    color: 0xc4c9d0,
    roughness: 0.24,
    roughnessMap: noiseTex('steel-r', 60, 30, 6),
    metalness: 1.0,
    envMap: env,
    envMapIntensity: 1.15,
  });
  const collar = new Mesh(
    new LatheGeometry(
      [
        [0.46, 0.0],
        [0.5, 0.0],
        [0.5, 0.035],
        [0.46, 0.035],
      ].map(([r, y]) => new Vector2(r, y)),
      64,
    ),
    steel,
  );
  collar.position.y = 0.85;
  collar.castShadow = true;
  g.add(collar);
  // (no baked contact-shadow disc here — the obsidian pool is already near-black,
  //  and the softbox spot + N8AO ground the plinth; a dark decal only muddied it)

  // ── the hero: a perfectly clear turned-glass vessel on the plinth ──
  const VBASE = 0.885; // top of the collar — vessel foot sits here
  // glass silhouette: rounded foot → bulbous belly → shouldered neck → lip
  const glassProfile: [number, number][] = [
    [0.0, 0.0],
    [0.4, 0.0],
    [0.46, 0.05],
    [0.6, 0.5],
    [0.66, 0.95],
    [0.63, 1.2],
    [0.44, 1.48],
    [0.26, 1.62],
    [0.25, 1.72],
    [0.28, 1.75],
  ];
  const glass = new Mesh(
    new LatheGeometry(
      glassProfile.map(([r, y]) => new Vector2(r, y)),
      96,
    ),
    new MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.04,
      metalness: 0,
      transmission: 1,
      ior: 1.5,
      thickness: 0.45,
      attenuationColor: 0xeaf2ff,
      attenuationDistance: 1.4,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMap: env,
      envMapIntensity: 1.0,
      transparent: true,
      side: DoubleSide,
    }),
  );
  glass.position.y = VBASE;
  g.add(glass);

  // the glowing fluid inside — a shorter body filled to ~72%, flat meniscus top,
  //   sitting just inside the glass wall so the curved glass refracts it
  const fluidMat = new ShaderMaterial({
    vertexShader: FLUID_VERT,
    fragmentShader: FLUID_FRAG,
    uniforms: { uTime: { value: 0 } },
  });
  const fluid = new Mesh(
    new LatheGeometry(
      [
        [0.0, 0.0],
        [0.36, 0.0],
        [0.53, 0.5],
        [0.58, 0.9],
        [0.54, 1.1],
        [0.46, 1.24],
        [0.4, 1.3],
        [0.0, 1.3],
      ].map(([r, y]) => new Vector2(r, y)),
      72,
    ),
    fluidMat,
  );
  fluid.position.y = VBASE + 0.05;
  g.add(fluid);
  // a soft glow sprite behind the fluid so the whole vessel blooms
  const orbGlow = engine.glow(0x2a5cff, 2.2);
  orbGlow.material.opacity = 0.32;
  orbGlow.position.set(0, VBASE + 0.8, 0);
  g.add(orbGlow);

  // ── laminar detail — three slow filaments of fluid convecting up the belly,
  //    swept tubes (TubeGeometry) glowing the same blue, sold as low-viscosity
  //    flow rising and folding back. Emissive, so bloom catches them. ──
  const filamentMat = new MeshBasicMaterial({ color: 0x4f86ff, transparent: true, opacity: 0.5 });
  const filaments: { mesh: Mesh; phase: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const rr = 0.28;
    const curve = new CatmullRomCurve3([
      new Vector3(Math.cos(a) * rr, 0.15, Math.sin(a) * rr),
      new Vector3(Math.cos(a + 0.6) * rr * 1.4, 0.55, Math.sin(a + 0.6) * rr * 1.4),
      new Vector3(Math.cos(a + 1.4) * rr * 0.7, 0.95, Math.sin(a + 1.4) * rr * 0.7),
      new Vector3(Math.cos(a + 2.2) * rr * 1.2, 1.2, Math.sin(a + 2.2) * rr * 1.2),
    ]);
    const fm = new Mesh(new TubeGeometry(curve, 40, 0.018, 10, false), filamentMat.clone());
    fm.position.y = VBASE + 0.05;
    g.add(fm);
    filaments.push({ mesh: fm, phase: i / 3 });
  }
  // rising motes inside the fluid — tiny bright bubbles for life
  const motes: Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const m = new Mesh(
      new SphereGeometry(0.022, 10, 8),
      new MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.7 }),
    );
    g.add(m);
    motes.push(m);
  }

  // atmosphere — blue dust, reference contract
  anims.push(engine.dustPlane(g, 0x3f6cff, 5, 6, 0, 3.2, -1));

  // ── idle beat: voice ripples expand across the obsidian pool (speech landing);
  //    keep the reference's three-ring cadence, gated by proximity/stillness ──
  const rings: Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const r = new Mesh(
      new RingGeometry(0.97, 1.0, 96),
      new MeshBasicMaterial({
        color: 0x2a5cff,
        transparent: true,
        opacity: 0,
        side: DoubleSide,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.04;
    g.add(r);
    rings.push(r);
  }

  anims.push((t) => {
    fluidMat.uniforms.uTime.value = t;
    volMat.uniforms.uTime.value = t;
    fluid.rotation.y = t * 0.12;
    orbGlow.material.opacity = 0.28 + Math.sin(t * 0.9) * 0.05; // gentle breathe
    fluidLight.intensity = 4.7 + Math.sin(t * 0.9) * 1.0;
    // convecting filaments drift and fade in a slow loop
    filaments.forEach((f, i) => {
      const c = (t * 0.22 + f.phase) % 1;
      f.mesh.rotation.y = t * 0.18 + i * 2.1;
      (f.mesh.material as MeshBasicMaterial).opacity = Math.sin(c * Math.PI) * 0.45;
    });
    // motes rise up the belly and reset
    motes.forEach((m, i) => {
      const c = (t * 0.16 + i / 4) % 1;
      const a = i * 1.9 + t * 0.3;
      const rr = 0.3 * (1 - c * 0.4);
      m.position.set(Math.cos(a) * rr, VBASE + 0.15 + c * 1.0, Math.sin(a) * rr);
      (m.material as MeshBasicMaterial).opacity = Math.sin(c * Math.PI) * 0.7;
    });
    // idle voice ripples
    const k = engine.idleK(g);
    rings.forEach((r, i) => {
      const c = (t * 0.35 + i / 3) % 1;
      r.scale.setScalar(0.4 + c * 3.8);
      (r.material as MeshBasicMaterial).opacity = k * (1 - c) * 0.45;
    });
  });
};

/* Colour note (CLAUDE.md token rule): this file paints a 3D film set, not UI —
   hex values here are set-dressing pigments from the reference scene and the
   user's Set-11 reference brief, matching the studio app's existing convention
   (constants.ts / projects.ts carry the same literal scene colours). */
