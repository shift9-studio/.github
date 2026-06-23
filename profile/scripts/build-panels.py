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
    t(60, 196, "Brands, products, and the systems that run them — clean, optimized,", 21, MUTED, "400", SANS),
    t(60, 224, "and impossible to ignore. No filler, no fluff.", 21, MUTED, "400", SANS),
    chip(60, 250, 168, "shift9.dev  ↗", SIGNAL),
    chip(244, 250, 260, "DESIGN + ENGINEERING", PULSE),
    chip(520, 250, 132, "SHIPPING", SIGNAL),
]))

# ── LEAD line ───────────────────────────────────────────────────────────────
svg("lead.svg", 1200, 130, "X:002 · Y:SYSTEM", "\n".join([
    t(60, 58, "One design system across every surface — " + f'<tspan fill="{SIGNAL}">one theme, three faces.</tspan>', 24, INK, "700", SANS),
    t(60, 92, "Edit a token once, and the studio site, the product, and this page all move together.", 19, MUTED, "400", SANS),
]))


# ── PRODUCT ROWS (each wraps its own link, icon GIF sits to the left) ────────
def row(name, coord, title, tcolor, l1, l2):
    svg(name, 1000, 163, coord, "\n".join([
        t(40, 64, title, 30, tcolor, "800", SANS, "0.5"),
        t(40, 104, l1, 19, MUTED, "400", SANS),
        t(40, 132, l2, 19, MUTED, "400", SANS),
    ]))


row("row-pinch.svg", "Y:JUST-A-PINCH", "Just a Pinch", SIGNAL,
    "A smart recipe organizer &amp; cooking app. Keep every recipe you love in one place,",
    "then cook it — guided steps, scaled to your servings, smart swaps when you're short.")
row("row-9dev.svg", "Y:SHIFT9.DEV", "shift9.dev", SIGNAL,
    "The flagship studio site. Cyber-brutalist, kinetic, and engineered down to the",
    "dither — a live, working demo of how we build.")
row("row-instrument.svg", "Y:INSTRUMENT", "The INSTRUMENT design system", PULSE,
    "Our in-house design system — the tokens, motion springs, and signature components",
    "every Shift-9 surface inherits. One theme, three faces.")

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
    ("just-a-pinch", "— a recipe organizer + cooking app: save what you love, then cook it."),
    ("shift9.dev", "— the studio site, live and kinetic."),
    ("the design system", "— tokens, springs, and the dither field, packaged and reused."),
]
body, y = [], 62
for code, rest in ship:
    body.append(t(60, y, "▸", 20, SIGNAL, "700", MONO))
    body.append(t(92, y, code, 20, INK, "700", MONO))
    body.append(t(92 + len(code) * 12 + 14, y, rest, 19, MUTED, "400", SANS))
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
