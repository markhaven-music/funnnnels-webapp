"""Instagram reels for GRIND STUDIO (2026-11-08): infotainment, product plug at the end.

Vertical 1080x1920. Same voice (ElevenLabs "Aaron Sage", eleven_v4), word-by-word
captions and encoder as the VSLs (tools/jazz_vsl.py, imported); scripts in
docs/reels/<name>.md, same format ([SHOW: ...], [DEMO: ...], one paragraph = one voice take).

Demos:  hats-flat / hats-rolled   trap hats, synthesized here (808, clap, hats), 140 bpm, 2 bars
        ab-straight / ab-drunk     the Drunk Swing Grooves page renders, first 2 bars
        before / after             the Jazz page rolls, first 8 beats, on the page's sine synth
Shows:  title <text> · hats flat|rolled|both · grid straight|drunk|both · compare ·
        product <public path>|<label> · none

IG covers the top ~220 px and the bottom ~380 px: pictures sit between 300 and 1300,
captions at 1470.

usage: /usr/bin/python3 tools/reels.py voice|render <name> <work dir>
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jazz_vsl as J  # noqa: E402

J.W, J.H = W, H = 1080, 1920
import grooves_vsl as G  # noqa: E402

ROOT, FPS, SR = J.ROOT, J.FPS, J.SR
INK, CREAM, DIM, Y, RULE = J.INK, J.CREAM, J.DIM, J.BRASS, J.RULE
RED, GREEN = (216, 53, 42), (47, 191, 91)
J.SPOKEN = {
    "2,847": "two thousand, eight hundred and forty-seven",
    "1050": "one thousand and fifty",
}
J.DEMO_BEATS = 8
CAP_Y = 1470

# ---------------------------------------------------------------- trap hats

TBPM = 140
STEP = 60 / TBPM / 4  # one 16th
KICKS = [0, 10, 16, 22, 27]
CLAPS = [8, 24]
FLAT = [(s, 100) for s in range(0, 32, 2)]
ROLLED = [(0, 112), (2, 70), (4, 104), (5, 52), (6, 66), (6 + 2 / 3, 76), (7 + 1 / 3, 90), (8, 108), (10, 70),
          (12, 104), (13, 58), (14, 50), (14.5, 64), (15, 78), (15.5, 94),
          (16, 112), (18, 70), (20, 104), (23, 84), (24, 108), (26, 70), (27, 62), (27 + 1 / 3, 74),
          (27 + 2 / 3, 86), (28, 104)] + [(29 + i / 4, 40 + i * 6) for i in range(12)]


def _noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def _hp(x, k=2):
    for _ in range(k):
        x = np.diff(x, prepend=0)
    return x


def _band(x, lo, hi):
    f = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    f[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(f, len(x)).astype(np.float32)


def _sounds():
    t = np.arange(int(0.06 * SR)) / SR
    hat = _hp(_noise(len(t), 1), 3) * np.exp(-t / 0.012)
    hat /= np.abs(hat).max()
    t = np.arange(int(0.7 * SR)) / SR
    f = 48 + 90 * np.exp(-t / 0.025)
    k = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t / 0.32)
    k /= np.abs(k).max()
    t = np.arange(int(0.3 * SR)) / SR
    env = sum(np.where(t >= d, np.exp(-(t - d) / (0.012 if d < 0.02 else 0.09)), 0) for d in (0, 0.009, 0.018))
    clap = _band(_noise(len(t), 2), 900, 4500) * env
    clap /= np.abs(clap).max()
    return hat, k, clap


def hats_pcm(rolled):
    hat, kick, clap = _sounds()
    out = np.zeros(int((32 * STEP + 1.0) * SR), np.float32)

    def put(s, x, g):
        i = int(s * STEP * SR)
        out[i:i + len(x)] += (x * g)[: len(out) - i]

    for s in KICKS:
        put(s, kick, 0.8)
    for s in CLAPS:
        put(s, clap, 0.55)
    for s, v in (ROLLED if rolled else FLAT):
        put(s, hat, 0.32 * (v / 127) ** 1.6 if rolled else 0.32 * (100 / 127) ** 1.6)
    return out


def draw_hats(layer, box, rolled, title, color, now=None):
    """Lanes HATS (bar height = velocity) / CLAP / 808 over 2 bars. now = playhead in 16ths."""
    x0, y0, x1, y1 = box
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, 10, fill=(20, 19, 22, 255))
    lx, lw = x0 + 120, x1 - 24 - (x0 + 120)
    sx = lambda s: lx + lw * s / 32
    rows = [("HATS", 0.5), ("CLAP", 0.25), ("808", 0.25)]
    top = y0 + 24
    hgt = y1 - y0 - 48
    ys = []
    for name, frac in rows:
        ys.append((name, top, top + hgt * frac))
        top += hgt * frac
    for name, a, b in ys:
        d.text((x0 + 20, (a + b) / 2), name, font=J.font(28, 0), fill=CREAM if name == "HATS" else DIM, anchor="lm")
        for i in range(33):
            d.line((sx(i), a + 6, sx(i), b - 6), fill=(78, 69, 55) if i % 4 == 0 else RULE, width=3 if i % 4 == 0 else 1)

    def hit(s, a, b, fill, w, frac=1.0):
        lit = now is not None and 0 <= now - s < 0.5
        if now is not None and not lit:
            fill = tuple(int(c * 0.65) for c in fill)
        if lit:
            fill = (255, 255, 255)
        d.rounded_rectangle((sx(s) + 1, b - 8 - (b - a - 16) * frac, sx(s) + w, b - 8), 3, fill=fill)

    _, a, b = ys[0]
    for s, v in (ROLLED if rolled else FLAT):
        hit(s, a, b, Y if rolled else (160, 160, 160), 7 if s % 1 else 11, (v / 127) ** 1.5)
    for s in CLAPS:
        hit(s, ys[1][1], ys[1][2], CREAM, 14)
    for s in KICKS:
        hit(s, ys[2][1], ys[2][2], (150, 150, 150), 14)
    if now is not None:
        d.line((sx(now), y0 + 14, sx(now), y1 - 14), fill=CREAM, width=3)
    d.text(((x0 + x1) / 2, y0 - 26), title, font=J.font(40, 0), fill=color, anchor="ms")


HATS_DEMOS = {"hats-flat": (False, "PROGRAMMED FLAT", RED), "hats-rolled": (True, "VELOCITY · ROLLS · GAPS", GREEN)}
HATS_BOX = (30, 520, 1050, 1180)

# ---------------------------------------------------------------- demos

GROOVE_BOX = (30, 560, 1050, 1120)
ROLL_BOX = (30, 470, 1050, 1220)


def demo(name):
    """(pcm, seconds of music) for a [DEMO]."""
    if name in HATS_DEMOS:
        return hats_pcm(HATS_DEMOS[name][0]), 32 * STEP
    if name in G.DEMOS:
        pcm = G.demo_pcm(name)[: int(2 * G.BAR * SR + 0.6 * SR)].copy()
        fade = int(0.6 * SR)
        pcm[-fade:] *= np.linspace(1, 0, fade)
        return pcm, 2 * G.BAR
    pcm, dur = J.piano(name)
    return pcm, dur


def demo_frame(frame, name, t):
    """Draw the demo's picture with its playhead at t seconds in (None = no playhead)."""
    if name in HATS_DEMOS:
        rolled, title, color = HATS_DEMOS[name]
        draw_hats(frame, HATS_BOX, rolled, title, color, None if t is None else t / STEP)
    elif name in G.DEMOS:
        title, color, drunk = G.DEMOS[name]
        G.draw_grid(frame, GROOVE_BOX, drunk, title.split(" · ")[0], color, None if t is None else (t / G.BAR) % 1)
    else:
        r = J.roll(name)
        title = ("ROOT POSITION", RED) if name == "before" else ("PIANIST VOICING", GREEN)
        frame.alpha_composite(J.draw_roll(r, ROLL_BOX, title[1], title=title, now=None if t is None else t * r["bpm"] / 60))


