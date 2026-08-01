"use client";

/* ────────────────────────────────────────────────────────────────────────
   ENTER THE STUDIO — the shift9.dev front door.
   Cinematic muted-autoplay intro → screen-wake → interactive Windows-11-style
   desktop that mirrors the video's final frame. Ported from the approved v3
   prototype; the behaviour contract (HANDOFF §18) is reproduced exactly:

   - Muted autoplay intro; on autoplay-block, the Fraunces "Enter the Studio"
     lockup (gold ring + pulse, bottom-left) is the click-to-start fallback;
     SKIP pill bottom-right.
   - On `ended` (or prefers-reduced-motion) → screen-wake (#wake + #glow) →
     desktop `.boot`.
   - Folder order: shift9.dev · Apps · Games · Tools · About. shift9.dev is the
     accent-gradient CTA door-tile (sitepulse) linking to the live studio.
   - Grid/Icons segmented toggle: Grid = yellow folders; Icons = tinted glyph
     chips (Apps=grid/cyan, Games=gamepad/green, Tools=wrench/gold,
     About=person/violet).
   - prefers-reduced-motion disables ring spin/pulse, sitepulse and the wake
     animation and falls straight to the desktop.

   The desktop markup is always rendered (SSR-legible static state); the video
   overlays it at z-30 during playback, so there is no flash and no-JS / reduced
   -motion visitors get the full desktop. The "live studio" door points at the
   same-site /studio route (the INSTRUMENT content), per HANDOFF §8.1.
   ──────────────────────────────────────────────────────────────────────── */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@shift9/motion";
import { FadeToBlack } from "./FadeToBlack";
import { AsciiWallpaper } from "./AsciiWallpaper";
import s from "./EnterTheStudio.module.css";
import { Shift9Mark } from "./Shift9Mark";
import { SHIFT9_LOGO } from "./logo-data";
/* CSS-module class access is typed `string | undefined` under
   noUncheckedIndexedAccess; classList APIs need a plain string. */
const cls = (name: string): string => (s as Record<string, string>)[name] ?? name;

/* The live studio (INSTRUMENT work wall) now lives at /studio; the entry is the
   landing route. Same-site path, no target=_blank to itself (HANDOFF §8.1). */
const STUDIO_HREF = "/studio";

/* One address, used by the taskbar button and the About window alike, so the
   two can never drift. */
const STUDIO_EMAIL = "shift9dev@gmail.com";

/* The opening film, in order. Two generated beats played back to back as one
   continuous take: the approach and entry, then the desk. The last frame of the
   second beat is the monitor filling the screen, which is where the real
   desktop below takes over — so the handoff is a match cut, not a transition.
   Both were shot against Kariim's own photographs of the room and the doll. */
/* The static screen the entrance starts from. It is the first thing painted on
   the site, so it is a compressed 1920x1080 JPEG rather than the 2.4MB source
   plate: a photographic frame in a lossless format made the largest paint on
   the page roughly seven times heavier than it needed to be, and the plate was
   only 1376px wide so it was being upscaled and softened on any full-size
   screen. Matching the film's own dimensions means starting playback is not
   also a change of resolution. */
const OPENING_POSTER = "/experience/opening/01-exterior-approach-poster.jpg";

/* THE FRONT DOOR. Not a frame of the film — a threshold: black crocheted
   fabric, the material this whole world is made from, parted along one seam
   with light coming through it. You press Enter and the film takes you
   through. Because it is a still, nothing about the entrance depends on
   autoplay surviving a mobile browser's power-saving rules. */
const ENTRY_PLATE = "/experience/opening/00-entry-seam.jpg";

/* Stated on the button so pressing it is an informed choice rather than a
   trapdoor. Two beats, ten seconds each. */
const INTRO_RUNTIME = "20 sec";
/* Held as a constant so the button's accessible name and the glyphs drawn on
   screen can never drift apart. */
const ENTER_LABEL = "Enter the studio";

/* ── The taskbar clock ───────────────────────────────────────────────────
   It used to read "9:41 AM / 7/14/2026", hardcoded. 9:41 is the deliberate
   keynote convention and nobody reads a screenshot clock — but a *date* that
   sits still is different. On a portfolio it stops being set dressing and
   starts being evidence the site was abandoned, and it gets worse every day
   it ships.

   Live, and hydration-safe. The value is seeded in the state initialiser, so
   the server renders a real time rather than a blank that pops in — but
   server and client necessarily disagree by the round trip, which is exactly
   what `suppressHydrationWarning` is for. The effect then re-reads the
   visitor's own clock on mount and ticks it on the minute boundary rather
   than every 60s from an arbitrary phase, so the display never lags the real
   minute by up to a minute. `.clock` reserves its width in tabular figures,
   so none of this can shift the taskbar.

   `aria-hidden`: it is chrome on a picture of an operating system, not
   information the page is offering. */
