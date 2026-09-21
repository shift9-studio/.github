"use client";

import * as React from "react";
import * as THREE from "three";
import { useReducedMotionSafe } from "@shift9/motion";

/**
 * PinchOfSpice — a pinch dropped onto the table, seen from straight above.
 *
 * The hero photo is an overhead shot of a dinner table, so the camera already
 * looks straight down. This drops seasoning into that shot: each flake starts
 * near the lens (large, soft, out of focus), falls away from the viewer and
 * shrinks toward the table, its shadow closing in underneath it, then lands
 * on the food in the photo, skids a touch, rests and fades. Flakes never touch
 * the text: the canvas sits in the hero's background stack, behind the copy.
 *
 * Fires when the pointer enters one of the two ways in ([data-pinch-zone] a,
 * minus [data-no-pinch]) — the pinch lands on the table under the pointer —
 * and once onto the dishes after the headline has revealed.
 *
 * Engine: Three.js WebGLRenderer (WebGL2), perspective computed per flake
 * (camera straight down, focal distance D), two THREE.Points draws: shadows,
 * then flakes. Loop runs only while flakes exist. Reduced motion or no WebGL2:
 * nothing is drawn; the page is complete without it.
 */

const MAX = 360;
const PR = 1.25; // held pixel ratio (his Iris Xe laptop)
const D = 1000; // camera height above the table, in table pixels
const H0 = 870; // where the fingers let go: close to the lens, so the first frames are big and soft
const G = 2600; // fall acceleration, table px/s²

const PALETTE: [string, number][] = [
  ["#a4401f", 0.32], // paprika
  ["#7c2a14", 0.2], // smoked paprika
  ["#c2562d", 0.12], // chili
  ["#2f2622", 0.2], // cracked pepper
  ["#e7dfd0", 0.16], // flaky salt
];

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aRot;
  attribute float aSeed;
  attribute float aAlpha;
  attribute float aSoft;
  attribute vec3 aColor;
  uniform float uPR;
  varying float vRot;
  varying float vSeed;
  varying float vAlpha;
  varying float vSoft;
  varying vec3 vColor;
  void main() {
    vRot = aRot; vSeed = aSeed; vAlpha = aAlpha; vSoft = aSoft; vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPR;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform float uShadow;
  varying float vRot;
  varying float vSeed;
  varying float vAlpha;
  varying float vSoft;
  varying vec3 vColor;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float c = cos(vRot), s = sin(vRot);
    p = mat2(c, -s, s, c) * p;
    p.x *= 1.0 + 0.8 * hash(vSeed * 7.1);
    float a = atan(p.y, p.x);
    float r = length(p);
    float edge = 0.28
      + 0.07 * sin(a * 3.0 + vSeed * 11.0)
      + 0.05 * sin(a * 5.0 + vSeed * 23.0)
      + 0.03 * sin(a * 9.0 + vSeed * 41.0);
    // Near the lens a flake is out of focus: a wider, fainter edge.
    float soft = 0.02 + vSoft * 0.22;
    float cover = smoothstep(edge + soft, edge - soft, r);
    if (cover <= 0.001) discard;
    if (uShadow > 0.5) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, cover * vAlpha);
      return;
    }
    float tilt = dot(normalize(p + 1e-4), vec2(0.6, -0.8)) * (r / edge);
    float grain = hash(floor(gl_PointCoord.x * 8.0) + floor(gl_PointCoord.y * 8.0) * 17.0 + vSeed);
    vec3 col = vColor * (0.84 + 0.18 * tilt + 0.08 * (grain - 0.5));
    gl_FragColor = vec4(col, cover * vAlpha);
  }
