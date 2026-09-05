"use client";

/* ────────────────────────────────────────────────────────────────────────
   ROOM EXPLORE — live WebGL walkaround of the Shift-9 studio room.
   Replaces the old still-viewpoint + hotspot plan with free look + move.
   Lighting mood matches the opening film: photoreal chiaroscuro, hard key,
   deep black falloff. Props are interactive hotspots; printer + Lumen ship
   as real mini-interactions, others are honest stubs with a short delight.
   ──────────────────────────────────────────────────────────────────────── */

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
    "Drag to look · WASD to move · click a glowing prop to interact",
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
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !reducedMotion;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070c);
    scene.fog = new THREE.FogExp2(0x05070c, 0.045);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.08,
      80,
    );
    camera.position.set(0, 1.55, 4.2);

    /* ── Lighting: film mood ─────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0x1a2233, 0.35));
    const key = new THREE.DirectionalLight(0xfff1dd, 1.55);
    key.position.set(3.5, 6.5, 2.2);
    key.castShadow = !reducedMotion;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 28;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6aa8ff, 0.45);
    rim.position.set(-4, 3.2, -2);
    scene.add(rim);
    const deskLamp = new THREE.PointLight(0xffd9a8, 1.8, 8, 2);
    deskLamp.position.set(0.2, 2.1, -2.4);
    scene.add(deskLamp);
    const printerGlow = new THREE.PointLight(0x4db8ff, 0.9, 5, 2);
    printerGlow.position.set(-3.2, 1.4, -0.4);
    scene.add(printerGlow);
    const lumenBeam = new THREE.SpotLight(0xffffff, 2.4, 14, 0.28, 0.45, 1.4);
    lumenBeam.position.set(3.6, 3.4, 1.8);
    lumenBeam.target.position.set(3.2, 0.9, -0.6);
    scene.add(lumenBeam, lumenBeam.target);

    /* ── Room shell ──────────────────────────────────────────────────── */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      makeMat(0x12151c, { roughness: 0.92, metalness: 0.05 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = makeMat(0x0b0e14, { roughness: 0.95, metalness: 0.02 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), wallMat);
    back.position.set(0, 3, -5.5);
    scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    left.rotation.y = Math.PI / 2;
    left.position.set(-9, 3, 1.5);
    scene.add(left);
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(9, 3, 1.5);
    scene.add(rightWall);

    /* Accent floor stripe — studio stage mark */
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 0.08),
      makeMat(0x3b93f0, { emissive: 0x1d4f91, emissiveIntensity: 0.4 }),
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.01, 1.2);
    scene.add(stripe);

    const interactives = new Map<string, THREE.Object3D>();
    const hotspots: Hotspot[] = [];

    /* ── Desk (return) ───────────────────────────────────────────────── */
    const desk = new THREE.Group();
    desk.position.set(0, 0, -3.1);
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 1.1),
      makeMat(0x2a2118, { roughness: 0.7, metalness: 0.1 }),
    );
    deskTop.position.y = 0.74;
    deskTop.castShadow = true;
    desk.add(deskTop);
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.68, 0.06),
      makeMat(0x11151c, {
        emissive: 0x87b7ff,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      }),
    );
    monitor.position.set(0, 1.25, -0.25);
    desk.add(monitor);
    const chair = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, 0.55),
      makeMat(0x1a1f28),
    );
    chair.position.set(0, 0.45, 0.75);
    desk.add(chair);
    scene.add(desk);
    interactives.set("desk", desk);
    hotspots.push({
      id: "desk",
      label: "Desk",
      prompt: "Sit back down at the desktop",
      position: new THREE.Vector3(0, 1.2, -2.4),
    });

    /* ── 3D Printer ──────────────────────────────────────────────────── */
    const printer = new THREE.Group();
    printer.position.set(-3.4, 0, -0.6);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.15, 0.85),
      makeMat(0x1c2430, { metalness: 0.45, roughness: 0.4 }),
    );
    frame.position.y = 0.58;
    frame.castShadow = true;
    printer.add(frame);
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.04, 0.58),
      makeMat(0x2a3342, { metalness: 0.55, roughness: 0.35 }),
    );
    bed.position.set(0, 0.28, 0);
    printer.add(bed);
    const gantry = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.08),
      makeMat(0x3a4558, { metalness: 0.6, roughness: 0.3 }),
    );
    gantry.position.set(0, 0.95, 0);
    printer.add(gantry);
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.015, 0.12, 10),
      makeMat(0xffb347, { emissive: 0xff7a18, emissiveIntensity: 0.5 }),
    );
    nozzle.position.set(0, 0.82, 0);
    nozzle.name = "nozzle";
    printer.add(nozzle);
    const mark = createShift9Mark();
    mark.position.set(0, 0.32, 0);
    mark.visible = false;
    mark.name = "printMark";
    printer.add(mark);
    const printerHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.68, 32),
      new THREE.MeshBasicMaterial({
        color: 0x4db8ff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
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
      position: new THREE.Vector3(-3.4, 1.35, -0.6),
    });

    /* ── Lumen Projection Mapper ─────────────────────────────────────── */
    const lumen = new THREE.Group();
    lumen.position.set(3.4, 0, -0.4);
    const projector = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.28, 0.55),
      makeMat(0x151a22, { metalness: 0.5, roughness: 0.35 }),
    );
    projector.position.set(0.9, 2.55, 1.6);
    lumen.add(projector);
    const boxes = new THREE.Group();
    boxes.name = "lumenBoxes";
    const boxMatIdle = makeMat(0xf2f2f0, { roughness: 0.85 });
    const stack: THREE.Mesh[] = [];
    const layout: [number, number, number, number, number, number][] = [
      [0.55, 0.55, 0.55, 0, 0.28, 0],
      [0.4, 0.4, 0.4, -0.35, 0.2, 0.25],
      [0.35, 0.7, 0.35, 0.4, 0.35, -0.15],
      [0.5, 0.3, 0.5, 0.05, 0.7, 0.1],
      [0.28, 0.28, 0.28, -0.15, 0.9, -0.05],
    ];
    for (const [w, h, d, x, y, z] of layout) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMatIdle.clone());
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
        new THREE.MeshBasicMaterial({ color: 0x39ff14 }),
      );
      dot.visible = false;
      lumen.add(dot);
      calDots.push(dot);
    }
    const lumenHalo = printerHalo.clone();
    lumenHalo.material = (printerHalo.material as THREE.MeshBasicMaterial).clone();
    (lumenHalo.material as THREE.MeshBasicMaterial).color.set(0xff9f43);
    lumen.add(lumenHalo);
    scene.add(lumen);
    interactives.set("lumen", lumen);
    hotspots.push({
      id: "lumen",
      label: "Lumen",
      prompt: "Aim / calibrate the projection",
      position: new THREE.Vector3(3.4, 1.4, -0.4),
    });

    /* ── Stub props ──────────────────────────────────────────────────── */
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
        new THREE.MeshBasicMaterial({
          color: haloColor,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
        }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.02;
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
      "Coming soon — a short pulse",
      [-1.6, 0, 2.4],
      (g) => {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.35, 0.55),
          makeMat(0x10141c, {
            emissive: 0x1f6feb,
            emissiveIntensity: 0.25,
            metalness: 0.55,
            roughness: 0.35,
          }),
        );
        body.position.y = 0.55;
        body.castShadow = true;
        g.add(body);
      },
      0x4dabf7,
    );

    mkStub(
      "arcade",
      "Arcade",
      "Coming soon — cabinet flicker",
      [1.8, 0, 2.6],
      (g) => {
        const cab = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 1.6, 0.6),
          makeMat(0x141018, {
            emissive: 0xff5c28,
            emissiveIntensity: 0.18,
          }),
        );
        cab.position.y = 0.8;
        cab.castShadow = true;
        g.add(cab);
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.48, 0.36),
          makeMat(0x061018, {
            emissive: 0x29b6f6,
            emissiveIntensity: 0.55,
          }),
        );
        screen.position.set(0, 1.15, 0.31);
        g.add(screen);
      },
      0xff7043,
    );

    mkStub(
      "omni",
      "Omni-3D",
      "Coming soon — hologram glitch",
      [-4.2, 0, 2.0],
      (g) => {
        const ped = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.42, 0.2, 20),
          makeMat(0x1a2030, { metalness: 0.5 }),
        );
        ped.position.y = 0.1;
        g.add(ped);
        const holo = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.45, 0),
          new THREE.MeshStandardMaterial({
            color: 0x7dd3fc,
            wireframe: true,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.7,
          }),
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
      "Coming soon — one precise nod",
      [5.0, 0, 1.2],
      (g) => {
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.34, 0.22, 16),
          makeMat(0xd0d5dd, { metalness: 0.65, roughness: 0.3 }),
        );
        base.position.y = 0.11;
        g.add(base);
        const lower = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.9, 0.16),
          makeMat(0xc5ccd6, { metalness: 0.7, roughness: 0.28 }),
        );
        lower.position.set(0, 0.65, 0);
        lower.name = "armLower";
        g.add(lower);
        const claw = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.08, 0.18),
          makeMat(0x9aa3b2, { metalness: 0.75, roughness: 0.25 }),
        );
        claw.position.set(0, 1.15, 0.12);
        g.add(claw);
      },
      0xc0c8d4,
    );

    /* ── Controls ────────────────────────────────────────────────────── */
    const keys = new Set<string>();
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    euler.setFromQuaternion(camera.quaternion);
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
        showToast("Lumen pass already unlocked — the boxes stay mapped");
        return;
      }
      if (st === "idle") {
        setPropsState((p) => ({ ...p, lumen: "calibrating" }));
        lumenStep = 0;
        setHint("Lumen: click again to drop calibration points on the stack");
        showToast("Lumen online — calibrate the box faces");
        return;
      }
      /* calibrating */
      const corners = [
        new THREE.Vector3(-0.45, 0.05, 0.35),
        new THREE.Vector3(0.5, 0.05, 0.35),
        new THREE.Vector3(0.5, 1.05, -0.2),
        new THREE.Vector3(-0.4, 1.05, -0.2),
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
      setHint("Mapped pass unlocked — watch the boxes take the show");
      showToast("Lumen: mapped pass unlocked");
      for (const mesh of stack) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.color.set(0xff4fd8);
        mat.emissive.set(0x6b21a8);
        mat.emissiveIntensity = 0.55;
      }
    };

    const stubPeek = (id: PropId, message: string) => {
      setPropsState((p) => ({ ...p, [id]: "peeked" } as PropState));
      showToast(message);
      if (id === "arm") armNod = 1;
      if (id === "omni") omniSpin = 1;
      if (id === "instrument") {
        const g = interactives.get("instrument");
        const body = g?.children[0] as THREE.Mesh | undefined;
        const mat = body?.material as THREE.MeshStandardMaterial | undefined;
        if (mat) mat.emissiveIntensity = 0.85;
      }
      if (id === "arcade") {
        const g = interactives.get("arcade");
        const screen = g?.children[1] as THREE.Mesh | undefined;
        const mat = screen?.material as THREE.MeshStandardMaterial | undefined;
        if (mat) mat.emissiveIntensity = 1.1;
      }
    };

    const tryInteract = () => {
      const near = nearestHotspot();
      if (!near) {
        /* Also allow center-ray pick */
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
          showToast("Souvenir already printed — yours to keep this session");
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
        stubPeek("instrument", "INSTRUMENT hums once — full patch coming soon");
        return;
      }
      if (id === "arcade") {
        stubPeek("arcade", "Arcade flickers neon — playable cabinet soon");
        return;
      }
      if (id === "omni") {
        stubPeek("omni", "Omni-3D glitches into wireframe — build in progress");
        return;
      }
      if (id === "arm") {
        stubPeek("arm", "Automation arm nods once — live cell soon");
        return;
      }
    };

    const onClick = () => {
      /* Prefer click-to-interact when near or looking at a prop */
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
              ? "At the desk — click or press E to sit down"
              : `${near.label}: ${near.prompt} · E / click`;
          return prev === line ? prev : line;
        });
      }
    };

    const tick = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

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

      /* Idle prop motion */
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

      /* Printer animation */
      if (printActive) {
        printT += dt;
        const nozzleObj = printer.getObjectByName("nozzle");
        const markObj = printer.getObjectByName("printMark");
        if (nozzleObj) {
          nozzleObj.position.y = 0.82 - Math.sin(Math.min(printT, 1.2) * Math.PI) * 0.28;
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
          setHint("Souvenir printed — find Lumen next, or sit back down");
          showToast("Souvenir unlocked: Shift-9 mark");
        }
      }

      /* Lumen mapped pulse */
      if (lumenMapped) {
        mapPulse += dt;
        const hue = (mapPulse * 0.15) % 1;
        for (let i = 0; i < stack.length; i++) {
          const mesh = stack[i]!;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          const c = new THREE.Color().setHSL((hue + i * 0.12) % 1, 0.85, 0.52);
          mat.color.copy(c);
          mat.emissive.copy(c).multiplyScalar(0.35);
          mat.emissiveIntensity = 0.45 + Math.sin(mapPulse * 3 + i) * 0.15;
        }
        lumenBeam.intensity = 2.2 + Math.sin(mapPulse * 4) * 0.5;
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
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
    };
  }, [onSitDown, reducedMotion, showToast]);

  return (
    <div className={s.root} ref={mountRef} role="application" aria-label="Studio room explore">
      <canvas className={s.canvas} ref={canvasRef} />
      <div className={s.hud}>
        <div className={s.topBar}>
          <p className={s.title}>
            Room explore
            <strong>Stand up · look around the studio</strong>
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
            <kbd>D</kbd> move · drag look · <kbd>E</kbd> interact · <kbd>Esc</kbd> sit
          </div>
        </div>
      </div>
    </div>
  );
}
