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
import { PROJECT_FONTS } from "./studio-fonts";

/* The closing artwork Kariim supplied — the chrome SHIFT-9 mark over the fibre
   strands. Referenced through one constant so replacing the artwork is a single
   line and never a hunt through markup. */
const OUTRO_ART = "/experience/shift-9_new-banner.jpg";

/* The same artwork, animated: the light actually travels across the chrome,
   the fibre strands actually flow, the dust actually drifts. Rendered from
   the still, and framed to end on the still, so the last frame it holds is
   the composition the poster already showed — the film settles rather than
   stopping. A CSS sheen over a JPEG cannot do any of that; it reads as a
   gradient sliding over a photograph, because that is what it is. */
const OUTRO_FILM = "/experience/outro/banner-settle.mp4";

/* ── THE CLOSING BANNER ───────────────────────────────────────────────────
   Kariim's artwork is the button. Stacking the invitation on top of this
   composition would put type over the one image on the site that earns a full
   frame to itself, so the ask lives on its own page and the banner's only job
   is to make you want to open it.

   The film loops, continuously, for as long as you are looking at it. It used
   to play once and stop on its last frame, which meant the closing image of
   the whole reel was a still that had briefly moved — the one place on the
   site where motion dies while you watch. It is rendered from the artwork and
   framed to end on it, so the wrap lands back on the frame it started from.

   The cue still arrives after the statement rather than over it: one pass of
   the film, timed off its own duration. See the effect below for why that
   cannot be `ended` any more. */
function BannerOutro() {
  const hostRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Held off the first render so SSR emits the still alone: the film is an
     enhancement and must never be what makes the page correct. */
  const [live, setLive] = useState(false);
  /* One full pass of the film has played. Also the state the page starts in
     when there is no film to wait for. */
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    /* Reduced motion: the still is the whole thing, and the cue is there
       immediately. Nothing to wait for, so nothing waits. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettled(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setLive(true);
      },
      { threshold: 0.35 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live) return;
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => setSettled(true));

    /* The cue used to be revealed by `ended`. The film loops now, so `ended`
       never fires at all and that would have left the invitation permanently
       hidden — the loop and the reveal cannot share a trigger.

       A timer instead, set to the film's own length once the metadata says
       what that is, so the invitation still arrives when the statement
       finishes rather than over the top of it. The 7s fallback covers a codec
       the browser cannot decode, a refused autoplay, or a backgrounded tab:
       the one thing that must never depend on the video is the way forward. */
    const onMeta = () => {
      const d = vid.duration;
      if (Number.isFinite(d) && d > 0) {
        window.setTimeout(() => setSettled(true), d * 1000);
      }
    };
    vid.addEventListener("loadedmetadata", onMeta, { once: true });
    if (vid.readyState >= 1) onMeta();

    const failsafe = setTimeout(() => setSettled(true), 7000);
    return () => {
      clearTimeout(failsafe);
      vid.removeEventListener("loadedmetadata", onMeta);
    };
  }, [live]);

  return (
    <a
      className={s.banner}
      href="/start"
      ref={hostRef}
      aria-label="Open the invitation — start a project with Shift-9"
    >
      {/* The still is real markup, so the frame is complete before any script
          runs and survives a failed video load. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={s.outroArt}
        src={OUTRO_ART}
        alt="SHIFT-9 — code execution in motion"
      />

      {live ? (
        <video
          className={s.outroFilm}
          ref={videoRef}
          src={OUTRO_FILM}
          poster={OUTRO_ART}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      ) : null}

      <span className={`${s.cue} ${settled ? s.cueIn : ""}`}>
        <span className={s.cueLabel} aria-hidden="true">
          // the studio is open
        </span>
        <span className={s.cueAction}>Open the invitation &#8594;</span>
      </span>
    </a>
  );
}

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
  const font = PROJECT_FONTS[piece.n];
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
          {/* The card's variant AND its typeface pair are data, not choices
              made here: both belong to the project, so both stay with the
              roster. The pair arrives as two custom properties the card's own
              rules read, which is what lets one stylesheet serve twelve
              voices without twelve copies of it. */}
          <div
            className={`${s.card} ${s[piece.card] ?? ""} ${visible ? s.cardIn : ""}`}
            style={
              {
                "--card-display": font?.display,
                "--card-text": font?.text,
              } as React.CSSProperties
            }
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
                  : /* /soon is not a project page, so it must not be labelled
                       like one. "Open Flow State →" promises a page about the
                       project and delivers a construction sign; the visitor
                       reads that as a broken link rather than an honest one.
                       Say what is actually behind the door. */
                    piece.href === "/soon"
                    ? "Project page coming soon →"
                    : `Open ${piece.title} →`}
              </a>
            ) : null}
            {piece.appHref ? (
              /* The second door. Some projects ship something you install, and
                 the site that describes it is not the place that hands it to
                 you — for Just a Pinch that is the web-app entrance carrying
                 the Google Play download and the iOS notice. Someone who wants
                 the app should not have to find it from the marketing page. */
              <a
                className={s.link}
                href={piece.appHref}
                target="_blank"
                rel="noreferrer"
              >
                {piece.appLabel ?? "Get the app"} ↗
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
  /* The counter has counted. Watched rather than inferred from `at`, because
     12/12 is still the right number while the twelfth set-piece is on screen —
     it is arriving at the banner that makes it redundant. */
  const [atBanner, setAtBanner] = useState(false);
  const outroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = outroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setAtBanner(Boolean(entry?.isIntersecting)),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={s.root}>
      {/* The lights coming up. See .curtain — the other half of the fade the
          desktop starts on its way out. */}
      <div className={s.curtain} aria-hidden />
      <header className={s.bookend}>
        <h1>The Studio</h1>
        <p className={s.lede}>
          Twelve projects, one continuous take. Scroll to move through them. The
          finished ones look finished. The ones still in development don&apos;t
          &mdash; and I left them that way on purpose.
        </p>
      </header>

      {SET_PIECES.map((piece, i) => (
        <Stage key={piece.n} piece={piece} index={i} onEnter={(n) => setAt(n + 1)} />
      ))}

      {/* The take lands on the brand, then invites. The artwork resolves first,
          the line follows, and the actions arrive only once both have settled —
          including the way back out to the desktop the visitor came from. */}
      <footer className={s.outro} ref={outroRef}>
        <BannerOutro />

      </footer>

      {/* The only way out, and it is on screen the whole way down — leaving
          must never depend on reaching the end of the travel. It used to be
          two: this one plus a full pill laid over the closing banner. One is
          enough, and an arrow is the smallest thing that still reads as a way
          back, so it can sit in the corner of every shot without becoming
          furniture. The word is kept for assistive tech and the tooltip. */}
      <a className={s.exitPin} href="/" title="Back to the desktop">
        <span aria-hidden>&#8592;</span>
        <span className={s.srOnly}>Back to the desktop</span>
      </a>

      <div
        className={`${s.counter} ${atBanner ? s.counterOut : ""}`}
        aria-hidden="true"
      >
        {String(at).padStart(2, "0")} / {String(SET_PIECES.length).padStart(2, "0")}
      </div>
    </div>
  );
}
