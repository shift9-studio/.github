---
name: profile-panels
description: Update the shift9-studio GitHub org profile page — change panel copy, regenerate the SVG/PNG panel assets via the build scripts, keep README alt text in sync, and verify GitHub-README constraints. Use whenever a change touches profile/README.md, profile/scripts/, or any panel/banner copy or artwork.
---

# Updating the org profile page

The profile page (`profile/README.md`, rendered at github.com/shift9-studio) is built
from **generated images**. All panel copy and layout live in Python:

- `profile/scripts/build-panels.py` — every content panel (intro, lead, product flags,
  stack, shipping, contact, footer). Copy is string constants inside this script.
- `profile/scripts/build-banner-photo.py` — the animated hero banner
  (`assets/s9-banner.svg` + still fallback).

**Never edit files in `profile/assets/` by hand.** Change the script, regenerate.

## Procedure

1. **Locate the copy in the script.** Grep `build-panels.py` for the current text.
   Each panel is one function/block emitting an SVG; note its width/height and
   whether it has a coordinate label.
2. **Edit the script only.** Keep the shared surface rules from the script header:
   one continuous void surface, shared left rail, no per-panel borders/ticks/scan
   rays, calm motion only (the hero carries movement). Palette constants at the top
   (`VOID #0a0e1a`, `SIGNAL #22d3ee`, `PULSE #8b5cf6`, `INK`, `MUTED`) — reuse them,
   never introduce new colors.
3. **Regenerate** from repo root: `python3 profile/scripts/build-panels.py`
   (and `build-banner-photo.py` only if the banner changed). Confirm the expected
   files in `profile/assets/panels/` changed and nothing else.
4. **PNG fallbacks.** GitHub on mobile renders animated SVGs unreliably, so the
   README embeds `.png` panels. If the script emits SVG only, convert each changed
   panel: `rsvg-convert -w <2x-width> panel.svg -o panel.png` (or the script's own
   PNG step if present). Verify the PNG actually reflects the new copy — open/Read
   it, don't assume.
5. **Sync `profile/README.md`:**
   - Every `<img>` `alt` must restate the panel's full visible text verbatim
     (that's the page's accessibility and its SEO).
   - If a panel's link target changed, update the wrapping `<a href>`.
   - Badge/nav rows are real markdown, not images — edit them directly in README.
6. **Constraint check before committing** — GitHub READMEs cannot use:
   `<style>`/CSS, JavaScript, external fonts (fonts must be baked as paths or
   safe system stacks inside the SVG), `<iframe>`, or images behind text.
   Animation = SMIL inside the SVG only, and it must stop under
   `prefers-reduced-motion` (the scripts already emit this — keep it).
7. **Verify links** in the README resolve: shift9.dev, pinch.shift9.dev, repo
   anchors like `/tree/main/shift9#the-instrument-system`. No placeholders.
8. **Commit script + regenerated assets + README together**, one commit, message
   style `content(profile): …` or `chore(profile): …`.

## Common failures

- Editing the PNG/SVG output → next regeneration silently reverts your change.
- Changing copy in the script but forgetting the README alt text → screen readers
  and search see stale text.
- New text overflowing the fixed SVG width → check longest line at the panel's
  font-size; wrap or shorten rather than shrinking type below 11px mono.
- Caching: github.com serves panels through camo with long cache; after merge the
  page may show old images for a while — that is not a bug, don't "fix" it.
