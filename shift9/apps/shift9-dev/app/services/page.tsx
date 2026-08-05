import { Reveal, RevealGroup, RevealItem } from "../_components/Reveal";
import s from "./services.module.css";

/* ────────────────────────────────────────────────────────────────────────
   THE OFFER — what a sprint is and what it costs.

   The reel shows the work and the invitation takes the message, but between
   them there was nothing that answered the first question a studio lead has:
   what does this cost and what exactly do I get. Ten outreach emails point at
   this site; three of them point at the reel specifically. This is the page
   those readers were missing.

   Prices, scope and the disclosure are lifted from the Commercialization
   Dossier (31 July 2026) rather than invented here. If the offer changes, it
   changes in the dossier first and this page follows it.

   Server component. No client boundary except the reveals, which already
   collapse to a plain appear under reduced motion.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Shift-9 — Book a sprint",
  description:
    "Fixed-price React and TypeScript sprints that take a designed or half-built product surface through to production. What each one costs, what it covers, and how to start.",
};

const EMAIL = "shift9dev@gmail.com";

const offers = [
  {
    tag: "fixed price",
    name: "Interface rescue",
    price: "$1,500 – $3,000",
    unit: "fixed · one surface",
    body: "One broken or unfinished product surface, taken to something you can put in front of users.",
    points: [
      "a single screen, flow or component set",
      "production React and TypeScript",
      "handed over working, not as a branch",
    ],
  },
  {
    tag: "fixed price",
    name: "Two-week product sprint",
    price: "$4,000 – $8,000",
    unit: "fixed · two weeks",
    body: "One scoped feature carried from where it is now through to production handoff.",
    points: [
      "scope agreed in writing before it starts",
      "design intent kept intact in the build",
      "handoff your team can maintain",
    ],
  },
  {
    tag: "ongoing",
    name: "Embedded product partner",
    price: "$3,000 – $5,000",
    unit: "per month · bounded",
    body: "Standing capacity for a team that needs a front-end lane covered, with a limit on it.",
    points: [
      "a bounded number of hours, not open-ended",
      "proof shipped every week",
      "cancel at the end of any month",
    ],
  },
];

const steps = [
  {
    n: "01",
    body: "Send one sketch, one repo, or one paragraph about the problem. No brief needed.",
  },
  {
    n: "02",
    body: "You get back scope, a price from the bands above, and the smallest piece that would prove it works.",
  },
  {
    n: "03",
    body: "That smallest piece ships first, so you can judge the work before the whole budget is committed.",
  },
  {
    n: "04",
    body: "The rest follows the agreed scope, and it lands in your repo in a state your team can keep.",
  },
];

const proof = [
  {
    name: "INSTRUMENT",
    href: "/instrument",
    body: "One accessibility and interaction contract carried across separate products without flattening what makes each one look like itself.",
  },
  {
    name: "Flow State",
    href: "/flow-state",
    body: "Local-first Windows dictation. Offline speech recognition, custom vocabulary, and 155 passing tests behind it.",
  },
  {
    name: "The studio reel",
    href: "/studio",
    body: "Twelve builds in one continuous take. The finished ones look finished; the ones still in development are left showing their edges.",
  },
];

export default function ServicesPage() {
  return (
    <main className={s.root}>
      <a className={`s9-pearl-dark s9-pearl-ghost ${s.exitPin}`} href="/studio">
        &#8592; The studio
      </a>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className={`${s.shell} ${s.hero}`}>
        <Reveal variant="fade">
          <p className={s.eyebrow}>// the studio is open</p>
        </Reveal>

        <Reveal variant="rise" delay={0.06}>
          <h1 className={s.headline}>
            Ship the surface you already{" "}
            <span className={s.milled}>designed</span>.
          </h1>
        </Reveal>

        <Reveal variant="rise" delay={0.12}>
          <p className={s.lede}>
            A focused React and TypeScript sprint that turns a designed or
            half-built product surface into production software — for boutique
            agencies, seed-stage product teams, and founders whose design
            quality is not surviving implementation.
          </p>
        </Reveal>

        <Reveal variant="rise" delay={0.18}>
          <p className={s.slot}>
            <span className={s.slotDot} aria-hidden="true" />
            One paid two-week slot open — August 2026
          </p>
        </Reveal>

        <Reveal variant="rise" delay={0.24}>
          <div className={s.actions}>
            <a className="s9-pearl" href="/start">
              <span>Start a project</span>
              <span className="s9-pearlArrow" aria-hidden="true">
                &#8594;
              </span>
            </a>
            <a className="s9-pearl-dark" href="#offers">
              <span>See what it costs</span>
            </a>
          </div>
        </Reveal>
      </section>

      {/* ── The offers ──────────────────────────────────────────────────── */}
      <section id="offers" className={`${s.shell} ${s.section}`}>
        <div className={s.sectionHead}>
          <Reveal variant="fade">
            <p className={s.eyebrow}>// what it costs</p>
          </Reveal>
          <Reveal variant="rise" delay={0.06}>
            <h2 className={s.sectionTitle}>
              Three ways in. Two of them are a fixed price.
            </h2>
          </Reveal>
        </div>

        <RevealGroup className={s.offers}>
          {offers.map((o) => (
            <RevealItem key={o.name} variant="scan" className={s.offer}>
              <p className={s.offerTag}>{o.tag}</p>
              <h3 className={s.offerName}>{o.name}</h3>
              <p className={s.price}>
                {o.price}
                <span className={s.priceUnit}>{o.unit}</span>
              </p>
              <p className={s.offerBody}>{o.body}</p>
              <ul className={s.offerList}>
                {o.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ── Process ─────────────────────────────────────────────────────── */}
      <section className={`${s.shell} ${s.section}`}>
        <div className={s.sectionHead}>
          <Reveal variant="fade">
            <p className={s.eyebrow}>// what happens next</p>
          </Reveal>
          <Reveal variant="rise" delay={0.06}>
            <h2 className={s.sectionTitle}>
              You send one thing. You get back a scope and a number.
            </h2>
          </Reveal>
        </div>

        <RevealGroup className={s.steps}>
          {steps.map((step) => (
            <RevealItem key={step.n} variant="rise" className={s.step}>
              <p className={s.stepNum}>{step.n}</p>
              <p className={s.stepBody}>{step.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ── Proof ───────────────────────────────────────────────────────── */}
      <section className={`${s.shell} ${s.section}`}>
        <div className={s.sectionHead}>
          <Reveal variant="fade">
            <p className={s.eyebrow}>// the receipts</p>
          </Reveal>
          <Reveal variant="rise" delay={0.06}>
            <h2 className={s.sectionTitle}>Work you can open right now.</h2>
          </Reveal>
        </div>

        <RevealGroup className={s.proof}>
          {proof.map((p) => (
            <RevealItem key={p.name} variant="scan" className={s.proofCell}>
              <a className={s.proofItem} href={p.href}>
                <span className={s.proofName}>
                  {p.name}
                  <span className={s.proofArrow} aria-hidden="true">
                    &#8594;
                  </span>
                </span>
                <span className={s.proofBody}>{p.body}</span>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ── The honest note ─────────────────────────────────────────────── */}
      <section className={`${s.shell} ${s.section}`}>
        <div className={s.sectionHead}>
          <Reveal variant="fade">
            <p className={s.eyebrow}>// about the numbers</p>
          </Reveal>
        </div>
        <Reveal variant="rise">
          <p className={s.note}>
            Published market references put medium front-end projects around
            $1,500 – $8,000, and larger work at $8,000 – $40,000 and up. The
            bands above sit inside that range, and every price on this page is
            an opening position: the real number depends on the scope, and it
            gets agreed in writing before anything starts.
          </p>
        </Reveal>
      </section>

      {/* ── Close ───────────────────────────────────────────────────────── */}
      <section className={`${s.shell} ${s.close}`}>
        <Reveal variant="fade">
          <p className={s.eyebrow}>// transmission open</p>
        </Reveal>

        {/* Deliberately NOT "Tell me what you're building." — that is the H1 of
            /start, which is one click away through the button directly below
            this line. The same sentence twice across one click reads as a
            template, not a conversation. */}
        <Reveal variant="rise" delay={0.06}>
          <h2 className={s.sectionTitle}>Send the problem, not a brief.</h2>
        </Reveal>

        <Reveal variant="rise" delay={0.12}>
          <div className={s.actions}>
            <a className="s9-pearl" href="/start">
              <span>Start a project</span>
              <span className="s9-pearlArrow" aria-hidden="true">
                &#8594;
              </span>
            </a>
          </div>
        </Reveal>

        <Reveal variant="rise" delay={0.18}>
          <p className={s.address}>
            or write to{" "}
            <a className={s.addressLink} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </p>
        </Reveal>
      </section>
    </main>
  );
}
