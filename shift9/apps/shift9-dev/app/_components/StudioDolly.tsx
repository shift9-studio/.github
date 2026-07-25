"use client";

/* ────────────────────────────────────────────────────────────────────────
   UNCUT SOUNDSTAGE DOLLY — docs/STUDIO-DOLLY.md, assembled.

   Twelve set-pieces in the locked order, each a pinned full-bleed shot the
   visitor travels through by scrolling. Not a grid, not a card wall: one shot
   at a time, filling the frame, against absolute black.

   Each tile ships as a plate (the approved still that locked the composition)
   plus a clip animated from that plate. The plate is the video's poster, so
   the first paint is the finished frame — the clip fades in over identical
   geometry and there is no pop.

   Contract:
   - Clips only play while their set-piece is on screen. An IntersectionObserver
     drives that, so eleven decoders are not running behind the one you can see.
   - prefers-reduced-motion renders every plate as a still with its caption
     beneath: the complete roster, in order, fully legible. Not a paused film.
   - The plates are real <img> in the markup, so the page is complete before any
     script runs and the shots survive a failed video load.
   ──────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import s from "./StudioDolly.module.css";
import { SET_PIECES } from "./studio-dolly-data";

/* The closing artwork Kariim supplied — the chrome SHIFT-9 mark over the fibre
   strands. Referenced through one constant so replacing the artwork is a single
   line and never a hunt through markup. */
const OUTRO_ART = "/experience/shift-9_new-banner.jpg";

function Stage({
  piece,
  index,
  onEnter,
}: {
  piece: (typeof SET_PIECES)[number];
  index: number;
  onEnter: (i: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /* `live` mounts the clip and never unmounts it again — swapping back to the
     plate on the way out would drop the decoded frames and re-fetch on the way
     back in. `visible` is the play/pause signal. Both are held off the first
     render so SSR emits the plate alone: the clip is an enhancement and must
     never be what makes the page correct. */
  const [live, setLive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setLive(true);
          onEnter(index);
        }
      },
      { threshold: 0.35 },
    );

    io.observe(host);
    return () => io.disconnect();
  }, [index, onEnter]);

  /* Playback runs in its own effect rather than inside the observer callback:
     the <video> does not exist until the render that `live` triggers, so
     calling play() from the callback would always hit a null ref and the clip
     would sit on its poster forever. */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (visible) {
      vid.play().catch(() => {
        /* autoplay refused — the poster plate is the approved frame, so the
           set-piece still reads exactly as composed. */
      });
    } else {
      vid.pause();
    }
  }, [visible, live]);

  return (
    <section
      ref={hostRef}
      className={`${s.stage} ${piece.resolution === "volatile" ? s.volatile : ""}`}
      aria-labelledby={`set-piece-${piece.n}`}
    >
      <div className={s.pin}>
        <div className={s.shot}>
          {live ? (
            <video
              ref={videoRef}
              src={piece.clip}
              poster={piece.plate}
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
            />
          ) : (
            /* The shot is decorative in both states: the caption below states
               the title and what the set is, visibly, so the plate and the clip
               carry no accessible name of their own. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={piece.plate} alt="" loading="lazy" />
          )}
        </div>
        <div className={s.veil} aria-hidden="true" />

        <div className={s.caption}>
          {/* The card's variant is data, not a choice made here: each project's
              layout belongs to the project, so it stays with the roster. */}
          <div
            className={`${s.card} ${s[piece.card] ?? ""} ${visible ? s.cardIn : ""}`}
          >
            <div className={s.meta}>
              <span className={s.num}>{piece.n}</span>
              <span className={s.status}>{piece.status}</span>
            </div>
            <h2 className={s.title} id={`set-piece-${piece.n}`}>
              {piece.title}
            </h2>
            <p className={s.note}>{piece.note}</p>
            <div className={s.tags}>
              {piece.tags.map((t) => (
                <span key={t} className={s.tag}>
                  {t}
                </span>
              ))}
            </div>
            {piece.href ? (
              /* A live product opens in its own tab: the studio is a place the
                 visitor is standing in, and sending them away from it to look
                 at one project costs them their position in the travel. */
              <a
                className={s.link}
                href={piece.href}
                {...(piece.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {piece.href.startsWith("http")
                  ? `Open the live ${piece.title} ↗`
                  : `Open ${piece.title} →`}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StudioDolly() {
  const [at, setAt] = useState(1);

  return (
    <div className={s.root}>
      <header className={s.bookend}>
        <h1>The Studio</h1>
        <p className={s.lede}>
          Twelve projects, one continuous take. Scroll to travel through them. Live
          work is resolved and settled; work still in development is raw and
          unstable, which is what it actually looks like.
        </p>
      </header>

      {SET_PIECES.map((piece, i) => (
        <Stage key={piece.n} piece={piece} index={i} onEnter={(n) => setAt(n + 1)} />
      ))}

      {/* The take lands on the brand, then invites. The artwork resolves first,
          the line follows, and the actions arrive only once both have settled —
          including the way back out to the desktop the visitor came from. */}
      <footer className={s.outro}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.outroArt} src={OUTRO_ART} alt="" />
        <div className={s.outroPanel}>
          <p className={s.outroLede}>
            Twelve projects, one take. If you want something built like this, the
            studio is open.
          </p>
          <div className={s.outroActions}>
            <a className={s.cta} href="mailto:shift9.dev@gmail.com">
              Start a project &#8594;
            </a>
            <a className={s.exit} href="/">
              &#8592; Back to the desktop
            </a>
          </div>
        </div>
      </footer>

      {/* Leaving must never depend on reaching the end of the travel. */}
      <a className={s.exitPin} href="/">
        &#8592; Desktop
      </a>

      <div className={s.counter} aria-hidden="true">
        {String(at).padStart(2, "0")} / {String(SET_PIECES.length).padStart(2, "0")}
      </div>
    </div>
  );
}
