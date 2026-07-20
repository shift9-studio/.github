/* <shift9-scene> — the SHIFT-9 engine, ported 1:1 from the reference
   (reference/shift9-scene.js): damped-velocity dolly, streaming stages,
   intro tunnel, glide, HUD emitter, handheld drift.
   Production changes vs the reference:
   - WebGPURenderer (WebGPU primary, automatic WebGL2 backend fallback),
     uncapped DPR on desktop, capped 1.5 on mobile.
   - Cinematic post stack (./post) with velocity blur + dive boost;
     falls back to plain renderer.render if post creation throws.
   - Studio audio engine wiring (dolly wind, room tone, tunnel dive).
   - TWEAKS applied at init; applyTweaks() exposed for the debug panel. */
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { PROJECTS, type Project } from '../projects';
import { SCENE_CONSTANTS, TWEAKS, isCoarsePointer } from '../constants';
import { audio } from '../audio/engine';
import type { PostFX } from './postTypes';
import { SetBuilder, type Animator } from './sets';

interface GlideState { from: number; to: number; t: number; dur: number }
interface IntroState { t: number; dur: number; grp: THREE.Group; frames: THREE.Group[] }

interface EngineState {
  vel: number;
  z: number;
  t: number;
  built: Map<string, { group: THREE.Group }>;
  animators: Animator[];
  locked: boolean;
  glide: GlideState | null;
  intro: IntroState | null;
}

export interface HudDetail {
  id: string; name: string; status: string; accent: string; index: string;
  progress: number; idle: boolean; dist: number; tag: string; spec: string;
}

export class Shift9Scene extends HTMLElement {
  private renderer: WebGPURenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private post: PostFX | null = null;
  private builder: SetBuilder | null = null;
  private glowTex: THREE.CanvasTexture | null = null;
  private state: EngineState = {
    vel: 0, z: SCENE_CONSTANTS.CAMERA_START_Z, t: 0,
    built: new Map(), animators: [], locked: false, glide: null, intro: null,
  };
  private mobile = false;
  private damping = TWEAKS.damping;
  private sensitivity = TWEAKS.sensitivity;
  private fogFarBase = TWEAKS.fogFar;
  private raf = 0;
  private ro: ResizeObserver | null = null;
  private hudKey = '';
  private roomKey = '';
  private pendingIntro = false;
  private ready = false;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private tsHandler: ((e: TouchEvent) => void) | null = null;
  private tmHandler: ((e: TouchEvent) => void) | null = null;
  private clickHandler: (() => void) | null = null;

  async connectedCallback(): Promise<void> {
    this.style.cssText = 'display:block;width:100%;height:100%;background:#000;';
    this.mobile = isCoarsePointer();

    const renderer = new WebGPURenderer({ antialias: true });
    await renderer.init();
    if (!this.isConnected) { renderer.dispose(); return; }
    // "super high resolution" contract: uncapped DPR on desktop, 1.5 cap on mobile
    renderer.setPixelRatio(this.mobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    this.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 8, this.fogFarBase);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    camera.position.set(0, 2.2, SCENE_CONSTANTS.CAMERA_START_Z);
    scene.add(new THREE.AmbientLight(0x111114, 0.6));
    this.renderer = renderer; this.scene = scene; this.camera = camera;
    this.glowTex = makeGlowTexture();
    this.builder = new SetBuilder({
      glowTex: this.glowTex,
      getZ: () => this.state.z,
      getVel: () => this.state.vel,
      isGliding: () => this.state.glide !== null,
    });

    // post stack — fall back to plain rendering if creation throws
    try {
      const { createPostFX } = await import('./post');
      if (!this.isConnected) { renderer.dispose(); return; }
      this.post = createPostFX(renderer, scene, camera, { mobile: this.mobile });
    } catch {
      this.post = null;
    }

    const resize = () => {
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      this.post?.setSize(w, h);
    };
    resize();
    this.ro = new ResizeObserver(resize); this.ro.observe(this);

    const C = SCENE_CONSTANTS;
    const addVel = (d: number) => {
      if (this.state.locked) return;                 // detail page open — dolly frozen
      this.state.glide = null;                       // any manual input cancels an auto-glide
      this.state.vel = Math.max(-C.MAX_VELOCITY, Math.min(C.MAX_VELOCITY, this.state.vel + d));
    };
    this.wheelHandler = (e: WheelEvent) => {
      if (this.state.locked) return;
      e.preventDefault();
      addVel(e.deltaY * this.sensitivity * 60 * 0.016);
    };
    addEventListener('wheel', this.wheelHandler, { passive: false });
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') addVel(-0.4);
      if (e.key === 'ArrowUp') addVel(0.4);
    };
    addEventListener('keydown', this.keyHandler);
    let ty: number | null = null;
    this.tsHandler = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    this.tmHandler = (e: TouchEvent) => {
      if (ty != null) { addVel((e.touches[0].clientY - ty) * 0.004); ty = e.touches[0].clientY; }
    };
    addEventListener('touchstart', this.tsHandler); addEventListener('touchmove', this.tmHandler);
    // idle click on the set → open its portfolio detail page (shell listens)
    this.clickHandler = () => {
      const s = this.state;
      if (s.locked || s.glide || Math.abs(s.vel) >= 0.01) return;
      let best: Project = PROJECTS[0], bd = 1e9;
      for (const p of PROJECTS) {
        const d = Math.abs(s.z - p.z) + (p.z < s.z ? 0 : 30);
        if (d < bd) { bd = d; best = p; }
      }
      if (Math.abs(s.z - best.z) < 26) {
        this.dispatchEvent(new CustomEvent('shift9-open', { bubbles: true, detail: { id: best.id } }));
      }
    };
    renderer.domElement.addEventListener('click', this.clickHandler);
    renderer.domElement.style.cursor = 'pointer';

