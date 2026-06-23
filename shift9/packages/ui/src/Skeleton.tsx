import * as React from "react";
import { cn } from "./cn";

/**
 * Semantic skeleton screens. The shimmer is a CSS animation, so the
 * global `prefers-reduced-motion` rule in @shift9/theme automatically
 * freezes it to a static block.
 */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-surface/50", className)} />;
}

export function SkeletonWorkTile() {
  return (
    <div className="flex min-h-[15rem] flex-col justify-between border border-line bg-well/40 p-5">
      <div className="flex justify-between">
        <SkeletonBlock className="h-3 w-8" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
      <SkeletonBlock className="h-8 w-3/4" />
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-1/2" />
        <div className="flex gap-1.5">
          <SkeletonBlock className="h-4 w-12" />
          <SkeletonBlock className="h-4 w-12" />
          <SkeletonBlock className="h-4 w-10" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonWorkWall({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonWorkTile key={i} />
      ))}
    </div>
  );
}
