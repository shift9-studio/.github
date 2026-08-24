# HANDOFF - shift9-studio/.github

> Continuity doc. Any agent must be able to resume cold from this file with zero briefing.
> Update it in the same commit as any code change.
> `CLAUDE.md` = how to work here. `docs/BLUEPRINT.md` = locked creative direction. This file = where we are.
> `PROGRESS.md` = the active branch state in detail.

**Last updated:** 2026-08-24
**Repo:** `shift9-studio/.github` - org-owned, NOT in the `Kariimc` user namespace.

## 2026-08-24 - the desktop rail works, and every row opens its own room

**Shipped to `main`.** The left rail on the OS-desktop front door was decorative:
eight `div`s, `cursor: default`, highlight welded to Portfolio. It is now the
main way through the site.

**The rail.** Rows are buttons. Click selects and opens. `aria-current` marks the
row, roving `tabIndex` keeps one tab stop, Up/Down/Home/End walk it with focus
following. The highlight is ONE element whose top and height are measured off the
live button (isomorphic layout effect + `ResizeObserver`, so the 900px breakpoint
that hides the rail cannot strand it at 0) and slid on `--s9-ease-snap`. A window
opened from the rail grows out of the row that opened it: the offset is measured
at the click and handed to the animation as `--dx`/`--dy`.

**Eight rooms, no two alike** - `app/_components/RailWindows.tsx` + its module
CSS, new files. Kariim's instruction, 2026-08-24: "all eight in one pass", "use
the impeccable skill and the taste library as a ref", then "don't make the
buttons take you to pages that are exactly like my actual studio, I want
something different and unique." So each takes its structure from a different
harvested reference: Home a title card (Ten Years Away), Portfolio footage
bleeding behind a mono spec column (Hi-ReS!), Media a wall of dithered monitors
with an in-window lightbox (Basement Studio), Products a bento (Units), Contacts
a poster, Settings an instrument panel, Goals a spine, Reports a printed table.

**No typed facts.** Every project, status, note, tag, destination and count is
read from `SET_PIECES` in `studio-dolly-data.ts` and the plates/clips already in
`public/experience/`. The counts on Home, Goals and Reports are computed at
render, so nothing here can drift from the desktop folders behind it.

**Settings is wired, not drawn.** Its three switches drive the shell's own state:
theme, the icon-grid `compact` flag, and a new `calm` class on `.root` that stops
animation while keeping every colour. Persisted as `s9-desk-theme` and
`s9-desk-motion`.

**Verified before the commit, in a real browser at localhost:3117:** production
build green, `tsc --noEmit` clean, the Impeccable mechanical detector returning
`[]`, the highlight's `translateY`/`height` matching the selected button exactly
on all eight rows, a real ArrowDown moving selection AND focus, all sixteen wall
tiles measured filling their cells, the switches changing `.root`'s class list,
and Escape closing the film before the window.

**Gemini looked at the live page** (his standing order, 2026-08-21: anything
visual is inspected by Gemini, nothing else). It reported four things on the
Portfolio room. Two were a misread of the ragged last row as clipping - measured
on the live site, the strip has no horizontal overflow and 27px of gap on both
sides. Two were real and are fixed: long project names were cut mid-word by an
ellipsis (now clamped to two lines) and the readout's wrapped "BUILT WITH" pair
sat tighter than the rows around it (line-height 1.75).

**Still open.** Goals and Reports are derived from the roster's own status field;
real quarterly targets would have to come from Kariim. `pnpm lint` remains broken
repo-wide (`next lint` was removed in Next 16), so this had typecheck, detector
and a live browser pass but no lint.

## Read first - the discovery trap

This repo is owned by the **`shift9-studio` org**. `gh repo list Kariimc` does **not** return it,
and neither does `github.com/Kariimc?tab=repositories`. Any script or agent that enumerates repos
by user silently skips this entire project and reports success. That is why this repo went
un-audited and carried no continuity doc until now.

Correct queries:

    gh repo list shift9-studio
    gh api '/user/repos?affiliation=owner,collaborator,organization_member'

## 2026-08-23 (third pass) - the shift9.dev opening film, fixed but NOT deployed

Kariim reported: "shift9.dev is not playing the opening video it is glitching
right to the homescreen."

**Reproduced and root-caused. Two faults, stacked.**

1. **Asset bitrate.** `01-03-approach-entry-hall-v4.mp4` was 24,906,455 bytes for
   10.04s = **19.8 Mbps**. Beat two was 13,633,089 bytes = 10.9 Mbps. Measured
   against the LIVE site through Chrome with CDP throttling at 8 Mbps: playback
   advanced 0.35s then stalled ~2s, repeating. After 26s of wall time it had
   shown **3.56s** of a 20.1s film. faststart was already correct; codec was
   already h264/avc1/yuv420p. Bitrate alone was the fault.
2. **A wall-clock cap in the player.** `EnterTheStudio.tsx` armed
   `setTimeout(enterDesk, 26000)` on the first `playing` event. A flat 26s cap on
   a 20.1s film means any line too slow to stream in real time gets yanked to the
   desktop part-way through. That is the "glitching right to the homescreen".

**What changed (4 files, all in `apps/shift9-dev`):**

- `public/experience/opening/01-03-approach-entry-hall-v4.mp4` - re-encoded.
  24.9MB -> 5.88MB (19.8 -> 4.68 Mbps). libx264 high, preset slow, crf 21,
  maxrate 4500k, bufsize 9000k, yuv420p, +faststart, -an.
