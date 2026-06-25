#!/usr/bin/env python3
"""Build the self-contained animated SVG hero banner for the GitHub org profile.

The crisp, upscaled ray art (``s9-banner.jpg``, 2048px wide) is embedded as a
base64 data-URI so the SVG is one portable file. A light vector overlay — outer
frame, corner registration ticks, mono axis labels, and a single sweeping
scan-line — is drawn on top to match the INSTRUMENT system used by the panels.
All motion is paused under ``prefers-reduced-motion``.

JPEG (not WebP) is embedded on purpose: WebP-in-SVG fails in non-browser
renderers (librsvg, link-unfurlers, GitHub mobile previews), whereas JPEG/PNG
render everywhere. ``xlink:href`` is used for the same broad-compatibility
reason. This replaces the old 7.7 MB / 800px animated GIF with a ~340 KB
animated SVG that renders crisply at retina widths.

Usage:  python3 profile/scripts/build-banner.py    # run from repo root
"""
import base64
import os

HERE = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(HERE, "..", "assets"))
RASTER = os.path.join(ASSETS, "s9-banner.jpg")
OUT = os.path.join(ASSETS, "s9-banner.svg")

# palette (shared with build-panels.py / the design tokens)
SIGNAL, PULSE, MUTED = "#22d3ee", "#8b5cf6", "#9aa7b8"

# viewBox: 1280 wide keeps overlay coordinates readable; height tracks the
# raster's 1376x768 -> 2048x1143 aspect ratio (1280 * 1143 / 2048 ~= 714).
W, H = 1280, 714
MONO = "ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace"

with open(RASTER, "rb") as f:
    b64 = base64.b64encode(f.read()).decode("ascii")

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="SHIFT-9 — Design + Engineering Studio. Code execution in motion.">
  <defs>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{SIGNAL}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="{SIGNAL}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="{PULSE}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="frame"><rect x="0" y="0" width="{W}" height="{H}"/></clipPath>
    <style>
      @keyframes scan {{ 0%{{transform:translateX(-240px)}} 100%{{transform:translateX({W}px)}} }}
      @keyframes flick {{ 0%,100%{{opacity:.45}} 50%{{opacity:.9}} }}
      .scan {{ animation: scan 6s linear infinite; }}
      .flick {{ animation: flick 3s ease-in-out infinite; }}
      @media (prefers-reduced-motion: reduce) {{
        .scan {{ animation: none; opacity: 0; }}
        .flick {{ animation: none; opacity: .7; }}
      }}
    </style>
  </defs>
  <g clip-path="url(#frame)">
    <image xlink:href="data:image/jpeg;base64,{b64}" x="0" y="0" width="{W}" height="{H}" preserveAspectRatio="xMidYMid slice"/>
    <rect class="scan" x="0" y="0" width="240" height="{H}" fill="url(#sweep)" opacity="0.4"/>
    <rect x="6" y="6" width="{W-12}" height="{H-12}" fill="none" stroke="{SIGNAL}" stroke-opacity="0.22" stroke-width="1.5"/>
    <g stroke="{SIGNAL}" stroke-width="2.5" fill="none" opacity="0.9">
      <path d="M6 34V6H34"/>
      <path d="M{W-34} 6H{W-6}V34"/>
      <path d="M6 {H-34}V{H-6}H34"/>
      <path d="M{W-6} {H-34}V{H-6}H{W-34}"/>
    </g>
    <text x="40" y="36" fill="{MUTED}" font-family="{MONO}" font-size="15" letter-spacing="5" class="flick">SHIFT-9 // INSTRUMENT</text>
    <text x="{W-40}" y="{H-22}" fill="{MUTED}" font-family="{MONO}" font-size="15" letter-spacing="5" text-anchor="end">X:001 · Y:STUDIO</text>
  </g>
</svg>
'''

with open(OUT, "w") as f:
    f.write(svg)

kb = os.path.getsize(OUT) / 1024
print(f"  assets/s9-banner.svg  ({W}x{H}, {kb:.0f} KB, embeds s9-banner.jpg)")
