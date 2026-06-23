import * as React from "react";
import { cn } from "./cn";

export interface MonoLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  marker?: boolean;
  children?: React.ReactNode;
}

/**
 * A monospace status-line label — the slot where the studio's witty,
 * declarative voice lives (`// build: stable`, `// seasoned to taste`).
 */
export function MonoLabel({
  children,
  className,
  marker = true,
  ...rest
}: MonoLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-mono uppercase tracking-[0.22em] text-muted",
        className,
      )}
      {...rest}
    >
      {marker ? (
        <span aria-hidden className="text-signal">
          //
        </span>
      ) : null}
      {children}
    </span>
  );
}
