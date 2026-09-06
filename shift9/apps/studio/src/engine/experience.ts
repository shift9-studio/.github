/* SHIFT-9 engine core — ported 1:1 from reference/shift9-scene.js (Shift9Scene).
   Damped-velocity dolly, set streaming, cinematic glide, tunnel intro, HUD
   event plumbing. Physics values are the visual contract (BUILD_CONTRACT §2):
   wheel adds VELOCITY, never position; damping pow(1-0.05, dt*60); |vel| ≤ 3.0;
   z clamped [-250, 50]. Per-set builders land in Phases 3-4 (src/engine/sets). */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  DoubleSide,
  Fog,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SpotLight,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from 'three';
import { SCENE_CONSTANTS } from '../constants';
import { PROJECTS, type Project } from '../projects';
import { CONE_FRAG, DUST_FRAG, VUV_VERT } from './shaders';
import { SET_BUILDERS } from './sets';

export interface HudDetail {
  id: string;
  name: string;
  status: string;
  accent: string;
  index: string;
  progress: number;
  idle: boolean;
  dist: number;
  tag: string;
  spec: string;
}

export type AnimatorFn = (t: number, dt: number) => void;

interface Animator {
  fn: AnimatorFn;
  setId?: string;
}

interface GlideState {
  from: number;
  to: number;
  t: number;
  dur: number;
}

interface IntroState {
  t: number;
  dur: number;
  grp: Group;
  frames: Group[];
}

interface EngineState {
  vel: number;
  z: number;
  t: number;
  built: Map<string, { group: Group }>;
  animators: Animator[];
  locked: boolean;
  glide: GlideState | null;
  intro: IntroState | null;
}

declare global {
  interface DocumentEventMap {
    'shift9-hud': CustomEvent<HudDetail>;
    'shift9-open': CustomEvent<{ id: string }>;
    'shift9-ready': CustomEvent<void>;
    'shift9-entered': CustomEvent<void>;
  }
  interface Window {
    /* Harness hooks (harness/*.mjs) — jump the dolly / read physics state. */
    __S9_SET_Z?: (z: number) => void;
    __S9_GLIDE?: (z: number) => void;
    __S9_STATE?: () => { z: number; vel: number; locked: boolean; glide: boolean; intro: boolean };
  }
}

interface Disposable3D extends Object3D {
  geometry?: BufferGeometry;
  material?: Material | Material[];
}

const disposeDeep = (root: Object3D): void => {
  root.traverse((o) => {
    const d = o as Disposable3D;
    d.geometry?.dispose();
    if (Array.isArray(d.material)) for (const m of d.material) m.dispose();
    else d.material?.dispose();
  });
};

const easeInOutCubic = (k: number): number =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

export class StudioEngine {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly state: EngineState;
  readonly glowTex: Texture;

  private readonly root: HTMLElement;
  private readonly resizeObserver: ResizeObserver;
  private raf = 0;
  private hudKey = '';
  private fogFarBeforeIntro = 0;

  private readonly onWheel: (e: WheelEvent) => void;
  private readonly onKey: (e: KeyboardEvent) => void;
  private readonly onTouchStart: (e: TouchEvent) => void;
  private readonly onTouchMove: (e: TouchEvent) => void;
  private readonly onClick: () => void;

