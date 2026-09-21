import Link from "next/link";

/* A thin sticky bar so a visitor can jump instead of scrolling the whole page,
   and so /pricing is reachable from anywhere. Deliberately plain — the page's
   character lives in the hero, not in its chrome. No JS: position:sticky and
   anchors, which keeps it free on mobile and under reduced motion.

   Links are absolute-from-root ("/#how") so the same header works on /pricing,
   /privacy and the /vs pages. */

/* Four labels do not fit beside the wordmark on a 390px phone — they push the
   page 39px wider than the screen. The two section jumps drop out below 640px
   (scrolling is the mobile habit anyway); Pricing and Get the app, the two
   that decide anything, stay at every width. */
const LINKS = [
  { href: "/#how", label: "How it works", wide: true },
  { href: "/#features", label: "Features", wide: true },
  { href: "/pricing", label: "Pricing", wide: false },
  { href: "/#get", label: "Get the app", wide: false },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[84rem] items-center justify-between gap-6 px-6 py-3 sm:px-10">
        <Link
          href="/"
          className="font-display text-xl text-ink transition-premium hover:text-signal"
          style={{ fontVariationSettings: '"wght" 620' }}
        >
          Feelspoon
        </Link>

        <nav aria-label="Primary">
          <ul className="flex items-center gap-4 sm:gap-7">
            {LINKS.map((l) => (
              <li key={l.href} className={l.wide ? "hidden sm:block" : undefined}>
                <Link
                  href={l.href}
                  className="font-mono text-mono uppercase tracking-[0.18em] text-muted transition-premium hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
