/* All 12 soundstage set builders, ported 1:1 from the reference
   (reference/shift9-scene.js). Every constant, position, color, material
   param, canvas-texture drawing routine, idle beat and animator matches the
   reference verbatim — structured so a reader can diff them side by side.
   Custom GLSL materials come from ./shaders (TSL, WebGPU + WebGL2 safe).
   Per-set throttle state (_jpT/_dcT/_arT/_laT/_lu in the reference) lives as
   fields on the SetBuilder instance instead of `this` hacks on the element. */
import * as THREE from 'three';
import type { Project } from '../projects';
import {
  createBeamMaterial,
  createDustMaterial,
  createFluidMaterial,
  createLightConeMaterial,
  createLumenMaterial,
} from './shaders';

export type Animator = ((t: number, dt: number) => void) & { setId?: string };

/** What the builders need from the engine (camera/dolly state + glow sprite). */
export interface SetCtx {
  glowTex: THREE.CanvasTexture;
  getZ(): number;
  getVel(): number;
  isGliding(): boolean;
}

export class SetBuilder {
  // throttle state (reference: this._jpT / this._dcT / this._arT / this._laT / this._lu)
  private jpT = -1;
  private dcT = -1;
  private arT = -1;
  private laT = -1;
  private lu = -1;

  constructor(private readonly ctx: SetCtx) {}

  /* ── shared helpers ──────────────────────────────────────────────────── */

  /** 0..1 — how settled the camera is at this set's viewing mark. */
  idleK(g: THREE.Group, span?: number): number {
    const d = Math.abs(this.ctx.getZ() - g.position.z - 13);
    const near = Math.max(0, 1 - d / (span || 16));
    return Math.abs(this.ctx.getVel()) < 0.02 && !this.ctx.isGliding() ? near : 0;
  }

  glow(color: THREE.ColorRepresentation, size: number): THREE.Sprite {
    const m = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.ctx.glowTex, color, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    m.scale.setScalar(size);
    return m;
  }

