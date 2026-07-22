/* Set 11 — Flow State ("fluid", z -3). Rebuilt to the user's Set-11 reference
   IMAGE (2026-07-22): a rectangular clear-glass canister (rounded-corner body,
   angled shoulder, short chrome neck) full of glowing, low-viscosity cyan-blue
   fluid swirling in intricate ink-in-water tendrils to a clear level line —
   standing on a low, wide, matte dark-stone plinth in a black soundstage, lit by
   a single dramatic volumetric light shaft from above-right, with blue caustics
   spilling across the plinth. Brief: "a dark, obsidian studio space containing a
   perfectly clear vessel with glowing, low-viscosity blue fluid, lit to
   emphasize refraction and complex laminar flow patterns."

   Built with the 3d-master-modeler method (staged blockout → real PBR → formal
   rig → verify-by-eye) under the engine's inherited cinema stack (N8AO + bloom +
   film grade, stageEnv IBL, fixed dust). Real refractive glass
   (MeshPhysicalMaterial transmission=1 — the kitchen's proven trick) so the
   curved/edged walls refract the glowing fluid; a tilted volumetric key beam;
   procedural caustics for the "lit to emphasize refraction" read. */
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  ShaderMaterial,
  SpotLight,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
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

/** Fine monochrome noise — roughness/bump micro-variation. */
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

