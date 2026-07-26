import s from "./start.module.css";

/* ────────────────────────────────────────────────────────────────────────
   THE INVITATION — where the banner leads.

   The dolly ends on Kariim's artwork and stops there. Putting the ask on top
   of that frame would mean setting type over the one image on the site that
   earns a full frame to itself, so the ask gets its own room: a dark field,
   a drifting aurora, one sentence, one button.

   Built in the aether-hero idiom — soft coloured bloom behind a centred
   column, a gradient pill that lights up on approach, a glass ghost button
   beside it. The bloom is three radial gradients on one slowly rotating
   layer rather than a canvas or a video: it costs one composited element,
   and it degrades to a perfectly good static gradient when it stops.

   No client JavaScript. Everything here is CSS, so the page is complete on
   first paint and identical before and after hydration.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Shift-9 — Start a project",
  description:
    "Tell Shift-9 what you're building. Interfaces, tools and product surfaces, built to the standard the studio reel shows.",
};

const EMAIL = "shift9.dev@gmail.com";

export default function StartPage() {
  return (
    <main className={s.root}>
      {/* The field. Decorative in full: every word is in the column below. */}
      <div className={s.aurora} aria-hidden="true" />
      <div className={s.grid} aria-hidden="true" />
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
          <a className={s.primary} href={`mailto:${EMAIL}`}>
            <span className={s.primaryLabel}>Start a project</span>
            <span className={s.primaryArrow} aria-hidden="true">
              &#8594;
            </span>
          </a>

          <a className={s.ghost} href="/">
            <span aria-hidden="true">&#8592;</span> Back to the desktop
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
      <a className={s.exitPin} href="/studio">
        &#8592; The studio
      </a>
    </main>
  );
}
