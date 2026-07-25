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

import { useCallback, useEffect, useRef, useState } from "react";
import { AsciiTunnel } from "./AsciiTunnel";
import { AsciiWallpaper } from "./AsciiWallpaper";
import s from "./EnterTheStudio.module.css";
import { SHIFT9_LOGO } from "./logo-data";
/* CSS-module class access is typed `string | undefined` under
   noUncheckedIndexedAccess; classList APIs need a plain string. */
const cls = (name: string): string => (s as Record<string, string>)[name] ?? name;

/* The live studio (INSTRUMENT work wall) now lives at /studio; the entry is the
   landing route. Same-site path, no target=_blank to itself (HANDOFF §8.1). */
const STUDIO_HREF = "/studio";

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

const OPENING: readonly string[] = [
  "/experience/opening/01-03-approach-entry-hall-v4.mp4",
  "/experience/opening/04-desk-mouse-screen-v5.mp4",
];

type Status = "live" | "ship" | "dev" | "rnd";
/* `h` is the real destination, and only present when one genuinely exists —
   a live site, the design system, or a case page that is actually built. Items
   without a destination stay unlinked rather than pointing at a placeholder. */
type Item = { n: string; s: string; sc: Status; d: string; tags: string[]; h?: string };
type Folder = { t: string; n: string; items: Item[] };

/* Canonical content — copied verbatim from the frozen prototype / HANDOFF §6.
   Do not rewrite, reorder, or upgrade a status (contract §18 guardrail). */
