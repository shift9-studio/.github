/* SHIFT-9 engine — damped-velocity dolly, streaming stages, GLSL set pieces */
(function () {
  const SCENE_CONSTANTS = window.SHIFT9_CONSTANTS = {
    CAMERA_START_Z: 50, CAMERA_END_Z: -250,
    VELOCITY_DAMPING: 0.05, SCROLL_SENSITIVITY: 0.001, MAX_VELOCITY: 3.0,
    LOAD_RADIUS: 50, UNLOAD_RADIUS: 100,
    COLOR_ACCENT_BLUE: '#0033FF', COLOR_DARK_BG: '#000000', COLOR_UI_FG: '#E0E0E0'
  };
  /* ── PROJECT REGISTRY — single source of truth ────────────────────────────
     ADD a project: append ONE object here. `id` = 'NN_slug' (NN drives HUD +
     shortcut-row order). Reuse an existing `kind` for its set look, or add a
     new kind + builder wired in buildSet(). Space `z` ~23 apart inside
     (CAMERA_END_Z, CAMERA_START_Z). CHANGE a status: edit `status` here —
     HUD, idle dossier, shortcut row, detail page and the reduced-motion grid
     all read from this array automatically.
     `tag`/`spec` = the two idle-dossier lines. `desc` + `facts` (+ optional
     `link`) fill the static portfolio detail page opened by clicking the set. */
  const PROJECTS = [
    { id: '01_winfix', n: 'WinFix', status: 'IN DEV', z: -233, accent: '#E0E0E0', kind: 'whiteroom',
      tag: 'Tell it what is broken in plain English. Restore point first, then the fix runs in order.',
      spec: 'SFC · DISM · CHKDSK · update-cache reset — streamed live, dry-run by default',
      desc: 'A native Windows repair utility with a real GUI. Describe the problem in your own words and it builds an ordered repair plan — always starting with a safety restore point — then drives the built-in Windows tools asynchronously, streaming their output live so the window never freezes. Includes a one-click in-place upgrade for out-of-support builds and a media tool for bootable USB or ISO.',
      facts: [['STACK', 'Python · Flet (Flutter desktop) · asyncio'], ['SAFETY', 'Safe Mode dry-run default · restore point first · UAC-aware'], ['REPAIRS', 'Windows Update reset · SFC · DISM · CHKDSK · network stack'], ['SHIP', 'Standalone .exe via flet pack — two clicks']] },
    { id: '02_omni3d', n: 'Omni-3D', status: 'IN DEV', z: -210, accent: '#0033FF', kind: 'warehouse',
      tag: 'Text, image, or phone video in — rigged, retopologized, engine-ready 3D out.',
      spec: '6-stage pipeline, all real providers: carve → retopo → rig → retarget → EITL gate',
      desc: 'A video-native 3D production studio with automated rigging. Three closed loops rebuild an object in 3D, drop a working skeleton inside it, copy motion from a second video, then validate the result against real game-engine rules — repairing its own mistakes on failure and live-syncing the finished asset into Unreal or Unity over WebSocket.',
      facts: [['STACK', 'TypeScript · Fastify · Zod schemas · meshoptimizer WASM'], ['LOOPS', 'A Structural · B Auto-Rig/Mocap · C Engine-in-the-Loop compiler'], ['ENGINES', 'UE5 SK_Mannequin · Unity Humanoid — live-sync bridge'], ['SELF-REPAIR', 'EITL gate E = w1·manifold + w2·intersections + w3·tear → auto micro-repair']] },
    { id: '03_auto', n: 'Automation Sys', status: 'IN DEV', z: -187, accent: '#0033FF', kind: 'datacenter',
      tag: 'Sterile pipelines that never sleep.',
      spec: 'Zero-touch orchestration — schedule, run, verify, repeat',
      desc: 'An automation control plane: schedulers, queues and self-healing jobs behind one observability wall. Built as the studio\u2019s quiet backbone — everything that should run without a human, runs here.',
      facts: [['FOCUS', 'Orchestration · monitoring · self-healing jobs'], ['SET', 'Sterile data-center soundstage'], ['STATUS', 'Concept in development']] },
    { id: '04_instrument', n: 'INSTRUMENT', status: 'IN DEV', z: -164, accent: '#0033FF', kind: 'synth',
      tag: 'One monolith. Every sound.',
      spec: 'Brutalist performance-synth study — 9 knobs, 6 sliders, one slab',
      desc: 'An industrial-design study for a performance instrument: a single brutalist slab where every control earns its place. Sound design as architecture — nothing decorative, everything playable.',
      facts: [['FOCUS', 'Industrial design · sound UX'], ['FORM', 'Monolithic console · tactile controls'], ['STATUS', 'Design study in development']] },
    { id: '05_forge', n: 'Titanium Forge', status: 'V2 IN DEV', z: -141, accent: '#FF2400', kind: 'forge',
      tag: 'Tune the physics live, edit the TSX in place, pull it from the CLI.',
      spec: '4 motion models · hand-written 626-line JSX linter · motion profiler with real spring math',
      desc: 'A motion workbench for React developers. Drag stiffness, damping and mass and the curve redraws live across four motion models; the generated motion props regenerate as you drag. Edit the TSX in place with a real linter that auto-fixes mistakes, then take the code — copy it, export a themed zip, or install it from your terminal via the CLI daemon.',
      facts: [['STACK', 'React 19 · Vite 6 · Tailwind 4 · motion 12 · TS 5.7 · Express 5'], ['INSTRUMENT', 'Euler spring solver · damping ratio ζ = c / 2√(km) · live FPS'], ['EXTRAS', 'Web Audio soundscapes · Figma import · SSE co-presence · registry store'], ['VERSION', 'v6.5-PRO — lint and build clean']],
      link: 'https://hidden-glow-736.higgsfield.app' },
    { id: '06_gamedev', n: 'Game Design Forge', status: 'IN DEV', z: -118, accent: '#0033FF', kind: 'workbench',
      tag: 'A sandbox for game systems.',
      spec: 'Prototype a mechanic before lunch — keep what survives playtesting',
      desc: 'A gaming design sandbox: an R&D workbench for prototyping mechanics, systems and feel in isolation before they earn a place in a real project. Messy on purpose — the clutter is the process.',
      facts: [['FOCUS', 'Mechanics prototyping · systems design'], ['METHOD', 'Build small · playtest fast · discard freely'], ['REPO', 'Kariimc/game-design-forge']] },
    { id: '07_midnight', n: 'Midnight Return', status: 'IN DEV', z: -95, accent: '#0033FF', kind: 'corridor',
      tag: 'A metroidvania descent.',
      spec: 'Interconnected map · ability-gated backtracking · saturated hazard light',
      desc: 'A moody metroidvania. One interconnected world that keeps folding back on itself — new abilities reopen old corridors, and the deeper you go, the more the light misbehaves.',
      facts: [['GENRE', 'Metroidvania'], ['MOOD', 'Industrial dark · blue/orange hazard palette'], ['REPO', 'Kariimc/Midnight-return-']] },
    { id: '08_arcade', n: 'Voxel Arcade BB', status: 'IN DEV', z: -72, accent: '#FF00AA', kind: 'arcade',
      tag: 'Drop-in voxel arcade.',
      spec: 'Attract mode always on — pick up, play, pass the controller',
      desc: 'A retro-futuristic arcade cabinet study: voxel basketball built for instant pick-up-and-play. Descended from the Bball and Hoopclone experiments — the fun survived, the friction did not.',
      facts: [['LINEAGE', 'Bball · Hoopclone'], ['FORM', 'Cabinet build · attract mode · one-button onboarding'], ['STATUS', 'In development']] },
    { id: '09_lumen', n: 'Lumen Mapper', status: 'IN DEV', z: -49, accent: '#FFFFFF', kind: 'lumen',
      tag: 'Point your projector at anything. Drag four dots with your phone. Done.',
      spec: 'Electron desktop + phone remote over Wi-Fi — QR pair, corner-pin, play',
      desc: 'Projection mapping for everyone. Plug in a projector and a black fullscreen output appears on it automatically; scan the QR with your phone and drag four dots to pin the image onto any surface. Corner-pinning runs on a matrix3d warp with automated tests covering the real mapping math.',
      facts: [['STACK', 'Electron · WebSocket · plain HTML/JS remote — no framework'], ['FLOW', 'QR pair → drag 4 corners → mapped'], ['SHIP', 'Windows installer (Lumen Setup .exe)'], ['V1 LIMITS', 'Single projector · same-Wi-Fi control by design']] },
    { id: '10_learning', n: 'Learning App', status: 'IN DEV', z: -26, accent: '#0033FF', kind: 'floatcube',
      tag: 'Six lands, from recognizing pictures to reading storybooks alone.',
      spec: 'ReadingLand — mastery unlocks the next land; mistakes are never punished',
      desc: 'ReadingLand: a premium-feeling, fully offline, monetization-free early-literacy app for Android tablets, iPads and touch PCs. Six staged lands with guide characters take a child from visual recognition to independent reading; three correct answers master an item, mastering a land unlocks the next, and a wrong tap only ever asks gently to try again.',
      facts: [['STACK', 'Python · Kivy · SQLite — core engine has zero UI imports'], ['JOURNEY', 'Look & Learn → Letters → Sounds → Words → Sentences → Story Sky'], ['PRINCIPLES', 'Audio-first · toddler-usable · offline & private · never punish'], ['PARENTS', 'Progress dashboard · adaptive difficulty · spaced practice']] },
    { id: '11_flow', n: 'Flow State', status: 'IN DEV', z: -3, accent: '#0033FF', kind: 'fluid',
      tag: 'Hold Ctrl+Win. Speak. It types.',
      spec: '100% local dictation — nothing ever leaves the PC · 122 tests',
      desc: 'Local voice dictation for Windows. Hold or tap the hotkey, speak, and the text lands in whatever window you are using — filler words removed, spoken punctuation understood. A recovery inbox saves interrupted sessions, a delivery queue guards against misdirected text, and an accuracy lab learns your corrections. Everything runs on-device.',
      facts: [['STACK', 'Python · sherpa-onnx (Moonshine / Whisper engines)'], ['PRIVACY', 'Fully offline — audio and transcripts never leave the machine'], ['RELIABILITY', 'Recovery inbox · delivery queue · clipboard shield · scoped undo'], ['LEARNING', 'Dictionary · vocabulary · reviewed correction pairs']] },
    { id: '12_pinch', n: 'Just a Pinch', status: 'LIVE', z: 20, accent: '#FFFFFF', kind: 'kitchen',
      tag: 'Save a recipe from a link, a photo, pasted text, or a prompt — then cook it hands-free.',
      spec: 'iOS + Android · offline-first · one-tap shopping list',
      desc: 'A recipe app for iOS and Android. Capture recipes from anywhere — a URL, a photo of a handwritten card, pasted text, or an AI prompt — then cook them hands-free, plan your week, and generate a shopping list in one tap. Recipes sync to the cloud when signed in and always mirror locally, so it works offline and signed-out.',
      facts: [['STACK', 'Expo · React Native · TypeScript · Supabase edge functions'], ['CAPTURE', 'URL import · photo OCR · text parse · AI generate'], ['AI', 'Claude via server-side proxy — the key never leaves the backend'], ['STATUS', 'LIVE — closed testing → Play production track']] }
  ];
  // Asset Manifest #4 — dust motes chunk (verbatim math)
  const DUST_FRAG = `
    uniform float uTime; uniform vec3 uColor; uniform float uFade; varying vec2 vUv;
    float hash2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453123); }
    float mote(vec2 uv, vec2 grid, float t, float thresh){
      vec2 cell = floor(uv*grid);
      float n = hash2(cell + vec2(t*0.37, t*0.61));
      if (n < thresh) return 0.0;
      vec2 f = fract(uv*grid);
      vec2 c = vec2(hash2(cell+7.1), hash2(cell+3.3));
      return smoothstep(0.35, 0.0, length(f - c)); // point falloff inside the cell
    }
    void main(){
      float t = floor(uTime*6.0);
      float dust = mote(vUv, vec2(60.0,40.0), t, 0.985)*0.9
                 + mote(vUv+13.7, vec2(110.0,75.0), t*1.7, 0.992)*0.7;
      float edge = smoothstep(0.0,0.3,vUv.x)*smoothstep(1.0,0.7,vUv.x)*smoothstep(0.0,0.2,vUv.y)*smoothstep(1.0,0.8,vUv.y);
      gl_FragColor = vec4(uColor, min(dust,1.0)*0.35*edge*uFade);
    }`;
  const VUV_VERT = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';

  class Shift9Scene extends HTMLElement {
    async connectedCallback() {
      this.style.cssText = 'display:block;width:100%;height:100%;background:#000;';
      const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
      if (!this.isConnected) return;
      this.THREE = THREE;
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      this.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.Fog(0x000000, 8, 55);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
      camera.position.set(0, 2.2, SCENE_CONSTANTS.CAMERA_START_Z);
      scene.add(new THREE.AmbientLight(0x111114, 0.6));
      this.state = { vel: 0, z: SCENE_CONSTANTS.CAMERA_START_Z, t: 0, built: new Map(), animators: [] };
      Object.assign(this, { renderer, scene, camera });
      this.glowTex = this.makeGlowTexture(THREE);

      const resize = () => {
        const w = this.clientWidth || 1, h = this.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      resize(); this._ro = new ResizeObserver(resize); this._ro.observe(this);

      const C = SCENE_CONSTANTS;
      const addVel = d => {
        if (this.state.locked) return;                 // detail page open — dolly frozen
        this.state.glide = null;                       // any manual input cancels an auto-glide
        this.state.vel = Math.max(-C.MAX_VELOCITY, Math.min(C.MAX_VELOCITY, this.state.vel + d));
      };
      this._wheel = e => { if (this.state.locked) return; e.preventDefault(); addVel(e.deltaY * C.SCROLL_SENSITIVITY * 60 * 0.016); };
      addEventListener('wheel', this._wheel, { passive: false });
      this._key = e => { if (e.key === 'ArrowDown') addVel(-0.4); if (e.key === 'ArrowUp') addVel(0.4); };
      addEventListener('keydown', this._key);
      let ty = null;
      this._ts = e => { ty = e.touches[0].clientY; };
      this._tm = e => { if (ty != null) { addVel((e.touches[0].clientY - ty) * 0.004); ty = e.touches[0].clientY; } };
      addEventListener('touchstart', this._ts); addEventListener('touchmove', this._tm);
      // idle click on the set → open its portfolio detail page (shell listens)
      this._click = () => {
        const s = this.state;
        if (s.locked || s.glide || Math.abs(s.vel) >= 0.01) return;
        let best = null, bd = 1e9;
        for (const p of PROJECTS) { const d = Math.abs(s.z - p.z) + (p.z < s.z ? 0 : 30); if (d < bd) { bd = d; best = p; } }
        if (Math.abs(s.z - best.z) < 26) this.dispatchEvent(new CustomEvent('shift9-open', { bubbles: true, detail: { id: best.id } }));
      };
      renderer.domElement.addEventListener('click', this._click);
      renderer.domElement.style.cursor = 'pointer';

      let last = performance.now();
      const loop = (now) => {
        this._raf = requestAnimationFrame(loop);
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
          camera.fov = 42 + 30 * Math.sin(Math.PI * k); camera.updateProjectionMatrix();
          camera.rotation.z = Math.sin(k * Math.PI * 2) * 0.05;
          if (I.frames) for (let i = 0; i < I.frames.length; i++) I.frames[i].rotation.z += dt * (i % 2 ? 0.9 : -0.7);
          if (k >= 1) this.endIntro();
        } else if (s.glide != null) {                                  // cinematic auto-dolly to a set
          s.glide.t += dt;
          const dur = s.glide.dur;
          const k = Math.min(s.glide.t / dur, 1);
          const e = k < 0.5 ? 4*k*k*k : 1 - Math.pow(-2*k+2, 3)/2;     // easeInOutCubic
          s.z = s.glide.from + (s.glide.to - s.glide.from) * e;
          s.vel = 0;
          if (k >= 1) { s.z = s.glide.to; s.glide = null; }
        } else {
          s.vel *= Math.pow(1 - C2.VELOCITY_DAMPING, dt * 60);         // friction on velocity, not position
          s.z = Math.max(C2.CAMERA_END_Z, Math.min(C2.CAMERA_START_Z, s.z + s.vel * dt * 60));
          if (s.z === C2.CAMERA_END_Z || s.z === C2.CAMERA_START_Z) s.vel = 0;
        }
        camera.position.z = s.z;
        camera.position.x = Math.sin(s.t * 0.13) * 0.12;              // subtle handheld drift
        camera.position.y = 2.2 + Math.sin(s.t * 0.19) * 0.06;
        this.stream();
        for (const fn of s.animators) fn(s.t, dt);
        renderer.render(scene, camera);
        this.emitHud();
      };
      this._raf = requestAnimationFrame(loop);
      if (this._pendingIntro) { this._pendingIntro = false; this.playIntro(false); }
      this.dispatchEvent(new CustomEvent('shift9-ready', { bubbles: true }));
    }
    disconnectedCallback() {
      cancelAnimationFrame(this._raf); this._ro && this._ro.disconnect();
      removeEventListener('wheel', this._wheel); removeEventListener('keydown', this._key);
      removeEventListener('touchstart', this._ts); removeEventListener('touchmove', this._tm);
      this.renderer && this.renderer.dispose();
    }
    setLocked(v) { this.state.locked = !!v; }
    playIntro(skip) {
      const THREE = this.THREE, s = this.state;
      if (!THREE) { this._pendingIntro = !skip; return; }
      if (skip) { s.z = SCENE_CONSTANTS.CAMERA_START_Z; return; }
      s.locked = true;
      this._fogFar = this.scene.fog.far; this.scene.fog.far = 210; this.scene.fog.near = 24;
      const grp = new THREE.Group(), frames = [];
      for (let i = 0; i < 34; i++) {                                   // chassis bulkheads flying past
        const fr = new THREE.Group();
        const m = new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0x0033FF : (i % 5 === 2 ? 0x2244aa : 0x20242e) });
        const W = 7 + (i % 3), H = 5.5 + (i % 2) * 1.5;
        const bar = (w, h, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), m); b.position.set(x, y, 0); fr.add(b); };
        bar(0.16, H, -W / 2, H / 2 + 0.2); bar(0.16, H, W / 2, H / 2 + 0.2); bar(W + 0.16, 0.16, 0, H + 0.2); bar(W + 0.16, 0.16, 0, 0.2);
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
    endIntro() {
      const s = this.state, I = s.intro; s.intro = null; s.locked = false;
      s.z = SCENE_CONSTANTS.CAMERA_START_Z;
      this.camera.fov = 42; this.camera.updateProjectionMatrix(); this.camera.rotation.z = 0;
      this.scene.fog.far = this._fogFar || 55; this.scene.fog.near = 8;
      if (I && I.grp) { this.scene.remove(I.grp); I.grp.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose && o.material.dispose(); }); }
      this.dispatchEvent(new CustomEvent('shift9-entered', { bubbles: true }));
    }
    idleK(g, span) { // 0..1 — how settled the camera is at this set's viewing mark
      const d = Math.abs(this.state.z - g.position.z - 13);
      const near = Math.max(0, 1 - d / (span || 16));
      return (Math.abs(this.state.vel) < 0.02 && !this.state.glide) ? near : 0;
    }
    glideTo(z) {
      const C = SCENE_CONSTANTS;
      const to = Math.max(C.CAMERA_END_Z, Math.min(C.CAMERA_START_Z, z));
      const from = this.state.z;
      const dist = Math.abs(to - from);
      if (dist < 0.5) return;
      this.state.vel = 0;
      this.state.glide = { from, to, t: 0, dur: Math.min(3.2, 0.9 + dist / 90) }; // longer travel = longer, capped
    }
    emitHud() {
      const s = this.state;
      if (s.intro) return;
      let best = null, bd = 1e9;
      for (const p of PROJECTS) { // prefer nearest set AHEAD of camera (p.z < camZ)
        const ahead = p.z < s.z, d = Math.abs(s.z - p.z) + (ahead ? 0 : 30);
        if (d < bd) { bd = d; best = p; }
      }
      bd = Math.abs(s.z - best.z);
      const prog = (SCENE_CONSTANTS.CAMERA_START_Z - s.z) / (SCENE_CONSTANTS.CAMERA_START_Z - SCENE_CONSTANTS.CAMERA_END_Z);
      const key = best.id + '|' + Math.round(prog * 200) + '|' + (Math.abs(s.vel) < 0.01 ? 1 : 0);
      if (key !== this._hk) {
        this._hk = key;
        this.dispatchEvent(new CustomEvent('shift9-hud', {
          bubbles: true,
          detail: { id: best.id, name: best.n, status: best.status, accent: best.accent, index: best.id.slice(0, 2), progress: prog, idle: Math.abs(this.state.vel) < 0.01, dist: bd, tag: best.tag, spec: best.spec }
        }));
      }
    }
    makeGlowTexture(THREE) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    glow(color, size) {
      const THREE = this.THREE;
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.scale.setScalar(size); return m;
    }
    stream() {
      const C = SCENE_CONSTANTS, s = this.state;
      for (const p of PROJECTS) {
        const d = Math.abs(s.z - p.z), have = s.built.has(p.id);
        if (!have && d < C.LOAD_RADIUS) this.buildSet(p);
        else if (have && d > C.UNLOAD_RADIUS) this.destroySet(p);
      }
    }
    destroySet(p) {
      const e = this.state.built.get(p.id); if (!e) return;
      this.scene.remove(e.group);
      e.group.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose && o.material.dispose(); });
      this.state.animators = this.state.animators.filter(a => a._set !== p.id);
      this.state.built.delete(p.id);
    }
    buildSet(p) {
      const THREE = this.THREE, g = new THREE.Group();
      g.position.z = p.z;
      const accent = new THREE.Color(p.accent);
      // shared soundstage floor pool of light
      const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48),
        new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.9, metalness: 0.1 }));
      floor.rotation.x = -Math.PI / 2; g.add(floor);
      const anims = [];
      if (p.kind === 'corridor') this.buildCorridor(g, anims, accent);
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
      for (const a of anims) { a._set = p.id; this.state.animators.push(a); }
      this.scene.add(g);
      this.state.built.set(p.id, { group: g });
    }
    softbox(g, x, y, z, w, h, intensity, color) {
      const THREE = this.THREE;
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: color || 0xffffff }));
      panel.position.set(x, y, z); panel.rotation.x = Math.PI / 2; g.add(panel);
      const gl = this.glow(color || 0xffffff, w * 2.2); gl.position.set(x, y - 0.2, z); g.add(gl);
      const sp = new THREE.SpotLight(color || 0xffffff, intensity, y * 3, 0.9, 0.5, 1.2);
      sp.position.set(x, y, z); sp.target.position.set(x, 0, z); g.add(sp, sp.target);
      return sp;
    }
    dustPlane(g, color, w, h, x, y, z, ry) {
      const THREE = this.THREE;
      const mat = new THREE.ShaderMaterial({
        vertexShader: VUV_VERT, fragmentShader: DUST_FRAG,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uFade: { value: 1 } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z); m.rotation.y = ry || 0; g.add(m);
      const wz = () => g.position.z + z;
      return t => {
        mat.uniforms.uTime.value = t;
        const d = Math.abs(this.state.z - wz());
        mat.uniforms.uFade.value = Math.min(Math.max((d - 4) / 8, 0), 1); // fade out near camera
      };
    }
    lightCone(g, color, x, topY, z, r, opacity) {
      const THREE = this.THREE;
      const geo = new THREE.ConeGeometry(r, topY, 32, 1, true);
      const mat = new THREE.ShaderMaterial({
        vertexShader: VUV_VERT,
        fragmentShader: `varying vec2 vUv; uniform vec3 uColor; uniform float uOp;
          void main(){ float a = pow(vUv.y,2.0)*uOp; gl_FragColor = vec4(uColor, a); }`,
        uniforms: { uColor: { value: new THREE.Color(color) }, uOp: { value: opacity } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      });
      const m = new THREE.Mesh(geo, mat); m.position.set(x, topY / 2, z); g.add(m);
      return mat;
    }
    buildStage(g, anims, accent, p) {
      const THREE = this.THREE;
      this.softbox(g, 0, 7.5, 0, 3.4, 2.2, 260);
      this.lightCone(g, 0xffffff, 0, 7.4, 0, 3.4, 0.05);
      // hero monolith arrangement
      const mat = new THREE.MeshStandardMaterial({ color: 0xd8d8dc, roughness: 0.35, metalness: 0.05 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.6 });
      const seed = p.id.charCodeAt(1);
      const hero = new THREE.Mesh(new THREE.BoxGeometry(2.2 + (seed % 3) * 0.6, 1.4 + (seed % 2), 1.1), seed % 2 ? mat : dark);
      hero.position.y = hero.geometry.parameters.height / 2; g.add(hero);
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
    buildKitchen(g, anims) {
      const THREE = this.THREE;
      this.softbox(g, 0, 8, 0, 4.6, 2.6, 140);
      this.lightCone(g, 0xffffff, 0, 7.9, 0, 4, 0.045);
      const white = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 });
      const grey = new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: 0.3, metalness: 0.15 });
      const island = new THREE.Mesh(new THREE.BoxGeometry(6, 1.15, 1.6), grey); island.position.y = 0.575; g.add(island);
      const top = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.07, 1.75), white); top.position.y = 1.185; g.add(top);
      const back = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.4, 0.5), new THREE.MeshStandardMaterial({ color: 0xd6d6da, roughness: 0.65 })); back.position.set(0, 2.6, -2.2); g.add(back);
      const niche = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.52), new THREE.MeshStandardMaterial({ color: 0xe4e4e6, roughness: 0.6 }));
      niche.position.set(0, 2.0, -2.19); g.add(niche);
      const tc = document.createElement('canvas'); tc.width = 96; tc.height = 64;
      const tcx = tc.getContext('2d'); const ttex = new THREE.CanvasTexture(tc);
      tcx.fillStyle = '#eafcfd'; tcx.fillRect(0, 0, 96, 64);
      const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.6, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff, map: ttex }));
      tablet.position.set(-1.5, 1.55, 0.1); tablet.rotation.x = -0.18; g.add(tablet);
      const tg = this.glow(0x9fe8ec, 1.5); tg.position.copy(tablet.position); g.add(tg);
      const pl = new THREE.PointLight(0xbfeef0, 4, 4); pl.position.set(-1.5, 1.6, 0.5); g.add(pl);
      anims.push(this.dustPlane(g, 0xffffff, 5, 6, 0, 3.5, -1));
      // idle beat: tablet cycles recipe cards; soft steam rises off the counter
      const wisps = []; for (let i = 0; i < 3; i++) { const s = this.glow(0xffffff, 0.9); s.material.opacity = 0; g.add(s); wisps.push(s); }
      anims.push((t) => {
        const ci = (t / 2 | 0) % 3;
        if (ci !== this._jpT) { this._jpT = ci; tcx.fillStyle = '#eafcfd'; tcx.fillRect(0, 0, 96, 64); tcx.fillStyle = ['#ffb3a0', '#a0d8b0', '#f5d78e'][ci]; tcx.fillRect(8, 8, 34, 48); tcx.fillStyle = '#89a0a4'; for (let j = 0; j < 4; j++) tcx.fillRect(50, 12 + j * 11, 38 - j * 6, 4); ttex.needsUpdate = true; }
        const k = this.idleK(g);
        wisps.forEach((s, i) => { const c = (t * 0.3 + i / 3) % 1; s.position.set(1.6 + Math.sin(t + i) * 0.15, 1.35 + c * 1.6, 0.2); s.material.opacity = k * (1 - c) * 0.16; });
      });
    }
    buildCorridor(g, anims) {
      const THREE = this.THREE; // 06 Midnight Return — dark metal corridor, blue/orange flicker, steam
      const metal = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.45, metalness: 0.85 });
      for (let i = 0; i < 7; i++) {
        const frame = new THREE.Group();
        const mk = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.35), metal); m.position.set(x, y, 0); frame.add(m); };
        mk(0.4, 5.4, -3.2, 2.7); mk(0.4, 5.4, 3.2, 2.7); mk(6.8, 0.4, 0, 5.2);
        const grate = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.08, 1.6), new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.3, metalness: 0.9 }));
        grate.position.y = 0.04; frame.add(grate);
        frame.position.z = -i * 2.4 + 7; g.add(frame);
      }
      const flickers = [];
      const addLight = (color, x, y, z, intensity) => {
        const pl = new THREE.PointLight(color, intensity, 8, 1.6); pl.position.set(x, y, z); g.add(pl);
        const gl = this.glow(color, 1.6); gl.position.set(x, y, z); g.add(gl);
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), new THREE.MeshBasicMaterial({ color })); bulb.position.set(x, y, z); g.add(bulb);
        flickers.push({ pl, gl, base: intensity, ph: Math.random() * 10 });
      };
      addLight(0x0033ff, -2.85, 4.6, 4.5, 26); addLight(0x0033ff, 2.85, 4.6, -0.5, 26);
      addLight(0xff6a1a, 2.85, 1.4, 2.2, 15); addLight(0xff6a1a, -2.85, 1.4, -3, 12);
      addLight(0x0033ff, 0, 5.0, -7, 30);
      anims.push((t) => {
        for (const f of flickers) {
          const fl = 0.55 + 0.45 * Math.max(0, Math.sin(t * 17 + f.ph) * Math.sin(t * 5.3 + f.ph * 2) + 0.4);
          f.pl.intensity = f.base * fl; f.gl.material.opacity = 0.85 * fl;
        }
      });
      anims.push(this.dustPlane(g, 0x2244ff, 5, 4.5, 0, 2.5, -1));
      anims.push(this.dustPlane(g, 0xff8844, 5, 4.5, 0.5, 2.5, -4));
      // steam
      const steam = [];
      for (let i = 0; i < 3; i++) {
        const sp = this.glow(0x3355aa, 3.5 + i); sp.material.opacity = 0.12; sp.position.set((i - 1) * 2, 1 + i * 0.7, 2 - i * 3); g.add(sp); steam.push(sp);
      }
      anims.push((t) => steam.forEach((s, i) => { s.position.y = 1 + i * 0.7 + Math.sin(t * 0.6 + i) * 0.4; s.material.opacity = 0.09 + 0.05 * Math.sin(t * 0.8 + i * 2); }));
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
        doorGlow.material.opacity = k * (0.55 + 0.12 * Math.sin(t * 1.7));
        dg.material.opacity = k * 0.5;
      });
    }
    buildLumen(g, anims) {
      const THREE = this.THREE; // 04 Lumen — projective texture mapping onto wireframe-caged object
      // live glitching UI map texture
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const ctx = c.getContext('2d');
      const tex = new THREE.CanvasTexture(c);
      const drawUI = (t) => { // projection-mapping loop: grid → neon facets → scan bars
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
      const mat = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: tex }, uProj: { value: projMat }, uProjPos: { value: proj.position.clone() }, uTime: { value: 0 } },
        vertexShader: `varying vec4 vW; varying vec3 vN;
          void main(){ vW = modelMatrix*vec4(position,1.0); vN = normalize(mat3(modelMatrix)*normal);
            gl_Position = projectionMatrix*viewMatrix*vW; }`,
        fragmentShader: `uniform sampler2D uMap; uniform mat4 uProj; uniform vec3 uProjPos; uniform float uTime;
          varying vec4 vW; varying vec3 vN;
          void main(){
            vec4 p = uProj * vW;                       // projective texture mapping
            vec2 uv = (p.xy/p.w)*0.5+0.5;
            vec3 toP = normalize(uProjPos - vW.xyz);
            float facing = max(dot(vN, toP), 0.0);     // depth-facing occlusion of back surfaces
            uv.x += sin(uv.y*40.0 + uTime*6.0)*0.004;  // distortion function
            float inside = step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0)*step(0.0,p.w);
            vec3 base = vec3(0.06,0.06,0.065);            // white boxes reading faintly in the dark
            vec3 lit = texture2D(uMap, uv).rgb * facing * inside * 2.2
                     + vec3(0.6,0.65,0.8) * facing * inside * 0.15;  // ambient projector glow
            gl_FragColor = vec4(base + lit, 1.0);
          }`
      });
      // stack of white boxes on the floor — the mapping canvas
      for (const [w, h, d, x, y, z, ry] of [
        [2.2, 1.4, 1.4, 0, 0.7, 0, 0.1],
        [1.3, 1.1, 1.1, -0.75, 1.95, 0.15, -0.2],
        [1.0, 0.9, 0.9, 0.55, 1.85, -0.15, 0.35],
        [0.75, 0.75, 0.75, -0.45, 2.85, 0.05, 0.5],
        [0.9, 0.9, 0.9, 1.7, 0.45, 0.6, -0.3]
      ]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.rotation.y = ry; g.add(b); }
      // projector body + beam
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.9), new THREE.MeshStandardMaterial({ color: 0x202028, roughness: 0.4, metalness: 0.6 }));
      body.position.set(-5.5, 4.5, 6); body.lookAt(0, 1.8, 0); g.add(body);
      const bg = this.glow(0xffffff, 1.2); bg.position.set(-5.5, 4.5, 6); g.add(bg);
      const beamGeo = new THREE.CylinderGeometry(0.06, 2.2, new THREE.Vector3(-5.5, 4.5, 6).distanceTo(new THREE.Vector3(0, 1.5, 0)), 24, 1, true);
      const beamMat = new THREE.ShaderMaterial({
        vertexShader: VUV_VERT,
        fragmentShader: 'varying vec2 vUv; uniform float uTime; void main(){ float a=(1.0-vUv.y)*0.06; gl_FragColor=vec4(vec3(1.0), max(a,0.0)); }',
        uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      const mid = new THREE.Vector3(-5.5, 4.5, 6).lerp(new THREE.Vector3(0, 1.5, 0), 0.5);
      beam.position.copy(mid); beam.lookAt(0, 1.5, 0); beam.rotateX(Math.PI / 2); g.add(beam);
      const sp = new THREE.SpotLight(0xffffff, 60, 20, 0.36, 0.7); sp.position.set(-5.5, 4.5, 6); sp.target.position.set(0, 1.5, 0); g.add(sp, sp.target);
      // idle beat: four corner-pin dots snap onto the mapped object
      const dots = [];
      for (const [dx, dy] of [[-1.6, 3.1], [1.6, 3.1], [-1.6, 0.4], [1.6, 0.4]]) { const d = this.glow(0xffffff, 0.45); d.position.set(dx, dy, 0.9); d.material.opacity = 0; g.add(d); dots.push(d); }
      anims.push((t) => { const k = this.idleK(g); dots.forEach((d, i) => { d.material.opacity = k * (0.5 + 0.4 * Math.sin(t * 2 + i * 1.6)); }); });
      anims.push(this.dustPlane(g, 0xffffff, 6, 4.5, -2.2, 2.8, 1.5, 0.7));
      anims.push((t) => {
        mat.uniforms.uTime.value = t; beamMat.uniforms.uTime.value = t;
        if ((t * 30 | 0) !== this._lu) { this._lu = t * 30 | 0; drawUI(t); }
      });
    }
    // 01 WinFix — high-contrast white room (bright cyclorama, one dark broken monolith)
    buildWhiteRoom(g, anims) {
      const THREE = this.THREE;
      const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.85, metalness: 0 });
      const bright = new THREE.Mesh(new THREE.CircleGeometry(10, 48), new THREE.MeshStandardMaterial({ color: 0xededf0, roughness: 0.95 }));
      bright.rotation.x = -Math.PI / 2; bright.position.y = 0.01; g.add(bright);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(11, 8, 0.4), white); wall.position.set(0, 4, -3); g.add(wall);
      const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 7), white); sideL.position.set(-5.3, 4, 0.5); g.add(sideL);
      const sideR = sideL.clone(); sideR.position.x = 5.3; g.add(sideR);
      this.softbox(g, -2.5, 7.6, 1, 3.2, 2.4, 200); this.softbox(g, 2.5, 7.6, 1, 3.2, 2.4, 200);
      g.add(new THREE.HemisphereLight(0xffffff, 0x999999, 0.9));
      // dark broken monolith — a fractured slab (the thing WinFix fixes)
      const dark = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.5, metalness: 0.2 });
      const shards = [];
      for (let i = 0; i < 4; i++) {
        const sh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.5), dark);
        const off = { x: (i - 1.5) * 0.15, rz: (i % 2 ? 1 : -1) * 0.05 * i };
        sh.position.set(off.x, 0.45 + i * 0.85, 0); sh.rotation.z = off.rz; g.add(sh); shards.push({ sh, off });
      }
      const scar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.4, 0.55), new THREE.MeshBasicMaterial({ color: 0x0033FF }));
      scar.position.set(0.1, 1.9, 0.01); g.add(scar);
      const gl = this.glow(0x0033FF, 1.6); gl.position.copy(scar.position); g.add(gl);
      // idle beat: the fracture heals shut, breathes, re-cracks (repair motif)
      anims.push((t) => {
        const k = this.idleK(g), heal = k * (0.5 + 0.5 * Math.sin(t * 0.9));
        for (const { sh, off } of shards) { sh.position.x = off.x * (1 - heal); sh.rotation.z = off.rz * (1 - heal); }
        gl.material.opacity = 0.3 + heal * 0.6;
      });
    }
    // 02 Omni-3D — dark warehouse with a glitching mech silhouette
    buildWarehouse(g, anims) {
      const THREE = this.THREE;
      const metal = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.6, metalness: 0.7 });
      const back = new THREE.Mesh(new THREE.BoxGeometry(16, 11, 0.4), new THREE.MeshStandardMaterial({ color: 0x0d0e12, roughness: 0.9 })); back.position.set(0, 5.5, -5); g.add(back);
      for (let i = 0; i < 5; i++) { const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 0.3), metal); beam.position.set(-6 + i * 3, 4.5, -4.6); g.add(beam); }
      // mech: stacked masses
      const mech = new THREE.Group();
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.2), metal); torso.position.y = 3.4; mech.add(torso);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), metal); head.position.y = 4.9; mech.add(head);
      const hip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.1), metal); hip.position.y = 2.0; mech.add(hip);
      const mkLeg = x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), metal); l.position.set(x, 0.9, 0); mech.add(l); };
      mkLeg(-0.5); mkLeg(0.5);
      const mkArm = x => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.4), metal); a.position.set(x, 3.2, 0.2); a.rotation.z = x < 0 ? 0.2 : -0.2; mech.add(a); };
      mkArm(-1.2); mkArm(1.2);
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0x0033FF })); eye.position.set(0, 4.95, 0.46); mech.add(eye);
      g.add(mech);
      // idle beat: voxel→wireframe→solid rebuild scan sweeping up the mech
      const wireM = new THREE.Group();
      mech.children.forEach(c => { if (c.geometry && c.geometry.type === 'BoxGeometry') { const w = new THREE.LineSegments(new THREE.WireframeGeometry(c.geometry), new THREE.LineBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0 })); w.position.copy(c.position); w.rotation.copy(c.rotation); w.scale.setScalar(1.05); wireM.add(w); } });
      g.add(wireM);
      const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.06), new THREE.MeshBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0 }));
      scan.position.z = 0.8; g.add(scan);
      const eg = this.glow(0x0033FF, 1.2); eg.position.set(0, 4.95, 0.6); g.add(eg);
      const rim = new THREE.PointLight(0x2a4cff, 30, 14); rim.position.set(-5, 6, 3); g.add(rim);
      const key = new THREE.SpotLight(0xbfcaff, 40, 20, 0.6, 0.6); key.position.set(3, 8, 5); key.target.position.set(0, 3, 0); g.add(key, key.target);
      anims.push(this.dustPlane(g, 0x3355cc, 6, 6, 0, 3, -1));
      let gt = 0;
      anims.push((t, dt) => { gt -= dt; if (gt <= 0 && Math.random() < 0.3) { gt = 0.08; mech.position.x = (Math.random() - 0.5) * 0.25; eye.material.color.setHex(Math.random() < 0.5 ? 0xff2255 : 0x0033FF); } else if (gt <= 0) mech.position.x = 0; });
      anims.push((t) => {
        const k = this.idleK(g), y = (t * 1.1 % 1) * 5.6;
        scan.position.y = y; scan.material.opacity = k * 0.8;
        wireM.children.forEach(w => { w.material.opacity = k * (w.position.y < y ? 0.55 : 0.08); });
      });
    }
    // 03 Automation Sys — sterile data center, rows of racks with blinking LEDs
    buildDataCenter(g, anims) {
      const THREE = this.THREE;
      const rack = new THREE.MeshStandardMaterial({ color: 0x202329, roughness: 0.4, metalness: 0.6 });
      g.add(new THREE.AmbientLight(0x223040, 0.7));
      const leds = [];
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 5; i++) {
          const r = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.2, 1.4), rack);
          r.position.set(side * 3.4, 2.1, -i * 2.6 + 4); g.add(r);
          for (let j = 0; j < 10; j++) {
            const on = Math.random() < 0.7;
            const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), new THREE.MeshBasicMaterial({ color: on ? 0x33ffcc : 0x0a2a26 }));
            led.position.set(side * 3.4 + (side < 0 ? 0.58 : -0.58), 0.6 + j * 0.36, -i * 2.6 + 4 + 0.72); led.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(led); leds.push(led);
          }
        }
      }
      const strip = (x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 12), new THREE.MeshBasicMaterial({ color: 0x00e0ff })); s.position.set(x, 4.3, -1); g.add(s); const gl = this.glow(0x00e0ff, 2); gl.position.set(x, 4.3, 2); g.add(gl); };
      strip(-2.6); strip(2.6);
      const overhead = new THREE.PointLight(0x66eaff, 18, 16); overhead.position.set(0, 5, 3); g.add(overhead);
      anims.push(this.dustPlane(g, 0x66eaff, 6, 5, 0, 3, -1));
      anims.push((t) => { if ((t * 8 | 0) !== this._dcT) { this._dcT = t * 8 | 0; for (const l of leds) if (Math.random() < 0.06) l.material.color.setHex(Math.random() < 0.7 ? 0x33ffcc : 0x0a2a26); } });
      // idle beat: cascading data pulse sweeping down the aisles
      anims.push((t) => { const k = this.idleK(g); if (k < 0.1) return; for (const l of leds) { const ph = ((l.position.z - t * 6) % 3 + 3) % 3; if (ph < 0.35) l.material.color.setHex(0xaffff0); } });
    }
    // 04 INSTRUMENT — monolithic brutalist synth console
    buildSynth(g, anims) {
      const THREE = this.THREE;
      this.softbox(g, 0, 7.8, 1.5, 3, 2, 120, 0xffe6c2);
      const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1f, roughness: 0.6, metalness: 0.3 });
      const face = new THREE.MeshStandardMaterial({ color: 0x26262c, roughness: 0.5, metalness: 0.4 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.6, 1.8), dark); body.position.y = 1.3; g.add(body);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.6, 0.2), face); panel.position.set(0, 1.9, 0.9); panel.rotation.x = -0.5; g.add(panel);
      for (let i = 0; i < 9; i++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.14, 16), new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.4 })); k.rotation.x = -0.5 + Math.PI / 2; k.position.set(-2 + i * 0.5, 2.35, 1.05); g.add(k); }
      const sliders = [];
      for (let i = 0; i < 6; i++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.03), new THREE.MeshBasicMaterial({ color: 0x0033FF })); sl.position.set(-1.5 + i * 0.6, 1.55, 1.02); sl.rotation.x = -0.5; g.add(sl); sliders.push(sl); }
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshBasicMaterial({ color: 0x0a2a4a })); screen.position.set(1.6, 2.15, 1.06); screen.rotation.x = -0.5; g.add(screen);
      const amber = new THREE.PointLight(0xffb35a, 8, 8); amber.position.set(-2, 3, 3); g.add(amber);
      const blue = new THREE.PointLight(0x0033FF, 8, 8); blue.position.set(2, 2.5, 2); g.add(blue);
      const gl = this.glow(0x0033FF, 2.2); gl.position.set(0, 1.6, 1.4); g.add(gl);
      anims.push(this.dustPlane(g, 0xffd9a0, 5, 5, 0, 3, -1));
      // idle beat: sliders sequence, screen waveform pulses
      anims.push((t) => {
        const k = this.idleK(g);
        sliders.forEach((sl, i) => { sl.position.y = 1.55 + k * Math.sin(t * 2 + i * 0.9) * 0.12; });
        screen.material.color.setHSL(0.58, 0.7, 0.12 + k * (0.14 + 0.1 * Math.sin(t * 3)));
      });
    }
    // 05 Titanium Forge — steel press extruding a white-hot billet
    buildForge(g, anims) {
      const THREE = this.THREE;
      const steel = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.35, metalness: 0.9 });
      const topPress = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 2.4), steel); g.add(topPress);
      const botPress = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 2.4), steel); botPress.position.y = 0.7; g.add(botPress);
      const col = x => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 6, 16), steel); c.position.set(x, 3, -0.9); g.add(c); };
      col(-1.9); col(1.9);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.7, 2.6), steel); cap.position.y = 6; g.add(cap);
      // white-hot billet
      const hotMat = new THREE.MeshBasicMaterial({ color: 0xffd9b0 });
      const billet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), hotMat); billet.position.set(2.6, 1.1, 0); g.add(billet);
      const heat = new THREE.PointLight(0xff4a10, 40, 12, 2); heat.position.set(2.6, 1.3, 0.6); g.add(heat);
      const hg = this.glow(0xff5a1a, 3.2); hg.position.set(2.6, 1.1, 0.4); g.add(hg);
      const rim = new THREE.PointLight(0x3a4a66, 14, 14); rim.position.set(-3, 5, 4); g.add(rim);
      // idle beat: extruded chip cools white-hot → steel as it slides off the press
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd9b0 }));
      chip.visible = false; g.add(chip);
      // sparks
      const sparks = [];
      for (let i = 0; i < 14; i++) { const s = this.glow(0xffb060, 0.4); s.position.set(2.6, 1.1, 0); g.add(s); sparks.push({ s, v: new THREE.Vector3() }); }
      anims.push(this.dustPlane(g, 0xff8844, 5, 5, 1, 3, -1));
      let pt = 0;
      anims.push((t, dt) => {
        pt += dt; const press = Math.abs(Math.sin(pt * 1.2)); topPress.position.y = 2.4 + press * 0.9; heat.intensity = 30 + press * 30;
        for (const k of sparks) { if (k.s.material.opacity <= 0.02 || k.s.position.y < 0.2) { if (Math.random() < 0.25) { k.s.position.set(2.6 + (Math.random() - 0.5) * 0.8, 1.1, (Math.random() - 0.5) * 0.8); k.v.set((Math.random() - 0.5) * 3, 3 + Math.random() * 3, (Math.random() - 0.5) * 3); k.s.material.opacity = 0.9; } } else { k.s.position.addScaledVector(k.v, dt); k.v.y -= 9 * dt; k.s.material.opacity *= 0.94; } }
      });
      anims.push((t) => {
        const ki = this.idleK(g); chip.visible = ki > 0.2; if (!chip.visible) return;
        const c = (t * 0.5) % 1;
        chip.position.set(2.6 + 1.6 * c, 1.05 - 0.15 * c, 0.9);
        chip.material.color.setRGB(1 - 0.82 * c, 0.85 - 0.68 * c, 0.7 - 0.5 * c);
      });
    }
    // 06 Game Design Forge — cluttered R&D workbench
    buildWorkbench(g, anims) {
      const THREE = this.THREE;
      const wood = new THREE.MeshStandardMaterial({ color: 0x3a3230, roughness: 0.8 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 2.6), wood); top.position.y = 1.4; g.add(top);
      for (const x of [-2.7, 2.7]) for (const z of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), wood); leg.position.set(x, 0.7, z); g.add(leg); }
      const dark = new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.5, metalness: 0.4 });
      // scattered clutter
      const rnd = (a, b) => a + Math.random() * (b - a);
      for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.2, 0.6), rnd(0.15, 0.5), rnd(0.2, 0.6)), dark); c.position.set(rnd(-2.5, 2.5), 1.5 + 0.1, rnd(-0.9, 0.9)); c.rotation.y = Math.random() * 3; g.add(c); }
      // two monitors
      for (const mx of [-1.4, 0.4]) { const mon = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshBasicMaterial({ color: 0x123a4a })); mon.position.set(mx, 2.2, -0.9); g.add(mon); const gl = this.glow(0x1fb0d0, 1.2); gl.position.set(mx, 2.2, -0.7); g.add(gl); }
      // desk lamp cone
      const lamp = new THREE.SpotLight(0xfff0d0, 26, 8, 0.7, 0.5); lamp.position.set(1.8, 3.4, 0.6); lamp.target.position.set(0.5, 1.4, 0); g.add(lamp, lamp.target);
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
        holo.material.opacity = k * (0.5 + 0.3 * Math.sin(t * 9));
        hgl.position.y = holo.position.y; hgl.material.opacity = k * 0.35;
      });
    }
    // 08 Voxel Arcade BB — retro-futuristic cabinet with glowing screen
    buildArcade(g, anims) {
      const THREE = this.THREE;
      this.softbox(g, 0, 7.8, 1.2, 3.0, 2.2, 240);                    // overhead pool lighting the floor
      this.lightCone(g, 0xffffff, 0, 7.7, 1.2, 3.2, 0.045);
      const floorSpot = new THREE.SpotLight(0xff9ad0, 24, 12, 0.8, 0.6); floorSpot.position.set(0, 5.5, 3.5); floorSpot.target.position.set(0, 0, 1.5); g.add(floorSpot, floorSpot.target);
      const shell = new THREE.MeshStandardMaterial({ color: 0x161620, roughness: 0.5, metalness: 0.3 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.4, 1.6), shell); body.position.y = 2.7; g.add(body); // sits on the floor
      const marquee = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.0), shell); marquee.position.set(0, 5.35, 0.35); marquee.rotation.x = 0.35; g.add(marquee);
      const mq = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.42), new THREE.MeshBasicMaterial({ color: 0xff00aa })); mq.position.set(0, 5.38, 0.93); mq.rotation.x = 0.35; g.add(mq);
      const mg = this.glow(0xff00aa, 2.2); mg.position.set(0, 5.4, 1.1); g.add(mg);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.5), new THREE.MeshBasicMaterial({ color: 0x120a2a })); screen.position.set(0, 3.8, 0.83); g.add(screen);
      const scr = new THREE.CanvasTexture(document.createElement('canvas'));
      const cv = scr.image; cv.width = cv.height = 128; const cx = cv.getContext('2d');
      screen.material.map = scr; screen.material.color.setHex(0xffffff);
      // control deck with joysticks + buttons
      const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 0.9), new THREE.MeshStandardMaterial({ color: 0x0e0e16, roughness: 0.4 }));
      deck.position.set(0, 2.55, 0.85); deck.rotation.x = -0.22; g.add(deck);
      const mkStick = x => {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x33343c, roughness: 0.35, metalness: 0.6 }));
        st.position.set(x, 2.78, 0.78); st.rotation.x = -0.22; g.add(st);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff2244, roughness: 0.25 }));
        ball.position.set(x, 2.93, 0.745); g.add(ball);
        return st;
      };
      mkStick(-0.75); mkStick(0.15);
      const btnCols = [0xff00aa, 0x00e5ff, 0xffe000];
      for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), new THREE.MeshStandardMaterial({ color: btnCols[i], roughness: 0.3, emissive: btnCols[i], emissiveIntensity: 0.4 })); b.position.set(0.55 + i * 0.22, 2.64 + i * 0.048, 0.88 - i * 0.02); b.rotation.x = -0.22; g.add(b); }
      // coin door with glowing slot
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: 0x22242c, roughness: 0.35, metalness: 0.7 }));
      door.position.set(0, 0.85, 0.81); g.add(door);
      const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.16), new THREE.MeshBasicMaterial({ color: 0xffe000 }));
      slot.position.set(-0.12, 0.95, 0.845); g.add(slot);
      const slot2 = slot.clone(); slot2.position.x = 0.12; g.add(slot2);
      const sg = this.glow(0xffe000, 0.5); sg.position.set(0, 0.95, 0.9); g.add(sg);
      const mkEdge = (x, c) => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.4, 0.08), new THREE.MeshBasicMaterial({ color: c })); e.position.set(x, 2.7, 0.82); g.add(e); const gl = this.glow(c, 1.6); gl.position.set(x, 2.7, 0.9); g.add(gl); };
      mkEdge(-1.24, 0xff00aa); mkEdge(1.24, 0x00e5ff);
      const lp = new THREE.PointLight(0xff00aa, 10, 8); lp.position.set(-2, 3, 2); g.add(lp);
      const lc = new THREE.PointLight(0x00e5ff, 10, 8); lc.position.set(2, 3, 2); g.add(lc);
      anims.push((t) => {
        if ((t * 12 | 0) === this._arT) return; this._arT = t * 12 | 0;
        cx.fillStyle = '#0a0420'; cx.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 20; i++) { cx.fillStyle = ['#ff00aa', '#00e5ff', '#ffe000'][i % 3]; const s = 8; cx.fillRect((Math.sin(t * 2 + i) * 4 + 8) * s % 128, ((i * 13 + (t * 20 | 0)) % 16) * s, s, s); }
        // idle beat: attract mode — PRESS START blink + bouncing voxel ball
        if ((t * 1.5 | 0) % 2) { cx.fillStyle = '#fff'; cx.font = 'bold 13px monospace'; cx.fillText('PRESS START', 22, 118); }
        cx.fillStyle = '#ff8800'; cx.fillRect(60 + Math.sin(t * 2.2) * 42, 58 - Math.abs(Math.sin(t * 4.4)) * 36, 8, 8);
        scr.needsUpdate = true;
      });
    }
    // 10 Learning App — big colorful kids tablet floating in the air (ReadingLand)
    buildFloatCube(g, anims) {
      const THREE = this.THREE;
      this.softbox(g, 0, 8, 0.5, 2.6, 2.6, 130);
      const tabletG = new THREE.Group(); tabletG.position.y = 2.7; g.add(tabletG);
      const caseMat = new THREE.MeshStandardMaterial({ color: 0xff6b4a, roughness: 0.55 });   // chunky coral kid case
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 0.22), caseMat); tabletG.add(body);
      for (const [bx, by] of [[-1.65, 1.15], [1.65, 1.15], [-1.65, -1.15], [1.65, -1.15]]) {
        const bump = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffd93b, roughness: 0.5 }));
        bump.position.set(bx, by, 0); bump.scale.z = 0.6; tabletG.add(bump);
      }
      const home = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0x59c9f0, roughness: 0.4 }));
      home.rotation.x = Math.PI / 2; home.position.set(0, -1.05, 0.12); tabletG.add(home);
      const gc = document.createElement('canvas'); gc.width = 256; gc.height = 176;
      const gcx = gc.getContext('2d'); const gtex = new THREE.CanvasTexture(gc);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.95), new THREE.MeshBasicMaterial({ map: gtex }));
      screen.position.z = 0.115; tabletG.add(screen);
      const sglow = this.glow(0xaee6ff, 3.4); sglow.position.set(0, 2.7, 0.6); g.add(sglow); sglow.material.opacity = 0.3;
      const slight = new THREE.PointLight(0xaee6ff, 8, 7); slight.position.set(0, 2.7, 1.4); g.add(slight);
      const under = this.glow(0xffd93b, 2.6); under.position.set(0, 1.1, 0); g.add(under); under.material.opacity = 0.4;
      const up = new THREE.PointLight(0xffb060, 8, 8); up.position.set(0, 0.6, 0); g.add(up);
      // screen scenes: fun image behind each letter, letter in a contrasting color
      const drawScene = (li) => {
        const W = 256, H = 176;
        if (li === 0) {            // A — sunny meadow, deep-navy letter
          gcx.fillStyle = '#8fd4ff'; gcx.fillRect(0, 0, W, H);
          gcx.fillStyle = '#ffd93b'; gcx.beginPath(); gcx.arc(210, 38, 26, 0, 7); gcx.fill();
          gcx.fillStyle = '#7ed957'; gcx.beginPath(); gcx.ellipse(70, H + 10, 120, 55, 0, 0, 7); gcx.fill();
          gcx.beginPath(); gcx.ellipse(210, H + 16, 110, 48, 0, 0, 7); gcx.fill();
          gcx.fillStyle = '#ffffff'; for (const [cx2, cy2] of [[60, 40], [120, 26]]) { gcx.beginPath(); gcx.arc(cx2, cy2, 13, 0, 7); gcx.arc(cx2 + 16, cy2 + 4, 10, 0, 7); gcx.fill(); }
          gcx.fillStyle = '#1c2f7a';
        } else if (li === 1) {     // B — underwater bubbles, white letter w/ navy outline
          gcx.fillStyle = '#2ec4b6'; gcx.fillRect(0, 0, W, H);
          gcx.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 9; i++) { gcx.beginPath(); gcx.arc((i * 53 + 20) % W, (i * 37 + 15) % H, 5 + (i % 3) * 4, 0, 7); gcx.fill(); }
          gcx.fillStyle = '#177e6f'; for (let i = 0; i < 4; i++) gcx.fillRect(18 + i * 68, H - 42, 7, 42);
          gcx.fillStyle = '#ff8c42'; gcx.beginPath(); gcx.ellipse(205, 130, 17, 10, 0, 0, 7); gcx.fill();
          gcx.beginPath(); gcx.moveTo(222, 130); gcx.lineTo(236, 120); gcx.lineTo(236, 140); gcx.fill();
          gcx.fillStyle = '#ffffff';
        } else {                   // C — starry night + moon, sunny-yellow letter
          gcx.fillStyle = '#5b3fa8'; gcx.fillRect(0, 0, W, H);
          gcx.fillStyle = '#fff7d6'; gcx.beginPath(); gcx.arc(216, 40, 22, 0, 7); gcx.fill();
          gcx.fillStyle = '#5b3fa8'; gcx.beginPath(); gcx.arc(207, 34, 18, 0, 7); gcx.fill();
          gcx.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { const sx = (i * 71 + 13) % W, sy = (i * 47 + 9) % H; gcx.fillRect(sx, sy, 3, 3); }
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
      anims.push((t) => { tabletG.position.y = 2.7 + Math.sin(t * 0.7) * 0.18; tabletG.rotation.y = Math.sin(t * 0.25) * 0.3; tabletG.rotation.z = Math.sin(t * 0.4) * 0.05; });
      // idle beat: letter cycles A→B→C; gentle stars drift upward (ReadingLand)
      const stars = []; for (let i = 0; i < 5; i++) { const s = this.glow(0xffd93b, 0.35); s.material.opacity = 0; g.add(s); stars.push(s); }
      anims.push((t) => {
        const li = (t / 1.6 | 0) % 3;
        if (li !== this._laT) { this._laT = li; drawScene(li); }
        const k = this.idleK(g);
        stars.forEach((s, i) => { const c = (t * 0.25 + i / 5) % 1; s.position.set(Math.sin(i * 2.4) * 1.8, 1 + c * 3.2, Math.cos(i * 2.4) * 1.2); s.material.opacity = k * (1 - c) * 0.6; });
      });
    }
    // 11 Flow State — obsidian space with a churning fluid orb
    buildFluid(g, anims) {
      const THREE = this.THREE;
      const pool = new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.15, metalness: 0.9 })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; g.add(pool);
      const geo = new THREE.IcosahedronGeometry(1.3, 5);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `uniform float uTime; varying float vD; varying vec3 vN;
          float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9,78.2,37.7)))*43758.5); }
          float noise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            float n=mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); return n; }
          void main(){ vN=normal; float d=noise(position*1.6+uTime*0.4)*0.5+noise(position*3.2-uTime*0.3)*0.25; vD=d;
            vec3 p=position+normal*d*0.7; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
        fragmentShader: `varying float vD; varying vec3 vN;
          void main(){ vec3 deep=vec3(0.005,0.01,0.03), lit=vec3(0.03,0.12,0.45);
            float f=pow(max(1.0-abs(vN.z),0.0),2.5); vec3 c=mix(deep,lit,clamp(vD*vD*1.4+f*0.5,0.0,1.0));
            gl_FragColor=vec4(c,1.0); }`
      });
      const orb = new THREE.Mesh(geo, mat); orb.position.y = 1.9; g.add(orb);
      const glow = this.glow(0x0a3aff, 2.4); glow.material.opacity = 0.35; glow.position.set(0, 1.9, 0); g.add(glow);
      const key = new THREE.PointLight(0x2a5cff, 12, 14); key.position.set(0, 5, 4); g.add(key);
      const rim = new THREE.PointLight(0x0022aa, 8, 12); rim.position.set(-4, 2, -2); g.add(rim);
      anims.push(this.dustPlane(g, 0x3366ff, 5, 6, 0, 3, -1));
      anims.push((t) => { mat.uniforms.uTime.value = t; orb.rotation.y = t * 0.15; });
      // idle beat: voice ripples expand across the obsidian pool
      const rings = [];
      for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0x2a5cff, transparent: true, opacity: 0, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.y = 0.05; g.add(r); rings.push(r); }
      anims.push((t) => { const k = this.idleK(g); rings.forEach((r, i) => { const c = (t * 0.35 + i / 3) % 1; r.scale.setScalar(0.4 + c * 3.6); r.material.opacity = k * (1 - c) * 0.5; }); });
    }
    buildDustStudy(g, anims) {
      const THREE = this.THREE;
      this.softbox(g, 0, 8, 0, 2.0, 2.0, 220);
      this.lightCone(g, 0xffffff, 0, 7.9, 0, 2.4, 0.07);
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6 }));
      chair.position.y = 0.45; g.add(chair);
      anims.push(this.dustPlane(g, 0xffffff, 3.5, 6, 0, 3.2, -0.5));
      anims.push(this.dustPlane(g, 0xffffff, 3.5, 6, 0, 3.2, -1, 1.2));
    }
  }
  customElements.define('shift9-scene', Shift9Scene);
  window.SHIFT9_PROJECTS = PROJECTS;
})();
