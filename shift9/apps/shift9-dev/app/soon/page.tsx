import s from "./soon.module.css";
import TouchPaint from "./TouchPaint";

/* Coming-soon artwork with tap and keyboard reactions. Motion is optional. */

export const metadata = {
  title: "Shift-9 — Coming soon",
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

const RIBBON_A = "COMING SOON ✦ NOT FINISHED ✦ COME BACK ✦ SHIFT-9 ✦ ";
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

/* ── Coming back ─────────────────────────────────────────────────────────
   The reel is 16,000px long. Checking one project used to mean returning to
   scroll 0 and travelling the whole thing again to get back to where you were
   — so looking at a second project cost more than looking at the first, which
   is exactly backwards.

   Every card that lands here stamps its own number on the URL, and the way
   back carries it as a fragment. The stages have matching ids, so the browser
   restores the position itself: no script, no scroll maths, and it still
   works if JavaScript never runs. Falls back to the top of the reel when
   there is no number, which is what a direct visit deserves. */
export default async function SoonPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const back = /^\d{2}$/.test(from ?? "") ? `/studio#set-${from}` : "/studio";

  return (
    <main className={s.root}>
      <div className={s.ground} aria-hidden="true" />
      <div className={s.slab} aria-hidden="true" />

      <div className={s.stage}>
        <div className={s.laptop}>
          <div className={s.lid}>
            <div className={s.lidTex} aria-hidden="true" />
            <TouchPaint className={s.badge} trick="jelly" label="Poke the nine" reply="9 LIVES. STILL BUILDING.">
              <span className={s.badgeMark}>9</span>
            </TouchPaint>

            {STICKERS.map((st) => (
              <TouchPaint
                key={st.t}
                label={`Touch sticker: ${st.t}`}
                trick={st.t === "SHIP IT" ? "rocket" : st.t === "Ctrl + Z" ? "rewind" : "splat"}
                reply={st.t === "Ctrl + Z" ? "UNSPILLING THE BEANS." : st.t === "SHIP IT" ? "SHIP HAPPENS." : "IT WAS LIKE THAT BEFORE."}
                className={`${s.sticker} ${s[st.k] ?? ""}`}
                style={{ left: st.x, top: st.y, ["--r" as string]: st.r }}
              >
                {st.t}
              </TouchPaint>
            ))}
          </div>
        </div>

        <h1 className={s.headline}>
          Coming <em>soon</em>
        </h1>

        <p className={s.line}>
          This project doesn&#39;t have its own page yet. It exists, it&#39;s
          being built, and it will get one.
        </p>

        <div className={s.actions}>
          <a className="s9-pearl-dark" href={back}>
            <span>← Back to the studio</span>
          </a>
          <a className="s9-pearl-dark" href="/">
            <span>The desktop</span>
          </a>
        </div>
      </div>

      <div className={s.sign}>
        <div className={s.hooks} aria-hidden="true">
          <i />
          <i />
        </div>
        <TouchPaint className={s.signPlate} label="Touch the wet paint" reply="TOLD YOU. STILL WET.">
          <b>Wet paint</b>
          <em>touch it anyway</em>
        </TouchPaint>
      </div>

      <Ribbon className={s.ribbonA ?? ""} text={RIBBON_A} />
      <Ribbon className={s.ribbonB ?? ""} text={RIBBON_B} />
    </main>
  );
}
