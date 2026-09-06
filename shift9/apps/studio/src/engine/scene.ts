/* SHIFT-9 engine — damped-velocity dolly, streaming stages, TSL set pieces.
   1:1 port of reference/shift9-scene.js onto WebGPURenderer (WebGPU primary,
   automatic WebGL2 backend fallback) with the real post stack in post.ts. */
import * as THREE from 'three/webgpu';
import { SCENE_CONSTANTS } from '../constants';
import { PROJECTS, type Project } from '../projects';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  makeDustMaterial, makeConeMaterial, makeBeamMaterial,
  makeFluidMaterial, makeProjectionMaterial
} from './tsl';
import { createPostStack, type PostStack } from './post';
import * as TX from './textures';

export interface HudDetail {
  id: string; name: string; status: string; accent: string; index: string;
  progress: number; idle: boolean; dist: number; tag: string; spec: string;
}

type Animator = ((t: number, dt: number) => void) & { _set?: string };

interface GlideState { from: number; to: number; t: number; dur: number; }
interface IntroState { t: number; dur: number; grp: THREE.Group; frames: THREE.Group[]; }

export const isMobile = () =>
  matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 640;

export class StudioScene {
  renderer!: THREE.WebGPURenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  post: PostStack | null = null;
  mobile = isMobile();

  state = {
    vel: 0, z: SCENE_CONSTANTS.CAMERA_START_Z, t: 0,
    built: new Map<string, { group: THREE.Group }>(),
    animators: [] as Animator[],
    locked: false,
    glide: null as GlideState | null,
    intro: null as IntroState | null
  };

  onHud: (d: HudDetail) => void = () => {};
  onOpen: (id: string) => void = () => {};
  onEntered: () => void = () => {};
  onFrame: (t: number, dt: number) => void = () => {};

  private host: HTMLElement;
  private glowTex!: THREE.CanvasTexture;
  private ro!: ResizeObserver;
  private raf = 0;
  private fogFarDefault = 55;
  private hudKey = '';
  private pendingIntro: boolean | null = null;
  // per-set canvas-cycle latches (mirror the reference's this._* fields)
  private _jpT = -1; private _dcT = -1; private _arT = -1; private _laT = -1; private _lu = -1; private _gdT = -1;

  constructor(host: HTMLElement) { this.host = host; }

