import type { Camera, Scene } from 'three';
import type { WebGPURenderer } from 'three/webgpu';

/* Contract for the cinematic post stack (implemented in ./post.ts).
   UnrealBloom-class bloom + film grain + peripheral velocity blur, tuned for
   chiaroscuro. Runs on WebGPURenderer (WebGPU primary, WebGL2 backend fallback). */
export interface PostFX {
  /** Renders scene→screen through the stack (replaces renderer.render). */
  render(): void;
  /** |dolly velocity| 0..MAX_VELOCITY — drives peripheral velocity blur. */
  setVelocity(v: number): void;
  /** Extra one-shot boost for the tunnel dive (0..1). */
  setDiveBoost(k: number): void;
  setSize(w: number, h: number): void;
  dispose(): void;
}

export type CreatePostFX = (
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  opts: { mobile: boolean }
) => PostFX;
