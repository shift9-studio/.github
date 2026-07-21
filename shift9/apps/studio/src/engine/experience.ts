/* Experience orchestrator — stage machine:
   entrance video → desk scene → Windows 11 screen → tunnel dive → studio.
   Phase 1 scaffold: boots the renderer against the void and proves the
   toolchain end-to-end. Stages land in Phases 2–7 per BUILD_CONTRACT.md. */
import { WebGLRenderer, Scene, PerspectiveCamera, Color, Fog, AmbientLight } from 'three';
import { SCENE_CONSTANTS } from '../constants';

export async function startExperience(root: HTMLElement): Promise<void> {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  root.append(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(SCENE_CONSTANTS.COLOR_DARK_BG);
  scene.fog = new Fog(0x000000, 8, 55);
  scene.add(new AmbientLight(0x111114, 0.6));

  const camera = new PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 2.2, SCENE_CONSTANTS.CAMERA_START_Z);

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