- `public/experience/opening/04-desk-mouse-screen-v5.mp4` - same recipe.
  13.6MB -> 3.88MB (10.9 -> 3.10 Mbps).
  Both: duration 10.041667s unchanged, 241 frames unchanged, dimensions
  unchanged (1924x1076 and 1928x1076), 24fps unchanged. Originals backed up (see
  "originals" below).
- `app/_components/EnterTheStudio.tsx` - the 26s stopwatch is replaced by a
  stall watch. Every 1s it reads `vid.currentTime + videoBRef.currentTime` (SUM,
  not max: at the join beat one holds at 10.04 while beat two restarts at 0, so a
  max reads as frozen for the whole second beat and would bail every time). If
  that sum has not moved for 12s, playback is genuinely stuck and it drops to the
  desktop. A slow line is now allowed to finish. The net still arms on `playing`
  and not a frame earlier, which was the original rule.
- `scripts/check-studio-polish.mjs` - the build-time guard asserted the exact old
  line and failed the build. Rewritten to assert the new mechanism, plus a
  `doesNotMatch` so the flat stopwatch cannot come back. NOTE: that doesNotMatch
  scans the component source, so no comment in `EnterTheStudio.tsx` may contain
  the literal `setTimeout(enterDesk, 26000)` - it will fail the build. That
  already bit once this session.

**Also added:** `apps/shift9-dev/Try-The-Fixed-Intro.cmd` - a double-click that
runs the site on port 3942 for Kariim to poke. Untracked; delete or commit as
preferred.

**Proof (rebuilt site, real Chrome via playwright-core, CDP throttling):**

| Line | Result |
| :-- | :-- |
| 50 Mbps | both beats ran to the end, 20.9s |
| 12 Mbps | both beats ran to the end, 21.8s |
| 8 Mbps  | both beats ran to the end, 22.8s |
| 5 Mbps  | both beats ran to the end, 28.8s |
| 3 Mbps  | both beats ran to the end, 39.9s |

Before the change, 8 Mbps was the stuttering mess described above and 5/3 Mbps
were cut off by the 26s cap. `npm run build` passes, including all
`check-studio-polish.mjs` assertions. Gemini compared original vs re-encoded
frames at t=2/5/8 on both beats and found no visible loss; Gemini also watched a
recording of the fixed intro at 8 Mbps and reported smooth playback, a clean join,
and a natural settle into the desktop.

**Fifth file, same session:** `app/_components/EnterTheStudio.module.css`. Kariim
spotted it in the sandbox: hovering the round email button bottom-right showed a
tooltip cut off by the right edge. The button is `position: fixed; right: 26px`
and 38px wide, so its centre is 45px from the edge, while the bubble is the
studio address at 147px nowrap. Centred, 28px of it fell off a 1920px screen.
Now `.desktop .helpdot[data-tip]::after` anchors `right: 0; left: auto;
translate: 0 0`, opening inward. The rise-and-fade `transform` is untouched.
Measured at 1920/1440/1280: bubble spans end 26px clear of the edge at every
width. Gemini confirmed the full address is readable and inside the screen.

**STATE: LIVE AND VERIFIED on shift9.dev.** Kariim gave permission and `763d0ba`
went up. Checked on the public site afterwards, not assumed: the opening film
file returns **5,878,131** bytes; both beats run to their natural end at 8 Mbps
(22.1s), 5 Mbps (31.0s) and 3 Mbps (40.4s) through real Chrome with throttling;
the email tooltip fits with 26px clear at 1920, 1440 and 1280, and Gemini
confirmed the whole address is readable and inside the screen.

## 2026-08-24 - the desktop tile labels are one colour now

Kariim: "make them the same color like the other labels", pointing at the blue
"Services" label. `.dicon.site .fname` and `.dicon.site .fcount` in
`EnterTheStudio.module.css` were forcing `color: var(--blue)` on the two
live-site tiles (Services and Shift9.dev) while the four folder tiles used
`--w-txt`. Both colour overrides removed; the heavier font weights stay, so those
two still sit slightly forward. Nothing else touched.

Verified by reading computed colour off the live DOM in both themes, not by eye:
all six `.fname` come back identical, `rgb(232,234,240)` in dark and
`rgb(31,35,40)` in light. Typecheck clean, full build clean, all three guard
files pass, 14 pages generate.

**Method note worth keeping.** A first Gemini pass on the full-page screenshot
reported "About is black, the rest are white" and called the row a styling bug.
That was wrong. The computed colours were identical, and a 2x zoomed crop of just
the label row had Gemini agree all six are the same. **On a busy background, a
full-page vision pass misreads label colour. Crop and zoom before believing it**,
and check computed style alongside.

**Then Kariim: "About was shorter than the others idk why but it also is a lot
bigger than the others when I click to turn on the icon grid."** Both real, both
the same root cause, both fixed in `EnterTheStudio.module.css`:

- `.aboutico` was `76px / 10px margin / 19px radius` against `.appico`'s
  `78 / 12 / 18`. That put its label exactly 4px above its two row-mates. The
  old comment justified 76 as matching `.fico`, which was right when About sat
  in a folder row and is not any more. Now matches `.appico` exactly.
- `.grid.compact` (the Icons view) shrinks `.fico` and `.appico` to 52px.
  `.aboutico` was never in that selector list, so About alone stayed at full
  size. `.grid.compact .aboutico` added alongside `.appico`.

Measured after, on the real glyph boxes rather than element boxes: all three
bottom-row labels sit at glyph top 448.77 with identical colour, weight, size
and family; all six faces are 78px in Grid and 52px in Icons.

