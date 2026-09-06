"use client";

/* ------------------------------------------------------------------------
   ROOM EXPLORE - live WebGL walkaround of the Shift-9 studio room.
   Hero is ONE room GLB generated from the locked opening plate
   (04-desk-still) — same persistence as locking a character from a still.
   BoxGeometry furniture hides when that mesh lands. Clicks hit invisible box
   proxies — never the reconstructed mush. If the left workbench is short vs
   the film, that group stretches in X only (never a uniform room scale).
   RoomRoot freezes once its bbox matches the still.
   ------------------------------------------------------------------------ */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import s from "./RoomExplore.module.css";

type PropId =
  | "printer"
  | "lumen"
  | "instrument"
  | "games"
  | "omni"
  | "arm"
  | "desk";

type PropState = {
  printer: "idle" | "printing" | "souvenir";
  lumen: "idle" | "calibrating" | "mapped";
  instrument: "idle" | "peeked";
  games: "idle" | "peeked";
  omni: "idle" | "peeked";
  arm: "idle" | "peeked";
};

type Hotspot = {
  id: PropId;
  label: string;
  prompt: string;
  position: THREE.Vector3;
};

type Props = {
  onSitDown: () => void;
  reducedMotion: boolean;
  studioHref?: string;
};

const MOVE_SPEED = 4.2;
const LOOK_SENS = 0.0024;
const INTERACT_RANGE = 3.4;
const STUDIO_CUE_AFTER = 2;

const INITIAL: PropState = {
  printer: "idle",
  lumen: "idle",
  instrument: "idle",
  games: "idle",
  omni: "idle",
  arm: "idle",
};

/* -- Procedural maps (no fake baked GLB path) --------------------------- */

function canvasTex(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  opts?: { wrap?: THREE.Wrapping; repeat?: number; colorSpace?: THREE.ColorSpace },
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = opts?.colorSpace ?? THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = opts?.wrap ?? THREE.RepeatWrapping;
  const r = opts?.repeat ?? 1;
  tex.repeat.set(r, r);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function makeWoodMap(): THREE.CanvasTexture {
  return canvasTex(
    512,
    (ctx, size) => {
      ctx.fillStyle = "#c4a574";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 90; i++) {
        const y = (i / 90) * size + Math.sin(i * 1.7) * 3;
        const shade = 140 + ((i * 37) % 50);
        ctx.strokeStyle = `rgba(${shade - 40},${shade - 70},${shade - 100},0.35)`;
        ctx.lineWidth = 1 + (i % 3);
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < size; x += 8) {
          ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 2.5);
        }
        ctx.stroke();
      }
      for (let n = 0; n < 1200; n++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = `rgba(60,40,20,${Math.random() * 0.08})`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    },
    { repeat: 2 },
  );
}

function makeDarkFloorMap(): THREE.CanvasTexture {
  return canvasTex(
    512,
    (ctx, size) => {
      ctx.fillStyle = "#1a1c22";
      ctx.fillRect(0, 0, size, size);
      const plank = size / 8;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const x = col * plank;
          const y = row * plank;
          const v = 18 + ((row * 13 + col * 7) % 22);
          ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
          ctx.fillRect(x + 1, y + 1, plank - 2, plank - 2);
          ctx.strokeStyle = "rgba(0,0,0,0.45)";
          ctx.strokeRect(x + 0.5, y + 0.5, plank - 1, plank - 1);
          for (let g = 0; g < 6; g++) {
            ctx.strokeStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.02})`;
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 6 + g * 6);
            ctx.lineTo(x + plank - 4, y + 8 + g * 6 + Math.sin(g) * 2);
            ctx.stroke();
          }
        }
      }
    },
    { repeat: 6 },
  );
}

function makePaintWallMap(): THREE.CanvasTexture {
  return canvasTex(
    256,
    (ctx, size) => {
      ctx.fillStyle = "#0c1018";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const v = 8 + Math.random() * 18;
        ctx.fillStyle = `rgba(${v},${v + 2},${v + 6},${0.15 + Math.random() * 0.25})`;
        ctx.fillRect(x, y, 1.2, 1.2);
      }
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.02})`;
        ctx.fillRect(Math.random() * size, Math.random() * size, 40, 2);
      }
    },
    { repeat: 4 },
  );
}

function makeConcreteMap(): THREE.CanvasTexture {
  return canvasTex(
    256,
    (ctx, size) => {
      ctx.fillStyle = "#3a3e46";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 6000; i++) {
        const v = 40 + Math.random() * 50;
        ctx.fillStyle = `rgba(${v},${v},${v + 4},0.35)`;
        ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
      }
    },
    { repeat: 2 },
  );
}

function makeMetalMap(): THREE.CanvasTexture {
  return canvasTex(
    256,
    (ctx, size) => {
      const g = ctx.createLinearGradient(0, 0, size, 0);
      g.addColorStop(0, "#2a3038");
      g.addColorStop(0.5, "#4a5564");
      g.addColorStop(1, "#2a3038");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y += 2) {
        ctx.fillStyle = `rgba(255,255,255,${0.02 + (y % 7) * 0.004})`;
        ctx.fillRect(0, y, size, 1);
      }
    },
    { repeat: 1 },
  );
}

function makeCalibGridMap(): THREE.CanvasTexture {
  /* Film Lumen cubes: pale grey foam, faint 3×3 white grid — not a neon HUD */
  return canvasTex(
    256,
    (ctx, size) => {
      ctx.fillStyle = "#d4d2cc";
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "rgba(248,248,244,0.62)";
      ctx.lineWidth = 3;
      const cells = 3;
      const step = size / cells;
      for (let i = 0; i <= cells; i++) {
        ctx.beginPath();
        ctx.moveTo(i * step, 0);
        ctx.lineTo(i * step, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * step);
        ctx.lineTo(size, i * step);
        ctx.stroke();
      }
    },
    { wrap: THREE.ClampToEdgeWrapping, repeat: 1 },
  );
}

function makeMat(
  color: number,
  opts: Partial<THREE.MeshStandardMaterialParameters> = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.18,
    ...opts,
  });
}

/* -- Custom shaders (questopia blendLighten pattern) -------------------- */

const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SCREEN_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uHasMap;
uniform vec3 uTint;
uniform float uGlow;
uniform float uBright;
uniform float uTime;
uniform float uScan;
varying vec2 vUv;

float blendLighten(float base, float blend) {
  return max(blend, base);
}
vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
  vec3 r = vec3(
    blendLighten(base.r, blend.r),
    blendLighten(base.g, blend.g),
    blendLighten(base.b, blend.b)
  );
  return mix(base, r, opacity);
}

void main() {
  vec3 base = uTint;
  if (uHasMap > 0.5) {
    base = texture2D(uMap, vUv).rgb;
  }
  float scan = sin((vUv.y + uTime * 0.15) * 90.0) * 0.04 * uScan;
  base += scan;
  float pulse = 0.85 + 0.15 * sin(uTime * 1.7);
  vec3 glowCol = mix(uTint, vec3(0.55, 0.78, 1.0), 0.45) * uGlow * pulse;
  base = blendLighten(base, glowCol, clamp(uGlow * 0.55, 0.0, 1.0));
  float vig = smoothstep(0.95, 0.2, length(vUv - 0.5));
  base *= mix(0.75, 1.0, vig) * uBright;
  gl_FragColor = vec4(base, 1.0);
}
`;

const LUMEN_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const LUMEN_FRAG = /* glsl */ `
uniform sampler2D uAlbedo;
uniform sampler2D uProject;
uniform float uHasProject;
uniform float uMapped;
uniform float uTime;
uniform vec3 uIdleTint;
varying vec2 vUv;
varying vec3 vWorldPos;

float blendLighten(float base, float blend) {
  return max(blend, base);
}
vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
  vec3 r = vec3(
    blendLighten(base.r, blend.r),
    blendLighten(base.g, blend.g),
    blendLighten(base.b, blend.b)
  );
  return mix(base, r, opacity);
}

void main() {
  vec3 albedo = texture2D(uAlbedo, vUv * 2.0).rgb * uIdleTint;
  vec3 color = albedo;

  if (uHasProject > 0.5 && uMapped > 0.5) {
    vec2 puv = fract(vWorldPos.xz * 0.35 + vec2(0.0, uTime * 0.02));
    vec3 proj = texture2D(uProject, puv).rgb;
    color = blendLighten(color, proj, 0.85);
  }

  if (uMapped > 0.5) {
    float hue = fract(uTime * 0.12 + vWorldPos.x * 0.08 + vWorldPos.y * 0.1);
    vec3 trip = 0.5 + 0.5 * cos(6.2831 * (hue + vec3(0.0, 0.33, 0.67)));
    color = blendLighten(color, trip, 0.55 + 0.2 * sin(uTime * 3.0 + vWorldPos.y * 4.0));
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

function createScreenMaterial(
  map: THREE.Texture | null,
  tint = new THREE.Color(0x87b7ff),
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uHasMap: { value: map ? 1 : 0 },
      uTint: { value: tint },
      uGlow: { value: 1.15 },
      uBright: { value: 1.35 },
      uTime: { value: 0 },
      uScan: { value: 1 },
    },
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
    toneMapped: true,
  });
}

function createLumenMaterial(
  albedo: THREE.Texture,
  project: THREE.Texture | null,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAlbedo: { value: albedo },
      uProject: { value: project },
      uHasProject: { value: project ? 1 : 0 },
      uMapped: { value: 0 },
      uTime: { value: 0 },
      uIdleTint: { value: new THREE.Color(0xf2f2f0) },
    },
    vertexShader: LUMEN_VERT,
    fragmentShader: LUMEN_FRAG,
  });
}

