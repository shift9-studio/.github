#!/usr/bin/env python3
"""Generate full-width animated background panels for the GitHub org profile.

GitHub READMEs can't place an image behind live text, so each text block is
rendered as a full-width SVG with the animated SHIFT-9 background baked in
(drifting grid + scan-ray) and light, high-contrast text on top. In the README
each panel is wrapped in an <a> so links still work; the animated GIF banner and
product icons stay as real GIFs alongside these panels.

Usage:  python3 profile/scripts/build-panels.py    # run from repo root
"""
import os

OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "assets", "panels"))
os.makedirs(OUT, exist_ok=True)

# palette
VOID, INK, MUTED, SIGNAL, PULSE = "#0a0e1a", "#e6edf3", "#9aa7b8", "#22d3ee", "#8b5cf6"

SANS = "'Arial Black','Helvetica Neue',Arial,sans-serif"
MONO = "'SFMono-Regular',ui-monospace,Menlo,Consolas,monospace"


def bg(w, h, coord):
    """Animated dark background: grid, drifting diagonals, scan-ray, corner ticks."""
    return f'''  <defs>
    <linearGradient id="ray" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{SIGNAL}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="{SIGNAL}" stop-opacity="0.8"/>
      <stop offset="1" stop-color="{PULSE}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="{SIGNAL}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
    <clipPath id="bounds"><rect width="{w}" height="{h}"/></clipPath>
    <style>
      @keyframes drift {{ from{{transform:translateX(-40%)}} to{{transform:translateX(140%)}} }}
      @keyframes glow  {{ 0%,100%{{opacity:.35}} 50%{{opacity:.7}} }}
      .scan {{ animation: drift 7s linear infinite; }}
      .tick {{ animation: glow 3.4s ease-in-out infinite; }}
      @media (prefers-reduced-motion: reduce){{ .scan{{animation:none;opacity:.3}} .tick{{animation:none}} }}
    </style>
  </defs>
  <g clip-path="url(#bounds)">
    <rect width="{w}" height="{h}" fill="{VOID}"/>
    <rect width="{w}" height="{h}" fill="url(#grid)"/>
    <line x1="-100" y1="{h*0.2:.0f}" x2="{w*0.5:.0f}" y2="{h+40}" stroke="{SIGNAL}" stroke-opacity="0.10" stroke-width="1.5"/>
    <line x1="{w*0.55:.0f}" y1="-40" x2="{w+100}" y2="{h*0.7:.0f}" stroke="{SIGNAL}" stroke-opacity="0.08" stroke-width="1.5"/>
    <rect class="scan" x="0" y="0" width="180" height="{h}" fill="url(#ray)" opacity="0.5"/>
    <rect x="0" y="0" width="{w}" height="{h}" fill="none" stroke="{SIGNAL}" stroke-opacity="0.16"/>
    <g stroke="{SIGNAL}" stroke-width="1.5" fill="none" class="tick">
      <path d="M14 28V14H28"/><path d="M{w-28} 14H{w-14}V28"/>
      <path d="M14 {h-28}V{h-14}H28"/><path d="M{w-14} {h-28}V{h-14}H{w-28}"/>
    </g>
    <text x="22" y="26" fill="{MUTED}" font-family="{MONO}" font-size="12" letter-spacing="3">{coord}</text>
  </g>'''


def svg(name, w, h, coord, body):
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
           f'width="100%" role="img">\n{bg(w, h, coord)}\n{body}\n</svg>\n')
    with open(os.path.join(OUT, name), "w") as f:
        f.write(doc)
    print(f"  panels/{name}  ({w}x{h})")


def t(x, y, s, size, fill, weight="400", family=MONO, ls="0", anchor="start"):
    return (f'    <text x="{x}" y="{y}" fill="{fill}" font-family="{family}" '
            f'font-size="{size}" font-weight="{weight}" letter-spacing="{ls}" '
            f'text-anchor="{anchor}">{s}</text>')


def chip(x, y, w, label, color):
    return (f'    <rect x="{x}" y="{y}" width="{w}" height="34" rx="6" fill="none" '
            f'stroke="{color}" stroke-opacity="0.6"/>\n'
            + t(x + w / 2, y + 23, label, 14, color, "700", MONO, "2", "middle"))


# ── INTRO (wraps shift9.dev link) ───────────────────────────────────────────
svg("intro.svg", 1200, 300, "X:001 · Y:STUDIO", "\n".join([
    t(60, 70, "// SHIFT-9 — DESIGN + ENGINEERING STUDIO", 17, SIGNAL, "700", MONO, "4"),
    t(58, 150, "WE DESIGN " + '<tspan fill="' + SIGNAL + '">&amp; SHIP.</tspan>', 64, INK, "900", SANS, "1"),
    t(60, 196, "A design and engineering studio. We build brands, websites, and apps —", 21, MUTED, "400", SANS),
    t(60, 224, "and the systems that keep them running.", 21, MUTED, "400", SANS),
    chip(60, 250, 168, "shift9.dev  ↗", SIGNAL),
    chip(244, 250, 260, "DESIGN + ENGINEERING", PULSE),
    chip(520, 250, 132, "SHIPPING", SIGNAL),
]))

# ── LEAD line ───────────────────────────────────────────────────────────────
svg("lead.svg", 1200, 130, "X:002 · Y:SYSTEM", "\n".join([
    t(60, 58, "One design system runs through everything we make — " + f'<tspan fill="{SIGNAL}">site, apps, this page.</tspan>', 24, INK, "700", SANS),
    t(60, 92, "The same colors, type, and motion everywhere, so all our work feels like one studio.", 19, MUTED, "400", SANS),
]))


