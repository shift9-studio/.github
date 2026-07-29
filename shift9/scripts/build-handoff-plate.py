#!/usr/bin/env python3
"""Cut the still that the opening film hands the 3D desk scene over on.

The film's second beat (`04-desk-mouse-screen-v5.mp4`, 10.04s at 24fps) is a
locked-off shot of the desk. At 8.5s a crocheted hand enters from the right and
reaches for the mouse. The site stops playback just before that — at
`HANDOFF_AT` — and the 3D room takes over from the frame underneath.

So the room's backdrop has to BE that frame. This script cuts it.

`PLATE_AT` below has a runtime twin: `PLATE_AT_S` in
`app/_components/desk3d/scene.ts`, which is where playback is rewound to once
it stops, so the frame the film leaves on screen is exactly the frame this
script cut. They must stay equal — change one, change the other. (`HANDOFF_AT_S`
beside it is the stop time, 50ms later; stopping is not frame-exact, which is
the whole reason the rewind exists.)

Measured, not assumed (`mean |diff|` against the 8.40s frame, 0-255 per
channel):

    8.45s   1.37   — the same frame; 102 pixels of JPEG noise
    8.50s   2.29   — 6,237 changed pixels in the lower right: the hand

The video file itself is approved and locked. This only reads it.

    python3 scripts/build-handoff-plate.py

Needs `imageio-ffmpeg` and `pillow` (pip install imageio-ffmpeg pillow). Both
are build-time only — nothing at runtime depends on them.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OPENING = ROOT / "apps/shift9-dev/public/experience/opening"
SOURCE = OPENING / "04-desk-mouse-screen-v5.mp4"
PLATE = OPENING / "04-desk-handoff-plate.jpg"

# The last frame with no hand in it. Playback stops 50ms later, on the frame
# that is this one to within JPEG noise, so the cut from film to plate has
# nothing to show.
PLATE_AT = 8.40

# Quality: the plate is a photographic frame that fills the viewport, so it is
# the largest paint on the page — the same reason `01-exterior-approach-poster`
# is a JPEG and not the lossless source. 82 holds the monitor's bezel edges
# (which the composited screen has to line up against) without the file getting
# silly.
QUALITY = 82


def main() -> int:
    try:
        import imageio_ffmpeg
        from PIL import Image
    except ImportError as exc:  # pragma: no cover - operator feedback only
        print(f"missing build dependency: {exc}", file=sys.stderr)
        print("pip install imageio-ffmpeg pillow", file=sys.stderr)
        return 1

    if not SOURCE.exists():
        print(f"source film not found: {SOURCE}", file=sys.stderr)
        return 1

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "frame.png"
        subprocess.run(
            [
                ffmpeg, "-y", "-loglevel", "error",
                "-ss", str(PLATE_AT),
                "-i", str(SOURCE),
                "-frames:v", "1",
                str(raw),
            ],
            check=True,
        )
        img = Image.open(raw).convert("RGB")
        img.save(PLATE, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    size = PLATE.stat().st_size
    print(f"{PLATE.relative_to(ROOT)}  {img.width}x{img.height}  {size / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
