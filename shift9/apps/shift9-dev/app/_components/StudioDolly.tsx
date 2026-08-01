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

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@shift9/motion";
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

   The film plays once and settles on its last frame, which is the still the
   poster already showed — the composition resolves rather than restarting. It
   was briefly set to loop; a banner that keeps re-animating under a stationary
   reader pulls attention back to itself at the exact moment the page is asking
   for a decision, so it plays its one pass and holds.

   The cue arrives after the statement rather than over it: `ended` reveals the
   invitation, with a failsafe for the cases where it never fires. */
function BannerOutro() {
  const reducedMotion = useReducedMotionSafe();
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
    if (reducedMotion) {
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
  }, [reducedMotion]);

  useEffect(() => {
    if (!live || reducedMotion) {
      videoRef.current?.pause();
      return;
    }
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => setSettled(true));

    /* The film runs once, so its own `ended` is the honest signal that the
       statement has finished and the invitation can arrive.

       The 7s failsafe covers everything that stops `ended` from firing at all:
       a codec the browser cannot decode, a refused autoplay, a backgrounded
       tab. The one thing that must never depend on the video is the way
       forward. */
    const onEnded = () => setSettled(true);
    vid.addEventListener("ended", onEnded, { once: true });

    const failsafe = setTimeout(() => setSettled(true), 7000);
    return () => {
      clearTimeout(failsafe);
      vid.removeEventListener("ended", onEnded);
    };
  }, [live, reducedMotion]);

  return (
    <a
      className={s.banner}
      href="/start"
      ref={hostRef}
      aria-label="Open the invitation — start a project with Shift-9"
    >
      <span className={s.invitationCard}>
        {/* The still is real markup, so the frame is complete before any script
            runs and survives a failed video load. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={s.outroArt}
          src={OUTRO_ART}
          alt="SHIFT-9 — code execution in motion"
        />

        {live && !reducedMotion ? (
          <video
            className={s.outroFilm}
            ref={videoRef}
            src={OUTRO_FILM}
            poster={OUTRO_ART}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        ) : null}

        <span className={s.invitationDetails} aria-hidden="true">
          Private viewing / Shift-9 Studio
        </span>
        <span className={s.invitationSeal} aria-hidden="true">S9</span>

        <span className={`${s.cue} ${settled ? s.cueIn : ""}`}>
          <span className={s.cueLabel} aria-hidden="true">
            A private invitation from Shift-9
          </span>
          <span className={s.cueAction}>Open your invitation &#8594;</span>
        </span>
      </span>
    </a>
  );
}

/* Native video `loop` exposes the edit by jumping straight from the final
   decoded frame to frame zero. Two cached layers overlap one transition early:
   the incoming pass starts under the outgoing pass, then becomes the lead.
   Only the visible set-pieces play, and every timer/frame is cancelled when a
   shot leaves the warm viewport. */
function SeamlessLoopVideo({
  src,
  poster,
  playing,
}: {
  src: string;
  poster: string;
  playing: boolean;
}) {
  const firstRef = useRef<HTMLVideoElement>(null);
  const secondRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef<0 | 1>(0);
  const frameRef = useRef(0);
  const finishRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blendingRef = useRef(false);

  useEffect(() => {
    const first = firstRef.current;
    const second = secondRef.current;
    if (!first || !second) return;
    const videos = [first, second] as const;
    let cancelled = false;

    const reset = () => {
      cancelled = true;
      window.cancelAnimationFrame(frameRef.current);
      if (finishRef.current) clearTimeout(finishRef.current);
      finishRef.current = null;
      blendingRef.current = false;
      activeRef.current = 0;
      videos.forEach((video, index) => {
        video.pause();
        video.style.opacity = index === 0 ? "1" : "0";
        if (video.readyState > 0) video.currentTime = 0;
      });
    };

    if (!playing) {
      reset();
      return reset;
    }

    const durationToken = getComputedStyle(document.documentElement)
      .getPropertyValue("--s9-dur-slow")
      .trim();
    const durationValue = Number.parseFloat(durationToken);
    const fadeMs = Number.isFinite(durationValue)
      ? durationToken.endsWith("ms")
        ? durationValue
        : durationValue * 1000
      : 700;

    const blend = () => {
      if (cancelled || blendingRef.current) return;
      const currentIndex = activeRef.current;
      const nextIndex = currentIndex === 0 ? 1 : 0;
      const current = videos[currentIndex];
      const next = videos[nextIndex];
      blendingRef.current = true;
      next.currentTime = 0;
      next
        .play()
        .then(() => {
          if (cancelled) return;
          next.style.opacity = "1";
          current.style.opacity = "0";

          finishRef.current = setTimeout(() => {
            current.pause();
            current.currentTime = 0;
            activeRef.current = nextIndex;
            blendingRef.current = false;
            finishRef.current = null;
          }, fadeMs + 80);
        })
        .catch(() => {
          if (cancelled) return;
          /* Keep the working layer's final frame. Swapping to a layer that
             failed to start would turn a recoverable media error into a
             visible poster jump and an endless retry loop. */
          current.pause();
          current.style.opacity = "1";
          next.style.opacity = "0";
          blendingRef.current = false;
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = 0;
        });
    };

    const watch = () => {
      if (cancelled) return;
      const current = videos[activeRef.current];
      if (
        Number.isFinite(current.duration) &&
        current.duration > 0 &&
        current.duration - current.currentTime <= fadeMs / 1000 + 0.08
      ) {
        blend();
      }
      frameRef.current = window.requestAnimationFrame(watch);
    };

    videos[0]
      .play()
      .then(() => {
        if (cancelled) return;
        frameRef.current = window.requestAnimationFrame(watch);
      })
      .catch(() => {
        if (cancelled) return;
        videos[0].style.opacity = "1";
      });
    return reset;
  }, [playing, poster, src]);

  return (
    <span className={s.seamlessLoop} aria-hidden="true">
      <video
        ref={firstRef}
        src={src}
        poster={poster}
        className={s.loopLayer}
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={secondRef}
        src={src}
        poster={poster}
        className={s.loopLayer}
        muted
        playsInline
        preload="metadata"
      />
    </span>
  );
}

/* ── The handoff between shots ────────────────────────────────────────────
   Three separate problems lived here, and all three showed up at the joins.

   THE CLIP STOPPED BEFORE IT LEFT. Playback was gated on the same
   `isIntersecting` at threshold 0.35 that drove everything else, so a shot
   paused the moment it was less than a third on screen — which is exactly
   when it is still half the frame during a handoff. Sampled down the reel,
   eleven of nine sampled positions had a visible shot sitting on a frozen
   frame. A continuous take with dead beats in it is not a continuous take.

   Playback is its own observer now, deliberately looser than the one that
   drives the caption: a generous rootMargin and threshold 0 mean a clip
   starts before it arrives and keeps running until it is properly gone. The
   two observers answer different questions — "is this the shot you are
   looking at" and "should this be moving" — and conflating them is what
   caused the freeze.

   THE DECODE HAPPENED MID-SCROLL. A clip mounted on its own first
   intersection, so element creation and first decode landed at the exact
   moment it scrolled into frame. `live` is lifted to the parent now, which
   warms the next shot one section ahead — the work happens while you are
   still watching the previous one.

   THE CUT WAS A CUT. `.shot` had no transition at all. It carries an opacity
   fade now, so the outgoing shot dissolves rather than sliding away as a hard
   rectangle. Paired with the feather in `.veil`, the join is a dissolve
   through black instead of two photographs meeting on an edge. */
function Stage({
  piece,
  index,
  live,
  onEnter,
  onWarm,
  reducedMotion,
}: {
  piece: (typeof SET_PIECES)[number];
  index: number;
  /* Mounted by the parent, one section ahead of where you are. */
  live: boolean;
  onEnter: (i: number) => void;
  onWarm: (i: number) => void;
  reducedMotion: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const font = PROJECT_FONTS[piece.n];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (reducedMotion) {
      setVisible(false);
      return;
    }

    /* Which shot you are looking at — drives the counter and the warm-ahead. */
    const focus = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        onEnter(index);
        onWarm(index);
      },
      { threshold: 0.35 },
    );

    /* Whether this shot should be moving. Half a viewport of slack on both
       sides, so a clip is already running before its shot is the one you are
       looking at, and does not stop until it is genuinely off screen. */
    const play = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0, rootMargin: "50% 0px 50% 0px" },
    );

    focus.observe(host);
    play.observe(host);
    return () => {
      focus.disconnect();
      play.disconnect();
    };
  }, [index, onEnter, onWarm, reducedMotion]);

  return (
    <section
      ref={hostRef}
      /* The anchor /soon comes back to. Without it, checking a project meant
         restarting a 16,000px reel from project 01. */
      id={`set-${piece.n}`}
      className={`${s.stage} ${piece.resolution === "volatile" ? s.volatile : ""}`}
      aria-labelledby={`set-piece-${piece.n}`}
    >
      <div className={s.pin}>
        <div className={s.shot}>
          {live && !reducedMotion ? (
            <SeamlessLoopVideo
              src={piece.clip}
              poster={piece.plate}
              playing={visible}
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
                       project and delivers a coming-soon sign; the visitor
                       reads that as a broken link rather than an honest one.
                       Say what is actually behind the door.

                       Matched on the prefix, not on equality: every card
                       stamps its own number on the URL (/soon?from=05) so the
                       way back can restore the reader's position, which meant
                       an `=== "/soon"` test matched none of the nine cards it
                       was written for and they all shipped the label it
                       exists to prevent. */
                    piece.href.startsWith("/soon")
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
  const reducedMotion = useReducedMotionSafe();
  const [at, setAt] = useState(1);
  /* Stable, because it is a dependency of the Stage observers — an inline
     arrow would rebuild both observers on every state change, and this
     component changes state on every section. */
  const handleEnter = useCallback((n: number) => setAt(n + 1), []);
  /* The counter has counted. Watched rather than inferred from `at`, because
     12/12 is still the right number while the twelfth set-piece is on screen —
     it is arriving at the banner that makes it redundant. */
  const [atBanner, setAtBanner] = useState(false);
  const outroRef = useRef<HTMLElement>(null);

  /* Keep only the current shot and its two neighbours warm. This preserves a
     decoded handoff in both scroll directions without retaining 24 video
     elements and the entire reel's buffers after one pass. */
  const [warmCenter, setWarmCenter] = useState(0);
  const warmAhead = useCallback((i: number) => {
    setWarmCenter(i);
  }, []);

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
        <Stage
          key={piece.n}
          piece={piece}
          index={i}
          live={!reducedMotion && Math.abs(i - warmCenter) <= 1}
          onEnter={handleEnter}
          onWarm={warmAhead}
          reducedMotion={reducedMotion}
        />
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
