/* Custom shader ports (reference GLSL → TSL) so every effect compiles on both the
   WebGPU (WGSL) and WebGL2 (GLSL) backends of WebGPURenderer. Math is 1:1 with
   reference/shift9-scene.js — DUST_FRAG, light cones, projector beam, fluid orb,
   and the Lumen projective texture mapping. */
import * as THREE from 'three/webgpu';
import {
  Fn, uniform, uv, float, vec2, vec3, vec4, floor, fract, sin, dot, length,
  smoothstep, min, max, mix, pow, abs, step, clamp, positionLocal, normalLocal,
  positionWorld, normalWorld, normalize, texture, varying, Loop
} from 'three/tsl';

const hash2 = /*@__PURE__*/ Fn(([p]: [ReturnType<typeof vec2>]) =>
  fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453123))
);

/* Asset Manifest #4 evolution — sparse camera-distance-faded point motes. */
export function makeDustMaterial(color: THREE.Color) {
  const uTime = uniform(0);
  const uColor = uniform(color);
  const uFade = uniform(1);

  const mote = Fn(([uvIn, grid, t, thresh]: any[]) => {
    const cell = floor(uvIn.mul(grid));
    const n = hash2(cell.add(vec2(t.mul(0.37), t.mul(0.61))));
    const f = fract(uvIn.mul(grid));
    const c = vec2(hash2(cell.add(7.1)), hash2(cell.add(3.3)));
    const fall = smoothstep(0.35, 0.0, length(f.sub(c))); // point falloff inside the cell
    return fall.mul(step(thresh, n));
  });

  const mat = new THREE.MeshBasicNodeMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
  });
  const alpha = Fn(() => {
    const vUv = uv();
    const t = floor(uTime.mul(6.0));
    const dust = mote(vUv, vec2(60.0, 40.0), t, float(0.985)).mul(0.9)
      .add(mote(vUv.add(13.7), vec2(110.0, 75.0), t.mul(1.7), float(0.992)).mul(0.7));
    const edge = smoothstep(0.0, 0.3, vUv.x).mul(smoothstep(1.0, 0.7, vUv.x))
      .mul(smoothstep(0.0, 0.2, vUv.y)).mul(smoothstep(1.0, 0.8, vUv.y));
    return min(dust, float(1.0)).mul(0.35).mul(edge).mul(uFade);
  });
  mat.colorNode = uColor;
  mat.opacityNode = alpha();
  return { mat, uTime, uFade };
}

/* Volumetric light cone: alpha = pow(vUv.y, 2.0) * uOp */
export function makeConeMaterial(color: THREE.Color, opacity: number) {
  const uColor = uniform(color);
  const uOp = uniform(opacity);
  const mat = new THREE.MeshBasicNodeMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
  });
  mat.colorNode = uColor;
  mat.opacityNode = pow(uv().y, 2.0).mul(uOp);
  return mat;
}

/* Projector beam: alpha = (1 - vUv.y) * 0.06 */
export function makeBeamMaterial() {
  const mat = new THREE.MeshBasicNodeMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
  });
  mat.colorNode = vec3(1.0);
  mat.opacityNode = float(1.0).sub(uv().y).mul(0.06).max(0.0);
  return mat;
}

