import * as React from "react";
import { cn } from "./cn";
import { DecodeText } from "./DecodeText";

export interface MonoLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  marker?: boolean;
  /**
   * Resolve the (string) label out of cycling glyphs on first scroll into
   * view — the instrument "decrypting" its readout. Reduced-motion safe and
   * a11y-safe (see DecodeText). No-op when children isn't a plain string.
   */
  decode?: boolean;
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
  decode = false,
  ...rest
}: MonoLabelProps) {
  const content =
    decode && typeof children === "string" ? (
      <DecodeText text={children} />
    ) : (
      children
    );
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
      {content}
    </span>
  );
}