  softbox(
    g: THREE.Group, x: number, y: number, z: number,
    w: number, h: number, intensity: number, color?: THREE.ColorRepresentation,
  ): THREE.SpotLight {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: color ?? 0xffffff }),
    );
    panel.position.set(x, y, z); panel.rotation.x = Math.PI / 2; g.add(panel);
    const gl = this.glow(color ?? 0xffffff, w * 2.2); gl.position.set(x, y - 0.2, z); g.add(gl);
    const sp = new THREE.SpotLight(color ?? 0xffffff, intensity, y * 3, 0.9, 0.5, 1.2);
    sp.position.set(x, y, z); sp.target.position.set(x, 0, z); g.add(sp, sp.target);
    return sp;
  }

  dustPlane(
    g: THREE.Group, color: THREE.ColorRepresentation,
    w: number, h: number, x: number, y: number, z: number, ry?: number,
  ): Animator {
    const { material, uTime, uFade } = createDustMaterial(color);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    m.position.set(x, y, z); m.rotation.y = ry || 0; g.add(m);
    const wz = () => g.position.z + z;
    return (t: number) => {
      uTime.value = t;
      const d = Math.abs(this.ctx.getZ() - wz());
      uFade.value = Math.min(Math.max((d - 4) / 8, 0), 1); // fade out near camera
    };
  }

  lightCone(
    g: THREE.Group, color: THREE.ColorRepresentation,
    x: number, topY: number, z: number, r: number, opacity: number,
  ): void {
    const geo = new THREE.ConeGeometry(r, topY, 32, 1, true);
    const { material } = createLightConeMaterial(color, opacity);
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, topY / 2, z); g.add(m);
  }

  /* ── dispatch (reference buildSet body minus scene/animator wiring) ──── */

  buildSet(p: Project): { group: THREE.Group; anims: Animator[] } {
    const g = new THREE.Group();
    g.position.z = p.z;
    const accent = new THREE.Color(p.accent);
    // shared soundstage floor pool of light
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(9, 48),
      new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.9, metalness: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2; g.add(floor);
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
    else if (p.kind === 'dust') this.buildDustStudy(g, anims);
    else this.buildStage(g, anims, accent, p);
    return { group: g, anims };
  }

  /* ── fallback hero stage ─────────────────────────────────────────────── */

  buildStage(g: THREE.Group, anims: Animator[], accent: THREE.Color, p: Project): void {
    this.softbox(g, 0, 7.5, 0, 3.4, 2.2, 260);
    this.lightCone(g, 0xffffff, 0, 7.4, 0, 3.4, 0.05);
    // hero monolith arrangement
    const mat = new THREE.MeshStandardMaterial({ color: 0xd8d8dc, roughness: 0.35, metalness: 0.05 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.6 });
    const seed = p.id.charCodeAt(1);
    const heroH = 1.4 + (seed % 2);
    const hero = new THREE.Mesh(
      new THREE.BoxGeometry(2.2 + (seed % 3) * 0.6, heroH, 1.1), seed % 2 ? mat : dark,
    );
    hero.position.y = heroH / 2; g.add(hero);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.12, 2.2), dark);
    slab.position.y = 0.06; g.add(slab);
    if (p.accent === '#0033FF') {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 2.6, 0.06), new THREE.MeshBasicMaterial({ color: accent }),
      );
      strip.position.set(1.9, 1.3, 0.4); g.add(strip);
      const gl = this.glow(accent, 2.4); gl.position.copy(strip.position); g.add(gl);
      const pl = new THREE.PointLight(accent, 14, 9); pl.position.set(1.9, 1.4, 0.6); g.add(pl);
    }
    anims.push(this.dustPlane(g, 0xffffff, 4, 6, 0, 3.2, -0.5));
  }

  /* ── 12 Just a Pinch — bright kitchen ────────────────────────────────── */

  buildKitchen(g: THREE.Group, anims: Animator[]): void {
    this.softbox(g, 0, 8, 0, 4.6, 2.6, 140);
    this.lightCone(g, 0xffffff, 0, 7.9, 0, 4, 0.045);
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 });
    const grey = new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: 0.3, metalness: 0.15 });
    const island = new THREE.Mesh(new THREE.BoxGeometry(6, 1.15, 1.6), grey); island.position.y = 0.575; g.add(island);
    const top = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.07, 1.75), white); top.position.y = 1.185; g.add(top);
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 2.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xd6d6da, roughness: 0.65 }),
    );
    back.position.set(0, 2.6, -2.2); g.add(back);
    const niche = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.0, 0.52),
      new THREE.MeshStandardMaterial({ color: 0xe4e4e6, roughness: 0.6 }),
    );
    niche.position.set(0, 2.0, -2.19); g.add(niche);
    const tc = document.createElement('canvas'); tc.width = 96; tc.height = 64;
    const tcx = tc.getContext('2d')!; const ttex = new THREE.CanvasTexture(tc);
    tcx.fillStyle = '#eafcfd'; tcx.fillRect(0, 0, 96, 64);
    const tablet = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.6, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xffffff, map: ttex }),
    );
    tablet.position.set(-1.5, 1.55, 0.1); tablet.rotation.x = -0.18; g.add(tablet);
    const tg = this.glow(0x9fe8ec, 1.5); tg.position.copy(tablet.position); g.add(tg);
    const pl = new THREE.PointLight(0xbfeef0, 4, 4); pl.position.set(-1.5, 1.6, 0.5); g.add(pl);
    anims.push(this.dustPlane(g, 0xffffff, 5, 6, 0, 3.5, -1));
    // idle beat: tablet cycles recipe cards; soft steam rises off the counter
    const wisps: THREE.Sprite[] = [];
    for (let i = 0; i < 3; i++) { const s = this.glow(0xffffff, 0.9); s.material.opacity = 0; g.add(s); wisps.push(s); }
    anims.push((t: number) => {
      const ci = (t / 2 | 0) % 3;
      if (ci !== this.jpT) {
        this.jpT = ci;
        tcx.fillStyle = '#eafcfd'; tcx.fillRect(0, 0, 96, 64);
        tcx.fillStyle = ['#ffb3a0', '#a0d8b0', '#f5d78e'][ci]; tcx.fillRect(8, 8, 34, 48);
        tcx.fillStyle = '#89a0a4';
        for (let j = 0; j < 4; j++) tcx.fillRect(50, 12 + j * 11, 38 - j * 6, 4);
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

  /* ── 07 Midnight Return — dark metal corridor, blue/orange flicker ───── */

  buildCorridor(g: THREE.Group, anims: Animator[]): void {
    const metal = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.45, metalness: 0.85 });
    for (let i = 0; i < 7; i++) {
      const frame = new THREE.Group();
      const mk = (w: number, h: number, x: number, y: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.35), metal);
        m.position.set(x, y, 0); frame.add(m);
      };
      mk(0.4, 5.4, -3.2, 2.7); mk(0.4, 5.4, 3.2, 2.7); mk(6.8, 0.4, 0, 5.2);
      const grate = new THREE.Mesh(
        new THREE.BoxGeometry(6.4, 0.08, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.3, metalness: 0.9 }),
      );
      grate.position.y = 0.04; frame.add(grate);
      frame.position.z = -i * 2.4 + 7; g.add(frame);
    }
    const flickers: { pl: THREE.PointLight; gl: THREE.Sprite; base: number; ph: number }[] = [];
    const addLight = (color: number, x: number, y: number, z: number, intensity: number) => {
      const pl = new THREE.PointLight(color, intensity, 8, 1.6); pl.position.set(x, y, z); g.add(pl);
      const gl = this.glow(color, 1.6); gl.position.set(x, y, z); g.add(gl);
      const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.08, 0.08), new THREE.MeshBasicMaterial({ color }),
      );
      bulb.position.set(x, y, z); g.add(bulb);
      flickers.push({ pl, gl, base: intensity, ph: Math.random() * 10 });
    };
    addLight(0x0033ff, -2.85, 4.6, 4.5, 26); addLight(0x0033ff, 2.85, 4.6, -0.5, 26);
    addLight(0xff6a1a, 2.85, 1.4, 2.2, 15); addLight(0xff6a1a, -2.85, 1.4, -3, 12);
    addLight(0x0033ff, 0, 5.0, -7, 30);
    anims.push((t: number) => {
      for (const f of flickers) {
        const fl = 0.55 + 0.45 * Math.max(0, Math.sin(t * 17 + f.ph) * Math.sin(t * 5.3 + f.ph * 2) + 0.4);
        f.pl.intensity = f.base * fl; f.gl.material.opacity = 0.85 * fl;
      }
    });
    anims.push(this.dustPlane(g, 0x2244ff, 5, 4.5, 0, 2.5, -1));
    anims.push(this.dustPlane(g, 0xff8844, 5, 4.5, 0.5, 2.5, -4));
    // steam
    const steam: THREE.Sprite[] = [];
    for (let i = 0; i < 3; i++) {
      const sp = this.glow(0x3355aa, 3.5 + i); sp.material.opacity = 0.12;
      sp.position.set((i - 1) * 2, 1 + i * 0.7, 2 - i * 3); g.add(sp); steam.push(sp);
    }
    anims.push((t: number) => steam.forEach((s, i) => {
      s.position.y = 1 + i * 0.7 + Math.sin(t * 0.6 + i) * 0.4;
      s.material.opacity = 0.09 + 0.05 * Math.sin(t * 0.8 + i * 2);
    }));
    // idle beat: a distant silhouette steps into a backlit doorway, then recedes
    const doorGlowMat = new THREE.MeshBasicMaterial({ color: 0x1b3fd0, transparent: true, opacity: 0 });
    const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.4), doorGlowMat);
    doorGlow.position.set(0, 2.2, -11.5); g.add(doorGlow);
    const dg = this.glow(0x2a4cff, 3.4); dg.position.set(0, 2.2, -11.3); dg.material.opacity = 0; g.add(dg);
    const sil = new THREE.Group();
    const sm = new THREE.MeshBasicMaterial({ color: 0x05060a });
    const torso2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.4), sm); torso2.position.y = 1.5; sil.add(torso2);
    const head2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), sm); head2.position.y = 2.25; sil.add(head2);
    for (const lx of [-0.18, 0.18]) {
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.3), sm);
      leg2.position.set(lx, 0.5, 0); sil.add(leg2);
    }
    sil.position.set(0, 0, -9); g.add(sil);
    anims.push((t: number) => {
      const k = this.idleK(g), c = (Math.sin(t * 0.35) + 1) / 2;
      sil.visible = k > 0.05; sil.position.z = -10 + k * c * 4;
      doorGlowMat.opacity = k * (0.55 + 0.12 * Math.sin(t * 1.7));
      dg.material.opacity = k * 0.5;
    });
  }

  /* ── 09 Lumen — projective texture mapping onto stacked white boxes ──── */

  buildLumen(g: THREE.Group, anims: Animator[]): void {
    // live glitching UI map texture
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const ctx2 = c.getContext('2d')!;
    const tex = new THREE.CanvasTexture(c);
    const drawUI = (t: number) => { // projection-mapping loop: grid → neon facets → scan bars
      ctx2.fillStyle = '#000'; ctx2.fillRect(0, 0, 512, 512);
      const ph = (t / 5 | 0) % 3;
      ctx2.strokeStyle = ph === 1 ? '#00ffd0' : '#ffffff'; ctx2.lineWidth = 2; ctx2.globalAlpha = 0.85;
      const gsz = 46 + Math.sin(t * 0.8) * 3;
      for (let x = 0; x <= 512; x += gsz) { ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, 512); ctx2.stroke(); }
      for (let y = 0; y <= 512; y += gsz) { ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(512, y); ctx2.stroke(); }
      ctx2.globalAlpha = 1;
      if (ph === 1) {
        const cols = ['#ff2d95', '#00ffd0', '#ffe14d', '#4d6bff'];
        ctx2.globalAlpha = 0.75;
        for (let i = 0; i < 6; i++) {
          ctx2.fillStyle = cols[(i + (t | 0)) % 4];
          ctx2.fillRect((i * 149 + (t * 40 | 0)) % 460, (i * 97) % 440, 70, 70);
        }
        ctx2.globalAlpha = 1;
      } else if (ph === 2) {
        ctx2.fillStyle = '#ffffff'; const sy = (t * 160) % 560 - 24; ctx2.fillRect(0, sy, 512, 26);
        ctx2.fillStyle = '#0033FF'; ctx2.globalAlpha = 0.5; ctx2.fillRect(0, (sy + 200) % 512, 512, 60); ctx2.globalAlpha = 1;
      }
      if (Math.random() < 0.05) { ctx2.fillStyle = '#fff'; ctx2.fillRect(0, Math.random() * 512, 512, 4); }
      tex.needsUpdate = true;
    };
    // projector camera — composed in WORLD space (group is offset by p.z)
    const zo = g.position.z;
    const proj = new THREE.PerspectiveCamera(34, 1, 0.5, 30);
    proj.position.set(-5.5, 4.5, 6 + zo); proj.lookAt(0, 1.5, zo); proj.updateMatrixWorld();
    const projMat = new THREE.Matrix4().multiplyMatrices(proj.projectionMatrix, proj.matrixWorldInverse);
    const lumen = createLumenMaterial(tex, projMat, proj.position.clone());
    // stack of white boxes on the floor — the mapping canvas
    for (const [w, h, d, x, y, z, ry] of [
      [2.2, 1.4, 1.4, 0, 0.7, 0, 0.1],
      [1.3, 1.1, 1.1, -0.75, 1.95, 0.15, -0.2],
      [1.0, 0.9, 0.9, 0.55, 1.85, -0.15, 0.35],
      [0.75, 0.75, 0.75, -0.45, 2.85, 0.05, 0.5],
      [0.9, 0.9, 0.9, 1.7, 0.45, 0.6, -0.3],
    ] as const) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lumen.material);
      b.position.set(x, y, z); b.rotation.y = ry; g.add(b);
    }
    // projector body + beam
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.5, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x202028, roughness: 0.4, metalness: 0.6 }),
    );
    body.position.set(-5.5, 4.5, 6); body.lookAt(0, 1.8, 0); g.add(body);
    const bg = this.glow(0xffffff, 1.2); bg.position.set(-5.5, 4.5, 6); g.add(bg);
    const beamGeo = new THREE.CylinderGeometry(
      0.06, 2.2,
      new THREE.Vector3(-5.5, 4.5, 6).distanceTo(new THREE.Vector3(0, 1.5, 0)),
      24, 1, true,
    );
    const beamHandles = createBeamMaterial();
    const beam = new THREE.Mesh(beamGeo, beamHandles.material);
    const mid = new THREE.Vector3(-5.5, 4.5, 6).lerp(new THREE.Vector3(0, 1.5, 0), 0.5);
    beam.position.copy(mid); beam.lookAt(0, 1.5, 0); beam.rotateX(Math.PI / 2); g.add(beam);
    const sp = new THREE.SpotLight(0xffffff, 60, 20, 0.36, 0.7);
    sp.position.set(-5.5, 4.5, 6); sp.target.position.set(0, 1.5, 0); g.add(sp, sp.target);
    // idle beat: four corner-pin dots snap onto the mapped object
    const dots: THREE.Sprite[] = [];
    for (const [dx, dy] of [[-1.6, 3.1], [1.6, 3.1], [-1.6, 0.4], [1.6, 0.4]]) {
      const d = this.glow(0xffffff, 0.45); d.position.set(dx, dy, 0.9); d.material.opacity = 0; g.add(d); dots.push(d);
    }
    anims.push((t: number) => {
      const k = this.idleK(g);
      dots.forEach((d, i) => { d.material.opacity = k * (0.5 + 0.4 * Math.sin(t * 2 + i * 1.6)); });
    });
    anims.push(this.dustPlane(g, 0xffffff, 6, 4.5, -2.2, 2.8, 1.5, 0.7));
    anims.push((t: number) => {
      lumen.uTime.value = t; beamHandles.uTime.value = t;
      if ((t * 30 | 0) !== this.lu) { this.lu = t * 30 | 0; drawUI(t); }
    });
  }

  /* ── 01 WinFix — high-contrast white room, one dark broken monolith ──── */

  buildWhiteRoom(g: THREE.Group, anims: Animator[]): void {
    const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.85, metalness: 0 });
    const bright = new THREE.Mesh(
      new THREE.CircleGeometry(10, 48),
      new THREE.MeshStandardMaterial({ color: 0xededf0, roughness: 0.95 }),
    );
    bright.rotation.x = -Math.PI / 2; bright.position.y = 0.01; g.add(bright);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(11, 8, 0.4), white); wall.position.set(0, 4, -3); g.add(wall);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 7), white); sideL.position.set(-5.3, 4, 0.5); g.add(sideL);
    const sideR = sideL.clone(); sideR.position.x = 5.3; g.add(sideR);
    this.softbox(g, -2.5, 7.6, 1, 3.2, 2.4, 90); this.softbox(g, 2.5, 7.6, 1, 3.2, 2.4, 90); // 200 in the r160 reference — spot pools render hotter in r182
    g.add(new THREE.HemisphereLight(0xffffff, 0x999999, 0.45)); // r182 hemisphere reads ~2x the r160 reference — halved for parity
    // dark broken monolith — a fractured slab (the thing WinFix fixes)
    const dark = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.5, metalness: 0.2 });
    const shards: { sh: THREE.Mesh; off: { x: number; rz: number } }[] = [];
    for (let i = 0; i < 4; i++) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.5), dark);
      const off = { x: (i - 1.5) * 0.15, rz: (i % 2 ? 1 : -1) * 0.05 * i };
      sh.position.set(off.x, 0.45 + i * 0.85, 0); sh.rotation.z = off.rz; g.add(sh); shards.push({ sh, off });
    }
    const scar = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 3.4, 0.55), new THREE.MeshBasicMaterial({ color: 0x0033FF }),
    );
    scar.position.set(0.1, 1.9, 0.01); g.add(scar);
    const gl = this.glow(0x0033FF, 1.6); gl.position.copy(scar.position); g.add(gl);
    // idle beat: the fracture heals shut, breathes, re-cracks (repair motif)
    anims.push((t: number) => {
      const k = this.idleK(g), heal = k * (0.5 + 0.5 * Math.sin(t * 0.9));
      for (const { sh, off } of shards) { sh.position.x = off.x * (1 - heal); sh.rotation.z = off.rz * (1 - heal); }
      gl.material.opacity = 0.3 + heal * 0.6;
    });
  }

  /* ── 02 Omni-3D — dark warehouse with a glitching mech silhouette ────── */

  buildWarehouse(g: THREE.Group, anims: Animator[]): void {
    const metal = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.6, metalness: 0.7 });
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(16, 11, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0d0e12, roughness: 0.9 }),
    );
    back.position.set(0, 5.5, -5); g.add(back);
    for (let i = 0; i < 5; i++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 0.3), metal);
      beam.position.set(-6 + i * 3, 4.5, -4.6); g.add(beam);
    }
    // mech: stacked masses
    const mech = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.2), metal); torso.position.y = 3.4; mech.add(torso);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), metal); head.position.y = 4.9; mech.add(head);
    const hip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.1), metal); hip.position.y = 2.0; mech.add(hip);
    const mkLeg = (x: number) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), metal); l.position.set(x, 0.9, 0); mech.add(l);
    };
    mkLeg(-0.5); mkLeg(0.5);
    const mkArm = (x: number) => {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.4), metal);
      a.position.set(x, 3.2, 0.2); a.rotation.z = x < 0 ? 0.2 : -0.2; mech.add(a);
    };
    mkArm(-1.2); mkArm(1.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0033FF });
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.05), eyeMat);
    eye.position.set(0, 4.95, 0.46); mech.add(eye);
    g.add(mech);
    // idle beat: voxel→wireframe→solid rebuild scan sweeping up the mech
    const wireM = new THREE.Group();
    const wireMats: THREE.LineBasicMaterial[] = [];
    mech.children.forEach((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.geometry && mesh.geometry.type === 'BoxGeometry') {
        const wm = new THREE.LineBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0 });
        const w = new THREE.LineSegments(new THREE.WireframeGeometry(mesh.geometry), wm);
        w.position.copy(mesh.position); w.rotation.copy(mesh.rotation); w.scale.setScalar(1.05);
        wireM.add(w); wireMats.push(wm);
      }
    });
    g.add(wireM);
    const scanMat = new THREE.MeshBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0 });
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.06), scanMat);
    scan.position.z = 0.8; g.add(scan);
    const eg = this.glow(0x0033FF, 1.2); eg.position.set(0, 4.95, 0.6); g.add(eg);
    // reference r160 ran legacy lighting; physical falloff needs ~8x here (lights sit 6-9u out)
    const rim = new THREE.PointLight(0x2a4cff, 240, 14); rim.position.set(-5, 6, 3); g.add(rim);
    const key = new THREE.SpotLight(0xbfcaff, 320, 20, 0.6, 0.6);
    key.position.set(3, 8, 5); key.target.position.set(0, 3, 0); g.add(key, key.target);
    anims.push(this.dustPlane(g, 0x3355cc, 6, 6, 0, 3, -1));
    let gt = 0;
    anims.push((_t: number, dt: number) => {
      gt -= dt;
      if (gt <= 0 && Math.random() < 0.3) {
        gt = 0.08;
        mech.position.x = (Math.random() - 0.5) * 0.25;
        eyeMat.color.setHex(Math.random() < 0.5 ? 0xff2255 : 0x0033FF);
      } else if (gt <= 0) mech.position.x = 0;
    });
    anims.push((t: number) => {
      const k = this.idleK(g), y = (t * 1.1 % 1) * 5.6;
      scan.position.y = y; scanMat.opacity = k * 0.8;
      wireM.children.forEach((w, i) => { wireMats[i].opacity = k * (w.position.y < y ? 0.55 : 0.08); });
    });
  }

  /* ── 03 Automation Sys — sterile data center with blinking LEDs ──────── */

  buildDataCenter(g: THREE.Group, anims: Animator[]): void {
    const rack = new THREE.MeshStandardMaterial({ color: 0x202329, roughness: 0.4, metalness: 0.6 });
    g.add(new THREE.AmbientLight(0x223040, 0.7));
    const leds: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 5; i++) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.2, 1.4), rack);
        r.position.set(side * 3.4, 2.1, -i * 2.6 + 4); g.add(r);
        for (let j = 0; j < 10; j++) {
          const on = Math.random() < 0.7;
          const mat = new THREE.MeshBasicMaterial({ color: on ? 0x33ffcc : 0x0a2a26 });
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), mat);
          led.position.set(side * 3.4 + (side < 0 ? 0.58 : -0.58), 0.6 + j * 0.36, -i * 2.6 + 4 + 0.72);
          led.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          g.add(led); leds.push({ mesh: led, mat });
        }
      }
    }
    const strip = (x: number) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 12), new THREE.MeshBasicMaterial({ color: 0x00e0ff }));
      s.position.set(x, 4.3, -1); g.add(s);
      const gl = this.glow(0x00e0ff, 2); gl.position.set(x, 4.3, 2); g.add(gl);
    };
    strip(-2.6); strip(2.6);
    const overhead = new THREE.PointLight(0x66eaff, 18, 16); overhead.position.set(0, 5, 3); g.add(overhead);
    anims.push(this.dustPlane(g, 0x66eaff, 6, 5, 0, 3, -1));
    anims.push((t: number) => {
      if ((t * 8 | 0) !== this.dcT) {
        this.dcT = t * 8 | 0;
        for (const l of leds) if (Math.random() < 0.06) l.mat.color.setHex(Math.random() < 0.7 ? 0x33ffcc : 0x0a2a26);
      }
    });
    // idle beat: cascading data pulse sweeping down the aisles
    anims.push((t: number) => {
      const k = this.idleK(g); if (k < 0.1) return;
      for (const l of leds) {
        const ph = ((l.mesh.position.z - t * 6) % 3 + 3) % 3;
        if (ph < 0.35) l.mat.color.setHex(0xaffff0);
      }
    });
  }

  /* ── 04 INSTRUMENT — monolithic brutalist synth console ──────────────── */

  buildSynth(g: THREE.Group, anims: Animator[]): void {
    this.softbox(g, 0, 7.8, 1.5, 3, 2, 120, 0xffe6c2);
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.6, metalness: 0.3 });
    const face = new THREE.MeshStandardMaterial({ color: 0x26262c, roughness: 0.5, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.6, 1.8), dark); body.position.y = 1.3; g.add(body);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.6, 0.2), face);
    panel.position.set(0, 1.9, 0.9); panel.rotation.x = -0.5; g.add(panel);
    for (let i = 0; i < 9; i++) {
      const k = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.14, 16),
        new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.4 }),
      );
      k.rotation.x = -0.5 + Math.PI / 2; k.position.set(-2 + i * 0.5, 2.35, 1.05); g.add(k);
    }
    const sliders: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const sl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.03), new THREE.MeshBasicMaterial({ color: 0x0033FF }));
      sl.position.set(-1.5 + i * 0.6, 1.55, 1.02); sl.rotation.x = -0.5; g.add(sl); sliders.push(sl);
    }
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0a2a4a });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), screenMat);
    screen.position.set(1.6, 2.15, 1.06); screen.rotation.x = -0.5; g.add(screen);
    const amber = new THREE.PointLight(0xffb35a, 8, 8); amber.position.set(-2, 3, 3); g.add(amber);
    const blue = new THREE.PointLight(0x0033FF, 8, 8); blue.position.set(2, 2.5, 2); g.add(blue);
    const gl = this.glow(0x0033FF, 2.2); gl.position.set(0, 1.6, 1.4); g.add(gl);
    anims.push(this.dustPlane(g, 0xffd9a0, 5, 5, 0, 3, -1));
    // idle beat: sliders sequence, screen waveform pulses
    anims.push((t: number) => {
      const k = this.idleK(g);
      sliders.forEach((sl, i) => { sl.position.y = 1.55 + k * Math.sin(t * 2 + i * 0.9) * 0.12; });
      screenMat.color.setHSL(0.58, 0.7, 0.12 + k * (0.14 + 0.1 * Math.sin(t * 3)));
    });
  }

  /* ── 05 Titanium Forge — steel press extruding a white-hot billet ────── */

  buildForge(g: THREE.Group, anims: Animator[]): void {
    const steel = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.35, metalness: 0.9 });
    const topPress = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 2.4), steel); g.add(topPress);
    const botPress = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 2.4), steel); botPress.position.y = 0.7; g.add(botPress);
    const col = (x: number) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 6, 16), steel);
      c.position.set(x, 3, -0.9); g.add(c);
    };
    col(-1.9); col(1.9);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.7, 2.6), steel); cap.position.y = 6; g.add(cap);
    // white-hot billet
    const hotMat = new THREE.MeshBasicMaterial({ color: 0xffd9b0 });
    const billet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), hotMat); billet.position.set(2.6, 1.1, 0); g.add(billet);
    const heat = new THREE.PointLight(0xff4a10, 40, 12, 2); heat.position.set(2.6, 1.3, 0.6); g.add(heat);
    const hg = this.glow(0xff5a1a, 3.2); hg.position.set(2.6, 1.1, 0.4); g.add(hg);
    const rim = new THREE.PointLight(0x3a4a66, 14, 14); rim.position.set(-3, 5, 4); g.add(rim);
    // idle beat: extruded chip cools white-hot → steel as it slides off the press
    const chipMat = new THREE.MeshBasicMaterial({ color: 0xffd9b0 });
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), chipMat);
    chip.visible = false; g.add(chip);
    // sparks
    const sparks: { s: THREE.Sprite; v: THREE.Vector3 }[] = [];
    for (let i = 0; i < 14; i++) {
      const s = this.glow(0xffb060, 0.4); s.position.set(2.6, 1.1, 0); g.add(s);
      sparks.push({ s, v: new THREE.Vector3() });
    }
    anims.push(this.dustPlane(g, 0xff8844, 5, 5, 1, 3, -1));
    let pt = 0;
    anims.push((_t: number, dt: number) => {
      pt += dt;
      const press = Math.abs(Math.sin(pt * 1.2));
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
    anims.push((t: number) => {
      const ki = this.idleK(g); chip.visible = ki > 0.2; if (!chip.visible) return;
      const c = (t * 0.5) % 1;
      chip.position.set(2.6 + 1.6 * c, 1.05 - 0.15 * c, 0.9);
      chipMat.color.setRGB(1 - 0.82 * c, 0.85 - 0.68 * c, 0.7 - 0.5 * c);
    });
  }

  /* ── 06 Game Design Forge — cluttered R&D workbench ──────────────────── */

  buildWorkbench(g: THREE.Group, anims: Animator[]): void {
    const wood = new THREE.MeshStandardMaterial({ color: 0x3a3230, roughness: 0.8 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 2.6), wood); top.position.y = 1.4; g.add(top);
    for (const x of [-2.7, 2.7]) for (const z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), wood);
      leg.position.set(x, 0.7, z); g.add(leg);
    }
    const dark = new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.5, metalness: 0.4 });
    // scattered clutter
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.2, 0.6), rnd(0.15, 0.5), rnd(0.2, 0.6)), dark);
      c.position.set(rnd(-2.5, 2.5), 1.5 + 0.1, rnd(-0.9, 0.9)); c.rotation.y = Math.random() * 3; g.add(c);
    }
    // two monitors
    for (const mx of [-1.4, 0.4]) {
      const mon = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshBasicMaterial({ color: 0x123a4a }));
      mon.position.set(mx, 2.2, -0.9); g.add(mon);
      const gl = this.glow(0x1fb0d0, 1.2); gl.position.set(mx, 2.2, -0.7); g.add(gl);
    }
    // desk lamp cone
    const lamp = new THREE.SpotLight(0xfff0d0, 26, 8, 0.7, 0.5);
    lamp.position.set(1.8, 3.4, 0.6); lamp.target.position.set(0.5, 1.4, 0); g.add(lamp, lamp.target);
    this.lightCone(g, 0xffe6b0, 1.8, 3.2, 0.6, 1.1, 0.05);
    g.add(new THREE.AmbientLight(0x2a2622, 0.6));
    anims.push(this.dustPlane(g, 0xffe0a0, 5, 4.5, 0, 2.8, 0));
    // idle beat: holographic prototype flickers to life above the bench
    const holoMat = new THREE.LineBasicMaterial({ color: 0x1fb0d0, transparent: true, opacity: 0 });
    const holo = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.OctahedronGeometry(0.5, 0)), holoMat);
    holo.position.set(-0.5, 2.5, 0.2); g.add(holo);
    const hgl = this.glow(0x1fb0d0, 1.4); hgl.position.copy(holo.position); hgl.material.opacity = 0; g.add(hgl);
    anims.push((t: number, dt: number) => {
      const k = this.idleK(g);
      holo.rotation.y += dt; holo.position.y = 2.5 + Math.sin(t * 1.4) * 0.08;
      holoMat.opacity = k * (0.5 + 0.3 * Math.sin(t * 9));
      hgl.position.y = holo.position.y; hgl.material.opacity = k * 0.35;
    });
  }

  /* ── 08 Voxel Arcade BB — retro-futuristic cabinet ───────────────────── */

  buildArcade(g: THREE.Group, anims: Animator[]): void {
    this.softbox(g, 0, 7.8, 1.2, 3.0, 2.2, 240); // overhead pool lighting the floor
    this.lightCone(g, 0xffffff, 0, 7.7, 1.2, 3.2, 0.045);
    const floorSpot = new THREE.SpotLight(0xff9ad0, 24, 12, 0.8, 0.6);
    floorSpot.position.set(0, 5.5, 3.5); floorSpot.target.position.set(0, 0, 1.5); g.add(floorSpot, floorSpot.target);
    const shell = new THREE.MeshStandardMaterial({ color: 0x161620, roughness: 0.5, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.4, 1.6), shell); body.position.y = 2.7; g.add(body); // sits on the floor
    const marquee = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.0), shell);
    marquee.position.set(0, 5.35, 0.35); marquee.rotation.x = 0.35; g.add(marquee);
    const mq = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.42), new THREE.MeshBasicMaterial({ color: 0xff00aa }));
    mq.position.set(0, 5.38, 0.93); mq.rotation.x = 0.35; g.add(mq);
    const mg = this.glow(0xff00aa, 2.2); mg.position.set(0, 5.4, 1.1); g.add(mg);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x120a2a });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.5), screenMat);
    screen.position.set(0, 3.8, 0.83); g.add(screen);
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const scr = new THREE.CanvasTexture(cv);
    const cx = cv.getContext('2d')!;
    screenMat.map = scr; screenMat.color.setHex(0xffffff);
    // control deck with joysticks + buttons
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.22, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0e0e16, roughness: 0.4 }),
    );
    deck.position.set(0, 2.55, 0.85); deck.rotation.x = -0.22; g.add(deck);
    const mkStick = (x: number) => {
      const st = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.045, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0x33343c, roughness: 0.35, metalness: 0.6 }),
      );
      st.position.set(x, 2.78, 0.78); st.rotation.x = -0.22; g.add(st);
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xff2244, roughness: 0.25 }),
      );
      ball.position.set(x, 2.93, 0.745); g.add(ball);
      return st;
    };
    mkStick(-0.75); mkStick(0.15);
    const btnCols = [0xff00aa, 0x00e5ff, 0xffe000];
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: btnCols[i], roughness: 0.3, emissive: btnCols[i], emissiveIntensity: 0.4 }),
      );
      b.position.set(0.55 + i * 0.22, 2.64 + i * 0.048, 0.88 - i * 0.02); b.rotation.x = -0.22; g.add(b);
    }
    // coin door with glowing slot
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.8, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x22242c, roughness: 0.35, metalness: 0.7 }),
    );
    door.position.set(0, 0.85, 0.81); g.add(door);
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.16), new THREE.MeshBasicMaterial({ color: 0xffe000 }));
    slot.position.set(-0.12, 0.95, 0.845); g.add(slot);
    const slot2 = slot.clone(); slot2.position.x = 0.12; g.add(slot2);
    const sg = this.glow(0xffe000, 0.5); sg.position.set(0, 0.95, 0.9); g.add(sg);
    const mkEdge = (x: number, c: number) => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.4, 0.08), new THREE.MeshBasicMaterial({ color: c }));
      e.position.set(x, 2.7, 0.82); g.add(e);
      const gl = this.glow(c, 1.6); gl.position.set(x, 2.7, 0.9); g.add(gl);
    };
    mkEdge(-1.24, 0xff00aa); mkEdge(1.24, 0x00e5ff);
    const lp = new THREE.PointLight(0xff00aa, 10, 8); lp.position.set(-2, 3, 2); g.add(lp);
    const lc = new THREE.PointLight(0x00e5ff, 10, 8); lc.position.set(2, 3, 2); g.add(lc);
    anims.push((t: number) => {
      if ((t * 12 | 0) === this.arT) return;
      this.arT = t * 12 | 0;
      cx.fillStyle = '#0a0420'; cx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 20; i++) {
        cx.fillStyle = ['#ff00aa', '#00e5ff', '#ffe000'][i % 3];
        const s = 8;
        cx.fillRect((Math.sin(t * 2 + i) * 4 + 8) * s % 128, ((i * 13 + (t * 20 | 0)) % 16) * s, s, s);
      }
      // idle beat: attract mode — PRESS START blink + bouncing voxel ball
      if ((t * 1.5 | 0) % 2) { cx.fillStyle = '#fff'; cx.font = 'bold 13px monospace'; cx.fillText('PRESS START', 22, 118); }
      cx.fillStyle = '#ff8800';
      cx.fillRect(60 + Math.sin(t * 2.2) * 42, 58 - Math.abs(Math.sin(t * 4.4)) * 36, 8, 8);
      scr.needsUpdate = true;
    });
  }

  /* ── 10 Learning App — colorful kids tablet floating (ReadingLand) ───── */

  buildFloatCube(g: THREE.Group, anims: Animator[]): void {
    this.softbox(g, 0, 8, 0.5, 2.6, 2.6, 130);
    const tabletG = new THREE.Group(); tabletG.position.y = 2.7; g.add(tabletG);
    const caseMat = new THREE.MeshStandardMaterial({ color: 0xff6b4a, roughness: 0.55 }); // chunky coral kid case
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 0.22), caseMat); tabletG.add(body);
    for (const [bx, by] of [[-1.65, 1.15], [1.65, 1.15], [-1.65, -1.15], [1.65, -1.15]]) {
      const bump = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd93b, roughness: 0.5 }),
      );
      bump.position.set(bx, by, 0); bump.scale.z = 0.6; tabletG.add(bump);
    }
    const home = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0x59c9f0, roughness: 0.4 }),
    );
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
        for (const [cx2, cy2] of [[60, 40], [120, 26]]) {
          gcx.beginPath(); gcx.arc(cx2, cy2, 13, 0, 7); gcx.arc(cx2 + 16, cy2 + 4, 10, 0, 7); gcx.fill();
        }
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
    anims.push((t: number) => {
      tabletG.position.y = 2.7 + Math.sin(t * 0.7) * 0.18;
      tabletG.rotation.y = Math.sin(t * 0.25) * 0.3;
      tabletG.rotation.z = Math.sin(t * 0.4) * 0.05;
    });
    // idle beat: letter cycles A→B→C; gentle stars drift upward (ReadingLand)
    const stars: THREE.Sprite[] = [];
    for (let i = 0; i < 5; i++) { const s = this.glow(0xffd93b, 0.35); s.material.opacity = 0; g.add(s); stars.push(s); }
    anims.push((t: number) => {
      const li = (t / 1.6 | 0) % 3;
      if (li !== this.laT) { this.laT = li; drawScene(li); }
      const k = this.idleK(g);
      stars.forEach((s, i) => {
        const c = (t * 0.25 + i / 5) % 1;
        s.position.set(Math.sin(i * 2.4) * 1.8, 1 + c * 3.2, Math.cos(i * 2.4) * 1.2);
        s.material.opacity = k * (1 - c) * 0.6;
      });
    });
  }

  /* ── 11 Flow State — obsidian space with a churning fluid orb ────────── */

  buildFluid(g: THREE.Group, anims: Animator[]): void {
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(4, 64),
      new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.15, metalness: 0.9 }),
    );
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; g.add(pool);
    const geo = new THREE.IcosahedronGeometry(1.3, 5);
    const fluid = createFluidMaterial();
    const orb = new THREE.Mesh(geo, fluid.material); orb.position.y = 1.9; g.add(orb);
    const glow = this.glow(0x0a3aff, 2.4); glow.material.opacity = 0.35; glow.position.set(0, 1.9, 0); g.add(glow);
    const key = new THREE.PointLight(0x2a5cff, 12, 14); key.position.set(0, 5, 4); g.add(key);
    const rim = new THREE.PointLight(0x0022aa, 8, 12); rim.position.set(-4, 2, -2); g.add(rim);
    anims.push(this.dustPlane(g, 0x3366ff, 5, 6, 0, 3, -1));
    anims.push((t: number) => { fluid.uTime.value = t; orb.rotation.y = t * 0.15; });
    // idle beat: voice ripples expand across the obsidian pool
    const rings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const r = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), mat);
      r.rotation.x = -Math.PI / 2; r.position.y = 0.05; g.add(r); rings.push({ mesh: r, mat });
    }
    anims.push((t: number) => {
      const k = this.idleK(g);
      rings.forEach((r, i) => {
        const c = (t * 0.35 + i / 3) % 1;
        r.mesh.scale.setScalar(0.4 + c * 3.6); r.mat.opacity = k * (1 - c) * 0.5;
      });
    });
  }

  /* ── dust study ──────────────────────────────────────────────────────── */

  buildDustStudy(g: THREE.Group, anims: Animator[]): void {
    this.softbox(g, 0, 8, 0, 2.0, 2.0, 220);
    this.lightCone(g, 0xffffff, 0, 7.9, 0, 2.4, 0.07);
    const chair = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6 }),
    );
    chair.position.y = 0.45; g.add(chair);
    anims.push(this.dustPlane(g, 0xffffff, 3.5, 6, 0, 3.2, -0.5));
    anims.push(this.dustPlane(g, 0xffffff, 3.5, 6, 0, 3.2, -1, 1.2));
  }
}
