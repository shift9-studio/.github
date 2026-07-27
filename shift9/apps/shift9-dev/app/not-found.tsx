import Link from "next/link";
import { Shift9Mark } from "./_components/Shift9Mark";

/* ────────────────────────────────────────────────────────────────────────
   404 — there was not one.

   Without this file Next serves its own built-in error page: black Helvetica
   on a white ground, "404 This page could not be found." It is not the site's
   design, it is not anybody's design, and it is a *white* page on a site that
   is otherwise entirely black — so the one moment a visitor is already
   slightly lost is the moment they get flashbanged and shown something that
   looks like a different website's error.

   Two distinctions worth keeping straight, because the site now has both:

   /soon is for a project that exists but has no page yet. It is cheerful,
   it is under construction, and it is a promise.

   This is for an address that does not exist at all — a typo, a stale link, a
   guess. It should not pretend to be under construction, because nothing is
   being built here. It says what happened in one line and offers the three
   places actually worth going.

   No client JavaScript, no animation, nothing to load. A 404 is a signpost.
   ──────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Not found — Shift-9",
  description: "That address does not exist.",
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--s9-obsidian)",
        color: "var(--s9-ink)",
        fontFamily: "var(--s9-font-text)",
        display: "grid",
        placeContent: "center",
        gap: "1.4rem",
        padding: "12vh var(--s9-gutter)",
        textAlign: "center",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "flex",
          justifyContent: "center",
          color: "var(--s9-ink-dim)",
          marginBottom: "0.5rem",
        }}
      >
        <Shift9Mark size={48} />
      </span>

      <span
        style={{
          fontFamily: "var(--s9-font-mono)",
          fontSize: "var(--s9-text-mono)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--s9-ink-dim)",
        }}
      >
        <span style={{ color: "var(--s9-signal)" }}>{"// "}</span>
        error — 404
      </span>

      <h1
        style={{
          margin: 0,
          fontFamily: "var(--s9-font-display)",
          fontSize: "clamp(2rem, 1rem + 4.5vw, 4.4rem)",
          fontWeight: 700,
          lineHeight: 1.06,
          letterSpacing: "-0.03em",
        }}
      >
        There&rsquo;s nothing at
        <br />
        this address.
      </h1>

      <p
        style={{
          maxWidth: "44ch",
          marginInline: "auto",
          fontSize: "var(--s9-text-body)",
          lineHeight: 1.6,
          color: "var(--s9-ink-2)",
        }}
      >
        Not a page being built — a page that was never here. Most likely a typo
        or a link that has gone stale.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.8rem",
          justifyContent: "center",
          marginTop: "0.8rem",
        }}
      >
        <Link className="s9-pearl-dark" href="/studio">
          See the work
        </Link>
        <Link className="s9-pearl-dark" href="/">
          The desktop
        </Link>
        <Link className="s9-pearl" href="/start">
          Start a project →
        </Link>
      </div>
    </main>
  );
}
