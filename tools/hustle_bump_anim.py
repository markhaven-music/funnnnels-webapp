#!/usr/bin/python3
"""The HUSTLE add-on's picture: one 3D box per MIDI pack in the bundle, 31 of them, one a second,
each leaving fast to the left with motion blur and speed lines while the next comes in
("una gif con box per ogni midi pack incluso dentro... così si capisce che sono tanti packs",
"motion blur... linee orizzontali a indicare velocità", 2026-11-17).

The 31 names are the bundle's own folders (T7, 02. All products/6. "HUSTLE" MIDI Bundle). The
packs have no covers of their own, so each box is drawn here: black box, the pack's name, its
number of 31, a piano-roll motif, a glow in a colour per style.

Run: /usr/bin/python3 tools/hustle_bump_anim.py   (needs Pillow + numpy)
Out: public/funnels/midi-drum-kit/bump-hustle-packs.webp (animated WebP, transparent, 168x224)
"""
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PACKS = [
    "Trap Melodies Vol.1", "Trap Melodies Vol.2", "Trap Melodies Vol.3", "Trap Melodies Vol.4",
    "Trap Plucks Vol.1", "Trap Plucks Vol.2", "Trap Guitars Vol.1", "Dark Trap Vol.1", "Dark Trap Vol.2",
    "Soulful Drake Beats Vol.1", "Soulful Drake Beats Vol.2", "Hip-Hop Guitar Melodies Vol.1",
    "LoFi Beats Vol.1", "LoFi Beats Vol.2", "LoFi Beats Vol.3", "LoFi Beats Vol.4", "LoFi Beats Vol.5",
    "Neo-Soul & RnB Vol.1", "Gospel Redemption Vol.1", "Pure Jazz Vol.1", "Jazz Chord Progressions Vol.1",
    "Latin Jazz Vol.1", "Latin Jazz Vol.2", "Reggaeton Sentimental Vol.1", "Reggaeton Sentimental Vol.2",
    "Emotional Keys Vol.1", "Emotional Keys Vol.2", "Emotional Keys Vol.3", "Emotional Strings",
    "Epic Brass", "Epic Feeling",
]
assert len(PACKS) == 31

# A glow colour per style, so the eye sees a different pack each second.
def colour(name: str):
    n = name.lower()
    if "dark" in n: return (150, 60, 255)
    if "trap" in n: return (255, 45, 60)
    if "drake" in n or "hip-hop" in n: return (255, 120, 30)
    if "lofi" in n: return (190, 110, 255)
    if "neo-soul" in n or "gospel" in n: return (40, 210, 190)
    if "jazz" in n and "latin" not in n: return (245, 184, 0)
    if "latin" in n or "reggaeton" in n: return (255, 80, 150)
    if "emotional" in n: return (70, 150, 255)
    return (230, 230, 240)  # epic

S = 3  # drawn 3x, shown at 200x267
W, H = 200 * S, 267 * S
FW, FH = 420, 590  # the front face, flat
SW = 70  # the spine, flat
F = "/System/Library/Fonts/Supplemental/"
font = lambda name, size: ImageFont.truetype(F + name, size)


def fit(d, text, name, size, width):
    while size > 20 and d.textlength(text, font=font(name, size)) > width:
        size -= 2
    return font(name, size)


