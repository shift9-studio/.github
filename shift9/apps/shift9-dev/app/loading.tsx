/* ────────────────────────────────────────────────────────────────────────
   THE LOADING STATE — deliberately nothing.

   This is the Suspense fallback for every route that does not bring its own,
   which includes the entrance. It used to render a GridFrame, a mono
   "syncing instrument…" label and a SkeletonWorkWall — the skeleton of the
   work wall that no longer exists anywhere on this site. So the one place a
   visitor could still meet the old design was on the way to the new one: a
   few hundred milliseconds of it, before the threshold faded in over the top.

   A skeleton is only worth showing when it predicts the layout that follows.
   These routes do not share a layout — the entrance is a full-bleed plate,
   the invitation is a centred column, /soon is a one-bit poster — so there is
   no honest skeleton for all of them, and a wrong one is worse than none
   because it promises a page that never arrives.

   So: the void, and nothing else. On the entrance that is an exact match,
   since the threshold plate is near-black and the handoff is invisible.
   Everywhere else the pages are static and this is gone before it registers.
   ──────────────────────────────────────────────────────────────────────── */

export default function Loading() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--s9-void-2, #0b1120)",
      }}
    />
  );
}
