"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE SCENE GRAPH. Everything here is placed from `scene.ts`; nothing in this
   file decides where anything is.

   Three surfaces and whatever props are registered:

   · the BACKDROP — the film's own frame, the room itself. Drawn unlit and
     untone-mapped so it reproduces the plate pixel for pixel. The moment the
     backdrop is "interpreted" by a renderer the cut from film to room stops
     being invisible.

   · the MONITOR — a quad at the measured pose of the film's glass. It does not
     draw. It cannot: the plate already contains a photograph of this monitor,
     and painting over it with a flat colour would only make it worse. It is
     here to be the surface the live desktop is welded to, and to be visible
     under `?wire` when a prop needs calibrating.

   · the DESK — same deal, a plane at the desk's height. Never drawn, because
     the desk in the plate is the desk. It is the ground props stand on and the
     surface their shadows will land on. Compositing CG onto a plate always
     works this way: the photograph is the set, the geometry is the stand-in.

   None of it animates. The camera does not move, and it should not: the
   backdrop is a flat photograph of a room, so any camera move would slide the
   whole room as one card and give the trick away instantly. The scene is 3D
   because the props are really placed in it and the hand will really move in
   it — not because the viewpoint drifts. `frameloop="demand"` on the canvas
   means this renders on mount and on resize, and costs nothing in between.
   ──────────────────────────────────────────────────────────────────────── */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { Euler, PerspectiveCamera, SRGBColorSpace, TextureLoader, Vector3 } from "three";
import { useLoader } from "@react-three/fiber";
import { ScreenSurface } from "./ScreenSurface";
import { SET_PIECES } from "./props";
import {
  BACKDROP,
  DESK,
  PLATE_SRC,
  SCREEN,
  framing,
  type RoomPalette,
} from "./scene";

/** Screen-space position of a hotspot, in CSS pixels from the canvas corner. */
export type ProjectedHotspot = { id: string; label: string; signal: string; x: number; y: number };

type DeskSceneProps = {
  palette: RoomPalette;
  screenElement: HTMLElement;
  screenPixelWidth: number;
  wireframe: boolean;
  onHotspots: (spots: ProjectedHotspot[]) => void;
  onPainted: () => void;
};

/* Says "the room is on screen" — and means it.
 *
 * This sits INSIDE the Suspense boundary, so it cannot mount until the plate
 * has loaded; then it waits two frames for that first render to actually
 * reach the screen. The signal matters because the entrance tears the film
 * down when it arrives: fire it on canvas creation instead, as the first
 * version did, and there is a window where the film is gone and the backdrop
 * has not painted — which is a black flash exactly where the whole point was
 * that there is no seam. */
function Painted({ onPainted }: { onPainted: () => void }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => onPainted());
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [invalidate, onPainted]);
  return null;
}

/* The camera's field of view is the only thing that responds to the window.
   `framing()` explains why it is fov and not the camera's position or the
   backdrop's scale: from a fixed eye point a fov change is a pure scale about
   the centre of frame, so the plate and the monitor grow and shrink together
   and the composite cannot drift apart. */
function Framing() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.fov = framing(size.width / size.height);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  return null;
}

function Backdrop() {
  const plate = useLoader(TextureLoader, PLATE_SRC);

  useLayoutEffect(() => {
    plate.colorSpace = SRGBColorSpace;
    plate.needsUpdate = true;
  }, [plate]);

  return (
    <mesh position={BACKDROP.position}>
      <planeGeometry args={[BACKDROP.width, BACKDROP.height]} />
      {/* Unlit and untone-mapped: this is a photograph, not a surface. */}
      <meshBasicMaterial map={plate} toneMapped={false} />
    </mesh>
  );
}

/* The two stand-in surfaces. `colorWrite` off rather than `visible` off so
   they stay in the graph, keep their bounds, and can pick up a shadow-catcher
   material the day a prop casts one — without anything else moving. */
function StandIn({
  position,
  rotation,
  args,
  wireframe,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  args: [number, number];
  wireframe: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation ?? [0, 0, 0]}>
      <planeGeometry args={args} />
      <meshBasicMaterial wireframe colorWrite={wireframe} depthWrite={false} />
    </mesh>
  );
}

