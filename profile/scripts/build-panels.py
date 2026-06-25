#!/usr/bin/env python3
"""Generate the full-width content panels for the GitHub org profile.

GitHub READMEs can't place an image behind live text, so each block is rendered
as a full-width SVG with the SHIFT-9 surface baked in and high-contrast text on
top. The README wraps panels in <a> for links and adds the real markdown
headings, badges, and repo cards that carry the page's "signal".

Design goals (rev 2):
- ONE continuous surface, not a stack of cards. Every panel shares the exact
  same void fill, faint grid, and a left "instrument rail" at x=0 — so stacked
  panels read as a single document with a margin rule. No per-panel borders,
  corner ticks, or independent scan-rays (those made the page feel busy and
  disconnected, with a dozen scan lines drifting out of sync).
- Calm motion: the hero banner carries the movement; panels only breathe via a
  slow shared rail glow. All motion stops under prefers-reduced-motion.
- Flagship products are single images (logo badge + copy together) — no
  icon/text seam.

Usage:  python3 profile/scripts/build-panels.py    # run from repo root
"""
import base64
import os

HERE = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(HERE, "..", "assets"))
OUT = os.path.join(ASSETS, "panels")
os.makedirs(OUT, exist_ok=True)

# palette (shared with build-banner.py / the design tokens)
VOID, VOID2 = "#0a0e1a", "#0b1120"
INK, MUTED, SIGNAL, PULSE = "#e6edf3", "#9aa7b8", "#22d3ee", "#8b5cf6"

SANS = "'Arial Black','Helvetica Neue',Arial,sans-serif"
MONO = "'SFMono-Regular',ui-monospace,Menlo,Consolas,monospace"


def bg(w, h, coord=""):
    """Unified calm surface: void + faint grid + glowing left rail. Seamless so
    stacked panels read as one continuous document. No border / ticks / scan."""
    label = (f'    <text x="{w-18}" y="24" fill="{MUTED}" font-family="{MONO}" '
             f'font-size="11" letter-spacing="3" text-anchor="end" '
             f'opacity="0.55">{coord}</text>') if coord else ""
    return f'''  <defs>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="{SIGNAL}" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
    <style>
      @keyframes rail {{ 0%,100%{{opacity:.4}} 50%{{opacity:.85}} }}
      .rail {{ animation: rail 4.2s ease-in-out infinite; }}
      @media (prefers-reduced-motion: reduce){{ .rail{{animation:none;opacity:.6}} }}
    </style>
  </defs>
  <rect width="{w}" height="{h}" fill="{VOID}"/>
  <rect width="{w}" height="{h}" fill="url(#grid)"/>
  <rect class="rail" x="0" y="0" width="4" height="{h}" fill="{SIGNAL}"/>
  <rect x="4" y="0" width="1" height="{h}" fill="{SIGNAL}" opacity="0.15"/>
{label}'''


def svg(name, w, h, coord, body):
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
           f'viewBox="0 0 {w} {h}" width="100%" role="img">\n{bg(w, h, coord)}\n{body}\n</svg>\n')
    with open(os.path.join(OUT, name), "w") as f:
        f.write(doc)
    print(f"  panels/{name}  ({w}x{h})")


def t(x, y, s, size, fill, weight="400", family=MONO, ls="0", anchor="start"):
    return (f'    <text x="{x}" y="{y}" fill="{fill}" font-family="{family}" '
            f'font-size="{size}" font-weight="{weight}" letter-spacing="{ls}" '
            f'text-anchor="{anchor}">{s}</text>')


def chip(x, y, w, label, color, h=32):
    return (f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="none" '
            f'stroke="{color}" stroke-opacity="0.6"/>\n'
            + t(x + w / 2, y + h / 2 + 5, label, 13, color, "700", MONO, "2", "middle"))