    let last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const s = this.state;
      s.t += dt;
      const C2 = SCENE_CONSTANTS;
      let diveBoost = 0;
      if (s.intro) {                                                 // entry tunnel — dive through the machine
        const I = s.intro; I.t += dt;
        const k = Math.min(I.t / I.dur, 1);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        s.z = 262 - (262 - C2.CAMERA_START_Z) * e;
        s.vel = 0;
        camera.fov = 42 + 30 * Math.sin(Math.PI * k); camera.updateProjectionMatrix();
        camera.rotation.z = Math.sin(k * Math.PI * 2) * 0.05;
        for (let i = 0; i < I.frames.length; i++) I.frames[i].rotation.z += dt * (i % 2 ? 0.9 : -0.7);
        diveBoost = Math.sin(Math.PI * k);
        if (k >= 1) this.endIntro();
      } else if (s.glide != null) {                                  // cinematic auto-dolly to a set
        s.glide.t += dt;
        const dur = s.glide.dur;
        const k = Math.min(s.glide.t / dur, 1);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // easeInOutCubic
        s.z = s.glide.from + (s.glide.to - s.glide.from) * e;
        s.vel = 0;
        if (k >= 1) { s.z = s.glide.to; s.glide = null; }
      } else {
        s.vel *= Math.pow(1 - this.damping, dt * 60);                // friction on velocity, not position
        s.z = Math.max(C2.CAMERA_END_Z, Math.min(C2.CAMERA_START_Z, s.z + s.vel * dt * 60));
        if (s.z === C2.CAMERA_END_Z || s.z === C2.CAMERA_START_Z) s.vel = 0;
      }
      camera.position.z = s.z;
      camera.position.x = Math.sin(s.t * 0.13) * 0.12;               // subtle handheld drift
      camera.position.y = 2.2 + Math.sin(s.t * 0.19) * 0.06;
      this.stream();
      for (const fn of s.animators) fn(s.t, dt);
      // audio: velocity wind + room tone
      audio.setDollyVelocity(Math.abs(s.vel));
      this.updateRoom();
      // render through the post stack; fall back on failure
      if (this.post) {
        this.post.setVelocity(Math.abs(s.vel));
        this.post.setDiveBoost(diveBoost);
        try {
          this.post.render();
        } catch {
          this.post = null;
          renderer.render(scene, camera);
        }
      } else {
        renderer.render(scene, camera);
      }
      this.emitHud();
    };
    this.raf = requestAnimationFrame(loop);
    this.ready = true;
    if (this.pendingIntro) { this.pendingIntro = false; this.playIntro(false); }
    this.dispatchEvent(new CustomEvent('shift9-ready', { bubbles: true }));
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    if (this.wheelHandler) removeEventListener('wheel', this.wheelHandler);
    if (this.keyHandler) removeEventListener('keydown', this.keyHandler);
    if (this.tsHandler) removeEventListener('touchstart', this.tsHandler);
    if (this.tmHandler) removeEventListener('touchmove', this.tmHandler);
    this.post?.dispose();
    this.renderer?.dispose();
  }

  setLocked(v: boolean): void { this.state.locked = !!v; }

  /** Debug panel hook — live-apply fog/damping/sensitivity tweaks. */
  applyTweaks(partial: Partial<typeof TWEAKS>): void {
    if (partial.damping !== undefined) this.damping = partial.damping;
    if (partial.sensitivity !== undefined) this.sensitivity = partial.sensitivity;
    if (partial.fogFar !== undefined) {
      this.fogFarBase = partial.fogFar;
      if (this.scene && this.scene.fog instanceof THREE.Fog && !this.state.intro) {
        this.scene.fog.far = partial.fogFar;
      }
    }
  }

  playIntro(skip: boolean): void {
    const s = this.state;
    if (!this.ready || !this.scene) { this.pendingIntro = !skip; return; }
    if (skip) { s.z = SCENE_CONSTANTS.CAMERA_START_Z; return; }
    s.locked = true;
    const fog = this.scene.fog as THREE.Fog;
    this.fogFarBase = fog.far; fog.far = 210; fog.near = 24;
    const grp = new THREE.Group(); const frames: THREE.Group[] = [];
    for (let i = 0; i < 34; i++) {                                   // chassis bulkheads flying past
      const fr = new THREE.Group();
      const m = new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0x0033FF : (i % 5 === 2 ? 0x2244aa : 0x20242e) });
      const W = 7 + (i % 3), H = 5.5 + (i % 2) * 1.5;
      const bar = (w: number, h: number, x: number, y: number) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), m);
        b.position.set(x, y, 0); fr.add(b);
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
    audio.tunnelDive(2.6);
  }

  private endIntro(): void {
    const s = this.state, I = s.intro;
    s.intro = null; s.locked = false;
    s.z = SCENE_CONSTANTS.CAMERA_START_Z;
    if (this.camera) {
      this.camera.fov = 42; this.camera.updateProjectionMatrix(); this.camera.rotation.z = 0;
    }
    if (this.scene && this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.far = this.fogFarBase || 55; this.scene.fog.near = 8;
    }
    if (I && this.scene) {
      this.scene.remove(I.grp);
      disposeDeep(I.grp);
    }
    this.dispatchEvent(new CustomEvent('shift9-entered', { bubbles: true }));
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

  private emitHud(): void {
    const s = this.state;
    if (s.intro) return;
    let best: Project = PROJECTS[0], bd = 1e9;
    for (const p of PROJECTS) { // prefer nearest set AHEAD of camera (p.z < camZ)
      const ahead = p.z < s.z, d = Math.abs(s.z - p.z) + (ahead ? 0 : 30);
      if (d < bd) { bd = d; best = p; }
    }
    bd = Math.abs(s.z - best.z);
    const prog = (SCENE_CONSTANTS.CAMERA_START_Z - s.z) / (SCENE_CONSTANTS.CAMERA_START_Z - SCENE_CONSTANTS.CAMERA_END_Z);
    const key = best.id + '|' + Math.round(prog * 200) + '|' + (Math.abs(s.vel) < 0.01 ? 1 : 0);
    if (key !== this.hudKey) {
      this.hudKey = key;
      const detail: HudDetail = {
        id: best.id, name: best.n, status: best.status, accent: best.accent,
        index: best.id.slice(0, 2), progress: prog, idle: Math.abs(s.vel) < 0.01,
        dist: bd, tag: best.tag, spec: best.spec,
      };
      this.dispatchEvent(new CustomEvent<HudDetail>('shift9-hud', { bubbles: true, detail }));
    }
  }

  /** Room tone: nearest set (ahead-preferred) + idleK, throttled to changes. */
  private updateRoom(): void {
    const s = this.state;
    if (s.intro) return;
    let best: Project = PROJECTS[0], bd = 1e9;
    for (const p of PROJECTS) {
      const d = Math.abs(s.z - p.z) + (p.z < s.z ? 0 : 30);
      if (d < bd) { bd = d; best = p; }
    }
    const entry = s.built.get(best.id);
    const k = entry && this.builder ? this.builder.idleK(entry.group) : 0;
    const bucket = Math.round(k * 10);
    const key = best.kind + '|' + bucket;
    if (key !== this.roomKey) {
      this.roomKey = key;
      audio.setRoom(best.kind, bucket / 10);
    }
  }

  private stream(): void {
    const C = SCENE_CONSTANTS, s = this.state;
    for (const p of PROJECTS) {
      const d = Math.abs(s.z - p.z), have = s.built.has(p.id);
      if (!have && d < C.LOAD_RADIUS) this.buildSet(p);
      else if (have && d > C.UNLOAD_RADIUS) this.destroySet(p);
    }
  }

  private buildSet(p: Project): void {
    if (!this.builder || !this.scene) return;
    const { group, anims } = this.builder.buildSet(p);
    for (const a of anims) { a.setId = p.id; this.state.animators.push(a); }
    this.scene.add(group);
    this.state.built.set(p.id, { group });
  }

  private destroySet(p: Project): void {
    const e = this.state.built.get(p.id);
    if (!e || !this.scene) return;
    this.scene.remove(e.group);
    disposeDeep(e.group);
    this.state.animators = this.state.animators.filter((a) => a.setId !== p.id);
    this.state.built.delete(p.id);
  }
}

/* ── helpers ──────────────────────────────────────────────────────────── */

function makeGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function disposeDeep(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat && typeof mat.dispose === 'function') mat.dispose();
  });
}

if (!customElements.get('shift9-scene')) {
  customElements.define('shift9-scene', Shift9Scene);
}
