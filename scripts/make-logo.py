#!/usr/bin/env python3
"""Derive public/media/logo.png from the supplied logo.jpeg.

    python scripts/make-logo.py

The lockup is delivered as a JPEG on an off-white ground — 250,250,250, not
pure white, which is why `mix-blend-mode: multiply` could never fully drop it
and the header showed a faint grey rectangle behind the mark.

Two things happen here:

1. The ground is flood-filled away **from the border inwards** rather than by
   keying every light pixel in the image. That distinction matters: the badge on
   the right contains large near-white areas of its own (the sky behind the
   lighthouse, the ground behind "Celebrate"), and a global colour key would
   punch holes straight through them. Flood fill from the edge cannot reach
   them — they are enclosed by the navy ring.

2. The result is trimmed to the ink. 68% of the original canvas is empty
   margin, so the same CSS box now carries a mark roughly a third larger with
   no change to the layout.

Anything selecting on the filename (`img[src*="/media/logo."]` in rotary.css)
keeps working, since only the extension changes.
"""

import pathlib
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
APP = HERE.parent
SRC = APP / "public" / "media" / "logo.jpeg"
OUT = APP / "public" / "media" / "logo.png"

SENTINEL = (255, 0, 255)
# The ground is 250,250,250; the palest ink in the lockup is well below this.
GROUND_MIN = (238, 238, 236)
TOLERANCE = 22
PAD = 6


def is_ground(px):
    return all(px[i] >= GROUND_MIN[i] for i in range(3))


def main():
    src = Image.open(SRC).convert("RGB")
    w, h = src.size

    probe = src.copy()
    seeds = []
    for x in range(0, w, 8):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, 8):
        seeds += [(0, y), (w - 1, y)]
    for seed in seeds:
        if is_ground(probe.getpixel(seed)):
            ImageDraw.floodfill(probe, seed, SENTINEL, thresh=TOLERANCE)

    out = src.convert("RGBA")
    po, pp = out.load(), probe.load()
    cleared = 0
    for y in range(h):
        for x in range(w):
            if pp[x, y] == SENTINEL:
                r, g, b, _ = po[x, y]
                po[x, y] = (r, g, b, 0)
                cleared += 1

    bbox = out.getbbox()
    box = (
        max(0, bbox[0] - PAD),
        max(0, bbox[1] - PAD),
        min(w, bbox[2] + PAD),
        min(h, bbox[3] + PAD),
    )
    trimmed = out.crop(box)
    trimmed.save(OUT, "PNG", optimize=True)

    print("cleared %.1f%% of the canvas" % (100 * cleared / (w * h)))
    print("%s  %dx%d  (aspect %.4f — rotary.css must match)"
          % (OUT.name, trimmed.width, trimmed.height, trimmed.width / trimmed.height))


if __name__ == "__main__":
    main()
