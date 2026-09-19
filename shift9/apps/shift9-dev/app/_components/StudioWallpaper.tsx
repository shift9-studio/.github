"use client";

import { useEffect, useRef, type RefObject } from "react";
import { AsciiWallpaper } from "./AsciiWallpaper";
import type { WallpaperMode } from "./RailWindows";
import s from "./EnterTheStudio.module.css";

const IMAGE_MODES = new Set<WallpaperMode>(["prism"]);

export function StudioWallpaper({
  mode,
  dark,
  fitTo,
  reducedMotion,
}: {
  mode: WallpaperMode;
  dark: boolean;
  fitTo: RefObject<HTMLElement | null>;
  reducedMotion: boolean;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const hasImage = IMAGE_MODES.has(mode);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !hasImage || reducedMotion || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const reset = () => {
      targetX = 0;
      targetY = 0;
    };
    const onPointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * -18;
      targetY = (event.clientY / window.innerHeight - 0.5) * -12;
    };
    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      layer.style.setProperty("--wall-x", `${currentX.toFixed(2)}px`);
      layer.style.setProperty("--wall-y", `${currentY.toFixed(2)}px`);
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", reset);
    document.addEventListener("mouseleave", reset);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", reset);
      document.removeEventListener("mouseleave", reset);
      window.cancelAnimationFrame(frame);
      layer.style.removeProperty("--wall-x");
      layer.style.removeProperty("--wall-y");
    };
  }, [hasImage, reducedMotion]);

  return (
    <div
      ref={layerRef}
      className={s.wallLayer}
      data-wallpaper={mode}
      aria-hidden="true"
    >
      {mode === "signal" || mode === "quiet" ? (
        <AsciiWallpaper className={s.wallCanvas} ink={!dark} fitTo={fitTo} />
      ) : null}
      {hasImage ? <div className={s.wallImage} /> : null}
      <div className={s.wallVeil} />
    </div>
  );
}