/* Hotspots are 3D positions but DOM controls — they have to be real buttons to
   be focusable, and a real button cannot live inside a WebGL canvas. So their
   world position is projected here and handed back out to `DeskRoom`, which
   renders the buttons over the canvas. Static camera, so this settles on the
   first frame and only moves again on resize. */
function Projector({ onHotspots }: { onHotspots: DeskSceneProps["onHotspots"] }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const point = useMemo(() => new Vector3(), []);
  const spin = useMemo(() => new Euler(), []);
  const previous = useMemo(() => ({ key: "" }), []);

  useFrame(() => {
    const spots: ProjectedHotspot[] = [];

    const place = (
      id: string,
      label: string,
      signal: string,
      at: [number, number, number],
      origin: [number, number, number],
      rotation: [number, number, number],
    ) => {
      /* The hotspot is given in its prop's own space, so it travels with the
         prop. Rotate it, offset it, then project. */
      spin.set(rotation[0], rotation[1], rotation[2]);
      point.set(at[0], at[1], at[2]).applyEuler(spin);
      point.x += origin[0];
      point.y += origin[1];
      point.z += origin[2];
      point.project(camera);
      spots.push({
        id,
        label,
        signal,
        x: ((point.x + 1) / 2) * size.width,
        y: ((1 - point.y) / 2) * size.height,
      });
    };

    place(
      "screen",
      SCREEN.hotspot.label,
      SCREEN.hotspot.signal,
      SCREEN.hotspot.at,
      SCREEN.position,
      SCREEN.rotation,
    );

    for (const prop of SET_PIECES) {
      if (!prop.hotspot) continue;
      place(
        prop.id,
        prop.hotspot.label,
        prop.hotspot.signal,
        prop.hotspot.at,
        prop.transform.position,
        prop.transform.rotation ?? [0, 0, 0],
      );
    }

    /* Only push when something actually moved — this runs inside the render
       loop and a setState every frame would defeat `frameloop="demand"`. */
    const key = spots.map((s) => `${s.id}:${s.x.toFixed(1)},${s.y.toFixed(1)}`).join("|");
    if (key === previous.key) return;
    previous.key = key;
    onHotspots(spots);
  });

  return null;
}

export function DeskScene({
  palette,
  screenElement,
  screenPixelWidth,
  wireframe,
  onHotspots,
  onPainted,
}: DeskSceneProps) {
  const invalidate = useThree((s) => s.invalidate);

  /* The desk lamp in the plate, solved onto the same grid as everything else:
     just above and behind the monitor's top edge. It is the only light in the
     room that matters, because it is the only one the plate shows. */
  const lamp = useMemo<[number, number, number]>(() => [-0.03, 0.39, -1.35], []);

  useEffect(() => {
    invalidate();
  }, [invalidate, wireframe, screenPixelWidth]);

  return (
    <>
      <Framing />
      <Backdrop />

      {/* The wall's bounce, and the lamp. Tokens, like every other colour. */}
      <ambientLight color={palette.fill} intensity={1.6} />
      <pointLight color={palette.key} intensity={1.4} distance={4} position={lamp} />

      <StandIn
        position={SCREEN.position}
        rotation={SCREEN.rotation}
        args={[SCREEN.width, SCREEN.height]}
        wireframe={wireframe}
      />
      <StandIn
        position={DESK.position}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[DESK.width, DESK.depth]}
        wireframe={wireframe}
      />

      <ScreenSurface
        element={screenElement}
        worldWidth={SCREEN.width}
        pixelWidth={screenPixelWidth}
        position={SCREEN.position}
        rotation={SCREEN.rotation}
      />

      {SET_PIECES.map((prop) => (
        <group
          key={prop.id}
          position={prop.transform.position}
          rotation={prop.transform.rotation ?? [0, 0, 0]}
          scale={prop.transform.scale ?? 1}
        >
          <prop.Model palette={palette} />
        </group>
      ))}

      <Projector onHotspots={onHotspots} />
      <Painted onPainted={onPainted} />
    </>
  );
}
