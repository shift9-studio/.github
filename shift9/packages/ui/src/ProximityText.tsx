"use client";

import * as React from "react";
import { useProximityWeight, type ProximityOpts } from "@shift9/motion";
import { cn } from "./cn";

export interface ProximityTextProps extends ProximityOpts {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
}

/**
 * Headline wrapper wired to Proximity Weight — the variable display face
 * flexes its weight/width toward the cursor. Uses createElement to keep
 * the polymorphic `as` ref-typing clean.
 */
export function ProximityText({
  children,
  as = "h1",
  className,
  ...opts
}: ProximityTextProps) {
  const ref = useProximityWeight<HTMLElement>(opts);
  return React.createElement(
    as,
    { ref, className: cn("font-display leading-[0.9]", className) },
    children,
  );
}