  async init() {
    const forceWebGL = new URLSearchParams(location.search).has('webgl');
    const renderer = this.renderer = new THREE.WebGPURenderer({ antialias: true, powerPreference: 'high-performance', forceWebGL });
    await renderer.init();
    // "super high resolution": full device pixel ratio, no cap (mobile stays at 2 for thermals)
    renderer.setPixelRatio(this.mobile ? Math.min(devicePixelRatio, 2) : devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    if (!this.mobile) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.host.appendChild(renderer.domElement);

    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 8, 55);
    this.camera.position.set(0, 2.2, SCENE_CONSTANTS.CAMERA_START_Z);
    this.scene.add(new THREE.AmbientLight(0x111114, 0.6));
    this.glowTex = this.makeGlowTexture();
    // image-based lighting: faint studio environment so metals/gloss pick up real
    // reflections; intensity kept low so the void stays light-tight black
    THREE.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.14;

    this.post = createPostStack(renderer, this.scene, this.camera, this.mobile);

    const resize = () => {
      const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
      renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    resize();
    this.ro = new ResizeObserver(resize);
    this.ro.observe(this.host);

    const C = SCENE_CONSTANTS;
    const addVel = (d: number) => {
      if (this.state.locked) return;                 // detail page open — dolly frozen
      this.state.glide = null;                       // any manual input cancels an auto-glide
      this.state.vel = Math.max(-C.MAX_VELOCITY, Math.min(C.MAX_VELOCITY, this.state.vel + d));
    };
    this._wheel = (e: WheelEvent) => {
      if (this.state.locked) return;
      e.preventDefault();
      addVel(e.deltaY * C.SCROLL_SENSITIVITY * 60 * 0.016);
    };
    addEventListener('wheel', this._wheel, { passive: false });
    this._key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') addVel(-0.4);
      if (e.key === 'ArrowUp') addVel(0.4);
    };
    addEventListener('keydown', this._key);
    let ty: number | null = null;
    this._ts = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    this._tm = (e: TouchEvent) => {
      if (ty != null) { addVel((e.touches[0].clientY - ty) * 0.004); ty = e.touches[0].clientY; }
    };
    addEventListener('touchstart', this._ts);
    addEventListener('touchmove', this._tm);
    // idle click on the set → open its portfolio detail page (shell listens)
    this._click = () => {
      const s = this.state;
      if (s.locked || s.glide || Math.abs(s.vel) >= 0.01) return;
      let best: Project | null = null, bd = 1e9;
      for (const p of PROJECTS) {
        const d = Math.abs(s.z - p.z) + (p.z < s.z ? 0 : 30);
        if (d < bd) { bd = d; best = p; }
      }
      if (best && Math.abs(s.z - best.z) < 26) this.onOpen(best.id);
    };
    renderer.domElement.addEventListener('click', this._click);
    renderer.domElement.style.cursor = 'pointer';

    let last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const s = this.state;
      s.t += dt;
      const C2 = SCENE_CONSTANTS;
      if (s.intro) {                                                 // entry tunnel — dive through the machine
        const I = s.intro; I.t += dt;
        const k = Math.min(I.t / I.dur, 1);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        s.z = 262 - (262 - C2.CAMERA_START_Z) * e;
        s.vel = 0;
        this.camera.fov = 42 + 30 * Math.sin(Math.PI * k); this.camera.updateProjectionMatrix();
        this.camera.rotation.z = Math.sin(k * Math.PI * 2) * 0.05;
        for (let i = 0; i < I.frames.length; i++) I.frames[i].rotation.z += dt * (i % 2 ? 0.9 : -0.7);
        // tunnel drives the peripheral velocity blur hard — this is the money shot
        this.post?.setVelocity(2.2 * Math.sin(Math.PI * k) + 0.4);
        if (k >= 1) this.endIntro();
      } else if (s.glide != null) {                                  // cinematic auto-dolly to a set
        s.glide.t += dt;
        const k = Math.min(s.glide.t / s.glide.dur, 1);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // easeInOutCubic
        const prevZ = s.z;
        s.z = s.glide.from + (s.glide.to - s.glide.from) * e;
        s.vel = 0;
        this.post?.setVelocity(Math.abs(s.z - prevZ) / Math.max(dt * 60, 1e-4));
        if (k >= 1) { s.z = s.glide.to; s.glide = null; }
      } else {
        s.vel *= Math.pow(1 - C2.VELOCITY_DAMPING, dt * 60);         // friction on velocity, not position
        s.z = Math.max(C2.CAMERA_END_Z, Math.min(C2.CAMERA_START_Z, s.z + s.vel * dt * 60));
        if (s.z === C2.CAMERA_END_Z || s.z === C2.CAMERA_START_Z) s.vel = 0;
        this.post?.setVelocity(Math.abs(s.vel));
      }
      this.camera.position.z = s.z;
      this.camera.position.x = Math.sin(s.t * 0.13) * 0.12;          // subtle handheld drift
      this.camera.position.y = 2.2 + Math.sin(s.t * 0.19) * 0.06;
      this.stream();
      for (const fn of s.animators) fn(s.t, dt);
      this.post ? this.post.render() : this.renderer.render(this.scene, this.camera);
      this.emitHud();
      this.onFrame(s.t, dt);
    };
    this.raf = requestAnimationFrame(loop);
    if (this.pendingIntro !== null) { const skip = this.pendingIntro; this.pendingIntro = null; this.playIntro(skip); }
  }

  private _wheel!: (e: WheelEvent) => void;
  private _key!: (e: KeyboardEvent) => void;
  private _ts!: (e: TouchEvent) => void;
  private _tm!: (e: TouchEvent) => void;
  private _click!: () => void;

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    removeEventListener('wheel', this._wheel);
    removeEventListener('keydown', this._key);
    removeEventListener('touchstart', this._ts);
    removeEventListener('touchmove', this._tm);
    this.renderer?.dispose();
  }

  setLocked(v: boolean) { this.state.locked = !!v; }
  setFogFar(v: number) {
    this.fogFarDefault = v;
    if (!this.state.intro && this.scene.fog instanceof THREE.Fog) this.scene.fog.far = v;
  }

  playIntro(skip: boolean) {
    const s = this.state;
    if (!this.renderer) { this.pendingIntro = skip; return; }
    if (skip) { s.z = SCENE_CONSTANTS.CAMERA_START_Z; return; }
    s.locked = true;
    const fog = this.scene.fog as THREE.Fog;
    this.fogFarDefault = fog.far; fog.far = 210; fog.near = 24;
    const grp = new THREE.Group(); const frames: THREE.Group[] = [];
    for (let i = 0; i < 34; i++) {                                   // chassis bulkheads flying past
      const fr = new THREE.Group();
      const m = new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0x0033FF : (i % 5 === 2 ? 0x2244aa : 0x20242e) });
      const W = 7 + (i % 3), H = 5.5 + (i % 2) * 1.5;
      const bar = (w: number, h: number, x: number, y: number) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), m); b.position.set(x, y, 0); fr.add(b);
      };
      bar(0.16, H, -W / 2, H / 2 + 0.2); bar(0.16, H, W / 2, H / 2 + 0.2);
      bar(W + 0.16, 0.16, 0, H + 0.2); bar(W + 0.16, 0.16, 0, 0.2);
      fr.position.z = 58 + i * 6.2; fr.rotation.z = (Math.random() - 0.5) * 0.25;
      grp.add(fr); frames.push(fr);
    }
    const sm = new THREE.MeshBasicMaterial({ color: 0x9fb6ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 140; i++) {                                  // light streaks
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 5 + Math.random() * 9), sm);
      const a = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 5.5;
      st.position.set(Math.cos(a) * r, 2.2 + Math.sin(a) * r, 55 + Math.random() * 210);
      grp.add(st);
    }
    this.scene.add(grp);
    this.state.intro = { t: 0, dur: 2.6, grp, frames };
    this.state.z = 262;
  }

  private endIntro() {
    const s = this.state, I = s.intro; s.intro = null; s.locked = false;
    s.z = SCENE_CONSTANTS.CAMERA_START_Z;
    this.camera.fov = 42; this.camera.updateProjectionMatrix(); this.camera.rotation.z = 0;
    const fog = this.scene.fog as THREE.Fog;
    fog.far = this.fogFarDefault || 55; fog.near = 8;
    if (I?.grp) {
      this.scene.remove(I.grp);
      I.grp.traverse(o => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose?.();
      });
    }
    this.onEntered();
  }

  idleK(g: THREE.Group, span?: number) { // 0..1 — how settled the camera is at this set's viewing mark
    const d = Math.abs(this.state.z - g.position.z - 13);
    const near = Math.max(0, 1 - d / (span || 16));
    return (Math.abs(this.state.vel) < 0.02 && !this.state.glide) ? near : 0;
  }

  glideTo(z: number) {
    const C = SCENE_CONSTANTS;
    const to = Math.max(C.CAMERA_END_Z, Math.min(C.CAMERA_START_Z, z));
    const from = this.state.z;
    const dist = Math.abs(to - from);
    if (dist < 0.5) return;
    this.state.vel = 0;
    this.state.glide = { from, to, t: 0, dur: Math.min(3.2, 0.9 + dist / 90) }; // longer travel = longer, capped
  }

  private emitHud() {
    const s = this.state;
    if (s.intro) return;
    let best: Project = PROJECTS[0]; let bd = 1e9;
    for (const p of PROJECTS) { // prefer nearest set AHEAD of camera (p.z < camZ)
      const ahead = p.z < s.z, d = Math.abs(s.z - p.z) + (ahead ? 0 : 30);
      if (d < bd) { bd = d; best = p; }
    }
    bd = Math.abs(s.z - best.z);
    const prog = (SCENE_CONSTANTS.CAMERA_START_Z - s.z) / (SCENE_CONSTANTS.CAMERA_START_Z - SCENE_CONSTANTS.CAMERA_END_Z);
    const key = best.id + '|' + Math.round(prog * 200) + '|' + (Math.abs(s.vel) < 0.01 ? 1 : 0);
    if (key !== this.hudKey) {
      this.hudKey = key;
      this.onHud({
        id: best.id, name: best.n, status: best.status, accent: best.accent,
        index: best.id.slice(0, 2), progress: prog, idle: Math.abs(this.state.vel) < 0.01,
        dist: bd, tag: best.tag, spec: best.spec
      });
    }
  }

  private makeGlowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  glow(color: THREE.ColorRepresentation, size: number) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTex, color, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    m.scale.setScalar(size);
    return m;
  }

  private stream() {
    const C = SCENE_CONSTANTS, s = this.state;
    for (const p of PROJECTS) {
      const d = Math.abs(s.z - p.z), have = s.built.has(p.id);
      if (!have && d < C.LOAD_RADIUS) this.buildSet(p);
      else if (have && d > C.UNLOAD_RADIUS) this.destroySet(p);
    }
  }

  private destroySet(p: Project) {
    const e = this.state.built.get(p.id); if (!e) return;
    this.scene.remove(e.group);
    e.group.traverse(o => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose?.();
    });
    this.state.animators = this.state.animators.filter(a => a._set !== p.id);
    this.state.built.delete(p.id);
  }

  private buildSet(p: Project) {
    const g = new THREE.Group();
    g.position.z = p.z;
    const accent = new THREE.Color(p.accent);
    // shared soundstage floor pool of light
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48),
      new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.9, metalness: 0.1 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    const anims: Animator[] = [];
    if (p.kind === 'corridor') this.buildCorridor(g, anims);
    else if (p.kind === 'lumen') this.buildLumen(g, anims);
    else if (p.kind === 'kitchen') this.buildKitchen(g, anims);
    else if (p.kind === 'whiteroom') this.buildWhiteRoom(g, anims);
    else if (p.kind === 'warehouse') this.buildWarehouse(g, anims);
    else if (p.kind === 'datacenter') this.buildDataCenter(g, anims);
    else if (p.kind === 'synth') this.buildSynth(g, anims);
    else if (p.kind === 'forge') this.buildForge(g, anims);
    else if (p.kind === 'workbench') this.buildWorkbench(g, anims);
    else if (p.kind === 'arcade') this.buildArcade(g, anims);
    else if (p.kind === 'floatcube') this.buildFloatCube(g, anims);
    else if (p.kind === 'fluid') this.buildFluid(g, anims);
    else this.buildStage(g, anims, accent, p);
    for (const a of anims) { a._set = p.id; this.state.animators.push(a); }
    this.scene.add(g);
    this.state.built.set(p.id, { group: g });
  }

  private softbox(g: THREE.Group, x: number, y: number, z: number, w: number, h: number, intensity: number, color?: THREE.ColorRepresentation) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: color ?? 0xffffff }));
    panel.position.set(x, y, z); panel.rotation.x = Math.PI / 2; g.add(panel);
    const gl = this.glow(color ?? 0xffffff, w * 2.2); gl.position.set(x, y - 0.2, z); g.add(gl);
    const sp = new THREE.SpotLight(color ?? 0xffffff, intensity, y * 3, 0.9, 0.5, 1.2);
    sp.position.set(x, y, z); sp.target.position.set(x, 0, z);
    if (!this.mobile) { sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -0.0004; }
    g.add(sp, sp.target);
    return sp;
  }

  private dustPlane(g: THREE.Group, color: THREE.ColorRepresentation, w: number, h: number, x: number, y: number, z: number, ry?: number): Animator {
    const { mat, uTime, uFade } = makeDustMaterial(new THREE.Color(color));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry || 0; g.add(m);
    const wz = () => g.position.z + z;
    return (t: number) => {
      uTime.value = t;
      const d = Math.abs(this.state.z - wz());
      uFade.value = Math.min(Math.max((d - 4) / 8, 0), 1); // fade out near camera
    };
  }

  private lightCone(g: THREE.Group, color: THREE.ColorRepresentation, x: number, topY: number, z: number, r: number, opacity: number) {
    const geo = new THREE.ConeGeometry(r, topY, 32, 1, true);
    const mat = makeConeMaterial(new THREE.Color(color), opacity);
    const m = new THREE.Mesh(geo, mat); m.position.set(x, topY / 2, z); g.add(m);
    return mat;
  }

  private buildStage(g: THREE.Group, anims: Animator[], accent: THREE.Color, p: Project) {
    this.softbox(g, 0, 7.5, 0, 3.4, 2.2, 260);
    this.lightCone(g, 0xffffff, 0, 7.4, 0, 3.4, 0.05);
    // hero monolith arrangement
    const mat = new THREE.MeshStandardMaterial({ color: 0xd8d8dc, roughness: 0.35, metalness: 0.05 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.6 });
    const seed = p.id.charCodeAt(1);
    const hero = new THREE.Mesh(new THREE.BoxGeometry(2.2 + (seed % 3) * 0.6, 1.4 + (seed % 2), 1.1), seed % 2 ? mat : dark);
    hero.position.y = (hero.geometry as THREE.BoxGeometry).parameters.height / 2; hero.castShadow = true; g.add(hero);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.12, 2.2), dark);
    slab.position.y = 0.06; g.add(slab);
    if (p.accent === '#0033FF') {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.6, 0.06), new THREE.MeshBasicMaterial({ color: accent }));
      strip.position.set(1.9, 1.3, 0.4); g.add(strip);
      const gl = this.glow(accent, 2.4); gl.position.copy(strip.position); g.add(gl);
      const pl = new THREE.PointLight(accent, 14, 9); pl.position.set(1.9, 1.4, 0.6); g.add(pl);
    }
    anims.push(this.dustPlane(g, 0xffffff, 4, 6, 0, 3.2, -0.5));
  }

  // 12 Just a Pinch — the master-reference kitchen: surgical ceiling light panel,
  // white upper cabinets with a backlit niche, monolithic island with sink +
  // faucet, tablet leaning on the counter, SHIFT-9 branded concrete floor.
  private buildKitchen(g: THREE.Group, anims: Animator[]) {
    this._jpT = -1;   // reset the canvas latch so the tablet redraws after a streaming rebuild
    // concrete stage floor with a soft pool + SHIFT-9 brand in front
    const conc = TX.concrete(512, '#6e7074');
    const kFloor = new THREE.Mesh(new THREE.CircleGeometry(10, 64),
      new THREE.MeshStandardMaterial({ color: 0x9a9c9f, roughness: 0.85, metalness: 0.02, map: conc.map, normalMap: conc.normalMap }));
    kFloor.rotation.x = -Math.PI / 2; kFloor.position.y = 0.012; kFloor.receiveShadow = true; g.add(kFloor);
    const brand = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.37),
      new THREE.MeshStandardMaterial({ map: TX.floorBrand('SHIFT-9', 'rgba(74,76,82,0.95)'), transparent: true, roughness: 0.9, metalness: 0 }));
    brand.rotation.x = -Math.PI / 2; brand.rotation.z = 0; brand.position.set(0, 0.02, 5.1); g.add(brand);
    // the big rectangular ceiling light panel (the image's key light)
    const panelG = new THREE.Group(); panelG.position.set(0, 6.1, -0.2); g.add(panelG);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.16, 3.1), new THREE.MeshStandardMaterial({ color: 0xd9dadc, roughness: 0.5, metalness: 0.3 }));
    panelG.add(frame);
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    lens.rotation.x = Math.PI / 2; lens.position.y = -0.09; panelG.add(lens);
    const area = new THREE.RectAreaLight(0xffffff, 7, 4.6, 2.8);
    area.position.set(0, 6.0, -0.2); area.rotation.x = -Math.PI / 2; g.add(area);
    const fill = new THREE.SpotLight(0xffffff, 110, 22, 0.95, 0.65, 1.4);
    fill.position.set(0, 6.0, -0.2); fill.target.position.set(0, 0, -0.2);
    if (!this.mobile) { fill.castShadow = true; fill.shadow.mapSize.set(2048, 2048); fill.shadow.bias = -0.0004; fill.shadow.radius = 6; }
    g.add(fill, fill.target);
    const pg = this.glow(0xffffff, 3.2); pg.position.set(0, 5.85, -0.2); pg.material.opacity = 0.5; g.add(pg);
    this.lightCone(g, 0xffffff, 0, 5.9, -0.2, 3.4, 0.04);
    // bounce fill: the photo's island front reads white — fake the GI with a soft
    // low-intensity front light (no shadow) aimed back at the counter
    const bounce = new THREE.SpotLight(0xfff6ec, 120, 22, 0.95, 0.9, 1.6);
    bounce.position.set(0, 4.5, 10); bounce.target.position.set(0, 0.9, 0); g.add(bounce, bounce.target);
    // materials
    const white = new THREE.MeshStandardMaterial({ color: 0xdfe0e3, roughness: 0.55 });
    const islandMat = new THREE.MeshStandardMaterial({ color: 0xe9eaec, roughness: 0.34, metalness: 0.04 });
    const cabTex = TX.cabinetFronts();
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xe6e7ea, roughness: 0.58, map: cabTex.map, normalMap: cabTex.normalMap, normalScale: new THREE.Vector2(1.5, 1.5) });
    const steel = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.25, metalness: 0.9 });
    // back wall block: uppers + tall side columns + glowing niche (per the image)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.1, 0.55), white); backWall.position.set(0, 3.15, -2.25); backWall.castShadow = true; g.add(backWall);
    const uppers = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.05, 0.6), cabMat); uppers.position.set(0, 4.05, -2.2); g.add(uppers);
    const colL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.1, 0.62), cabMat); colL.position.set(-2.1, 3.15, -2.21); g.add(colL);
    const colR = colL.clone(); colR.position.x = 2.1; g.add(colR);
    // niche: recessed, softly lit, with jars
    const nicheBack = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.05, 0.1), new THREE.MeshStandardMaterial({ color: 0xdddee2, roughness: 0.7 }));
    nicheBack.position.set(0, 2.95, -2.5); g.add(nicheBack);
    const nicheLight = new THREE.PointLight(0xfff2dd, 1.1, 2.2); nicheLight.position.set(0, 3.35, -2.15); g.add(nicheLight);
    for (const [jx, jh, jc] of [[-0.7, 0.34, 0xd8cfc2], [-0.3, 0.26, 0xcfd6cf], [0.25, 0.4, 0xd9d3c8], [0.75, 0.3, 0xc9ced6]] as const) {
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, jh, 18), new THREE.MeshStandardMaterial({ color: jc, roughness: 0.35 }));
      jar.position.set(jx, 2.47 + jh / 2, -2.28); g.add(jar);
    }
    // island: clean monolith with waterfall top, kickspace shadow gap
    const island = new THREE.Mesh(new RoundedBoxGeometry(5.6, 1.12, 1.7, 2, 0.02), islandMat); island.position.y = 0.62; island.castShadow = true; island.receiveShadow = true; g.add(island);
    const kick = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.12, 1.5), new THREE.MeshStandardMaterial({ color: 0x3a3b40, roughness: 0.8 }));
    kick.position.y = 0.06; g.add(kick);
    const top = new THREE.Mesh(new RoundedBoxGeometry(5.72, 0.08, 1.82, 2, 0.02), white); top.position.y = 1.22; top.castShadow = true; g.add(top);
    // sink + faucet (right of counter, as photographed)
    const basin = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.05, 0.62), new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.85 }));
    basin.position.set(1.7, 1.245, -0.1); g.add(basin);
    const basinIn = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: 0x50545a, roughness: 0.35, metalness: 0.9 }));
    basinIn.position.set(1.7, 1.235, -0.1); g.add(basinIn);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 16), steel);
    stalk.position.set(2.05, 1.44, -0.32); g.add(stalk);
    const spout = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 10, 24, Math.PI), steel);
    spout.position.set(1.95, 1.65, -0.32); spout.rotation.z = Math.PI / 2; spout.rotation.y = Math.PI / 2; g.add(spout);
    // cutting board + bowl props
    const board = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.03, 0.4, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0xc9a877, roughness: 0.7 }));
    board.position.set(0.4, 1.27, 0.15); g.add(board);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe7e2d9, roughness: 0.4, side: THREE.DoubleSide }));
    bowl.rotation.x = Math.PI; bowl.position.set(-0.5, 1.41, -0.2); g.add(bowl);
    // tablet leaning against the counter showing the recipe app (photo left)
    const tc = document.createElement('canvas'); tc.width = 192; tc.height = 128;
    const tcx = tc.getContext('2d')!; const ttex = new THREE.CanvasTexture(tc); ttex.colorSpace = THREE.SRGBColorSpace;
    const tabG = new THREE.Group(); tabG.position.set(-1.75, 1.52, 0.12); tabG.rotation.x = -0.16; g.add(tabG);
    const tabBody = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.64, 0.035, 2, 0.015), new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.3, metalness: 0.6 }));
    tabG.add(tabBody);
    const tabScr = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.56), new THREE.MeshBasicMaterial({ map: ttex }));
    tabScr.position.z = 0.019; tabG.add(tabScr);
    const tg = this.glow(0x9fe8ec, 1.3); tg.position.set(-1.75, 1.55, 0.35); tg.material.opacity = 0.35; g.add(tg);
    const pl = new THREE.PointLight(0xbfeef0, 3, 3); pl.position.set(-1.75, 1.6, 0.55); g.add(pl);
    anims.push(this.dustPlane(g, 0xffffff, 5, 6, 0, 3.5, -1));
    // idle beat: tablet cycles recipe cards; soft steam rises off the counter
    const wisps: THREE.Sprite[] = [];
    for (let i = 0; i < 3; i++) { const s = this.glow(0xffffff, 0.9); s.material.opacity = 0; g.add(s); wisps.push(s); }
    anims.push((t) => {
      const ci = (t / 2 | 0) % 3;
      if (ci !== this._jpT) {
        this._jpT = ci;
        // recipe card UI: hero photo block, title bars, step list
        tcx.fillStyle = '#f4fbfc'; tcx.fillRect(0, 0, 192, 128);
        tcx.fillStyle = ['#ffb3a0', '#a0d8b0', '#f5d78e'][ci]; tcx.fillRect(10, 10, 74, 84);
        tcx.fillStyle = 'rgba(255,255,255,0.35)'; tcx.beginPath(); tcx.arc(47, 44, 22, 0, 7); tcx.fill();
        tcx.fillStyle = '#31474c'; tcx.fillRect(96, 14, 80, 8);
        tcx.fillStyle = '#8aa0a6';
        for (let j = 0; j < 4; j++) tcx.fillRect(96, 34 + j * 16, 78 - j * 12, 5);
        tcx.fillStyle = '#2ec4b6'; tcx.fillRect(10, 104, 90, 14);
        tcx.fillStyle = '#ffffff'; tcx.font = 'bold 9px sans-serif'; tcx.fillText('COOK MODE', 22, 114);
        ttex.needsUpdate = true;
      }
      const k = this.idleK(g);
      wisps.forEach((s, i) => {
        const c = (t * 0.3 + i / 3) % 1;
        s.position.set(1.6 + Math.sin(t + i) * 0.15, 1.35 + c * 1.6, 0.2);
        s.material.opacity = k * (1 - c) * 0.16;
      });
    });
  }

  // 07 Midnight Return — rusted octagonal corridor per the master reference image:
  // grated floor with orange under-glow, recessed blue ceiling lights, orange wall
  // sconces, SHIFT-9 stamped deck plate, volumetric shaft, saturated flicker.
  private buildCorridor(g: THREE.Group, anims: Animator[]) {
    const rust = TX.rustSteel(512, 1);
    const rustB = TX.rustSteel(512, 8);
    const metal = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.45, map: rust.map, normalMap: rust.normalMap, normalScale: new THREE.Vector2(1.3, 1.3) });
    const metalB = new THREE.MeshStandardMaterial({ color: 0xe8e0d6, roughness: 0.8, metalness: 0.4, map: rustB.map, normalMap: rustB.normalMap });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.42, metalness: 0.9 });
    // octagonal ring segments marching into the dark
    for (let i = 0; i < 8; i++) {
      const frame = new THREE.Group();
      const deep = i % 2 ? metal : metalB;
      const slab = (w: number, h: number, x: number, y: number, rz = 0, d = 0.5) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), deep);
        m.position.set(x, y, 0); m.rotation.z = rz; m.castShadow = true; m.receiveShadow = true; frame.add(m);
      };
      slab(0.7, 4.0, -3.25, 2.6);  slab(0.7, 4.0, 3.25, 2.6);              // side walls
      slab(2.6, 0.7, -2.35, 4.95, -Math.PI / 4); slab(2.6, 0.7, 2.35, 4.95, Math.PI / 4); // chamfers ↑
      slab(3.4, 0.7, 0, 5.55);                                             // ceiling band
      slab(2.2, 0.7, -2.5, 0.35, Math.PI / 4); slab(2.2, 0.7, 2.5, 0.35, -Math.PI / 4);   // chamfers ↓
      // greebles: pipes + rivet strip on the deep frames
      if (i % 2) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.6, 10), darkSteel);
        pipe.position.set(-2.95, 2.5, 0.32); frame.add(pipe);
        const box = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.7, 0.25, 2, 0.04), darkSteel);
        box.position.set(2.95, 1.6, 0.3); frame.add(box);
      }
      frame.position.z = -i * 2.4 + 7; g.add(frame);
    }
    // floor: center stamped deck plates flanked by open grates with hot under-glow
    const plateTex = TX.stampedPlate('SHIFT-9');
    for (let i = 0; i < 5; i++) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 3.6),
        i === 1
          ? new THREE.MeshStandardMaterial({ color: 0x9a9aa0, roughness: 0.55, metalness: 0.85, map: plateTex.map, normalMap: plateTex.normalMap, normalScale: new THREE.Vector2(1.6, 1.6) })
          : new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.5, metalness: 0.85, map: rustB.map, normalMap: rustB.normalMap }));
      plate.position.set(0, 0.04, -i * 3.8 + 7); plate.receiveShadow = true; g.add(plate);
      for (const side of [-1, 1]) {
        // under-glow slit + emissive floor light
        const glowP = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 3.4), new THREE.MeshBasicMaterial({ color: 0xff4a10 }));
        glowP.rotation.x = -Math.PI / 2; glowP.position.set(side * 2.0, 0.005, -i * 3.8 + 7); g.add(glowP);
        // grate bars over the glow
        for (let b = 0; b < 13; b++) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.14), darkSteel);
          bar.position.set(side * 2.0, 0.07, -i * 3.8 + 7 - 1.68 + b * 0.28); g.add(bar);
        }
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.6), darkSteel);
        rail.position.set(side * 1.38, 0.08, -i * 3.8 + 7); g.add(rail);
        if (i % 2 === 0) {
          const up = new THREE.PointLight(0xff4a10, 6, 3.2, 1.8);
          up.position.set(side * 2.1, 0.4, -i * 3.8 + 7); g.add(up);
        }
      }
    }
    // recessed ceiling light housings (cool blue-white) + orange wall sconce bars
    const housings: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      for (const side of [-1.2, 1.2]) {
        const housing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.5), darkSteel);
        housing.position.set(side, 5.18, -i * 4.8 + 6); g.add(housing);
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.36), new THREE.MeshBasicMaterial({ color: 0x9fc4ff }));
        lens.rotation.x = Math.PI / 2; lens.position.set(side, 5.11, -i * 4.8 + 6); g.add(lens); housings.push(lens);
      }
    }
    const sconces: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      for (const side of [-1, 1]) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.34), darkSteel);
        box.position.set(side * 3.02, 1.9, -i * 4.8 + 5); g.add(box);
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.92), new THREE.MeshBasicMaterial({ color: 0xffa04a }));
        bar.rotation.y = -side * Math.PI / 2; bar.position.set(side * 2.93, 1.9, -i * 4.8 + 5); g.add(bar); sconces.push(bar);
        const gl = this.glow(0xff7a22, 1.1); gl.position.set(side * 2.8, 1.9, -i * 4.8 + 5); g.add(gl);
      }
    }
    // volumetric shaft falling from the first ceiling light + warm haze fills so
    // the rusted panels actually read (the photo is brown-dominated, not black)
    this.lightCone(g, 0xbfd4ff, 0, 5.1, 4.2, 1.7, 0.05);
    for (const [fz, fi] of [[5, 8], [-1, 6], [-7, 6]] as const) {
      const warm = new THREE.PointLight(0xffb377, fi, 10, 1.7); warm.position.set(0, 2.6, fz); g.add(warm);
    }
    const flickers: { pl: THREE.PointLight; gl: THREE.Sprite; base: number; ph: number }[] = [];
    const maxLights = this.mobile ? 3 : 5; // mobile shader simplification: fewer lights
    const addLight = (color: number, x: number, y: number, z: number, intensity: number) => {
      if (flickers.length >= maxLights) return;
      const pl = new THREE.PointLight(color, intensity, 9, 1.6); pl.position.set(x, y, z); g.add(pl);
      const gl = this.glow(color, 1.6); gl.position.set(x, y, z); g.add(gl);
      flickers.push({ pl, gl, base: intensity, ph: Math.random() * 10 });
    };
    addLight(0x2a66ff, -1.2, 4.8, 4.5, 34); addLight(0x2a66ff, 1.2, 4.8, -1.5, 34);
    addLight(0xff6a1a, 2.6, 1.6, 2.2, 16); addLight(0xff6a1a, -2.6, 1.6, -3, 14);
    addLight(0x2a66ff, 0, 5.0, -7, 36);
    anims.push((t) => {
      for (const f of flickers) {
        const fl = 0.55 + 0.45 * Math.max(0, Math.sin(t * 17 + f.ph) * Math.sin(t * 5.3 + f.ph * 2) + 0.4);
        f.pl.intensity = f.base * fl; f.gl.material.opacity = 0.85 * fl;
      }
      // fixture lenses flicker with their lights
      housings.forEach((hh, i) => { const m = hh.material as THREE.MeshBasicMaterial; m.color.setScalar(0); m.color.set(0x9fc4ff).multiplyScalar(0.7 + 0.3 * Math.sin(t * 13 + i * 3)); });
      sconces.forEach((s, i) => { const m = s.material as THREE.MeshBasicMaterial; m.color.set(0xffa04a).multiplyScalar(0.75 + 0.25 * Math.sin(t * 9 + i * 2.1)); });
    });
    anims.push(this.dustPlane(g, 0x2244ff, 5, 4.5, 0, 2.5, -1));
    anims.push(this.dustPlane(g, 0xff8844, 5, 4.5, 0.5, 2.5, -4));
    // steam
    const steam: THREE.Sprite[] = [];
    for (let i = 0; i < 3; i++) {
      const sp = this.glow(0x3355aa, 3.5 + i); sp.material.opacity = 0.12;
      sp.position.set((i - 1) * 2, 1 + i * 0.7, 2 - i * 3); g.add(sp); steam.push(sp);
    }
    anims.push((t) => steam.forEach((s, i) => {
      s.position.y = 1 + i * 0.7 + Math.sin(t * 0.6 + i) * 0.4;
      s.material.opacity = 0.09 + 0.05 * Math.sin(t * 0.8 + i * 2);
    }));
    // idle beat: a distant silhouette steps into a backlit doorway, then recedes
    const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.4), new THREE.MeshBasicMaterial({ color: 0x1b3fd0, transparent: true, opacity: 0 }));
    doorGlow.position.set(0, 2.2, -11.5); g.add(doorGlow);
    const dg = this.glow(0x2a4cff, 3.4); dg.position.set(0, 2.2, -11.3); dg.material.opacity = 0; g.add(dg);
    const sil = new THREE.Group();
    const sm = new THREE.MeshBasicMaterial({ color: 0x05060a });
    const torso2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.4), sm); torso2.position.y = 1.5; sil.add(torso2);
    const head2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), sm); head2.position.y = 2.25; sil.add(head2);
    for (const lx of [-0.18, 0.18]) { const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.3), sm); leg2.position.set(lx, 0.5, 0); sil.add(leg2); }
    sil.position.set(0, 0, -9); g.add(sil);
    anims.push((t) => {
      const k = this.idleK(g), c = (Math.sin(t * 0.35) + 1) / 2;
      sil.visible = k > 0.05; sil.position.z = -10 + k * c * 4;
      doorGlow.material.opacity = k * (0.3 + 0.08 * Math.sin(t * 1.7));
      dg.material.opacity = k * 0.28;
    });
  }

  // 09 Lumen — projective texture mapping onto a stack of white boxes
  private buildLumen(g: THREE.Group, anims: Animator[]) {
    this._lu = -1;    // reset canvas latch (streaming rebuild)
    // live glitching UI map texture
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    const tex = new THREE.CanvasTexture(c);
    const drawUI = (t: number) => { // projection-mapping loop: grid → neon facets → scan bars
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 512, 512);
      const ph = (t / 5 | 0) % 3;
      ctx.strokeStyle = ph === 1 ? '#00ffd0' : '#ffffff'; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
      const gsz = 46 + Math.sin(t * 0.8) * 3;
      for (let x = 0; x <= 512; x += gsz) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); }
      for (let y = 0; y <= 512; y += gsz) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (ph === 1) {
        const cols = ['#ff2d95', '#00ffd0', '#ffe14d', '#4d6bff'];
        ctx.globalAlpha = 0.75;
        for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[(i + (t | 0)) % 4]; ctx.fillRect((i * 149 + (t * 40 | 0)) % 460, (i * 97) % 440, 70, 70); }
        ctx.globalAlpha = 1;
      } else if (ph === 2) {
        ctx.fillStyle = '#ffffff'; const sy = (t * 160) % 560 - 24; ctx.fillRect(0, sy, 512, 26);
        ctx.fillStyle = '#0033FF'; ctx.globalAlpha = 0.5; ctx.fillRect(0, (sy + 200) % 512, 512, 60); ctx.globalAlpha = 1;
      }
      if (Math.random() < 0.05) { ctx.fillStyle = '#fff'; ctx.fillRect(0, Math.random() * 512, 512, 4); }
      tex.needsUpdate = true;
    };
    // projector camera — composed in WORLD space (group is offset by p.z)
    const zo = g.position.z;
    const proj = new THREE.PerspectiveCamera(34, 1, 0.5, 30);
    proj.position.set(-5.5, 4.5, 6 + zo); proj.lookAt(0, 1.5, zo); proj.updateMatrixWorld();
    const projMat = new THREE.Matrix4().multiplyMatrices(proj.projectionMatrix, proj.matrixWorldInverse);
    const { mat, uTime } = makeProjectionMaterial(tex, projMat, proj.position.clone());
    // stack of white boxes on the floor — the mapping canvas
    for (const [w, h, d, x, y, z, ry] of [
      [2.2, 1.4, 1.4, 0, 0.7, 0, 0.1],
      [1.3, 1.1, 1.1, -0.75, 1.95, 0.15, -0.2],
      [1.0, 0.9, 0.9, 0.55, 1.85, -0.15, 0.35],
      [0.75, 0.75, 0.75, -0.45, 2.85, 0.05, 0.5],
      [0.9, 0.9, 0.9, 1.7, 0.45, 0.6, -0.3]
    ] as const) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(x, y, z); b.rotation.y = ry; g.add(b);
    }
    // projector body + beam
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.9), new THREE.MeshStandardMaterial({ color: 0x202028, roughness: 0.4, metalness: 0.6 }));
    body.position.set(-5.5, 4.5, 6); body.lookAt(0, 1.8, 0); g.add(body);
    const bg = this.glow(0xffffff, 1.2); bg.position.set(-5.5, 4.5, 6); g.add(bg);
    const beamGeo = new THREE.CylinderGeometry(0.06, 2.2, new THREE.Vector3(-5.5, 4.5, 6).distanceTo(new THREE.Vector3(0, 1.5, 0)), 24, 1, true);
    const beamMat = makeBeamMaterial();
    const beam = new THREE.Mesh(beamGeo, beamMat);
    const mid = new THREE.Vector3(-5.5, 4.5, 6).lerp(new THREE.Vector3(0, 1.5, 0), 0.5);
    beam.position.copy(mid); beam.lookAt(0, 1.5, 0); beam.rotateX(Math.PI / 2); g.add(beam);
    const sp = new THREE.SpotLight(0xffffff, 60, 20, 0.36, 0.7); sp.position.set(-5.5, 4.5, 6); sp.target.position.set(0, 1.5, 0); g.add(sp, sp.target);
    // idle beat: four corner-pin dots snap onto the mapped object
    const dots: THREE.Sprite[] = [];
    for (const [dx, dy] of [[-1.6, 3.1], [1.6, 3.1], [-1.6, 0.4], [1.6, 0.4]]) {
      const d = this.glow(0xffffff, 0.45); d.position.set(dx, dy, 0.9); d.material.opacity = 0; g.add(d); dots.push(d);
    }
    anims.push((t) => { const k = this.idleK(g); dots.forEach((d, i) => { d.material.opacity = k * (0.5 + 0.4 * Math.sin(t * 2 + i * 1.6)); }); });
    anims.push(this.dustPlane(g, 0xffffff, 6, 4.5, -2.2, 2.8, 1.5, 0.7));
    anims.push((t) => {
      uTime.value = t;
      if ((t * 30 | 0) !== this._lu) { this._lu = t * 30 | 0; drawUI(t); }
    });
  }

  // 01 WinFix — high-contrast white room (bright cyclorama, one dark broken monolith)
  private buildWhiteRoom(g: THREE.Group, anims: Animator[]) {
    const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.85, metalness: 0 });
    const bright = new THREE.Mesh(new THREE.CircleGeometry(10, 48), new THREE.MeshStandardMaterial({ color: 0xededf0, roughness: 0.95 }));
    bright.rotation.x = -Math.PI / 2; bright.position.y = 0.01; bright.receiveShadow = true; g.add(bright);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(11, 8, 0.4), white); wall.position.set(0, 4, -3); g.add(wall);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 7), white); sideL.position.set(-5.3, 4, 0.5); g.add(sideL);
    const sideR = sideL.clone(); sideR.position.x = 5.3; g.add(sideR);
    this.softbox(g, -2.5, 7.6, 1, 3.2, 2.4, 110); this.softbox(g, 2.5, 7.6, 1, 3.2, 2.4, 110);
    g.add(new THREE.HemisphereLight(0xffffff, 0x999999, 0.35));
    // ceiling light panel over the room (per the master composite: lit white cube room)
    const lensW = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    lensW.rotation.x = Math.PI / 2; lensW.position.set(0, 7.4, 0.4); g.add(lensW);
    // recessed grey shadowbox so the neon reads against midtone, not white-on-white
    const shadowbox = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x55575c, roughness: 0.9 }));
    shadowbox.position.set(0, 2.9, -2.78); g.add(shadowbox);
    const sbFrame = new THREE.Mesh(new THREE.BoxGeometry(4.9, 4.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xcfd1d5, roughness: 0.6 }));
    sbFrame.position.set(0, 2.9, -2.86); g.add(sbFrame);
    // the glowing neon wrench sign floating in the shadowbox (the thing WinFix is)
    const wrenchTex = TX.neonWrench();
    const wrench = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2),
      new THREE.MeshBasicMaterial({ map: wrenchTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    wrench.position.set(0, 2.9, -2.7); g.add(wrench);
    const wLight = new THREE.PointLight(0xeef4ff, 9, 8); wLight.position.set(0, 2.9, -1.8); g.add(wLight);
    const wGlow = this.glow(0xf4f8ff, 2.6); wGlow.position.set(0, 2.9, -2.5); wGlow.material.opacity = 0.22; g.add(wGlow);
    // idle beat: the neon flickers half-dead, then heals to a steady burn (repair motif)
    anims.push((t) => {
      const k = this.idleK(g);
      const sick = 0.55 + 0.45 * Math.max(0, Math.sin(t * 21) * Math.sin(t * 6.1) + 0.55);
      const healed = 0.92 + 0.08 * Math.sin(t * 2);
      const b = sick * (1 - k) + healed * k;
      (wrench.material as THREE.MeshBasicMaterial).opacity = b;
      wGlow.material.opacity = 0.22 * b;
      wLight.intensity = 9 * b;
    });
  }

  // 02 Omni-3D — dark warehouse with a glitching mech silhouette
  private buildWarehouse(g: THREE.Group, anims: Animator[]) {
    const metal = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.6, metalness: 0.7 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(16, 11, 0.4), new THREE.MeshStandardMaterial({ color: 0x0d0e12, roughness: 0.9 })); back.position.set(0, 5.5, -5); g.add(back);
    for (let i = 0; i < 5; i++) { const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 0.3), metal); beam.position.set(-6 + i * 3, 4.5, -4.6); g.add(beam); }
    // warehouse shelving racks with crates flanking the mech (master composite look)
    const shelfSteel = new THREE.MeshStandardMaterial({ color: 0x2c2f36, roughness: 0.5, metalness: 0.8 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x4a423a, roughness: 0.85 });
    for (const sx of [-5.4, 5.4]) {
      for (let lvl = 0; lvl < 3; lvl++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 1.5), shelfSteel);
        shelf.position.set(sx, 1 + lvl * 1.5, -2.5); g.add(shelf);
        for (let ci = 0; ci < 3; ci++) {
          if ((lvl + ci) % 3 === 2) continue;
          const cr = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.75, 0.9, 2, 0.03), crateMat);
          cr.position.set(sx - 1.1 + ci * 1.1, 1 + lvl * 1.5 + 0.43, -2.5); cr.rotation.y = (ci + lvl) * 0.12; cr.castShadow = true; g.add(cr);
        }
      }
      for (const px of [sx - 1.7, sx + 1.7]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.6, 0.12), shelfSteel);
        post.position.set(px, 2.3, -2.5); g.add(post);
      }
    }
    // mech: stacked masses
    const mech = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.2), metal); torso.position.y = 3.4; torso.castShadow = true; mech.add(torso);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), metal); head.position.y = 4.9; mech.add(head);
    const hip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.1), metal); hip.position.y = 2.0; mech.add(hip);
    const mkLeg = (x: number) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), metal); l.position.set(x, 0.9, 0); mech.add(l); };
    mkLeg(-0.5); mkLeg(0.5);
    const mkArm = (x: number) => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.4), metal); a.position.set(x, 3.2, 0.2); a.rotation.z = x < 0 ? 0.2 : -0.2; mech.add(a); };
    mkArm(-1.2); mkArm(1.2);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0x0033FF })); eye.position.set(0, 4.95, 0.46); mech.add(eye);
    g.add(mech);
    // idle beat: voxel→wireframe→solid rebuild scan sweeping up the mech
    const wireM = new THREE.Group();
    mech.children.forEach(c0 => {
      const c = c0 as THREE.Mesh;
      if (c.geometry && c.geometry.type === 'BoxGeometry') {
        const w = new THREE.LineSegments(new THREE.WireframeGeometry(c.geometry), new THREE.LineBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0 }));
        w.position.copy(c.position); w.rotation.copy(c.rotation); w.scale.setScalar(1.05); wireM.add(w);
      }
    });
    g.add(wireM);
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.06), new THREE.MeshBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0 }));
    scan.position.z = 0.8; g.add(scan);
    const eg = this.glow(0x0033FF, 1.2); eg.position.set(0, 4.95, 0.6); g.add(eg);
    const rim = new THREE.PointLight(0x2a4cff, 30, 14); rim.position.set(-5, 6, 3); g.add(rim);
    const key = new THREE.SpotLight(0xbfcaff, 40, 20, 0.6, 0.6); key.position.set(3, 8, 5); key.target.position.set(0, 3, 0);
    if (!this.mobile) { key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; key.shadow.radius = 4; }
    g.add(key, key.target);
    anims.push(this.dustPlane(g, 0x3355cc, 6, 6, 0, 3, -1));
    let gt = 0;
    anims.push((_t, dt) => {
      gt -= dt;
      if (gt <= 0 && Math.random() < 0.3) {
        gt = 0.08; mech.position.x = (Math.random() - 0.5) * 0.25;
        (eye.material as THREE.MeshBasicMaterial).color.setHex(Math.random() < 0.5 ? 0xff2255 : 0x0033FF);
      } else if (gt <= 0) mech.position.x = 0;
    });
    anims.push((t) => {
      const k = this.idleK(g), y = (t * 1.1 % 1) * 5.6;
      scan.position.y = y; (scan.material as THREE.MeshBasicMaterial).opacity = k * 0.8;
      wireM.children.forEach(w0 => {
        const w = w0 as THREE.LineSegments;
        (w.material as THREE.LineBasicMaterial).opacity = k * (w.position.y < y ? 0.55 : 0.08);
      });
    });
  }

  // 03 Automation Sys — bright sterile data center with a white robot arm working
  // the aisle (master composite look): glossy floor, ceiling light rails, LED racks
  private buildDataCenter(g: THREE.Group, anims: Animator[]) {
    const rack = new THREE.MeshStandardMaterial({ color: 0xcfd3d8, roughness: 0.35, metalness: 0.5 });
    const rackDoor = new THREE.MeshStandardMaterial({ color: 0x30343b, roughness: 0.25, metalness: 0.7 });
    g.add(new THREE.AmbientLight(0xdce8f0, 0.55));
    // glossy sterile floor
    const dcFloor = new THREE.Mesh(new THREE.CircleGeometry(9.5, 56),
      new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.18, metalness: 0.35 }));
    dcFloor.rotation.x = -Math.PI / 2; dcFloor.position.y = 0.015; dcFloor.receiveShadow = true; g.add(dcFloor);
    const leds: THREE.Mesh[] = [];
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 5; i++) {
        const r = new THREE.Mesh(new RoundedBoxGeometry(1.1, 4.2, 1.4, 2, 0.03), rack);
        r.position.set(side * 3.4, 2.1, -i * 2.6 + 4); r.castShadow = true; g.add(r);
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.02, 3.9, 1.2), rackDoor);
        door.position.set(side * 3.4 - side * 0.56, 2.1, -i * 2.6 + 4); g.add(door);
        for (let j = 0; j < 10; j++) {
          const on = Math.random() < 0.7;
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), new THREE.MeshBasicMaterial({ color: on ? 0x33ffcc : 0x0a2a26 }));
          led.position.set(side * 3.4 + (side < 0 ? 0.58 : -0.58), 0.6 + j * 0.36, -i * 2.6 + 4 + 0.72);
          led.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(led); leds.push(led);
        }
      }
    }
    // white robot arm working the aisle
    const armWhite = new THREE.MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.32, metalness: 0.15 });
    const joint = new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.4, metalness: 0.6 });
    const armG = new THREE.Group(); armG.position.set(0.4, 0, 1.2); g.add(armG);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.35, 32), armWhite); base.position.y = 0.19; base.castShadow = true; armG.add(base);
    const shoulder = new THREE.Group(); shoulder.position.y = 0.45; armG.add(shoulder);
    const j1 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), joint); shoulder.add(j1);
    const upper = new THREE.Mesh(new RoundedBoxGeometry(0.42, 1.7, 0.42, 2, 0.08), armWhite); upper.position.y = 0.85; upper.rotation.z = 0; upper.castShadow = true; shoulder.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = 1.7; shoulder.add(elbow);
    const j2 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16), joint); elbow.add(j2);
    const fore = new THREE.Mesh(new RoundedBoxGeometry(0.34, 1.4, 0.34, 2, 0.07), armWhite); fore.position.y = 0.7; fore.castShadow = true; elbow.add(fore);
    const wristG = new THREE.Group(); wristG.position.y = 1.4; elbow.add(wristG);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.4, 24), joint); head.position.y = 0.18; wristG.add(head);
    const eyeLed = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshBasicMaterial({ color: 0x35d5ee }));
    eyeLed.position.set(0, 0.32, 0.13); wristG.add(eyeLed);
    shoulder.rotation.z = -0.5; elbow.rotation.z = 1.1; wristG.rotation.z = -0.5;
    anims.push((t) => {
      const sway = Math.sin(t * 0.5);
      shoulder.rotation.y = Math.sin(t * 0.3) * 0.7;
      shoulder.rotation.z = -0.5 + sway * 0.12;
      elbow.rotation.z = 1.1 - sway * 0.2;
      wristG.rotation.z = -0.5 + sway * 0.1;
    });
    // ceiling light rails (white) + cyan aisle strips
    for (const x of [-2.2, 0, 2.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 12), new THREE.MeshBasicMaterial({ color: 0xf4f8ff }));
      rail.position.set(x, 4.6, -1); g.add(rail);
    }
    const strip = (x: number) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 12), new THREE.MeshBasicMaterial({ color: 0x00e0ff }));
      s.position.set(x, 4.3, -1); g.add(s);
      const gl = this.glow(0x00e0ff, 2); gl.position.set(x, 4.3, 2); g.add(gl);
    };
    strip(-2.6); strip(2.6);
    const overhead = new THREE.SpotLight(0xf0f6ff, 150, 20, 1.0, 0.55, 1.3);
    overhead.position.set(0, 6.5, 2); overhead.target.position.set(0, 0, 1);
    if (!this.mobile) { overhead.castShadow = true; overhead.shadow.mapSize.set(1024, 1024); overhead.shadow.bias = -0.0004; overhead.shadow.radius = 4; }
    g.add(overhead, overhead.target);
    anims.push(this.dustPlane(g, 0x66eaff, 6, 5, 0, 3, -1));
    anims.push((t) => {
      if ((t * 8 | 0) !== this._dcT) {
        this._dcT = t * 8 | 0;
        for (const l of leds) if (Math.random() < 0.06) (l.material as THREE.MeshBasicMaterial).color.setHex(Math.random() < 0.7 ? 0x33ffcc : 0x0a2a26);
      }
    });
    // idle beat: cascading data pulse sweeping down the aisles
    anims.push((t) => {
      const k = this.idleK(g); if (k < 0.1) return;
      for (const l of leds) {
        const ph = ((l.position.z - t * 6) % 3 + 3) % 3;
        if (ph < 0.35) (l.material as THREE.MeshBasicMaterial).color.setHex(0xaffff0);
      }
    });
  }

  // 04 INSTRUMENT — monolithic brutalist synth console
  private buildSynth(g: THREE.Group, anims: Animator[]) {
    this.softbox(g, 0, 7.8, 1.5, 3, 2, 220, 0xffe6c2);
    const brushed = TX.brushedMetal(512, '#26282e');
    const dark = new THREE.MeshStandardMaterial({ color: 0x8a8d94, roughness: 0.45, metalness: 0.85, map: brushed.map, normalMap: brushed.normalMap });
    const face = new THREE.MeshStandardMaterial({ color: 0x9a9da4, roughness: 0.38, metalness: 0.9, map: brushed.map, normalMap: brushed.normalMap });
    const body = new THREE.Mesh(new RoundedBoxGeometry(5.5, 2.6, 1.8, 2, 0.04), dark); body.position.y = 1.3; body.castShadow = true; g.add(body);
    const panel = new THREE.Mesh(new RoundedBoxGeometry(5.2, 1.6, 0.2, 2, 0.03), face); panel.position.set(0, 1.9, 0.9); panel.rotation.x = -0.5; g.add(panel);
    // glowing key strip across the console lip (master composite: lit blue keys)
    const keys: THREE.Mesh[] = [];
    for (let i = 0; i < 16; i++) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.3), new THREE.MeshBasicMaterial({ color: 0x35b8ee }));
      key.position.set(-2.1 + i * 0.28, 1.34, 1.16); key.rotation.x = -0.5; g.add(key); keys.push(key);
    }
    const keyWash = new THREE.PointLight(0x35b8ee, 7, 5); keyWash.position.set(0, 1.6, 1.6); g.add(keyWash);
    for (let i = 0; i < 9; i++) {
      const k = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.14, 24), new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.3, metalness: 0.7 }));
      k.rotation.x = -0.5 + Math.PI / 2; k.position.set(-2 + i * 0.5, 2.35, 1.05); g.add(k);
      const dot = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.09), new THREE.MeshBasicMaterial({ color: 0xffe6c2 }));
      dot.rotation.x = -0.5 + Math.PI / 2; dot.position.set(-2 + i * 0.5, 2.42, 1.08); g.add(dot);
    }
    const sliders: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const track = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.56, 0.02), new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.4 }));
      track.position.set(-1.5 + i * 0.6, 1.55, 1.015); track.rotation.x = -0.5; g.add(track);
      const sl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.03), new THREE.MeshBasicMaterial({ color: 0x0033FF }));
      sl.position.set(-1.5 + i * 0.6, 1.55, 1.02); sl.rotation.x = -0.5; g.add(sl); sliders.push(sl);
    }
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshBasicMaterial({ color: 0x0a2a4a })); screen.position.set(1.6, 2.15, 1.06); screen.rotation.x = -0.5; g.add(screen);
    anims.push((t) => {
      keys.forEach((key, i) => {
        const on = Math.sin(t * 1.8 + i * 0.7) > -0.2;
        (key.material as THREE.MeshBasicMaterial).color.setHex(on ? 0x35b8ee : 0x0e2a38);
      });
    });
    const amber = new THREE.PointLight(0xffb35a, 8, 8); amber.position.set(-2, 3, 3); g.add(amber);
    const blue = new THREE.PointLight(0x0033FF, 8, 8); blue.position.set(2, 2.5, 2); g.add(blue);
    const gl = this.glow(0x0033FF, 2.2); gl.position.set(0, 1.6, 1.4); g.add(gl);
    anims.push(this.dustPlane(g, 0xffd9a0, 5, 5, 0, 3, -1));
    // idle beat: sliders sequence, screen waveform pulses
    anims.push((t) => {
      const k = this.idleK(g);
      sliders.forEach((sl, i) => { sl.position.y = 1.55 + k * Math.sin(t * 2 + i * 0.9) * 0.12; });
      (screen.material as THREE.MeshBasicMaterial).color.setHSL(0.58, 0.7, 0.12 + k * (0.14 + 0.1 * Math.sin(t * 3)));
    });
  }

  // 05 Titanium Forge — steel press extruding a white-hot billet
  private buildForge(g: THREE.Group, anims: Animator[]) {
    const pressTex = TX.brushedMetal(512, '#33363c');
    const steel = new THREE.MeshStandardMaterial({ color: 0x9a9ca2, roughness: 0.4, metalness: 0.95, map: pressTex.map, normalMap: pressTex.normalMap });
    const topPress = new THREE.Mesh(new RoundedBoxGeometry(3.4, 1.6, 2.4, 2, 0.05), steel); topPress.castShadow = true; g.add(topPress);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.22, 2.0), new THREE.MeshStandardMaterial({ color: 0x1a1b1f, roughness: 0.3, metalness: 0.9 }));
    topPress.add(jaw); jaw.position.y = -0.9;
    const botPress = new THREE.Mesh(new RoundedBoxGeometry(3.4, 1.4, 2.4, 2, 0.05), steel); botPress.position.y = 0.7; botPress.castShadow = true; g.add(botPress);
    const col = (x: number) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 6, 24), steel); c.position.set(x, 3, -0.9); c.castShadow = true; g.add(c);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.4, metalness: 0.9 }));
      collar.position.set(x, 1.6, -0.9); g.add(collar);
    };
    col(-1.9); col(1.9);
    const cap = new THREE.Mesh(new RoundedBoxGeometry(4.6, 0.7, 2.6, 2, 0.06), steel); cap.position.y = 6; g.add(cap);
    // hazard chevrons on the press face
    const hz = document.createElement('canvas'); hz.width = 256; hz.height = 32;
    const hzx = hz.getContext('2d')!;
    for (let i = 0; i < 16; i++) { hzx.fillStyle = i % 2 ? '#151313' : '#c8b93a'; hzx.beginPath(); hzx.moveTo(i * 16, 32); hzx.lineTo(i * 16 + 16, 0); hzx.lineTo(i * 16 + 32, 0); hzx.lineTo(i * 16 + 16, 32); hzx.fill(); }
    const hzT = new THREE.CanvasTexture(hz); hzT.colorSpace = THREE.SRGBColorSpace;
    const hzM = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.18), new THREE.MeshStandardMaterial({ map: hzT, roughness: 0.6 }));
    hzM.position.set(0, 0.28, 1.21); g.add(hzM);
    // white-hot billet with a real heat gradient
    const bc = document.createElement('canvas'); bc.width = bc.height = 64;
    const bcx = bc.getContext('2d')!;
    const bg2 = bcx.createLinearGradient(0, 0, 64, 0);
    bg2.addColorStop(0, '#fff4dd'); bg2.addColorStop(0.5, '#ffb24a'); bg2.addColorStop(1, '#ff5a10');
    bcx.fillStyle = bg2; bcx.fillRect(0, 0, 64, 64);
    const bT = new THREE.CanvasTexture(bc); bT.colorSpace = THREE.SRGBColorSpace;
    const hotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: bT });
    const billet = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.8, 1.2, 2, 0.06), hotMat); billet.position.set(2.6, 1.1, 0); g.add(billet);
    const heat = new THREE.PointLight(0xff4a10, 70, 12, 2); heat.position.set(2.6, 1.3, 0.6); g.add(heat);
    const heat2 = new THREE.PointLight(0xff7a30, 26, 8, 1.8); heat2.position.set(1.2, 1.8, 0.8); g.add(heat2);
    const hg = this.glow(0xff5a1a, 3.2); hg.position.set(2.6, 1.1, 0.4); g.add(hg);
    const rim = new THREE.PointLight(0x3a4a66, 20, 14); rim.position.set(-3, 5, 4); g.add(rim);
    // cool steel key so the press mass reads out of the black (grid look)
    const pressKey = new THREE.SpotLight(0xb8c4d8, 100, 20, 0.7, 0.6);
    pressKey.position.set(-3, 7.5, 4.5); pressKey.target.position.set(0, 2.4, 0);
    if (!this.mobile) { pressKey.castShadow = true; pressKey.shadow.bias = -0.0004; pressKey.shadow.radius = 4; }
    g.add(pressKey, pressKey.target);
    // idle beat: extruded chip cools white-hot → steel as it slides off the press
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd9b0 }));
    chip.visible = false; g.add(chip);
    // sparks
    const sparks: { s: THREE.Sprite; v: THREE.Vector3 }[] = [];
    for (let i = 0; i < 14; i++) { const s = this.glow(0xffb060, 0.4); s.position.set(2.6, 1.1, 0); g.add(s); sparks.push({ s, v: new THREE.Vector3() }); }
    anims.push(this.dustPlane(g, 0xff8844, 5, 5, 1, 3, -1));
    let pt = 0;
    anims.push((_t, dt) => {
      pt += dt; const press = Math.abs(Math.sin(pt * 1.2));
      topPress.position.y = 2.4 + press * 0.9; heat.intensity = 30 + press * 30;
      for (const k of sparks) {
        if (k.s.material.opacity <= 0.02 || k.s.position.y < 0.2) {
          if (Math.random() < 0.25) {
            k.s.position.set(2.6 + (Math.random() - 0.5) * 0.8, 1.1, (Math.random() - 0.5) * 0.8);
            k.v.set((Math.random() - 0.5) * 3, 3 + Math.random() * 3, (Math.random() - 0.5) * 3);
            k.s.material.opacity = 0.9;
          }
        } else {
          k.s.position.addScaledVector(k.v, dt); k.v.y -= 9 * dt; k.s.material.opacity *= 0.94;
        }
      }
    });
    anims.push((t) => {
      const ki = this.idleK(g); chip.visible = ki > 0.2; if (!chip.visible) return;
      const c = (t * 0.5) % 1;
      chip.position.set(2.6 + 1.6 * c, 1.05 - 0.15 * c, 0.9);
      (chip.material as THREE.MeshBasicMaterial).color.setRGB(1 - 0.82 * c, 0.85 - 0.68 * c, 0.7 - 0.5 * c);
    });
  }

  // 06 Game Design Forge — cluttered R&D workbench
  private buildWorkbench(g: THREE.Group, anims: Animator[]) {
    this._gdT = -1;   // reset canvas latch (streaming rebuild)
    // real plank-textured bench + code-running monitors + chalk schematic board
    const wc = document.createElement('canvas'); wc.width = 512; wc.height = 256;
    const wcx = wc.getContext('2d')!;
    wcx.fillStyle = '#4a3b30'; wcx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 90; i++) {
      wcx.strokeStyle = `rgba(${26 + Math.random() * 30 | 0},${18 + Math.random() * 20 | 0},${10 + Math.random() * 12 | 0},0.55)`;
      wcx.lineWidth = 1 + Math.random() * 2; wcx.beginPath();
      const y = Math.random() * 256; wcx.moveTo(0, y);
      wcx.bezierCurveTo(128, y + (Math.random() - 0.5) * 10, 320, y + (Math.random() - 0.5) * 10, 512, y + (Math.random() - 0.5) * 6);
      wcx.stroke();
    }
    for (const px of [128, 256, 384]) { wcx.strokeStyle = 'rgba(0,0,0,0.5)'; wcx.lineWidth = 3; wcx.beginPath(); wcx.moveTo(px, 0); wcx.lineTo(px, 256); wcx.stroke(); }
    const woodT = new THREE.CanvasTexture(wc); woodT.colorSpace = THREE.SRGBColorSpace;
    const wood = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, map: woodT });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x695244, roughness: 0.8, map: woodT });
    const top = new THREE.Mesh(new RoundedBoxGeometry(6, 0.18, 2.6, 2, 0.02), wood); top.position.y = 1.4; top.castShadow = true; top.receiveShadow = true; g.add(top);
    for (const x of [-2.7, 2.7]) for (const z of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), woodDark); leg.position.set(x, 0.7, z); g.add(leg); }
    // chalkboard schematic wall behind the bench (master composite look)
    const board = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshStandardMaterial({ map: TX.chalkboard(), roughness: 0.95 }));
    board.position.set(0, 3.2, -2.4); g.add(board);
    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(6.7, 3.5, 0.1), woodDark);
    boardFrame.position.set(0, 3.2, -2.48); g.add(boardFrame);
    const dark = new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.5, metalness: 0.4 });
    // scattered clutter
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Mesh(new RoundedBoxGeometry(rnd(0.2, 0.6), rnd(0.15, 0.5), rnd(0.2, 0.6), 2, 0.02), dark);
      c.position.set(rnd(-2.5, 2.5), 1.5 + 0.1, rnd(-0.9, 0.9)); c.rotation.y = Math.random() * 3; c.castShadow = true; g.add(c);
    }
    // two monitors actually running code
    const screens: { draw: (t: number) => void }[] = [];
    for (const [mx, accent] of [[-1.4, '#7fd4ff'], [0.4, '#8affc0']] as const) {
      const cs = TX.codeScreen(512, 320, accent);
      const shellM = new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.92, 0.06, 2, 0.02), dark);
      shellM.position.set(mx, 2.2, -0.94); g.add(shellM);
      const mon = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshBasicMaterial({ map: cs.tex })); mon.position.set(mx, 2.2, -0.9); g.add(mon);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.5, 12), dark);
      stand.position.set(mx, 1.65, -0.95); g.add(stand);
      const gl = this.glow(0x1fb0d0, 1.2); gl.position.set(mx, 2.2, -0.7); gl.material.opacity = 0.4; g.add(gl);
      const wash = new THREE.PointLight(accent === '#7fd4ff' ? 0x7fd4ff : 0x8affc0, 2.4, 4); wash.position.set(mx, 2.2, -0.4); g.add(wash);
      screens.push(cs);
    }
    anims.push((t) => { if ((t * 4 | 0) !== this._gdT) { this._gdT = t * 4 | 0; for (const s of screens) s.draw(t); } });
    // desk lamp cone
    const lamp = new THREE.SpotLight(0xfff0d0, 60, 9, 0.75, 0.5); lamp.position.set(1.8, 3.4, 0.6); lamp.target.position.set(0.5, 1.4, 0);
    if (!this.mobile) { lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0004; lamp.shadow.radius = 4; }
    g.add(lamp, lamp.target);
    this.lightCone(g, 0xffe6b0, 1.8, 3.2, 0.6, 1.1, 0.05);
    g.add(new THREE.AmbientLight(0x2a2622, 0.6));
    anims.push(this.dustPlane(g, 0xffe0a0, 5, 4.5, 0, 2.8, 0));
    // idle beat: holographic prototype flickers to life above the bench
    const holo = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.OctahedronGeometry(0.5, 0)), new THREE.LineBasicMaterial({ color: 0x1fb0d0, transparent: true, opacity: 0 }));
    holo.position.set(-0.5, 2.5, 0.2); g.add(holo);
    const hgl = this.glow(0x1fb0d0, 1.4); hgl.position.copy(holo.position); hgl.material.opacity = 0; g.add(hgl);
    anims.push((t, dt) => {
      const k = this.idleK(g);
      holo.rotation.y += dt; holo.position.y = 2.5 + Math.sin(t * 1.4) * 0.08;
      (holo.material as THREE.LineBasicMaterial).opacity = k * (0.5 + 0.3 * Math.sin(t * 9));
      hgl.position.y = holo.position.y; hgl.material.opacity = k * 0.35;
    });
  }

  // 08 Voxel Arcade BB — retro-futuristic cabinet with glowing screen
  private buildArcade(g: THREE.Group, anims: Animator[]) {
    this._arT = -1;   // reset canvas latch (streaming rebuild)
    this.softbox(g, 0, 7.8, 1.2, 3.0, 2.2, 240);                    // overhead pool lighting the floor
    this.lightCone(g, 0xffffff, 0, 7.7, 1.2, 3.2, 0.045);
    const floorSpot = new THREE.SpotLight(0xff9ad0, 24, 12, 0.8, 0.6); floorSpot.position.set(0, 5.5, 3.5); floorSpot.target.position.set(0, 0, 1.5); g.add(floorSpot, floorSpot.target);
    const shell = new THREE.MeshStandardMaterial({ color: 0x161620, roughness: 0.45, metalness: 0.3 });
    // glossy pool under the cabinet so the neon reflects (master composite look)
    const pool2 = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.12, metalness: 0.6 }));
    pool2.rotation.x = -Math.PI / 2; pool2.position.y = 0.018; pool2.receiveShadow = true; g.add(pool2);
    const body = new THREE.Mesh(new RoundedBoxGeometry(2.4, 5.4, 1.6, 2, 0.04), shell); body.position.y = 2.7; body.castShadow = true; g.add(body); // sits on the floor
    // printed side art on both flanks
    const artT = TX.arcadeSideArt();
    for (const sx of [-1.21, 1.21]) {
      const art = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 5.2), new THREE.MeshStandardMaterial({ map: artT, roughness: 0.6 }));
      art.rotation.y = sx < 0 ? -Math.PI / 2 : Math.PI / 2; art.position.set(sx, 2.7, 0); g.add(art);
    }
    const marquee = new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.7, 1.0, 2, 0.03), shell); marquee.position.set(0, 5.35, 0.35); marquee.rotation.x = 0.35; g.add(marquee);
    // lit marquee with the game name
    const mqc = document.createElement('canvas'); mqc.width = 512; mqc.height = 96;
    const mqx = mqc.getContext('2d')!;
    const mg2 = mqx.createLinearGradient(0, 0, 0, 96);
    mg2.addColorStop(0, '#ff2fb8'); mg2.addColorStop(1, '#a4008a');
    mqx.fillStyle = mg2; mqx.fillRect(0, 0, 512, 96);
    mqx.font = '900 52px Arial, sans-serif'; mqx.textAlign = 'center'; mqx.textBaseline = 'middle';
    mqx.fillStyle = '#ffe95c'; mqx.strokeStyle = '#3a0030'; mqx.lineWidth = 8;
    mqx.strokeText('VOXEL BB', 256, 52); mqx.fillText('VOXEL BB', 256, 52);
    const mqT = new THREE.CanvasTexture(mqc); mqT.colorSpace = THREE.SRGBColorSpace;
    const mq = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.42), new THREE.MeshBasicMaterial({ map: mqT })); mq.position.set(0, 5.38, 0.93); mq.rotation.x = 0.35; g.add(mq);
    const mg = this.glow(0xff00aa, 2.2); mg.position.set(0, 5.4, 1.1); g.add(mg);
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const cx = cv.getContext('2d')!;
    const scr = new THREE.CanvasTexture(cv);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.5), new THREE.MeshBasicMaterial({ color: 0xffffff, map: scr })); screen.position.set(0, 3.8, 0.83); g.add(screen);
    // control deck with joysticks + buttons
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 0.9), new THREE.MeshStandardMaterial({ color: 0x0e0e16, roughness: 0.4 }));
    deck.position.set(0, 2.55, 0.85); deck.rotation.x = -0.22; g.add(deck);
    const mkStick = (x: number) => {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x33343c, roughness: 0.35, metalness: 0.6 }));
      st.position.set(x, 2.78, 0.78); st.rotation.x = -0.22; g.add(st);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff2244, roughness: 0.25 }));
      ball.position.set(x, 2.93, 0.745); g.add(ball);
    };
    mkStick(-0.75); mkStick(0.15);
    const btnCols = [0xff00aa, 0x00e5ff, 0xffe000];
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), new THREE.MeshStandardMaterial({ color: btnCols[i], roughness: 0.3, emissive: btnCols[i], emissiveIntensity: 0.4 }));
      b.position.set(0.55 + i * 0.22, 2.64 + i * 0.048, 0.88 - i * 0.02); b.rotation.x = -0.22; g.add(b);
    }
    // coin door with glowing slot
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: 0x22242c, roughness: 0.35, metalness: 0.7 }));
    door.position.set(0, 0.85, 0.81); g.add(door);
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.16), new THREE.MeshBasicMaterial({ color: 0xffe000 }));
    slot.position.set(-0.12, 0.95, 0.845); g.add(slot);
    const slot2 = slot.clone(); slot2.position.x = 0.12; g.add(slot2);
    const sg = this.glow(0xffe000, 0.5); sg.position.set(0, 0.95, 0.9); g.add(sg);
    const mkEdge = (x: number, c: number) => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.4, 0.08), new THREE.MeshBasicMaterial({ color: c })); e.position.set(x, 2.7, 0.82); g.add(e);
      const gl = this.glow(c, 1.6); gl.position.set(x, 2.7, 0.9); g.add(gl);
    };
    mkEdge(-1.24, 0xff00aa); mkEdge(1.24, 0x00e5ff);
    const lp = new THREE.PointLight(0xff00aa, 10, 8); lp.position.set(-2, 3, 2); g.add(lp);
    const lc = new THREE.PointLight(0x00e5ff, 10, 8); lc.position.set(2, 3, 2); g.add(lc);
    anims.push((t) => {
      if ((t * 12 | 0) === this._arT) return; this._arT = t * 12 | 0;
      cx.fillStyle = '#0a0420'; cx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 20; i++) {
        cx.fillStyle = ['#ff00aa', '#00e5ff', '#ffe000'][i % 3]; const s = 8;
        cx.fillRect((Math.sin(t * 2 + i) * 4 + 8) * s % 128, ((i * 13 + (t * 20 | 0)) % 16) * s, s, s);
      }
      // idle beat: attract mode — PRESS START blink + bouncing voxel ball
      if ((t * 1.5 | 0) % 2) { cx.fillStyle = '#fff'; cx.font = 'bold 13px monospace'; cx.fillText('PRESS START', 22, 118); }
      cx.fillStyle = '#ff8800'; cx.fillRect(60 + Math.sin(t * 2.2) * 42, 58 - Math.abs(Math.sin(t * 4.4)) * 36, 8, 8);
      scr.needsUpdate = true;
    });
  }

  // 10 Learning App — big colorful kids tablet floating in the air (ReadingLand)
  private buildFloatCube(g: THREE.Group, anims: Animator[]) {
    this._laT = -1;   // reset canvas latch (streaming rebuild)
    this.softbox(g, 0, 8, 0.5, 2.6, 2.6, 130);
    const tabletG = new THREE.Group(); tabletG.position.y = 2.7; g.add(tabletG);
    const caseMat = new THREE.MeshStandardMaterial({ color: 0xff6b4a, roughness: 0.55 });   // chunky coral kid case
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 0.22), caseMat); body.castShadow = true; tabletG.add(body);
    for (const [bx, by] of [[-1.65, 1.15], [1.65, 1.15], [-1.65, -1.15], [1.65, -1.15]]) {
      const bump = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd93b, roughness: 0.5 }));
      bump.position.set(bx, by, 0); bump.scale.z = 0.6; tabletG.add(bump);
    }
    const home = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0x59c9f0, roughness: 0.4 }));
    home.rotation.x = Math.PI / 2; home.position.set(0, -1.05, 0.12); tabletG.add(home);
    const gc = document.createElement('canvas'); gc.width = 256; gc.height = 176;
    const gcx = gc.getContext('2d')!; const gtex = new THREE.CanvasTexture(gc);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.95), new THREE.MeshBasicMaterial({ map: gtex }));
    screen.position.z = 0.115; tabletG.add(screen);
    const sglow = this.glow(0xaee6ff, 3.4); sglow.position.set(0, 2.7, 0.6); g.add(sglow); sglow.material.opacity = 0.3;
    const slight = new THREE.PointLight(0xaee6ff, 8, 7); slight.position.set(0, 2.7, 1.4); g.add(slight);
    const under = this.glow(0xffd93b, 2.6); under.position.set(0, 1.1, 0); g.add(under); under.material.opacity = 0.4;
    const up = new THREE.PointLight(0xffb060, 8, 8); up.position.set(0, 0.6, 0); g.add(up);
    // screen scenes: fun image behind each letter, letter in a contrasting color
    const drawScene = (li: number) => {
      const W = 256, H = 176;
      if (li === 0) {            // A — sunny meadow, deep-navy letter
        gcx.fillStyle = '#8fd4ff'; gcx.fillRect(0, 0, W, H);
        gcx.fillStyle = '#ffd93b'; gcx.beginPath(); gcx.arc(210, 38, 26, 0, 7); gcx.fill();
        gcx.fillStyle = '#7ed957'; gcx.beginPath(); gcx.ellipse(70, H + 10, 120, 55, 0, 0, 7); gcx.fill();
        gcx.beginPath(); gcx.ellipse(210, H + 16, 110, 48, 0, 0, 7); gcx.fill();
        gcx.fillStyle = '#ffffff';
        for (const [cx2, cy2] of [[60, 40], [120, 26]]) { gcx.beginPath(); gcx.arc(cx2, cy2, 13, 0, 7); gcx.arc(cx2 + 16, cy2 + 4, 10, 0, 7); gcx.fill(); }
        gcx.fillStyle = '#1c2f7a';
      } else if (li === 1) {     // B — underwater bubbles, white letter w/ navy outline
        gcx.fillStyle = '#2ec4b6'; gcx.fillRect(0, 0, W, H);
        gcx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 9; i++) { gcx.beginPath(); gcx.arc((i * 53 + 20) % W, (i * 37 + 15) % H, 5 + (i % 3) * 4, 0, 7); gcx.fill(); }
        gcx.fillStyle = '#177e6f'; for (let i = 0; i < 4; i++) gcx.fillRect(18 + i * 68, H - 42, 7, 42);
        gcx.fillStyle = '#ff8c42'; gcx.beginPath(); gcx.ellipse(205, 130, 17, 10, 0, 0, 7); gcx.fill();
        gcx.beginPath(); gcx.moveTo(222, 130); gcx.lineTo(236, 120); gcx.lineTo(236, 140); gcx.fill();
        gcx.fillStyle = '#ffffff';
      } else {                   // C — starry night + moon, sunny-yellow letter
        gcx.fillStyle = '#5b3fa8'; gcx.fillRect(0, 0, W, H);
        gcx.fillStyle = '#fff7d6'; gcx.beginPath(); gcx.arc(216, 40, 22, 0, 7); gcx.fill();
        gcx.fillStyle = '#5b3fa8'; gcx.beginPath(); gcx.arc(207, 34, 18, 0, 7); gcx.fill();
        gcx.fillStyle = '#ffffff';
        for (let i = 0; i < 14; i++) { const sx = (i * 71 + 13) % W, sy = (i * 47 + 9) % H; gcx.fillRect(sx, sy, 3, 3); }
        gcx.fillStyle = '#ffe14d';
      }
      const fill = gcx.fillStyle;
      gcx.font = 'bold 120px sans-serif'; gcx.textAlign = 'center'; gcx.textBaseline = 'middle';
      gcx.lineWidth = 10; gcx.strokeStyle = li === 1 ? '#0e3a4a' : 'rgba(255,255,255,0.9)';
      if (li !== 1) gcx.strokeStyle = li === 0 ? '#ffffff' : '#4a2c00';
      gcx.strokeText('ABC'[li], W / 2, H / 2 + 6); gcx.fillStyle = fill; gcx.fillText('ABC'[li], W / 2, H / 2 + 6);
      gtex.needsUpdate = true;
    };
    drawScene(0);
    anims.push(this.dustPlane(g, 0xffffff, 4, 6, 0, 3.2, -0.5));
    anims.push((t) => {
      tabletG.position.y = 2.7 + Math.sin(t * 0.7) * 0.18;
      tabletG.rotation.y = Math.sin(t * 0.25) * 0.3;
      tabletG.rotation.z = Math.sin(t * 0.4) * 0.05;
    });
    // idle beat: letter cycles A→B→C; gentle stars drift upward (ReadingLand)
    const stars: THREE.Sprite[] = [];
    for (let i = 0; i < 5; i++) { const s = this.glow(0xffd93b, 0.35); s.material.opacity = 0; g.add(s); stars.push(s); }
    anims.push((t) => {
      const li = (t / 1.6 | 0) % 3;
      if (li !== this._laT) { this._laT = li; drawScene(li); }
      const k = this.idleK(g);
      stars.forEach((s, i) => {
        const c = (t * 0.25 + i / 5) % 1;
        s.position.set(Math.sin(i * 2.4) * 1.8, 1 + c * 3.2, Math.cos(i * 2.4) * 1.2);
        s.material.opacity = k * (1 - c) * 0.6;
      });
    });
  }

  // 11 Flow State — obsidian space; the churning fluid lives inside a glass cube
  // on a lit white pedestal (master composite look)
  private buildFluid(g: THREE.Group, anims: Animator[]) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.15, metalness: 0.9 }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; g.add(pool);
    // pedestal
    const ped = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.9, 2.2, 2, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xdadce0, roughness: 0.4 }));
    ped.position.y = 0.45; ped.castShadow = true; g.add(ped);
    const pedLight = new THREE.SpotLight(0xffffff, 60, 12, 0.6, 0.6); pedLight.position.set(0, 6.5, 1.5); pedLight.target.position.set(0, 1, 0);
    if (!this.mobile) { pedLight.castShadow = true; pedLight.shadow.bias = -0.0004; }
    g.add(pedLight, pedLight.target);
    // glass tank
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 0.97,
      thickness: 0.15, ior: 1.45, transparent: true
    });
    const tank = new THREE.Mesh(new RoundedBoxGeometry(2.3, 2.3, 2.3, 3, 0.06), glass);
    tank.position.y = 2.1; g.add(tank);
    // churning fluid, cube-shaped to fill the tank
    const geo = new THREE.BoxGeometry(1.9, 1.9, 1.9, 24, 24, 24);
    const { mat, uTime } = makeFluidMaterial();
    const orb = new THREE.Mesh(geo, mat); orb.position.y = 2.1; orb.scale.setScalar(0.75); g.add(orb);
    const glow = this.glow(0x0a3aff, 2.6); glow.material.opacity = 0.35; glow.position.set(0, 2.1, 0); g.add(glow);
    const key = new THREE.PointLight(0x2a5cff, 12, 14); key.position.set(0, 5, 4); g.add(key);
    const rim = new THREE.PointLight(0x0022aa, 8, 12); rim.position.set(-4, 2, -2); g.add(rim);
    anims.push(this.dustPlane(g, 0x3366ff, 5, 6, 0, 3, -1));
    anims.push((t) => { uTime.value = t; orb.rotation.y = t * 0.15; });
    // idle beat: voice ripples expand across the obsidian pool
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      r.rotation.x = -Math.PI / 2; r.position.y = 0.05; g.add(r); rings.push(r);
    }
    anims.push((t) => {
      const k = this.idleK(g);
      rings.forEach((r, i) => {
        const c = (t * 0.35 + i / 3) % 1;
        r.scale.setScalar(0.4 + c * 3.6);
        (r.material as THREE.MeshBasicMaterial).opacity = k * (1 - c) * 0.5;
      });
    });
  }
}
