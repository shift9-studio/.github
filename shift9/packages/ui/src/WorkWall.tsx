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
    <div className={cn("[perspective:1600px]", className)}>
      <div className="grid grid-cols-1 gap-4 [transform-style:preserve-3d] motion-safe:[transform:rotateX(13deg)_rotateZ(-7deg)] sm:grid-cols-2 lg:grid-cols-3">
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
        <p className="font-mono text-mono uppercase tracking-[0.18em] text-muted">
          {project.role} · {project.year}
        </p>
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