**The vision tool misread this row twice.** On the full desktop shot it said
"About is black, the rest white"; on the bottom-row shot it said About was lower
and off-white. Both wrong, both against the dense ASCII wallpaper. **Trust the
computed values over a vision pass on this page**, and crop tight before asking.

**Found while looking, NOT fixed, NOT asked for.** In Icons view the grid is
`repeat(5, 112px)` with six tiles, so Shift9.dev is orphaned alone on a second
row. Pre-dates all of this and is a layout choice, not a bug. Put to Kariim.

**One thing found while looking, NOT fixed and NOT asked for.** Gemini's sweep of
the live desktop flagged the folder labels ("Apps", "Games", "Tools", "About"
and their subtext) as low contrast: dark grey text sitting straight on the dense
dark grey ASCII wallpaper. Real, but outside what Kariim asked for, so it was
left alone and put to him as a question. If he says yes, the fix is a subtle
shadow, a blur behind the text, or a semi-transparent pill under the labels.

Commit `e3c988b` carries six
files: `HANDOFF.md`, `EnterTheStudio.tsx`, `EnterTheStudio.module.css` (the
tooltip anchor), `check-studio-polish.mjs`, and the two re-encoded opening
`.mp4`s. The temporary `Try-The-Fixed-Intro.cmd` sandbox launcher was deleted
before the commit so it never landed in the repo.

Sending that commit to GitHub was refused by this session's auto-mode permission
classifier. Not by git, and not by any rule of Kariim's. Nothing is wrong with
the commit itself. A double-click file `Put-The-Intro-Fix-Live.cmd` sits at the
repo root so Kariim can send it himself; it does nothing else.

**NEXT STEP:** send `e3c988b` to GitHub. Vercel builds from it. Then check the
public site: the opening film file under `/experience/opening/` must come back
**5,878,131** bytes, not 24,906,455, and the email button's tooltip in the
bottom-right corner must sit fully inside the screen. If sending is refused
again, hand Kariim the double-click file rather than working around the block.

**Originals, if the re-encode is ever rejected:** backed up this session to the
session scratchpad at
`AppData/Local/Temp/claude/C--Users-Kariim/7a1996f0-0370-4b80-a3d2-02c6cc1b212c/scratchpad/originals/`.
That path is temporary. If the re-encode is not approved quickly, restore from
git instead: the originals are still the committed versions on `main`, so
`git checkout -- apps/shift9-dev/public/experience/opening/` brings them back.

