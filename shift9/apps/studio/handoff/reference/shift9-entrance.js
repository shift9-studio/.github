/* SHIFT-9 entrance — video autoplays → first-person desk POV → amigurumi hands open the laptop
   and grab the wireless mouse → camera zooms into the screen. Emits 'entrance-open' (bubbles). */
(function () {
  class Shift9Entrance extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.cssText = 'display:block;width:100%;height:100%;background:#000;position:relative;overflow:hidden;';
      const v = this._video = document.createElement('video');
      v.src = this.getAttribute('src') || ''; v.playsInline = true; v.autoplay = true;
      v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
      this.appendChild(v);
      v.play().catch(() => { v.muted = true; v.play().catch(() => this._toDesk()); });
      v.addEventListener('ended', () => this._toDesk());
      v.addEventListener('error', () => this._toDesk());
    }
    _toDesk() {
      if (this._desk) return; this._desk = true;
      const v = this._video;
      v.style.transition = 'opacity 0.9s'; v.style.opacity = '0';
      setTimeout(() => { try { v.remove(); } catch (e) {} }, 950);
      this.startDesk();
    }
    async startDesk() {
      const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
      if (!this.isConnected) return;
      const renderer = this._renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.2s;cursor:pointer;';
      this.appendChild(renderer.domElement);
      requestAnimationFrame(() => { renderer.domElement.style.opacity = '1'; });
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050607);
      scene.fog = new THREE.Fog(0x050607, 2.5, 7);
      const camera = new THREE.PerspectiveCamera(60, 1, 0.02, 20);
      const camBase = new THREE.Vector3(0, 0.56, 1.15);
      camera.position.copy(camBase);
      const resize = () => { const w = this.clientWidth || 1, h = this.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
      resize(); this._ro = new ResizeObserver(resize); this._ro.observe(this);
      // ── lighting
      scene.add(new THREE.HemisphereLight(0x28303c, 0x05060a, 0.28));
      const warm = new THREE.SpotLight(0xffb377, 7, 5, 0.55, 0.6); warm.position.set(-1.2, 1.1, 0.4);
      warm.target.position.set(0, 0, 0); warm.castShadow = true; warm.shadow.mapSize.set(1024, 1024); warm.shadow.bias = -0.0004;
      scene.add(warm, warm.target);
      const cool = new THREE.PointLight(0x3a4d70, 2, 4); cool.position.set(1.3, 1.1, 0.6); scene.add(cool);
      // ── desk with wood-grain texture + wall
      const wc = document.createElement('canvas'); wc.width = wc.height = 256;
      const wcx = wc.getContext('2d');
      wcx.fillStyle = '#3a2d22'; wcx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 60; i++) { wcx.strokeStyle = `rgba(${20 + Math.random() * 30 | 0},${14 + Math.random() * 20 | 0},${8 + Math.random() * 14 | 0},0.5)`; wcx.lineWidth = 1 + Math.random() * 2; wcx.beginPath(); const y = Math.random() * 256; wcx.moveTo(0, y); wcx.bezierCurveTo(80, y + (Math.random() - 0.5) * 14, 170, y + (Math.random() - 0.5) * 14, 256, y + (Math.random() - 0.5) * 8); wcx.stroke(); }
      const woodTex = new THREE.CanvasTexture(wc); woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2, 1);
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 1.5), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 }));
      desk.position.y = -0.025; desk.receiveShadow = true; scene.add(desk);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ color: 0x0c0d11, roughness: 0.95 }));
      wall.position.set(0, 1, -1.4); scene.add(wall);
      // ── XXL drafters mat with fine grid
      const mc = document.createElement('canvas'); mc.width = 512; mc.height = 256;
      const mcx = mc.getContext('2d');
      mcx.fillStyle = '#0d0e12'; mcx.fillRect(0, 0, 512, 256);
      mcx.strokeStyle = 'rgba(120,130,150,0.10)'; mcx.lineWidth = 1;
      for (let x = 0; x <= 512; x += 32) { mcx.beginPath(); mcx.moveTo(x, 0); mcx.lineTo(x, 256); mcx.stroke(); }
      for (let y = 0; y <= 256; y += 32) { mcx.beginPath(); mcx.moveTo(0, y); mcx.lineTo(512, y); mcx.stroke(); }
      const matTex = new THREE.CanvasTexture(mc);
      const matB = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.006, 0.85), new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.92 }));
      matB.position.set(0, 0.003, 0.12); matB.receiveShadow = true; scene.add(matB);
      // ── HP EliteBook
      const alu = new THREE.MeshStandardMaterial({ color: 0xb9bec6, roughness: 0.35, metalness: 0.7 });
      const lap = new THREE.Group(); lap.position.set(0, 0.006, -0.02); scene.add(lap);   // pulled closer to the viewer
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.016, 0.42), alu); base.position.y = 0.008; base.castShadow = true; lap.add(base);
      const kbd = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.24), new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.6 }));
      kbd.rotation.x = -Math.PI / 2; kbd.position.set(0, 0.0165, -0.06); lap.add(kbd);
      const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshStandardMaterial({ color: 0x2e3138, roughness: 0.4 }));
      tp.rotation.x = -Math.PI / 2; tp.position.set(0, 0.0165, 0.13); lap.add(tp);
      const hinge = new THREE.Group(); hinge.position.set(0, 0.016, -0.21); lap.add(hinge);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.42), alu); lid.position.set(0, 0.006, 0.21); lid.castShadow = true; hinge.add(lid);
      const sc2 = document.createElement('canvas'); sc2.width = 512; sc2.height = 320;
      const scx = sc2.getContext('2d'); const stex = new THREE.CanvasTexture(sc2);
      const drawScreen = (on, tt) => {
        scx.fillStyle = '#04060c'; scx.fillRect(0, 0, 512, 320);
        if (on) { // b&w galaxy boot glow
          const g2 = scx.createRadialGradient(256, 160, 10, 256, 160, 300);
          g2.addColorStop(0, '#2a2d33'); g2.addColorStop(0.5, '#101216'); g2.addColorStop(1, '#020304');
          scx.fillStyle = g2; scx.fillRect(0, 0, 512, 320);
          scx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const hx = Math.abs(Math.sin(i * 127.1) * 43758.5) % 1, hy = Math.abs(Math.sin(i * 311.7) * 12543.3) % 1; scx.globalAlpha = 0.2 + (i % 5) * 0.15; scx.fillRect(hx * 512, hy * 320, 2, 2); }
          scx.globalAlpha = 0.85 + 0.15 * Math.sin(tt * 3);
          scx.fillStyle = '#35d5ee'; scx.font = 'bold 120px sans-serif'; scx.textAlign = 'center'; scx.textBaseline = 'middle';
          scx.fillText('9', 256, 158); scx.globalAlpha = 1;
        }
        stex.needsUpdate = true;
      };
      drawScreen(false, 0);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.36), new THREE.MeshBasicMaterial({ map: stex }));
      screen.rotation.x = Math.PI / 2; screen.position.set(0, -0.001, 0.21); hinge.add(screen);
      const sLight = new THREE.PointLight(0x8a9099, 0, 0.9); sLight.position.set(0, 0.2, -0.07); scene.add(sLight);
      // ── premium wireless mouse (right of laptop, on the mat)
      const mouse = new THREE.Group(); mouse.position.set(0.46, 0.0, 0.26); scene.add(mouse);   // its own zone, clear of the laptop
      const mBody = new THREE.Mesh(new THREE.SphereGeometry(0.042, 24, 18), new THREE.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.3, metalness: 0.25 }));
      mBody.scale.set(1, 0.48, 1.55); mBody.position.y = 0.019; mBody.castShadow = true; mouse.add(mBody);
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.004, 0.05), new THREE.MeshStandardMaterial({ color: 0x111216, roughness: 0.4 }));
      seam.position.set(0, 0.039, -0.028); mouse.add(seam);
      const mDot = new THREE.Mesh(new THREE.CircleGeometry(0.004, 12), new THREE.MeshBasicMaterial({ color: 0x35d5ee }));
      mDot.rotation.x = -Math.PI / 2 + 0.4; mDot.position.set(0, 0.037, 0.03); mouse.add(mDot);
      // ── desk gear: knob, macro pad, mug, headphones
      // brushed-metal control dial (Surface Dial-class — premium aluminum puck)
      const knobBody = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.05, 0.045, 48), new THREE.MeshStandardMaterial({ color: 0xc7ccd4, roughness: 0.22, metalness: 0.92 }));
      knobBody.position.set(0.58, 0.0225, -0.02); knobBody.castShadow = true; scene.add(knobBody);
      const knobTop = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.004, 48), new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.35, metalness: 0.7 }));
      knobTop.position.set(0.58, 0.047, -0.02); scene.add(knobTop);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.004, 8, 40), new THREE.MeshBasicMaterial({ color: 0x35d5ee }));
      ring.rotation.x = Math.PI / 2; ring.position.set(0.58, 0.005, -0.02); scene.add(ring);
      const kl = new THREE.PointLight(0x35d5ee, 0.7, 0.4); kl.position.set(0.58, 0.03, -0.02); scene.add(kl);
      // Corsair Xeneon Edge — vertical orientation on a stand, facing the user; live calendar app
      // (drawEdge('news', [...]) is the ready path for a news feed — same canvas, different renderer)
      const edgeG = new THREE.Group(); edgeG.position.set(-0.52, 0, 0.0); edgeG.rotation.y = 0.38; scene.add(edgeG);
      const eBase = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.008, 0.075), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.4, metalness: 0.6 }));
      eBase.position.y = 0.004; edgeG.add(eBase);
      const eCol = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.35, metalness: 0.7 }));
      eCol.position.set(0, 0.03, -0.012); edgeG.add(eCol);
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.36, 0.012), new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.4 }));
      bezel.position.y = 0.235; bezel.castShadow = true; edgeG.add(bezel);
      const ec = document.createElement('canvas'); ec.width = 180; ec.height = 640;
      const ecx = ec.getContext('2d'); const etex = new THREE.CanvasTexture(ec);
      const drawEdge = (mode, news) => {
        ecx.fillStyle = '#0b0c10'; ecx.fillRect(0, 0, 180, 640);
        ecx.textAlign = 'center';
        if (mode === 'news' && news) {                       // news path: pass an array of headline strings
          ecx.fillStyle = '#35d5ee'; ecx.font = '600 15px sans-serif'; ecx.fillText('NEWS', 90, 40);
          ecx.fillStyle = '#d8dae0'; ecx.font = '13px sans-serif'; ecx.textAlign = 'left';
          news.slice(0, 10).forEach((h, i) => { ecx.fillText(String(h).slice(0, 22), 14, 80 + i * 54); });
        } else {
          const d = new Date();
          ecx.fillStyle = '#6a6e78'; ecx.font = '600 13px sans-serif'; ecx.fillText('CALENDAR', 90, 42);
          ecx.fillStyle = '#ffffff'; ecx.font = '300 52px sans-serif';
          ecx.fillText(d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, ''), 90, 118);
          ecx.fillStyle = '#35d5ee'; ecx.font = '600 14px sans-serif';
          ecx.fillText(d.toLocaleDateString([], { weekday: 'long' }).toUpperCase(), 90, 156);
          ecx.fillStyle = '#ffffff'; ecx.font = '300 88px sans-serif'; ecx.fillText(String(d.getDate()), 90, 250);
          ecx.fillStyle = '#9a9ea8'; ecx.font = '15px sans-serif';
          ecx.fillText(d.toLocaleDateString([], { month: 'long', year: 'numeric' }), 90, 290);
          ecx.strokeStyle = 'rgba(255,255,255,0.12)'; ecx.beginPath(); ecx.moveTo(24, 322); ecx.lineTo(156, 322); ecx.stroke();
          const dow = (d.getDay() + 7) % 7;
          'SMTWTFS'.split('').forEach((c, i) => {
            const x = 26 + i * 21.5, today = i === dow;
            if (today) { ecx.fillStyle = '#35d5ee'; ecx.beginPath(); ecx.arc(x, 352, 11, 0, 7); ecx.fill(); }
            ecx.fillStyle = today ? '#04141a' : '#8a8e98'; ecx.font = '600 12px sans-serif'; ecx.fillText(c, x, 356);
          });
          ecx.fillStyle = '#6a6e78'; ecx.font = '12px sans-serif';
          ecx.fillText('No events today', 90, 420);
          ecx.fillStyle = '#35d5ee'; ecx.font = '600 11px sans-serif';
          ecx.fillText('SHIFT-9 · STUDIO DAY', 90, 452);
        }
        etex.needsUpdate = true;
      };
      drawEdge('calendar');
      const eScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.101, 0.346), new THREE.MeshBasicMaterial({ map: etex }));
      eScreen.position.set(0, 0.235, 0.0065); edgeG.add(eScreen);
      const eGlow = new THREE.PointLight(0x9fb6c9, 0.5, 0.5); eGlow.position.set(-0.48, 0.25, 0.1); scene.add(eGlow);
      // Ember smart coaster (off the mat) + mug on it
      const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.06, 0.012, 32), new THREE.MeshStandardMaterial({ color: 0x0e0f12, roughness: 0.45 }));
      coaster.position.set(0.98, 0.006, -0.05); scene.add(coaster);
      const cLed = new THREE.Mesh(new THREE.CircleGeometry(0.004, 10), new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
      cLed.rotation.x = -Math.PI / 2; cLed.position.set(0.98, 0.0125, 0.0); scene.add(cLed);
      const mugMat = new THREE.MeshStandardMaterial({ color: 0xd8d3cb, roughness: 0.6 });
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.037, 0.1, 24), mugMat); mug.position.set(0.98, 0.062, -0.05); mug.castShadow = true; scene.add(mug);
      const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.006, 8, 20), mugMat); hdl.position.set(1.022, 0.062, -0.05); scene.add(hdl);
      // Anker Soundcore headphones on a stand — rotated the SHORT way (cups along depth), left of the Edge
      const hpG = new THREE.Group(); hpG.position.set(-0.68, 0, 0.38); hpG.rotation.y = Math.PI / 2; scene.add(hpG);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.28, 12), alu); pole.position.y = 0.14; hpG.add(pole);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 10, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.6 }));
      arc.position.y = 0.26; hpG.add(arc);
      const cupM = new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.5 });
      const cup1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), cupM); cup1.scale.z = 0.6; cup1.position.set(-0.07, 0.24, 0); hpG.add(cup1);
      const cup2 = cup1.clone(); cup2.position.x = 0.07; hpG.add(cup2);
      // Yamaha-class ultra-premium METAL studio monitors, equidistant from the laptop, toed in
      const mkSpeaker = (x, z, ry) => {
        const sp = new THREE.Group(); sp.position.set(x, 0, z); sp.rotation.y = ry; scene.add(sp);
        const cab = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.165, 0.1), new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.28, metalness: 0.88 }));
        cab.position.y = 0.0825; cab.castShadow = true; sp.add(cab);
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.155, 0.004), new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.5 }));
        face.position.set(0, 0.0825, 0.051); sp.add(face);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.012, 32), new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.55 }));
        cone.rotation.x = Math.PI / 2; cone.position.set(0, 0.052, 0.053); sp.add(cone);      // signature white woofer
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.004, 8, 32), new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.4 }));
        rim.position.set(0, 0.052, 0.054); sp.add(rim);
        const tw = new THREE.Mesh(new THREE.CircleGeometry(0.013, 24), new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.2, metalness: 0.6 }));
        tw.position.set(0, 0.122, 0.0535); sp.add(tw);
        const led = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 10), new THREE.MeshBasicMaterial({ color: 0x35d5ee }));
        led.position.set(0.032, 0.143, 0.0535); sp.add(led);
        return sp;
      };
      mkSpeaker(0.55, -0.35, -0.25); mkSpeaker(-0.55, -0.35, 0.25);
      // ── amigurumi hands (crochet yarn look, matches the video character)
      const kc = document.createElement('canvas'); kc.width = kc.height = 64;
      const kcx = kc.getContext('2d');
      kcx.fillStyle = '#888'; kcx.fillRect(0, 0, 64, 64);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { kcx.fillStyle = (x + y) % 2 ? '#666' : '#aaa'; kcx.beginPath(); kcx.ellipse(x * 8 + 4 + (y % 2) * 3, y * 8 + 4, 3.4, 2.4, 0.6, 0, 7); kcx.fill(); }
      const knitTex = new THREE.CanvasTexture(kc); knitTex.wrapS = knitTex.wrapT = THREE.RepeatWrapping; knitTex.repeat.set(3, 3);
      const yarn = new THREE.MeshStandardMaterial({ color: 0xdec9a3, roughness: 0.95, bumpMap: knitTex, bumpScale: 2.2 });
      const cuffM = new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.92, bumpMap: knitTex, bumpScale: 2.6 });
      const mkHand = (mirror, accessory) => {
        const h = new THREE.Group();
        const palm = new THREE.Mesh(new THREE.SphereGeometry(0.038, 20, 16), yarn); palm.scale.set(1, 0.5, 1.1); palm.castShadow = true; h.add(palm);
        for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.0115, 12, 10), yarn); f.scale.set(0.9, 0.8, 2.2); f.position.set(-0.0255 + i * 0.017, 0.003, -0.046); h.add(f); }
        const th = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 12, 10), yarn); th.scale.set(0.9, 0.8, 1.7);
        th.position.set(mirror ? 0.04 : -0.04, 0, -0.004); th.rotation.y = mirror ? -0.7 : 0.7; h.add(th);   // thumb on the INSIDE
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.05, 16), cuffM);
        cuff.rotation.x = Math.PI / 2 + 0.25; cuff.position.set(0, -0.012, 0.055); h.add(cuff);
        // black hoodie forearm running back toward the body
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.042, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.95, bumpMap: knitTex, bumpScale: 1.8 }));
        arm.rotation.x = Math.PI / 2 + 0.25; arm.position.set(0, -0.048, 0.2); arm.castShadow = true; h.add(arm);
        const wrist = (d) => ({ x: 0, y: -0.012 - 0.247 * d, z: 0.055 + 0.969 * d });   // point d along the arm axis
        if (accessory === 'bracelets') {                     // stacked bracelets from the video — right arm
          const cols = [0x0c0d10, 0xc7ccd4, 0x35d5ee];
          cols.forEach((c, i) => {
            const w = wrist(0.045 + i * 0.017);
            const br = new THREE.Mesh(new THREE.TorusGeometry(0.0345 + i * 0.0012, 0.0032, 8, 28), new THREE.MeshStandardMaterial({ color: c, roughness: i === 1 ? 0.25 : 0.55, metalness: i === 1 ? 0.9 : 0.2 }));
            br.rotation.x = 0.25; br.position.set(w.x, w.y, w.z); h.add(br);
          });
        }
        if (accessory === 'watch') {                         // Galaxy Watch 8 — left arm
          const w = wrist(0.055);
          const strap = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 8, 28), new THREE.MeshStandardMaterial({ color: 0x101116, roughness: 0.7 }));
          strap.rotation.x = 0.25; strap.position.set(w.x, w.y, w.z); h.add(strap);
          const bodyW = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.008, 24), new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.3, metalness: 0.8 }));
          bodyW.rotation.x = 0.25; bodyW.position.set(w.x, w.y + 0.038, w.z + 0.01); h.add(bodyW);
          const faceW = new THREE.Mesh(new THREE.CircleGeometry(0.015, 24), new THREE.MeshBasicMaterial({ color: 0x0a1a12 }));
          faceW.rotation.x = -Math.PI / 2 + 0.25; faceW.position.set(w.x, w.y + 0.0425, w.z + 0.011); h.add(faceW);
          const dotW = new THREE.Mesh(new THREE.CircleGeometry(0.004, 10), new THREE.MeshBasicMaterial({ color: 0x35ee8a }));
          dotW.rotation.x = -Math.PI / 2 + 0.25; dotW.position.set(w.x, w.y + 0.0428, w.z + 0.011); h.add(dotW);
        }
        return h;
      };
      const handR = mkHand(false, 'bracelets'), handL = mkHand(true, 'watch');
      const handRHome = new THREE.Vector3(0.22, -0.12, 0.75), handLHome = new THREE.Vector3(-0.3, -0.12, 0.75);
      const handLRest = new THREE.Vector3(-0.3, 0.02, 0.14);
      handR.position.copy(handRHome); handL.position.copy(handLHome);
      handL.rotation.set(0.12, 0.35, -0.08);                 // resting wrist tilt so it reads as a hand
      scene.add(handR, handL);
      // ── interaction + phases
      const hint = document.createElement('div');
      hint.textContent = 'CLICK THE LAPTOP';
      hint.style.cssText = "position:absolute;left:50%;bottom:9vh;transform:translateX(-50%);font:11px 'Martian Mono',monospace;letter-spacing:0.35em;color:#8a8a92;opacity:0;transition:opacity 1s;pointer-events:none;text-shadow:0 1px 6px #000;white-space:nowrap;";
      this.appendChild(hint);
      setTimeout(() => { hint.style.opacity = '1'; }, 1600);
      let phase = 'idle', pt = 0, mx = 0, my = 0, tt = 0, fired = false;
      this._mm = e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
      addEventListener('mousemove', this._mm);
      this._cl = () => { if (phase === 'idle') { phase = 'open'; pt = 0; hint.style.opacity = '0'; } };
      renderer.domElement.addEventListener('click', this._cl);
      const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const zoomEnd = new THREE.Vector3(0, 0.225, -0.03);
      const lidEdge = new THREE.Vector3(), tmp = new THREE.Vector3();
      const edgeAt = (ang) => lidEdge.set(0, 0.022 + 0.42 * Math.sin(ang), -0.23 + 0.42 * Math.cos(ang));
      const mouseGrip = new THREE.Vector3(0.46, 0.045, 0.275);
      let last = performance.now();
      const loop = (now) => {
        this._raf = requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.05); last = now; tt += dt;
        const min = Date.now() / 60000 | 0;
        if (min !== this._em) { this._em = min; drawEdge('calendar'); }   // keep the Xeneon Edge clock live
        if (phase === 'idle') {
          camera.position.set(camBase.x + mx * 0.03 + Math.sin(tt * 0.4) * 0.004, camBase.y - my * 0.02 + Math.sin(tt * 0.6) * 0.003, camBase.z);
          camera.lookAt(0, 0.1, -0.05);
          ring.material.color.setHSL(0.52, 0.9, 0.5 + 0.12 * Math.sin(tt * 2));
        } else if (phase === 'open') {                       // hands reach in, right hand lifts the lid
          pt += dt; const k = Math.min(pt / 1.7, 1);
          const reach = ease(Math.min(k / 0.22, 1));         // 0–22%: hands enter frame
          handL.position.lerpVectors(handLHome, handLRest, reach);
          const lidK = ease(Math.max(0, Math.min((k - 0.2) / 0.65, 1)));   // 20–85%: lid opens
          const ang = 1.85 * lidK;
          hinge.rotation.x = -ang;
          edgeAt(1.85 * Math.min(lidK, 0.5));                // hand only rides the edge to half-open
          tmp.set(lidEdge.x + 0.02, lidEdge.y - 0.028, lidEdge.z + 0.075);
          if (lidK <= 0.5) {
            handR.position.lerpVectors(handRHome, tmp, reach);
            if (reach >= 1) handR.position.copy(tmp);
            this._hrGrip = handR.position.clone();
            handR.rotation.z = -0.06;
          } else {                                           // release the lid, head for the mouse
            const m = ease(Math.min((lidK - 0.5) / 0.5, 1));
            handR.position.lerpVectors(this._hrGrip, mouseGrip, m);
            handR.rotation.z = -0.06 + 0.26 * m;
          }
          handR.rotation.x = 0.18 + 0.12 * lidK;             // slight palm-up tilt; cuff stays low, fingers point away
          if (lidK > 0.3) { drawScreen(true, tt); sLight.intensity = 4 * lidK; }
          camera.lookAt(0, 0.1 + 0.1 * lidK, -0.05);
          if (k >= 1) { phase = 'mouse'; pt = 0; this._hrFrom = handR.position.clone(); }
        } else if (phase === 'mouse') {                      // right hand settles onto the wireless mouse
          pt += dt; const k = Math.min(pt / 0.4, 1), e = ease(k);
          drawScreen(true, tt);
          handR.position.lerpVectors(this._hrFrom, mouseGrip, e);
          handR.rotation.x = 0.3 * (1 - e) + 0.1 * e;
          handR.rotation.z = -0.06 + 0.2 * e;
          camera.lookAt(0, 0.2, -0.05);
          if (k >= 1) { phase = 'hold'; pt = 0; }
        } else if (phase === 'hold') {                       // beat: hand on mouse, screen glowing
          pt += dt; drawScreen(true, tt);
          if (pt > 0.12) { phase = 'zoom'; pt = 0; }
        } else if (phase === 'zoom') {                       // dive into the screen
          pt += dt; const k = Math.min(pt / 0.55, 1), e = ease(k);
          drawScreen(true, tt);
          camera.position.lerpVectors(camBase, zoomEnd, e);
          camera.lookAt(0, 0.215, -0.29);
          if (k >= 1 && !fired) { fired = true; this.dispatchEvent(new CustomEvent('entrance-open', { bubbles: true })); }
        }
        renderer.render(scene, camera);
      };
      this._raf = requestAnimationFrame(loop);
    }
    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      this._ro && this._ro.disconnect();
      removeEventListener('mousemove', this._mm);
      this._renderer && this._renderer.dispose();
      this._init = false; this._desk = false;
    }
  }
  if (!customElements.get('shift9-entrance')) customElements.define('shift9-entrance', Shift9Entrance);
})();
