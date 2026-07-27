/** The dolly's own loading state.
 *
 * The root `app/loading.tsx` renders the INSTRUMENT work-wall skeleton, which
 * is the wrong surface entirely here: the studio is absolute black with one
 * shot filling the frame, so falling back to a grid of shimmer cards on a
 * framed instrument page reads as the old page still being there.
 *
 * Black, holding the same ground the first set-piece lands on, so the arrival
 * is a fade rather than a swap between two different designs. */
export default function StudioLoading() {
  return (
    <div
      aria-label="Loading the studio"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--s9-black, #000)",
      }}
    />
  );
}
