"use client";

import * as React from "react";
import * as THREE from "three";
import { useReducedMotionSafe } from "@shift9/motion";

/**
 * PinchOfSpice — a real pinch of seasoning, drawn on the GPU.
 *
 * Replaces the old cursor trail (SpiceMote) on the Feelspoon site, which read
 * as glowing glitter following the mouse everywhere. This one:
 *  - fires only on intent: when the pointer enters one of the two ways in
 *    (anything inside [data-pinch-zone] that is a link, unless [data-no-pinch]),
 *    and once over the headline after it has revealed;
 *  - looks like spice, not light: irregular matte flakes in paprika, chili,
 *    cracked pepper and flaky salt, tumbling as they fall, normal blending;
 *  - lands: flakes stop on the tops of the headline letters and the entrance
 *    buttons, rest a moment, then fade. Misses fall on and fade out.
 *
 * Engine: Three.js WebGLRenderer (WebGL2), one fixed transparent canvas, one
 * THREE.Points draw call with a custom flake shader. The loop only runs while
 * flakes exist. Reduced motion: nothing is drawn. No WebGL2: nothing is drawn;
 * the effect is decoration and the page is complete without it.
 */

const MAX = 480;
const PR = 1.25; // held pixel ratio (his Iris Xe laptop)

// Matte spice, weighted: paprika most, then pepper, chili, salt.
const PALETTE: [string, number][] = [
  ["#9b3a1f", 0.3],
  ["#7a2915", 0.18],
  ["#b8502c", 0.12],
  ["#2e2521", 0.16],
  ["#463830", 0.1],
  ["#e9e2d4", 0.14],
];

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aRot;
  attribute float aSeed;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uScroll;
  uniform float uPR;
  varying float vRot;
  varying float vSeed;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vRot = aRot; vSeed = aSeed; vAlpha = aAlpha; vColor = aColor;
    vec3 p = position;
    p.y -= uScroll;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uPR;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying float vRot;
  varying float vSeed;
  varying float vAlpha;
  varying vec3 vColor;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float c = cos(vRot), s = sin(vRot);
    p = mat2(c, -s, s, c) * p;
    // flakes are longer than wide; salt stays chunkier
    p.x *= 1.0 + 0.9 * hash(vSeed * 7.1);
    float a = atan(p.y, p.x);
    float r = length(p);
    // irregular, faceted outline: a few random lobes per flake
    float edge = 0.30
      + 0.07 * sin(a * 3.0 + vSeed * 11.0)
      + 0.05 * sin(a * 5.0 + vSeed * 23.0)
      + 0.03 * sin(a * 9.0 + vSeed * 41.0);
    if (r > edge) discard;
    // matte: a soft one-sided tilt so it reads as a flat flake catching room
    // light, plus fine grain. No glow, no additive blending.
    float tilt = dot(normalize(p + 1e-4), vec2(0.6, -0.8)) * (r / edge);
    float grain = hash(floor(gl_PointCoord.x * 9.0) + floor(gl_PointCoord.y * 9.0) * 17.0 + vSeed);
    vec3 col = vColor * (0.86 + 0.16 * tilt + 0.08 * (grain - 0.5));
    float aa = smoothstep(edge, edge - 0.04, r);
    gl_FragColor = vec4(col, vAlpha * aa);
  }
