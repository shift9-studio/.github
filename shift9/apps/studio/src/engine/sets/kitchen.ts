/* Set 12 — Just a Pinch ("kitchen", z 20). Composition ported from
   reference/shift9-scene.js buildKitchen (island/back-wall/tablet envelope,
   softbox key, dust, steam, recipe-card idle beat are the contract), fidelity
   raised to the user's Set-12 reference image (2026-07-21): monolithic white
   island on a plinth shadow line, inset sink + chrome gooseneck tap, cabinet
   wall with hairline door seams, proud side towers, a genuinely recessed and
   warmly lit prop niche, dark-bezel tablet running the live Pinch interface,
   and SHIFT-9 painted on the stage floor. Recorded deviations from the
   reference builder, all in service of matching the user's image: key panel
   lowered 8 → 6.7 so it sits in frame at the viewing mark, key cone tightened
   so the floor pool hugs the island, light cone faded to a haze, island
   painted white instead of grey. */
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  TorusGeometry,
} from 'three';
import type { SetBuilder } from './index';

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
  // ── key light — softbox panel low enough to sit in frame at the mark ──
  const key = engine.softbox(g, 0, 6.0, 0, 3.6, 2.1, 85);
  key.angle = 0.58; // tighten the pool so it hugs the island like the photo
  key.penumbra = 0.85;
  engine.lightCone(g, 0xffffff, 0, 5.9, 0, 3.0, 0.018); // haze, not a beam
  // soft frontal bounce — the photo's faces are white, not silhouetted
  const bounce = new PointLight(0xf4f6f8, 42, 16, 2);
  bounce.position.set(0, 1.7, 6.5);
  g.add(bounce);
  // wash for the cabinet wall — the photo's back unit is white, not shadowed
  const cabinetWash = new PointLight(0xf6f7f9, 14, 9, 2);
  cabinetWash.position.set(0, 4.2, -0.2);
  g.add(cabinetWash);

  const satin = new MeshStandardMaterial({ color: 0xe9ebee, roughness: 0.42, metalness: 0.03 });
  const bright = new MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.34, metalness: 0.02 });
  const cabinet = new MeshStandardMaterial({ color: 0xe2e4e7, roughness: 0.55 });
  const seamDark = new MeshStandardMaterial({ color: 0x8d9096, roughness: 0.6 });
  const chrome = new MeshStandardMaterial({ color: 0xd9dcdf, roughness: 0.16, metalness: 1.0 });

  // ── the island — reference envelope 6 × 1.15 × 1.6, top slab 6.2 × 0.07 ──
  const island = new Mesh(new BoxGeometry(6, 1.15, 1.6), satin);
  island.position.y = 0.575;
  g.add(island);
  const top = new Mesh(new BoxGeometry(6.2, 0.07, 1.75), bright);
  top.position.y = 1.185;
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
  const islandShadow = contactShadow(7.4, 2.9, 0.85);
  islandShadow.position.y = 0.012;
  g.add(islandShadow);

  // ── sink + gooseneck tap, right of centre on the worktop ──
  const sinkRim = new Mesh(new BoxGeometry(0.92, 0.012, 0.5), chrome);
  sinkRim.position.set(1.7, 1.225, -0.05);
  g.add(sinkRim);
  const sinkBasin = new Mesh(
    new BoxGeometry(0.78, 0.02, 0.36),
    new MeshStandardMaterial({ color: 0x9ba0a5, roughness: 0.45, metalness: 0.3 }),
  );
  sinkBasin.position.set(1.7, 1.226, -0.05);
  g.add(sinkBasin);
  const tap = new Group();
  const tapBase = new Mesh(new CylinderGeometry(0.035, 0.045, 0.05, 20), chrome);
  tapBase.position.y = 0.025;
  tap.add(tapBase);
  const tapStem = new Mesh(new CylinderGeometry(0.021, 0.021, 0.42, 16), chrome);
  tapStem.position.y = 0.23;
  tap.add(tapStem);
  const tapNeck = new Mesh(new TorusGeometry(0.12, 0.019, 12, 24, Math.PI), chrome);
  tapNeck.position.set(-0.12, 0.44, 0);
  tap.add(tapNeck);
  const tapSpout = new Mesh(new CylinderGeometry(0.017, 0.017, 0.09, 12), chrome);
  tapSpout.position.set(-0.24, 0.4, 0);
  tap.add(tapSpout);
  tap.position.set(2.18, 1.22, -0.42);
  g.add(tap);

  // ── back unit — reference envelope 4.6 wide × 2.4 high around (0, 2.6) ──
  // side towers, slightly proud of the cabinet plane, as in the photo
  for (const tx of [-1.9, 1.9]) {
    const tower = new Mesh(new BoxGeometry(0.8, 2.44, 0.56), bright);
    tower.position.set(tx, 2.6, -2.19);
    g.add(tower);
  }
  // upper cabinet block — three door fronts split by hairline seams
  const cabinets = new Mesh(new BoxGeometry(3.0, 1.0, 0.5), cabinet);
  cabinets.position.set(0, 3.3, -2.2);
  g.add(cabinets);
  for (const sx of [-0.5, 0.5]) {
    const ds = new Mesh(new BoxGeometry(0.01, 0.96, 0.03), seamDark);
    ds.position.set(sx, 3.3, -1.943);
    g.add(ds);
  }
  // the niche — a real recess: lit back panel, shelf, warm light, shadows
  const nicheBack = new Mesh(
    new BoxGeometry(3.0, 1.34, 0.05),
    new MeshStandardMaterial({ color: 0xd4d6da, roughness: 0.6 }),
  );
  nicheBack.position.set(0, 2.13, -2.44);
  g.add(nicheBack);
  const nicheShelf = new Mesh(new BoxGeometry(3.0, 0.06, 0.56), bright);
  nicheShelf.position.set(0, 1.5, -2.19);
  g.add(nicheShelf);
  const nicheBase = new Mesh(new BoxGeometry(3.0, 0.4, 0.5), cabinet);
  nicheBase.position.set(0, 1.27, -2.2);
  g.add(nicheBase);
  const nicheAO = aoStrip(2.96, 0.7, 0.7);
  nicheAO.position.set(0, 2.45, -2.41);
  g.add(nicheAO);
  const nicheLight = new PointLight(0xfff3e2, 1.8, 3.0, 2);
  nicheLight.position.set(0, 2.35, -1.9);
  g.add(nicheLight);
  // props on the shelf — two bottles and a low jar, left of centre
  const bottleA = new Mesh(
    new CylinderGeometry(0.05, 0.05, 0.3, 18),
    new MeshStandardMaterial({ color: 0xd9d3c5, roughness: 0.5 }),
  );
  bottleA.position.set(-0.38, 1.68, -2.14);
  g.add(bottleA);
  const bottleB = new Mesh(
    new CylinderGeometry(0.04, 0.04, 0.21, 18),
    new MeshStandardMaterial({ color: 0xccd3cf, roughness: 0.45 }),
  );
  bottleB.position.set(-0.54, 1.635, -2.2);
  g.add(bottleB);
  const jar = new Mesh(
    new CylinderGeometry(0.065, 0.065, 0.09, 18),
    new MeshStandardMaterial({ color: 0xe7e2d8, roughness: 0.55 }),
  );
  jar.position.set(-0.18, 1.575, -2.17);
  g.add(jar);
  const backShadow = contactShadow(5.2, 1.6, 0.8);
  backShadow.position.set(0, 0.012, -2.2);
  g.add(backShadow);

  // ── the tablet — reference position/tilt, dark bezel + live Pinch screen ──
  const tc = document.createElement('canvas');
  tc.width = 416;
  tc.height = 296;
  const tcx = tc.getContext('2d')!;
  drawPinchScreen(tcx, 416, 296, 0);
  const ttex = new CanvasTexture(tc);
  const tablet = new Group();
  const bezel = new Mesh(
    new BoxGeometry(0.85, 0.6, 0.04),
    new MeshStandardMaterial({ color: 0x191b1e, roughness: 0.4, metalness: 0.3 }),
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