/** Poured-concrete / dark stone — mottled patches, aggregate, faint trowel drift. */
const stoneTex = (key: string, tint: string): CanvasTexture =>
  cached(key, () => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d')!;
    x.fillStyle = tint;
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 40; i++) {
      const r = 40 + Math.random() * 120;
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const lift = Math.random() < 0.5;
      const grd = x.createRadialGradient(px, py, 0, px, py, r);
      grd.addColorStop(0, lift ? 'rgba(70,74,84,0.14)' : 'rgba(4,4,7,0.20)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = grd;
      x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    for (let i = 0; i < 5000; i++) {
      const g = 14 + Math.random() * 44;
      x.fillStyle = `rgba(${g},${g},${g + 5},${0.18 + Math.random() * 0.4})`;
      x.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(3, 3);
    return t;
  });

/* ── the hero fluid shader — glowing low-viscosity cyan-blue liquid swirling in
   intricate ink-in-water tendrils. Opaque (so the glass transmission pass
   refracts it), unlit, tuned bright so bloom lifts the filaments into a glow.
   Domain-warped fbm currents + thin bright caustic filaments; fresnel rim and a
   radial core make it read as luminous volume. Colour stays cyan-blue, never
   milky white. */
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
    for (int i = 0; i < 6; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  void main(){
    vec3 p = vPos * 3.0;
    float flow = uTime * 0.2;
    // domain-warp the space with a slow vector field → curling ink tendrils
    vec3 w = vec3(
      fbm(p * 0.6 + vec3(0.0, flow, 0.0)),
      fbm(p * 0.6 + vec3(5.2, flow * 0.8, 1.3)),
      fbm(p * 0.6 + vec3(1.7, flow * 1.1, 9.2))
    ) - 0.5;
    // turbulent currents + a finer second octave, drifting upward
    vec3 q = p + w * 3.0; q.y -= flow * 1.6;
    float cur = fbm(q);
    float fine = fbm(q * 2.1 + w * 1.4);
    // thin bright caustic filaments riding the currents (the wispy tendrils)
    float streak = pow(abs(sin((cur + fine) * 5.0 + (w.x + w.z) * 3.0 + uTime * 0.6)), 6.0);
    float lam = cur * 0.5 + fine * 0.28 + streak * 0.7;
    float fres = pow(1.0 - max(dot(normalize(vN), normalize(vView)), 0.0), 2.0);
    float core = smoothstep(1.4, 0.0, length(vPos));
    float rise = smoothstep(-0.3, 1.0, vPos.y);
    float e = clamp(lam * 0.85 + core * 0.4 + fres * 0.55 + rise * 0.2, 0.0, 1.4);
    // deep ink → electric cyan-blue → hottest filaments to a light cyan
    vec3 deep = vec3(0.0, 0.06, 0.34);
    vec3 mid  = vec3(0.04, 0.42, 1.0);
    vec3 hot  = vec3(0.45, 0.82, 1.0);
    vec3 col = mix(deep, mid, clamp(e, 0.0, 1.0));
    col = mix(col, hot, clamp((e - 0.72) * 2.6, 0.0, 1.0) * 0.75);
    col += fres * vec3(0.04, 0.22, 0.7);
    gl_FragColor = vec4(col, 1.0);
  }`;

export const buildFluid: SetBuilder = (engine, g, anims) => {
  const env = stageEnv(engine.renderer);

  // ── dark studio floor the plinth stands on (matte concrete, not reflective) ──
  const ground = new Mesh(
    new PlaneGeometry(40, 40),
    new MeshStandardMaterial({
      map: stoneTex('fl-ground', '#0a0b0f'),
      bumpMap: stoneTex('fl-ground', '#0a0b0f'),
      bumpScale: 0.01,
      color: 0x6b6f78,
      roughness: 0.92,
      metalness: 0.02,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.004;
  ground.receiveShadow = true;
  g.add(ground);

  // ── the low, wide, matte dark-stone plinth ──
  const plinthMat = new MeshStandardMaterial({
    map: stoneTex('fl-plinth', '#141620'),
    bumpMap: noiseTex('fl-plinth-b', 128, 26, 2),
    bumpScale: 0.006,
    color: 0x9aa0ac,
    roughness: 0.78,
    metalness: 0.04,
    envMap: env,
    envMapIntensity: 0.25,
  });
  const PLINTH_H = 0.6;
  const plinth = new Mesh(new RoundedBoxGeometry(4.4, PLINTH_H, 2.8, 3, 0.03), plinthMat);
  plinth.position.y = PLINTH_H / 2;
  plinth.castShadow = plinth.receiveShadow = true;
  g.add(plinth);
  // faint top-edge chamfer highlight so the slab reads as a solid block
  const topInlay = new Mesh(
    new BoxGeometry(4.3, 0.012, 2.7),
    new MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.7, metalness: 0.1, envMap: env }),
  );
  topInlay.position.y = PLINTH_H + 0.006;
  topInlay.receiveShadow = true;
  g.add(topInlay);

  // "SHIFT-9" wordmark on the plinth front face (the HUD carries the project
  //   name/status; this echoes the reference's baked studio wordmark)
  const wc = document.createElement('canvas');
  wc.width = 1024;
  wc.height = 256;
  const wx = wc.getContext('2d')!;
  wx.fillStyle = '#c7ccd6';
  wx.font = '900 150px "Arial Black", "Helvetica Neue", Arial, sans-serif';
  wx.textAlign = 'center';
  wx.textBaseline = 'middle';
  wx.fillText('SHIFT-9', 512, 130);
  const wordmark = new Mesh(
    new PlaneGeometry(2.0, 0.5),
    new MeshBasicMaterial({
      map: new CanvasTexture(wc),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  wordmark.position.set(0, PLINTH_H * 0.52, 1.401);
  g.add(wordmark);

  const TOP = PLINTH_H; // vessel + fluid sit on the plinth top

  // ── caustics on the plinth top — shimmering refracted-light network the
  //    glowing vessel throws onto the stone, plus a soft base glow ("lit to
  //    emphasize refraction"). ──
  const causticMat = new ShaderMaterial({
    vertexShader:
      'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        vec2 uv = vUv - 0.5;
        float r = length(uv) * 2.0;
        vec2 p = uv * 10.0;
        float t = uTime * 0.5;
        float c = 0.0;
        for (int i = 0; i < 3; i++){
          float fi = float(i);
          p += vec2(sin(p.y * 1.3 + t + fi), cos(p.x * 1.3 - t + fi)) * 0.6;
          float d = abs(sin(p.x + t) * sin(p.y - t * 0.7));
          c += 1.0 / (d + 0.3);
        }
        c = pow(c * 0.15, 2.3);
        float fade = smoothstep(1.0, 0.15, r);
        float glow = smoothstep(0.8, 0.0, r) * 0.6;
        float a = (c * 0.45 + glow) * fade;
        gl_FragColor = vec4(vec3(0.12, 0.45, 1.0), a);
      }`,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const caustic = new Mesh(new PlaneGeometry(3.4, 2.4), causticMat);
  caustic.rotation.x = -Math.PI / 2;
  caustic.position.set(0, TOP + 0.008, 0.1);
  g.add(caustic);

  // ── the hero: a rectangular clear-glass canister ──
  // clear glass — pristine, high transmission with real wall thickness so the
  //   edged body refracts/magnifies the glowing fluid behind it
  const glassMat = new MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.02,
    metalness: 0,
    transmission: 1,
    ior: 1.48,
    thickness: 0.6,
    attenuationColor: 0xeaf3ff,
    attenuationDistance: 2.4,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMap: env,
    envMapIntensity: 1.25,
    transparent: true,
  });
  const chrome = new MeshStandardMaterial({
    color: 0xd0d5dc,
    roughness: 0.22,
    roughnessMap: noiseTex('fl-chrome', 60, 28, 5),
    metalness: 1.0,
    envMap: env,
    envMapIntensity: 1.2,
  });

  const BW = 1.12; // body width
  const BD = 0.94; // body depth
  const BH = 1.16; // body height
  const vessel = new Mesh(new RoundedBoxGeometry(BW, BH, BD, 5, 0.08), glassMat);
  vessel.position.y = TOP + BH / 2;
  g.add(vessel);
  // angled shoulder — a 4-sided (square) frustum tapering from body to neck,
  //   rotated 45° so its flat faces front like the body (jerry-can shoulder)
  const SHH = 0.34;
  const shoulder = new Mesh(
    new CylinderGeometry((0.3 * Math.SQRT2), (BW / 2) * Math.SQRT2 * 0.98, SHH, 4, 1),
    glassMat,
  );
  shoulder.rotation.y = Math.PI / 4;
  shoulder.scale.z = BD / BW; // squash to the body's rectangular footprint
  shoulder.position.y = TOP + BH + SHH / 2;
  g.add(shoulder);
  // short chrome neck + cap collar
  const neck = new Mesh(new CylinderGeometry(0.17, 0.19, 0.13, 28), chrome);
  neck.position.y = TOP + BH + SHH + 0.065;
  neck.castShadow = true;
  g.add(neck);
  const cap = new Mesh(new CylinderGeometry(0.2, 0.18, 0.08, 28), chrome);
  cap.position.y = TOP + BH + SHH + 0.13 + 0.04;
  cap.castShadow = true;
  g.add(cap);

  // ── the glowing fluid inside — a rounded box filled to ~68%, with a bright
  //    meniscus level line, sitting inside the glass wall so it refracts ──
  const fluidMat = new ShaderMaterial({
    vertexShader: FLUID_VERT,
    fragmentShader: FLUID_FRAG,
    uniforms: { uTime: { value: 0 } },
  });
  const FLH = BH * 0.66;
  const fluid = new Mesh(new RoundedBoxGeometry(BW - 0.14, FLH, BD - 0.14, 4, 0.06), fluidMat);
  fluid.position.y = TOP + 0.07 + FLH / 2; // rests on the interior floor
  g.add(fluid);
  // bright meniscus surface line where the fluid meets the empty upper vessel
  const meniscus = new Mesh(
    new BoxGeometry(BW - 0.13, 0.02, BD - 0.13),
    new MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.55 }),
  );
  meniscus.position.y = TOP + 0.07 + FLH;
  g.add(meniscus);
  // soft glow sprite behind the fluid so the whole canister blooms
  const orbGlow = engine.glow(0x2aa6ff, 2.2);
  orbGlow.material.opacity = 0.34;
  orbGlow.position.set(0, TOP + BH * 0.42, 0);
  g.add(orbGlow);

  // ── lighting — chiaroscuro: one dramatic volumetric key from above-right ──
  // key spotlight, cool white, high and to the right/front, angled onto the
  //   vessel (throws the single hard beam + hard shadow like the reference)
  const key = new SpotLight(0xeaf1ff, 90, 26, 0.42, 0.7, 1.3);
  key.position.set(2.4, 8.2, 2.6);
  key.target.position.set(0, TOP + BH * 0.5, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  g.add(key, key.target);

  // the visible volumetric beam — a soft cone aligned down the key direction,
  //   tilted so it enters from top-right like the reference shaft
  const beamMat = new ShaderMaterial({
    vertexShader:
      'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        float body = pow(vUv.y, 2.2);
        float edge = pow(sin(vUv.x * 3.14159), 2.6);
        float drift = 0.9 + 0.1 * sin(uTime * 0.3 + vUv.y * 9.0 + vUv.x * 5.0);
        gl_FragColor = vec4(vec3(0.86, 0.92, 1.0), body * edge * drift * 0.05);
      }`,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const BEAM_H = 8.0;
  const beam = new Mesh(new ConeGeometry(1.15, BEAM_H, 40, 1, true), beamMat);
  // point the beam from the key toward the vessel top
  const from = new Vector3(2.4, 8.2, 2.6);
  const to = new Vector3(0, TOP + BH, 0);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  beam.position.copy(mid);
  beam.lookAt(from); // cone's +Y axis points up toward the source
  g.add(beam);

  // fill — very low cool blue, front, just lifts the shadow side off pure black
  const fill = new PointLight(0x5f86ff, 6, 20, 2);
  fill.position.set(-2.6, 2.4, 5.0);
  g.add(fill);
  // the fluid's own light — cyan-blue at the vessel core, washes the plinth top
  const fluidLight = new PointLight(0x2aa6ff, 6, 8, 2);
  fluidLight.position.set(0, TOP + BH * 0.4, 0);
  g.add(fluidLight);
  // back light — cool, behind + below, shines THROUGH the clear glass toward
  //   camera to light the refraction and draw the edge off the void
  const back = new PointLight(0xbcd8ff, 8, 8, 2);
  back.position.set(0.4, TOP + BH * 0.5, -1.7);
  g.add(back);

  // atmosphere — cyan dust drifting in the beam, reference contract
  anims.push(engine.dustPlane(g, 0x59b7ff, 4, 6, 0.6, 3.4, -0.2));

  anims.push((t) => {
    fluidMat.uniforms.uTime.value = t;
    causticMat.uniforms.uTime.value = t;
    beamMat.uniforms.uTime.value = t;
    fluid.rotation.y = Math.sin(t * 0.08) * 0.12; // gentle churn, not a spin
    // idle beat (voice landing): the fluid glow + caustics breathe up briefly
    const k = engine.idleK(g);
    const pulse = 0.28 + Math.sin(t * 0.9) * 0.05 + k * (0.5 + 0.5 * Math.sin(t * 2.2)) * 0.12;
    orbGlow.material.opacity = pulse;
    fluidLight.intensity = 5.5 + Math.sin(t * 0.9) * 1.2 + k * 2.0;
  });
};

/* Colour note (CLAUDE.md token rule): this file paints a 3D film set, not UI —
   hex values here are set-dressing pigments from the user's Set-11 reference
   image, matching the studio app's existing convention (constants.ts /
   projects.ts carry the same literal scene colours). */
