import { useId } from "react";

/* ────────────────────────────────────────────────────────────────────────
   THE MARK — the 9 in Shift-9, cut and shifted.

   It is a numeral, not a badge. In the lockup it takes the place of the "9"
   in the wordmark, so it has to behave like a character: one colour, no
   gradients, legible at 16px, and correct on a light chrome or a black
   plate without a second file.

   ── Where the shape comes from ──────────────────────────────────────────
   Not invented. The proportions are measured off the org icon so the two
   read as the same hand:

     bowl     a circle tangent to the glyph's full width, centred at 0.355
              of its height — the icon's bowl is exactly that
     counter  0.378 of the glyph width, sitting a touch above the bowl's
              own centre
     tail     0.34 of the width, leaving the bowl's lower right and running
              down-left at 32 degrees to a flat foot

   The first attempt used a straight vertical stem and read as a "q". The
   icon's leg is a diagonal wedge, and matching its angle is what makes this
   a 9 rather than a shape that happens to be round on top.

   ── The shift ───────────────────────────────────────────────────────────
   One vertical cut down the middle; the right half drops six units. That is
   the name in the drawing — a 9, shifted — and it rhymes with the entrance,
   where the whole plate is fabric parted along a seam. Six, not nine: at
   nine the halves stop reading as one letter, which was measured by looking
   at it rather than by liking the coincidence of the number.

   ── Colour ──────────────────────────────────────────────────────────────
   Both halves are `currentColor`; the right one carries opacity. So the
   mark is tonal — one hue, two values, the cut reading as depth — and it
   inherits whatever the surface around it is using. Black on the desktop
   chrome, paper on the entrance plate, no variants to keep in sync.
   ──────────────────────────────────────────────────────────────────────── */

/* The drawing box. H is the glyph; SHIFT is the extra room the dropped half
   needs underneath it. */
const W = 90;
const H = 124;
const SHIFT = 6;
const GAP = 3;
const CUT = 45;

const R = W / 2;
const BOWL_CY = 0.355 * H;
const COUNTER_R = 0.189 * W;
const COUNTER_CY = 0.336 * H;

/* The tail, from the two rows measured on the icon: at 0.71H it spans
   0.44–0.78 of the width, at 0.97H it spans 0.22–0.56. That is a run of
   0.614 horizontal units per vertical unit — 31.6 degrees off vertical. */
const RUN = ((0.44 - 0.22) * W) / ((0.97 - 0.71) * H);
const TAIL_W = 0.34 * W;
const tailX = (y: number) => 0.44 * W - (y - 0.71 * H) * RUN;
const TAIL_TOP = 0.45 * H;
const TAIL = [
  `${tailX(TAIL_TOP)},${TAIL_TOP}`,
  `${tailX(TAIL_TOP) + TAIL_W},${TAIL_TOP}`,
  `${tailX(H) + TAIL_W},${H}`,
  `${tailX(H)},${H}`,
].join(" ");

/* The bowl as a ring: outer circle, then the counter wound the other way so
   evenodd punches it out. The tail is a separate shape that overlaps the
   ring — which is why the opacity below sits on the <g> and not on each
   shape. On the group it composites once; on the shapes the overlap would
   darken twice and draw a seam that is not in the design. */
const RING =
  `M${R} 0a${R} ${R} 0 100 ${2 * R}a${R} ${R} 0 100-${2 * R}Z` +
  `M${R} ${COUNTER_CY - COUNTER_R}a${COUNTER_R} ${COUNTER_R} 0 110 ${2 * COUNTER_R}` +
  `a${COUNTER_R} ${COUNTER_R} 0 110-${2 * COUNTER_R}Z`;

type Props = {
  /* Rendered height in pixels, including the room the dropped half needs. */
  size?: number;
  className?: string;
};

export function Shift9Mark({ size = 28, className }: Props) {
  /* Two clip paths per instance, and the lockup renders more than one, so
     the ids have to be unique or the second mark clips against the first. */
  const uid = useId().replace(/:/g, "");
  const box = H + SHIFT;

  const half = (
    <>
      <path d={RING} fillRule="evenodd" />
      <polygon points={TAIL} />
    </>
  );

  return (
    <svg
      className={className}
      width={(size * W) / box}
      height={size}
      viewBox={`0 0 ${W} ${box}`}
      fill="currentColor"
      role="img"
      aria-label="9"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id={`l${uid}`}>
          <rect x="0" y="0" width={CUT - GAP / 2} height={box} />
        </clipPath>
        <clipPath id={`r${uid}`}>
          <rect x={CUT + GAP / 2} y="0" width={W - CUT - GAP / 2} height={box} />
        </clipPath>
      </defs>
      <g clipPath={`url(#l${uid})`}>{half}</g>
      <g clipPath={`url(#r${uid})`} opacity="0.58" transform={`translate(0,${SHIFT})`}>
        {half}
      </g>
    </svg>
  );
}
