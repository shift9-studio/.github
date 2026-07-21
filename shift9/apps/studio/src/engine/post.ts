/* Global post-processing stack — UnrealBloom-class bloom, film grain, and
   peripheral velocity blur, tuned for cinematic chiaroscuro. Runs on the
   WebGPU backend (WGSL) and the WebGL2 fallback (GLSL) via TSL.
   Mobile: half-resolution post, per the mandate. */
import * as THREE from 'three/webgpu';
import { pass, uniform } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';
import { velocityBlur } from './tsl';

export interface PostStack {
  render: () => void;
  setVelocity: (v: number) => void;
  setGrain: (g: number) => void;
}

export function createPostStack(
  renderer: THREE.WebGPURenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  mobile: boolean
): PostStack {
  const postProcessing = new THREE.PostProcessing(renderer);
  const scenePass = pass(scene, camera);
  if (mobile) scenePass.setResolution(0.5); // half-res post on mobile

  const uVel = uniform(0);
  const uGrain = uniform(0.07);

  const sceneColor = scenePass.getTextureNode();
  // peripheral velocity blur first (streaks the raw frame), then bloom lifts the
  // emissives, then film grain sits on top — chiaroscuro order.
  const blurred = velocityBlur(sceneColor, uVel);
  // tight halation: high HDR threshold + small radius so only hot emissive cores
  // (glow sprites, LEDs, the billet, neon) ring — chiaroscuro blacks stay black
  const bloomed = blurred.add(bloom(sceneColor, 0.18, 0.06, 2.8));
  postProcessing.outputNode = film(bloomed, uGrain);

  let smoothedVel = 0;
  return {
    render: () => { postProcessing.render(); },
    setVelocity: (v: number) => {
      // ease the blur in/out so single wheel ticks don't strobe
      smoothedVel += (Math.abs(v) - smoothedVel) * 0.18;
      uVel.value = smoothedVel;
    },
    setGrain: (g: number) => { uGrain.value = g; }
  };
}
