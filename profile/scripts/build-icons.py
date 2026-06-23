#!/usr/bin/env python3
"""Build animated icon SVGs for the GitHub org profile.

Each product PNG in ../assets is downscaled and embedded (as a base64 data URI)
inside an SVG wrapper that adds a gentle float + accent-glow pulse. The PNG is
embedded — not referenced — because GitHub renders README images in a sandbox
that blocks external resources inside an <img>-loaded SVG, but allows data URIs
and SMIL/CSS animation.

Usage:
    pip install Pillow
    python3 profile/scripts/build-icons.py     # run from the repo root

Edit ICONS below to add/rename products or change accent colors, then re-run.
"""
import base64
import io
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, "..", "assets"))

# (source png, output svg, accent color, aria label)
ICONS = [
    ("shift9_pinch_icon.png", "icon-pinch.svg", "#f5a524", "Just a Pinch app icon"),
    ("shift9_9dev_icon.png", "icon-9dev.svg", "#22d3ee", "shift9.dev studio icon"),
    ("shift9_instrument_icon.png", "icon-instrument.svg", "#8b5cf6", "INSTRUMENT design system icon"),
]

SIZE = 192  # retina source for a 96px display

SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" width="96" height="96" role="img" aria-label="{label}">
  <defs>
    <clipPath id="clip"><rect x="8" y="8" width="96" height="96" rx="20"/></clipPath>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      @keyframes float {{ 0%,100%{{transform:translateY(0)}} 50%{{transform:translateY(-4px)}} }}
      @keyframes pulse {{ 0%,100%{{opacity:.22}} 50%{{opacity:.6}} }}
      .ic   {{ animation: float 4.4s ease-in-out infinite; }}
      .halo {{ animation: pulse 3.6s ease-in-out infinite; }}
      @media (prefers-reduced-motion: reduce) {{
        .ic, .halo {{ animation: none; }}
        .halo {{ opacity:.35; }}
      }}
    </style>
  </defs>
  <g class="ic">
    <rect class="halo" x="8" y="8" width="96" height="96" rx="20" fill="{accent}" filter="url(#glow)" opacity=".3"/>
    <image x="8" y="8" width="96" height="96" clip-path="url(#clip)"
      href="data:image/png;base64,{b64}"/>
    <rect x="8" y="8" width="96" height="96" rx="20" fill="none" stroke="{accent}" stroke-opacity=".55" stroke-width="1.5"/>
  </g>
</svg>
'''


def main() -> None:
    for src, out, accent, label in ICONS:
        im = Image.open(os.path.join(ASSETS, src)).convert("RGB")
        im = im.resize((SIZE, SIZE), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, format="PNG", optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode()
        with open(os.path.join(ASSETS, out), "w") as f:
            f.write(SVG.format(label=label, accent=accent, b64=b64))
        print(f"{out:24s}  {len(b64) // 1024} KB base64")


if __name__ == "__main__":
    main()
