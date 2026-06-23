import { GridFrame, MonoLabel, SkeletonWorkWall } from "@shift9/ui";

/** Semantic loading screen — Next.js Suspense boundary uses this while
    async server content streams in. Skeletons mirror the real layout. */
export default function Loading() {
  return (
    <main className="relative mx-auto min-h-screen max-w-[84rem] px-6 py-28 sm:px-10">
      <GridFrame coord="X:--- · Y:SYNC" />
      <MonoLabel className="mb-8">loading // syncing instrument…</MonoLabel>
      <div className="mb-12 h-16 w-3/4 animate-pulse bg-surface/50" />
      <SkeletonWorkWall />
    </main>
  );
}
