import { GridFrame, MonoLabel, SkeletonWorkWall } from "@shift9/ui";

/** The work wall keeps the instrument skeleton it was designed against.
 *
 * A `loading.tsx` applies to its segment and everything nested under it, so
 * the studio's black fallback would otherwise inherit down to this page too —
 * and this page really is the framed instrument layout the skeleton mirrors. */
export default function StudioWorkLoading() {
  return (
    <main className="relative mx-auto min-h-screen max-w-[84rem] px-6 py-28 sm:px-10">
      <GridFrame coord="X:--- · Y:SYNC" />
      <MonoLabel className="mb-8">loading // syncing instrument…</MonoLabel>
      <div className="mb-12 h-16 w-3/4 animate-pulse bg-surface/50" />
      <SkeletonWorkWall />
    </main>
  );
}