function Clock({ className }: { className?: string }) {
  const read = () => {
    const d = new Date();
    return {
      time: d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      date: d.toLocaleDateString(),
    };
  };
  const [now, setNow] = useState(read);

  useEffect(() => {
    setNow(read());
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const ms = 60_000 - (Date.now() % 60_000);
      timer = setTimeout(() => {
        setNow(read());
        schedule();
      }, ms);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={className} aria-hidden suppressHydrationWarning>
      {now.time}
      <br />
      {now.date}
    </div>
  );
}

const OPENING: readonly string[] = [
  "/experience/opening/01-03-approach-entry-hall-v4.mp4",
  "/experience/opening/04-desk-mouse-screen-v5.mp4",
];

type Status = "live" | "ship" | "dev" | "rnd";
/* `h` is the destination. Where a project has a real one — a live site or the
   design system — that is what it points at. Where it does not, it points at
   /soon, which says plainly that the page doesn't exist yet rather than
   leaving the title dead under the cursor. A dead title reads as a broken
   site; /soon reads as a studio mid-build, which is the true thing.

   Four of these used to point at /work/<slug>. Those pages were stubs wearing
   a case study's layout — a couple of hundred characters and nowhere to go at
   the end — so they have been deleted rather than left to be found. An honest
   "not yet" costs a click; a thin page dressed as a real one costs trust.

   Kept optional so a future item can be added unlinked. */
type Item = { n: string; s: string; sc: Status; d: string; tags: string[]; h?: string };
type Folder = { t: string; n: string; items: Item[] };

/* Canonical content — copied verbatim from the frozen prototype / HANDOFF §6.
   Do not rewrite, reorder, or upgrade a status (contract §18 guardrail). */
const DATA: Record<"apps" | "games" | "tools", Folder> = {
  apps: {
    t: "Apps",
    n: "every title is a link; the ones without a project page yet say so when you get there",
    items: [
      {
        n: "Just a Pinch",
        s: "IN TESTING",
        sc: "dev",
        d: "Smart recipe organizer + guided cooking app. Save from links, photos, or scratch; cook mode scales servings and suggests swaps. Includes the Recipe Engine — a Supabase-backed content pipeline that seeds and serves the catalog. In closed testing on Android — launching soon.",
        tags: ["React Native", "TypeScript", "Supabase", "Android · iOS soon"],
        h: "https://pinch.shift9.dev",
      },
      {
        n: "Flow State",
        s: "SHIPPING",
        sc: "ship",
        d: "Local voice-to-text dictation for Windows. Profiles, custom vocabulary, selected-text commands, history, crash recovery — dictation that stays on your machine.",
        tags: ["Python", "Whisper", "Windows", "Local-first"],
        h: "/soon",
      },
      {
        n: "Learning App",
        s: "SHIPPING",
        sc: "ship",
        d: "A children’s reading tool that turns practice into play. Built for real kids, tested by real kids.",
        tags: ["Python", "Education", "Kids"],
        h: "/soon",
      },
      {
        n: "Lumen Projection Mapper",
        s: "IN DEV",
        sc: "dev",
        d: "Point a projector at anything, drag corners on your phone, and the image warps to fit. Projection mapping with zero jargon.",
        tags: ["JavaScript", "WebSockets", "Projection"],
        h: "/soon",
      },
    ],
  },
  games: {
    t: "Games",
    n: "Work in progress is labeled plainly; every build says what is real and what comes next.",
    items: [
      {
        n: "Voxel Arcade Basketball",
        s: "IN DEV",
        sc: "dev",
        d: "Arcade basketball in Godot — arena, broadcast camera, crowd shader bowl, and player movement live; ball physics and box score next.",
        tags: ["Godot", "GDScript", "3D"],
        h: "/soon",
      },
      {
        n: "Midnight Return",
        s: "IN DEV",
        sc: "dev",
        d: "A metroidvania platformer in C#. Exploration-first design.",
        tags: ["C#", "Metroidvania"],
        h: "/soon",
      },
      {
        n: "Game Design Forge",
        s: "R&D",
        sc: "rnd",
        d: "UE5 plugin suite letting non-programmers assemble games LEGO-style: socket-matched auto-tiling, one-click destruction, and a tutorial overlay that watches what you do. Blueprint complete; build phase next.",
        tags: ["Unreal 5", "C++", "R&D"],
        h: "/soon",
      },
    ],
  },
  tools: {
    t: "Tools",
    n: "Utilities, component systems, and studio infrastructure built to solve specific production problems.",
    items: [
      {
        n: "Titanium Forge Pro",
        s: "IN DEV",
        sc: "dev",
        d: "A portable React component workbench with live demos and copyable snippets for teams to bring into their own products. In active development.",
        tags: ["React", "TypeScript", "Component Library", "Cloudflare"],
        h: "/soon",
      },
      {
        n: "INSTRUMENT",
        s: "LIVE",
        sc: "live",
        d: "Shift-9's production design system: shared interaction, motion and accessibility rules across live products, with each product free to keep its own voice.",
        tags: ["Design Systems", "Motion", "Accessibility"],
        h: "/instrument",
      },
      {
        n: "Automation Systems",
        s: "LIVE",
        sc: "live",
        d: "The infrastructure behind the studio: Relay (cross-machine state handoff), a 400+ skill control plane governing AI-assisted builds, and claude-eyes (a screen-capture toolkit that gives coding agents vision). How one person ships like a team.",
        tags: ["Automation", "AI Agents", "Git", "Windows"],
        h: "/soon",
      },
      {
        n: "Omni-3D",
        s: "IN DEV",
        sc: "dev",
        d: "A game-development toolkit in TypeScript.",
        tags: ["TypeScript", "3D", "Tooling"],
        h: "/soon",
      },
      {
        n: "WinFix",
        s: "SHIPPED",
        sc: "ship",
        d: "A Windows utility that repairs the Windows 10 Home upgrade bug. Small tool, real problem, done. Windows 11 support on the roadmap.",
        tags: ["Python", "Windows", "Utility"],
        h: "/soon",
      },
    ],
  },
};

type FolderKey = keyof typeof DATA;

const FOLDERS: { key: FolderKey; name: string; count: string; glyph: React.ReactNode }[] = [
  {
    key: "apps",
    name: "Apps",
    count: "4 items",
    glyph: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: "games",
    name: "Games",
    count: "3 items",
    glyph: (
      <svg viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <line x1="15" y1="13" x2="15.01" y2="13" />
        <line x1="18" y1="11" x2="18.01" y2="11" />
      </svg>
    ),
  },
  {
    key: "tools",
    name: "Tools",
    count: "5 items",
    glyph: (
      <svg viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

const ABOUT_GLYPH = (
  <svg viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const THEME_KEY = "s9-desk-theme";

/* The opening film is an arrival, and you only arrive once. Every route that
   comes back here — the studio's door, the banner, the invitation — lands on
   the desktop already awake, at the exact frame the film hands over on, ready
   to be clicked. Replaying a 20-second take because someone pressed Back is
   the difference between a place and a cutscene.

   sessionStorage, not localStorage, deliberately: a new visit in a new tab is
   a new arrival and should get the film. */
const INTRO_KEY = "s9-intro-seen";

function introAlreadySeen(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false; /* storage blocked — treat it as a first visit */
  }
}

function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* storage blocked — the film simply plays again next time */
  }
}

const SUN = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.4v2.2M12 19.4v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.4 12h2.2M19.4 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
  </svg>
);

const MOON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z" />
  </svg>
);

