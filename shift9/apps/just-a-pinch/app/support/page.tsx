import s from "../legal.module.css";

/* ────────────────────────────────────────────────────────────────────────
   SUPPORT — the optional "support website" field on the Play listing, and
   the page someone lands on when something has gone wrong mid-recipe.

   Deliberately short. The useful thing here is a working email address and an
   honest statement of what happens after you use it; a knowledge base with
   three articles in it is worse than a sentence telling you where to write.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Support — Just a Pinch",
  description:
    "Something not working, or a recipe that will not save? Here is how to reach a person.",
};

const EMAIL = "shift9.dev@gmail.com";

export default function SupportPage() {
  return (
    <main className={s.root}>
      <div className={s.wrap}>
        <a className={s.back} href="/">
          ← Just a Pinch
        </a>

        <h1 className={s.title}>Support</h1>
        <p className={s.updated}>Android · closed testing</p>

        <p className={s.lede}>
          Something not saving, a recipe that imported wrong, an account you
          cannot get back into — write to us and it gets looked at by the
          person who built it.
        </p>

        <h2 className={s.h2}>Get in touch</h2>
        <p className={s.p}>
          Email{" "}
          <a className={s.link} href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
          . If it is a bug, the two things that help most are what you were
          doing when it happened and roughly when — that is usually enough to
          find it in the logs.
        </p>

        <h2 className={s.h2}>Deleting your account</h2>
        <p className={s.p}>
          Email the same address from the address on the account. It and your
          saved recipes are removed. More detail on the{" "}
          <a className={s.link} href="/privacy">
            privacy page
          </a>
          .
        </p>

        <h2 className={s.h2}>Where the app is up to</h2>
        <p className={s.p}>
          Just a Pinch is in closed testing on Android. iOS comes after. If you
          are testing it, the fastest thing you can do for the app is tell us
          the thing that annoyed you — the small irritations are the ones that
          never get reported and never get fixed.
        </p>

        <div className={s.contact}>
          <p className={s.contactTitle}>One address, for everything</p>
          <p className={s.contactP}>
            <a className={s.link} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>{" "}
            — bugs, account deletion, and anything else.
          </p>
        </div>
      </div>
    </main>
  );
}
