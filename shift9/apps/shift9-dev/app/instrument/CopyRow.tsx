"use client";

/* ────────────────────────────────────────────────────────────────────────
   COPY ROW — the affordance, made true.

   Everything on this page that lights up under the cursor now copies
   something you can paste. That is the whole reason this component exists:
   the previous page put `hover:bg-well` on rows that were not interactive,
   so it looked clickable everywhere and was clickable nowhere. On a page
   documenting a system whose entire claim is that it behaves consistently,
   that was the worst place on the site to make a promise it could not keep.

   A <button>, not a div with a handler. It is in the tab order, it responds
   to Enter and Space for free, it announces itself as a button, and it takes
   :focus-visible without anything being added — none of which a div gets
   without reimplementing all of it by hand and getting some of it wrong.

   The confirmation is absolutely positioned and pointer-events: none, so
   showing it can neither reflow the row nor swallow a second press. It is
   also announced: aria-live="polite" on a status node, because a purely
   visual "COPIED" tells a screen-reader user nothing about whether the thing
   they just pressed worked.

   Clipboard access can be refused — insecure origin, permissions policy, an
   older browser. That is caught, and the row says so rather than flashing a
   success it did not achieve.
   ──────────────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./instrument.module.css";

type Props = {
  /* What lands on the clipboard. */
  value: string;
  /* What the button announces — the visible content is decorative detail. */
  label: string;
  /* The affordance hint, shown on approach only. */
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

export function CopyRow({ value, label, hint = "copy", className, children }: Props) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* A row unmounted while its confirmation is still up would otherwise set
     state on a dead component. */
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = useCallback(async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("ok");
    } catch {
      setState("fail");
    }
    timer.current = setTimeout(() => setState("idle"), 1400);
  }, [value]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${s.copy} ${className ?? ""}`}
      aria-label={`Copy ${label}`}
    >
      {children}
      <span className={s.hint} aria-hidden>
        {hint}
      </span>
      <span
        className={`${s.flash} ${state !== "idle" ? s.flashOn : ""}`}
        role="status"
        aria-live="polite"
      >
        {state === "ok" ? "copied" : state === "fail" ? "press ⌘C" : ""}
      </span>
    </button>
  );
}
