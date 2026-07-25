import s from "./soon.module.css";

/* ────────────────────────────────────────────────────────────────────────
   UNDER CONSTRUCTION — the landing place for work that has no page yet.

   A laptop lid covered in stickers, done as a deliberate joke: blinking text,
   a marquee, hazard tape, the whole 1997 GeoCities apparatus. It is loud on
   purpose and it is the only surface on shift9.dev allowed to be, which is
   what makes it read as a gag rather than a lapse.

   Everything here is CSS. No GIFs, no images, no JavaScript — a page that
   exists to say "not finished yet" should not cost a megabyte to say it.

   Accessibility is not part of the joke:
   - Every blink, crawl and shimmer stops dead under prefers-reduced-motion.
     Blinking content is a genuine seizure and vestibular risk, so this is a
     hard requirement rather than a nicety.
   - The stickers are decorative and hidden from assistive tech; the actual
     message is one plain heading and one plain line.
   - Nothing depends on colour or motion to be understood.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Shift-9 — Under construction",
  description: "This one does not have a page yet.",
};

/* The lid. Written as data so the arrangement is legible at a glance and the
   angles stay deliberate rather than accumulating by hand-editing markup. */
const STICKERS: { t: string; x: string; y: string; r: string; k: string }[] = [
  { t: "WORKS ON MY MACHINE", x: "11%", y: "14%", r: "-5deg", k: "sig" },
  { t: "// TODO", x: "70%", y: "8%", r: "6deg", k: "pul" },
  { t: "$ rm -rf ./regrets", x: "58%", y: "70%", r: "-4deg", k: "term" },
  { t: "SHIP IT", x: "12%", y: "72%", r: "11deg", k: "hot" },
  { t: "404: SLEEP NOT FOUND", x: "62%", y: "36%", r: "-3deg", k: "paper" },
  { t: "semicolon;", x: "8%", y: "44%", r: "4deg", k: "term" },
  { t: "BUILD PASSING", x: "38%", y: "80%", r: "-7deg", k: "sig" },
  { t: "WORKS 60% OF THE TIME", x: "40%", y: "6%", r: "3deg", k: "pul" },
  { t: "Ctrl + Z", x: "80%", y: "56%", r: "-12deg", k: "paper" },
  { t: "ONE MORE COMMIT", x: "24%", y: "32%", r: "-5deg", k: "hot" },
];

export default function SoonPage() {
  return (
    <main className={s.root}>
      {/* Hazard tape, top and bottom. Decorative. */}
      <div className={`${s.tape} ${s.tapeTop}`} aria-hidden="true" />

      <div className={s.stage}>
        {/* The laptop: lid, hinge, and the deck it sits on. */}
        <div className={s.laptop}>
          <div className={s.lid}>
            <div className={s.brush} aria-hidden="true" />

            {/* The glowing mark milled into the aluminium. */}
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
          <div className={s.hinge} aria-hidden="true" />
          <div className={s.deck} aria-hidden="true" />
        </div>

        {/* The actual message: plain, and the only thing a screen reader gets
            beyond the navigation. */}
        <h1 className={s.headline}>
          <span className={s.blink} aria-hidden="true">
            ▓
          </span>{" "}
          <span className={s.rainbow}>UNDER CONSTRUCTION</span>{" "}
          <span className={s.blink} aria-hidden="true">
            ▓
          </span>
        </h1>
        <p className={s.line}>
          This project doesn&#39;t have its own page yet. It exists, it&#39;s
          being built, and it will get one.
        </p>

        <div className={s.actions}>
          <a className={s.btn} href="/studio">
            ← Back to the studio
          </a>
          <a className={s.btnGhost} href="/">
            The desktop
          </a>
        </div>
      </div>

      {/* The crawl. Decorative — it repeats what the page already says. */}
      <div className={s.marqueeWrap} aria-hidden="true">
        <div className={s.marquee}>
          <span>
            best viewed in 1024×768 ✦ please sign the guestbook ✦ this page is
            under construction ✦ no bytes were wasted on a single GIF ✦ made
            with a text editor and spite ✦
          </span>
          <span>
            best viewed in 1024×768 ✦ please sign the guestbook ✦ this page is
            under construction ✦ no bytes were wasted on a single GIF ✦ made
            with a text editor and spite ✦
          </span>
        </div>
      </div>

      <div className={`${s.tape} ${s.tapeBottom}`} aria-hidden="true" />
    </main>
  );
}
