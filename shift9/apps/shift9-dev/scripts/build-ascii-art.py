#!/usr/bin/env python3
"""
Derive the ASCII wallpaper data from the REAL Shift-9 brand art.

Sources (never a lookalike, always the shipped artwork):
    profile/assets/s9-banner-still.jpg   -> the wallpaper field
    profile/assets/s9-icon.png           -> the mark that blooms in the centre

Output:
    shift9/apps/shift9-dev/app/_components/ascii-art-data.ts

What gets baked out, per source:
    grid      one string per row, ASCII ramp indexed by perceptual luminance
    flow      per-cell direction of the luminance gradient, quantised to 0-15.
              This is what makes the wallpaper *move along the real streaks*
              instead of shimmering at random.
    tone      per-cell index into the palette, chosen by nearest colour
    palette   16 colours quantised out of the source image itself

Run from the repo root:
    python3 shift9/apps/shift9-dev/scripts/build-ascii-art.py
"""

from __future__ import annotations

import math
import pathlib
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover - developer ergonomics only
    sys.exit("Pillow is required:  pip install Pillow")

ROOT = pathlib.Path(__file__).resolve().parents[4]
BANNER = ROOT / "profile" / "assets" / "s9-banner-still.jpg"
ICON = ROOT / "profile" / "assets" / "s9-icon.png"
OUT = pathlib.Path(__file__).resolve().parents[1] / "app" / "_components" / "ascii-art-data.ts"

# Monospace cells are about twice as tall as they are wide, so the sample grid
# has to be squashed vertically or the art comes out stretched.
CELL_ASPECT = 0.5

BANNER_COLS, BANNER_ROWS = 170, 57
ICON_COLS, ICON_ROWS = 48, 24

# Dark -> light. Index 0 is empty space; the ramp is deliberately sparse at the
# bottom so the black field of the banner reads as black, not as noise.
RAMP = " .:-=+*#%@"

PALETTE_SIZE = 16

# Luminance below this is treated as pure black — empty cell, no glyph.
BLACK_FLOOR = 0.30


