import type { Metadata } from "next";
import { FlowStateDemo } from "./FlowStateDemo";
import { WaitlistForm } from "./WaitlistForm";
import { WaterSurface } from "./WaterSurface";
import s from "./flow-state.module.css";

const CONTACT_EMAIL = "shift9dev@gmail.com";

export const metadata: Metadata = {
  title: "Flow State — Local Windows Dictation",
  description:
    "Flow State puts local voice dictation into the Windows app you're already using. Join the private beta list.",
  openGraph: {
    title: "Flow State — Local Windows Dictation",
    description:
      "Hold Ctrl + Win, speak, and keep your voice data on your own PC.",
    type: "website",
  },
};

export default function FlowStatePage() {
  return (
    <main className={s.root}>
      <div className={s.backdrop} aria-hidden="true" />
      <WaterSurface />
      <a className={`s9-pearl-dark s9-pearl-ghost ${s.exitPin}`} href="/studio#set-02">
        &#8592; The studio
      </a>

      <header className={s.topbar}>
        <div className={s.brandLockup}>
          <span className={s.logoJewel} aria-hidden="true">
            <b>F</b>
          </span>
          <span className={s.brandName}>Flow State</span>
          <span className={s.brandStudio}>by Shift-9</span>
        </div>
        <p className={s.intakeStatus}>
          <span aria-hidden="true" /> Private beta intake online
        </p>
      </header>

      <div className={s.composition}>
        <section className={s.story}>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>Private dictation / uninterrupted thought</p>
            <h1 className={s.headline}>
              Stay in the <span className={s.foilWord}>thought.</span>
            </h1>
            <p className={s.lede}>
              Flow State puts your words into the app you are using. Hold Ctrl
              + Win, speak, release. Speech stays on your PC.
            </p>
            <p className={s.shortcut}>
              <span className={s.srOnly}>
                Hold Control plus Windows to dictate.
              </span>
              <span className={s.shortcutVisual} aria-hidden="true">
                <kbd>CTRL</kbd>
                <b>+</b>
                <kbd>WIN</kbd>
                <span>Hold or tap to dictate</span>
              </span>
            </p>
          </div>

          <FlowStateDemo />

          <dl className={s.metrics}>
            <div>
              <dt>Voice processing</dt>
              <dd>On-device</dd>
            </div>
            <div>
              <dt>Measured recognition</dt>
              <dd>185.2 ms</dd>
            </div>
            <div>
              <dt>Speech uploaded</dt>
              <dd>0 bytes</dd>
            </div>
          </dl>
        </section>

        <aside className={s.intake} aria-labelledby="waitlist-title">
          <div className={s.intakePanel}>
            <p className={s.panelLabel}>Beta access request</p>
            <div className={s.formBody}>
              <h2 id="waitlist-title">Get the next build.</h2>
              <p className={s.formCopy}>
                Join the private beta list. We will use your address only for
                Flow State access and product updates.
              </p>
              <WaitlistForm />

              <ul className={s.privacyList}>
                <li>
                  <span aria-hidden="true">&#10003;</span>
                  Speech recognition runs on your Windows PC.
                </li>
                <li>
                  <span aria-hidden="true">&#10003;</span>
                  Correction memory and dictation history stay local.
                </li>
                <li>
                  <span aria-hidden="true">&#10003;</span>
                  Text enters the app that already has your focus.
                </li>
              </ul>

              <p className={s.contact}>
                Questions before joining?{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
