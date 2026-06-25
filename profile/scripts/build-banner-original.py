#!/usr/bin/env python3
"""Build the SHIFT-9 hero from the ORIGINAL banner art — sharp, animated, light.

This is the live banner. It takes the original animated-GIF banner's look
(flowing light streaks + the SHIFT-9 wordmark + "CODE EXECUTION IN MOTION") and
makes it sharp by using the high-resolution still (s9-banner-still.jpg, the only
native hi-res frame of that art — the moving streaks only ever existed at 800px,
so they can't be upscaled to true sharpness) and re-introducing motion in vector:
light-flow bands that sweep along the streaks plus a slow drift. Wordmark and
streaks stay crisp, the file is ~165 KB (vs the 7.7 MB GIF), and all motion pauses
under prefers-reduced-motion.

Pure stdlib — the source still is already an optimized JPEG, so this just
base64-embeds it into the SVG. No Pillow, no network.

Usage (from repo root):  python3 profile/scripts/build-banner-original.py
"""
import base64
import os

HERE = os.path.dirname(__file__)
STILL = os.path.normpath(os.path.join(HERE, "..", "assets", "s9-banner-still.jpg"))
OUT = os.path.normpath(os.path.join(HERE, "..", "assets", "s9-banner.svg"))

W, H = 1376, 768   # native size of s9-banner-still.jpg

# light-flow bands: (y, height, width, dur, delay, opacity, blur-stdDev)
BANDS = [(-120, H + 240, 340, 7.5, 0.0, 0.50, 20),
         (120, 480, 220, 5.5, -2.5, 0.42, 14),
         (-60, 520, 160, 9.0, -5.0, 0.36, 11)]


def main():
    with open(STILL, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")

    blurs = "".join(
        f'<filter id="b{i}" x="-40%" y="-40%" width="180%" height="180%">'
        f'<feGaussianBlur stdDeviation="{s}"/></filter>'
        for i, (_, _, _, _, _, _, s) in enumerate(BANDS))
    bands = "".join(
        f'<rect class="flow" style="animation-duration:{dur}s;animation-delay:{delay}s" '
        f'x="0" y="{y}" width="{w}" height="{h}" fill="url(#flow)" filter="url(#b{i})" opacity="{op}"/>'
        for i, (y, h, w, dur, delay, op, _) in enumerate(BANDS))

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="SHIFT-9 — Design + Engineering Studio. Code execution in motion.">
  <defs>
    <linearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#e6fbff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    {blurs}
    <clipPath id="cp"><rect x="0" y="0" width="{W}" height="{H}"/></clipPath>
    <style>
      @keyframes flow {{ 0%{{transform:translateX(140%) skewX(-20deg)}} 100%{{transform:translateX(-50%) skewX(-20deg)}} }}
      @keyframes drift {{ 0%,100%{{transform:scale(1.0)}} 50%{{transform:scale(1.025)}} }}
      .flow{{animation-name:flow;animation-timing-function:ease-in-out;animation-iteration-count:infinite}}
      .drift{{transform-origin:64% 46%;animation:drift 18s ease-in-out infinite}}
      @media (prefers-reduced-motion: reduce){{ .drift,.flow{{animation:none}} .flow{{opacity:0}} }}
    </style>
  </defs>
  <g clip-path="url(#cp)">
    <image class="drift" xlink:href="data:image/jpeg;base64,{b64}" x="0" y="0" width="{W}" height="{H}" preserveAspectRatio="xMidYMid slice"/>
    <g clip-path="url(#cp)">{bands}</g>
  </g>
</svg>
'''
    with open(OUT, "w") as f:
        f.write(svg)
    print(f"  assets/s9-banner.svg  ({W}x{H}, {len(svg)//1024} KB, original art + vector motion)")


if __name__ == "__main__":
    main()