`;

type Buffers = {
  pos: Float32Array;
  size: Float32Array;
  rot: Float32Array;
  seed: Float32Array;
  alpha: Float32Array;
  soft: Float32Array;
  color: Float32Array;
  geo: THREE.BufferGeometry;
};

function makeBuffers(): Buffers {
  const b = {
    pos: new Float32Array(MAX * 3),
    size: new Float32Array(MAX),
    rot: new Float32Array(MAX),
    seed: new Float32Array(MAX),
    alpha: new Float32Array(MAX),
    soft: new Float32Array(MAX),
    color: new Float32Array(MAX * 3),
    geo: new THREE.BufferGeometry(),
  };
  const add = (name: string, a: Float32Array, n: number) => {
    const at = new THREE.BufferAttribute(a, n);
    at.setUsage(THREE.DynamicDrawUsage);
    b.geo.setAttribute(name, at);
  };
  add("position", b.pos, 3);
  add("aSize", b.size, 1);
  add("aRot", b.rot, 1);
  add("aSeed", b.seed, 1);
  add("aAlpha", b.alpha, 1);
  add("aSoft", b.soft, 1);
  add("aColor", b.color, 3);
  return b;
}

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
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);
    let W = 1;
    let Hh = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width);
      Hh = Math.max(1, r.height);
      renderer.setSize(W, Hh, false);
      camera.right = W;
      camera.bottom = Hh;
      camera.updateProjectionMatrix();
    };
    resize();

    // Table-space state: x, y on the table (canvas px), h above it.
    const tx = new Float32Array(MAX);
    const ty = new Float32Array(MAX);
    const th = new Float32Array(MAX);
    const vx = new Float32Array(MAX);
    const vy = new Float32Array(MAX);
    const vh = new Float32Array(MAX);
    const vr = new Float32Array(MAX);
    const base = new Float32Array(MAX);
    // Where the camera looks straight down from: right above the pinch.
    const ax = new Float32Array(MAX);
    const ay = new Float32Array(MAX);
    const rest = new Float32Array(MAX);
    const alive = new Uint8Array(MAX);

    const flakes = makeBuffers();
    const shadows = makeBuffers();
    const mk = (b: Buffers, shadow: boolean) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: { uPR: { value: PR }, uShadow: { value: shadow ? 1 : 0 } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const p = new THREE.Points(b.geo, m);
      p.frustumCulled = false;
      p.renderOrder = shadow ? 0 : 1;
      scene.add(p);
      return m;
    };
    const shadowMat = mk(shadows, true);
    const flakeMat = mk(flakes, false);

    const cols = PALETTE.map(([hex, w]) => [new THREE.Color(hex), w] as const);
    const pickColor = (i: number) => {
      let r = Math.random();
      let c = cols[0]![0];
      for (const [cc, w] of cols) {
        if ((r -= w) <= 0) {
          c = cc;
          break;
        }
      }
      flakes.color.set([c.r, c.g, c.b], i * 3);
    };

    let raf = 0;
    let last = 0;
    // A pinch: fingers above (x, y) on the table, grains leaving in a cone.
    const drop = (x: number, y: number, count: number) => {
      let made = 0;
      for (let i = 0; i < MAX && made < count; i++) {
        if (alive[i]) continue;
        alive[i] = 1;
        made++;
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.sqrt(Math.random()) * 7;
        ax[i] = x;
        ay[i] = y;
        tx[i] = x + Math.cos(ang) * rad;
        ty[i] = y + Math.sin(ang) * rad;
        th[i] = H0 - Math.random() * 80;
        const spread = 14 + Math.random() * 42; // a pinch, not a shake: a tight cone
        vx[i] = Math.cos(ang) * spread;
        vy[i] = Math.sin(ang) * spread;
        vh[i] = -(60 + Math.random() * 120);
        vr[i] = (Math.random() - 0.5) * 16;
        const salt = Math.random() < 0.16;
        base[i] = salt ? 2.2 + Math.random() * 1.6 : 2.4 + Math.random() * 3.2;
        rest[i] = 0;
        flakes.rot[i] = Math.random() * Math.PI * 2;
        const sd = Math.random() * 100;
        flakes.seed[i] = sd;
        shadows.seed[i] = sd;
        pickColor(i);
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const loop = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000);
      last = t;
      let any = 0;
      for (let i = 0; i < MAX; i++) {
        const i3 = i * 3;
        if (!alive[i]) {
          flakes.alpha[i] = 0;
          shadows.alpha[i] = 0;
          continue;
        }
        any = 1;
        if (th[i]! > 0) {
          vh[i] = vh[i]! - G * dt;
          th[i] = Math.max(0, th[i]! + vh[i]! * dt);
          tx[i] = tx[i]! + vx[i]! * dt;
          ty[i] = ty[i]! + vy[i]! * dt;
          flakes.rot[i] = flakes.rot[i]! + vr[i]! * dt;
          if (th[i] === 0) {
            // Landed: a short skid across the table, then still.
            vx[i] = vx[i]! * 0.35 + (Math.random() - 0.5) * 40;
            vy[i] = vy[i]! * 0.35 + (Math.random() - 0.5) * 40;
            rest[i] = 2.2 + Math.random() * 1.2;
          }
        } else {
          tx[i] = tx[i]! + vx[i]! * dt;
          ty[i] = ty[i]! + vy[i]! * dt;
          vx[i] = vx[i]! * (1 - Math.min(1, 14 * dt));
          vy[i] = vy[i]! * (1 - Math.min(1, 14 * dt));
          rest[i] = rest[i]! - dt;
          if (rest[i]! <= 0) alive[i] = 0;
        }
        // Straight-down camera above the pinch: things nearer the lens are
        // bigger and spread out around the point the camera looks down on.
        const s = D / (D - th[i]!);
        const h01 = th[i]! / H0;
        flakes.pos[i3] = ax[i]! + (tx[i]! - ax[i]!) * s;
        flakes.pos[i3 + 1] = ay[i]! + (ty[i]! - ay[i]!) * s;
        flakes.size[i] = base[i]! * s;
        flakes.soft[i] = Math.min(1, h01 * 1.4);
        const fadeOut = th[i] === 0 ? Math.min(1, Math.max(0, rest[i]!) / 0.6) : 1;
        flakes.alpha[i] = (0.55 + 0.45 * (1 - h01)) * fadeOut;
        // Shadow on the table: offset by the light, sharper and darker as the
        // flake comes down onto it.
        shadows.pos[i3] = tx[i]! + th[i]! * 0.06 + 1.2;
        shadows.pos[i3 + 1] = ty[i]! + th[i]! * 0.09 + 1.6;
        shadows.size[i] = base[i]! * (1.15 + h01 * 1.2);
        shadows.soft[i] = Math.min(1, 0.4 + h01);
        shadows.rot[i] = flakes.rot[i]!;
        shadows.alpha[i] = (0.1 + 0.3 * (1 - h01)) * fadeOut;
      }
      for (const b of [flakes, shadows]) {
        for (const k of ["position", "aSize", "aRot", "aAlpha", "aSoft", "aSeed", "aColor"]) {
          (b.geo.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true;
        }
      }
      renderer.render(scene, camera);
      raf = any ? requestAnimationFrame(loop) : 0;
    };

    const local = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      return [clientX - r.left, clientY - r.top] as const;
    };

    // The pointer entering a way in drops a pinch onto the table under it.
    const lastFire = new WeakMap<Element, number>();
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const a = (e.target as Element | null)?.closest?.("[data-pinch-zone] a:not([data-no-pinch])");
      if (!a) return;
      const from = e.relatedTarget as Node | null;
      if (from && a.contains(from)) return;
      const now = performance.now();
      if (now - (lastFire.get(a) ?? -1e9) < 1100) return;
      lastFire.set(a, now);
      const [x, y] = local(e.clientX, e.clientY);
      drop(x, y, 46);
    };
    document.addEventListener("pointerover", onOver, { passive: true });

    // Once onto the dishes, after the headline has revealed.
    const intro = window.setTimeout(() => {
      // Only where the photo is actually visible beside the copy. On narrow
      // screens the text covers the photo, so a pinch would land behind words.
      if (window.innerWidth < 1024) return;
      const r = canvas.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      drop(W * 0.6, Hh * 0.5, 60);
    }, 1900);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      window.clearTimeout(intro);
      document.removeEventListener("pointerover", onOver);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      flakes.geo.dispose();
      shadows.geo.dispose();
      flakeMat.dispose();
      shadowMat.dispose();
      renderer.dispose();
    };
  }, [reduced]);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