def demo_key(name, t, dur):
    if not 0 <= t < dur:
        return None
    if name in HATS_DEMOS:
        return round(t / STEP * 4)
    return round(t * 24)


# ---------------------------------------------------------------- shows

def wrap(text, f, width):
    lines, cur = [], ""
    for w in text.split():
        if cur and f.getlength(cur + " " + w) > width:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    return lines + [cur]


def visual(show):
    kind, _, arg = show.partition(" ")
    if kind == "none":
        return None
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if kind == "title":
        f = J.font(104, 0)
        lines = wrap(arg, f, 940)
        y = 820 - (len(lines) - 1) * 62
        for i, line in enumerate(lines):
            d.text((W / 2, y + i * 124), line, font=f, fill=Y if i == len(lines) - 1 else CREAM, anchor="ms")
    elif kind == "hats":
        if arg == "both":
            draw_hats(layer, (30, 380, 1050, 760), False, "BEFORE", RED)
            draw_hats(layer, (30, 880, 1050, 1260), True, "AFTER", GREEN)
        else:
            draw_hats(layer, HATS_BOX, arg == "rolled", *HATS_DEMOS[f"hats-{arg}"][1:])
    elif kind == "grid":
        if arg == "both":
            G.draw_grid(layer, (30, 420, 1050, 800), False, "QUANTIZED", RED)
            G.draw_grid(layer, (30, 900, 1050, 1280), True, "DRUNK · the snare stays put", GREEN)
        else:
            G.draw_grid(layer, GROOVE_BOX, arg == "drunk", "DRUNK" if arg == "drunk" else "QUANTIZED",
                        GREEN if arg == "drunk" else RED)
    elif kind == "compare":
        layer = J.draw_roll(J.roll("before"), (30, 360, 1050, 790), RED, trace=CREAM, title=("ROOT POSITION", RED))
        layer.alpha_composite(J.draw_roll(J.roll("after"), (30, 890, 1050, 1320), GREEN, trace=CREAM,
                                          title=("PIANIST VOICING", GREEN)))
    elif kind == "product":
        path, label = arg.split("|")
        img = J.fit(Image.open(os.path.join(ROOT, "public", "funnels", path + ".webp")).convert("RGBA"), 860, 780)
        layer.alpha_composite(img, ((W - img.width) // 2, 330 + (780 - img.height) // 2))
        d.text((W / 2, 1210), label, font=J.font(64, 0), fill=CREAM, anchor="ms")
        f = J.font(46, 0)
        tw = f.getlength("LINK IN BIO")
        d.rounded_rectangle((W / 2 - tw / 2 - 30, 1250, W / 2 + tw / 2 + 30, 1336), 8, fill=Y)
        d.text((W / 2, 1310), "LINK IN BIO", font=f, fill=INK, anchor="ms")
    return layer


def chunks(words):
    """Caption lines: up to 3 words / 16 characters, broken after punctuation."""
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        text = " ".join(words[j][0] for j in cur)
        if len(cur) >= 3 or len(text) > 16 or w[0][-1] in ".:?!;," or i == len(words) - 1:
            out.append(cur)
            cur = []
    return out


def caption(words, line, current, big):
    f = J.font(96 if big else 80, 0)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    space = f.getlength(" ")
    widths = [f.getlength(words[j][0]) for j in line]
    scale = min(1, 980 / (sum(widths) + space * (len(line) - 1)))
    if scale < 1:
        f = J.font(int(f.size * scale), 0)
        space = f.getlength(" ")
        widths = [f.getlength(words[j][0]) for j in line]
    x = (W - sum(widths) - space * (len(line) - 1)) / 2
    y = 1000 if big else CAP_Y
    for j, w in zip(line, widths):
        if j == current:
            d.rounded_rectangle((x - 12, y - f.size * 0.82, x + w + 12, y + f.size * 0.28), 8, fill=Y)
            d.text((x, y), words[j][0], font=f, fill=INK, anchor="ls")
        else:
            d.text((x, y), words[j][0], font=f, fill=CREAM if j < current else DIM, anchor="ls")
        x += w + space
    return layer


# ---------------------------------------------------------------- render

def timeline(work):
    t, parts = 0.15, []
    for item in J.parse():
        if item[0] == "talk":
            pcm, words = J.voiced(work, item[1])
            parts.append({"kind": "talk", "start": t, "dur": len(pcm) / SR, "pcm": pcm, "words": words, "show": item[2]})
            t += len(pcm) / SR + 0.25
        else:
            pcm, dur = demo(item[1])
            t += 0.15
            parts.append({"kind": "demo", "start": t, "dur": dur, "tail": len(pcm) / SR, "pcm": pcm, "id": item[1]})
            t += dur + 0.45
    total = t + 0.9
    voice_track = np.zeros(int(total * SR) + 2 * SR, np.float32)
    demo_track = np.zeros_like(voice_track)
    for p in parts:
        i = int(p["start"] * SR)
        (voice_track if p["kind"] == "talk" else demo_track)[i:i + len(p["pcm"])] += p["pcm"]
    mix = voice_track / max(1e-6, np.abs(voice_track).max()) * 0.7 + demo_track / max(1e-6, np.abs(demo_track).max()) * 0.62
    return parts, total, mix


def render(name, work):
    parts, total, mix = timeline(work)
    np.clip(mix, -1, 1).astype(np.float32).tofile(f"{work}/mix.f32")
    out = f"{work}/{name}.mp4"
    enc = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", f"{work}/mix.f32",
         "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-movflags", "+faststart",
         "-shortest", out], stdin=subprocess.PIPE)
    bg = Image.new("RGBA", (W, H), INK + (255,))
    visuals, cache, last = {}, {}, None
    for n in range(int(total * FPS)):
        t = n / FPS
        part = next((p for p in parts if p["start"] - 0.12 <= t < p["start"] + p["dur"] + 0.3), None) or last
        last = part
        if part is None:
            key = ("blank",)
        elif part["kind"] == "demo":
            key = ("demo", part["id"], demo_key(part["id"], t - part["start"], part["dur"]))
        else:
            st = t - part["start"]
            cur = max([i for i, w in enumerate(part["words"]) if w[1] <= st] or [0])
            key = ("talk", id(part), cur)
        if key not in cache:
            cache.clear()
            frame = bg.copy()
            if key[0] == "demo":
                k = key[2]
                if k is None:
                    demo_frame(frame, key[1], None)
                else:
                    demo_frame(frame, key[1], (k * STEP / 4) if key[1] in HATS_DEMOS else k / 24)
                ImageDraw.Draw(frame).text((W / 2, CAP_Y), "LISTEN", font=J.font(56, 0), fill=DIM, anchor="ms")
            elif key[0] == "talk":
                if part["show"] not in visuals:
                    visuals[part["show"]] = visual(part["show"])
                v = visuals[part["show"]]
                if v is not None:
                    frame.alpha_composite(v)
                line = next(c for c in chunks(part["words"]) if key[2] in c)
                frame.alpha_composite(caption(part["words"], line, key[2], v is None))
            cache[key] = frame.convert("RGB").tobytes()
        enc.stdin.write(cache[key])
    enc.stdin.close()
    enc.wait()
    print(out, f"{total:.1f}s")


if __name__ == "__main__":
    cmd, name, work = sys.argv[1:4]
    J.SCRIPT = os.path.join(ROOT, "docs", "reels", f"{name}.md")
    os.makedirs(work, exist_ok=True)
    {"voice": lambda: J.voice(work), "render": lambda: render(name, work)}[cmd]()
