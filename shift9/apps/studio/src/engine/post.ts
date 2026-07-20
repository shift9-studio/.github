/* Cinematic post stack: scene pass → peripheral velocity blur → bloom → film
   grain → radial vignette. Node/TSL based so it runs on WebGPURenderer with
   either backend (WebGPU or WebGL2) — no EffectComposer, no GLSL passes.

   Order rationale: bloom sits after the radial blur so streaked highlights
   still bloom; film grain goes last before the vignette so grain is dimmed at
   the edges rather than floating on top of the darkening. */

import { PostProcessing } from 'three/webgpu';
import {
  pass,
  uniform,
  uv,
  vec2,
  vec4,
  float,
  smoothstep,
  Fn,
  Loop,
} from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';
import type { CreatePostFX } from './postTypes';

/* @types/three's TSL coverage is spotty; this is the minimal surface we use. */
interface TSLNode {
  add(n: unknown): TSLNode;
  sub(n: unknown): TSLNode;
  mul(n: unknown): TSLNode;
  div(n: unknown): TSLNode;
  oneMinus(): TSLNode;
  length(): TSLNode;
  normalize(): TSLNode;
  rgb: TSLNode;
  a: TSLNode;
  toVar(): TSLNode;
  addAssign(n: unknown): void;
  sample(coord: unknown): TSLNode;
}

const MAX_BLUR = 0.035; // uv offset at full dolly velocity
const DIVE_BLUR = 0.06; // extra uv offset at full dive boost
const VELOCITY_SMOOTHING = 0.12; // per-frame lerp toward target velocity

export const createPostFX: CreatePostFX = (renderer, scene, camera, opts) => {
  const taps = opts.mobile ? 4 : 8;

  // Uniforms driven from the app loop.
  const uVelocity = uniform(0); // smoothed 0..1
  const uDiveBoost = uniform(0); // 0..1 one-shot dive boost
  const uGrain = uniform(0.07); // grain token default

  // Scene color pass. PassNode tracks the renderer's drawing-buffer size
  // automatically in updateBefore() (PassNode.js:745-775); on mobile we halve
  // it via setPixelRatio so the whole post chain runs at half resolution.
  const scenePass = pass(scene, camera);
  if (opts.mobile) scenePass.setPixelRatio(0.5);
  const sceneColor = scenePass.getTextureNode() as unknown as TSLNode;

  // Peripheral velocity blur: N taps marching outward from screen center,
  // gated by distance-from-center so the middle stays tack sharp.
  const velocityBlur = Fn(() => {
    const uvNode = uv() as unknown as TSLNode;
    const fromCenter = uvNode.sub(vec2(0.5, 0.5));
    const dist = fromCenter.length();
    // Blur amount: velocity term + dive term, only in the periphery.
    const amount = (float(uVelocity as unknown as number) as unknown as TSLNode)
      .div(3)
      .mul(MAX_BLUR)
      .add((float(uDiveBoost as unknown as number) as unknown as TSLNode).mul(DIVE_BLUR))
      .mul(smoothstep(0.15, 0.75, dist as unknown as number) as unknown as TSLNode);
    const dir = fromCenter.normalize().mul(amount);

    const acc = sceneColor.sample(uvNode).toVar();
    Loop({ start: 1, end: taps, type: 'int', condition: '<' }, ({ i }: { i: unknown }) => {
      const offset = dir.mul((float(i as number) as unknown as TSLNode).div(taps));
      acc.addAssign(sceneColor.sample(uvNode.sub(offset)));
    });
    return acc.div(taps);
  })() as unknown as TSLNode;

  // Bloom — bloom(node, strength, radius, threshold) per BloomNode.js:532.
  // High threshold so only emissives/glows bloom on the mostly-black scene.
  const bloomed = bloom(
    velocityBlur as unknown as Parameters<typeof bloom>[0],
    0.28,
    opts.mobile ? 0.35 : 0.4,
    0.85
  );

  // Bloom is additive: BloomNode returns only the blurred bright-pass, so the
  // sharp base image must be added back (canonical `scenePass + bloom(...)`).
  const composed = velocityBlur.add(bloomed);

  // Film grain — film(inputNode, intensityNode) per FilmNode.js:25/101.
  const grained = film(composed as unknown as Parameters<typeof film>[0], uGrain) as unknown as TSLNode;

  // Baked radial vignette (supersedes the DOM one).
  const vignetted = Fn(() => {
    const dist = (uv() as unknown as TSLNode).sub(vec2(0.5, 0.5)).length();
    const falloff = (smoothstep(0.55, 1.0, dist as unknown as number) as unknown as TSLNode)
      .mul(0.55)
      .oneMinus();
    return vec4(grained.rgb.mul(falloff) as unknown as number, grained.a as unknown as number);
  })();

  const postProcessing = new PostProcessing(renderer);
  postProcessing.outputNode = vignetted as never;

  let targetVelocity = 0;

  return {
    render() {
      // Smooth the uniform toward the target so per-frame velocity steps
      // don't pop in the blur.
      uVelocity.value += (targetVelocity - uVelocity.value) * VELOCITY_SMOOTHING;
      postProcessing.render();
    },
    setVelocity(v: number) {
      targetVelocity = Math.min(Math.abs(v), 3);
    },
    setDiveBoost(k: number) {
      uDiveBoost.value = Math.max(0, Math.min(k, 1));
    },
    setSize(w: number, h: number) {
      // PassNode and BloomNode both resync to the renderer's drawing-buffer
      // size each frame (PassNode.updateBefore / BloomNode.updateBefore), so
      // an explicit resize is only a fast-path; keep it for immediacy.
      scenePass.setSize(w, h);
    },
    dispose() {
      scenePass.dispose();
      (bloomed as unknown as { dispose(): void }).dispose?.();
      postProcessing.dispose();
    },
  };
};
