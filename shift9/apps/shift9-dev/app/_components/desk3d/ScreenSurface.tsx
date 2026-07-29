"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE SCREEN — the live desktop, sitting on the monitor in the room.

   This is the part of the milestone that either works or doesn't. The
   desktop has to be genuinely IN the scene — at the monitor's angle, at the
   monitor's size, moving with it — while staying a real, clickable,
   tab-navigable DOM tree. A texture cannot do that: the moment you render
   the interface to a WebGL surface it stops being an interface. It has no
   focus ring, no text selection, no screen reader, no keyboard.

   So the desktop stays DOM, and three's own CSS3DRenderer drives it with the
   same camera the WebGL scene uses. It computes the browser's `matrix3d` from
   the object's world matrix, so the DOM element lands exactly where the
   geometry says. Same camera, same matrix, one composite.

   ── What this costs, stated plainly ────────────────────────────────────────
   CSS3D content is composited by the browser ABOVE the WebGL canvas, always.
   Depth testing does not cross between them. Nothing drawn in WebGL can pass
   in front of the screen — a mug on the desk that overlapped the monitor would
   be drawn behind it and look wrong.

   That is fine today: the placeholder hand is on the mouse, well below and
   right of the glass, and the props still to come (3D printer, projector wall)
   sit further into the room, not between the camera and the monitor. It is a
   real constraint on where props may go, not a bug to fix later — the fix, if
   one is ever needed, is to render the occluding prop as DOM too.
   ──────────────────────────────────────────────────────────────────────── */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Scene } from "three";
import { CSS3DObject, CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";

type ScreenSurfaceProps = {
  /** The detached host element the desktop is portalled into. */
  element: HTMLElement;
  /** Width of the glass in world metres. */
  worldWidth: number;
  /** Width of the host element in CSS pixels. Sets the scale factor. */
  pixelWidth: number;
  position: [number, number, number];
  rotation: [number, number, number];
};

export function ScreenSurface({
  element,
  worldWidth,
  pixelWidth,
  position,
  rotation,
}: ScreenSurfaceProps) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const css = useMemo(() => {
    const renderer = new CSS3DRenderer();
    const stage = new Scene();
    const object = new CSS3DObject(element);
    stage.add(object);
    return { renderer, stage, object };
  }, [element]);

  /* Sit the CSS layer exactly over the WebGL canvas. The renderer already
     marks its own view element `pointer-events: none` and each CSS3D object's
     element `auto`, so the room stays click-through everywhere except on the
     screen itself — which is the behaviour we want and did not have to build. */
  useEffect(() => {
    const canvas = gl.domElement;
    const host = canvas.parentElement;
    if (!host) return;
    const layer = css.renderer.domElement;
    layer.style.position = "absolute";
    layer.style.top = "0";
    layer.style.left = "0";
    layer.style.pointerEvents = "none";
    host.appendChild(layer);
    return () => {
      layer.remove();
    };
  }, [css, gl]);

  useEffect(() => {
    css.renderer.setSize(size.width, size.height);
  }, [css, size.width, size.height]);

  useEffect(() => {
    css.object.position.set(position[0], position[1], position[2]);
    css.object.rotation.set(rotation[0], rotation[1], rotation[2]);
    /* One CSS pixel of the host element becomes `worldWidth / pixelWidth`
       metres. The host's aspect is the glass's aspect, so a single uniform
       scale is the whole mapping. */
    css.object.scale.setScalar(worldWidth / pixelWidth);
  }, [css, position, rotation, worldWidth, pixelWidth]);

  /* Two renderers, one camera, one frame — so the order has to be stated.

     A `useFrame` with a priority above 0 takes R3F's render loop away from it:
     R3F stops drawing the scene and hands the frame over on the understanding
     that you will draw it yourself. That is exactly what is wanted here (WebGL
     first, the CSS layer over it, never the other way round) but it is not
     optional — leave out the `gl.render` and the room renders nothing at all
     while the composited desktop carries on working perfectly, which is a
     convincing way to spend an hour looking at the wrong thing.

     The scene is static and the canvas is on `frameloop="demand"`, so this
     fires on mount and on resize, not sixty times a second. */
  useFrame((state) => {
    state.gl.render(state.scene, camera);
    css.renderer.render(css.stage, camera);
  }, 1);

  return null;
}