def front(i: int, name: str) -> Image.Image:
    c = colour(name)
    im = Image.new("RGB", (FW, FH), (9, 9, 11))
    # the glow behind the roll
    glow = Image.new("RGB", (FW, FH), (0, 0, 0))
    ImageDraw.Draw(glow).ellipse((40, 250, FW - 40, 520), fill=tuple(int(v * 0.55) for v in c))
    im = Image.composite(im, im, Image.new("L", (FW, FH), 255))
    im = Image.fromarray(np.clip(np.asarray(im, dtype=np.int16) + np.asarray(glow.filter(ImageFilter.GaussianBlur(70)), dtype=np.int16), 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.text((FW / 2, 34), "GRIND  STUDIO", font=font("Arial Bold.ttf", 17), fill=(255, 255, 255), anchor="mm")
    d.text((FW / 2, 66), "HUSTLE MIDI BUNDLE", font=font("DIN Condensed Bold.ttf", 22), fill=c, anchor="mm")
    # the name on up to three lines, the volume in the pack's colour
    title, _, vol = name.partition(" Vol.")
    words, lines = title.upper().split(), []
    for w in words:
        if lines and len(lines[-1]) + len(w) < 11:
            lines[-1] += " " + w
        else:
            lines.append(w)
    y = 112
    for line in lines:
        f = fit(d, line, "Impact.ttf", 92, FW - 56)
        d.text((FW / 2, y), line, font=f, fill=(255, 255, 255), anchor="mt")
        y += f.size + 6
    if vol:
        d.text((FW / 2, y + 6), f"VOL. {vol}", font=font("DIN Condensed Bold.ttf", 44), fill=c, anchor="mt")
    # a piano roll, different for each pack
    r = random.Random(i * 7919)
    top, rows, rh = 372, 9, 14
    for row in range(rows):
        x = 44 + r.randrange(0, 40)
        while x < FW - 60:
            w = r.choice((22, 34, 34, 52, 78))
            if r.random() < 0.62:
                a = 0.45 + 0.55 * r.random()
                d.rounded_rectangle((x, top + row * rh, min(x + w, FW - 44), top + row * rh + rh - 5), 3, fill=tuple(int(v * a) for v in c))
            x += w + 6
    d.text((FW / 2, FH - 62), "MIDI PACK", font=font("DIN Condensed Bold.ttf", 24), fill=(255, 255, 255), anchor="mm")
    d.text((FW / 2, FH - 30), f"{i + 1:02d} / 31", font=font("Impact.ttf", 30), fill=c, anchor="mm")
    d.rectangle((0, 0, FW - 1, FH - 1), outline=(46, 46, 52), width=2)
    return im


def spine(name: str) -> Image.Image:
    c = colour(name)
    im = Image.new("RGB", (FH, SW), (5, 5, 7))
    d = ImageDraw.Draw(im)
    d.text((FH / 2, SW / 2), name.upper(), font=fit(d, name.upper(), "DIN Condensed Bold.ttf", 34, FH - 90), fill=(235, 235, 240), anchor="mm")
    d.rectangle((0, 0, 26, SW), fill=c)
    return im.rotate(90, expand=True)


def warp(src: Image.Image, quad, size) -> Image.Image:
    """src's corners (tl, tr, br, bl) onto `quad` in a transparent image of `size`."""
    w, h = src.size
    a, b = [], []
    for (x, y), (u, v) in zip(quad, [(0, 0), (w, 0), (w, h), (0, h)]):
        a += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        b += [u, v]
    k = np.linalg.solve(np.array(a, dtype=float), np.array(b, dtype=float))
    rgba = src.convert("RGBA")
    return rgba.transform(size, Image.PERSPECTIVE, tuple(k), Image.BICUBIC)


def box(i: int, name: str) -> Image.Image:
    """The pack's box in three quarters on a transparent canvas, with a soft shadow under it."""
    cv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x0, x1, x2 = 78, 150, 548  # spine's left edge, the corner, the front's right edge
    t0, t1, t2 = 96, 62, 92    # their tops
    b0, b1, b2 = 716, 756, 722  # their bottoms
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).ellipse((70, 708, 560, 780), fill=150)
    cv.paste((0, 0, 0, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(16)))
    sp = warp(spine(name), [(x0, t0), (x1, t1), (x1, b1), (x0, b0)], (W, H))
    fr = warp(front(i, name), [(x1, t1), (x2, t2), (x2, b2), (x1, b1)], (W, H))
    cv.alpha_composite(sp)
    cv.alpha_composite(fr)
    return cv


def smear(im: Image.Image, dx: int, blur: int) -> Image.Image:
    """The box moved by dx and blurred along x only: the average of copies trailing behind it."""
    acc = np.zeros((H, W, 4), dtype=np.float32)
    n = max(1, blur // 2)  # a copy every 2px: a smooth trail, no comb
    src = np.asarray(im, dtype=np.float32)
    src[..., :3] *= src[..., 3:4] / 255  # premultiplied, so the trail has no dark fringe
    for k in range(n):
        off = dx + int(k * blur / n)
        sh = np.zeros_like(src)
        if off >= 0:
            if off < W: sh[:, off:] = src[:, : W - off]
        elif -off < W:
            sh[:, : W + off] = src[:, -off:]
        acc += sh
    acc /= n
    a = acc[..., 3:4]
    acc[..., :3] = np.where(a > 0, acc[..., :3] * 255 / np.maximum(a, 1e-3), 0)
    return Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8))


def lines(c, seed: int, strength: float) -> Image.Image:
    """Horizontal speed lines across the frame, white and the pack's colour."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = random.Random(seed)
    for _ in range(int(26 * strength)):
        y = r.randrange(70, H - 60)
        x = r.randrange(-100, W - 80)
        ln = r.randrange(140, 420)
        col = c if r.random() < 0.5 else (255, 255, 255)
        d.rounded_rectangle((x, y, x + ln, y + r.choice((3, 4, 6))), 3, fill=(*col, int(210 * strength * (0.5 + 0.5 * r.random()))))
    return im.filter(ImageFilter.GaussianBlur(1.2))


def main():
    boxes = [box(i, n) for i, n in enumerate(PACKS)]
    frames, times = [], []
    # leaving: the box accelerates out to the left; arriving: the next one brakes in from the right
    OUT = [(-190, 220, 0.9)]
    IN = [(330, 260, 1.0), (50, 100, 0.5)]
    for i, b in enumerate(boxes):
        c, nxt = colour(PACKS[i]), boxes[(i + 1) % 31]
        frames.append(b)
        times.append(820)
        for k, (dx, blur, s) in enumerate(OUT):
            f = smear(b, dx, blur)
            f.alpha_composite(lines(c, i * 10 + k, s))
            frames.append(f)
            times.append(55)
        for k, (dx, blur, s) in enumerate(IN):
            f = smear(nxt, dx - blur if dx > 0 else dx, blur)
            f.alpha_composite(lines(colour(PACKS[(i + 1) % 31]), i * 10 + 5 + k, s))
            frames.append(f)
            times.append(45)
    # 168x224: twice the 84px the order forms draw it at
    small = [f.resize((168, 224), Image.LANCZOS) for f in frames]
    out = Path(__file__).resolve().parent.parent / "public/funnels/midi-drum-kit/bump-hustle-packs.webp"
    small[0].save(out, save_all=True, append_images=small[1:], duration=times, loop=0, quality=40, method=6, minimize_size=True)
    print(out, f"{out.stat().st_size / 1024:.0f} KB", len(small), "frames")
    # stills to look at
    scratch = Path(__file__).resolve().parent.parent / ".claude/popup-shots"
    scratch.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (168 * 8, 224), (255, 248, 220, 255))
    for j, idx in enumerate([0, 1, 2, 3, 4, 4 * 9, 4 * 12, 4 * 19]):
        sheet.alpha_composite(small[idx], (168 * j, 0))
    sheet.convert("RGB").save(scratch / "hustle-anim-sheet.png")


if __name__ == "__main__":
    main()
