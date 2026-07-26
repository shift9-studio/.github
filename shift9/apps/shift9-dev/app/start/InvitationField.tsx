"use client";

/* ────────────────────────────────────────────────────────────────────────
   THE FIELD BEHIND THE INVITATION

   A rendered ambient plate — the same fibre strands and luminous dust as the
   closing banner, without the wordmark, so the two rooms read as one system.
   It drifts and eases to a rest rather than looping: a page you sit on to
   read a sentence and press a button should not have perpetual motion behind
   it, and a loop seam on a five-second clip is more noticeable than stillness.

   The only reason this is a client component on an otherwise script-free page
   is reduced motion. Hiding an autoplaying <video> in CSS still downloads and
   decodes it; not mounting it is the honest version. When it is absent the
   gradient underneath is a finished field in its own right, which is what
   makes that path a real state instead of an apology.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import s from "./start.module.css";

const FIELD_FILM = "/experience/outro/invitation-field.mp4";
const FIELD_PLATE = "/experience/outro/invitation-field.jpg";

export function InvitationField() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPlay(true);
  }, []);

  if (!play) return null;

  return (
    <video
      className={s.film}
      src={FIELD_FILM}
      poster={FIELD_PLATE}
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
    />
  );
}