const DATA: Record<"apps" | "games" | "tools", Folder> = {
  apps: {
    t: "Apps",
    n: "live links where a destination exists; unlinked items are not shipped yet",
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
      },
      {
        n: "Learning App",
        s: "SHIPPING",
        sc: "ship",
        d: "A children’s reading tool that turns practice into play. Built for real kids, tested by real kids.",
        tags: ["Python", "Education", "Kids"],
      },
      {
        n: "Lumen Projection Mapper",
        s: "IN DEV",
        sc: "dev",
        d: "Point a projector at anything, drag corners on your phone, and the image warps to fit. Projection mapping with zero jargon.",
        tags: ["JavaScript", "WebSockets", "Projection"],
      },
    ],
  },
  games: {
    t: "Games",
    n: "prototype note: honest status labels stay — labeled WIP earns more trust than mystery polish",
    items: [
      {
        n: "Voxel Arcade Basketball",
        s: "IN DEV",
        sc: "dev",
        d: "Arcade basketball in Godot — arena, broadcast camera, crowd shader bowl, and player movement live; ball physics and box score next.",
        tags: ["Godot", "GDScript", "3D"],
        h: "/work/voxel-arcade-basketball",
      },
      {
        n: "Midnight Return",
        s: "IN DEV",
        sc: "dev",
        d: "A metroidvania platformer in C#. Exploration-first design.",
        tags: ["C#", "Metroidvania"],
        h: "/work/midnight-return",
      },
      {
        n: "Game Design Forge",
        s: "R&D",
        sc: "rnd",
        d: "UE5 plugin suite letting non-programmers assemble games LEGO-style: socket-matched auto-tiling, one-click destruction, and a tutorial overlay that watches what you do. Blueprint complete; build phase next.",
        tags: ["Unreal 5", "C++", "R&D"],
      },
    ],
  },
  tools: {
    t: "Tools",
    n: "prototype note: WinFix = renamed whome-diagnostic · Titanium Forge Pro folds in when the zip lands",
    items: [
      {
        n: "Titanium Forge Pro",
        s: "IN DEV",
        sc: "dev",
        d: "A UI/UX component workbench — a dark-mode React component library with live demos and copyable snippets you can lift straight into a project. In active development.",
        tags: ["React", "TypeScript", "Design System", "Cloudflare"],
      },
      {
        n: "INSTRUMENT",
        s: "LIVE",
        sc: "live",
        d: "The design system running shift9.dev and pinch.shift9.dev — tokens, motion, accessibility. Proof you can click.",
        tags: ["Tailwind v4", "Motion", "A11y"],
        h: "/instrument",
      },
      {
        n: "Automation Systems",
        s: "LIVE",
        sc: "live",
        d: "The infrastructure behind the studio: Relay (cross-machine state handoff), a 400+ skill control plane governing AI-assisted builds, and claude-eyes (a screen-capture toolkit that gives coding agents vision). How one person ships like a team.",
        tags: ["Automation", "AI Agents", "Git", "Windows"],
      },
      {
        n: "Omni-3D",
        s: "IN DEV",
        sc: "dev",
        d: "A game-development toolkit in TypeScript.",
        tags: ["TypeScript", "3D", "Tooling"],
        h: "/work/omni-3d",
      },
      {
        n: "WinFix",
        s: "SHIPPED",
        sc: "ship",
        d: "A Windows utility that repairs the Windows 10 Home upgrade bug. Small tool, real problem, done. Windows 11 support on the roadmap.",
        tags: ["Python", "Windows", "Utility"],
        h: "/work/whome-diagnostic",
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wakeRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);

  const [tapVisible, setTapVisible] = useState(false);
  const [compact, setCompact] = useState(false);
  const [openWin, setOpenWin] = useState<OpenWin>(null);

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

  /* Travel to the studio. Opening the shift9.dev icon flies the desktop's own
     ASCII field through a tunnel and then follows the link. The vanishing point
     is the icon that was clicked, so the move starts where the eye already is.

     Only the plain-left-click case is intercepted: modified clicks (new tab,
     new window, download) and reduced motion fall straight through to normal
     link behaviour, so nothing about the link is taken away. */
  const [tunnel, setTunnel] = useState<{ x: number; y: number } | null>(null);

  const enterStudio = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    setTunnel({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }, []);

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

  const startVid = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    let p: Promise<void> | undefined;
    try {
      p = vid.play();
    } catch {
      /* ignore — handled by the tap fallback below */
    }
    if (p && typeof p.then === "function") {
      p.then(() => setTapVisible(false)).catch(() => {
        try {
          vid.load();
          vid.play();
        } catch {
          /* still blocked — surface the click-to-start lockup */
        }
        setTapVisible(true);
      });
    } else {
      setTapVisible(false);
    }
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    const stage = stageRef.current;
    const desk = deskRef.current;
    if (!vid || !stage || !desk) return;

    // Reduced motion: skip the intro entirely, land on the desktop.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      enterDesk();
      return;
    }

    vid.muted = true;
    vid.setAttribute("muted", "");
    vid.playsInline = true;
    startVid();

    const onLoaded = () => {
      if (vid.paused) startVid();
    };
    const onPlay = () => setTapVisible(false);
    vid.addEventListener("loadeddata", onLoaded);
    vid.addEventListener("play", onPlay);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const onEnded = () => {
      /* The opening is shot as separate beats but has to read as one take, so
         each clip hands straight to the next with no gap and no controls. Only
         after the last one does the screen wake into the desktop. */
      const next = OPENING.indexOf(vid.currentSrc.replace(window.location.origin, "")) + 1;
      if (next > 0 && next < OPENING.length) {
        vid.src = OPENING[next] ?? "";
        vid.play().catch(() => {
          /* refused mid-sequence — fall through to the desktop rather than
             stranding the visitor on a frozen frame. */
          enterDesk();
        });
        return;
      }

      const wake = wakeRef.current;
      const glow = glowRef.current;
      if (!wake || !glow) return;
      wake.classList.add(cls("dim")); // room dims onto the dark screen
      timers.push(
        setTimeout(() => {
          desk.classList.add(cls("boot")); // screen powers on
          desk.classList.add(cls("on"));
          glow.classList.add(cls("on")); // backlight bloom
          requestAnimationFrame(() => {
            desk.classList.add(cls("boot"));
            desk.classList.add(cls("on"));
          });
          stage.style.opacity = "0";
        }, 300),
      );
      timers.push(
        setTimeout(() => {
          // live interactive desktop
          stage.style.display = "none";
          wake.style.display = "none";
          wake.classList.remove(cls("dim"));
          glow.style.display = "none";
          glow.classList.remove(cls("on"));
          desk.classList.remove(cls("boot"));
          desk.style.transform = "none";
          desk.style.opacity = "1";
        }, 1320),
      );
    };
    vid.addEventListener("ended", onEnded);

    return () => {
      vid.removeEventListener("loadeddata", onLoaded);
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("ended", onEnded);
      timers.forEach(clearTimeout);
    };
  }, [enterDesk, startVid]);

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
      ? "prototype note: freelance-facing only — résumé/LinkedIn layer handled separately"
      : openWin
        ? DATA[openWin].n
        : "";

  return (
    <div className={`${s.root} ${dark ? s.dark : ""}`}>
      {tunnel ? (
        <AsciiTunnel
          originX={tunnel.x}
          originY={tunnel.y}
          onDone={() => {
            window.location.href = STUDIO_HREF;
          }}
        />
      ) : null}

      {/* STAGE 1 — the film. Decorative overlay; the desktop below is the real
          content, so this is hidden from assistive tech. */}
      <div className={s.stageVideo} ref={stageRef} aria-hidden="true">
        <video
          ref={videoRef}
          src={OPENING[0]}
          poster={OPENING_POSTER}
          muted
          autoPlay
          playsInline
          preload="auto"
        />
        <div
          className={`${s.tap} ${tapVisible ? s.show : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Enter the Studio — play intro"
          onClick={(e) => {
            e.stopPropagation();
            startVid();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") startVid();
          }}
        >
          <div className={s.lockC}>
            <span className={s.ring}>
              <span className={s.r1} />
              <span className={s.r2} />
              <span className={s.pulse} />
              <span className={s.pc}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
            <span className={s.lk}>
              <b>Shift&#160;9</b>
              <strong>Enter the Studio</strong>
              <em />
            </span>
          </div>
        </div>
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
        <div className={s.wallLayer} aria-hidden="true">
          <AsciiWallpaper className={s.wallCanvas} ink={!dark} />
          <div className={s.wallVeil} />
        </div>

        <div className={s.titlerow}>
          <span className={s.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHIFT9_LOGO} alt="Shift-9" />
            Shift <b>9</b>
          </span>
          <div className={s.navlinks}>
            <span>Home</span>
            <span>About</span>
            <span>Accounts</span>
            <span>Log in</span>
            <button
              type="button"
              className={s.themeBtn}
              onClick={toggleTheme}
              aria-pressed={dark}
              title={dark ? "Switch to light" : "Switch to dark"}
            >
              {dark ? SUN : MOON}
              {dark ? "Light" : "Dark"}
            </button>
            <a className={s.cta} href={STUDIO_HREF}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SHIFT9_LOGO}
                style={{ width: 16, height: 16, borderRadius: 4 }}
                alt=""
              />{" "}
              Enter shift9.dev &#8594;
            </a>
            <span className={s.winbtns}>&#8212; &#9634; &#10005;</span>
          </div>
        </div>

        <div className={s.searchrow}>
          <div className={s.search}>
            <span>Search the studio&#8230;</span>
            <span>&#128269;</span>
          </div>
          <div className={s.viewbtn}>
            <span
              className={`${s.vseg} ${compact ? "" : s.on}`}
              role="button"
              tabIndex={0}
              title="Grid view"
              onClick={() => setCompact(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setCompact(false);
              }}
            >
              &#8862; Grid
            </span>
            <span
              className={`${s.vseg} ${compact ? s.on : ""}`}
              role="button"
              tabIndex={0}
              title="Icon view"
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

          <div className={`${s.grid} ${compact ? s.compact : ""}`}>
            {/* Door-tile first — the prominent entrance to the live studio. */}
            <a
              className={`${s.dicon} ${s.site}`}
              href={STUDIO_HREF}
              style={{ textDecoration: "none" }}
              onClick={enterStudio}
            >
              <div className={s.appico}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SHIFT9_LOGO} alt="shift9.dev" />
              </div>
              <div className={s.fname}>shift9.dev</div>
              <div className={s.fcount}>Enter the live site &#8594;</div>
            </a>

            {FOLDERS.map((f) => (
              <div
                key={f.key}
                className={s.dicon}
                data-f={f.key}
                role="button"
                tabIndex={0}
                onClick={() => setOpenWin(f.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setOpenWin(f.key);
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
              onClick={() => setOpenWin("about")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setOpenWin("about");
              }}
            >
              <div className={s.aboutico}>{ABOUT_GLYPH}</div>
              <div className={s.fname}>About</div>
              <div className={s.fcount}>Kariim &#183; Shift-9</div>
            </div>
          </div>
        </div>

        <a className={s.helpdot} href="mailto:shift9.dev@gmail.com" aria-label="Email the studio">
          &#128172;
        </a>

        <div className={s.taskbar}>
          <div className={`${s.tb} ${s.start}`} />
          <div className={s.tb}>&#128269;</div>
          <a className={`${s.tb} ${s.pin}`} href={STUDIO_HREF} title="shift9.dev">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHIFT9_LOGO} alt="" />
          </a>
          <div className={s.tb}>&#127760;</div>
          <div className={s.tb}>&#9993;</div>
          <div className={s.clock}>
            9:41 AM
            <br />
            7/14/2026
          </div>
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
                    <a href="mailto:shift9.dev@gmail.com">shift9.dev@gmail.com</a>{" "}
                    &#183; Studio &#8594; <a href={STUDIO_HREF}>shift9.dev</a>
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
