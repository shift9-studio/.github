import s from "./soon.module.css";

/* ────────────────────────────────────────────────────────────────────────
   UNDER CONSTRUCTION — the landing place for work that has no page yet.

   Persona 5's menu language in one bit: pure black and white, every panel a
   skewed cut-out rather than a box, type large enough to run past the measure,
   and two ribbons crossing the composition on opposing diagonals.

   The mid-tones are genuine ordered dithering — 1-bit PNGs generated from an
   8x8 Bayer threshold matrix, 77 to 269 bytes each. The whole page carries no
   photography, no GIFs and no JavaScript.

   Accessibility:
   - The ribbons are the only motion and they stop under
     prefers-reduced-motion. Nothing blinks; the design is carried by contrast
     and geometry rather than movement.
   - Ribbons and stickers are decorative and hidden from assistive tech; they
     repeat what the heading and the line already say.
   - Two values at full contrast, so nothing depends on colour.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Shift-9 — Under construction",
  description: "This one does not have a page yet.",
};

/* Positions and angles as data, so the arrangement stays deliberate rather
   than accumulating by hand-editing markup. */
const STICKERS: { t: string; x: string; y: string; r: string; k: string }[] = [
  { t: "WORKS ON MY MACHINE", x: "9%", y: "13%", r: "-5deg", k: "solid" },
  { t: "// TODO", x: "72%", y: "9%", r: "7deg", k: "knock" },
  { t: "$ rm -rf ./regrets", x: "56%", y: "71%", r: "-4deg", k: "tex" },
  { t: "SHIP IT", x: "11%", y: "73%", r: "10deg", k: "solid" },
  { t: "404: SLEEP NOT FOUND", x: "60%", y: "34%", r: "-3deg", k: "knock" },
  { t: "semicolon;", x: "7%", y: "45%", r: "5deg", k: "tex" },
  { t: "BUILD PASSING", x: "36%", y: "82%", r: "-8deg", k: "knock" },
  { t: "COMPILES ON THE THIRD TRY", x: "38%", y: "5%", r: "3deg", k: "solid" },
  { t: "Ctrl + Z", x: "81%", y: "57%", r: "-12deg", k: "solid" },
  { t: "ONE MORE COMMIT", x: "22%", y: "31%", r: "-5deg", k: "tex" },
];

const RIBBON_A = "UNDER CONSTRUCTION ✦ NOT FINISHED ✦ COME BACK ✦ SHIFT-9 ✦ ";
const RIBBON_B = "BUILDING ✦ IN PROGRESS ✦ WORK IN MOTION ✦ SHIFT-9 ✦ ";

/* The track carries the message twice and translates by exactly -50%, so the
   loop closes on a pixel-identical frame and never visibly jumps. */
function Ribbon({ className, text }: { className: string; text: string }) {
  const run = text.repeat(4);
  return (
    <div className={`${s.ribbon} ${className}`} aria-hidden="true">
      <div className={s.track}>
        <span>{run}</span>
        <span>{run}</span>
      </div>
    </div>
  );
}

export default function SoonPage() {
  return (
    <main className={s.root}>
      <div className={s.ground} aria-hidden="true" />
      <div className={s.slab} aria-hidden="true" />

      <div className={s.stage}>
        <div className={s.laptop}>
          <div className={s.lid}>
            <div className={s.lidTex} aria-hidden="true" />
            <div className={s.badge} aria-hidden="true">
              <span className={s.badgeMark}>9</span>
            </div>

            {STICKERS.map((st) => (
              <span
                key={st.t}
                aria-hidden="true"
                className={`${s.sticker} ${s[st.k] ?? ""}`}
                style={{ left: st.x, top: st.y, ["--r" as string]: st.r }}
              >
                {st.t}
              </span>
            ))}
          </div>
        </div>

        <h1 className={s.headline}>
          Under <em>construction</em>
        </h1>

        <p className={s.line}>
          This project doesn&#39;t have its own page yet. It exists, it&#39;s
          being built, and it will get one.
        </p>

        <div className={s.actions}>
          <a className={s.btn} href="/studio">
            <span>← Back to the studio</span>
          </a>
          <a className={s.btnGhost} href="/">
            <span>The desktop</span>
          </a>
        </div>
      </div>

      {/* Hung off the top run of tape on two wire hooks, and swinging. Purely
          decorative: the heading and the line already say everything this
          says, and a joke announced to a screen reader is just noise. */}
      <div className={s.sign} aria-hidden="true">
        <div className={s.hooks}>
          <i />
          <i />
        </div>
        <div className={s.signPlate}>
          <b>Wet paint</b>
          <em>touch it anyway</em>
        </div>
      </div>

      <Ribbon className={s.ribbonA ?? ""} text={RIBBON_A} />
      <Ribbon className={s.ribbonB ?? ""} text={RIBBON_B} />
    </main>
  );
}
