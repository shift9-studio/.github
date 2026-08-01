import { WaveField } from "../_components/WaveField";
import s from "./start.module.css";

/* ────────────────────────────────────────────────────────────────────────
   THE INVITATION — where the banner leads.

   The dolly ends on Kariim's artwork and stops there. Putting the ask on top
   of that frame would mean setting type over the one image on the site that
   earns a full frame to itself, so the ask gets its own room.

   The room is black. A field of white lines waves under simplex noise and
   parts around the cursor, and that is the entire ground — no bloom, no
   tint, no second accent. The one colour on the page is the button, which
   is the only thing here anyone is meant to do.

   The page is a server component. The field is the only client boundary,
   and only because it needs a canvas and a pointer; everything that says
   anything is static markup underneath it.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Shift-9 — Start a project",
  description:
    "Tell Shift-9 what you're building. Interfaces, tools and product surfaces, built to the standard the studio reel shows.",
};

const EMAIL = "shift9dev@gmail.com";

export default function StartPage() {
  return (
    <main className={s.root}>
      {/* The field. Decorative in full — every word on this page is in the
          column below it, so it is hidden from the accessibility tree and
          nothing is lost when it does not run. */}
      <WaveField className={s.field ?? ""} />
      <div className={s.vignette} aria-hidden="true" />

      <section className={s.column}>
        <p className={s.eyebrow}>// the studio is open</p>

        <h1 className={s.headline}>
          Tell me what you&#39;re <span className={s.grad}>building</span>.
        </h1>

        <p className={s.lede}>
          Interfaces, internal tools, product surfaces — built to the standard
          the reel just showed you. Send what you have: a sketch, a repo, a
          paragraph. I&#39;ll tell you what it takes.
        </p>

        <div className={s.actions}>
          <a className="s9-pearl" href={`mailto:${EMAIL}`}>
            <span>Start a project</span>
            <span className="s9-pearlArrow" aria-hidden="true">
              &#8594;
            </span>
          </a>

          <a className="s9-pearl-dark" href="/">
            <span>
              <span aria-hidden="true">&#8592;</span> Back to the desktop
            </span>
          </a>
        </div>

        {/* The address in plain text as well as behind the button: some people
            want to copy it into their own client rather than be handed one. */}
        <p className={s.address}>
          or write to{" "}
          <a className={s.addressLink} href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </p>
      </section>

      {/* A second way back that does not depend on reaching the buttons. */}
      <a className={`s9-pearl-dark s9-pearl-ghost ${s.exitPin}`} href="/studio">
        &#8592; The studio
      </a>
    </main>
  );
}
