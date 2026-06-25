#!/usr/bin/env python3
"""Build the SHIFT-9 hero banner from PHOTOGRAPHIC ray art + a crisp vector wordmark.

This is the "Higgsfield" variant of the banner. It takes a *text-free* light-ray
image (generated with Higgsfield), embeds it as a JPEG data-URI, and composites
a razor-sharp VECTOR SHIFT-9 wordmark + the INSTRUMENT frame on top — so the art
is photographic but the type stays infinitely crisp. JPEG + xlink:href are used
so it renders in every SVG renderer, and motion pauses under reduced-motion.

WHY THIS SCRIPT EXISTS / WHERE TO RUN IT
----------------------------------------
The session that scaffolded this repo runs behind an egress policy that firewalls
Higgsfield's media CDNs, so it could generate the rays but couldn't download them
to commit. Run this from a normal local environment (your machine / Claude Code
locally) where the CDN is reachable.

A text-free ray field was already generated for you. Default source:
  https://d8j0ntlcm91z4.cloudfront.net/user_3F1n9RqGZCJVrB84dvcvAMuNMRC/hf_20260625_162754_5f638848-cb3d-40e0-bdcd-ef6a6decc42d.png
(If that URL has expired, regenerate a text-free ray field and pass its path/URL.)

USAGE (from repo root)
----------------------
  pip install pillow
  python3 profile/scripts/build-banner-photo.py                 # uses the default Higgsfield URL
  python3 profile/scripts/build-banner-photo.py path/to/rays.png # use a local file or another URL

Then review profile/assets/s9-banner.svg and commit. To go back to the pure-vector
hero instead, run build-banner.py.
"""
import base64
import io
import os
import sys
import urllib.request

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

HERE = os.path.dirname(__file__)
OUT = os.path.normpath(os.path.join(HERE, "..", "assets", "s9-banner.svg"))

DEFAULT_SRC = ("https://d8j0ntlcm91z4.cloudfront.net/user_3F1n9RqGZCJVrB84dvcvAMuNMRC/"
               "hf_20260625_162754_5f638848-cb3d-40e0-bdcd-ef6a6decc42d.png")

SIGNAL, PULSE, MUTED = "#22d3ee", "#8b5cf6", "#9aa7b8"
MONO = "ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace"
COND = "'Arial Narrow','Roboto Condensed','Helvetica Neue Condensed',Impact,sans-serif"
TARGET_W = 2048          # retina width for GitHub's ~1012px column
JPEG_Q = 86


def load(src):
    if src.startswith(("http://", "https://")):
        print(f"  downloading {src[:72]}...")
        with urllib.request.urlopen(src) as r:
            return Image.open(io.BytesIO(r.read())).convert("RGB")
    return Image.open(src).convert("RGB")


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    img = load(src)
    w, h = img.size
    th = round(TARGET_W * h / w)
    img = img.resize((TARGET_W, th), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=JPEG_Q, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    # viewBox keeps overlay coords readable; height tracks the source aspect ratio
    VW = 1280
    VH = round(VW * th / TARGET_W)
    # wordmark sits in the darker left half; nudge with these if your art differs
    wm_y = round(VH * 0.618)
    sub_y = wm_y + 46

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {VW} {VH}" width="100%" role="img" aria-label="SHIFT-9 — Design + Engineering Studio. Code execution in motion.">
  <defs>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#aab8cc"/></linearGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{SIGNAL}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="{SIGNAL}" stop-opacity="0.8"/>
      <stop offset="1" stop-color="{PULSE}" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
    <clipPath id="frame"><rect x="0" y="0" width="{VW}" height="{VH}"/></clipPath>
    <style>
      @keyframes scan {{ 0%{{transform:translateX(-260px)}} 100%{{transform:translateX({VW}px)}} }}
      @keyframes flick {{ 0%,100%{{opacity:.5}} 50%{{opacity:.95}} }}
      .scan{{animation:scan 6s linear infinite}} .flick{{animation:flick 3s ease-in-out infinite}}
      @media (prefers-reduced-motion: reduce){{ .scan{{animation:none;opacity:0}} .flick{{animation:none;opacity:.7}} }}
    </style>
  </defs>
  <g clip-path="url(#frame)">
    <image xlink:href="data:image/jpeg;base64,{b64}" x="0" y="0" width="{VW}" height="{VH}" preserveAspectRatio="xMidYMid slice"/>
    <g transform="translate(74 {wm_y}) scale(0.84 1)">
      <text x="0" y="0" font-family="{COND}" font-weight="800" font-size="176" letter-spacing="-3" fill="{SIGNAL}" opacity="0.35" filter="url(#glow)">SHIFT-9</text>
      <text x="0" y="0" font-family="{COND}" font-weight="800" font-size="176" letter-spacing="-3" fill="url(#ink)">SHIFT<tspan fill="{SIGNAL}">-9</tspan></text>
    </g>
    <text x="78" y="{sub_y}" fill="{MUTED}" font-family="{MONO}" font-size="20" letter-spacing="8" class="flick">CODE EXECUTION IN MOTION</text>
    <rect class="scan" x="0" y="0" width="260" height="{VH}" fill="url(#sweep)" opacity="0.3"/>
    <rect x="6" y="6" width="{VW-12}" height="{VH-12}" fill="none" stroke="{SIGNAL}" stroke-opacity="0.20" stroke-width="1.5"/>
    <g stroke="{SIGNAL}" stroke-width="2.5" fill="none" opacity="0.9">
      <path d="M6 34V6H34"/><path d="M{VW-34} 6H{VW-6}V34"/>
      <path d="M6 {VH-34}V{VH-6}H34"/><path d="M{VW-6} {VH-34}V{VH-6}H{VW-34}"/>
    </g>
    <text x="40" y="36" fill="{MUTED}" font-family="{MONO}" font-size="15" letter-spacing="5" class="flick">SHIFT-9 // INSTRUMENT</text>
    <text x="{VW-40}" y="{VH-22}" fill="{MUTED}" font-family="{MONO}" font-size="15" letter-spacing="5" text-anchor="end">X:001 · Y:STUDIO</text>
  </g>
</svg>
'''
    with open(OUT, "w") as f:
        f.write(svg)
    print(f"  assets/s9-banner.svg  ({VW}x{VH}, {len(svg)//1024} KB, photographic rays + vector wordmark)")


if __name__ == "__main__":
    main()
