import type { Metadata } from "next";
import { display, mono, text } from "./fonts";
import "./globals.css";
import { SmoothScroll } from "./_components/SmoothScroll";

/* ────────────────────────────────────────────────────────────────────────
   THREE ROLES, THREE FACES. The stack itself lives in ./fonts so the studio's
   per-project map can reuse the same instances instead of loading the same
   families a second time.

   DISPLAY - Bricolage Grotesque, variable on optical size and width, which is
   what the Proximity Weight interaction in BLUEPRINT §1.2 animates against.
   TEXT - Instrument Sans. This role did not exist: running prose was falling
   through to the monospace, and a dark studio site typeset entirely in mono is
   the most templated look on the web.
   DATA - Martian Mono, doing only its job: labels, status, the // asides.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Shift-9 — Design + Engineering Studio",
  description:
    "Code execution in motion. Shift-9 designs and ships brands, products, and the systems that run them.",
  metadataBase: new URL("https://www.shift9.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shift-9 — Design + Engineering Studio",
    description:
      "Code execution in motion. We design and ship brands, products, and the systems behind them.",
    type: "website",
    url: "https://www.shift9.dev",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${text.variable} ${mono.variable}`}
    >
      <head>
        {/* ── No flash of the front door on the way back ──────────────────
            Coming back to / from the studio used to show a few frames of the
            entrance plate before the desktop appeared, which made the return
            read as a stutter rather than as arriving somewhere.

            The cause is ordering, and it is why this has to be a blocking
            script in <head> rather than anything in React. The entrance
            initialises to the gate, so the gate is in the server-rendered
            HTML — the browser paints it before hydration has even begun. By
            the time an effect (or a layout effect) could set the state to the
            desktop, the plate has already been on screen for several frames.
            Nothing that runs after hydration can win a race that is over
            before hydration starts.

            So the flag is read before the first paint and stamped on <html>,
            and CSS keyed off that attribute keeps the gate hidden from the
            very first frame. Same shape as the classic theme-flash fix, for
            the same reason.

            sessionStorage, matching the entrance: a new tab is a new arrival
            and still gets the film. Wrapped, because storage can be blocked —
            in which case nothing is stamped and the gate behaves exactly as
            it always did. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(sessionStorage.getItem("s9-intro-seen")==="1")document.documentElement.setAttribute("data-s9-seen","1")}catch(e){}',
          }}
        />
      </head>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
