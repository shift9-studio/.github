#!/usr/bin/env python3
"""Generate the favicons for both apps.

    python3 shift9/scripts/build-icons.py

Writes, and owns, these files — do not hand-edit them:

    apps/shift9-dev/app/icon.svg  ·  favicon.ico  ·  apple-icon.png
    apps/just-a-pinch/app/icon.svg  ·  favicon.ico  ·  apple-icon.png

Next's App Router picks these up by filename and serves them at /icon.svg,
/favicon.ico and /apple-icon.png. Nothing imports them.

── The studio mark, and why it is redrawn here ───────────────────────────
`Shift9Mark.tsx` cuts the 9 with a 3-unit gap on a 90-unit glyph and drops
the right half 6 units. In the header that is right. In a browser tab the
glyph is about 7px wide, so the gap lands at 0.24px and disappears — the
mark reads as an ordinary 9, the one thing it is not.

The fix is a small optical-size bump, not a redesign. Widening the gap far
enough to "read" at 16px was tried and rejected: past about 10 units the
cut separates the counter from the tail, and the two halves stop being a
numeral and start being two crescents. Gap 9 / shift 7 is the most the
letter takes while staying a 9 — checked by rendering 16, 32 and 180 side
by side rather than by reasoning about it.

── Just a Pinch ──────────────────────────────────────────────────────────
A P, not an illustration. A pinch of grains was drawn first and read as a
question mark at 16px; at that size a letterform is the only thing that
survives. The outline is Gloock (SIL Open Font License 1.1) — a high-
contrast antiqua in the same genre as Fraunces, which is Pinch's display
face — baked in below as a path so neither this script nor the repo needs
the font file. It carries none of the studio's chrome, which is the point.

── Colour ────────────────────────────────────────────────────────────────
These are image files, not components, so token *values* are baked rather
than referenced. Copied from packages/theme/tokens.css and from Pinch's
own globals.css override; update here if the palette moves:

    studio  ground --s9-void  #0f172a   mark --s9-ink  #e2e8f0
    pinch   ground (saffron)  #f5a524   mark (espresso) #1b1410

The grounds differ on purpose: one near-black plate, one warm — so the two
tabs are told apart at a glance.
"""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
STUDIO = ROOT / "apps" / "shift9-dev" / "app"
PINCH = ROOT / "apps" / "just-a-pinch" / "app"

VOID = "#0f172a"
INK = "#e2e8f0"
SAFFRON = "#f5a524"
ESPRESSO = "#1b1410"

# Supersample factor. PIL has no antialiased polygon fill, so every shape is
# drawn this many times oversize and box-filtered down; without it the tail's
# diagonal and the P's bowl both step.
SS = 16

ICO_SIZES = [16, 32, 48, 64]
APPLE = 180
RADIUS = 0.22  # corner radius as a fraction of the tile

# ── The 9, in glyph units — lifted verbatim from Shift9Mark.tsx ──────────
W, H = 90.0, 124.0
R = W / 2
BOWL_CY = 0.355 * H
COUNTER_R = 0.189 * W
COUNTER_CY = 0.336 * H
RUN = ((0.44 - 0.22) * W) / ((0.97 - 0.71) * H)
TAIL_W = 0.34 * W
TAIL_TOP = 0.45 * H
CUT = 45.0

# The optical-size overrides (header uses 3 / 6). See the note above.
ICON_GAP = 9.0
ICON_SHIFT = 7.0

FILL = 0.76        # how much of the tile the glyph spans
RIGHT_ALPHA = 0.62  # value the dropped half carries (0.58 in the header)


def _tail_x(y: float) -> float:
    return 0.44 * W - (y - 0.71 * H) * RUN


TAIL = [
    (_tail_x(TAIL_TOP), TAIL_TOP),
    (_tail_x(TAIL_TOP) + TAIL_W, TAIL_TOP),
    (_tail_x(H) + TAIL_W, H),
    (_tail_x(H), H),
]

# ── Gloock "P", extracted with fontTools and frozen here ─────────────────
# Font units, y-up, 1000 upem, advance 608, bbox 0 0 591 750. Two contours:
# the outer shape and the bowl's counter.
P_PATH = (
    "M0 0V10Q36 10 58.0 32.0Q80 54 80 90V660Q80 696 58.0 718.0Q36 740 0 740"
    "V750H334Q411 749 468.5 723.5Q526 698 558.5 653.0Q591 608 591 547"
    "Q591 486 558.5 440.5Q526 395 466.5 369.5Q407 344 326 344H234V90"
    "Q234 54 256.0 32.0Q278 10 314 10H316V0ZM234 357H293Q336 357 367.5 381.5"
    "Q399 406 416.5 449.0Q434 492 434 547Q434 602 416.5 645.0Q399 688 367.0 712.5"
    "Q335 737 292 737H234Z"
)
P_W, P_H = 591.0, 750.0
P_FILL = 0.62  # the P spans this much of the tile's height

