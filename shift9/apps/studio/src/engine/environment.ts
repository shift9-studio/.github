/* Stage environment map — cinema-stack pass (BUILD_CONTRACT clause 10).
   Instead of a generic indoor room, reflective and satin surfaces mirror the
   soundstage they actually stand on: a black void with one hot softbox panel
   overhead and a dim concrete bounce below. Built once, shared by every set. */
import {
  BackSide,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Scene,
  Texture,
  WebGLRenderer,
} from 'three';

let stageEnvTex: Texture | null = null;

export const stageEnv = (renderer: WebGLRenderer): Texture => {
  if (stageEnvTex) return stageEnvTex;
  const scene = new Scene();
  // the void — a huge black shell so reflections fall off to nothing
  const shell = new Mesh(
    new BoxGeometry(60, 60, 60),
    new MeshStandardMaterial({ color: 0x030304, roughness: 1, side: BackSide }),
  );
  scene.add(shell);
  // the key softbox overhead
  const panel = new Mesh(new PlaneGeometry(9, 5), new MeshBasicMaterial({ color: 0xffffff }));
  panel.position.set(0, 14, 0);
  panel.rotation.x = Math.PI / 2;
  scene.add(panel);
  // faint concrete bounce underfoot
  const floor = new Mesh(
    new PlaneGeometry(50, 50),
    new MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -8;
  scene.add(floor);
  const fill = new PointLight(0xffffff, 120, 0, 2);
  fill.position.set(0, 12, 0);
  scene.add(fill);
  const pmrem = new PMREMGenerator(renderer);
  stageEnvTex = pmrem.fromScene(scene, 0.035).texture;
  pmrem.dispose();
  return stageEnvTex;
};
