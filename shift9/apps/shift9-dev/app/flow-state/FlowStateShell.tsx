"use client";

import type { ReactNode } from "react";
import { Ripple } from "./Ripple";
import s from "./flow-state.module.css";

export function FlowStateShell({ children }: { children: ReactNode }) {
  return (
    <Ripple
      className={s.rippleRoot}
      style={{ minHeight: "100svh" }}
      trigger="hover"
      interval={2.8}
      amplitude={0.85}
      speed={0.7}
      wavelength={90}
      rings={3}
      decay={0.85}
      refraction={120}
      dispersion={0.45}
      shine={0.75}
    >
      {children}
    </Ripple>
  );
}