_TOK = re.compile(r"([MLHVQZ])|(-?\d+(?:\.\d+)?)")


def _flatten(d: str, steps: int = 24) -> list[list[tuple[float, float]]]:
    """Absolute M/L/H/V/Q/Z path -> closed point lists, quadratics sampled."""
    out: list[list[tuple[float, float]]] = []
    cur: list[tuple[float, float]] = []
    x = y = sx = sy = 0.0
    toks = [(m.group(1), m.group(2)) for m in _TOK.finditer(d)]
    i, cmd = 0, ""
    while i < len(toks):
        c, _ = toks[i]
        if c:
            cmd, i = c, i + 1
            if cmd == "Z":
                if cur:
                    out.append(cur)
                cur, x, y = [], sx, sy
            continue

        def num() -> float:
            nonlocal i
            v = float(toks[i][1])
            i += 1
            return v

        if cmd == "M":
            x, y = num(), num()
            sx, sy = x, y
            if cur:
                out.append(cur)
            cur = [(x, y)]
        elif cmd == "L":
            x, y = num(), num()
            cur.append((x, y))
        elif cmd == "H":
            x = num()
            cur.append((x, y))
        elif cmd == "V":
            y = num()
            cur.append((x, y))
        elif cmd == "Q":
            cx, cy, nx, ny = num(), num(), num(), num()
            for k in range(1, steps + 1):
                t = k / steps
                u = 1 - t
                cur.append(
                    (
                        u * u * x + 2 * u * t * cx + t * t * nx,
                        u * u * y + 2 * u * t * cy + t * t * ny,
                    )
                )
            x, y = nx, ny
    if cur:
        out.append(cur)
    return out


def _plate(px: int, colour: str, radius: float) -> Image.Image:
    """The ground. `radius` 0 gives a full-bleed square.

    Apple touch icons must be square and opaque: iOS applies its own
    superellipse mask, and handing it a pre-rounded tile double-rounds and
    leaves the corner fill showing through as dark notches.
    """
    tile = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    if radius <= 0:
        return Image.new("RGBA", (px, px), colour)
    ImageDraw.Draw(tile).rounded_rectangle(
        [0, 0, px - 1, px - 1], radius=int(px * radius), fill=colour
    )
    return tile


def _nine_mask(px: int, gap: float, shift: float, alpha: float) -> Image.Image:
    """The mark as an L-mode mask: 255 on the held half, alpha on the dropped."""
    box_h = H + shift
    scale = (px * FILL) / box_h
    off_x = (px - W * scale) / 2
    off_y = (px - box_h * scale) / 2

    def to_px(x: float, y: float) -> tuple[float, float]:
        return (off_x + x * scale, off_y + y * scale)

    def half(dy: float, value: int, x0: float, x1: float) -> Image.Image:
        layer = Image.new("L", (px, px), 0)
        d = ImageDraw.Draw(layer)
        cx, cy = to_px(R, BOWL_CY + dy)
        rr = R * scale
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=value)
        ccx, ccy = to_px(R, COUNTER_CY + dy)
        cr = COUNTER_R * scale
        d.ellipse([ccx - cr, ccy - cr, ccx + cr, ccy + cr], fill=0)
        # The tail overlaps the bowl. Drawn on its own layer and composited so
        # the overlap does not double up and cut a seam that is not designed.
        tail = Image.new("L", (px, px), 0)
        ImageDraw.Draw(tail).polygon([to_px(x, y + dy) for x, y in TAIL], fill=value)
        layer = Image.composite(tail, layer, tail.point(lambda v: 255 if v else 0))
        clip = Image.new("L", (px, px), 0)
        ImageDraw.Draw(clip).rectangle([to_px(x0, 0)[0], 0, to_px(x1, 0)[0], px], fill=255)
        return Image.composite(layer, Image.new("L", (px, px), 0), clip)

    left = half(0.0, 255, 0.0, CUT - gap / 2)
    right = half(shift, int(round(255 * alpha)), CUT + gap / 2, W)
    return Image.composite(right, left, right.point(lambda v: 255 if v else 0))


