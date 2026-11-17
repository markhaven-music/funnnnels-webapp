#!/usr/bin/python3
"""The HUSTLE add-on's picture: the packs in the bundle one after the other, each as a 3D case with
its own cover, one a second, leaving fast to the left with motion blur and speed lines while the
next comes in ("una gif con box per ogni midi pack incluso dentro... così si capisce che sono tanti
packs", "motion blur... linee orizzontali a indicare velocità", 2026-11-17).

The covers are the packs' real artwork ("non mi piacciono i pack. in realtà abbiamo già qualcosa
tipo artwork per quei pack", the owner's Dropbox folder "MIDI Packs"), copied by pack name to
T7: 03. Graphic Material/HUSTLE" MIDI Bundle/pack covers. 22 of the bundle's 31 packs have one;
the other nine (Trap Plucks 1-2, Trap Guitars, Dark Trap 1-2, Hip-Hop Guitar Melodies, Jazz Chord
Progressions, Epic Brass, Epic Feeling) have no artwork and are not drawn: no invented covers
(a first version drew a made-up box for each of the 31; the owner didn't like them).

Run: /usr/bin/python3 tools/hustle_bump_anim.py   (needs Pillow + numpy, and the T7 drive)
Out: public/funnels/midi-drum-kit/bump-hustle-packs.webp (animated WebP, transparent, 168x168)
"""
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

COVERS = Path('/Volumes/T7/Dropbox/FFUNK/Tripwires Companies/Grind Studio/03. Graphic Material/HUSTLE" MIDI Bundle/pack covers')

# Neighbours from different series, so every second looks like another pack.
PACKS = [
    "Trap Melodies Vol.1", "LoFi Beats Vol.1", "Emotional Keys Vol.1", "Soulful Drake Beats Vol.1", "Latin Jazz Vol.1",
    "Pure Jazz Vol.1", "Trap Melodies Vol.2", "LoFi Beats Vol.2", "Reggaeton Sentimental Vol.1", "Neo-Soul & RnB Vol.1",
    "Emotional Keys Vol.2", "Gospel Redemption Vol.1", "Trap Melodies Vol.3", "LoFi Beats Vol.3", "Soulful Drake Beats Vol.2",
    "Latin Jazz Vol.2", "Emotional Strings", "Trap Melodies Vol.4", "LoFi Beats Vol.4", "Reggaeton Sentimental Vol.2",
    "Emotional Keys Vol.3", "LoFi Beats Vol.5",
]

S = 3  # drawn 3x, shown at 168x168 (twice the 84px the order forms draw it at)
W = H = 200 * S
FW = 440  # the cover, flat
SW = 56   # the spine, flat
F = "/System/Library/Fonts/Supplemental/"


def cover(name: str) -> Image.Image:
    path = next(p for p in COVERS.iterdir() if p.stem == name)
    return Image.open(path).convert("RGBA").convert("RGB").resize((FW, FW), Image.LANCZOS)


def tint(im: Image.Image):
    """The cover's own colour, lifted, for its speed lines and spine."""
    r, g, b = np.asarray(im.resize((8, 8))).reshape(-1, 3).mean(axis=0)
    m = max(r, g, b, 1)
    return tuple(int(min(255, v * 230 / m)) for v in (r, g, b))


def spine(name: str, c) -> Image.Image:
    im = Image.new("RGB", (FW, SW), tuple(int(v * 0.16) for v in c))
    d = ImageDraw.Draw(im)
    size = 30
    while size > 14 and d.textlength(name.upper(), font=ImageFont.truetype(F + "DIN Condensed Bold.ttf", size)) > FW - 60:
        size -= 2
    d.text((FW / 2, SW / 2 + 2), name.upper(), font=ImageFont.truetype(F + "DIN Condensed Bold.ttf", size), fill=(240, 240, 240), anchor="mm")
    return im.rotate(90, expand=True)


def warp(src: Image.Image, quad) -> Image.Image:
    """src's corners (tl, tr, br, bl) onto `quad` in a transparent canvas."""
    w, h = src.size
    a, b = [], []
    for (x, y), (u, v) in zip(quad, [(0, 0), (w, 0), (w, h), (0, h)]):
        a += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        b += [u, v]
    k = np.linalg.solve(np.array(a, dtype=float), np.array(b, dtype=float))
    return src.convert("RGBA").transform((W, H), Image.PERSPECTIVE, tuple(k), Image.BICUBIC)


