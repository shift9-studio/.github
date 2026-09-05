"use client";

/* ------------------------------------------------------------------------
   ROOM EXPLORE - live WebGL walkaround of the Shift-9 studio room.
   Visuals aim at the opening desk film: light oak desk, dual monitors,
   printer on tool cabinet + pegboard, whitebox Lumen cubes, gallery wall,
   textured floor/walls, custom screen + projection shaders (questopia-
   style blendLighten). Still procedural geometry until a Blender-baked
   hero GLB lands - honest about that gap.
   ------------------------------------------------------------------------ */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import s from "./RoomExplore.module.css";

type PropId =
  | "printer"
  | "lumen"
  | "instrument"
  | "arcade"
  | "omni"
  | "arm"
  | "desk";

type PropState = {
  printer: "idle" | "printing" | "souvenir";
  lumen: "idle" | "calibrating" | "mapped";
  instrument: "idle" | "peeked";
  arcade: "idle" | "peeked";
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
  arcade: "idle",
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
  return canvasTex(
    256,
    (ctx, size) => {
      ctx.fillStyle = "#f4f4f0";
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2;
      const cells = 10;
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
  base *= mix(0.75, 1.0, vig);
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

  if (uHasProject > 0.5) {
    vec2 puv = fract(vWorldPos.xz * 0.35 + vec2(0.0, uTime * 0.02));
    vec3 proj = texture2D(uProject, puv).rgb;
    float strength = mix(0.12, 0.85, uMapped);
    color = blendLighten(color, proj, strength);
  }

  if (uMapped > 0.5) {
    float hue = fract(uTime * 0.12 + vWorldPos.x * 0.08 + vWorldPos.y * 0.1);
    vec3 trip = 0.5 + 0.5 * cos(6.2831 * (hue + vec3(0.0, 0.33, 0.67)));
    color = blendLighten(color, trip, 0.55 + 0.2 * sin(uTime * 3.0 + vWorldPos.y * 4.0));
  } else {
    /* calibration grid flicker while idle / calibrating */
    float grid = step(0.92, max(fract(vUv.x * 10.0), fract(vUv.y * 10.0)));
    color = mix(color, vec3(0.2, 1.0, 0.35), grid * 0.15 * (0.5 + 0.5 * sin(uTime * 6.0)));
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
      uTime: { value: 0 },
      uScan: { value: 1 },
    },
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
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
    if (propsState.arcade === "peeked") n += 1;
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
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = !reducedMotion;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070c);
    scene.fog = new THREE.FogExp2(0x05070c, 0.038);

    const camera = new THREE.PerspectiveCamera(
      58,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.08,
      80,
    );
    /* Spawn facing the desk, as if just stood up from the chair */
    camera.position.set(0, 1.55, 1.1);

    /* -- Procedural materials ------------------------------------------- */
    const woodMap = trackTex(makeWoodMap());
    const floorMap = trackTex(makeDarkFloorMap());
    const wallMap = trackTex(makePaintWallMap());
    const concreteMap = trackTex(makeConcreteMap());
    const metalMap = trackTex(makeMetalMap());
    const gridMap = trackTex(makeCalibGridMap());

    const woodMat = trackMat(
      makeMat(0xffffff, {
        map: woodMap,
        roughness: 0.62,
        metalness: 0.04,
      }),
    );
    const floorMat = trackMat(
      makeMat(0xffffff, {
        map: floorMap,
        roughness: 0.88,
        metalness: 0.06,
      }),
    );
    const wallMat = trackMat(
      makeMat(0xffffff, {
        map: wallMap,
        roughness: 0.94,
        metalness: 0.02,
      }),
    );
    const metalMat = trackMat(
      makeMat(0xffffff, {
        map: metalMap,
        roughness: 0.38,
        metalness: 0.72,
      }),
    );
    const cabinetMat = trackMat(
      makeMat(0xffffff, {
        map: concreteMap,
        roughness: 0.55,
        metalness: 0.45,
        color: 0x8a909a,
      }),
    );
    const trimMat = trackMat(makeMat(0xe8e6e0, { roughness: 0.7, metalness: 0.05 }));
    const blackMetal = trackMat(
      makeMat(0x1a1d24, { roughness: 0.45, metalness: 0.65 }),
    );

    /* Screen / lumen shaders - maps filled when TextureLoader resolves */
    const deskScreenMat = trackMat(createScreenMaterial(null, new THREE.Color(0x6aa8ff)));
    const portraitScreenMat = trackMat(
      createScreenMaterial(null, new THREE.Color(0x8ec5ff)),
    );
    const arcadeScreenMat = trackMat(
      createScreenMaterial(null, new THREE.Color(0x29b6f6)),
    );
    const lumenMats: THREE.ShaderMaterial[] = [];

    const loader = new THREE.TextureLoader();
    const loadMap = (url: string, onLoad: (t: THREE.Texture) => void) => {
      loader.load(
        url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
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
      arcadeScreenMat.uniforms.uMap!.value = t;
      arcadeScreenMat.uniforms.uHasMap!.value = 1;
    });

    let lumenProjectTex: THREE.Texture | null = null;
    loadMap("/experience/set-pieces/04-lumen.png", (t) => {
      lumenProjectTex = t;
      for (const m of lumenMats) {
        m.uniforms.uProject!.value = t;
        m.uniforms.uHasProject!.value = 1;
      }
    });

    /* -- Lighting: film mood (warm key, cool rim, motivated fixtures) - */
    scene.add(new THREE.AmbientLight(0x1a2233, 0.28));
    const hemi = new THREE.HemisphereLight(0x6a7a9a, 0x0a0c12, 0.35);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff1dd, 1.25);
    key.position.set(2.8, 5.8, 3.2);
    key.castShadow = !reducedMotion;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.00025;
    key.shadow.normalBias = 0.03;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 28;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x6aa8ff, 0.38);
    rim.position.set(-4.5, 3.0, -1.5);
    scene.add(rim);

    /* Monitor light bar - warm, matches film */
    const deskLamp = new THREE.PointLight(0xffd9a8, 1.55, 7, 2);
    deskLamp.position.set(0.05, 2.05, -2.55);
    scene.add(deskLamp);

    /* Cool tube over printer bay */
    const tubeLight = new THREE.PointLight(0xe8f0ff, 1.35, 6, 2);
    tubeLight.position.set(-3.3, 2.55, -1.35);
    scene.add(tubeLight);

    const printerGlow = new THREE.PointLight(0x4db8ff, 0.55, 4.5, 2);
    printerGlow.position.set(-3.25, 1.55, -1.2);
    scene.add(printerGlow);

    const lumenBeam = new THREE.SpotLight(0xffffff, 2.1, 14, 0.32, 0.5, 1.35);
    lumenBeam.position.set(4.2, 3.5, 2.4);
    lumenBeam.target.position.set(3.35, 0.85, 0.55);
    scene.add(lumenBeam, lumenBeam.target);

    /* Soft fill so textured surfaces read without washout */
    const fill = new THREE.PointLight(0x9bb4d8, 0.35, 16, 2);
    fill.position.set(0, 2.8, 2.5);
    scene.add(fill);

    /* -- Room shell ---------------------------------------------------- */
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), wallMat);
    back.position.set(0, 3, -5.5);
    back.receiveShadow = true;
    scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    left.rotation.y = Math.PI / 2;
    left.position.set(-9, 3, 1.5);
    left.receiveShadow = true;
    scene.add(left);
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(9, 3, 1.5);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    /* Ceiling slab - dark, slight receive */
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      trackMat(makeMat(0x080a10, { roughness: 0.95, metalness: 0.02 })),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5.6;
    scene.add(ceiling);

    addBaseboard(scene, trimMat, 18, [0, 0.06, -5.48]);
    addBaseboard(scene, trimMat, 14, [-8.98, 0.06, 1.5], Math.PI / 2);
    addBaseboard(scene, trimMat, 14, [8.98, 0.06, 1.5], -Math.PI / 2);

    /* Accent floor stripe - studio stage mark */
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 0.08),
      trackMat(
        makeMat(0x3b93f0, { emissive: 0x1d4f91, emissiveIntensity: 0.35 }),
      ),
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.012, 1.2);
    scene.add(stripe);

    /* Gallery posters on right wall - set-piece plates */
    const posterUrls = [
      "/experience/set-pieces/09-instrument.png",
      "/experience/set-pieces/11-omni-3d.png",
      "/experience/set-pieces/05-voxel-arcade-v3.png",
      "/experience/set-pieces/01-just-a-pinch.png",
      "/experience/opening/01-exterior-approach-poster.jpg",
    ];
    const posterLayouts: [number, number, number, number][] = [
      /* w, h, y, z  (x fixed on right wall) */
      [1.1, 0.72, 2.35, -2.2],
      [0.72, 0.95, 2.2, -0.7],
      [0.95, 0.62, 2.55, 0.7],
      [0.7, 0.7, 1.65, -1.5],
      [0.85, 0.55, 1.55, 0.15],
    ];
    posterLayouts.forEach(([w, h, y, z], i) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, h + 0.06, w + 0.06),
        blackMetal,
      );
      frame.position.set(8.9, y, z);
      scene.add(frame);
      const mat = trackMat(
        makeMat(0x222830, {
          emissive: 0x111820,
          emissiveIntensity: 0.15,
          roughness: 0.55,
        }),
      );
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      plate.rotation.y = -Math.PI / 2;
      plate.position.set(8.86, y, z);
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
      arcadeScreenMat,
    ];

    /* -- Desk (film-matched: light oak, dual monitors, speakers) ------- */
    const desk = new THREE.Group();
    desk.position.set(0, 0, -3.05);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.07, 1.05), woodMat);
    deskTop.position.y = 0.74;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    desk.add(deskTop);

    /* Black T-legs */
    for (const x of [-1.05, 1.05]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), blackMetal);
      leg.position.set(x, 0.36, 0);
      leg.castShadow = true;
      desk.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.1), blackMetal);
      foot.position.set(x, 0.02, 0);
      desk.add(foot);
    }

    /* Ultrawide + portrait - film dual-monitor */
    const monitorBezel = trackMat(
      makeMat(0x0e1116, { roughness: 0.35, metalness: 0.4 }),
    );
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
      new THREE.BoxGeometry(0.42, 0.02, 0.14),
      trackMat(makeMat(0x3a4048, { roughness: 0.55, metalness: 0.2 })),
    );
    keyboard.position.set(-0.05, 0.8, 0.15);
    desk.add(keyboard);
    const mouse = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.025, 0.11),
      trackMat(makeMat(0x4a5058, { roughness: 0.45 })),
    );
    mouse.position.set(0.32, 0.8, 0.14);
    desk.add(mouse);

    /* Tiny plants */
    for (const px of [-0.85, -0.68]) {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.035, 0.06, 10),
        trackMat(makeMat(0x6a7078, { roughness: 0.7 })),
      );
      pot.position.set(px, 0.81, -0.15);
      desk.add(pot);
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
      desk.add(leaf);
    }

    /* Chair - mesh-ish Aeron silhouette */
    const chair = new THREE.Group();
    chair.position.set(0, 0, 0.85);
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.06, 0.5),
      trackMat(makeMat(0x1a1f28, { roughness: 0.7 })),
    );
    seat.position.y = 0.48;
    seat.castShadow = true;
    chair.add(seat);
    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.06),
      trackMat(makeMat(0x1a1f28, { roughness: 0.65, wireframe: false })),
    );
    backrest.position.set(0, 0.9, -0.22);
    backrest.castShadow = true;
    chair.add(backrest);
    const meshPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.58),
      trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x2a3140,
          wireframe: true,
          roughness: 0.5,
          metalness: 0.2,
          transparent: true,
          opacity: 0.55,
        }),
      ),
    );
    meshPanel.position.set(0, 0.9, -0.188);
    chair.add(meshPanel);
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

    scene.add(desk);
    interactives.set("desk", desk);
    hotspots.push({
      id: "desk",
      label: "Desk",
      prompt: "Sit back down at the desktop",
      position: new THREE.Vector3(0, 1.2, -2.35),
    });

    /* -- 3D Printer bay (left) - cabinet + wood top + enclosed printer - */
    const printer = new THREE.Group();
    printer.position.set(-3.35, 0, -1.15);

    const cabinet = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.72, 0.7),
      cabinetMat,
    );
    cabinet.position.y = 0.36;
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    printer.add(cabinet);
    /* Drawer lines */
    for (const dy of [0.18, 0.36, 0.54]) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 0.01, 0.01),
        blackMetal,
      );
      line.position.set(0, dy, 0.355);
      printer.add(line);
    }

    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.75), woodMat);
    bench.position.y = 0.75;
    bench.castShadow = true;
    bench.receiveShadow = true;
    printer.add(bench);

    /* Enclosed printer body */
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.78, 0.62),
      trackMat(
        makeMat(0x1c2430, { map: metalMap, metalness: 0.5, roughness: 0.38 }),
      ),
    );
    frame.position.set(0, 1.16, 0);
    frame.castShadow = true;
    printer.add(frame);

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
    printer.add(glass);

    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.03, 0.45),
      trackMat(makeMat(0x2a3342, { metalness: 0.55, roughness: 0.35 })),
    );
    bed.position.set(0, 0.92, 0);
    printer.add(bed);

    const gantry = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.04, 0.06),
      trackMat(makeMat(0x3a4558, { metalness: 0.6, roughness: 0.3 })),
    );
    gantry.position.set(0, 1.42, 0);
    printer.add(gantry);

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
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const bin = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.1, 0.1),
          trackMat(makeMat(0x4a5560, { roughness: 0.6 })),
        );
        bin.position.set(-0.4 + col * 0.2, 1.95 + row * 0.18, -0.2);
        printer.add(bin);
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

    const printerHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.68, 32),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x4db8ff,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        }),
      ),
    );
    printerHalo.rotation.x = -Math.PI / 2;
    printerHalo.position.y = 0.02;
    printer.add(printerHalo);

    scene.add(printer);
    interactives.set("printer", printer);
    hotspots.push({
      id: "printer",
      label: "3D Printer",
      prompt: "Print a Shift-9 souvenir",
      position: new THREE.Vector3(-3.35, 1.45, -1.15),
    });

    /* -- Lumen - whitebox stack (film right) + overhead projector ------ */
    const lumen = new THREE.Group();
    lumen.position.set(3.35, 0, 0.55);

    const projector = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.24, 0.52),
      trackMat(
        makeMat(0x151a22, { map: metalMap, metalness: 0.55, roughness: 0.32 }),
      ),
    );
    projector.position.set(0.95, 2.85, 1.55);
    projector.castShadow = true;
    lumen.add(projector);
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.08, 16),
      trackMat(
        makeMat(0x111820, {
          emissive: 0xfff8e8,
          emissiveIntensity: 0.8,
          metalness: 0.4,
          roughness: 0.25,
        }),
      ),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0.95, 2.75, 1.25);
    lumen.add(lens);

    const boxes = new THREE.Group();
    boxes.name = "lumenBoxes";
    const stack: THREE.Mesh[] = [];
    /* Film: large grid cubes - two big + supporting stack */
    const layout: [number, number, number, number, number, number][] = [
      [0.85, 0.85, 0.85, 0.15, 0.425, 0.1],
      [0.7, 0.7, 0.7, -0.55, 0.35, 0.2],
      [0.45, 0.55, 0.45, 0.55, 0.28, -0.35],
      [0.4, 0.35, 0.4, -0.15, 1.05, 0.05],
      [0.32, 0.32, 0.32, 0.35, 0.95, -0.25],
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
        new THREE.SphereGeometry(0.04, 10, 10),
        trackMat(new THREE.MeshBasicMaterial({ color: 0x39ff14 })),
      );
      dot.visible = false;
      lumen.add(dot);
      calDots.push(dot);
    }

    const lumenHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.68, 32),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xff9f43,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        }),
      ),
    );
    lumenHalo.rotation.x = -Math.PI / 2;
    lumenHalo.position.y = 0.02;
    lumen.add(lumenHalo);

    scene.add(lumen);
    interactives.set("lumen", lumen);
    hotspots.push({
      id: "lumen",
      label: "Lumen",
      prompt: "Aim / calibrate the projection",
      position: new THREE.Vector3(3.35, 1.35, 0.55),
    });

    /* -- Stub props - richer silhouettes, film/docs-faithful ----------- */
    const mkStub = (
      id: PropId,
      label: string,
      prompt: string,
      pos: [number, number, number],
      build: (g: THREE.Group) => void,
      haloColor: number,
    ) => {
      const g = new THREE.Group();
      g.position.set(...pos);
      build(g);
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
      [-1.8, 0, 3.1],
      (g) => {
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

    mkStub(
      "arcade",
      "Arcade",
      "Coming soon - cabinet flicker",
      [1.9, 0, 3.2],
      (g) => {
        const cab = new THREE.Mesh(
          new THREE.BoxGeometry(0.78, 1.65, 0.7),
          trackMat(
            makeMat(0x141018, {
              emissive: 0xff5c28,
              emissiveIntensity: 0.12,
              roughness: 0.55,
              metalness: 0.25,
            }),
          ),
        );
        cab.position.y = 0.82;
        cab.castShadow = true;
        cab.name = "arcadeCab";
        g.add(cab);
        /* Marquee */
        const marque = new THREE.Mesh(
          new THREE.BoxGeometry(0.78, 0.18, 0.12),
          trackMat(
            makeMat(0x0a1020, {
              emissive: 0x29b6f6,
              emissiveIntensity: 0.7,
            }),
          ),
        );
        marque.position.set(0, 1.72, 0.2);
        g.add(marque);
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.52, 0.4),
          arcadeScreenMat,
        );
        screen.position.set(0, 1.2, 0.36);
        screen.name = "arcadeScreen";
        g.add(screen);
        const control = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.08, 0.35),
          trackMat(makeMat(0x1a1520, { roughness: 0.6 })),
        );
        control.position.set(0, 0.72, 0.4);
        control.rotation.x = -0.35;
        g.add(control);
      },
      0xff7043,
    );

    mkStub(
      "omni",
      "Omni-3D",
      "Coming soon - hologram glitch",
      [-4.4, 0, 2.2],
      (g) => {
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
          new THREE.TorusGeometry(0.5, 0.02, 8, 40),
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
        ring.position.y = 0.95;
        g.add(ring);
        const holo = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.48, 1),
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
        holo.position.y = 1.05;
        holo.name = "omniHolo";
        g.add(holo);
      },
      0x7dd3fc,
    );

    mkStub(
      "arm",
      "Automation Arm",
      "Coming soon - one precise nod",
      [5.1, 0, 1.5],
      (g) => {
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
        new THREE.Vector3(-0.85, 0.08, 0.55),
        new THREE.Vector3(0.7, 0.08, 0.5),
        new THREE.Vector3(0.7, 1.15, -0.2),
        new THREE.Vector3(-0.7, 1.15, -0.15),
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
      if (id === "arcade") {
        arcadeScreenMat.uniforms.uGlow!.value = 1.85;
        arcadeScreenMat.uniforms.uScan!.value = 1.6;
      }
    };

    const tryInteract = () => {
      const near = nearestHotspot();
      if (!near) {
        raycaster.setFromCamera(ndc, camera);
        const objs = [...interactives.values()];
        const hits = raycaster.intersectObjects(objs, true);
        if (!hits.length) {
          showToast("Move closer to a glowing ring, then click or press E");
          return;
        }
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
        if (!found) return;
        runProp(found);
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
      if (id === "arcade") {
        stubPeek("arcade", "Arcade flickers neon - playable cabinet soon");
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
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7.5, 7.5);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -4.2, 5.5);
        camera.position.y = 1.55;
      }

      printerHalo.rotation.z = t * 0.6;
      lumenHalo.rotation.z = -t * 0.45;
      const omni = interactives.get("omni")?.getObjectByName("omniHolo");
      if (omni) {
        omni.rotation.y = t * (0.4 + omniSpin * 1.8);
        omni.position.y = 1.05 + Math.sin(t * 2) * 0.05;
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
      renderer.dispose();
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
