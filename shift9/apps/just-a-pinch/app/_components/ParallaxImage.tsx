"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "@shift9/motion";

/**
 * ParallaxImage — depth for the hero food photo. As the hero scrolls away the
 * image drifts down and scales up a touch (a slow ken-burns lag), so the dish
 * sits on a plane behind the chrome rather than flat against it. The scale is
 * always > 1 to overscan the object-cover crop, so the drift never exposes an
 * edge. Under reduced motion it renders a static, equivalently-framed image.
 */
export function ParallaxImage({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const reduced = useReducedMotionSafe();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "9%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.18, 1.28]);

  if (reduced) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={className}
        style={{ transform: "scale(1.18)" }}
      />
    );
  }

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt=""
        aria-hidden="true"
        className={className}
        style={{ y, scale }}
      />
    </div>
  );
}