def box(name: str):
    """The pack as a case in three quarters, its cover on the front, a soft shadow under it."""
    front = cover(name)
    c = tint(front)
    cv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x0, x1, x2 = 62, 112, 546   # spine's left edge, the corner, the front's right edge
    t0, t1, t2 = 98, 72, 94     # their tops
    b0, b1, b2 = 502, 534, 508  # their bottoms
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).ellipse((56, 494, 556, 560), fill=150)
    cv.paste((0, 0, 0, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(14)))
    cv.alpha_composite(warp(spine(name, c), [(x0, t0), (x1, t1), (x1, b1), (x0, b0)]))
    cv.alpha_composite(warp(front, [(x1, t1), (x2, t2), (x2, b2), (x1, b1)]))
    # a thin light edge, so a dark cover still reads as a case on the black HUSTLE card
    edge = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(edge)
    d.line([(x0, t0), (x1, t1), (x2, t2), (x2, b2), (x1, b1), (x0, b0), (x0, t0)], fill=(255, 255, 255, 80), width=2)
    d.line([(x1, t1), (x1, b1)], fill=(255, 255, 255, 70), width=2)
    cv.alpha_composite(edge)
    return cv, c


def smear(im: Image.Image, dx: int, blur: int) -> Image.Image:
    """The case moved by dx and blurred along x only: the average of copies trailing behind it."""
    n = max(1, blur // 2)  # a copy every 2px: a smooth trail, no comb
    src = np.asarray(im, dtype=np.float32).copy()
    src[..., :3] *= src[..., 3:4] / 255  # premultiplied, so the trail has no dark fringe
    acc = np.zeros_like(src)
    for k in range(n):
        off = dx + int(k * blur / n)
        if 0 <= off < W:
            acc[:, off:] += src[:, : W - off]
        elif -W < off < 0:
            acc[:, : W + off] += src[:, -off:]
    acc /= n
    a = acc[..., 3:4]
    acc[..., :3] = np.where(a > 0, acc[..., :3] * 255 / np.maximum(a, 1e-3), 0)
    return Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8))


def lines(c, seed: int, strength: float) -> Image.Image:
    """Horizontal speed lines across the frame, white and the cover's colour."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = random.Random(seed)
    for _ in range(int(22 * strength)):
        y = r.randrange(84, 520)
        x = r.randrange(-100, W - 80)
        col = c if r.random() < 0.5 else (255, 255, 255)
        d.rounded_rectangle((x, y, x + r.randrange(140, 420), y + r.choice((3, 4, 6))), 3, fill=(*col, int(210 * strength * (0.5 + 0.5 * r.random()))))
    return im.filter(ImageFilter.GaussianBlur(1.2))


def main():
    boxes = [box(n) for n in PACKS]
    frames, times = [], []
    # leaving: the case shoots out to the left; arriving: the next one brakes in from the right
    OUT = [(-190, 220, 0.9)]
    IN = [(330, 260, 1.0), (50, 100, 0.5)]
    for i, (b, c) in enumerate(boxes):
        nxt, nc = boxes[(i + 1) % len(boxes)]
        frames.append(b)
        times.append(850)
        for k, (dx, blur, s) in enumerate(OUT):
            f = smear(b, dx, blur)
            f.alpha_composite(lines(c, i * 10 + k, s))
            frames.append(f)
            times.append(55)
        for k, (dx, blur, s) in enumerate(IN):
            f = smear(nxt, dx - blur, blur)
            f.alpha_composite(lines(nc, i * 10 + 5 + k, s))
            frames.append(f)
            times.append(45)
    small = [f.resize((168, 168), Image.LANCZOS) for f in frames]
    root = Path(__file__).resolve().parent.parent
    out = root / "public/funnels/midi-drum-kit/bump-hustle-packs.webp"
    small[0].save(out, save_all=True, append_images=small[1:], duration=times, loop=0, quality=50, method=6, minimize_size=True)
    print(out, f"{out.stat().st_size / 1024:.0f} KB", len(small), "frames")
    # stills to look at
    sheet = Image.new("RGBA", (168 * 8, 168 * 2), (255, 248, 220, 255))
    ImageDraw.Draw(sheet).rectangle((0, 168, 168 * 8, 336), fill=(11, 11, 11, 255))
    for j, idx in enumerate([0, 1, 2, 3, 4, 8, 12, 16]):
        sheet.alpha_composite(small[idx], (168 * j, 0))
    for j, idx in enumerate([20, 24, 36, 44, 64, 65, 66, 84]):
        sheet.alpha_composite(small[idx], (168 * j, 168))
    (root / ".claude/popup-shots").mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(root / ".claude/popup-shots/hustle-anim-sheet.png")


if __name__ == "__main__":
    main()