/* 11 Flow State — churning fluid orb (value-noise displacement + fresnel mix). */
export function makeFluidMaterial() {
  const uTime = uniform(0);

  const hash3 = Fn(([p]: any[]) =>
    fract(sin(dot(p, vec3(12.9, 78.2, 37.7))).mul(43758.5))
  );
  const noise3 = Fn(([p]: any[]) => {
    const i = floor(p);
    const f0 = fract(p);
    const f = f0.mul(f0).mul(float(3.0).sub(f0.mul(2.0)));
    return mix(
      mix(
        mix(hash3(i), hash3(i.add(vec3(1, 0, 0))), f.x),
        mix(hash3(i.add(vec3(0, 1, 0))), hash3(i.add(vec3(1, 1, 0))), f.x), f.y),
      mix(
        mix(hash3(i.add(vec3(0, 0, 1))), hash3(i.add(vec3(1, 0, 1))), f.x),
        mix(hash3(i.add(vec3(0, 1, 1))), hash3(i.add(vec3(1, 1, 1))), f.x), f.y),
      f.z);
  });

  const d = noise3(positionLocal.mul(1.6).add(uTime.mul(0.4))).mul(0.5)
    .add(noise3(positionLocal.mul(3.2).sub(uTime.mul(0.3))).mul(0.25));
  const vD = varying(d);

  const mat = new THREE.MeshBasicNodeMaterial();   // fogged: must not bleed through neighboring sets
  mat.positionNode = positionLocal.add(normalLocal.mul(d).mul(0.7));
  // pre-compensate for the ACES output transform so the fluid reads deep
  // obsidian blue with luminous churn crests (visible through the glass tank)
  const deep = vec3(0.005, 0.01, 0.03).mul(0.3);
  const lit = vec3(0.05, 0.2, 0.75).mul(0.55);
  const fres = pow(max(float(1.0).sub(abs(normalLocal.z)), 0.0), 2.5);
  mat.colorNode = mix(deep, lit, clamp(vD.mul(vD).mul(1.4).add(fres.mul(0.5)), 0.0, 1.0));
  return { mat, uTime };
}

/* 09 Lumen — raw projective texture mapping (no cheap decals): world-space
   projection matrix UV + facing occlusion + sine distortion, live canvas map. */
export function makeProjectionMaterial(tex: THREE.CanvasTexture, projMat: THREE.Matrix4, projPos: THREE.Vector3) {
  const uProj = uniform(projMat);
  const uProjPos = uniform(projPos);
  const uTime = uniform(0);

  const mat = new THREE.MeshBasicNodeMaterial({ fog: false });
  mat.colorNode = Fn(() => {
    const p = uProj.mul(vec4(positionWorld, 1.0));            // projective texture mapping
    const uvP = p.xy.div(p.w).mul(0.5).add(0.5).toVar();
    const toP = normalize(uProjPos.sub(positionWorld));
    const facing = max(dot(normalWorld, toP), 0.0);           // depth-facing occlusion of back surfaces
    uvP.x.addAssign(sin(uvP.y.mul(40.0).add(uTime.mul(6.0))).mul(0.004)); // distortion function
    const inside = step(0.0, uvP.x).mul(step(uvP.x, float(1.0)))
      .mul(step(0.0, uvP.y)).mul(step(uvP.y, float(1.0))).mul(step(0.0, p.w));
    const base = vec3(0.06, 0.06, 0.065);                     // white boxes reading faintly in the dark
    const litCol = texture(tex, uvP).rgb.mul(facing).mul(inside).mul(2.2)
      .add(vec3(0.6, 0.65, 0.8).mul(facing).mul(inside).mul(0.15)); // ambient projector glow
    return base.add(litCol);
  })();
  return { mat, uTime };
}

/* Peripheral velocity blur — the dolly/tunnel money shot. Radial streak blur that
   only bites at the frame edges, scaled by |camera velocity|. */
export function velocityBlur(inputTexNode: any, uVel: ReturnType<typeof uniform>) {
  return Fn(() => {
    const uvs = uv();
    const dir = uvs.sub(vec2(0.5, 0.5));
    const edge = clamp(length(dir).mul(2.0).sub(0.35), 0.0, 1.0); // 0 center → 1 periphery
    const amount = edge.mul(edge).mul(clamp(uVel, 0.0, 3.0)).mul(0.055);
    const acc = inputTexNode.sample(uvs).toVar();
    Loop({ start: 1, end: 8, type: 'int', condition: '<=' }, ({ i }: any) => {
      const k = float(i).div(8.0).sub(0.5);
      acc.addAssign(inputTexNode.sample(uvs.add(dir.mul(amount).mul(k))));
    });
    return acc.div(9.0);
  })();
}
