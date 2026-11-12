"""The MIDI Drum Kit VSL (English, cold traffic), from its script to an mp4 (2026-11-12, "make a new high
converting (cold traffic) VSL for the product and publish it too").

Same voice, captions and encoder as the Jazz VSL (tools/jazz_vsl.py, imported and pointed at this funnel,
as tools/top_hits_vsl.py does). What differs:
  - the demos are drums: the two sides of the landing's "No bounce vs bounce" switch (player/v5/bounce2.json:
    a plain beat, and Complete Beat 01 of the kit) and Complete Beat 13, played with the page's own sounds
    (the Hit-Maker Drums one-shots of public/funnels/midi-drum-kit/player and its 808, as landingNewClient.ts
    plays them), each drum on its own line with a playhead;
  - the pictures are this funnel's (the kit's box, the folders' boxes, the six bonus covers, the license card),
    the accent the button's orange.

  voice   ElevenLabs, cached in <work>/voice (needs ELEVENLABS_API_KEY)
  render  <work>/drum-kit-vsl-en.mp4
  poster  <work>/poster.png

usage: /usr/bin/python3 tools/drum_kit_vsl.py voice|render|poster <work dir>
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jazz_vsl as J  # noqa: E402

ROOT = J.ROOT
DK = os.path.join(ROOT, "app", "(funnels)", "midi-drum-kit")
PUB = os.path.join(ROOT, "public", "funnels", "midi-drum-kit")
PLAYER = os.path.join(PUB, "player")
W, H, SR, FPS, GAP = J.W, J.H, J.SR, J.FPS, J.GAP

# The page's colours: black, white, the button's orange; red and green for the two beats.
ORANGE, ORANGE_HI = (245, 133, 31), (255, 161, 61)
J.INK, J.CREAM, J.DIM = (0, 0, 0), (255, 255, 255), (96, 96, 100)  # pure black: the pictures' own black then has no edge
J.BRASS, J.BRASS_HI, J.RULE = ORANGE, ORANGE_HI, (44, 43, 50)
RED, GREEN, CREAM, DIM, RULE = J.RED, J.GREEN, J.CREAM, J.DIM, J.RULE
PANEL = (13, 12, 16)

J.SCRIPT = os.path.join(DK, "vsl", "script-en.md")
J.PUB = PUB
# What the voice reads for what the captions show. Longest first.
J.SPOKEN = {
    "10,296": "ten thousand two hundred ninety-six",
    "2,847": "two thousand, eight hundred and forty-seven",
    "355": "three hundred and fifty-five",
    "281": "two hundred and eighty-one",
    "160": "one hundred and sixty",
    "808": "eight-oh-eight",
    "50": "fifty",
    "17": "seventeen",
    "14": "fourteen",
    "12": "twelve",
    "lofi": "lo-fi",
}
BONUSES = [("famous", "Famous Beats Bundle"), ("starters", "Beat Starters Bundle"), ("drums", "Hit-Maker Drums"),
           ("grooves", "Drunk Swing Grooves"), ("hooks", "MYSTERY Hooks Pack"), ("guide", "MIDI Drum Kit Guide")]

# ---------------------------------------------------------------- the demos

INST = ["808", "Kick", "Snare", "Clap", "Rim", "Hat", "Open hat", "Perc"]
FILES = [None, "kick", "snare", "clap", "rim", "hat", "ohat", "perc"]
LEVEL = [0.9, 1, 0.8, 0.75, 0.7, 0.5, 0.45, 0.6]  # landingNewClient.ts LEVEL


def five(flat):
    return [tuple(flat[i:i + 5]) for i in range(0, len(flat), 5)]


def rolls():
    b = json.load(open(os.path.join(PLAYER, "v5", "bounce2.json")))
    beats = json.load(open(os.path.join(PLAYER, "v5", "beats.json")))
    b13 = beats[12]
    kit = "MIDI Drum Kit / "
    return {
        "flat": {"bpm": b["bpm"], "beats": b["len"], "notes": five(b["off"]), "file": "A plain beat: kick and 808 on the one, snare on the three, straight hi-hats"},
        "bounce": {"bpm": b["bpm"], "beats": b["len"], "notes": five(b["on"]), "file": kit + b["f"].replace("/", " / ")},
        "beat13": {"bpm": b13["bpm"], "beats": min(b13["len"], 16), "notes": [n for n in five(b13["n"]) if n[0] < 16], "file": kit + b13["f"].replace("/", " / ")},
    }


ROLLS = rolls()
DEMOS = {
    "flat": ("NO BOUNCE · a plain beat", RED),
    "bounce": ("BOUNCE · Complete Beat 01 of the kit", GREEN),
    "beat13": (f"Complete Beat 13 of the kit · {ROLLS['beat13']['bpm']} BPM", ORANGE),
}
_samples = {}


def sample(name):
    if name not in _samples:
        _samples[name] = np.frombuffer(J.run("ffmpeg", "-v", "error", "-i", os.path.join(PLAYER, f"{name}.m4a"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"), np.float32)
    return _samples[name]


def drums(rid):
    """The demo's sound, as the page plays it: the one-shots at each hit's velocity and pitch, the 808 a sine that falls onto its note."""
    r = ROLLS[rid]
    spb = 60 / r["bpm"]
    dur = r["beats"] * spb
    out = np.zeros(int((dur + 2.0) * SR), np.float32)
    for t, ln, s, p, v in r["notes"]:
        i, vel = int(t * spb * SR), v / 127
        if s == 0:
            f = 440 * 2 ** ((p - 69 - 24) / 12)
            hold = max(0.12, min(ln * spb, 1.6))
            n = int((hold + 0.1) * SR)
            tt = np.arange(n) / SR
            freq = f * 1.9 ** (1 - np.minimum(tt, 0.035) / 0.035)  # from 1.9 × the note down to it in 35 ms
            tone = np.sin(2 * np.pi * np.cumsum(freq) / SR)
            env = np.minimum(tt / 0.004, 1.0)
            k = int(hold * 0.7 * SR)
            env[k:] *= np.exp(-(tt[k:] - tt[k]) / max((hold * 0.3 + 0.06) / 6.9, 1e-3))
            wave = tone * env * LEVEL[0] * vel
        else:
            wave = sample(FILES[s])
            if p:
                rate = 2 ** (max(-30, min(24, p)) / 12)
                wave = np.interp(np.arange(0, len(wave), rate), np.arange(len(wave)), wave)
            wave = wave * LEVEL[s] * (0.35 + 0.65 * vel)
        wave = wave[: len(out) - i]
        out[i:i + len(wave)] += wave.astype(np.float32)
    return out, dur


J.piano = drums  # jazz_vsl.timeline plays each [DEMO] with this

# ---------------------------------------------------------------- pictures


def draw_drums(r, box, color, title=None, now=None):
    """The beat on a new RGBA layer: a line per drum, a playhead at `now` beats."""
    x0, y0, x1, y1 = box
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, 14, fill=PANEL + (255,))
    rows = sorted({n[2] for n in r["notes"]})
    lab = 190 if x1 - x0 > 1200 else 130
    top, left, right = y0 + 34, x0 + lab, x1 - 28
    rh = (y1 - 34 - top) / len(rows)
    bx = lambda b: left + (right - left) * b / r["beats"]
    lf = J.font(30 if lab > 150 else 22, 5)
    for k, s in enumerate(rows):
        y = top + k * rh
        if k:
            d.line((x0 + 20, y, x1 - 20, y), fill=RULE, width=1)
        d.text((x0 + 28, y + rh / 2), INST[s], font=lf, fill=(170, 170, 176), anchor="lm")
    for q in range(r["beats"] * 4 + 1):
        d.line((bx(q / 4), top, bx(q / 4), y1 - 34), fill=(88, 86, 98) if q % 16 == 0 else (52, 50, 60) if q % 4 == 0 else (26, 25, 31), width=2 if q % 16 == 0 else 1)
    pad = max(4, rh * 0.2)
    for t, ln, s, p, v in r["notes"]:
        y = top + rows.index(s) * rh
        w = (ln if s == 0 else min(ln, 0.25)) * (right - left) / r["beats"]
        on = now is not None and t <= now < t + max(ln, 0.14)
        shade = 0.45 + 0.55 * v / 127
        fill = (255, 255, 255) if on else tuple(int(c * shade * (1 if now is None or now >= t else 0.6)) for c in color)
        d.rounded_rectangle((bx(t) + 1, y + pad, max(bx(t) + w - 1, bx(t) + 5), y + rh - pad), 3, fill=fill)
    if now is not None:
        d.line((bx(now), top - 8, bx(now), y1 - 26), fill=CREAM, width=4)
    if title:
        d.text(((x0 + x1) / 2, y0 - 34), title[0], font=J.font(40 if lab > 150 else 30, 0), fill=title[1], anchor="ms")
    return layer


def visual(show):
    """The still layer for a [SHOW], above the captions (None for 'none')."""
    kind, _, arg = show.partition(" ")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if kind == "none":
        return None
    if kind == "image":
        img = J.fit(J.pub(arg), 1500, 720)
        layer.alpha_composite(img, ((W - img.width) // 2, 60 + (720 - img.height) // 2))
    elif kind == "bonus":
        slug, name = BONUSES[int(arg) - 1]
        img = J.fit(J.pub(f"bonus2-{slug}"), 560, 660)
        layer.alpha_composite(img, ((W - img.width) // 2, 110))
        ImageDraw.Draw(layer).text((W / 2, 84), f"BONUS {arg} · {name}", font=J.font(40, 0), fill=ORANGE_HI, anchor="ms")
    elif kind == "card":
        d = ImageDraw.Draw(layer)
        f = J.font(150, 0)
        while f.getlength(arg) > W - 240:  # a long card a size smaller
            f = J.font(f.size - 10, 0)
        d.text((W / 2, 440), arg, font=f, fill=ORANGE_HI, anchor="ms")
        d.line((W / 2 - 180, 510, W / 2 + 180, 510), fill=ORANGE, width=4)
    elif kind == "roll":
        layer = draw_drums(ROLLS[arg], (200, 150, 1720, 760), DEMOS[arg][1], title=DEMOS[arg])
    elif kind == "compare":
        layer = draw_drums(ROLLS["flat"], (50, 190, 940, 740), RED, title=DEMOS["flat"])
        layer.alpha_composite(draw_drums(ROLLS["bounce"], (980, 190, 1870, 740), GREEN, title=("BOUNCE · Complete Beat 01", GREEN)))
    return layer


# ---------------------------------------------------------------- render


def render(work):
    parts, total, mix = J.timeline(work)
    np.clip(mix, -1, 1).astype(np.float32).tofile(f"{work}/mix.f32")
    out = f"{work}/drum-kit-vsl-en.mp4"
    enc = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", f"{work}/mix.f32",
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-movflags", "+faststart",
         "-shortest", out], stdin=subprocess.PIPE)
    bg = Image.new("RGBA", (W, H), J.INK + (255,))
    visuals, cache = {}, {}
    box = (120, 190, 1800, 900)
    for n in range(int(total * FPS)):
        t = n / FPS
        part = next((p for p in parts if p["start"] - GAP / 2 <= t < p["start"] + p["dur"] + GAP / 2), None)
        if part is None:
            key = ("blank",)
        elif part["kind"] == "demo":
            r = ROLLS[part["id"]]
            now = (t - part["start"]) * r["bpm"] / 60
            key = ("demo", part["id"], round(now * 16) if 0 <= now < r["beats"] else None)
        else:
            st = t - part["start"]
            key = ("talk", id(part), max([i for i, w in enumerate(part["words"]) if w[1] <= st] or [0]))
        if key not in cache:
            cache.clear()
            frame = bg.copy()
            if key[0] == "demo":
                r = ROLLS[key[1]]
                frame.alpha_composite(draw_drums(r, box, DEMOS[key[1]][1], title=DEMOS[key[1]], now=None if key[2] is None else key[2] / 16))
                ImageDraw.Draw(frame).text((W / 2, 985), r["file"], font=J.font(30, 5), fill=(150, 150, 156), anchor="ms")
            elif key[0] == "talk":
                if part["show"] not in visuals:
                    visuals[part["show"]] = visual(part["show"])
                v = visuals[part["show"]]
                if v is not None:
                    frame.alpha_composite(v)
                line = next(c for c in J.chunks(part["words"]) if key[2] in c)
                frame.alpha_composite(J.caption(part["words"], line, key[2], v is None))
            cache[key] = frame.convert("RGB").tobytes()
        enc.stdin.write(cache[key])
        if n % (FPS * 30) == 0:
            print(f"{t:6.1f}s / {total:.1f}s")
    enc.stdin.close()
    enc.wait()
    print(out, f"{total:.1f}s")


def poster(work):
    """1920×1080, the promise alone in the captions' type: a line above Wistia's play button, one below, clear of the time bar."""
    frame = Image.new("RGB", (W, H), J.INK)
    d = ImageDraw.Draw(frame)
    f = J.font(128, 0)
    space = f.getlength(" ")
    for y, words in ((250, ["Same", "drums."]), (830, ["This", "one", "bounces."])):
        widths = [f.getlength(w) for w in words]
        x = (W - sum(widths) - space * (len(words) - 1)) / 2
        for w, wd in zip(words, widths):
            if w == "bounces.":
                d.rounded_rectangle((x - 18, y - f.size * 0.82, x + wd + 18, y + f.size * 0.28), 10, fill=ORANGE)
            d.text((x, y), w, font=f, fill=J.INK if w == "bounces." else CREAM, anchor="ls")
            x += wd + space
    frame.save(f"{work}/poster.png")
    print(f"{work}/poster.png")


if __name__ == "__main__":
    {"voice": J.voice, "render": render, "poster": poster}[sys.argv[1]](sys.argv[2])