`;

type Surface = { x0: number; x1: number; y: number };

export function PinchOfSpice() {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionSafe();

  React.useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true });
    renderer.setPixelRatio(PR);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    // Screen-pixel camera, y pointing down like the page.
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.right = w;
      camera.bottom = h;
      camera.updateProjectionMatrix();
    };
    resize();

    // Flake state lives in typed arrays; the GPU gets the same buffers.
    const pos = new Float32Array(MAX * 3);
    const size = new Float32Array(MAX);
    const rot = new Float32Array(MAX);
    const seed = new Float32Array(MAX);
    const alpha = new Float32Array(MAX);
    const color = new Float32Array(MAX * 3);
    const vx = new Float32Array(MAX);
    const vy = new Float32Array(MAX);
    const vr = new Float32Array(MAX);
    const age = new Float32Array(MAX);
    const rest = new Float32Array(MAX); // >0 once landed: time left resting
    const alive = new Uint8Array(MAX);

    const geo = new THREE.BufferGeometry();
    const attr = (a: Float32Array, n: number) => {
      const b = new THREE.BufferAttribute(a, n);
      b.setUsage(THREE.DynamicDrawUsage);
      return b;
    };
    geo.setAttribute("position", attr(pos, 3));
    geo.setAttribute("aSize", attr(size, 1));
    geo.setAttribute("aRot", attr(rot, 1));
    geo.setAttribute("aSeed", attr(seed, 1));
    geo.setAttribute("aAlpha", attr(alpha, 1));
    geo.setAttribute("aColor", attr(color, 3));
    geo.setDrawRange(0, MAX);

    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: { uScroll: { value: 0 }, uPR: { value: PR } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    const cols = PALETTE.map(([hex, w]) => [new THREE.Color(hex), w] as const);
    const pickColor = (i: number) => {
      let r = Math.random();
      for (const [c, w] of cols) {
        if ((r -= w) <= 0) {
          color.set([c.r, c.g, c.b], i * 3);
          return;
        }
      }
      const c = cols[0]![0];
      color.set([c.r, c.g, c.b], i * 3);
    };

    // Where flakes can land, in page coordinates: the top of each headline
    // letter (its cap line, not its line box) and the top of each entrance.
    let surfaces: Surface[] = [];
    const measure = () => {
      const out: Surface[] = [];
      const sy = window.scrollY;
      const sx = window.scrollX;
      const h1 = document.querySelector("main h1");
      if (h1) {
        // The glyph box a Range reports starts at the font's ascent line; the
        // tops of the capitals sit lower. Measure that gap from the real font
        // instead of guessing it.
        const ctx2d = document.createElement("canvas").getContext("2d");
        const cs = getComputedStyle(h1);
        let capGap = 0;
        if (ctx2d) {
          ctx2d.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const m = ctx2d.measureText("H");
          capGap = Math.max(0, m.fontBoundingBoxAscent - m.actualBoundingBoxAscent);
        }
        const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const text = n.textContent ?? "";
          for (let i = 0; i < text.length; i++) {
            if (!/\S/.test(text[i]!)) continue;
            range.setStart(n, i);
            range.setEnd(n, i + 1);
            const r = range.getBoundingClientRect();
            if (r.width < 2) continue;
            // Glyph box height can exceed the font's own ascent+descent (line
            // height); the ascent line sits at the top of the content area.
            // The final 5% of the font size is measured, not guessed: in the
            // browser the painted cap tops sat that much below the metric line.
            const half = Math.max(0, (r.height - (ctx2d ? ctx2d.measureText("H").fontBoundingBoxAscent + ctx2d.measureText("H").fontBoundingBoxDescent : r.height)) / 2);
            out.push({ x0: r.left + sx + r.width * 0.12, x1: r.right + sx - r.width * 0.12, y: r.top + sy + half + capGap + parseFloat(cs.fontSize) * 0.05 });
          }
        }
      }
      document.querySelectorAll("[data-pinch-zone] a:not([data-no-pinch])").forEach((a) => {
        const r = a.getBoundingClientRect();
        const img = a.querySelector("img");
        // The Play badge artwork has transparent padding; land on the badge.
        const box = img ? img.getBoundingClientRect() : r;
        // Measured on screen: the visible badge starts 17% down and 6.6% in
        // from the edges of Google's artwork.
        const iy = img ? box.height * 0.17 : 0;
        const ix = img ? box.width * 0.066 : 0;
        out.push({ x0: box.left + sx + ix, x1: box.right + sx - ix, y: box.top + sy + iy });
      });
      surfaces = out;
    };

    let raf = 0;
    let last = 0;
    const spawn = (x: number, y: number, spreadX: number, count: number) => {
      measure();
      let made = 0;
      for (let i = 0; i < MAX && made < count; i++) {
        if (alive[i]) continue;
        alive[i] = 1;
        made++;
        pos[i * 3] = x + (Math.random() - 0.5) * spreadX;
        pos[i * 3 + 1] = y - Math.random() * 40;
        pos[i * 3 + 2] = 0;
        const salt = Math.random() < 0.14;
        size[i] = salt ? 3 + Math.random() * 2.5 : 3.5 + Math.random() * 4.5;
        rot[i] = Math.random() * Math.PI * 2;
        seed[i] = Math.random() * 100;
        alpha[i] = 0;
        vx[i] = (Math.random() - 0.5) * 60;
        vy[i] = 40 + Math.random() * 80;
        vr[i] = (Math.random() - 0.5) * 14;
        age[i] = 0;
        rest[i] = 0;
        pickColor(i);
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const G = 1500; // px/s², a heavy pinch, not dust
    const loop = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000);
      last = t;
      const bottom = window.scrollY + window.innerHeight + 40;
      let any = 0;
      for (let i = 0; i < MAX; i++) {
        if (!alive[i]) continue;
        any = 1;
        age[i] = age[i]! + (dt);
        const ix = i * 3;
        if (rest[i]! > 0) {
          rest[i] = rest[i]! - (dt);
          alpha[i] = Math.min(1, rest[i]! / 0.45);
          if (rest[i]! <= 0) alive[i] = 0;
          continue;
        }
        const py = pos[ix + 1]!;
        vy[i] = vy[i]! + (G * dt);
        vx[i] = vx[i]! * (1 - 1.8 * dt); // air
        vx[i] = vx[i]! + ((Math.random() - 0.5) * 120 * dt); // tiny flutter
        pos[ix] = pos[ix]! + (vx[i]! * dt);
        pos[ix + 1] = pos[ix + 1]! + (vy[i]! * dt);
        rot[i] = rot[i]! + (vr[i]! * dt);
        alpha[i] = Math.min(1, age[i]! / 0.08);
        const nx = pos[ix]!;
        const ny = pos[ix + 1]!;
        for (const s of surfaces) {
          if (py <= s.y && ny >= s.y && nx >= s.x0 && nx <= s.x1) {
            // Most land; a few skip off the edge like real seasoning.
            if (Math.random() < 0.82) {
              pos[ix + 1] = s.y - size[i]! * 0.1;
              rest[i] = 0.9 + Math.random() * 0.9;
              vr[i] = 0;
            } else {
              vy[i] = vy[i]! * (-0.18);
              vx[i] = vx[i]! + ((Math.random() - 0.5) * 140);
              pos[ix + 1] = s.y - 1;
            }
            break;
          }
        }
        if (ny > bottom || age[i]! > 3) alive[i] = 0;
        if (!alive[i]) alpha[i] = 0;
      }
      if (!any) {
        for (let i = 0; i < MAX; i++) alpha[i] = 0;
      }
      for (const k of ["position", "aRot", "aAlpha", "aSize", "aSeed", "aColor"]) {
        (geo.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true;
      }
      mat.uniforms.uScroll!.value = window.scrollY;
      renderer.render(scene, camera);
      raf = any ? requestAnimationFrame(loop) : 0;
    };

    // Triggers. Pointer entering a way in: a pinch from just above it, around
    // where the pointer came in. Throttled per link so hovering back and forth
    // does not turn into a snowstorm.
    const lastFire = new WeakMap<Element, number>();
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const a = (e.target as Element | null)?.closest?.("[data-pinch-zone] a:not([data-no-pinch])");
      if (!a) return;
      const from = e.relatedTarget as Node | null;
      if (from && a.contains(from)) return;
      const now = performance.now();
      if (now - (lastFire.get(a) ?? -1e9) < 900) return;
      lastFire.set(a, now);
      const r = a.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX, r.left + 12), r.right - 12) + window.scrollX;
      spawn(x, r.top + window.scrollY - 70, 46, 34);
    };
    document.addEventListener("pointerover", onOver, { passive: true });

    // Once over the headline, after its reveal has settled.
    const intro = window.setTimeout(() => {
      const h1 = document.querySelector("main h1");
      if (!h1) return;
      const r = h1.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const w = Math.min(r.width, 560);
      spawn(r.left + window.scrollX + w * 0.55, r.top + window.scrollY - 90, w, 80);
    }, 1900);

    const onResize = () => {
      resize();
      measure();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(intro);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
    />
  );
}