def _logo_datauri(filename):
    with open(os.path.join(ASSETS, filename), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode("ascii")


# ── INTRO (wraps shift9.dev link) ───────────────────────────────────────────
svg("intro.svg", 1200, 248, "X:001 · Y:STUDIO", "\n".join([
    t(60, 78, "// SHIFT-9 — DESIGN + ENGINEERING STUDIO", 17, SIGNAL, "700", MONO, "4"),
    t(58, 160, "WE DESIGN " + f'<tspan fill="{SIGNAL}">&amp; SHIP.</tspan>', 66, INK, "900", SANS, "1"),
    t(60, 206, "A design and engineering studio. We build brands, websites, and apps —", 21, MUTED, "400", SANS),
    t(60, 234, "and the systems that keep them running.", 21, MUTED, "400", SANS),
]))

# ── LEAD line ───────────────────────────────────────────────────────────────
svg("lead.svg", 1200, 124, "X:002 · Y:SYSTEM", "\n".join([
    t(60, 56, "One design system runs through everything we make — " + f'<tspan fill="{SIGNAL}">site, apps, this page.</tspan>', 24, INK, "700", SANS),
    t(60, 90, "The same colors, type, and motion everywhere, so all our work feels like one studio.", 19, MUTED, "400", SANS),
]))


# ── FLAGSHIP product panels (single image: logo badge + copy + live chip) ────
def flagship(name, coord, logo_file, title, tcolor, l1, l2, chip_label, chip_w):
    cid = name.replace(".svg", "").replace("-", "")
    body = "\n".join([
        # logo badge tile
        f'    <clipPath id="clip-{cid}"><rect x="54" y="46" width="104" height="104" rx="12"/></clipPath>',
        f'    <rect x="48" y="40" width="116" height="116" rx="16" fill="{VOID2}" stroke="{tcolor}" stroke-opacity="0.30"/>',
        f'    <image xlink:href="{_logo_datauri(logo_file)}" x="54" y="46" width="104" height="104" clip-path="url(#clip-{cid})"/>',
        f'    <rect x="48" y="40" width="116" height="116" rx="16" fill="none" stroke="{tcolor}" stroke-opacity="0.12"/>',
        # copy
        t(198, 82, title, 38, tcolor, "800", SANS, "0.5"),
        t(198, 118, l1, 18.5, MUTED, "400", SANS),
        t(198, 144, l2, 18.5, MUTED, "400", SANS),
        chip(198, 160, chip_w, chip_label, tcolor, 30),
    ])
    svg(name, 1200, 200, coord, body)


flagship("flag-pinch.svg", "Y:JUST-A-PINCH", "logo-pinch.png", "Just a Pinch", SIGNAL,
         "A recipe organizer and cooking app. Save every recipe in one place, then cook it with",
         "guided steps, adjustable serving sizes, and swaps when you're missing something.",
         "pinch.shift9.dev  ↗", 232)

flagship("flag-9dev.svg", "Y:SHIFT9.DEV", "logo-9dev.png", "shift9.dev", SIGNAL,
         "Our studio site — the work we've done, what we do, and how to start a project.",
         "It's also a live example of the kind of sites we build.",
         "shift9.dev  ↗", 168)

flagship("flag-instrument.svg", "Y:INSTRUMENT", "logo-instrument.png", "INSTRUMENT", PULSE,
         "Our design system — the shared colors, type, motion, and UI components we reuse",
         "across every project, so everything we ship feels like one studio.",
         "/shift9/packages  ↗", 230)


# ── STACK (terminal-style) ──────────────────────────────────────────────────
stack_lines = [
    ('{', MUTED), (None, None),
    ('"studio":', SIGNAL, '"Shift-9"', INK),
    ('"build":', SIGNAL, '["Next.js 16", "Tailwind v4", "Turborepo", "Python"]', INK),
    ('"data":', SIGNAL, '"Supabase — auth, data, and content behind every surface"', INK),
    ('"discipline":', SIGNAL, '["brand systems", "production apps", "the glue between them"]', INK),
    ('"environment":', SIGNAL, '"Linux · dark mode everything · motion that respects you"', INK),
    ('}', MUTED), (None, None),
]
body = []
y = 64
for ln in stack_lines:
    if ln[0] is None:
        y += 14
        continue
    if len(ln) == 2:
        body.append(t(60, y, ln[0], 22, ln[1], "700", MONO))
    else:
        body.append(t(60, y, ln[0], 22, ln[1], "700", MONO))
        body.append(t(290, y, ln[2], 21, ln[3], "400", MONO))
    y += 38
svg("stack.svg", 1200, y + 6, "X:003 · Y:STACK", "\n".join(body))

# ── CURRENTLY SHIPPING ──────────────────────────────────────────────────────
ship = [
    ("just-a-pinch", "— the recipe organizer and cooking app."),
    ("shift9.dev", "— the studio site."),
    ("INSTRUMENT", "— the design system we reuse across every project."),
]
body, y = [], 62
for code, rest in ship:
    body.append(t(60, y, "▸", 20, SIGNAL, "700", MONO))
    body.append(t(92, y, code, 20, INK, "700", MONO))
    body.append(t(92 + len(code) * 13 + 24, y, rest, 19, MUTED, "400", SANS))
    y += 52
svg("shipping.svg", 1200, y + 4, "X:004 · Y:SHIPPING", "\n".join(body))

# ── CONTACT (wraps mailto) ──────────────────────────────────────────────────
svg("contact.svg", 1200, 150, "X:005 · Y:CONTACT", "\n".join([
    t(60, 56, "// transmission open", 16, SIGNAL, "700", MONO, "4"),
    t(60, 104, "shift9.dev@gmail.com", 40, INK, "900", SANS, "0.5"),
    chip(642, 80, 150, "EMAIL  ↗", PULSE),
]))

# ── FOOTER ──────────────────────────────────────────────────────────────────
svg("footer.svg", 1200, 70, "", "\n".join([
    t(600, 42, "// build: stable — © 2026 SHIFT-9, made in motion", 15, MUTED, "400", MONO, "2", "middle"),
]))

print("done.")
