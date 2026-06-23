"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useMagnetic } from "@shift9/motion";
import { cn } from "./cn";

export interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  arrow?: boolean;
}

/**
 * Primary CTA with spring-physics magnetic pull. Renders an anchor when
 * `href` is supplied, otherwise a button. Focus ring is inherited from
 * the global `:focus-visible` contract in @shift9/theme.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className,
  arrow = true,
}: MagneticButtonProps) {
  const { ref, x, y, bind } = useMagnetic<HTMLElement>(0.4, 120);

  const cls = cn(
    "group relative inline-flex items-center gap-3 px-7 py-3.5 font-mono text-mono uppercase tracking-[0.18em] transition-premium will-change-transform",
    variant === "primary"
      ? "bg-signal text-void hover:bg-pulse hover:text-ink"
      : "border border-line text-ink hover:border-signal hover:text-signal",
    className,
  );

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {arrow ? (
        <span
          aria-hidden
          className="relative z-10 transition-premium group-hover:translate-x-1"
        >
          →
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cls}
        style={{ x, y }}
        {...bind}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={cls}
      style={{ x, y }}
      {...bind}
    >
      {content}
    </motion.button>
  );
}