const SIDEBAR: { label: string; glyph: string; on?: boolean }[] = [
  { label: "Home", glyph: "⌂" },
  { label: "Portfolio", glyph: "▤", on: true },
  { label: "Media", glyph: "▶" },
  { label: "Products", glyph: "◆" },
  { label: "Contacts", glyph: "✎" },
  { label: "Settings", glyph: "⚙" },
  { label: "Goals", glyph: "◉" },
  { label: "Reports", glyph: "▤" },
];

type OpenWin = FolderKey | "about" | null;

export function EnterTheStudio() {
  const reducedMotion = useReducedMotionSafe();
  const videoRef = useRef<HTMLVideoElement>(null);
  /* The second beat gets its own element rather than sharing the first one's.
     See the playback effect for why — reassigning `src` on a playing video is
     what made the join at ten seconds look cheap. */
  const videoBRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  /* The icon field — the part of the desktop with nothing sitting on top of
     it. The wallpaper lays the banner out against this box rather than the
     whole viewport, so the wordmark is not partly behind the sidebar and
     partly under the taskbar. */
  const gridRef = useRef<HTMLDivElement>(null);
  /* The email button confirmed its own click. */
  const [copied, setCopied] = useState(false);
  const wakeRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);

  /* Three explicit states, because the entrance has three: standing outside,
     watching the film, and at the desk. Holding this as one flag per concern
     is what made the old code need an "autoplay was blocked" fallback state
     that looked like a fourth. */
  const [mode, setMode] = useState<"gate" | "film" | "desk">("gate");
  const [compact, setCompact] = useState(false);
  const [openWin, setOpenWin] = useState<OpenWin>(null);
  /* True from the moment Enter is pressed until the film can actually play.
     The opening is 24MB; on anything but a fast line there is a real wait
     there, and it used to be a dead screen. */
  const [loading, setLoading] = useState(false);
  const [curtainDone, setCurtainDone] = useState(true);
  const [curtainOpening, setCurtainOpening] = useState(false);
  /* Which folder is mid-open, so its lid can lift before the window arrives. */
  const [opening, setOpening] = useState<string | null>(null);
  const folderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!curtainOpening) return;
    const token = getComputedStyle(document.documentElement)
      .getPropertyValue("--s9-dur-boot")
      .trim();
    const value = Number.parseFloat(token);
    const duration = Number.isFinite(value)
      ? token.endsWith("ms")
        ? value
        : value * 1000
      : 1200;
    const curtainFallback = setTimeout(() => {
      setCurtainDone(true);
      setCurtainOpening(false);
    }, duration + 160);
    return () => clearTimeout(curtainFallback);
  }, [curtainOpening]);

  /* Theme. SSR renders light so the server and first client paint agree; the
     stored choice (or the OS preference) is applied on mount. The desktop is
     still behind the intro film at that point, so the switch is never seen. */
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(THEME_KEY);
    } catch {
      /* storage blocked — fall through to the OS preference */
    }
    if (stored === "dark" || stored === "light") {
      setDark(stored === "dark");
      return;
    }
    const os = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(os.matches);
    const follow = (e: MediaQueryListEvent) => setDark(e.matches);
    os.addEventListener("change", follow);
    return () => os.removeEventListener("change", follow);
  }, []);

  /* Travel to the studio. Opening any shift9.dev link flies the desktop's own
     ASCII field through a tunnel and then follows it. The vanishing point is
     whatever was clicked, so the move starts where the eye already is.

     EVERY door, not just the tile. There are four ways into the studio from
     this desktop - the header CTA, the door tile, the taskbar pin and a text
     link in the About window - and for a while only the tile played the
     tunnel; the other three cut straight through. Two surfaces joined by a
     transition that appears on one route out of four is not a transition, it
     is a bug that happens to look intentional.

     Only the plain-left-click case is intercepted: modified clicks (new tab,
     new window, download) and reduced motion fall straight through to normal
     link behaviour, so nothing about the link is taken away. */
  const [tunnel, setTunnel] = useState(false);
  const router = useRouter();

  const enterStudio = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();

    /* Start fetching the studio the moment the tunnel starts, not when it
       ends. The travel is a fixed 1.1s and the navigation after it was a cold
       document request on top - roughly half a second of black between the
       tunnel finishing and the studio painting. Warming the document during
       the animation puts that fetch inside time the visitor is already
       spending, so the two overlap instead of queueing.

       The prefetch alone was not enough, and this is the split second of hang
       before the studio appears. It was warming the *document*, because the
       handoff used location.href — which throws away the React tree, reparses
       a document and repaints from nothing no matter how warm the cache is.
       The fall would finish, and then the browser would go and do all of that.

       router.prefetch + router.push instead: a client-side transition into an
       already-fetched static route, so when the hole takes the frame the
       studio is mounted behind it rather than being asked for. */
    router.prefetch(STUDIO_HREF);

    setTunnel(true);
  }, [router]);

  const toggleTheme = useCallback(() => {
    setDark((d) => {
      const next = !d;
      try {
        window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        /* storage blocked — the choice just does not persist */
      }
      return next;
    });
  }, []);

  /* Reveal the interactive desktop and tear down the intro overlay. Used by
     SKIP, by reduced-motion, and as the terminal step of the wake sequence. */
  const enterDesk = useCallback(() => {
    markIntroSeen();
    setMode("desk");
    setLoading(false);
    setCurtainDone(true);
    setCurtainOpening(false);
    videoRef.current?.pause();
    videoBRef.current?.pause();
    const stage = stageRef.current;
    const wake = wakeRef.current;
    const glow = glowRef.current;
    const desk = deskRef.current;
    if (stage) stage.style.display = "none";
    if (wake) wake.style.display = "none";
    if (glow) glow.style.display = "none";
    if (desk) {
      desk.classList.remove(cls("boot"));
      desk.style.transform = "none";
      desk.style.opacity = "1";
    }
  }, []);

  /* Playback now always follows a click, so the browser has no reason to
     refuse it and there is no autoplay-blocked state to design for. The one
     remaining failure — a codec the browser cannot decode — drops straight to
     the desktop rather than stranding anyone on a black rectangle. */
  const startVid = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.setAttribute("muted", "");
    vid.playsInline = true;
    vid.play().catch(() => enterDesk());
  }, [enterDesk]);

  /* Who never sees the front door. Reduced motion: an intro is exactly the
     kind of thing that setting is asking you not to run. Already arrived this
     session: coming back from the studio, the banner or the invitation puts
     you at the desk, not outside the house again.

     This has to live apart from the playback effect below — that one cannot
     run until a video exists, and now no video exists until it is asked for. */
  useEffect(() => {
    if (
      reducedMotion || introAlreadySeen()
    ) {
      setMode("desk");
      enterDesk();
    }
  }, [enterDesk, reducedMotion]);

  useEffect(() => {
    if (mode !== "film" || reducedMotion) return;
    const vid = videoRef.current;
    const stage = stageRef.current;
    const desk = deskRef.current;
    if (!vid || !stage || !desk) return;
    let cancelled = false;
    let runtimeBail: ReturnType<typeof setTimeout> | null = null;

    startVid();

    const onLoaded = () => {
      if (vid.paused) startVid();
    };
    /* The gate stays up, loader spinning, until frames are actually coming.
       `playing` rather than `loadeddata`: data arriving is not the same as
       the picture moving, and dropping the gate a beat early is how you get
       a flash of black between the door and the film. */
    const onPlaying = () => {
      if (cancelled) return;
      clearTimeout(loadBail);
      if (runtimeBail === null) runtimeBail = setTimeout(enterDesk, 26000);
      setLoading(false);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setCurtainDone(true);
      }
    };
    vid.addEventListener("loadeddata", onLoaded);
    vid.addEventListener("playing", onPlaying);
    /* If it cannot play at all, do not strand anyone on a spinner. */
    const onFail = () => {
      if (!cancelled) enterDesk();
    };
    vid.addEventListener("error", onFail);
    const loadBail = setTimeout(onFail, 12000);

    /* ── THE JOIN AT TEN SECONDS ───────────────────────────────────────────
       Both beats are 10.04s, so the handoff lands at exactly the moment a
       visitor has settled in — and it was the ugliest thing on the site.

       It used to be one element with its `src` reassigned on `ended`. Three
       separate faults, all of them visible at once:

       - Nothing fetched the second beat until the instant it was needed, so
         13.6MB started downloading at the cut. That is the stutter.
       - Assigning `src` runs the media load algorithm, which resets
         readyState to HAVE_NOTHING. With no frame to show, the element falls
         back to its `poster` — and the poster is the film's *opening*
         exterior shot. So the join flashed a frame from the beginning of the
         film before beat four appeared. Those are the stray frames.
       - The old clip's decoder was torn down and a new one spun up between
         two frames that were meant to be continuous.

       Two elements instead. The second one is loaded while the first one
       plays, pre-rolled so frame zero is already decoded, and revealed with a
       short dissolve over the top of the first. Nothing is torn down mid-cut
       and nothing has to start from cold.

       The dissolve is `--s9-dur-cut`. Set that token to 0ms for a pure cut —
       the mechanism is a straight swap either way, the fade only softens the
       frame the two beats meet on. */
    const beatB = videoBRef.current;

    /* Deliberately after the first beat is actually moving, not on mount:
       both files are large, and the beat you are watching gets the bandwidth
       first. Ten seconds is a long head start for a 13.6MB fetch. */
    const warmSecondBeat = () => {
      if (!beatB || beatB.getAttribute("data-warm") === "1") return;
      beatB.setAttribute("data-warm", "1");
      beatB.preload = "auto";
      beatB.load();
    };
    /* Decode frame zero ahead of time. A muted element is allowed to play
       without a gesture, and this one has one anyway — the visitor pressed
       Enter — so a silent play/pause leaves the decoder warm and the first
       frame ready to paint. */
    const prerollSecondBeat = () => {
      if (!beatB) return;
      beatB.muted = true;
      beatB.playsInline = true;
      beatB
        .play()
        .then(() => {
          if (cancelled) return;
          beatB.pause();
          beatB.currentTime = 0;
        })
        .catch(() => {
          /* Pre-roll is an optimisation. If it is refused, the handoff still
             works — it just starts a fraction later. */
        });
    };
    vid.addEventListener("playing", warmSecondBeat, { once: true });
    beatB?.addEventListener("canplaythrough", prerollSecondBeat, { once: true });

    const timers: ReturnType<typeof setTimeout>[] = [];
    const frames: number[] = [];

    const wakeIntoDesktop = () => {
      const wake = wakeRef.current;
      const glow = glowRef.current;
      if (!wake || !glow) return;
      wake.classList.add(cls("dim")); // room dims onto the dark screen
      timers.push(
        setTimeout(() => {
          desk.classList.add(cls("boot")); // screen powers on
          desk.classList.add(cls("on"));
          glow.classList.add(cls("on")); // backlight bloom
          frames.push(
            requestAnimationFrame(() => {
              desk.classList.add(cls("boot"));
              desk.classList.add(cls("on"));
            }),
          );
          stage.style.opacity = "0";
        }, 300),
      );
      timers.push(
        setTimeout(() => {
          wake.classList.remove(cls("dim"));
          glow.classList.remove(cls("on"));
          enterDesk();
        }, 1320),
      );
    };

    const handOffToSecondBeat = () => {
      if (!beatB) {
        wakeIntoDesktop();
        return;
      }
      /* Reveal only once playback has actually started. A resolved play()
         keeps the held final frame covering a slow decoder instead of
         dissolving onto an empty or poster-only second layer. */
      beatB
        .play()
        .then(() => {
          if (cancelled) return;
          beatB.classList.add(cls("beatIn"));
          timers.push(setTimeout(() => vid.pause(), 600));
        })
        .catch(() => {
          if (!cancelled) enterDesk();
        });
    };

    /* First beat ends → hand to the second. Second beat ends → wake the
       screen. The last beat's final frame is the monitor filling the screen,
       which is where the real desktop underneath takes over. */
    vid.addEventListener("ended", handOffToSecondBeat);
    beatB?.addEventListener("ended", wakeIntoDesktop);
    /* A second beat that cannot be decoded must not strand anyone on a held
       frame — the way forward never depends on the film. */
    beatB?.addEventListener("error", enterDesk);

    return () => {
      cancelled = true;
      clearTimeout(loadBail);
      if (runtimeBail !== null) clearTimeout(runtimeBail);
      vid.removeEventListener("loadeddata", onLoaded);
      vid.removeEventListener("playing", onPlaying);
      vid.removeEventListener("error", onFail);
      vid.removeEventListener("playing", warmSecondBeat);
      vid.removeEventListener("ended", handOffToSecondBeat);
      beatB?.removeEventListener("canplaythrough", prerollSecondBeat);
      beatB?.removeEventListener("ended", wakeIntoDesktop);
      beatB?.removeEventListener("error", enterDesk);
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
    };
  }, [mode, enterDesk, startVid, reducedMotion]);

  const openFolder = useCallback((key: string) => {
    if (folderTimerRef.current) clearTimeout(folderTimerRef.current);
    setOpening(key);
    folderTimerRef.current = setTimeout(() => {
      setOpening(null);
      setOpenWin(key as Exclude<OpenWin, "about" | null>);
      folderTimerRef.current = null;
    }, 260);
  }, []);

  const openWindowNow = useCallback((windowName: OpenWin) => {
    if (folderTimerRef.current) clearTimeout(folderTimerRef.current);
    folderTimerRef.current = null;
    setOpening(null);
    setOpenWin(windowName);
  }, []);

  useEffect(
    () => () => {
      if (folderTimerRef.current) clearTimeout(folderTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  // Escape closes the folder window.
  useEffect(() => {
    if (!openWin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenWin(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openWin]);

  const winTitle =
    openWin === "about" ? "About — Kariim" : openWin ? DATA[openWin].t : "";
  const winNote =
    openWin === "about"
      ? "Available for product, interface, and studio partnerships."
      : openWin
        ? DATA[openWin].n
        : "";

  return (
    <div className={`${s.root} ${dark ? s.dark : ""}`}>
      {tunnel ? (
        <FadeToBlack
          onDone={() => {
            router.push(STUDIO_HREF);
          }}
        />
      ) : null}

      {/* STAGE 0 — the front door. A still and two controls. Nothing is
          fetched, decoded or played until the visitor asks for it, which is
          also why this is real content rather than an overlay on a video. */}
      {mode === "gate" || !curtainDone ? (
        <div
          className={`${s.gate} ${curtainOpening ? s.gateOpening : ""}`}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) {
              setCurtainDone(true);
              setCurtainOpening(false);
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.gatePlate} src={ENTRY_PLATE} alt="" />
          {mode === "film" ? (
            <div className={s.gateCurtains} aria-hidden="true">
              <span className={s.gateCurtainLeft} />
              <span className={s.gateCurtainRight} />
            </div>
          ) : null}
          <div className={s.gateVeil} aria-hidden="true" />
      <div className={s.gateGlow} aria-hidden="true" />

          <div className={s.gateBody}>
            {/* The same lockup the desktop carries, so the front door and
                the room behind it are signed by the same hand.

                The wordmark only. The icon is on the Enter button further
                down this same screen, and carrying it here as well put it
                twice in one view — which is the whole reason it left the
                desktop header in the first place. */}
            <p className={s.gateMark}>
              <span className={s.gateWord}>
                Shift-
                <Shift9Mark className={s.gateMarkGlyph ?? ""} size={22} />
              </span>
            </p>
            <p className={s.gateLine}>
              A studio that builds interfaces, tools and product surfaces.
            </p>

            <div className={s.gateActions}>
              {/* The primary control is drawn as framing marks rather than a
                  filled pill: this site's language is instrumentation, and a
                  glowing gradient button would belong to a different one. */}
              <button
                type="button"
                className={s.enter}
                aria-label={`${ENTER_LABEL} — ${INTRO_RUNTIME}`}
                 onClick={() => {
                   setCurtainDone(false);
                   setCurtainOpening(true);
                   setLoading(true);
                   setMode("film");
                 }}
              >
                <span className={s.enterFrame} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                {/* The label opens its tracking on approach. Animating
                    letter-spacing does that in one line and forces a layout
                    pass on every frame of it — the only animation on the site
                    that was not running on the compositor.

                    Per-character transforms get the same move for free: each
                    glyph slides right by a little more than the one before, so
                    the spacing grows without any glyph being redrawn or
                    re-measured. scaleX would have been the cheap version of
                    this and is wrong — it stretches the letterforms instead of
                    spacing them.

                    The characters are decorative because they are a string cut
                    into pieces; the button carries the real name for anything
                    that is not looking at it. */}
                <span className={s.enterLabel} aria-hidden="true">
                  {ENTER_LABEL.split("").map((ch, i) => (
                    <span
                      key={`${ch}-${i}`}
                      className={s.enterChar}
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </span>
                {/* The mark becomes the loading state once Enter is pressed;
                    the runtime remains in the accessible name without adding
                    a second visible label beside the 9. */}
                <span
                  className={`${s.enterIcon} ${loading ? s.enterIconBusy : ""}`}
                  aria-hidden="true"
                >
                  {/* The drawn mark, not the app-icon raster. This slot used
                      to hold the 96px base64 PNG scaled to 22px: a bright
                      cyan-on-white rounded square dropped into a monospace
                      row, which read as a stray asset rather than as part of
                      the lockup — and it was the last cyan left on the site
                      after the palette came out. Shift9Mark is currentColor,
                      so it is simply the colour of the row it sits in. */}
                  <span className={s.enterIconArt}>
                    <Shift9Mark size={20} />
                  </span>
                </span>
              </button>

              {/* Offered up front and at full size. Burying the way past a
                  twenty-second film in a corner of the film is how you make
                  someone close the tab instead. */}
              <button
                type="button"
                className={s.skipGate}
                onClick={() => {
                  setMode("desk");
                  enterDesk();
                }}
              >
                Skip the intro <span aria-hidden="true">&#8594;</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* STAGE 1 — the film. Decorative overlay; the desktop below is the real
          content, so this is hidden from assistive tech. */}
      <div className={s.stageVideo} ref={stageRef} aria-hidden="true">
        {mode === "film" ? (
          <>
            <video
              className={s.beat}
              ref={videoRef}
              src={OPENING[0]}
              poster={OPENING_POSTER}
              muted
              playsInline
              preload="auto"
            />
            {/* The second beat, stacked over the first and transparent until
                the join. No `poster`: a poster is what the element paints when
                it has no frame, and the one frame this must never show is a
                still from somewhere else in the film. `preload="none"` until
                the first beat is actually playing, so the two fetches do not
                race each other for the opening seconds. */}
            <video
              className={`${s.beat} ${s.beatB}`}
              ref={videoBRef}
              src={OPENING[1]}
              muted
              playsInline
              preload="none"
            />
          </>
        ) : null}
        {mode === "film" ? (
          <button
            type="button"
            className={s.skip}
            onClick={(e) => {
              e.stopPropagation();
              enterDesk();
            }}
          >
            SKIP &#8594;
          </button>
        ) : null}
      </div>

      {/* WAKE — dark screen powers on into the real desktop. Decorative. */}
      <div className={s.wake} ref={wakeRef} aria-hidden="true" />
      <div className={s.glow} ref={glowRef} aria-hidden="true" />

      {/* STAGE 2 — the desktop, mirroring the video's final frame. Always
          rendered so it is the SSR-legible static fallback. */}
      <div className={`${s.desktop} ${s.show} ${s.on}`} ref={deskRef}>
        {/* Live wallpaper — the real banner as an animated ASCII field, with
            the Windows tint veiled over it. Decorative; the chrome above is
            the content. */}
        {/* The live wallpaper stands down the moment the sinkhole starts and
            the tunnel draws in its place, in this same slot and under the same
            veil. Both at once would be the artwork twice — one copy falling
            and an identical one sitting perfectly still behind it. The veil
            stays either way, so the tint over the field never blinks. */}
        <div className={s.wallLayer} aria-hidden="true">
          <AsciiWallpaper className={s.wallCanvas} ink={!dark} fitTo={gridRef} />
          <div className={s.wallVeil} />
        </div>

        <div className={s.titlerow}>
          {/* Just the wordmark. The icon used to sit here too, which with a
              drawn 9 in the word was the same mark twice in one lockup; it
              earns its keep on the front door instead, where it has a job. */}
          <span className={s.brand}>
            <span className={s.brandWord}>
              Shift-
              <Shift9Mark className={s.brandMark ?? ""} size={26} />
            </span>
          </span>
          <div className={s.navlinks}>
            {/* Set dressing. This is a picture of an operating system, and a
                browser chrome without a nav row does not read as one — but
                these have never gone anywhere and never will, so they are
                hidden from assistive tech (which would otherwise announce
                four links that do not exist) and demoted visually so they
                stop looking like the real controls beside them. */}
            <span className={s.inert} aria-hidden>Home</span>
            <span className={s.inert} aria-hidden>About</span>
            <span className={s.inert} aria-hidden>Accounts</span>
            <span className={s.inert} aria-hidden>Log in</span>
            <button
              type="button"
              className={`${s.themeBtn} ${s.tipHost}`}
              onClick={toggleTheme}
              aria-pressed={dark}
              data-tip={dark ? "Switch to light" : "Switch to dark"}
              data-tip-below=""
            >
              {dark ? SUN : MOON}
              {dark ? "Light" : "Dark"}
            </button>
            <a className={s.cta} href={STUDIO_HREF} onClick={enterStudio}>
              Enter shift9.dev &#8594;
            </a>
            <span className={s.winbtns}>&#8212; &#9634; &#10005;</span>
          </div>
        </div>

        <div className={s.searchrow}>
          {/* Same: dressing, not a control. It was the most prominent thing
              on the desktop and did nothing at all when typed into — the page
              contains no input element. Demoted and hidden rather than wired
              up, because a working search over five folders is a worse answer
              than not promising one. */}
          <div className={`${s.search} ${s.inert}`} aria-hidden>
            <span>Search the studio&#8230;</span>
            <span>&#128269;</span>
          </div>
          <div className={s.viewbtn}>
            <span
              className={`${s.vseg} ${s.tipHost} ${compact ? "" : s.on}`}
              role="button"
              tabIndex={0}
              data-tip="Grid view"
              onClick={() => setCompact(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setCompact(false);
              }}
            >
              &#8862; Grid
            </span>
            <span
              className={`${s.vseg} ${s.tipHost} ${compact ? s.on : ""}`}
              role="button"
              tabIndex={0}
              data-tip="Icon view"
              onClick={() => setCompact(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setCompact(true);
              }}
            >
              &#9776; Icons
            </span>
          </div>
        </div>

        <div className={s.main}>
          <div className={s.side}>
            <div className={s.sideflex}>
              {SIDEBAR.map((it) => (
                <div key={it.label} className={`${s.it} ${it.on ? s.on : ""}`}>
                  <span className={s.glyph}>{it.glyph}</span>
                  {it.label}
                </div>
              ))}
              <div className={`${s.it} ${s.me}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SHIFT9_LOGO} alt="" />
                Kariim &#8212; Shift-9
              </div>
            </div>
          </div>

          <div className={`${s.grid} ${compact ? s.compact : ""}`} ref={gridRef}>

            {FOLDERS.map((f) => (
              <div
                key={f.key}
                className={`${s.dicon} ${opening === f.key ? s.diconOpening : ""}`}
                data-f={f.key}
                role="button"
                tabIndex={0}
                onClick={() => openFolder(f.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openFolder(f.key);
                  }
                }}
              >
                <div className={s.fico}>
                  <div className={s.tab} />
                  <div className={s.body2} />
                  <div className={s.lip} />
                  <span className={s.gly}>{f.glyph}</span>
                </div>
                <div className={s.fname}>{f.name}</div>
                <div className={s.fcount}>{f.count}</div>
              </div>
            ))}

            {/* About is a person, not a directory — it gets a real app tile. */}
            <div
              className={`${s.dicon} ${s.about}`}
              data-f="about"
              role="button"
              tabIndex={0}
              onClick={() => openWindowNow("about")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openWindowNow("about");
                }
              }}
            >
              <div className={`${s.aboutico} ${s.holo}`}>{ABOUT_GLYPH}</div>
              <div className={s.fname}>About</div>
              <div className={s.fcount}>Kariim &#183; Shift-9</div>
            </div>

            {/* The door tile closes the row rather than opening it — Kariim's call.
                The folders are what a visitor came to look through, and the
                entrance reads as the conclusion of that row rather than as a
                thing to get past. */}
            <a
              className={`${s.dicon} ${s.site}`}
              href={STUDIO_HREF}
              style={{ textDecoration: "none" }}
              onClick={enterStudio}
            >
              <div className={`${s.appico} ${s.holo} ${s.holoDark}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SHIFT9_LOGO} alt="shift9.dev" />
              </div>
              <div className={s.fname}>Shift9.dev</div>
              {/* No arrow. The line is the invitation, not a button label, and
                  every other tile's second line is a plain statement. */}
              <div className={s.fcount}>Enter the live site</div>
            </a>
          </div>
        </div>

        {/* It opens a mail client, so it is an envelope. As a speech bubble
            it read as a live-chat widget — a promise of someone on the other
            end right now, which is not what this is. */}
        {/* A bare mailto is a button that does nothing on any machine without
            a mail client configured — which is most of them, and it gives no
            feedback either way, so it reads as broken rather than as
            unhandled. The href stays, because where a handler does exist that
            is the fastest path and it keeps right-click → copy working. The
            click also puts the address on the clipboard and says so, so the
            button always does something the visitor can see. */}
        <a
          className={s.helpdot}
          href={`mailto:${STUDIO_EMAIL}`}
          aria-label={`Email the studio — ${STUDIO_EMAIL}`}
          data-tip={STUDIO_EMAIL}
          onClick={() => {
            navigator.clipboard?.writeText(STUDIO_EMAIL).then(
              () => {
                setCopied(true);
                if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
                copyTimerRef.current = setTimeout(() => {
                  setCopied(false);
                  copyTimerRef.current = null;
                }, 2400);
              },
              () => {
                /* Clipboard refused (insecure context, or denied). The mailto
                   still fires and the address is in the tooltip. */
              },
            );
          }}
        >
          &#9993;
        </a>
        {/* Live region: the confirmation is the whole point of the click for
            anyone whose machine ignored the mailto, so it has to be announced
            and not only drawn. */}
        <span className={`${s.helpnote} ${copied ? s.helpnoteIn : ""}`} role="status" aria-live="polite">
          {copied ? `${STUDIO_EMAIL} copied` : ""}
        </span>

        <div className={s.taskbar}>
          <div className={`${s.tb} ${s.start}`} />
          <div className={`${s.tb} ${s.tipHost}`} data-tip="Search">&#128269;</div>
          <a
            className={`${s.tb} ${s.pin} ${s.tipHost}`}
            href={STUDIO_HREF}
            data-tip="shift9.dev"
            onClick={enterStudio}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHIFT9_LOGO} alt="" />
          </a>
          <div className={`${s.tb} ${s.tipHost}`} data-tip="shift9.dev">&#127760;</div>
          <div className={`${s.tb} ${s.tipHost}`} data-tip="Email the studio">&#9993;</div>
          <Clock className={s.clock} />
        </div>
      </div>

      {/* FOLDER WINDOW */}
      <div
        className={`${s.win} ${openWin ? s.show : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpenWin(null);
        }}
      >
        {openWin && (
          <div className={s.window} role="dialog" aria-modal="true" aria-label={winTitle}>
            <div className={s.wtBar}>
              <span className={s.path}>
                Shift-9 &#8250; Portfolio &#8250; <b>{winTitle}</b>
              </span>
              <button type="button" onClick={() => setOpenWin(null)} aria-label="Close">
                &#10005;
              </button>
            </div>
            <div className={s.wbody}>
              {openWin === "about" ? (
                <div className={s.aboutBody}>
                  <p>I&#8217;m Kariim &#8212; founder of Shift-9.</p>
                  <p>
                    I ran restaurants for a decade before I wrote a line of
                    code. Now I build software: apps, tools, games, and the
                    systems that run them.
                  </p>
                  <p>
                    Everything here &#8212; the studio itself, and
                    Just-a-Pinch, my first shipped app, now live on Google
                    Play &#8212; was built on a Samsung Galaxy Z Fold and a
                    Steam Deck. No dev machine. No office. A folding phone, a
                    handheld, and a refusal to wait for the right setup.
                  </p>
                  <p>The gear was never the point. The systems are.</p>
                  <div className={s.sig}>&#8212; KARIIM &#183; SHIFT-9</div>
                  <div className={s.contact}>
                    Hire me for &#8594; full app builds &#183; web design &#183;
                    React UI &#183; automation
                    <br />
                    Email &#8594;{" "}
                    <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a>{" "}
                    &#183; Studio &#8594;{" "}
                    <a href={STUDIO_HREF} onClick={enterStudio}>
                      shift9.dev
                    </a>
                  </div>
                </div>
              ) : (
                DATA[openWin].items.map((it, i) => (
                  <div key={it.n} className={s.item}>
                    <span className={s.no}>{String(i + 1).padStart(2, "0")}</span>
                    <div className={s.info}>
                      <h3>
                        {/* Linked only where a destination exists. External
                            destinations open in a new tab so the desktop the
                            visitor is standing in does not disappear. */}
                        {it.h ? (
                          <a
                            href={it.h}
                            {...(it.h.startsWith("http")
                              ? { target: "_blank", rel: "noreferrer" }
                              : {})}
                          >
                            {it.n}
                          </a>
                        ) : (
                          it.n
                        )}
                      </h3>
                      <p>{it.d}</p>
                      <div className={s.tags}>
                        {it.tags.map((t) => (
                          <span key={t} className={s.tag}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`${s.status} ${s[it.sc]}`}>{it.s}</span>
                  </div>
                ))
              )}
            </div>
            <div className={s.note}>{winNote}</div>
          </div>
        )}
      </div>
    </div>
  );
}