# ── PRODUCT ROWS (each wraps its own link, icon GIF sits to the left) ────────
def row(name, coord, title, tcolor, l1, l2):
    svg(name, 1000, 163, coord, "\n".join([
        t(40, 64, title, 30, tcolor, "800", SANS, "0.5"),
        t(40, 104, l1, 19, MUTED, "400", SANS),
        t(40, 132, l2, 19, MUTED, "400", SANS),
    ]))


row("row-pinch.svg", "Y:JUST-A-PINCH", "Just a Pinch", SIGNAL,
    "A recipe organizer and cooking app. Save every recipe in one place, then cook it",
    "with guided steps, adjustable serving sizes, and swaps when you're missing something.")
row("row-9dev.svg", "Y:SHIFT9.DEV", "shift9.dev", SIGNAL,
    "Our studio site — the work we've done, what we do, and how to start a project.",
    "It's also a live example of the kind of sites we build.")
row("row-instrument.svg", "Y:INSTRUMENT", "The INSTRUMENT design system", PULSE,
    "Our design system: the shared colors, type, motion, and UI components we reuse",
    "across every project so everything we ship feels like one studio.")


# ── PRODUCT ICON SQUARES (163×163, animated bg, sits left of new row panels) ─
def icon_svg(name, line1, line2, color):
    """163×163 square icon — same animated bg as panels, drop-in for GIF icons."""
    w, h = 163, 163
    body = "\n".join([
        t(w // 2, h // 2 + 4,  line1, 44, color, "900", SANS, "2",  "middle"),
        t(w // 2, h // 2 + 28, line2, 12, MUTED, "700", MONO, "4",  "middle"),
    ])
    svg(name, w, h, "", body)


icon_svg("icon-voxel.svg",  "VXL", "ARCADE",  PULSE)
icon_svg("icon-recipe.svg", "RCP", "ENGINE",  SIGNAL)
icon_svg("icon-signal.svg", "SIG", "GRID",    PULSE)
icon_svg("icon-dither.svg",   "DTH", "LAB",      SIGNAL)
icon_svg("icon-midnight.svg", "MR",  "RETURN",   PULSE)
icon_svg("icon-omni.svg",     "O3D", "TOOLKIT",  SIGNAL)
icon_svg("icon-scraper.svg",  "SUB", "SCRAPER",  SIGNAL)
icon_svg("icon-whome.svg",    "WH",  "DIAG",     PULSE)
icon_svg("icon-bball.svg",    "BBL", "COURT",    PULSE)


# ── ADDITIONAL PRODUCT ROWS ──────────────────────────────────────────────────
row("row-voxel.svg",    "Y:VOXEL-ARCADE",   "Voxel Arcade Basketball", PULSE,
    "A 3D voxel basketball arcade game built in Python. Compete in arcade-style",
    "matches in a fully voxel world — targeting Steam release.")

row("row-recipe.svg",   "Y:RECIPE-ENGINE",  "Recipe Engine",           SIGNAL,
    "The data pipeline powering Just a Pinch. Scrapes, parses, and normalizes",
    "recipes then seeds them into Supabase at scale via structured API layers.")

row("row-signal.svg",   "Y:SIGNAL-GRID",    "Signal Grid",             PULSE,
    "Shift-9's brand identity system — color tokens, type scale, motion rules,",
    "and grid guidelines unified across every surface we ship.")

row("row-dither.svg",   "Y:DITHER-LAB",     "Dither Lab",              SIGNAL,
    "A WebGL R&D lab exploring dithering techniques and GLSL shader effects —",
    "the origin of the animated backgrounds across all Shift-9 products.")

row("row-midnight.svg", "Y:MIDNIGHT-RETURN", "Midnight Return",         PULSE,
    "A Metroidvania platformer built in C#. Explore interconnected worlds,",
    "unlock abilities, and battle through a dark, atmospheric side-scroller.")

row("row-omni.svg",     "Y:OMNI-3D",         "Omni-3D",                 SIGNAL,
    "A modular game development toolkit in TypeScript — shared 3D utilities,",
    "scene management, and rendering helpers reused across game projects.")

row("row-scraper.svg",  "Y:SUB-SCRAPER",     "Sub Scraper",             SIGNAL,
    "Download your entire Spotify and SoundCloud libraries in one command.",
    "Scrapes metadata, finds sources, and organizes downloads automatically.")

row("row-whome.svg",    "Y:WHOME-DIAG",      "whome Diagnostic",        PULSE,
    "A Python tool to identify and fix the Windows 10 Home upgrade bug.",
    "One command to diagnose, patch, and confirm the repair is complete.")

row("row-bball.svg",    "Y:BBALL",           "Bball",                   PULSE,
    "A basketball game built in C# — smooth physics, clean mechanics,",
    "and the gameplay loop that seeded the Voxel Arcade Basketball engine.")


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
    chip(640, 78, 150, "EMAIL  ↗", PULSE),
]))

# ── FOOTER ──────────────────────────────────────────────────────────────────
svg("footer.svg", 1200, 70, "X:006 · Y:EOF", "\n".join([
    t(600, 42, "// build: stable — © 2026 SHIFT-9, made in motion", 15, MUTED, "400", MONO, "2", "middle"),
]))

print("done.")
