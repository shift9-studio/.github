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

type Side = "left" | "right";

/**
 * Primary CTA with spring-physics magnetic pull AND an entry-aware fill sweep:
 * a contrasting accent wipes in FROM the edge the cursor entered, the label and
 * arrow flip to read against it, and on exit the fill accelerates out toward the
 * edge the cursor left. The pull, the sweep, and the label flip are one gesture.
 *
 * Renders an anchor when `href` is supplied, otherwise a button. The focus ring
 * is inherited from the global `:focus-visible` contract in @shift9/theme. Under
 * reduced motion the global CSS contract collapses the sweep to an instant state
 * change and the magnetic pull is disabled at the hook.
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
  const [fill, setFill] = React.useState<{ on: boolean; origin: Side }>({
    on: false,
    origin: "left",
  });
  const isPrimary = variant === "primary";

  const sideOf = (clientX: number): Side => {
    const el = ref.current;
    if (!el) return "left";
    const r = el.getBoundingClientRect();
    return clientX - r.left < r.width / 2 ? "left" : "right";
  };

  const onPointerEnter = (e: React.PointerEvent) =>
    setFill({ on: true, origin: sideOf(e.clientX) });
  const onPointerLeave = (e: React.PointerEvent) => {
    bind.onPointerLeave();
    setFill({ on: false, origin: sideOf(e.clientX) });
  };

  const cls = cn(
    "group relative inline-flex items-center gap-3 overflow-hidden px-7 py-3.5 font-mono text-mono uppercase tracking-[0.18em] transition-premium will-change-transform",
    isPrimary
      ? "bg-signal text-void"
      : "border border-line text-ink hover:border-signal",
    className,
  );

  const content = (
    <>
      {/* The sweep — origin tracks the entry edge; ease-out in, ease-in out. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 z-0",
          isPrimary ? "bg-pulse" : "bg-signal",
        )}
        style={{
          transformOrigin: fill.origin,
          transform: `scaleX(${fill.on ? 1 : 0})`,
          transitionProperty: "transform",
          transitionDuration: "var(--s9-dur-base)",
          transitionTimingFunction: fill.on
            ? "var(--s9-ease-out)"
            : "var(--s9-ease-in)",
        }}
      />
      <span
        className={cn(
          "relative z-10 transition-premium",
          isPrimary ? "group-hover:text-ink" : "group-hover:text-void",
        )}
      >
        {children}
      </span>
      {arrow ? (
        <span
          aria-hidden
          className={cn(
            "relative z-10 transition-premium group-hover:translate-x-1",
            isPrimary ? "group-hover:text-ink" : "group-hover:text-void",
          )}
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
        onPointerMove={bind.onPointerMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
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
      onPointerMove={bind.onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {content}
    </motion.button>
  );
}