def studio_tile(px: int, radius: float = RADIUS) -> Image.Image:
    big = px * SS
    tile = _plate(big, VOID, radius)
    # The mask carries the tonal value directly, so pasting through it is what
    # makes the cut read as depth rather than as two separate shapes.
    tile.paste(Image.new("RGBA", (big, big), INK), (0, 0), _nine_mask(big, ICON_GAP, ICON_SHIFT, RIGHT_ALPHA))
    return tile.resize((px, px), Image.LANCZOS)


def pinch_tile(px: int, radius: float = RADIUS) -> Image.Image:
    big = px * SS
    tile = _plate(big, SAFFRON, radius)
    d = ImageDraw.Draw(tile)
    scale = (big * P_FILL) / P_H
    ox = (big - P_W * scale) / 2
    oy = (big - P_H * scale) / 2
    for n, contour in enumerate(_flatten(P_PATH)):
        # font units are y-up; flip into image space
        pts = [(ox + x * scale, oy + (P_H - y) * scale) for x, y in contour]
        d.polygon(pts, fill=ESPRESSO if n == 0 else SAFFRON)
    return tile.resize((px, px), Image.LANCZOS)


def studio_svg() -> str:
    box_h = H + ICON_SHIFT
    ring = (
        f"M{R} 0a{R} {R} 0 100 {2 * R}a{R} {R} 0 100-{2 * R}Z"
        f"M{R} {COUNTER_CY - COUNTER_R:.3f}"
        f"a{COUNTER_R:.3f} {COUNTER_R:.3f} 0 110 {2 * COUNTER_R:.3f}"
        f"a{COUNTER_R:.3f} {COUNTER_R:.3f} 0 110-{2 * COUNTER_R:.3f}Z"
    )
    tail = " ".join(f"{x:.3f},{y:.3f}" for x, y in TAIL)
    half = f'<path d="{ring}" fill-rule="evenodd"/><polygon points="{tail}"/>'
    scale = FILL / box_h
    tx = (1 - W * scale) / 2 * 100
    ty = (1 - box_h * scale) / 2 * 100
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Generated by shift9/scripts/build-icons.py — do not hand-edit. -->
  <rect width="100" height="100" rx="{RADIUS * 100:.0f}" fill="{VOID}"/>
  <g transform="translate({tx:.3f},{ty:.3f}) scale({scale * 100:.5f})" fill="{INK}">
    <defs>
      <clipPath id="s9l"><rect x="0" y="0" width="{CUT - ICON_GAP / 2}" height="{box_h}"/></clipPath>
      <clipPath id="s9r"><rect x="{CUT + ICON_GAP / 2}" y="0" width="{W - CUT - ICON_GAP / 2}" height="{box_h}"/></clipPath>
    </defs>
    <g clip-path="url(#s9l)">{half}</g>
    <g clip-path="url(#s9r)" opacity="{RIGHT_ALPHA}" transform="translate(0,{ICON_SHIFT})">{half}</g>
  </g>
</svg>
"""


def pinch_svg() -> str:
    scale = P_FILL / P_H * 100
    tx = (100 - P_W * scale) / 2
    ty = (100 - P_H * scale) / 2
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Generated by shift9/scripts/build-icons.py — do not hand-edit.
       Letterform: Gloock, SIL Open Font License 1.1. -->
  <rect width="100" height="100" rx="{RADIUS * 100:.0f}" fill="{SAFFRON}"/>
  <g transform="translate({tx:.3f},{ty + P_H * scale:.3f}) scale({scale:.5f},-{scale:.5f})">
    <path d="{P_PATH}" fill="{ESPRESSO}" fill-rule="evenodd"/>
  </g>
</svg>
"""


def write(app: Path, tile, svg: str) -> None:
    app.mkdir(parents=True, exist_ok=True)
    (app / "icon.svg").write_text(svg, encoding="utf-8")
    tile(APPLE, 0.0).convert("RGB").save(app / "apple-icon.png", "PNG", optimize=True)
    frames = [tile(n) for n in ICO_SIZES]
    frames[-1].save(
        app / "favicon.ico",
        format="ICO",
        sizes=[(n, n) for n in ICO_SIZES],
        append_images=frames[:-1],
    )
    print(f"  {app.relative_to(ROOT)}: icon.svg, favicon.ico {ICO_SIZES}, apple-icon.png")


if __name__ == "__main__":
    print("building icons")
    write(STUDIO, studio_tile, studio_svg())
    write(PINCH, pinch_tile, pinch_svg())
    print("done")