function createShift9Mark(): THREE.Group {
  const g = new THREE.Group();
  const mat = makeMat(0xe8f7ff, {
    emissive: 0x3b93f0,
    emissiveIntensity: 0.55,
    roughness: 0.35,
    metalness: 0.4,
  });
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), mat);
  stem.position.set(0, 0.14, 0);
  const bowl = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.035, 10, 18), mat);
  bowl.rotation.x = Math.PI / 2;
  bowl.position.set(0.02, 0.08, 0);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.05), mat);
  bar.position.set(0.01, 0.22, 0);
  g.add(stem, bowl, bar);
  g.scale.setScalar(0.85);
  return g;
}

function addBaseboard(
  scene: THREE.Scene,
  mat: THREE.Material,
  length: number,
  pos: [number, number, number],
  rotY = 0,
) {
  const board = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.04), mat);
  board.position.set(...pos);
  board.rotation.y = rotY;
  board.receiveShadow = true;
  scene.add(board);
}

export function RoomExplore({
  onSitDown,
  reducedMotion,
  studioHref = "/studio",
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [propsState, setPropsState] = useState<PropState>(INITIAL);
  const [nearId, setNearId] = useState<PropId | null>(null);
  const [labels, setLabels] = useState<
    { id: PropId; label: string; x: number; y: number; near: boolean }[]
  >([]);
  const [hint, setHint] = useState(
    "Drag to look * WASD to move * click a glowing prop to interact",
  );

  const propsRef = useRef(propsState);
  propsRef.current = propsState;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const unlockedCount = useMemo(() => {
    let n = 0;
    if (propsState.printer === "souvenir") n += 1;
    if (propsState.lumen === "mapped") n += 1;
    if (propsState.instrument === "peeked") n += 1;
    if (propsState.games === "peeked") n += 1;
    if (propsState.omni === "peeked") n += 1;
    if (propsState.arm === "peeked") n += 1;
    return n;
  }, [propsState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mount = mountRef.current;
    if (!canvas || !mount) return;

    const disposableTex: THREE.Texture[] = [];
    const disposableMat: THREE.Material[] = [];
    const trackTex = <T extends THREE.Texture>(t: T) => {
      disposableTex.push(t);
      return t;
    };
    const trackMat = <T extends THREE.Material>(m: T) => {
      disposableMat.push(m);
      return m;
    };

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !reducedMotion,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    renderer.shadowMap.enabled = !reducedMotion;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    RectAreaLightUniformsLib.init();

    const scene = new THREE.Scene();
    /* Dark fallback until HDRI/PMREM resolves — never checkerboard void */
    scene.background = new THREE.Color(0x0a0c12);
    scene.fog = new THREE.FogExp2(0x0a0c12, 0.022);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.08,
      60,
    );
    /* Spawn inside the room, facing the desk as if just stood up */
    camera.position.set(0, 1.52, 1.35);

    /* -- Procedural materials ------------------------------------------- */
    const woodMap = trackTex(makeWoodMap());
    const floorMap = trackTex(makeDarkFloorMap());
    const wallMap = trackTex(makePaintWallMap());
    const concreteMap = trackTex(makeConcreteMap());
    const metalMap = trackTex(makeMetalMap());
    const gridMap = trackTex(makeCalibGridMap());

    const woodMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: woodMap,
        roughness: 0.42,
        metalness: 0.02,
        clearcoat: 0.22,
        clearcoatRoughness: 0.38,
        envMapIntensity: 1.05,
      }),
    );
    const floorMat = trackMat(
      makeMat(0x2a2218, {
        map: floorMap,
        roughness: 0.72,
        metalness: 0.08,
        envMapIntensity: 0.45,
      }),
    );
    const wallMat = trackMat(
      makeMat(0x121820, {
        map: wallMap,
        roughness: 0.96,
        metalness: 0.02,
        envMapIntensity: 0.22,
      }),
    );
    const metalMat = trackMat(
      makeMat(0xffffff, {
        map: metalMap,
        roughness: 0.28,
        metalness: 0.8,
        envMapIntensity: 1,
      }),
    );
    const cabinetMat = trackMat(
      makeMat(0xffffff, {
        map: concreteMap,
        roughness: 0.55,
        metalness: 0.45,
        color: 0x8a909a,
        envMapIntensity: 1,
      }),
    );
    const trimMat = trackMat(
      makeMat(0xe8e6e0, { roughness: 0.7, metalness: 0.05, envMapIntensity: 0.7 }),
    );
    const blackMetal = trackMat(
      makeMat(0x1a1d24, { roughness: 0.25, metalness: 0.8, envMapIntensity: 1 }),
    );

    /* Real PBR maps (Poly Haven CC0 under /experience/room/) */
    const loaderTex = new THREE.TextureLoader();
    const applyPBR = (
      mat: THREE.MeshStandardMaterial,
      spec: {
        map?: string;
        normalMap?: string;
        roughnessMap?: string;
        repeat: number;
      },
    ) => {
      const load = (url: string, asColor: boolean, assign: (t: THREE.Texture) => void) => {
        loaderTex.load(
          url,
          (t) => {
            t.colorSpace = asColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(spec.repeat, spec.repeat);
            t.anisotropy = renderer.capabilities.getMaxAnisotropy();
            trackTex(t);
            assign(t);
            mat.needsUpdate = true;
          },
          undefined,
          () => {
            /* keep procedural fallback */
          },
        );
      };
      if (spec.map) load(spec.map, true, (t) => { mat.map = t; });
      if (spec.normalMap) {
        load(spec.normalMap, false, (t) => {
          mat.normalMap = t;
          mat.normalScale.set(1, 1);
        });
      }
      if (spec.roughnessMap) {
        load(spec.roughnessMap, false, (t) => {
          mat.roughnessMap = t;
          mat.roughness = 1;
        });
      }
    };

    /* Film floor is dark hardwood, not the light concrete that made the old
       WebGL frames read as a grey toy box. Wood albedo is multiplied dark. */
    applyPBR(floorMat, {
      map: "/experience/room/wood_table_diff.jpg",
      normalMap: "/experience/room/wood_table_nor.jpg",
      roughnessMap: "/experience/room/wood_table_rough.jpg",
      repeat: 6,
    });
    /* Navy multiply over plaster so walls stay film-dark, not light grey. */
    applyPBR(wallMat, {
      map: "/experience/room/plaster_wall.jpg",
      normalMap: "/experience/room/plaster_wall_nor.jpg",
      roughnessMap: "/experience/room/plaster_wall_rough.jpg",
      repeat: 2,
    });
    applyPBR(woodMat, {
      map: "/experience/room/wood_table_diff.jpg",
      normalMap: "/experience/room/wood_table_nor.jpg",
      roughnessMap: "/experience/room/wood_table_rough.jpg",
      repeat: 1,
    });
    applyPBR(metalMat, {
      map: "/experience/room/metal_plate_diff.jpg",
      normalMap: "/experience/room/metal_plate_nor.jpg",
      roughnessMap: "/experience/room/metal_plate_rough.jpg",
      repeat: 2,
    });
    applyPBR(cabinetMat, {
      map: "/experience/room/metal_plate_diff.jpg",
      normalMap: "/experience/room/metal_plate_nor.jpg",
      roughnessMap: "/experience/room/metal_plate_rough.jpg",
      repeat: 2,
    });

    /* Screen / lumen shaders - maps filled when TextureLoader resolves */
    const deskScreenMat = trackMat(createScreenMaterial(null, new THREE.Color(0x6aa8ff)));
    const portraitScreenMat = trackMat(
      createScreenMaterial(null, new THREE.Color(0x8ec5ff)),
    );
    const gamesScreenMat = trackMat(
      createScreenMaterial(null, new THREE.Color(0x29b6f6)),
    );
    const lumenMats: THREE.ShaderMaterial[] = [];

    const loadMap = (url: string, onLoad: (t: THREE.Texture) => void) => {
      loaderTex.load(
        url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          trackTex(t);
          onLoad(t);
        },
        undefined,
        () => {
          /* keep procedural fallback */
        },
      );
    };

    loadMap("/experience/opening/04-desk-still.jpg", (t) => {
      deskScreenMat.uniforms.uMap!.value = t;
      deskScreenMat.uniforms.uHasMap!.value = 1;
    });
    loadMap("/experience/set-pieces/07-game-design-forge.png", (t) => {
      portraitScreenMat.uniforms.uMap!.value = t;
      portraitScreenMat.uniforms.uHasMap!.value = 1;
    });
    loadMap("/experience/set-pieces/05-voxel-arcade-v3.png", (t) => {
      gamesScreenMat.uniforms.uMap!.value = t;
      gamesScreenMat.uniforms.uHasMap!.value = 1;
    });

    let lumenProjectTex: THREE.Texture | null = null;
    loadMap("/experience/set-pieces/04-lumen.png", (t) => {
      lumenProjectTex = t;
      for (const m of lumenMats) {
        m.uniforms.uProject!.value = t;
        m.uniforms.uHasProject!.value = 1;
      }
    });

    /* -- HDRI → PMREM (Pass-2). RoomEnvironment fallback if HDR fails. -- */
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const applyEnv = (tex: THREE.Texture, _asBackground: boolean) => {
      const env = pmrem.fromEquirectangular(tex).texture;
      scene.environment = env;
      (scene as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = 0.4;
      /* Film plate is a dark room. HDRI is for reflections only — using it as
         the backdrop washed the old frames into a grey toy studio. */
      scene.background = new THREE.Color(0x0a0d14);
      tex.dispose();
    };
    const applyRoomFallback = () => {
      const roomEnv = new RoomEnvironment();
      const env = pmrem.fromScene(roomEnv, 0.04).texture;
      roomEnv.dispose();
      scene.environment = env;
      (scene as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = 0.75;
      scene.background = new THREE.Color(0x0c1018);
      scene.backgroundBlurriness = 0;
    };
    new RGBELoader().load(
      "/experience/room/studio_small_09_1k.hdr",
      (hdr) => applyEnv(hdr, true),
      undefined,
      () => applyRoomFallback(),
    );

    /* -- Lighting: warm key + soft shadows tight to desk AABB ------------ */
    scene.add(new THREE.AmbientLight(0x121820, 0.08));
    const hemi = new THREE.HemisphereLight(0x3a4a62, 0x080a10, 0.14);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffe8c8, 1.85);
    key.position.set(1.6, 4.2, 2.4);
    key.castShadow = !reducedMotion;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 4;
    key.shadow.blurSamples = 8;
    key.shadow.bias = -0.0001;
    key.shadow.normalBias = 0.02;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    /* Tight to desk / chair / printer / lumen — not whole void */
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 4.5;
    key.shadow.camera.bottom = -4.5;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x6aa8ff, 0.45);
    rim.position.set(-3.2, 2.6, -0.8);
    scene.add(rim);

    /* Monitor light bar - warm, matches film */
    const deskLamp = new THREE.PointLight(0xffd9a8, 1.35, 6, 2);
    deskLamp.position.set(0.05, 1.95, -2.35);
    scene.add(deskLamp);

    /* Cool tube over printer bay (left of desk, film depth) */
    const tubeLight = new THREE.PointLight(0xe8f0ff, 1.15, 5.5, 2);
    tubeLight.position.set(-2.55, 2.45, -2.45);
    scene.add(tubeLight);

    const printerGlow = new THREE.PointLight(0x4db8ff, 0.45, 4, 2);
    printerGlow.position.set(-2.55, 1.55, -2.45);
    scene.add(printerGlow);

    const lumenBeam = new THREE.SpotLight(0xffffff, 1.6, 10, 0.34, 0.55, 1.35);
    lumenBeam.position.set(1.15, 3.15, -1.15);
    lumenBeam.target.position.set(1.72, 0.55, -2.4);
    scene.add(lumenBeam, lumenBeam.target);

    /* Cool bias light behind the monitors — film blue halo on the back wall */
    const bias = new THREE.PointLight(0x3d6cff, 1.25, 4.2, 2);
    bias.position.set(0.1, 1.4, -3.45);
    scene.add(bias);

    /* RectArea + spot on ultrawide — screen presence */
    const screenRect = new THREE.RectAreaLight(0x9ec5ff, 6.5, 1.15, 0.5);
    screenRect.position.set(-0.15, 1.28, -3.2);
    screenRect.lookAt(-0.15, 1.15, -2.2);
    scene.add(screenRect);
    const screenSpot = new THREE.SpotLight(0xb8d4ff, 2.4, 5.5, 0.55, 0.8, 1.2);
    screenSpot.position.set(-0.15, 1.35, -2.85);
    screenSpot.target.position.set(0, 0.85, -2.55);
    scene.add(screenSpot, screenSpot.target);

    const fill = new THREE.PointLight(0x6a7a94, 0.12, 14, 2);
    fill.position.set(0, 2.5, 1.8);
    scene.add(fill);

    /* -- Room shell (enclosed, film-tight — kills void read) ------------ */
    const ROOM_W = 10.2;
    const ROOM_D = 7.6;
    const ROOM_H = 3.55;
    const BACK_Z = -3.85;
    const FRONT_Z = BACK_Z + ROOM_D;
    const LEFT_X = -ROOM_W / 2;
    const RIGHT_X = ROOM_W / 2;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, BACK_Z + ROOM_D / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), wallMat);
    back.position.set(0, ROOM_H / 2, BACK_Z);
    back.receiveShadow = true;
    scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
    left.rotation.y = Math.PI / 2;
    left.position.set(LEFT_X, ROOM_H / 2, BACK_Z + ROOM_D / 2);
    left.receiveShadow = true;
    scene.add(left);
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(RIGHT_X, ROOM_H / 2, BACK_Z + ROOM_D / 2);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    /* Soft front plane — closes the box without blocking exit feel */
    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_H),
      trackMat(
        makeMat(0x0a0c12, {
          roughness: 0.95,
          metalness: 0.02,
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
          envMapIntensity: 0.3,
        }),
      ),
    );
    front.position.set(0, ROOM_H / 2, FRONT_Z);
    front.receiveShadow = true;
    scene.add(front);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      trackMat(makeMat(0x0c0e14, { roughness: 0.95, metalness: 0.02, envMapIntensity: 0.4 })),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, ROOM_H, BACK_Z + ROOM_D / 2);
    scene.add(ceiling);

    addBaseboard(scene, trimMat, ROOM_W, [0, 0.06, BACK_Z + 0.02]);
    addBaseboard(scene, trimMat, ROOM_D, [LEFT_X + 0.02, 0.06, BACK_Z + ROOM_D / 2], Math.PI / 2);
    addBaseboard(scene, trimMat, ROOM_D, [RIGHT_X - 0.02, 0.06, BACK_Z + ROOM_D / 2], -Math.PI / 2);

    /* Window / motivated cool light source on left wall (film tube mood) */
    const windowGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 2.2),
      trackMat(
        makeMat(0xe8f2ff, {
          emissive: 0xc8dcff,
          emissiveIntensity: 0.55,
          roughness: 0.35,
          metalness: 0.1,
        }),
      ),
    );
    windowGlow.position.set(LEFT_X + 0.04, 2.1, -1.1);
    windowGlow.rotation.y = Math.PI / 2;
    scene.add(windowGlow);

    /* Contact shadow under desk / chair (soft blurred decal) */
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2.2),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.38,
          depthWrite: false,
        }),
      ),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.015, -2.55);
    scene.add(contactShadow);

    /* Film floor has no neon stage stripe — that read as the old toy frames. */

    /* Gallery posters on right wall - set-piece plates (lived-in film match) */
    const posterUrls = [
      "/experience/set-pieces/09-instrument.png",
      "/experience/set-pieces/11-omni-3d.png",
      "/experience/set-pieces/05-voxel-arcade-v3.png",
      "/experience/set-pieces/01-just-a-pinch.png",
      "/experience/opening/01-exterior-approach-poster.jpg",
    ];
    const posterLayouts: [number, number, number, number][] = [
      /* w, h, y, z  — high on the right wall so the Games TV owns eye height */
      [0.95, 0.62, 2.55, -2.15],
      [0.62, 0.82, 2.48, -1.15],
      [0.82, 0.54, 2.62, 1.45],
      [0.58, 0.58, 2.42, -2.85],
      [0.72, 0.48, 2.52, 2.05],
    ];
    posterLayouts.forEach(([w, h, y, z], i) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, h + 0.05, w + 0.05),
        blackMetal,
      );
      frame.position.set(RIGHT_X - 0.08, y, z);
      scene.add(frame);
      const mat = trackMat(
        makeMat(0x222830, {
          emissive: 0x111820,
          emissiveIntensity: 0.15,
          roughness: 0.55,
          envMapIntensity: 0.6,
        }),
      );
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      plate.rotation.y = -Math.PI / 2;
      plate.position.set(RIGHT_X - 0.12, y, z);
      scene.add(plate);
      const url = posterUrls[i];
      if (url) {
        loadMap(url, (t) => {
          mat.map = t;
          mat.emissiveMap = t;
          mat.emissiveIntensity = 0.28;
          mat.needsUpdate = true;
        });
      }
    });

    const interactives = new Map<string, THREE.Object3D>();
    const hotspots: Hotspot[] = [];
    const screenShaders: THREE.ShaderMaterial[] = [
      deskScreenMat,
      portraitScreenMat,
      gamesScreenMat,
    ];

    /* Hero: one whole-room GLB from the locked film still. Separate Meshy
       desk/monitor/printer boxes are fallbacks only if room.glb misses. */
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
    );
    gltfLoader.setDRACOLoader(dracoLoader);
    const hardenGltfMats = (root: THREE.Object3D) => {
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        /* Reconstructed mush is display-only. Invisible box proxies own hits. */
        mesh.raycast = () => {};
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const sm = m as THREE.MeshStandardMaterial;
          if (!sm || !("roughness" in sm)) continue;
          sm.envMapIntensity = 1;
          sm.roughness = Math.max(0.15, sm.roughness ?? 0.5);
          if (sm.map) sm.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
          sm.needsUpdate = true;
        }
      });
    };
    const fitGltf = (
      root: THREE.Object3D,
      targetSize: THREE.Vector3,
      yAlign: "bottom" | "center" = "bottom",
    ) => {
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const sx = targetSize.x / Math.max(size.x, 1e-4);
      const sy = targetSize.y / Math.max(size.y, 1e-4);
      const sz = targetSize.z / Math.max(size.z, 1e-4);
      const s = Math.min(sx, sy, sz);
      root.scale.setScalar(s);
      box.setFromObject(root);
      const size2 = box.getSize(new THREE.Vector3());
      const center2 = box.getCenter(new THREE.Vector3());
      root.position.x -= center2.x;
      root.position.z -= center2.z;
      if (yAlign === "bottom") root.position.y -= box.min.y;
      else root.position.y -= center2.y;
      void size2;
      void center;
    };
    const tryGltf = (
      url: string,
      onOk: (root: THREE.Group) => void,
      onFail?: () => void,
    ) => {
      gltfLoader.load(
        url,
        (gltf) => {
          hardenGltfMats(gltf.scene);
          onOk(gltf.scene);
        },
        undefined,
        () => {
          onFail?.();
        },
      );
    };

    const paintGltf = (root: THREE.Object3D, mat: THREE.Material) => {
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
    };

    const fitGltfToFloor = (
      root: THREE.Object3D,
      opts: { width?: number; height?: number; depth?: number; maxDim?: number },
    ) => {
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      let s = 1;
      if (opts.maxDim) {
        const longest = Math.max(size.x, size.y, size.z) || 1;
        s = opts.maxDim / longest;
      } else {
        const sx = opts.width && size.x > 0.01 ? opts.width / size.x : 1;
        const sy = opts.height && size.y > 0.01 ? opts.height / size.y : 1;
        const sz = opts.depth && size.z > 0.01 ? opts.depth / size.z : 1;
        s = Math.min(sx, sy, sz);
      }
      root.scale.multiplyScalar(s);
      root.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(root);
      const c = box2.getCenter(new THREE.Vector3());
      root.position.x -= c.x;
      root.position.z -= c.z;
      root.position.y -= box2.min.y;
    };

    /* -- Whole-room hero from 04-desk-still (character-still persistence) -- */
    const roomRoot = new THREE.Group();
    roomRoot.name = "RoomRoot";
    scene.add(roomRoot);
    let roomHeroOn = false;
    const hideForRoomHero: THREE.Object3D[] = [];
    const hideIfRoom = (obj: THREE.Object3D) => {
      hideForRoomHero.push(obj);
      if (roomHeroOn) obj.visible = false;
    };
    const hitMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));
    const makeHitProxy = (
      name: string,
      w: number,
      h: number,
      d: number,
      y: number,
    ) => {
      const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
      hit.name = name;
      hit.position.y = y;
      hit.userData.hitProxy = true;
      return hit;
    };
    const collectHitProxies = () => {
      const proxies: THREE.Object3D[] = [];
      for (const root of interactives.values()) {
        root.traverse((obj) => {
          if (obj.userData.hitProxy) proxies.push(obj);
        });
      }
      return proxies;
    };
    /* Film still extents. Stretch the left workbench in X only if short.
       Never uniform-scale RoomRoot to “fit” the shell. */
    const DESK_SPLIT = -1.15;
    const FILM_LEFT = -4.85;

    const liftFilmAlbedo = (root: THREE.Object3D) => {
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.raycast = () => {};
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          const sm = m as THREE.MeshStandardMaterial;
          if (!sm || !("color" in sm)) continue;
          if (sm.map) {
            sm.map.colorSpace = THREE.SRGBColorSpace;
            sm.emissiveMap = sm.map;
            sm.emissive = new THREE.Color(0xffffff);
            sm.emissiveIntensity = 0.72;
            sm.color.set(0xffffff);
            sm.roughness = 0.82;
            sm.metalness = 0.04;
          }
          sm.needsUpdate = true;
        }
      });
    };

    const extractLeftTableGroup = (hero: THREE.Object3D, leftTable: THREE.Group) => {
      const meshes: THREE.Mesh[] = [];
      hero.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry?.attributes.position) meshes.push(mesh);
      });
      const tmp = new THREE.Vector3();
      const worldX = (mesh: THREE.Mesh, i: number) => {
        const attr = mesh.geometry.attributes.position;
        if (!attr) return 0;
        tmp.fromBufferAttribute(attr, i);
        mesh.localToWorld(tmp);
        return tmp.x;
      };
      const takeSide = (geo: THREE.BufferGeometry, side: ("L" | "R")[], want: "L" | "R") => {
        const pos = geo.attributes.position;
        if (!pos) return new THREE.BufferGeometry();
        const index = geo.index;
        const idx = (t: number, k: number) => (index ? index.getX(t * 3 + k) : t * 3 + k);
        const p: number[] = [];
        const n: number[] = [];
        const u: number[] = [];
        const nr = geo.attributes.normal;
        const uv = geo.attributes.uv;
        for (let t = 0; t < side.length; t++) {
          if (side[t] !== want) continue;
          for (let k = 0; k < 3; k++) {
            const i = idx(t, k);
            p.push(pos.getX(i), pos.getY(i), pos.getZ(i));
            if (nr) n.push(nr.getX(i), nr.getY(i), nr.getZ(i));
            if (uv) u.push(uv.getX(i), uv.getY(i));
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        if (nr) g.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
        else g.computeVertexNormals();
        if (uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2));
        g.computeBoundingBox();
        g.computeBoundingSphere();
        return g;
      };

      for (const mesh of meshes) {
        const geo = mesh.geometry;
        const pos = geo.attributes.position;
        if (!pos) continue;
        const index = geo.index;
        const triCount = index ? index.count / 3 : pos.count / 3;
        const idx = (t: number, k: number) => (index ? index.getX(t * 3 + k) : t * 3 + k);
        const side: ("L" | "R")[] = [];
        let leftCount = 0;
        let rightCount = 0;
        for (let t = 0; t < triCount; t++) {
          const mx =
            (worldX(mesh, idx(t, 0)) + worldX(mesh, idx(t, 1)) + worldX(mesh, idx(t, 2))) / 3;
          if (mx < DESK_SPLIT) {
            side.push("L");
            leftCount += 1;
          } else {
            side.push("R");
            rightCount += 1;
          }
        }
        /* Whole mesh on one side — leave it on the hero. Scaling that as a
           group would X-scale the whole room. */
        if (leftCount === 0 || rightCount === 0) continue;
        const leftMesh = mesh.clone();
        leftMesh.geometry = takeSide(geo, side, "L");
        leftMesh.name = mesh.name ? `${mesh.name}_leftTable` : "leftTableMesh";
        leftMesh.raycast = () => {};
        mesh.geometry = takeSide(geo, side, "R");
        geo.dispose();
        mesh.parent?.add(leftMesh);
        leftTable.attach(leftMesh);
      }
    };

    const stretchLeftTableX = (leftTable: THREE.Group) => {
      leftTable.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(leftTable);
      if (box.isEmpty() || box.min.x <= FILM_LEFT + 0.08) return 1;
      const run = box.min.x - DESK_SPLIT;
      if (run >= -0.05) return 1;
      const sx = (FILM_LEFT - DESK_SPLIT) / run;
      const parent = leftTable.parent;
      const pivot = new THREE.Vector3(DESK_SPLIT, 0, 0);
      if (parent) parent.worldToLocal(pivot);
      leftTable.position.x = pivot.x + (leftTable.position.x - pivot.x) * sx;
      leftTable.scale.x *= sx;
      leftTable.updateMatrixWorld(true);
      return sx;
    };

    const stretchLeftVerticesX = (hero: THREE.Object3D) => {
      hero.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(hero);
      if (box.min.x <= FILM_LEFT + 0.08) return 1;
      const run = box.min.x - DESK_SPLIT;
      if (run >= -0.05) return 1;
      const stretch = (FILM_LEFT - DESK_SPLIT) / run;
      const v = new THREE.Vector3();
      hero.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh || !mesh.geometry?.attributes.position) return;
        const pos = mesh.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          mesh.localToWorld(v);
          if (v.x >= DESK_SPLIT) continue;
          v.x = DESK_SPLIT + (v.x - DESK_SPLIT) * stretch;
          mesh.worldToLocal(v);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
        pos.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeBoundingBox();
      });
      return stretch;
    };

    const roomBboxMatchesStill = (box: THREE.Box3) =>
      box.min.x <= FILM_LEFT + 0.15 &&
      Math.abs(box.min.y) <= 0.12 &&
      box.min.z <= BACK_Z + 0.25;

    const freezeRoomRoot = () => {
      roomRoot.updateMatrixWorld(true);
      roomRoot.traverse((obj) => {
        obj.updateMatrix();
        obj.matrixAutoUpdate = false;
      });
    };

    const mountRoomHero = (root: THREE.Group) => {
      if (roomHeroOn) return;
      roomHeroOn = true;
      root.name = "heroRoom";
      liftFilmAlbedo(root);

      /* Three.js is meters. Image-to-3D often ships cm or Z-up. */
      root.updateMatrixWorld(true);
      let box = new THREE.Box3().setFromObject(root);
      let size = box.getSize(new THREE.Vector3());
      let rotated = false;
      if (size.z > size.y * 1.35) {
        root.rotation.x = -Math.PI / 2;
        root.updateMatrixWorld(true);
        box.setFromObject(root);
        size = box.getSize(new THREE.Vector3());
        rotated = true;
      }
      let scaleApplied = 1;
      const longest = Math.max(size.x, size.y, size.z);
      if (longest > 20) {
        scaleApplied = 0.01;
        root.scale.multiplyScalar(0.01);
        root.updateMatrixWorld(true);
        box.setFromObject(root);
        size = box.getSize(new THREE.Vector3());
      }

      /* Sit on the floor; park the back of the mesh on the room wall.
         Do not uniform-scale the whole room to “fit.” */
      root.position.y -= box.min.y;
      root.updateMatrixWorld(true);
      box.setFromObject(root);
      root.position.z += BACK_Z + 0.04 - box.min.z;

      roomRoot.add(root);
      const leftTable = new THREE.Group();
      leftTable.name = "leftTable";
      roomRoot.add(leftTable);
      extractLeftTableGroup(root, leftTable);
      let leftStretch = 1;
      if (leftTable.children.length > 0) {
        leftStretch = stretchLeftTableX(leftTable);
      } else {
        leftStretch = stretchLeftVerticesX(root);
      }

      roomRoot.updateMatrixWorld(true);
      const frozen = new THREE.Box3().setFromObject(roomRoot);
      const matched = roomBboxMatchesStill(frozen);
      if (matched) freezeRoomRoot();
      const frozenSize = frozen.getSize(new THREE.Vector3());
      console.info("[RoomRoot]", {
        min: frozen.min.toArray(),
        max: frozen.max.toArray(),
        size: frozenSize.toArray(),
        scaleApplied,
        leftStretch,
        rotated,
        matched,
        frozen: matched,
      });

      for (const o of hideForRoomHero) o.visible = false;
    };
    tryGltf("/experience/room/room.glb", mountRoomHero);

    /* -- Desk (fallback boxes / isolated GLBs if the room hero misses) -- */
    const desk = new THREE.Group();
    desk.position.set(0, 0, -2.75);

    const deskBody = new THREE.Group();
    deskBody.name = "deskBody";
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.07, 1.05), woodMat);
    deskTop.position.y = 0.74;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskBody.add(deskTop);

    /* Black T-legs — hidden once the scanned desk GLB lands */
    for (const x of [-1.05, 1.05]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), blackMetal);
      leg.position.set(x, 0.36, 0);
      leg.castShadow = true;
      deskBody.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.1), blackMetal);
      foot.position.set(x, 0.02, 0);
      deskBody.add(foot);
    }
    desk.add(deskBody);

    let deskGltfOn = false;
    const mountDeskGltf = (root: THREE.Group) => {
      if (roomHeroOn || deskGltfOn) return;
      deskGltfOn = true;
      deskBody.visible = false;
      fitGltfToFloor(root, { width: 2.55, depth: 1.12, height: 0.76 });
      root.position.z += 0.02;
      desk.add(root);
      hideIfRoom(root);
    };
    /* Isolated furniture GLBs — skipped by mountDeskGltf once room.glb lands */
    tryGltf("/experience/room/desk.glb", mountDeskGltf, () => {
      tryGltf("/experience/room/office_desk.glb", mountDeskGltf, () => {
        tryGltf("/experience/room/desk/wooden_table_02_2k.gltf", mountDeskGltf);
      });
    });

    /* Ultrawide + portrait — photoreal monitor GLB, emissive film screens */
    const monitorBezel = trackMat(
      makeMat(0x0e1116, { roughness: 0.35, metalness: 0.4 }),
    );
    const monitorPlastic = trackMat(
      makeMat(0x14181e, { roughness: 0.42, metalness: 0.35, envMapIntensity: 1.1 }),
    );
    /* Single black pole-arm — film dual-monitor mount */
    const armPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.024, 0.62, 12),
      blackMetal,
    );
    armPole.position.set(0.22, 1.06, -0.34);
    armPole.castShadow = true;
    desk.add(armPole);
    const armBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.03, 0.03),
      blackMetal,
    );
    armBar.position.set(0.22, 1.36, -0.32);
    desk.add(armBar);

    const ultraBezel = new THREE.Mesh(
      new THREE.BoxGeometry(1.28, 0.62, 0.05),
      monitorBezel,
    );
    ultraBezel.position.set(-0.15, 1.28, -0.28);
    ultraBezel.castShadow = true;
    desk.add(ultraBezel);
    const ultraScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 0.52),
      deskScreenMat,
    );
    ultraScreen.position.set(-0.15, 1.28, -0.252);
    desk.add(ultraScreen);

    const portBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.72, 0.05),
      monitorBezel,
    );
    portBezel.position.set(0.85, 1.32, -0.28);
    portBezel.castShadow = true;
    desk.add(portBezel);
    const portScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.62),
      portraitScreenMat,
    );
    portScreen.position.set(0.85, 1.32, -0.252);
    desk.add(portScreen);

    const mountDeskMonitor = (
      root: THREE.Group,
      opts: { x: number; y: number; z: number; portrait?: boolean; width: number; height: number },
    ) => {
      paintGltf(root, monitorPlastic);
      if (opts.portrait) {
        root.rotation.z = Math.PI / 2;
        fitGltfToFloor(root, { width: opts.height, height: opts.width, depth: 0.28 });
      } else {
        fitGltfToFloor(root, { width: opts.width, height: opts.height, depth: 0.28 });
      }
      root.position.set(opts.x, opts.y, opts.z);
      desk.add(root);
    };
    const mountHunyuanDeskMonitors = () => {
      if (roomHeroOn) return;
      tryGltf("/experience/room/flat_monitor.glb", (root) => {
        if (roomHeroOn) return;
        ultraBezel.visible = false;
        mountDeskMonitor(root, {
          x: -0.15,
          y: 0.78,
          z: -0.22,
          width: 1.28,
          height: 0.72,
        });
        hideIfRoom(root);
      });
      tryGltf("/experience/room/flat_monitor.glb", (root) => {
        if (roomHeroOn) return;
        portBezel.visible = false;
        mountDeskMonitor(root, {
          x: 0.85,
          y: 0.78,
          z: -0.22,
          portrait: true,
          width: 0.42,
          height: 0.78,
        });
        hideIfRoom(root);
      });
    };

    /* Light bar on ultrawide */
    const lightBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.03, 0.04),
      trackMat(
        makeMat(0xfff5e6, {
          emissive: 0xffd9a8,
          emissiveIntensity: 1.4,
          roughness: 0.4,
        }),
      ),
    );
    lightBar.position.set(-0.15, 1.62, -0.28);
    desk.add(lightBar);

    /* Desk mat + peripherals */
    const matPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.01, 0.42),
      trackMat(makeMat(0x12151a, { roughness: 0.9 })),
    );
    matPad.position.set(0, 0.785, 0.12);
    desk.add(matPad);
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.012, 0.13),
      trackMat(makeMat(0xc5c8ce, { roughness: 0.35, metalness: 0.45 })),
    );
    keyboard.position.set(-0.05, 0.8, 0.15);
    desk.add(keyboard);
    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.03, 0.018, 20),
      trackMat(makeMat(0x2a2e34, { roughness: 0.4, metalness: 0.5 })),
    );
    dial.position.set(-0.32, 0.8, 0.12);
    desk.add(dial);
    const mouse = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.025, 0.11),
      trackMat(makeMat(0x2a2e34, { roughness: 0.4 })),
    );
    mouse.position.set(0.32, 0.8, 0.14);
    desk.add(mouse);

    /* Tiny plants — Poly Haven succulent GLB, procedural pots as fallback */
    const plantFallback = new THREE.Group();
    for (const px of [-0.85, -0.68]) {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.035, 0.06, 10),
        trackMat(makeMat(0xe6e4de, { roughness: 0.55 })),
      );
      pot.position.set(px, 0.81, -0.15);
      plantFallback.add(pot);
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        trackMat(
          makeMat(0x3d6b4f, {
            roughness: 0.75,
            emissive: 0x1a3324,
            emissiveIntensity: 0.15,
          }),
        ),
      );
      leaf.position.set(px, 0.88, -0.15);
      leaf.scale.set(1, 0.7, 1);
      plantFallback.add(leaf);
    }
    desk.add(plantFallback);
    for (const px of [-0.92, -0.7]) {
      tryGltf("/experience/room/potted_plant_04/potted_plant_04_1k.gltf", (root) => {
        if (roomHeroOn) return;
        plantFallback.visible = false;
        fitGltfToFloor(root, { maxDim: 0.16 });
        root.position.set(px, 0.78, -0.18);
        desk.add(root);
        hideIfRoom(root);
      });
    }

    /* Chair — dark Aeron-ish mesh, not a rectangular slab (old WebGL frame) */
    const chair = new THREE.Group();
    chair.position.set(0, 0, 0.92);
    const meshMat = trackMat(makeMat(0x1a1c20, { roughness: 0.78, metalness: 0.08 }));
    const star = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.04, 5),
      blackMetal,
    );
    star.position.y = 0.06;
    chair.add(star);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.035, 0.38, 10),
      blackMetal,
    );
    post.position.y = 0.26;
    chair.add(post);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.46), meshMat);
    seat.position.y = 0.48;
    seat.scale.set(1, 1, 0.92);
    seat.castShadow = true;
    chair.add(seat);
    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.58, 0.05),
      meshMat,
    );
    backrest.position.set(0, 0.86, -0.2);
    backrest.rotation.x = -0.12;
    backrest.castShadow = true;
    chair.add(backrest);
    const lumbar = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.018, 8, 16, Math.PI),
      blackMetal,
    );
    lumbar.position.set(0, 0.62, -0.16);
    lumbar.rotation.y = Math.PI;
    chair.add(lumbar);
    for (const x of [-0.22, 0.22]) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.28, 0.08),
        blackMetal,
      );
      arm.position.set(x, 0.64, 0.02);
      chair.add(arm);
    }
    desk.add(chair);

    /* Speakers on stands - film left/right of desk */
    const mkSpeaker = (x: number) => {
      const g = new THREE.Group();
      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.03, 1.05, 10),
        blackMetal,
      );
      stand.position.y = 0.52;
      g.add(stand);
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.34, 0.2),
        trackMat(makeMat(0xf0f0ec, { roughness: 0.55 })),
      );
      body.position.y = 1.2;
      body.castShadow = true;
      g.add(body);
      const driver = new THREE.Mesh(
        new THREE.CircleGeometry(0.06, 16),
        trackMat(makeMat(0x1a1a1a, { roughness: 0.4 })),
      );
      driver.position.set(0, 1.22, 0.102);
      g.add(driver);
      g.position.set(x, 0, 0.15);
      desk.add(g);
    };
    mkSpeaker(-1.45);
    mkSpeaker(1.45);

    /* Film wants ultrawide + portrait + light bar. Meshy monitors.glb is a
       landscape pair that hides the bar — skip it and keep the film layout. */
    mountHunyuanDeskMonitors();
    /* Keep the dark Aeron-ish chair. office_chair.glb is Khronos SheenChair
       (orange lounge silhouette) and reads as the wrong film object. */


    const deskVisuals = new THREE.Group();
    deskVisuals.name = "deskVisuals";
    for (const child of [...desk.children]) deskVisuals.add(child);
    desk.add(deskVisuals);
    hideIfRoom(deskVisuals);
    desk.add(makeHitProxy("deskHit", 2.6, 1.35, 1.15, 0.85));
    scene.add(desk);
    interactives.set("desk", desk);
    hotspots.push({
      id: "desk",
      label: "Desk",
      prompt: "Sit back down at the desktop",
      position: new THREE.Vector3(0, 1.2, -2.05),
    });

    /* -- 3D Printer bay — LEFT of the main desk, same film depth ---------- */
    const printer = new THREE.Group();
    /* Film: printer on a surface LEFT of the main desk, same depth */
    printer.position.set(-2.55, 0, -2.55);

    const printerFurniture = new THREE.Group();
    printerFurniture.name = "printerFurniture";
    const cabinet = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.72, 0.7),
      cabinetMat,
    );
    cabinet.position.y = 0.36;
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    printerFurniture.add(cabinet);
    /* Drawer lines */
    for (const dy of [0.18, 0.36, 0.54]) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 0.01, 0.01),
        blackMetal,
      );
      line.position.set(0, dy, 0.355);
      printerFurniture.add(line);
    }

    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.75), woodMat);
    bench.position.y = 0.75;
    bench.castShadow = true;
    bench.receiveShadow = true;
    printerFurniture.add(bench);
    printer.add(printerFurniture);
    hideIfRoom(printerFurniture);

    tryGltf("/experience/room/cabinet/drawer_cabinet_2k.gltf", (root) => {
      if (roomHeroOn) return;
      printerFurniture.visible = false;
      paintGltf(root, cabinetMat);
      fitGltfToFloor(root, { width: 1.2, depth: 0.7, height: 0.82 });
      printer.add(root);
      hideIfRoom(root);
      const woodTop = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.04, 0.76), woodMat);
      woodTop.position.y = 0.8;
      woodTop.castShadow = true;
      printer.add(woodTop);
      hideIfRoom(woodTop);
    });

    /* Enclosed printer body — Hunyuan mesh from isolated Bambu product ref */
    const printerShell = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x3a424c,
        metalness: 0.62,
        roughness: 0.34,
        clearcoat: 0.18,
        clearcoatRoughness: 0.4,
        envMapIntensity: 1.15,
      }),
    );
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.78, 0.62),
      trackMat(
        makeMat(0x1c2430, { map: metalMap, metalness: 0.5, roughness: 0.38 }),
      ),
    );
    frame.position.set(0, 1.16, 0);
    frame.castShadow = true;
    frame.name = "printerBoxFrame";
    printer.add(frame);
    hideIfRoom(frame);
    const mountEnclosedPrinter = (root: THREE.Group) => {
      if (roomHeroOn) return;
      frame.visible = false;
      glass.visible = false;
      bed.visible = false;
      gantry.visible = false;
      paintGltf(root, printerShell);
      fitGltfToFloor(root, { width: 0.78, depth: 0.68, height: 0.82 });
      root.position.y += 0.78;
      root.rotation.y = Math.PI * 0.08;
      printer.add(root);
      hideIfRoom(root);
    };

    /* Glass door suggestion */
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.55),
      trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x88aacc,
          transparent: true,
          opacity: 0.18,
          metalness: 0.8,
          roughness: 0.15,
        }),
      ),
    );
    glass.position.set(0, 1.18, 0.32);
    glass.name = "printerBoxGlass";
    printer.add(glass);
    hideIfRoom(glass);

    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.03, 0.45),
      trackMat(makeMat(0x2a3342, { metalness: 0.55, roughness: 0.35 })),
    );
    bed.position.set(0, 0.92, 0);
    bed.name = "printerBoxBed";
    printer.add(bed);
    hideIfRoom(bed);

    const gantry = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.04, 0.06),
      trackMat(makeMat(0x3a4558, { metalness: 0.6, roughness: 0.3 })),
    );
    gantry.position.set(0, 1.42, 0);
    gantry.name = "printerBoxGantry";
    printer.add(gantry);
    hideIfRoom(gantry);

    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.012, 0.1, 10),
      trackMat(
        makeMat(0xffb347, { emissive: 0xff7a18, emissiveIntensity: 0.55 }),
      ),
    );
    nozzle.position.set(0, 1.32, 0);
    nozzle.name = "nozzle";
    printer.add(nozzle);

    const mark = createShift9Mark();
    mark.position.set(0, 0.96, 0);
    mark.visible = false;
    mark.name = "printMark";
    printer.add(mark);

    /* Pegboard above printer */
    const peg = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.85, 0.04),
      trackMat(makeMat(0x12151c, { roughness: 0.7, metalness: 0.35 })),
    );
    peg.position.set(0, 2.15, -0.28);
    printer.add(peg);
    hideIfRoom(peg);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const bin = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.1, 0.1),
          trackMat(makeMat(0x4a5560, { roughness: 0.6 })),
        );
        bin.position.set(-0.4 + col * 0.2, 1.95 + row * 0.18, -0.2);
        printer.add(bin);
        hideIfRoom(bin);
      }
    }

    /* Cool tube light fixture */
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.95, 12),
      trackMat(
        makeMat(0xf2f6ff, {
          emissive: 0xdde8ff,
          emissiveIntensity: 1.2,
          roughness: 0.3,
        }),
      ),
    );
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, 2.65, 0.1);
    printer.add(tube);
    hideIfRoom(tube);

    const printerHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.68, 32),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x4db8ff,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
        }),
      ),
    );
    printerHalo.rotation.x = -Math.PI / 2;
    printerHalo.position.y = 0.02;
    printer.add(printerHalo);
    hideIfRoom(printerHalo);

    /* Isolated Bambu mesh on the cabinet — Meshy printer.glb was built from a
       still that already includes the cabinet, so stacking it here reads as a
       black cube on a box. Keep printer.glb on disk for later remount. */
    tryGltf("/experience/room/enclosed_printer.glb", mountEnclosedPrinter);

    printer.add(makeHitProxy("printerHit", 1.05, 1.55, 0.88, 1.05));
    scene.add(printer);
    interactives.set("printer", printer);
    hotspots.push({
      id: "printer",
      label: "3D Printer",
      prompt: "Print a Shift-9 souvenir",
      position: new THREE.Vector3(-2.55, 1.45, -2.55),
    });

    /* -- Lumen: two film grid cubes IMMEDIATELY RIGHT of the main desk --- */
    const lumen = new THREE.Group();
    lumen.position.set(1.72, 0, -2.4);

    const boxes = new THREE.Group();
    boxes.name = "lumenBoxes";
    const stack: THREE.Mesh[] = [];
    /* Film still: two large pale cubes with a faint white grid, chair-height */
    const layout: [number, number, number, number, number, number][] = [
      [0.56, 0.56, 0.56, 0.0, 0.28, 0.0],
      [0.48, 0.48, 0.48, 0.03, 0.8, 0.03],
    ];
    for (const [w, h, d, x, y, z] of layout) {
      const lm = trackMat(createLumenMaterial(gridMap, lumenProjectTex));
      lumenMats.push(lm);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lm);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      boxes.add(m);
      stack.push(m);
    }
    lumen.add(boxes);

    const calDots: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 10, 10),
        trackMat(new THREE.MeshBasicMaterial({ color: 0x39ff14 })),
      );
      dot.visible = false;
      lumen.add(dot);
      calDots.push(dot);
    }

    lumen.add(makeHitProxy("lumenHit", 0.72, 1.2, 0.72, 0.58));
    scene.add(lumen);
    interactives.set("lumen", lumen);
    hotspots.push({
      id: "lumen",
      label: "Lumen",
      prompt: "Aim / calibrate the projection",
      position: new THREE.Vector3(1.72, 0.7, -2.4),
    });

    /* -- Stub props - richer silhouettes, film/docs-faithful ----------- */
    const mkStub = (
      id: PropId,
      label: string,
      prompt: string,
      pos: [number, number, number],
      build: (g: THREE.Group) => void,
      haloColor: number,
      showHalo = true,
    ) => {
      const g = new THREE.Group();
      g.position.set(...pos);
      build(g);
      g.updateMatrixWorld(true);
      const stubBox = new THREE.Box3().setFromObject(g);
      if (!stubBox.isEmpty()) {
        const sz = stubBox.getSize(new THREE.Vector3());
        const ctr = stubBox.getCenter(new THREE.Vector3());
        g.worldToLocal(ctr);
        const hit = makeHitProxy(
          `${id}Hit`,
          Math.max(sz.x, 0.4),
          Math.max(sz.y, 0.4),
          Math.max(sz.z, 0.4),
          0,
        );
        hit.position.copy(ctr);
        g.add(hit);
      }
      if (showHalo) {
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(0.45, 0.58, 28),
          trackMat(
            new THREE.MeshBasicMaterial({
              color: haloColor,
              transparent: true,
              opacity: 0.28,
              side: THREE.DoubleSide,
            }),
          ),
        );
        halo.rotation.x = -Math.PI / 2;
        halo.position.y = 0.02;
        halo.name = "halo";
        g.add(halo);
      }
      scene.add(g);
      interactives.set(id, g);
      hotspots.push({
        id,
        label,
        prompt,
        position: new THREE.Vector3(pos[0], 1.3, pos[2]),
      });
      return g;
    };

    mkStub(
      "instrument",
      "INSTRUMENT",
      "Coming soon - a short pulse",
      [-2.15, 0, 1.85],
      (g) => {
        /* Face the desk / film camera (into the room, not the entrance) */
        g.rotation.y = Math.PI;

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.55, 0.22, 0.62),
          trackMat(
            makeMat(0x0c1018, {
              emissive: 0x1f6feb,
              emissiveIntensity: 0.22,
              metalness: 0.6,
              roughness: 0.32,
            }),
          ),
        );
        body.position.y = 0.72;
        body.castShadow = true;
        body.name = "instrumentBody";
        g.add(body);
        /* Keybed suggestion */
        for (let i = 0; i < 12; i++) {
          const key = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.02, 0.28),
            trackMat(
              makeMat(i % 3 === 1 ? 0x0a0c10 : 0xe8eef8, {
                emissive: 0x1f6feb,
                emissiveIntensity: i % 4 === 0 ? 0.35 : 0.05,
                roughness: 0.4,
              }),
            ),
          );
          key.position.set(-0.55 + i * 0.1, 0.84, 0.08);
          g.add(key);
        }
        const stand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.6, 8),
          blackMetal,
        );
        stand.position.set(0, 0.3, 0);
        g.add(stand);
      },
      0x4dabf7,
    );

    /* Games: wall-mounted monitor on the RIGHT wall — not an arcade cabinet.
       Desktop-monitor GLB includes a stand and reads as a pole-box in the room.
       Flush PBR panel + Hunyuan screen mesh scaled as a thin TV. */
    mkStub(
      "games",
      "Games",
      "Coming soon - a playable wall screen",
      [RIGHT_X - 0.045, 0, 0.2],
      (g) => {
        g.rotation.y = -Math.PI / 2;
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(1.52, 0.92, 0.03),
          trackMat(
            makeMat(0x0a0c10, { roughness: 0.55, metalness: 0.35 }),
          ),
        );
        plate.position.set(0, 1.52, -0.02);
        g.add(plate);
        const bezel = new THREE.Mesh(
          new THREE.BoxGeometry(1.42, 0.8, 0.045),
          trackMat(
            new THREE.MeshPhysicalMaterial({
              color: 0x101216,
              metalness: 0.55,
              roughness: 0.28,
              clearcoat: 0.35,
              clearcoatRoughness: 0.25,
              envMapIntensity: 1.15,
            }),
          ),
        );
        bezel.position.set(0, 1.52, 0);
        bezel.castShadow = true;
        bezel.name = "gamesBezel";
        g.add(bezel);
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(1.3, 0.7),
          gamesScreenMat,
        );
        screen.position.set(0, 1.52, 0.026);
        screen.name = "gamesScreen";
        g.add(screen);
        for (const y of [1.28, 1.76]) {
          const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.08, 10),
            blackMetal,
          );
          arm.rotation.x = Math.PI / 2;
          arm.position.set(0, y, -0.05);
          g.add(arm);
        }
        /* Do not mount flat_monitor.glb here — it is a desktop monitor with a
           stand and reads as a pole-box in the room. Desk dual screens use it. */
      },
      0xff7043,
      false,
    );

    mkStub(
      "omni",
      "Omni-3D",
      "Coming soon - hologram glitch",
      [3.25, 0, 1.15],
      (g) => {
        /* Face the desk / spawn, not the back wall */
        g.rotation.y = Math.PI;

        const ped = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.45, 0.18, 24),
          trackMat(
            makeMat(0x1a2030, { map: metalMap, metalness: 0.55, roughness: 0.35 }),
          ),
        );
        ped.position.y = 0.09;
        ped.castShadow = true;
        g.add(ped);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.32, 0.015, 8, 40),
          trackMat(
            makeMat(0x7dd3fc, {
              emissive: 0x0ea5e9,
              emissiveIntensity: 0.6,
              transparent: true,
              opacity: 0.7,
            }),
          ),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.72;
        g.add(ring);
        const holo = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.28, 1),
          trackMat(
            new THREE.MeshStandardMaterial({
              color: 0x7dd3fc,
              wireframe: true,
              emissive: 0x0ea5e9,
              emissiveIntensity: 0.45,
              transparent: true,
              opacity: 0.75,
            }),
          ),
        );
        holo.position.y = 0.72;
        holo.name = "omniHolo";
        g.add(holo);
      },
      0x7dd3fc,
    );

    mkStub(
      "arm",
      "Automation Arm",
      "Coming soon - one precise nod",
      [4.05, 0, 1.65],
      (g) => {
        /* Face into the room from the right / entrance side */
        g.rotation.y = -Math.PI / 2;

        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.36, 0.2, 20),
          trackMat(
            makeMat(0xd0d5dd, { map: metalMap, metalness: 0.7, roughness: 0.28 }),
          ),
        );
        base.position.y = 0.1;
        base.castShadow = true;
        g.add(base);
        const lower = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.95, 0.14),
          trackMat(
            makeMat(0xc5ccd6, { map: metalMap, metalness: 0.75, roughness: 0.25 }),
          ),
        );
        lower.position.set(0, 0.68, 0);
        lower.name = "armLower";
        lower.castShadow = true;
        g.add(lower);
        const elbow = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 12, 12),
          trackMat(makeMat(0x9aa3b2, { metalness: 0.8, roughness: 0.22 })),
        );
        elbow.position.set(0, 1.18, 0);
        g.add(elbow);
        const upper = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.55, 0.12),
          trackMat(makeMat(0xc5ccd6, { metalness: 0.75, roughness: 0.25 })),
        );
        upper.position.set(0.18, 1.4, 0.1);
        upper.rotation.z = -0.7;
        g.add(upper);
        const claw = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.07, 0.16),
          trackMat(makeMat(0x9aa3b2, { metalness: 0.8, roughness: 0.22 })),
        );
        claw.position.set(0.42, 1.55, 0.22);
        g.add(claw);
      },
      0xc0c8d4,
    );

    /* -- Controls ------------------------------------------------------ */
    const keys = new Set<string>();
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    euler.setFromQuaternion(camera.quaternion);
    /* Look toward desk on spawn */
    euler.y = 0;
    euler.x = -0.12;
    camera.quaternion.setFromEuler(euler);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let printT = 0;
    let printActive = false;
    let lumenStep = 0;
    let lumenMapped = false;
    let mapPulse = 0;
    let armNod = 0;
    let omniSpin = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === "KeyE" || e.code === "Enter") {
        tryInteract();
      }
      if (e.code === "Escape") onSitDown();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const sens = reducedMotion ? LOOK_SENS * 0.55 : LOOK_SENS;
      euler.y -= dx * sens;
      euler.x -= dy * sens;
      euler.x = Math.max(-1.2, Math.min(1.2, euler.x));
      camera.quaternion.setFromEuler(euler);
    };

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(0, 0);

    const nearestHotspot = (): Hotspot | null => {
      let best: Hotspot | null = null;
      let bestD = INTERACT_RANGE;
      for (const h of hotspots) {
        const d = camera.position.distanceTo(h.position);
        if (d < bestD) {
          bestD = d;
          best = h;
        }
      }
      return best;
    };

    const startPrint = () => {
      if (propsRef.current.printer !== "idle") return;
      printActive = true;
      printT = 0;
      setPropsState((p) => ({ ...p, printer: "printing" }));
      setHint("Printing the Shift-9 mark…");
      showToast("3D printer: extruding the studio mark");
      const markObj = printer.getObjectByName("printMark");
      if (markObj) {
        markObj.visible = true;
        markObj.scale.setScalar(0.05);
      }
    };

    const advanceLumen = () => {
      const st = propsRef.current.lumen;
      if (st === "mapped") {
        showToast("Lumen pass already unlocked - the boxes stay mapped");
        return;
      }
      if (st === "idle") {
        setPropsState((p) => ({ ...p, lumen: "calibrating" }));
        lumenStep = 0;
        setHint("Lumen: click again to drop calibration points on the stack");
        showToast("Lumen online - calibrate the box faces");
        return;
      }
      const corners = [
        new THREE.Vector3(-0.28, 0.04, 0.28),
        new THREE.Vector3(0.28, 0.04, 0.28),
        new THREE.Vector3(0.27, 1.04, 0.27),
        new THREE.Vector3(-0.21, 1.04, -0.21),
      ];
      if (lumenStep < 4) {
        const dot = calDots[lumenStep];
        if (dot) {
          dot.visible = true;
          dot.position.copy(corners[lumenStep]!);
        }
        lumenStep += 1;
        setHint(`Lumen: calibration ${lumenStep}/4`);
        if (lumenStep < 4) {
          showToast(`Corner ${lumenStep} locked`);
          return;
        }
      }
      lumenMapped = true;
      setPropsState((p) => ({ ...p, lumen: "mapped" }));
      setHint("Mapped pass unlocked - watch the boxes take the show");
      showToast("Lumen: mapped pass unlocked");
      for (const mesh of stack) {
        const mat = mesh.material as THREE.ShaderMaterial;
        mat.uniforms.uMapped!.value = 1;
      }
    };

    const stubPeek = (id: PropId, message: string) => {
      setPropsState((p) => ({ ...p, [id]: "peeked" } as PropState));
      showToast(message);
      if (id === "arm") armNod = 1;
      if (id === "omni") omniSpin = 1;
      if (id === "instrument") {
        const body = interactives
          .get("instrument")
          ?.getObjectByName("instrumentBody") as THREE.Mesh | undefined;
        const mat = body?.material as THREE.MeshStandardMaterial | undefined;
        if (mat) mat.emissiveIntensity = 0.85;
      }
      if (id === "games") {
        gamesScreenMat.uniforms.uGlow!.value = 1.85;
        gamesScreenMat.uniforms.uScan!.value = 1.6;
      }
    };

    const tryInteract = () => {
      /* Crosshair vs invisible boxes first — never pick by distance onto the
         wrong stub (spawn used to fire INSTRUMENT while looking at the desk). */
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(collectHitProxies(), false);
      if (hits.length) {
        let obj: THREE.Object3D | null = hits[0]!.object;
        let found: PropId | null = null;
        while (obj) {
          for (const [id, root] of interactives) {
            if (obj === root) {
              found = id as PropId;
              break;
            }
          }
          if (found) break;
          obj = obj.parent;
        }
        if (found) {
          runProp(found);
          return;
        }
      }
      const near = nearestHotspot();
      if (!near) {
        showToast("Move closer to a glowing ring, then click or press E");
        return;
      }
      runProp(near.id);
    };

    const runProp = (id: PropId) => {
      if (id === "desk") {
        onSitDown();
        return;
      }
      if (id === "printer") {
        if (propsRef.current.printer === "souvenir") {
          showToast("Souvenir already printed - yours to keep this session");
          return;
        }
        if (propsRef.current.printer === "printing") return;
        startPrint();
        return;
      }
      if (id === "lumen") {
        advanceLumen();
        return;
      }
      if (id === "instrument") {
        stubPeek("instrument", "INSTRUMENT hums once - full patch coming soon");
        return;
      }
      if (id === "games") {
        stubPeek("games", "Games wall screen flickers - playable build soon");

        return;
      }
      if (id === "omni") {
        stubPeek("omni", "Omni-3D glitches into wireframe - build in progress");
        return;
      }
      if (id === "arm") {
        stubPeek("arm", "Automation arm nods once - live cell soon");
        return;
      }
    };

    const onClick = () => {
      tryInteract();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("click", onClick);

    const clock = new THREE.Clock();
    let raf = 0;
    let cancelled = false;
    const forward = new THREE.Vector3();
    const rightVec = new THREE.Vector3();
    const wish = new THREE.Vector3();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = Math.max(mount.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);

    const projectLabels = () => {
      const next: {
        id: PropId;
        label: string;
        x: number;
        y: number;
        near: boolean;
      }[] = [];
      const near = nearestHotspot();
      setNearId(near?.id ?? null);
      for (const h of hotspots) {
        const v = h.position.clone().project(camera);
        if (v.z > 1) continue;
        const x = (v.x * 0.5 + 0.5) * mount.clientWidth;
        const y = (-v.y * 0.5 + 0.5) * mount.clientHeight;
        if (x < -40 || y < -40 || x > mount.clientWidth + 40 || y > mount.clientHeight + 40)
          continue;
        next.push({
          id: h.id,
          label: h.label,
          x,
          y,
          near: near?.id === h.id,
        });
      }
      setLabels(next);
      if (near) {
        setHint((prev) => {
          const line =
            near.id === "desk"
              ? "At the desk - click or press E to sit down"
              : `${near.label}: ${near.prompt} * E / click`;
          return prev === line ? prev : line;
        });
      }
    };

    const tick = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      for (const sm of screenShaders) {
        sm.uniforms.uTime!.value = t;
      }
      for (const lm of lumenMats) {
        lm.uniforms.uTime!.value = t;
      }

      /* Movement */
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      rightVec.set(1, 0, 0).applyQuaternion(camera.quaternion);
      rightVec.y = 0;
      rightVec.normalize();
      wish.set(0, 0, 0);
      if (keys.has("KeyW") || keys.has("ArrowUp")) wish.add(forward);
      if (keys.has("KeyS") || keys.has("ArrowDown")) wish.sub(forward);
      if (keys.has("KeyD") || keys.has("ArrowRight")) wish.add(rightVec);
      if (keys.has("KeyA") || keys.has("ArrowLeft")) wish.sub(rightVec);
      if (wish.lengthSq() > 0) {
        wish.normalize().multiplyScalar(MOVE_SPEED * (reducedMotion ? 0.7 : 1) * dt);
        camera.position.add(wish);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -4.6, 4.6);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -3.35, 3.2);
        camera.position.y = 1.52;
      }

      printerHalo.rotation.z = t * 0.6;
      const omni = interactives.get("omni")?.getObjectByName("omniHolo");
      if (omni) {
        omni.rotation.y = t * (0.4 + omniSpin * 1.8);
        omni.position.y = 0.72 + Math.sin(t * 2) * 0.04;
      }
      if (armNod > 0) {
        armNod = Math.max(0, armNod - dt);
        const lower = interactives.get("arm")?.getObjectByName("armLower");
        if (lower) lower.rotation.z = Math.sin((1 - armNod) * Math.PI) * 0.35;
      }

      if (printActive) {
        printT += dt;
        const nozzleObj = printer.getObjectByName("nozzle");
        const markObj = printer.getObjectByName("printMark");
        if (nozzleObj) {
          nozzleObj.position.y = 1.32 - Math.sin(Math.min(printT, 1.2) * Math.PI) * 0.28;
          nozzleObj.position.x = Math.sin(printT * 6) * 0.12;
        }
        if (markObj) {
          const grow = Math.min(1, Math.max(0, (printT - 0.4) / 1.6));
          markObj.scale.setScalar(0.05 + grow * 0.8);
          markObj.visible = true;
        }
        if (printT > 2.4) {
          printActive = false;
          setPropsState((p) => ({ ...p, printer: "souvenir" }));
          setHint("Souvenir printed - find Lumen next, or sit back down");
          showToast("Souvenir unlocked: Shift-9 mark");
        }
      }

      if (lumenMapped) {
        mapPulse += dt;
        lumenBeam.intensity = 2.0 + Math.sin(mapPulse * 4) * 0.55;
      }

      projectLabels();
      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("click", onClick);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      dracoLoader.dispose();
      renderer.dispose();
      pmrem.dispose();
      if (scene.environment) scene.environment.dispose();
      for (const t of disposableTex) t.dispose();
      for (const m of disposableMat) m.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
    };
  }, [onSitDown, reducedMotion, showToast]);

  return (
    <div className={s.root} ref={mountRef} role="application" aria-label="Studio room explore">
      <canvas className={s.canvas} ref={canvasRef} />
      <div className={s.vignette} aria-hidden="true" />
      <div className={s.hud}>
        <div className={s.topBar}>
          <p className={s.title}>
            Room explore
            <strong>Stand up * look around the studio</strong>
          </p>
          <div className={s.actions}>
            <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={onSitDown}>
              Sit down → desktop
            </button>
          </div>
        </div>

        <div className={s.crosshair} aria-hidden="true" />

        {labels.map((l) => (
          <div
            key={l.id}
            className={`${s.hotspotLabel} ${l.near || nearId === l.id ? s.hotspotLabelNear : ""}`}
            style={{ left: l.x, top: l.y }}
          >
            {l.label}
          </div>
        ))}

        <div className={s.badges} aria-live="polite">
          <span className={`${s.badge} ${propsState.printer === "souvenir" ? s.badgeOn : ""}`}>
            <i className={s.dot} /> Printer {propsState.printer === "souvenir" ? "souvenir" : "ready"}
          </span>
          <span className={`${s.badge} ${propsState.lumen === "mapped" ? s.badgeOn : ""}`}>
            <i className={s.dot} /> Lumen {propsState.lumen === "mapped" ? "mapped" : propsState.lumen === "calibrating" ? "calibrating" : "ready"}
          </span>
        </div>

        {unlockedCount >= STUDIO_CUE_AFTER ? (
          <div className={s.studioCue}>
            <p>
              You have poked around the room. The twelve set-pieces live on the
              uncut dolly.
            </p>
            <a href={studioHref}>Enter the live studio →</a>
          </div>
        ) : null}

        {toast ? <div className={s.toast} role="status">{toast}</div> : null}

        <div className={s.hint}>
          {hint}
          <div style={{ marginTop: "0.35rem", opacity: 0.7 }}>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd> move * drag look * <kbd>E</kbd> interact * <kbd>Esc</kbd> sit
          </div>
        </div>
      </div>
    </div>
  );
}