  constructor(root: HTMLElement) {
    this.root = root;
    const C = SCENE_CONSTANTS;

    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    // "super high resolution": device pixel ratio, no cap (handoff README).
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    root.append(this.renderer.domElement);

    this.scene = new Scene();
    this.scene.background = new Color(0x000000);
    this.scene.fog = new Fog(0x000000, 8, 55);
    this.scene.add(new AmbientLight(0x111114, 0.6));

    this.camera = new PerspectiveCamera(42, 1, 0.1, 400);
    this.camera.position.set(0, 2.2, C.CAMERA_START_Z);

    this.state = {
      vel: 0,
      z: C.CAMERA_START_Z,
      t: 0,
      built: new Map(),
      animators: [],
      locked: false,
      glide: null,
      intro: null,
    };
    this.glowTex = this.makeGlowTexture();

    const resize = (): void => {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    resize();
    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(root);

    const addVel = (d: number): void => {
      if (this.state.locked) return; // detail page open — dolly frozen
      this.state.glide = null; // any manual input cancels an auto-glide
      this.state.vel = Math.max(-C.MAX_VELOCITY, Math.min(C.MAX_VELOCITY, this.state.vel + d));
    };
    this.onWheel = (e) => {
      if (this.state.locked) return;
      e.preventDefault();
      addVel(e.deltaY * C.SCROLL_SENSITIVITY * 60 * 0.016);
    };
    addEventListener('wheel', this.onWheel, { passive: false });
    this.onKey = (e) => {
      if (e.key === 'ArrowDown') addVel(-0.4);
      if (e.key === 'ArrowUp') addVel(0.4);
    };
    addEventListener('keydown', this.onKey);
    let ty: number | null = null;
    this.onTouchStart = (e) => {
      ty = e.touches[0].clientY;
    };
    this.onTouchMove = (e) => {
      if (ty != null) {
        addVel((e.touches[0].clientY - ty) * 0.004);
        ty = e.touches[0].clientY;
      }
    };
    addEventListener('touchstart', this.onTouchStart);
    addEventListener('touchmove', this.onTouchMove);

    // idle click on the set → open its portfolio detail page (shell listens)
    this.onClick = () => {
      const s = this.state;
      if (s.locked || s.glide || Math.abs(s.vel) >= 0.01) return;
      let best: Project | null = null;
      let bd = 1e9;
      for (const p of PROJECTS) {
        const d = Math.abs(s.z - p.z) + (p.z < s.z ? 0 : 30);
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      if (best && Math.abs(s.z - best.z) < 26) {
        this.emit('shift9-open', { id: best.id });
      }
    };
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.renderer.domElement.style.cursor = 'pointer';
  }

  start(): void {
    let last = performance.now();
    const C = SCENE_CONSTANTS;
    const loop = (now: number): void => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = this.state;
      s.t += dt;
      if (s.intro) {
        // entry tunnel — dive through the machine
        const I = s.intro;
        I.t += dt;
        const k = Math.min(I.t / I.dur, 1);
        const e = easeInOutCubic(k);
        s.z = 262 - (262 - C.CAMERA_START_Z) * e;
        s.vel = 0;
        this.camera.fov = 42 + 30 * Math.sin(Math.PI * k);
        this.camera.updateProjectionMatrix();
        this.camera.rotation.z = Math.sin(k * Math.PI * 2) * 0.05;
        for (let i = 0; i < I.frames.length; i++) I.frames[i].rotation.z += dt * (i % 2 ? 0.9 : -0.7);
        if (k >= 1) this.endIntro();
      } else if (s.glide != null) {
        // cinematic auto-dolly to a set
        s.glide.t += dt;
        const k = Math.min(s.glide.t / s.glide.dur, 1);
        const e = easeInOutCubic(k);
        s.z = s.glide.from + (s.glide.to - s.glide.from) * e;
        s.vel = 0;
        if (k >= 1) {
          s.z = s.glide.to;
          s.glide = null;
        }
      } else {
        s.vel *= Math.pow(1 - C.VELOCITY_DAMPING, dt * 60); // friction on velocity, not position
        s.z = Math.max(C.CAMERA_END_Z, Math.min(C.CAMERA_START_Z, s.z + s.vel * dt * 60));
        if (s.z === C.CAMERA_END_Z || s.z === C.CAMERA_START_Z) s.vel = 0;
      }
      this.camera.position.z = s.z;
      this.camera.position.x = Math.sin(s.t * 0.13) * 0.12; // subtle handheld drift
      this.camera.position.y = 2.2 + Math.sin(s.t * 0.19) * 0.06;
      this.stream();
      for (const a of s.animators) a.fn(s.t, dt);
      this.renderer.render(this.scene, this.camera);
      this.emitHud();
    };
    this.raf = requestAnimationFrame(loop);
    this.emit('shift9-ready', undefined);
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    removeEventListener('wheel', this.onWheel);
    removeEventListener('keydown', this.onKey);
    removeEventListener('touchstart', this.onTouchStart);
    removeEventListener('touchmove', this.onTouchMove);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.dispose();
  }

  setLocked(v: boolean): void {
    this.state.locked = v;
  }

  playIntro(skip: boolean): void {
    const s = this.state;
    if (skip) {
      s.z = SCENE_CONSTANTS.CAMERA_START_Z;
      return;
    }
    s.locked = true;
    const fog = this.scene.fog as Fog;
    this.fogFarBeforeIntro = fog.far;
    fog.far = 210;
    fog.near = 24;
    const grp = new Group();
    const frames: Group[] = [];
    for (let i = 0; i < 34; i++) {
      // chassis bulkheads flying past
      const fr = new Group();
      const m = new MeshBasicMaterial({
        color: i % 5 === 0 ? 0x0033ff : i % 5 === 2 ? 0x2244aa : 0x20242e,
      });
      const W = 7 + (i % 3);
      const H = 5.5 + (i % 2) * 1.5;
      const bar = (w: number, h: number, x: number, y: number): void => {
        const b = new Mesh(new BoxGeometry(w, h, 0.18), m);
        b.position.set(x, y, 0);
        fr.add(b);
      };
      bar(0.16, H, -W / 2, H / 2 + 0.2);
      bar(0.16, H, W / 2, H / 2 + 0.2);
      bar(W + 0.16, 0.16, 0, H + 0.2);
      bar(W + 0.16, 0.16, 0, 0.2);
      fr.position.z = 58 + i * 6.2;
      fr.rotation.z = (Math.random() - 0.5) * 0.25;
      grp.add(fr);
      frames.push(fr);
    }
    const sm = new MeshBasicMaterial({
      color: 0x9fb6ff,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
    });
    for (let i = 0; i < 140; i++) {
      // light streaks
      const st = new Mesh(new BoxGeometry(0.03, 0.03, 5 + Math.random() * 9), sm);
      const a = Math.random() * Math.PI * 2;
      const r = 2.2 + Math.random() * 5.5;
      st.position.set(Math.cos(a) * r, 2.2 + Math.sin(a) * r, 55 + Math.random() * 210);
      grp.add(st);
    }
    this.scene.add(grp);
    s.intro = { t: 0, dur: 2.6, grp, frames };
    s.z = 262;
  }

  endIntro(): void {
    const s = this.state;
    const I = s.intro;
    s.intro = null;
    s.locked = false;
    s.z = SCENE_CONSTANTS.CAMERA_START_Z;
    this.camera.fov = 42;
    this.camera.updateProjectionMatrix();
    this.camera.rotation.z = 0;
    const fog = this.scene.fog as Fog;
    fog.far = this.fogFarBeforeIntro || 55;
    fog.near = 8;
    if (I) {
      this.scene.remove(I.grp);
      disposeDeep(I.grp);
    }
    this.emit('shift9-entered', undefined);
  }

  /** 0..1 — how settled the camera is at this set's viewing mark. */
  idleK(g: Group, span?: number): number {
    const d = Math.abs(this.state.z - g.position.z - 13);
    const near = Math.max(0, 1 - d / (span || 16));
    return Math.abs(this.state.vel) < 0.02 && !this.state.glide ? near : 0;
  }

  glideTo(z: number): void {
    const C = SCENE_CONSTANTS;
    const to = Math.max(C.CAMERA_END_Z, Math.min(C.CAMERA_START_Z, z));
    const from = this.state.z;
    const dist = Math.abs(to - from);
    if (dist < 0.5) return;
    this.state.vel = 0;
    this.state.glide = { from, to, t: 0, dur: Math.min(3.2, 0.9 + dist / 90) }; // longer travel = longer, capped
  }

  private emit<T>(type: string, detail: T): void {
    this.root.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
  }

  private emitHud(): void {
    const s = this.state;
    if (s.intro) return;
    let best: Project = PROJECTS[0];
    let bd = 1e9;
    for (const p of PROJECTS) {
      // prefer nearest set AHEAD of camera (p.z < camZ)
      const ahead = p.z < s.z;
      const d = Math.abs(s.z - p.z) + (ahead ? 0 : 30);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    bd = Math.abs(s.z - best.z);
    const C = SCENE_CONSTANTS;
    const prog = (C.CAMERA_START_Z - s.z) / (C.CAMERA_START_Z - C.CAMERA_END_Z);
    const key = best.id + '|' + Math.round(prog * 200) + '|' + (Math.abs(s.vel) < 0.01 ? 1 : 0);
    if (key !== this.hudKey) {
      this.hudKey = key;
      this.emit<HudDetail>('shift9-hud', {
        id: best.id,
        name: best.n,
        status: best.status,
        accent: best.accent,
        index: best.id.slice(0, 2),
        progress: prog,
        idle: Math.abs(s.vel) < 0.01,
        dist: bd,
        tag: best.tag,
        spec: best.spec,
      });
    }
  }

  private makeGlowTexture(): Texture {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new CanvasTexture(c);
  }

  glow(color: Color | string | number, size: number): Sprite {
    const m = new Sprite(
      new SpriteMaterial({
        map: this.glowTex,
        color,
        transparent: true,
        opacity: 0.85,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    m.scale.setScalar(size);
    return m;
  }

  private stream(): void {
    const C = SCENE_CONSTANTS;
    const s = this.state;
    for (const p of PROJECTS) {
      const d = Math.abs(s.z - p.z);
      const have = s.built.has(p.id);
      if (!have && d < C.LOAD_RADIUS) this.buildSet(p);
      else if (have && d > C.UNLOAD_RADIUS) this.destroySet(p);
    }
  }

  private destroySet(p: Project): void {
    const e = this.state.built.get(p.id);
    if (!e) return;
    this.scene.remove(e.group);
    disposeDeep(e.group);
    this.state.animators = this.state.animators.filter((a) => a.setId !== p.id);
    this.state.built.delete(p.id);
  }

  private buildSet(p: Project): void {
    const g = new Group();
    g.position.z = p.z;
    // shared soundstage floor pool of light
    const floor = new Mesh(
      new CircleGeometry(9, 48),
      new MeshStandardMaterial({ color: 0x16161a, roughness: 0.9, metalness: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);
    const anims: AnimatorFn[] = [];
    // Per-set builders are ported 1:1 in Phases 3-4 (BUILD_CONTRACT phase table).
    const build = SET_BUILDERS[p.kind];
    if (build) build(this, g, anims, p);
    for (const fn of anims) this.state.animators.push({ fn, setId: p.id });
    this.scene.add(g);
    this.state.built.set(p.id, { group: g });
  }

  /* ── Stagecraft helpers shared by the set builders (Phases 3-4) ────────── */

  softbox(
    g: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    intensity: number,
    color?: Color | string | number,
  ): SpotLight {
    const panel = new Mesh(
      new PlaneGeometry(w, h),
      new MeshBasicMaterial({ color: color ?? 0xffffff }),
    );
    panel.position.set(x, y, z);
    panel.rotation.x = Math.PI / 2;
    g.add(panel);
    const gl = this.glow(color ?? 0xffffff, w * 2.2);
    gl.position.set(x, y - 0.2, z);
    g.add(gl);
    const sp = new SpotLight(color ?? 0xffffff, intensity, y * 3, 0.9, 0.5, 1.2);
    sp.position.set(x, y, z);
    sp.target.position.set(x, 0, z);
    g.add(sp, sp.target);
    return sp;
  }

  dustPlane(
    g: Group,
    color: Color | string | number,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    ry?: number,
  ): AnimatorFn {
    const mat = new ShaderMaterial({
      vertexShader: VUV_VERT,
      fragmentShader: DUST_FRAG,
      uniforms: { uTime: { value: 0 }, uColor: { value: new Color(color) }, uFade: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    const m = new Mesh(new PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry || 0;
    g.add(m);
    const wz = (): number => g.position.z + z;
    return (t) => {
      mat.uniforms.uTime.value = t;
      const d = Math.abs(this.state.z - wz());
      mat.uniforms.uFade.value = Math.min(Math.max((d - 4) / 8, 0), 1); // fade out near camera
    };
  }

  lightCone(
    g: Group,
    color: Color | string | number,
    x: number,
    topY: number,
    z: number,
    r: number,
    opacity: number,
  ): ShaderMaterial {
    const geo = new ConeGeometry(r, topY, 32, 1, true);
    const mat = new ShaderMaterial({
      vertexShader: VUV_VERT,
      fragmentShader: CONE_FRAG,
      uniforms: { uColor: { value: new Color(color) }, uOp: { value: opacity } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    const m = new Mesh(geo, mat);
    m.position.set(x, topY / 2, z);
    g.add(m);
    return mat;
  }
}

export async function startExperience(root: HTMLElement): Promise<StudioEngine> {
  const engine = new StudioEngine(root);
  // Harness hooks — headless physics verification & screenshot jumps.
  window.__S9_SET_Z = (z: number) => {
    if (engine.state.intro) engine.endIntro();
    engine.state.glide = null;
    engine.state.vel = 0;
    engine.state.z = z;
  };
  window.__S9_GLIDE = (z: number) => engine.glideTo(z);
  window.__S9_STATE = () => ({
    z: engine.state.z,
    vel: engine.state.vel,
    locked: engine.state.locked,
    glide: engine.state.glide !== null,
    intro: engine.state.intro !== null,
  });
  engine.start();
  return engine;
}