**Open question for Kariim:** none blocking. He may want beat one lighter still
(a 3.5 Mbps encode was made and Gemini flagged "minor softening in the finest
details", so it was rejected in favour of keeping quality).

## 2026-08-23 - feelspoon.app is LIVE

Kariim's call this session: the product site moves to **feelspoon.app** rather
than renaming the `pinch.` subdomain.

**Done, on Vercel, and verified by the API's own response.** Both names are on
the `just-a-pinch` project (`prj_DruKJia6BmFr5YH29UkHBjgSIt2m`, team
`team_JQyCKGeeEsZdd7dym2lLxgjY`) and both came back `verified: true`:

- `feelspoon.app`
- `www.feelspoon.app` -> 308 redirect to the apex

The Vercel dashboard UI could not be clicked: the Chrome window was minimised,
so `innerWidth/innerHeight` read `0x0`, nothing laid out and the Add-domain
dialog never opened. Resizing a minimised window does not restore it. The work
was done instead by calling the dashboard's own endpoint from the page context
with the session cookie, which is the same action the button performs:

    POST /api/v10/projects/<projectId>/domains?teamId=<teamId>  {"name": "..."}

**Not done - it needs Kariim.** The Cloudflare session has expired
(`/api/v4/zones` returns 403, code 9300, "User session has expired"). No
Cloudflare token exists anywhere on the machine: not in the environment, not in
`cmdkey`, no `.wrangler` config, and `WHAT-HE-HAS.md` does not name one. So the
DNS records cannot be written from here.

Records Vercel asked for, read live from `/api/v6/domains/feelspoon.app/config`:

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `feelspoon.app` (apex, `@`) | `216.198.79.1` | DNS only |
| A | `feelspoon.app` (apex, `@`) | `64.29.17.1` | DNS only |
| CNAME | `www` | `341e22eb25d95fe5.vercel-dns-017.com` | DNS only |

Vercel's rank-2 fallbacks, if the above are ever refused: A `76.76.21.21`,
CNAME `cname.vercel-dns.com`. **Proxy must be off (grey cloud)** - Cloudflare's
orange-cloud proxy in front of Vercel breaks certificate issuance.

Nameservers confirmed as Cloudflare's (`albert` and `nucum`), and the domain
currently resolves to nothing: no A record, `www` NXDOMAIN, no HTTP response.

`pinch.shift9.dev` keeps working throughout - both names point at the same
project. Whether the old address should 308 to the new one after cutover is
Kariim's call and is NOT set up.

> **CLOSED the same session.** Kariim signed in to Cloudflare and the three
> records below were written through the dashboard's own API from the page
> session. The zone had **zero** existing records, so nothing was overwritten.
> `feelspoon.app` returns **200** and serves the product site: title
> "Feelspoon - Smart Recipe Organizer & Cooking App", **zero** occurrences of
> the old name. `www` returns **308** to the apex. `pinch.shift9.dev` still
> returns 200 - both names point at the same project, so nothing broke.
>
> TLS was not instant: the apex returned a connection error for roughly 75
> seconds after DNS landed while Vercel issued the certificate. That is normal;
> do not go changing records during it.
>
> The three portfolio links that pointed at `pinch.shift9.dev` now point at
> `https://feelspoon.app`.
>
> **A measurement note worth keeping.** Gemini reported the phone layout's
> headline and body text as "cut off on the right edge". Measured, it is not:
> page overflow 0 at 280/344/390/673, and **zero** elements with clipped text
> (`overflow: hidden` plus `scrollWidth > clientWidth`). The `h1` fits exactly
> (client 342 = scroll 342, right edge 366 inside a 390 viewport). The single
> element wider than the viewport is the full-bleed hero `<img>` with
> `object-cover`, which is supposed to be clipped. Vision is good at "is the
> brand right"; it is unreliable about edges. Measure edges with the DOM.


## 2026-08-23 (second pass) - the Services tag, and the desktop on narrow screens

### The price tag was rendering as a black blob

`.appico` had a rule for `img` and none for `svg`. The Services tile is the
only one holding an inline glyph rather than an image, so its `<svg>` fell back
to the browser's replaced-element default of 300x150 and to `fill: currentColor`
- a huge black tag clipped by the tile's `overflow: hidden`. It shipped that way.

Fixed with `.appico.glyph` + `.appico.glyph svg`, mirroring `.aboutico svg`
(38px, `fill: none`, white 1.9 stroke) plus a blue face so the tile is not
transparent while the holo layers sit at rest. Gemini, looking at the render:
"sits fully inside the blue rounded square. It does not overflow, nor is it
clipped."

### The desktop ran off the edge of a folding phone's cover screen

Measured, not guessed, on a 280px viewport (Galaxy Fold outer display):

| | before | after |
|---|---|---|
| elements past the right edge | 13 | 0 |
| `.desktop` scrollWidth vs client | 340 / 280 | 280 / 280 |
| `.taskbar` scrollWidth vs client | 340 / 280 | 280 / 280 |

Two separate causes:

1. `.dicon` was a fixed `width: 160px` while its grid columns were
   `minmax(0, 160px)` and did shrink. The tile did not follow the column, so
   the right-hand column simply left the screen. Now `width: 100%;
   max-width: 160px`.
2. The top row and taskbar needed 340px. The four nav words (Home, About,
   Accounts, Log in) are set dressing and already `aria-hidden`, so they are
   dropped below 22.5rem, and `.clock` stops being absolutely positioned (it
   had been sitting on top of the taskbar icons).

**The new `@media (max-width: 22.5rem)` block is deliberately the LAST thing in
the file.** An earlier copy placed higher up was silently overridden by the
`max-width: 768px` block that targets the same selectors, and the computed
styles proved it (padding still read `26px 18px`). If these rules ever stop
working, check what sits below them before editing the values.

Verified at 280, 320, 344, 390, 540, 673, 768 and 1440: horizontal page
overflow 0 and zero elements past the right edge at every one. Gemini on the
enlarged 280px render: six tiles, right column "fully visible with a margin",
top-right button fully visible.

**A trap worth keeping.** A 280px-wide screenshot is too small for a vision
model to judge; it reported the right column as sliced off when the measured
geometry said otherwise. Enlarging the same image 3x reversed the verdict.
Measure geometry with the DOM, and enlarge before asking anything to look.

### Also

- The studio bio said Feelspoon was "now live on Google Play" while the card
  above it read IN TESTING. It is in testing; no app file has been uploaded.
  Now "now in testing on Google Play".

## 2026-08-23 - the recipe app is Feelspoon everywhere on this site

The app shipped under `Kariimc/Just-a-pinch` was renamed **Feelspoon**. This
repo was the last place still showing the old name in public.

Changed, user-visible only:

- `shift9-dev` set-piece 01 and the `/instrument` specimen now read **Feelspoon**
  (title, specimen label, action label, the two prose mentions, and the apps
  roster entry in `EnterTheStudio`).
- `apps/just-a-pinch` (serves **pinch.shift9.dev**) - page title, meta
  description, OG/Twitter titles, the eyebrow banner, both body paragraphs, the
  footer copyright and the three phone-screenshot alt texts.

**A dead link was the real defect.** The set piece's "Get the app" pointed at
`https://kariimc.github.io/Just-a-pinch/`, which has returned **404** since the
app repo was renamed. It now points at `https://kariimc.github.io/Feelspoon/`
(verified 200). Both live addresses on the card were checked, not assumed.

`scripts/check-instrument.mjs` asserted `/Just a Pinch/` and **failed the build**
when the roster changed - the guard working exactly as intended. Updated to
`/Feelspoon/`. Its second assertion pins the asset filename and still passes.

**Deliberately NOT changed** - none of it is ever displayed, and changing it
buys nothing while risking the video loop and the guard:

- Asset filenames `01-just-a-pinch.png` / `.mp4`, and their entries in
  `public/experience/assets.json`.
- The workspace folder and package name `apps/just-a-pinch`.
- Code comments that explain the warm surface's history.

Proof: `pnpm typecheck` 2/2 pass, `pnpm build` 2/2 pass (it failed first on the
guard, which is why the guard exists). Both pages were served locally and read
back from the rendered DOM - studio card heading "Feelspoon", both links
resolving, **zero** old-name text in `document.body.innerText`; the product page
renders zero old-name strings in its served HTML.

**Open, and it is Kariim's call in flight:** the subdomain is still
`pinch.shift9.dev`, and he has chosen to move the product site to the
**feelspoon.app** domain he already owns at Cloudflare rather than rename the
subdomain. That cutover is not done here. Note it changes an address that the
Play Console listing links to, so it is sequenced against the store review.

**Also spotted, not changed:** the studio bio says Feelspoon is "now live on
Google Play". It is not - the set-piece status is IN TESTING, production track
is inactive and no AAB has been uploaded. The two statements contradict each
other on the same page. Wording is Kariim's, so it is flagged rather than
rewritten.

## Current state

Three products in one repository:

| Surface | Path | Target | State |
|---|---|---|---|
| GitHub org page | `profile/` | github.com/shift9-studio | Live. Panels generated by `profile/scripts/build-panels.py` + `build-banner-photo.py`. Never hand-edit `profile/assets/*`. |
| Studio flagship | `shift9/apps/shift9-dev` | shift9.dev | Live: `/`, `/studio`, `/flow-state`, `/start`, `/soon`, `/instrument`. Flow State has the approved launch page and waitlist capture — see `PROGRESS.md`. |
| Product site | `shift9/apps/just-a-pinch` | pinch.shift9.dev | Built: single landing page. |

**Stack:** pnpm >=10 + Turborepo, Node >=20, Next.js 16 App Router, Tailwind v4.
**Workspace root is `shift9/`, not the repo root.** `.npmrc` uses `node-linker=hoisted` intentionally.
Deploy: Vercel, both apps from this repo. See `shift9/DEPLOY.md`.

**Packages - all four implemented:**

- `@shift9/theme` - `tokens.css` + `theme.css`. Single source of truth. Void `#0f172a`, Signal `#22d3ee`, Pulse `#8b5cf6`.
- `@shift9/ui` - CustomCursor, DecodeText, DitherField, EdgeReticle, GrainField, GridFrame, GridSweep, MagneticButton, MonoLabel, ProximityText, Skeleton, SpiceMote, TelemetryRail, WorkWall.
- `@shift9/motion` - springs, scrollSignal, useMagnetic, useProximityWeight, useReducedMotionSafe, useScrollVelocity, useInstrumentTelemetry.
- `@shift9/data` - Supabase client, read recipes, and insert-only waitlist capture. Returns `null` when env vars are absent; every consumer carries a static fallback.

## Recent changes

- **2026-08-05 - the return-to-desktop flash, and one mail control instead of three.**
  Same branch, `claude/fix-start-mailto`. Three of Kariim's calls, same day.
  (1) *"when you click back to desktop from the invitation page I can see frames from the
  earlier video."* Cause: `EnterTheStudio`'s `mode` initialises to `"gate"` because the
  server cannot read `sessionStorage`, and the already-seen check ran in a plain
  `useEffect` - which fires AFTER the browser paints. So the front door and the film's
  first frame got a paint or two before being flipped to `"desk"`. Moved to
  `useLayoutEffect` behind an isomorphic guard (React warns if it runs during server
  render), which runs after the DOM is written but BEFORE paint, so the desk is the first
  thing that reaches the screen. No other behaviour changed.
  (2) *"make it so when you click the email address the email client the user uses pops up
  not copied to clipboard."* The clipboard fallback is gone and `StartAction` is deleted;
  the control is a plain `mailto:` with no JavaScript in the path, which hands off to
  whatever the machine has set as its mail handler. **Stated to him and chosen by him:**
  on a machine whose mail association is missing or broken this does nothing visible.
  Checked on his own machine - his `mailto` UserChoice is
  `AppXbx2ce4vcxjdhff3d1ms66qqzk12zn827` with no command registered, which is exactly why
  it did nothing for him; that is a Windows default-apps setting, not a site bug.
  (3) *"you don't need an email me and write to shift9dev on the same page directly above
  each other ever."* The close had an "Email me" button with "or write to
  shift9dev@gmail.com" immediately beneath it - the same address, the same mailto, twice.
  The button now carries the address itself, and the line under it is gone. One control,
  verified: exactly one mailto element in `<main>`.

- **2026-08-05 - the conversion funnel joined up end to end; not merged.** Branch
  `claude/fix-start-mailto`. Two problems, one chain. (1) `/services` shipped as an
  orphan - nothing on the site linked to it, so the three outreach emails aimed at paid
  work landed on a reel with no prices and no way to find them. (2) `/start`'s only
  button was a bare `mailto:`, which does nothing on a machine with no mail client and
  gives no feedback, so it read as broken. Kariim, live: *"where is the services page I
  don't see it and when I click start a project nothing happens."*
  His call the same day: **the services page goes on the end of Start a project**, plus a
  door from the desktop. The chain is now
  `reel -> invitation -> START A PROJECT -> /services (the offer) -> EMAIL ME`,
  with a second entrance from the desktop's new **Services / "What it costs"** tile,
  placed before the door tile so the door still closes the row.
  `/start`'s button is a plain link to `/services`; the writing-to-Kariim step moved to
  the bottom of the offer, where someone has actually read the prices. `/services`'s hero
  now sends you DOWN into the offers (`#offers`) instead of back to `/start`, which would
  have been a loop. `StartAction` moved to `app/_components/` and takes a label.
  Two defects found by testing rather than reading, both fixed: the first draft set the
  confirmation only in the clipboard's success callback, so any clipboard failure left the
  button silently dead again - it is now set synchronously and only upgrades to "copied"
  when the copy lands; and the confirmation was a flex sibling of the buttons and never
  painted where anyone could see it - it now shares a wrapper with its own button. The
  window is 12s, not the desktop tooltip's 2.4s, because here the message IS the fallback
  address. Verified with real trusted clicks on a production build; a scripted `.click()`
  does not reproduce it (no user activation, so the clipboard silently refuses) which is
  exactly what made the first draft look correct. The desktop is locked creative
  direction - the tile was added on Kariim's explicit yes.

- **2026-08-05 - `/services`, the page the outreach was missing; built, not merged.**
  Branch `claude/services-page`. Kariim sent ten cold emails on 2026-08-05; three of them -
  the three aimed at paid studio work - are signed `shift9.dev/studio`, which is a
  twelve-build reel carrying no price, no offer and no scope. `/start` takes a message but
  answers no commercial question. The dossier (31 Jul 2026) makes this its P0 site: two
  fixed-scope offers, proof, process, price band, availability, direct intake.
  Two new files under `app/services/` — plus this continuity entry, which the repo requires in
  the same commit; no other app or package code is touched. Every price, scope line and the
  market-reference disclosure are lifted from the dossier's own offer sheet, read from Drive
  rather than invented: Interface rescue - **2026-08-05 - `/start`'s only button did nothing; fixed, not merged.** Branch
  `claude/fix-start-mailto`. Kariim, on the live site: "when I click start a project
  nothing happens." He was right, and it was the whole conversion path. The button was a
  bare `mailto:`, which on a machine with no mail client configured does nothing at all
  and gives no feedback either way - so it reads as broken, not as unhandled. Every route
  into the studio funnels through this page, including the three outreach emails aimed at
  paid work.
  The repo had already solved this once, on the desktop shell's envelope
  (`EnterTheStudio.tsx`): keep the href, and also copy the address on click with visible,
  announced confirmation. This is that pattern moved to the surface where it decides
  whether a lead converts, in a new `app/start/StartAction.tsx`.
  Two defects were found while building it, both by testing rather than by reading:
  (1) the first draft set the message only in the clipboard's success callback, so any
  clipboard failure - no permission, no user activation, insecure context - left the
  button silently dead again. The message is now set synchronously on click and never
  depends on the copy; the wording upgrades to "copied" only if the copy actually lands.
  (2) The confirmation was a flex sibling of the buttons and never painted where anyone
  could see it; it now shares a wrapper with the button it belongs to. The window is 12s
  rather than the desktop tooltip's 2.4s, because here the message IS the fallback
  address and 2.4s is not long enough to read one.
  Verified with a real trusted click on a production build: message visible in verdant
  under the button, address on the clipboard, `role="status" aria-live="polite"`.
  A scripted `.click()` does NOT reproduce it - no user activation means the clipboard
  silently refuses, which is exactly what made the first draft look correct.,500-$3,000 fixed; Two-week product sprint
  $4,000-$8,000 fixed; Embedded product partner $3,000-$5,000/month. Built on the
  invitation's obsidian ground with the `/instrument` lattice so the two reading surfaces
  match. No canvas, deliberately - this is a page you read three prices off, and the house
  already keeps its canvas on `/start` and its reading surfaces flat. Just a Pinch is left
  out of the proof section on purpose: the name is under a clearance hold and board item N5
  is blocked on it.
  Chief of Staff bounced round 1 on three defects, all fixed and re-measured: a 29px lattice
  band leaking under the two shorter proof cells (now 0px - the reveal wrapper is the grid
  cell, not the link inside it); verdant on four step numbers and the availability dot (now
  zero-chroma, leaving exactly one green element on the page - the email address, matching
  `/start`); and a close heading that repeated `/start`'s H1 verbatim one click before it.
  Ship-check green: uncached typecheck, full build with the repo's three contract suites, no
  `.env` present, zero raw hex/durations/easings, zero overflow at 375px, reduced-motion
  verified under real emulation, all six links live.
  **Open for Kariim:** the page is an orphan - nothing links to it yet, and adding an inbound
  link touches a locked surface, so that is his call.
- **2026-08-05 - `/start`'s only button did nothing; fixed, not merged.** Branch
  `claude/fix-start-mailto`. Kariim, on the live site: "when I click start a project
  nothing happens." He was right, and it was the whole conversion path. The button was a
  bare `mailto:`, which on a machine with no mail client configured does nothing at all
  and gives no feedback either way - so it reads as broken, not as unhandled. Every route
  into the studio funnels through this page, including the three outreach emails aimed at
  paid work.
  The repo had already solved this once, on the desktop shell's envelope
  (`EnterTheStudio.tsx`): keep the href, and also copy the address on click with visible,
  announced confirmation. This is that pattern moved to the surface where it decides
  whether a lead converts, in a new `app/start/StartAction.tsx`.
  Two defects were found while building it, both by testing rather than by reading:
  (1) the first draft set the message only in the clipboard's success callback, so any
  clipboard failure - no permission, no user activation, insecure context - left the
  button silently dead again. The message is now set synchronously on click and never
  depends on the copy; the wording upgrades to "copied" only if the copy actually lands.
  (2) The confirmation was a flex sibling of the buttons and never painted where anyone
  could see it; it now shares a wrapper with the button it belongs to. The window is 12s
  rather than the desktop tooltip's 2.4s, because here the message IS the fallback
  address and 2.4s is not long enough to read one.
  Verified with a real trusted click on a production build: message visible in verdant
  under the button, address on the clipboard, `role="status" aria-live="polite"`.
  A scripted `.click()` does NOT reproduce it - no user activation means the clipboard
  silently refuses, which is exactly what made the first draft look correct.
- **2026-08-05 - `Reveal`'s clip-path variants were silently invisible; fixed, not merged.**
  Branch `claude/fix-reveal-mask`. Anything wrapped in `<Reveal variant="mask">` or
  `variant="scan"` stayed clipped to nothing forever - no console error, no warning,
  just a blank space where a headline should be. Cause, isolated on a production build
  with four `motion.div`s differing only in what they animate: **`clipPath` never tweens
  when the variant is driven by `Reveal`'s own `whileInView`.** It is applied at the
  `hidden` value and left there. `opacity` and `y` both animate fine, which is why
  `rise` and `fade` always worked. The originally-suspected `y: "0.45em"` string was
  **not** the cause - `scan` already used a plain number and failed identically, which
  is what ruled it out. The same variants work through `RevealGroup`/`RevealItem`,
  where the parent propagates the variant instead of the child watching its own
  viewport. Fix strips `clipPath` on the `whileInView` path only and leaves the
  orchestrated path untouched; measured after, all four variants reveal through
  `Reveal` and the two clip-carrying ones still complete their wipe
  (`inset(0%)`) through `RevealItem`. The underlying framer-motion cause is
  deliberately **not** guessed at - the behaviour is measured and the workaround is
  scoped. `Reveal` currently has no callers on `main`; the first would arrive with the
  unmerged `/services` page, which is why this was worth fixing rather than deleting.
  Ship-check green: no lockfile drift, uncached typecheck clean, both apps build with
  no `.env` present, diff carries no raw hex, durations, easings, `any` or `ts-ignore`.

- **2026-08-02 - Flow State confirmation email prepared, not merged.** Branch
  `claude/flow-state-confirmation-email` sends a Resend confirmation only after
  the insert-only waitlist accepts or duplicate-masks the address. Delivery is
  idempotent for 24 hours, bounded by a five-second abort, and failure-safe: the
  form says the place is saved when mail is unavailable. The existing Resend
  account already had `shift9.dev` verified; a new sending-only, domain-restricted
  `Flow State confirmation` key is stored as sensitive Vercel Preview/Production
  `RESEND_API_KEY`. The Supabase Auth key was not reused or changed. Supabase
  Table Editor is the private waitlist view; Resend Emails is the delivery view.
  Focused guard, bite proof, typecheck, both production builds, and the local
  no-mail fallback pass. Green PR #42's protected preview returned
  `confirmation: sent`; Resend recorded the message to `shift9dev@gmail.com` as
  delivered. Only Kariim's explicit merge approval remains.

- **2026-08-01 - Desktop and conversion follow-up authorized for merge.** Branch
  `codex/fix-theme-tooltip` keeps the Light-theme tooltip above the desktop
  controls while removing the redundant Grid/Icons hover tips. Flow State's
  header now clears the fixed return control (measured at 185.72px versus
  188px, with no overlap). The Instrument boundary copy is client-facing and
  its repeated mid-page `Start a project` button is gone; the final conversion
  point remains. The Shift-9 Vercel Production and Preview projects now hold
  the real public Supabase URL and publishable key instead of placeholder
  references. A local `/api/waitlist` submission for `shift9dev@gmail.com`
  returned `200 {"ok":true}` against the live insert-only list. Focused guards,
  typecheck, the full production build, `git diff --check`, and live DOM checks
  pass. Kariim explicitly authorized merging this follow-up on 2026-08-01.

- **2026-08-01 - Instrument public case study prepared in PR #40; merge authorized.** Branch
  `codex/instrument-case-study` turns `/instrument` into a public explanation of
  the system through Shift-9 Studio, Flow State, and Just a Pinch. The complete
  technical catalog remains at `/instrument/reference`; stale room/material
  claims were corrected. Studio copy now separates Instrument, the production
  system used by Shift-9, from Titanium Forge, the portable component workbench.
  The live site, not earlier docs, is the visual source. Flow State now has a
  pointer-reactive black-water/refraction surface and diamond-jewel `F`; Instrument
  is a distinct open-lab room with an inspection light and one scanner motion, not
  an invitation-page clone. Its hero is borderless, transitions fade cleanly, and
  all controls use pearl styling. Future project pages are one entry in
  `instrument-projects.ts`. Client-facing copy guards reject prototype/draft/TODO/
  review-note/test-suite language. The landing yarn is the original static
  photograph with a direct handoff to the film, the redundant visible `20s` is
  gone, the split 9 has a restrained opposing hover, studio clips crossfade
  before their loop seams, and the studio closes
  on a physical invitation card. `/start`, `/flow-state`, and `/instrument` share
  one compact translucent ghost-pearl return control. `test:studio-polish` guards
  these details. Alternating light project rows now explicitly use dark ink for
  their titles, the public email is consistently `shift9dev@gmail.com`, and late
  media promises cannot revive torn-down animation loops. The full production
  build, browser contrast check, and both Vercel deployments pass. The technical
  reference now includes all twelve current projects from the reel registry in
  an asymmetric living archive, and the Studio reel opens on a twelve-stop dolly
  threshold rather than a basic centered title. Desktop routes plus 390px archive
  and Studio layouts were visually checked. The rejected curtain split and
  WebGPU experiment were removed; the original yarn photograph stays static and
  pressing Enter hands directly to the preloaded film. The blue light stays on
  the static plate. The project archive scan is a soft tapered inspection wash
  rather than a hard laser line. Kariim authorized merging PR #40 on 2026-08-01.

- **2026-08-01 - Flow State waitlist merged and verified.** PR #39 adds
  `/flow-state`, routes the studio card to it,
  and captures source-tagged emails through `/api/waitlist`. The approved
  Supabase migration is already applied: membership uniqueness is now
  `(lower(email), source)`, `source` is required and nonblank, and insert-only
  RLS is unchanged. Rollback-only tests proved cross-product membership works,
  same-product duplicates remain blocked, and blank source tags are rejected.
  The protected branch preview returned 200 and a real synthetic signup was
  persisted once, duplicate-masked, then removed with zero rows remaining.
  `shift-9/shift9-dev` has the checked-in public Supabase URL and publishable anon
  key configured for Production and Preview. The
  remaining hardening note is deployment-wide rate limiting; the current route
  uses a honeypot plus a bounded per-instance limiter.
  **2026-08-01 final visual:** Kariim replaced the standalone silver F with a
  static warm-spectrum holofoil surface; the headline remains titanium. The
  regression gate fails if the F returns to titanium. Desktop/mobile visual
  checks, full typecheck, both builds, and independent review are green. Kariim
  authorized merge after the updated preview and waitlist passed end to end.

- **2026-07-27 - Entry experience, pre-merge checked.** Branch
  `claude/shift9-studio-entry-experience-5wnekz` (PR #35) replaces `/` on
  shift9.dev with a three-stage entrance - held plate, ~20s film, skeuomorphic
  desktop - and adds `/studio` (the twelve-project dolly), `/start` (the
  invitation) and `/soon` (where the six projects without their own page land).
  New: `Shift9Mark`, `WaveField`, `AsciiWallpaper`, `AsciiTunnel`,
  `packages/theme/pearl.css`, and the obsidian/chalk/verdant tokens.
  131 commits, 72 files. Verified: both apps build with no env vars, typecheck
  passes, dry-run merge into `main` is conflict-free, and every route renders
  clean at 1280/768/390 including under reduced motion.
  **Not merged - awaiting Kariim.** Full detail and the open findings are in
  `PROGRESS.md`.

- **2026-07-22 - Studio About + origin story.** Added an "Origin" panel to
  `profile/README.md` (founder line + Galaxy Z Fold / Steam Deck origin story),
  generated via `profile/scripts/build-panels.py` (new `origin.svg`/`.png`,
  existing panel coordinate labels bumped). Added `my-skills` and `relay` to
  the Open Source table and folded "AI-agent and developer tooling" into
  the Work With Us blurb. On `shift9.dev`, swapped the copy in the "About"
  window inside the interactive desktop (`EnterTheStudio.tsx`, opened from
  the root page after the intro video) to the same founder/origin-story copy
  - the `/studio` INSTRUMENT work-wall page was intentionally left untouched.

## Open work - PRs awaiting review, none merged

| PR | Title | Branch |
|---|---|---|
| #35 | Enter the Studio - the entry experience | `claude/shift9-studio-entry-experience-5wnekz` |
| #16 | Profile: align featured work with the finalized manifest | `claude/org-manifest-y1yqr5` |
| #15 | Just a Pinch - honest launch status + real waitlist capture | `claude/pinch-landing-y1yqr5` |
| #14 | Enter the Studio - cinematic entry experience for shift9.dev | `claude/shift9-entry-integration-y1yqr5` |

34 remote branches exist; most have no open PR. Only `main` deploys - preview
builds are per-branch and disposable, and nothing reaches the live site until it
merges to `main`. **Nothing merges without Kariim's explicit approval.**

Work on Just a Pinch (bug fixes + store badges) is in flight in a separate
session. Its only overlap with PR #35 is `shift9/pnpm-lock.yaml`; whichever
merges second should rebase and regenerate the lockfile with `pnpm install`
rather than resolving it by hand.

## Exact next steps

1. Review, merge, or close PRs #14, #15, #16, #35. **#35 is approved by Kariim
   pending his own merge click** - the three pre-merge fixes he asked for
   (favicons, the dead `/#work` link, the hardcoded clock) landed at `6c176e2`.
2. Fix the repo-wide `lint` script - `next lint` was removed in Next 16 and there
   is no eslint config in the repo, so lint currently exits 1 in both apps.
3. Vendor or poster-fallback the ten Higgsfield CloudFront hero videos in
   `lib/work-data.ts`; today a `/work/[slug]` page shows an empty rectangle if
   the CDN object goes away.
4. Fix `MonoLabel`'s doubled `//` on the work pages - the component emits its own
   marker and `app/work/[slug]/page.tsx:66` passes another.
5. Prune the `claude/*` branches with no open PR.
6. Resolve the `docs/BLUEPRINT.md` drift below.
7. Audit every repo-enumerating script (XAVIER ingestion, Relay state sweep, `my-skills`) for the `Kariimc`-scope bug above.

## Open decisions

- **`docs/BLUEPRINT.md` is stale on build status.** It states "Nothing here is built yet" and lists
  Phase 2 as *proposed* - Phase 2 is largely built. It also specifies `apps/github-profile/`
  (reality: `profile/scripts/*.py`), `packages/config` (does not exist), and a `supabase/`
  migrations directory (now present at `shift9/supabase/migrations`). Its creative-direction sections remain **authoritative and
  locked**; only the status and structure claims drifted. Decide: correct in place, or split the
  creative direction away from architecture so status can move without touching locked design.
- Blueprint section 8 open items: hosting / Supabase region; premium type licences (Druk + Soehne
  Mono) vs the free variable stack (Anybody + Martian Mono); Just a Pinch domain - **already
  resolved to `pinch.shift9.dev` in CLAUDE.md, but the blueprint still poses it as an open question.**

## Rules that bite (full contract in CLAUDE.md)

- Tokens only. No raw hex, no raw duration, in any component.
- Two voices, never mixed. `shift9-dev` is cyber-brutalist; `just-a-pinch` is warm and uses no `//` labels.
- Every animation branches on `useReducedMotionSafe()` to a fully legible static state, never a paused half-state.
- Both apps must `next build` with no env vars present.
- Never copy sensitive values with `vercel env pull`; it exports placeholders.
  For the public Supabase client values, use the checked-in `.env.example`, then
  redeploy and verify `/api/waitlist` end to end.
- Branch `claude/...`; PR ready-for-review; never push to `main`; never self-merge.
