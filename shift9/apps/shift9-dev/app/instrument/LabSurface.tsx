"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

type LabSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function LabSurface({ children, className }: LabSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const enabledRef = useRef(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncPreference() {
      enabledRef.current = finePointer.matches && !reducedMotion.matches;
      if (!enabledRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
        surfaceRef.current?.style.removeProperty("--probe-x");
        surfaceRef.current?.style.removeProperty("--probe-y");
      }
    }

    syncPreference();
    finePointer.addEventListener("change", syncPreference);
    reducedMotion.addEventListener("change", syncPreference);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      finePointer.removeEventListener("change", syncPreference);
      reducedMotion.removeEventListener("change", syncPreference);
    };
  }, []);

  function moveProbe(event: PointerEvent<HTMLDivElement>) {
    if (!enabledRef.current || frameRef.current) return;
    const surface = event.currentTarget;
    const { clientX, clientY } = event;
    frameRef.current = window.requestAnimationFrame(() => {
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty("--probe-x", `${clientX - bounds.left}px`);
      surface.style.setProperty("--probe-y", `${clientY - bounds.top}px`);
      frameRef.current = 0;
    });
  }

  function resetProbe(event: PointerEvent<HTMLDivElement>) {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    event.currentTarget.style.removeProperty("--probe-x");
    event.currentTarget.style.removeProperty("--probe-y");
  }

  return (
    <div
      ref={surfaceRef}
      className={className}
      onPointerMove={moveProbe}
      onPointerLeave={resetProbe}
    >
      {children}
    </div>
  );
}
