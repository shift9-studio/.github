import s from "../legal.module.css";

/* ────────────────────────────────────────────────────────────────────────
   PRIVACY POLICY — the page the Play Store listing points at.

   Written to describe what the service does, in plain language, without
   claiming anything that has not been confirmed. Two things deliberately
   absent, because asserting them without checking would be worse than
   omitting them: there is no "we use no analytics" sentence, and no claim
   about whether recipe photos leave the device. Both are noted for Kariim to
   confirm before this is treated as final.

   Plain language on purpose. A privacy policy that needs a lawyer to read is
   not a privacy policy, it is a liability shield, and this app is used by
   people standing in their kitchens.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Privacy Policy — Just a Pinch",
  description:
    "What Just a Pinch collects, why, and how to have it deleted. In plain language.",
};

const UPDATED = "26 July 2026";
const EMAIL = "shift9.dev@gmail.com";

export default function PrivacyPage() {
  return (
    <main className={s.root}>
      <div className={s.wrap}>
        <a className={s.back} href="/">
          ← Just a Pinch
        </a>

        <h1 className={s.title}>Privacy Policy</h1>
        <p className={s.updated}>Last updated {UPDATED}</p>

        <p className={s.lede}>
          Just a Pinch is made by Shift-9. This page explains what the app
          stores, why it stores it, and how to get it removed. It is written to
          be read, not to be survived.
        </p>

        <h2 className={s.h2}>What we store</h2>
        <p className={s.p}>
          <strong>Your account.</strong> Just a Pinch uses Supabase
          authentication, so creating an account stores the email address or
          the sign-in identifier from the provider you chose. That is what lets
          your recipes follow you to a new phone instead of living on one
          device.
        </p>
        <p className={s.p}>
          <strong>The recipes you save.</strong> Recipes you add — whether from
          a link, a photo, or typed in yourself — are saved to your account,
          along with the things you change about them: servings, notes,
          substitutions.
        </p>
        <p className={s.p}>
          <strong>What is needed to run the service.</strong> Ordinary
          technical information involved in serving an app: the requests your
          device makes and the errors they produce.
        </p>

        <h2 className={s.h2}>What we do with it</h2>
        <ul className={s.list}>
          <li>Give you your collection, on whatever device you sign in from.</li>
          <li>Run cook mode — scaling servings, suggesting swaps.</li>
          <li>Keep the app working, and find out when it is not.</li>
        </ul>
        <p className={s.p}>
          We do not sell your information, and we do not trade it.
        </p>

        <h2 className={s.h2}>Where it lives</h2>
        <p className={s.p}>
          Account and recipe data is stored with{" "}
          <a
            className={s.link}
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Supabase
          </a>
          , which hosts the database on our behalf. They process it for us and
          under our instructions; they are not free to use it for their own
          purposes.
        </p>

        <h2 className={s.h2}>Deleting your account</h2>
        <p className={s.p}>
          Write to{" "}
          <a className={s.link} href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>{" "}
          from the address on the account and ask. Your account and the recipes
          attached to it are removed. There is no retention period we are
          holding you to and no form to fill in.
        </p>

        <h2 className={s.h2}>Children</h2>
        <p className={s.p}>
          Just a Pinch is not directed at children under 13, and we do not
          knowingly create accounts for them. If you believe a child has an
          account, write to us and it will be removed.
        </p>

        <h2 className={s.h2}>Changes to this page</h2>
        <p className={s.p}>
          If what the app stores changes, this page changes with it and the
          date at the top moves. Material changes will be announced in the app
          rather than quietly edited here.
        </p>

        <div className={s.contact}>
          <p className={s.contactTitle}>Questions about any of this</p>
          <p className={s.contactP}>
            Email{" "}
            <a className={s.link} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            . A person reads it.
          </p>
        </div>
      </div>
    </main>
  );
}
