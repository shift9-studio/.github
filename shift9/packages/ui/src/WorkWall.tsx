"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  useMagnetic,
  useReducedMotionSafe,
  subscribeScroll,
  getScroll,
} from "@shift9/motion";
import { cn } from "./cn";

export interface Project {
  title: string;
  /** Stable slug for the project's detail page (/work/<slug>). */
  slug?: string;
  role: string;
  year: string;
  tags: string[];
  accent?: "signal" | "pulse";
  status?: string;
  /** Higgsfield-generated cinematic teaser — plays muted on hover */
  videoUrl?: string;
  /** Destination for the tile — live site or repo. Tile is non-clickable if unset. */
  href?: string;
  /** Short link affordance, e.g. "Live ↗" or "Repo ↗". */
  linkLabel?: string;
}

const SCAN_EASE = [0.16, 1, 0.3, 1] as const; // --s9-ease-out

/**
 * The Living Work Wall — the angled, brutalist tile-plane. The plane now
 * TRACKS you: it banks toward the cursor and drifts with scroll depth, so it
 * reads as a panel being aimed rather than a static screenshot. Each tile is
 * magnetic, scans in along the grid with a clip wipe, and snaps its label's
 * variable weight up as it locks into view.
 *
 * All of it is motion-safe: under reduced motion the plane stays flat, tiles
 * simply appear, and the label weight jumps without a tween. In production
 * these tiles stream from Supabase `projects`; here they accept a static prop.
 */
export function WorkWall({
  projects,
  className,
}: {
  projects: Project[];
  className?: string;
}) {
  const reduced = useReducedMotionSafe();
  const planeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (reduced) return;
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const unsubscribe = subscribeScroll(() => {});

    let px = 0; // cursor x, normalized -1..1
    let py = 0; // cursor y, normalized -1..1
    let active = mq.matches;
    const cur = { rx: 13, ry: 0, rz: -7 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (!active) return;
      px = (e.clientX / window.innerWidth - 0.5) * 2;
      py = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      const el = planeRef.current;
      if (el) {
        if (active) {
          const prog = getScroll().progress;
          const tx = 13 - py * 5 + (prog - 0.5) * 5; // tilt: cursor + scroll
          const ty = px * 6; // bank toward cursor
          const tz = -7 + px * 2;
          cur.rx += (tx - cur.rx) * 0.06;
          cur.ry += (ty - cur.ry) * 0.06;
          cur.rz += (tz - cur.rz) * 0.06;
          el.style.transform = `rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg) rotateZ(${cur.rz.toFixed(2)}deg)`;
        } else if (el.style.transform) {
          el.style.transform = ""; // hand control back to the Tailwind fallback
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onChange = () => {
      active = mq.matches;
    };
    mq.addEventListener("change", onChange);
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
      window.removeEventListener("pointermove", onMove);
      unsubscribe();
    };
  }, [reduced]);

  return (
    <div className={cn("lg:[perspective:1600px]", className)}>
      <div
        ref={planeRef}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:[transform-style:preserve-3d] lg:motion-safe:[transform:rotateX(13deg)_rotateZ(-7deg)]"
      >
        {projects.map((project, i) => (
          <WorkTile key={project.title} project={project} index={i} />
        ))}
      </div>
    </div>
  );
}

function WorkTile({ project, index }: { project: Project; index: number }) {
  const { ref, x, y, bind } = useMagnetic<HTMLDivElement>(0.22, 170);
  const [entered, setEntered] = React.useState(false);
  const isPulse = project.accent === "pulse";

  return (
    <motion.article
      ref={ref}
      style={{ x, y }}
      {...bind}
      initial={{ opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }}
      whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: SCAN_EASE }}
      onViewportEnter={() => setEntered(true)}
      className="group relative flex min-h-[15rem] flex-col justify-between border border-line bg-well/60 p-5 transition-premium hover:border-signal hover:bg-surface/70 motion-safe:hover:[transform:translateZ(42px)]"
    >
      {project.videoUrl && (
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 motion-reduce:hidden group-hover:opacity-[0.18]"
          src={project.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      )}
      {project.href && (
        <a
          href={project.href}
          {...(project.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          aria-label={`${project.title} — open ${(project.linkLabel ?? "link").replace("↗", "").trim().toLowerCase()}`}
          className="absolute inset-0 z-20"
        />
      )}
      <div className="flex items-center justify-between font-mono text-mono uppercase tracking-[0.22em] text-muted">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className={isPulse ? "text-pulse" : "text-signal"}>
          {project.status ?? "shipped"}
        </span>
      </div>

      <h3
        className="font-display text-2xl leading-[0.95] text-ink transition-premium group-hover:text-signal sm:text-3xl"
        style={{
          fontVariationSettings: entered
            ? '"wght" 720, "wdth" 112'
            : '"wght" 400, "wdth" 96',
        }}
      >
        {project.title}
      </h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-mono uppercase tracking-[0.18em] text-muted">
            {project.role} · {project.year}
          </p>
          {project.href && (
            <span
              aria-hidden
              className="pointer-events-none text-base leading-none text-signal opacity-60 transition-premium group-hover:opacity-100 group-hover:[filter:drop-shadow(0_0_6px_#22d3ee)]"
            >
              ↗
            </span>
          )}
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <li
              key={t}
              className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}
