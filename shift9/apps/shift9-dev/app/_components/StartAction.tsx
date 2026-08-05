"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE LAST CLICK — the one that actually reaches Kariim.

   A bare `mailto:` does nothing on a machine with no mail client, and gives
   no feedback either way, so it does not read as unhandled — it reads as
   broken. Kariim hit exactly that on 2026-08-05: "when I click start a
   project nothing happens."

   The desktop shell already solved this (EnterTheStudio.tsx, the taskbar
   envelope) and this is that solution, living wherever the funnel actually
   ends. It ends on /services now, at the bottom of the offer, which is the
   right place for it: you read what it costs, then you write.

   The href stays. Where a mail handler exists that is the fastest path, and
   it keeps right-click → copy address working. The click ALSO puts the
   address on the clipboard and says so, so the button always does something
   the visitor can see.
   ──────────────────────────────────────────────────────────────────────── */

import * as React from "react";

export function StartAction({
  email,
  label = "Start a project",
  className,
  noteClassName,
  wrapClassName,
}: {
  email: string;
  label?: string;
  className?: string;
  noteClassName?: string;
  wrapClassName?: string;
}) {
  /* Three states, and the important one is "shown".

     The first draft set the message only inside the clipboard's success
     callback, which put the whole point of the click behind a promise that
     can quietly fail — no permission, no user activation, an insecure
     context — and when it fails the button is silently dead again, which is
     the exact bug this component exists to kill. Caught by testing the click
     with the mailto blocked, which is what a machine with no mail handler
     actually does.

     So the message is set SYNCHRONOUSLY on click and never depends on the
     copy working. If the copy also succeeds the wording upgrades to say so.
     Either way the visitor always sees the address, and always sees that
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
     siblings inside a page's actions row. As siblings the note was a flex
     item competing with the buttons for the main axis: it landed in the DOM
     with the right text and never painted where anyone would see it. */
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
        <span>{label}</span>
        <span className="s9-pearlArrow" aria-hidden="true">
          &#8594;
        </span>
      </a>

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
