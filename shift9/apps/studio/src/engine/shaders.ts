/* TSL ports of the reference's custom GLSL (shift9-scene.js).
   Every expression mirrors the reference shader math verbatim; only the
   authoring language changed (GLSL strings → three/tsl node graphs) so the
   materials run on both the WebGPU backend and the WebGL2 fallback backend.
   Factories return the material plus `.value`-updatable uniform handles. */
import {
  AdditiveBlending,
  Color,
  type ColorRepresentation,
  DoubleSide,
  Matrix4,
  type Texture,
  Vector3,
} from 'three';
import { MeshBasicNodeMaterial, type Node, type UniformNode } from 'three/webgpu';
import {
  abs,
  clamp,
  dot,
  float,
  floor,
  fract,
  length,
  max,
  min,
  mix,
  normalWorld,
  normalLocal,
  normalize,
  positionLocal,
  positionWorld,
  pow,
  sin,
  smoothstep,
  step,
  texture,
  uniform,
  uv,
  varying,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

/* ── shared helpers ────────────────────────────────────────────────────── */

// hash2(p) = fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453123)
const hash2 = (p: Node): Node => fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453123));

// hash(p3) = fract(sin(dot(p, vec3(12.9,78.2,37.7)))*43758.5)  (fluid orb)
const hash3 = (p: Node): Node => fract(sin(dot(p, vec3(12.9, 78.2, 37.7))).mul(43758.5));

// value noise, verbatim port of the fluid orb's vertex noise()
const noise3 = (p: Node): Node => {
  const i = floor(p);
  const f0 = fract(p);
  const f = f0.mul(f0).mul(float(3.0).sub(f0.mul(2.0))); // f*f*(3.0-2.0*f)
  return mix(
    mix(
      mix(hash3(i), hash3(i.add(vec3(1, 0, 0))), f.x),
      mix(hash3(i.add(vec3(0, 1, 0))), hash3(i.add(vec3(1, 1, 0))), f.x),
      f.y,
    ),
    mix(
      mix(hash3(i.add(vec3(0, 0, 1))), hash3(i.add(vec3(1, 0, 1))), f.x),
      mix(hash3(i.add(vec3(0, 1, 1))), hash3(i.add(vec3(1, 1, 1))), f.x),
      f.y,
    ),
    f.z,
  );
};

/* ── dust motes plane (DUST_FRAG) ──────────────────────────────────────── */

export interface DustMaterial {
  material: MeshBasicNodeMaterial;
  uTime: UniformNode<number>;
  uFade: UniformNode<number>;
}

/** Two sparse mote layers on a hash grid, edge falloff, camera-distance uFade. */
export function createDustMaterial(color: ColorRepresentation): DustMaterial {
  const uTime = uniform(0);
  const uFade = uniform(1);
  const uColor = uniform(new Color(color));

  // mote(uv, grid, t, thresh) — zero below threshold, point falloff inside the cell
  const mote = (uvN: Node, grid: Node, t: Node, thresh: number): Node => {
    const cell = floor(uvN.mul(grid));
    const n = hash2(cell.add(vec2(t.mul(0.37), t.mul(0.61))));
    const f = fract(uvN.mul(grid));
    const c = vec2(hash2(cell.add(7.1)), hash2(cell.add(3.3)));
    // smoothstep(0.35, 0.0, length(f - c)) gated by (n >= thresh)
    return smoothstep(0.35, 0.0, length(f.sub(c))).mul(step(thresh, n));
  };

  const t = floor(uTime.mul(6.0));
  const dust = mote(uv(), vec2(60.0, 40.0), t, 0.985)
    .mul(0.9)
    .add(mote(uv().add(13.7), vec2(110.0, 75.0), t.mul(1.7), 0.992).mul(0.7));
  const edge = smoothstep(0.0, 0.3, uv().x)
    .mul(smoothstep(1.0, 0.7, uv().x))
    .mul(smoothstep(0.0, 0.2, uv().y))
    .mul(smoothstep(1.0, 0.8, uv().y));

  const material = new MeshBasicNodeMaterial();
  material.colorNode = uColor;
  material.opacityNode = min(dust, 1.0).mul(0.35).mul(edge).mul(uFade);
  material.transparent = true;
  material.depthWrite = false;
  material.blending = AdditiveBlending;
  material.side = DoubleSide;
  material.fog = false; // reference ShaderMaterial ignored scene fog
  return { material, uTime, uFade };
}

/* ── light cone (alpha = pow(vUv.y,2)*uOp) ─────────────────────────────── */

export interface LightConeMaterial {
  material: MeshBasicNodeMaterial;
  uOp: UniformNode<number>;
}

