"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE ASK, MADE TO ACTUALLY DO SOMETHING.

   This page's whole job is one click, and that click was a bare `mailto:`.
   On any machine with no mail client configured — which is most of them —
   a bare mailto does nothing at all, and gives no feedback either way, so
   it does not read as unhandled. It reads as broken. Kariim hit exactly
   that on 2026-08-05: "when I click start a project nothing happens."

   The desktop shell already solved this (EnterTheStudio.tsx, the envelope
   in the taskbar) and this is that same solution, moved to the surface
   where it actually decides whether a lead converts.

   The href stays. Where a handler does exist, mail is the fastest path, and
   keeping the href also keeps right-click → copy address working. The click
   additionally puts the address on the clipboard and SAYS SO, so the button
   always does something the visitor can see — and the confirmation is
   announced, because for anyone whose machine ignored the mailto that
   message is the entire outcome of the click.
   ──────────────────────────────────────────────────────────────────────── */

import * as React from "react";

export function StartAction({
  email,
  className,
  noteClassName,
  wrapClassName,
}: {
  email: string;
  className?: string;
  noteClassName?: string;
  wrapClassName?: string;
}) {
  /* Three states, and the important one is "shown".

     The first version of this set the message only inside the clipboard's
     success callback, which put the whole point of the click behind a
     promise that can quietly fail — no permission, no user activation, an
     insecure context — and when it fails the button is silently dead again,
     which is the exact bug this component exists to kill. Caught by testing
     the click with the mailto blocked, which is what a machine with no mail
     handler actually does.

     So the message is set SYNCHRONOUSLY on click and never depends on the
     copy working. If the copy also succeeds the wording upgrades to say so.
     Either way the visitor always sees the address and always sees that
     their click did something. */
  const [status, setStatus] = React.useState<"idle" | "shown" | "copied">(
    "idle",
  );
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /* The button and its confirmation live in ONE wrapper rather than as two
     siblings inside the page's `.actions` flex row. As siblings the note was
     a flex item competing with the buttons for the main axis: it landed in
     the DOM with the right text and never painted where anyone would see it.
     A wrapper owns its own stacking and cannot be reflowed by the row. */
  return (
    <span className={wrapClassName}>
      <a
        className={`s9-pearl ${className ?? ""}`}
        href={`mailto:${email}`}
        onClick={() => {
          /* Synchronous and unconditional — this is the guarantee. */
          setStatus("shown");
          if (timer.current) clearTimeout(timer.current);
          /* Long enough to actually read and retype an address. The first
             draft cleared after 2.4s, borrowed from the desktop's envelope
             tooltip — but that one only ever confirms a copy, whereas this
             message IS the fallback address for anyone whose machine has no
             mail client, and 2.4s is not enough time to read one. */
          timer.current = setTimeout(() => {
            setStatus("idle");
            timer.current = null;
          }, 12000);

          navigator.clipboard?.writeText(email).then(
            () => setStatus("copied"),
            () => {
              /* Clipboard refused. The message is already on screen and the
                 address is already in it, so the click still did something
                 the visitor can see. */
            },
          );
        }}
      >
        <span>Start a project</span>
        <span className="s9-pearlArrow" aria-hidden="true">
          &#8594;
        </span>
      </a>

      {/* Live region. The space is reserved whether or not it has text, so
          confirming the copy never nudges the buttons under the cursor. */}
      <span className={noteClassName} role="status" aria-live="polite">
        {status === "copied"
          ? `${email} — copied, paste it into your mail`
          : status === "shown"
            ? `Email me at ${email}`
            : ""}
      </span>
    </span>
  );
}