def luminance(px: tuple[int, int, int]) -> float:
    """Perceptual luminance, 0..1, on sRGB values."""
    r, g, b = (c / 255.0 for c in px)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def sample(
    path: pathlib.Path, cols: int, rows: int, mode: str = "cover"
) -> tuple[Image.Image, list[list[float]]]:
    """Resize to the character grid and return the image plus a luminance map.

    `cover` bleeds the art to every edge (right for a wallpaper); `fit` keeps
    the whole source visible and letterboxes the remainder (right for a mark).
    Both correct for the non-square monospace cell.
    """
    src = Image.open(path).convert("RGB")
    w, h = src.size
    src_aspect = (w / h) * CELL_ASPECT  # aspect measured in character cells
    grid_aspect = cols / rows

    if mode == "cover":
        # Crop the source to the grid's aspect, then fill edge to edge.
        if src_aspect > grid_aspect:
            keep_w = int(round(h * grid_aspect / CELL_ASPECT))
            box = ((w - keep_w) // 2, 0, (w - keep_w) // 2 + keep_w, h)
        else:
            keep_h = int(round(w * CELL_ASPECT / grid_aspect))
            box = (0, (h - keep_h) // 2, w, (h - keep_h) // 2 + keep_h)
        field = src.resize((cols, rows), Image.Resampling.LANCZOS, box=box)
    else:
        target_h = max(1, min(rows, int(round(cols * (h / w) * CELL_ASPECT))))
        target_w = max(1, int(round(target_h / ((h / w) * CELL_ASPECT))))
        small = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
        field = Image.new("RGB", (cols, rows), (0, 0, 0))
        field.paste(small, ((cols - target_w) // 2, (rows - target_h) // 2))

    px = field.load()
    lum = [[luminance(px[x, y]) for x in range(cols)] for y in range(rows)]
    return field, lum


def build_palette(img: Image.Image) -> list[str]:
    """Quantise the source itself down to PALETTE_SIZE hex colours."""
    q = img.quantize(colors=PALETTE_SIZE, method=Image.Quantize.MEDIANCUT)
    raw = q.getpalette() or []
    colours = [tuple(raw[i * 3 : i * 3 + 3]) for i in range(PALETTE_SIZE)]
    # Sort dark -> light so index order is meaningful to the renderer.
    colours.sort(key=luminance)
    return ["#%02x%02x%02x" % c for c in colours]


def nearest(colour: tuple[int, int, int], palette: list[str]) -> int:
    best, best_d = 0, float("inf")
    for i, hexs in enumerate(palette):
        pr, pg, pb = (int(hexs[j : j + 2], 16) for j in (1, 3, 5))
        d = (colour[0] - pr) ** 2 + (colour[1] - pg) ** 2 + (colour[2] - pb) ** 2
        if d < best_d:
            best, best_d = i, d
    return best


def encode(path: pathlib.Path, cols: int, rows: int, mode: str = "cover") -> dict:
    field, lum = sample(path, cols, rows, mode)
    palette = build_palette(field)
    px = field.load()

    grid, flow, tone = [], [], []
    for y in range(rows):
        row_chars, row_flow, row_tone = [], [], []
        for x in range(cols):
            # Character from luminance. BLACK_FLOOR is what makes the wordmark
            # readable: the banner's background and the gaps between letters are
            # near-black, and without a hard floor their anti-aliased edges creep
            # up the ramp and fill the negative space in, turning the letterforms
            # into one solid block.
            v = (lum[y][x] - BLACK_FLOOR) / (1.0 - BLACK_FLOOR)
            v = 0.0 if v <= 0 else v**0.78
            row_chars.append(RAMP[min(len(RAMP) - 1, int(v * len(RAMP)))])

            # Sobel-ish gradient -> the direction light travels through this cell.
            xm, xp = max(0, x - 1), min(cols - 1, x + 1)
            ym, yp = max(0, y - 1), min(rows - 1, y + 1)
            gx = lum[y][xp] - lum[y][xm]
            gy = lum[yp][x] - lum[ym][x]
            angle = math.atan2(gy, gx)  # -pi..pi
            row_flow.append(int(((angle + math.pi) / (2 * math.pi)) * 15) % 16)

            row_tone.append(nearest(px[x, y], palette))

        grid.append("".join(row_chars))
        flow.append("".join(f"{v:x}" for v in row_flow))
        tone.append("".join(f"{v:x}" for v in row_tone))

    return {"cols": cols, "rows": rows, "palette": palette, "grid": grid, "flow": flow, "tone": tone}


def ts_block(name: str, data: dict) -> str:
    def arr(key: str) -> str:
        return "\n".join(f'    "{row}",' for row in data[key])

    palette = ", ".join(f'"{c}"' for c in data["palette"])
    return (
        f"export const {name}: AsciiSource = {{\n"
        f"  cols: {data['cols']},\n"
        f"  rows: {data['rows']},\n"
        f"  palette: [{palette}],\n"
        f"  grid: [\n{arr('grid')}\n  ],\n"
        f"  flow: [\n{arr('flow')}\n  ],\n"
        f"  tone: [\n{arr('tone')}\n  ],\n"
        f"}};\n"
    )


def main() -> None:
    for p in (BANNER, ICON):
        if not p.exists():
            sys.exit(f"missing source art: {p}")

    banner = encode(BANNER, BANNER_COLS, BANNER_ROWS)
    icon = encode(ICON, ICON_COLS, ICON_ROWS, mode="fit")

    header = (
        "/* GENERATED FILE — DO NOT EDIT BY HAND.\n"
        "   Produced by shift9/apps/shift9-dev/scripts/build-ascii-art.py from the\n"
        "   real brand art: profile/assets/s9-banner-still.jpg and s9-icon.png.\n"
        "   Regenerate with:\n"
        "     python3 shift9/apps/shift9-dev/scripts/build-ascii-art.py\n\n"
        "   grid    ASCII ramp indexed by perceptual luminance\n"
        "   flow    luminance-gradient direction per cell, 0-f — drives the sweep\n"
        "   tone    palette index per cell\n"
        "   palette 16 colours quantised out of the source image itself */\n\n"
        "export type AsciiSource = {\n"
        "  readonly cols: number;\n"
        "  readonly rows: number;\n"
        "  readonly palette: readonly string[];\n"
        "  readonly grid: readonly string[];\n"
        "  readonly flow: readonly string[];\n"
        "  readonly tone: readonly string[];\n"
        "};\n\n"
        f'export const ASCII_RAMP = "{RAMP}";\n\n'
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(header + ts_block("BANNER_ASCII", banner) + "\n" + ts_block("ICON_ASCII", icon), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}  banner {banner['cols']}x{banner['rows']}  icon {icon['cols']}x{icon['rows']}")


if __name__ == "__main__":
    main()
