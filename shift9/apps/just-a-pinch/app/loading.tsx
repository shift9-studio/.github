import { GridFrame, MonoLabel, SkeletonWorkWall } from "@shift9/ui";

/** Semantic loading screen — mirrors the real layout while content streams. */
export default function Loading() {
  return (
    <main className="relative mx-auto min-h-screen max-w-[84rem] px-6 py-28 sm:px-10">
      <GridFrame label="JUST A PINCH // INSTRUMENT" coord="X:--- · Y:PREP" />
      <MonoLabel className="mb-8">loading // warming the pan…</MonoLabel>
      <div className="mb-12 h-16 w-3/4 animate-pulse bg-surface/50" />
      <SkeletonWorkWall />
    </main>
  );
}
