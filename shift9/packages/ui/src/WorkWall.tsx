"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useMagnetic } from "@shift9/motion";
import { cn } from "./cn";

export interface Project {
  title: string;
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

/**
 * The Living Work Wall — the angled, brutalist tile-plane. Each tile is
 * magnetic; the skew and depth-pop only apply under `motion-safe`, so
 * reduced-motion users get a calm, flat grid. In production these tiles
 * stream from Supabase `projects`; here they accept a static prop.
 */
export function WorkWall({
  projects,
  className,
}: {
  projects: Project[];
  className?: string;
}) {
  return (
    <div className={cn("lg:[perspective:1600px]", className)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:[transform-style:preserve-3d] lg:motion-safe:[transform:rotateX(13deg)_rotateZ(-7deg)]">
        {projects.map((project, i) => (
          <WorkTile key={project.title} project={project} index={i} />
        ))}
      </div>
    </div>
  );
}

function WorkTile({ project, index }: { project: Project; index: number }) {
  const { ref, x, y, bind } = useMagnetic<HTMLDivElement>(0.22, 170);
  const isPulse = project.accent === "pulse";

  return (
    <motion.article
      ref={ref}
      style={{ x, y }}
      {...bind}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
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
          target="_blank"
          rel="noopener noreferrer"
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
        style={{ fontVariationSettings: '"wght" 720, "wdth" 112' }}
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
              className="pointer-events-none text-base leading-none text-signal opacity-0 transition-premium group-hover:opacity-100"
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
