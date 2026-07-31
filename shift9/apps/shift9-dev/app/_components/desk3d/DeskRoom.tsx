"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE ROOM — the DOM side of the composite.

   Owns three things the scene graph cannot own, because they are not 3D:

   · the host element the desktop is portalled into. It is created here and
     never rendered by React into the page — React only fills it. Three's
     CSS3DRenderer moves it into its own layer and drives its transform, and
     two owners moving the same node is how you get a `removeChild` crash on
     unmount. So React owns the contents, three owns the position, and neither
     owns both.

   · the hotspots. A prop that should be reachable without a mouse needs a real
     `<button>` — focusable, announced, in the tab order. A button cannot live
     inside a WebGL canvas, so the scene projects the 3D point out here and
     this renders the control over it.

   · the way back out. See `screen().hotspot` in `scene.ts` for why the full-size
     desktop has to stay one keypress away.

   The room never renders unless it can: no WebGL, a coarse pointer, or a
   window too small to put a desktop inside a monitor, and the flat full-bleed
   desktop renders instead — the same desktop, unchanged, which is what every
   one of those visitors gets today.
   ──────────────────────────────────────────────────────────────────────── */

import { Canvas, type RootState } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DeskScene, type ProjectedHotspot } from "./DeskScene";
import { readRoomPalette } from "./palette";
import { crop, screen } from "./scene";
import s from "./DeskRoom.module.css";

/* `useRoomCapable` lives in its own file, not here. Everything in this one
   pulls in three.js, and the capability question gets asked by every visitor
   including the ones who will never be shown a room. */

type DeskRoomProps = {
  /** The live desktop. Rendered into the monitor, untouched. */
  children: React.ReactNode;
  /** Fires once the first frame is on screen, so the film can be let go of. */
  onReady?: () => void;
  /** The visitor asked for the desktop at full size. */
  onExit: () => void;
};

export function DeskRoom({ children, onReady, onExit }: DeskRoomProps) {
  /* Created once, detached. See the header. */
  const [host] = useState<HTMLDivElement | null>(() =>
    typeof document === "undefined" ? null : document.createElement("div"),
  );
  const palette = useMemo(() => readRoomPalette(), []);
  const [hotspots, setHotspots] = useState<ProjectedHotspot[]>([]);
  const [lost, setLost] = useState(false);
  const [wireframe, setWireframe] = useState(false);

  /* The desktop is rendered at the window's own width and the glass's aspect,
     then scaled onto the monitor. Sizing it that way rather than to its
     projected size keeps it in the layout it was designed and approved in —
     the media queries and the root font-size ramp both read the real window,
     so a box of some other width would lay the desktop out for a window that
     does not exist. */
  const [pixelWidth, setPixelWidth] = useState(0);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const measure = () => {
      setPixelWidth(window.innerWidth);
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* The scene renders a frame LARGER than the window and the window shows a
     part of it — that is the whole push-in mechanism. Both layers (WebGL and
     the CSS3D one carrying the desktop) live inside this box, render at its
     size, and are offset by it together, so the composite cannot come apart.
     See `crop()` for why it is done this way and not with a fov change. */
  const frame = useMemo(
    () => crop(viewport.w || 1, viewport.h || 1),
    [viewport.w, viewport.h],
  );

  useEffect(() => {
    if (!host) return;
    /* Class for the look (tokens live in CSS), inline for the measurement.
       The panel's aspect depends on the window — a narrow window gets a smaller
       monitor — so this is read per-viewport rather than from a constant. */
    host.className = s.screenHost ?? "";
    host.style.width = `${pixelWidth}px`;
    host.style.height = `${pixelWidth / screen((viewport.w || 1) / (viewport.h || 1)).aspect}px`;
  }, [host, pixelWidth, viewport.w, viewport.h]);

  /* A context loss mid-session drops the room and hands the flat desktop back,
     rather than leaving a dead black rectangle where the site was.

     Note what is NOT here: the "ready" signal. A canvas existing is not a room
     being on screen — see `Painted` in DeskScene, which is inside the Suspense
     boundary and so cannot fire before the backdrop has actually loaded and
     rendered. The entrance drops the film when this fires, so firing it early
     is a black flash. */
  const onCanvasCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement;
    /* The canvas is a picture; everything actionable in the room is DOM
       above it. Marked here rather than on the Canvas wrapper, because the
       CSS3D layer carrying the live desktop is a sibling inside that wrapper
       and hiding it from assistive tech would hide the whole interface. */
    canvas.setAttribute("aria-hidden", "true");
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      setLost(true);
    });
  }, []);

  useEffect(() => {
    if (lost) onExit();
  }, [lost, onExit]);

  /* Calibration: `?wire` draws the stand-in geometry so a new prop can be
     matched to the plate by eye. Deliberately a URL flag and not a control —
     it is a tool for whoever is placing props, not a feature of the site. */
  useEffect(() => {
    setWireframe(new URLSearchParams(window.location.search).has("wire"));
  }, []);

  const onSignal = useCallback(
    (signal: string) => {
      if (signal === "full-size") onExit();
    },
    [onExit],
  );

  const onPainted = useCallback(() => onReady?.(), [onReady]);

  if (!host || !palette || pixelWidth === 0) return null;

  return (
    <div className={s.room}>
      <div
        className={s.frame}
        style={{
          width: `${frame.width}px`,
          height: `${frame.height}px`,
          left: `${frame.left}px`,
          top: `${frame.top}px`,
        }}
      >
        <Canvas
          flat
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [0, 0, 0], near: 0.05, far: 20 }}
          onCreated={onCanvasCreated}
        >
          <Suspense fallback={null}>
            <DeskScene
              palette={palette}
              screenElement={host}
              screenPixelWidth={pixelWidth}
              wireframe={wireframe}
              onHotspots={setHotspots}
              onPainted={onPainted}
            />
          </Suspense>
        </Canvas>

        {hotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className={s.hotspot}
            style={{ left: `${spot.x}px`, top: `${spot.y}px` }}
            onClick={() => onSignal(spot.signal)}
          >
            {spot.label}
          </button>
        ))}
      </div>

      {createPortal(children, host)}
    </div>
  );
}