export function createLightConeMaterial(
  color: ColorRepresentation,
  opacity: number,
): LightConeMaterial {
  const uOp = uniform(opacity);
  const uColor = uniform(new Color(color));
  const material = new MeshBasicNodeMaterial();
  material.colorNode = uColor;
  material.opacityNode = pow(uv().y, 2.0).mul(uOp);
  material.transparent = true;
  material.depthWrite = false;
  material.blending = AdditiveBlending;
  material.side = DoubleSide;
  material.fog = false;
  return { material, uOp };
}

/* ── projector beam (alpha = (1-vUv.y)*0.06) ───────────────────────────── */

export interface BeamMaterial {
  material: MeshBasicNodeMaterial;
  uTime: UniformNode<number>;
}

export function createBeamMaterial(): BeamMaterial {
  const uTime = uniform(0); // kept for parity with the reference uniform set
  const material = new MeshBasicNodeMaterial();
  material.colorNode = vec3(1.0);
  material.opacityNode = max(uv().y.oneMinus().mul(0.06), 0.0);
  material.transparent = true;
  material.depthWrite = false;
  material.blending = AdditiveBlending;
  material.side = DoubleSide;
  material.fog = false;
  return { material, uTime };
}

/* ── Lumen projective texture mapping ──────────────────────────────────── */

export interface LumenMaterial {
  material: MeshBasicNodeMaterial;
  uTime: UniformNode<number>;
  uProj: UniformNode<Matrix4>;
  uProjPos: UniformNode<Vector3>;
}

/** Projective UV from projector matrix, facing occlusion, sine distortion of
    uv.x, inside-frustum clamp; base 0.06 grey + map*facing*2.2 + ambient glow. */
export function createLumenMaterial(
  map: Texture,
  projMatrix: Matrix4,
  projPos: Vector3,
): LumenMaterial {
  const uTime = uniform(0);
  const uProj = uniform(projMatrix);
  const uProjPos = uniform(projPos);

  const p = uProj.mul(vec4(positionWorld, 1.0)); // projective texture mapping
  const uvp = p.xy.div(p.w).mul(0.5).add(0.5);
  const toP = normalize(uProjPos.sub(positionWorld));
  const facing = max(dot(normalWorld, toP), 0.0); // occlude back surfaces
  const uvx = uvp.x.add(sin(uvp.y.mul(40.0).add(uTime.mul(6.0))).mul(0.004)); // distortion
  const uvD = vec2(uvx, uvp.y);
  const inside = step(0.0, uvD.x)
    .mul(step(uvD.x, 1.0))
    .mul(step(0.0, uvD.y))
    .mul(step(uvD.y, 1.0))
    .mul(step(0.0, p.w));
  const base = vec3(0.06, 0.06, 0.065); // white boxes reading faintly in the dark
  const lit = texture(map, uvD)
    .rgb.mul(facing)
    .mul(inside)
    .mul(2.2)
    .add(vec3(0.6, 0.65, 0.8).mul(facing).mul(inside).mul(0.15)); // ambient projector glow

  const material = new MeshBasicNodeMaterial();
  material.colorNode = base.add(lit);
  material.fog = false;
  return { material, uTime, uProj, uProjPos };
}

/* ── Flow State fluid orb ──────────────────────────────────────────────── */

export interface FluidMaterial {
  material: MeshBasicNodeMaterial;
  uTime: UniformNode<number>;
}

/** Vertex noise displacement along the normal; fresnel-ish deep→lit blue mix. */
export function createFluidMaterial(): FluidMaterial {
  const uTime = uniform(0);

  // d = noise(pos*1.6+t*0.4)*0.5 + noise(pos*3.2-t*0.3)*0.25  (vertex stage)
  const d = noise3(positionLocal.mul(1.6).add(uTime.mul(0.4)))
    .mul(0.5)
    .add(noise3(positionLocal.mul(3.2).sub(uTime.mul(0.3))).mul(0.25));
  const vD = varying(d);
  const vN = varying(normalLocal);

  const deep = vec3(0.005, 0.01, 0.03);
  const lit = vec3(0.03, 0.12, 0.45);
  const f = pow(max(abs(vN.z).oneMinus(), 0.0), 2.5);
  const c = mix(deep, lit, clamp(vD.mul(vD).mul(1.4).add(f.mul(0.5)), 0.0, 1.0));

  const material = new MeshBasicNodeMaterial();
  material.positionNode = positionLocal.add(normalLocal.mul(d).mul(0.7));
  material.colorNode = c;
  material.fog = false;
  return { material, uTime };
}
