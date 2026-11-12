"""The MIDI Drum Kit VSL (English, cold traffic), from its script to an mp4.

2026-11-12, "make a new high converting (cold traffic) VSL for the product and publish it too"; rewritten the same
night in the Jazz video's style ("make the copy of the VSL closer to the style you used for the Jazz MIDI Pack VSL?
Even how the text appears on video I liked it more there"). So everything on screen is the Jazz video's
(tools/jazz_vsl.py, imported and pointed at this funnel, as tools/top_hits_vsl.py does): its warm black, its cream
words with the one being said in a yellow box, its serif cards, its scenes filling the frame. What differs:
  - the demos are drums from the kit (the zip V2), played with the landing player's own sounds (the Hit-Maker
    Drums one-shots of public/funnels/midi-drum-kit/player and its 808, as landingNewClient.ts plays them), each
    drum on its own line with a playhead; a fragment dropped into a beat is drawn in yellow;
  - the pictures are this funnel's: the kit's box, the studio scenes, the six bonus covers.

  voice   ElevenLabs, cached in <work>/voice (needs ELEVENLABS_API_KEY)
  render  <work>/drum-kit-vsl-en.mp4
  poster  <work>/poster.png

usage: /usr/bin/python3 tools/drum_kit_vsl.py voice|render|poster <work dir> [kit zip V2]
"""
import json, os, subprocess, sys, zipfile
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jazz_vsl as J  # noqa: E402
import drum_player_data as T  # noqa: E402

ROOT = J.ROOT
DK = os.path.join(ROOT, "app", "(funnels)", "midi-drum-kit")
PUB = os.path.join(ROOT, "public", "funnels", "midi-drum-kit")
PLAYER = os.path.join(PUB, "player")
ZIP = sys.argv[3] if len(sys.argv) > 3 else os.path.expanduser("~/Downloads/MIDI Drum Kit Bundle V2.zip")
W, H, SR, FPS, GAP = J.W, J.H, J.SR, J.FPS, J.GAP
# The Jazz video's look in the Drum Kit's orange, not the Jazz yellow ("hai usato giallo?", 2026-11-12): the word
# being said, the fragment drawn in a beat, the bonus titles, the cards, the folders.
J.BRASS, J.BRASS_HI = (245, 133, 31), (255, 161, 61)
RED, GREEN, YELLOW, YELLOW_HI, CREAM, DIM, RULE = J.RED, J.GREEN, J.BRASS, J.BRASS_HI, J.CREAM, J.DIM, J.RULE
PANEL = (22, 19, 15)  # the Jazz piano roll's panel

J.SCRIPT = os.path.join(DK, "vsl", "script-en.md")
J.PUB = PUB
# What the voice reads for what the captions show. Longest first: each is a plain replace.
J.SPOKEN = {
    "10,296": "ten thousand two hundred ninety-six",
    "9,256": "nine thousand two hundred fifty-six",
    "2,847": "two thousand, eight hundred and forty-seven",
    "1,944": "one thousand, nine hundred and forty-four",
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
KIT = "1 - MIDI Drum Kit/"


def five(flat, mark=0):
    return [tuple(flat[i:i + 5]) + (mark,) for i in range(0, len(flat), 5)]


def rolls():
    z = zipfile.ZipFile(ZIP)
    find = lambda folder, part: next(n for n in sorted(z.namelist()) if n.startswith(KIT + folder) and part in n and n.endswith(".mid"))
    read = lambda path, sound=None: T.entry(path[len(KIT):], z.read(path), sound)
    cut = lambda notes, beats: [n for n in notes if n[0] < beats]
    out = {}
    b = json.load(open(os.path.join(PLAYER, "v5", "bounce4.json")))
    out["flat"] = {"bpm": b["bpm"], "beats": b["len"], "notes": five(b["off"]), "file": "A plain beat: kick and 808 on the one and just before bar two, snare on the three, straight hi-hats"}
    out["bounce"] = {"bpm": b["bpm"], "beats": b["len"], "notes": five(b["on"]), "file": f"{KIT}{b['f']}".replace("/", " / ")}
    # the same beat, its hats in the last two beats swapped for a Roll Up fragment
    frag = find("2. Hihat Closed/Roll Up/", "Fragment_10")
    roll = [n for n in five(b["on"]) if not (n[2] == T.HAT and n[0] >= 14)]
    roll += [(n[0] + 14,) + n[1:5] + (1,) for n in five(read(frag, T.HAT)["n"])]
    out["roll"] = {"bpm": b["bpm"], "beats": b["len"], "notes": sorted(roll), "file": f"Complete Beat 13 + {os.path.basename(frag)[:-4]} (2. Hihat Closed / Roll Up)"}
    for rid, folder, part in (("combo", "17. ", "MDK_Beat07_Hats07"), ("beat14", "9. ", "CompleteBeat14_"), ("beat11", "9. ", "CompleteBeat11_")):
        path = find(folder, part)
        e = read(path)
        out[rid] = {"bpm": e["bpm"], "beats": min(e["len"], 16), "notes": cut(five(e["n"]), 16), "file": path.replace("/", " / ")}
    return out


ROLLS = rolls()
DEMOS = {
    "flat": ("NO BOUNCE · a plain beat", RED),
    "bounce": ("BOUNCE · Complete Beat 13 of the kit · 140 BPM", GREEN),
    "roll": ("Complete Beat 13 + a Roll Up fragment in the last bar", YELLOW),
    "combo": (f"Folder 17 · Kick & Snare Beat 07 + Hi-Hats 07 · {ROLLS['combo']['bpm']} BPM", YELLOW),
    "beat14": (f"Complete Beat 14 of the kit · {ROLLS['beat14']['bpm']} BPM", YELLOW),
    "beat11": (f"Complete Beat 11 of the kit · {ROLLS['beat11']['bpm']} BPM", YELLOW),
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
    for t, ln, s, p, v, _ in r["notes"]:
        i, vel = int(t * spb * SR), v / 127
        if s == 0:
            f = 440 * 2 ** ((p - 69 - 24) / 12)
            hold = max(0.12, min(ln * spb, 1.6))
            n = int((hold + 0.1) * SR)
            tt = np.arange(n) / SR
            freq = f * 1.9 ** (1 - np.minimum(tt, 0.035) / 0.035)  # from 1.9 x the note down to it in 35 ms
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
    """The beat on a new RGBA layer, in the Jazz piano roll's look: a line per drum, a playhead at `now` beats."""
    x0, y0, x1, y1 = box
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, 10, fill=PANEL + (255,), outline=RULE, width=2)
    rows = sorted({n[2] for n in r["notes"]})
    lab = 180 if x1 - x0 > 1200 else 120
    top, left, right = y0 + 28, x0 + lab, x1 - 24
    rh = (y1 - 28 - top) / len(rows)
    bx = lambda b: left + (right - left) * b / r["beats"]
    lf = J.font(30 if lab > 150 else 22, 5)
    for k, s in enumerate(rows):
        y = top + k * rh
        if k % 2:
            d.rectangle((left, y, right, y + rh), fill=(17, 15, 12, 255))
        d.text((x0 + 24, y + rh / 2), INST[s], font=lf, fill=J.CREAM if now is None else J.DIM, anchor="lm")
    for q in range(r["beats"] * 4 + 1):
        if q % 4 == 0:
            d.line((bx(q / 4), top, bx(q / 4), y1 - 28), fill=(78, 69, 55) if q % 16 == 0 else RULE, width=2 if q % 16 == 0 else 1)
    pad = max(4, rh * 0.2)
    for t, ln, s, p, v, mark in r["notes"]:
        y = top + rows.index(s) * rh
        w = (ln if s == 0 else min(ln, 0.25)) * (right - left) / r["beats"]
        on = now is not None and t <= now < t + max(ln, 0.14)
        base = YELLOW_HI if mark else color
        shade = 0.5 + 0.5 * v / 127
        fill = (255, 236, 190) if on else tuple(int(c * shade * (1 if now is None or now >= t else 0.55)) for c in base)
        d.rounded_rectangle((bx(t) + 1, y + pad, max(bx(t) + w - 1, bx(t) + 5), y + rh - pad), 3, fill=fill)
    if now is not None:
        d.line((bx(now), top - 6, bx(now), y1 - 22), fill=CREAM, width=3)
    if title:
        d.text(((x0 + x1) / 2, y0 - 34), title[0], font=J.font(34 if lab > 150 else 28, 0), fill=title[1], anchor="ms")
    return layer


# The zip's 17 folders as the video shows them while it talks about them ("mostra le folders mentre ne parli").
FOLDERS = [("1. 808", 178), ("2. Hihat Closed", 263), ("3. Hihat Open", 42), ("4. Kick", 104), ("5. Snare or Clap", 120),
           ("6. Accents (clap, rim, perc)", 76), ("7. Kick and Snare (Multi-Track)", 50), ("8. Kick and 808 (Multi-Track)", 55),
           ("9. Complete Beats (Multi-Track)", 50), ("10. Rolls", 94), ("11. Base Rhythms", 8), ("12. 808 in All 12 Keys", 1958),
           ("13. Kick and 808 in All 12 Keys", 605), ("14. Complete Beats in All 12 Keys", 319), ("15. Kick + Snare Combos", 1944),
           ("16. Kick, 808 + Snare Combos", 1980), ("17. Beats with Hi-Hats", 2450)]
LIT = {"all": range(1, 18), "hand": range(1, 12), "open": [1], "multi": [7, 8, 9], "ready": range(12, 18)}


def folder_icon(d, x, y, s, fill):
    d.rounded_rectangle((x, y + s * 0.18, x + s * 1.25, y + s), 4, fill=fill)
    d.rounded_rectangle((x, y, x + s * 0.55, y + s * 0.4), 3, fill=fill)


def folders(which):
    """The folder list, a window like the landing's tree: the folders `which` names lit, the others dim. `open`
    shows folder 1 opened on its two folders, Patterns and Fragments."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = 300, 26, 1620, 878
    d.rounded_rectangle((x0, y0, x1, y1), 14, fill=PANEL + (255,), outline=RULE, width=2)
    d.text((x0 + 30, y0 + 32), "MIDI Drum Kit Bundle  /  1 - MIDI Drum Kit", font=J.font(28, 5), fill=DIM, anchor="lm")
    rows = list(FOLDERS)
    sub = []
    if which == "open":
        sub = [("1. Patterns", 110), ("2. Fragments", 68)]
        rows = rows[:1] + [None, None] + rows[1:9]
    rh = (y1 - y0 - 80) / len(rows)
    f, fn = J.font(int(min(40, rh * 0.78)), 2), J.font(int(min(34, rh * 0.68)), 5)
    lit = set(LIT[which])
    k_sub = 0
    for k, row in enumerate(rows):
        y = y0 + 64 + k * rh
        if row is None:
            name, n = sub[k_sub]
            k_sub += 1
            on, indent = True, 70
        else:
            name, n = row
            on, indent = int(name.split(".")[0]) in lit, 0
        col = CREAM if on else (70, 64, 54)
        if on and which != "all":
            d.rounded_rectangle((x0 + 16, y + 3, x1 - 16, y + rh - 3), 8, fill=(40, 33, 24, 255))
        s = rh * 0.42
        folder_icon(d, x0 + 34 + indent, y + (rh - s) / 2, s, YELLOW if on else (90, 70, 45))
        d.text((x0 + 34 + indent + s * 1.25 + 18, y + rh / 2), name, font=f, fill=col, anchor="lm")
        d.text((x1 - 36, y + rh / 2), f"{n:,}", font=fn, fill=YELLOW_HI if on else (70, 64, 54), anchor="rm")
    return layer


def card(text):
    """The Jazz video's card in the captions' face, not its serif ("non usare serif font")."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    f = J.font(130, 0)
    while f.getlength(text) > W - 240:
        f = J.font(f.size - 8, 0)
    d.text((W / 2, 440), text, font=f, fill=YELLOW_HI, anchor="ms")
    d.line((W / 2 - 160, 500, W / 2 + 160, 500), fill=YELLOW, width=4)
    return layer


def visual(show):
    """The still layer for a [SHOW], above the captions (None for 'none'). Scenes are the Jazz video's own."""
    kind, _, arg = show.partition(" ")
    if kind in ("none", "image"):
        return J.visual(show)
    if kind == "card":
        return card(arg)
    if kind == "folders":
        return folders(arg)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if kind == "bonus":
        slug, name = BONUSES[int(arg) - 1]
        img = J.fit(J.pub(f"bonus2-{slug}"), 600, 640)
        layer.alpha_composite(img, ((W - img.width) // 2, 80))
        ImageDraw.Draw(layer).text((W / 2, 64), f"BONUS {arg} · {name}", font=J.font(36, 0), fill=YELLOW, anchor="ms")
    elif kind == "roll":
        layer = draw_drums(ROLLS[arg], (260, 110, 1660, 720), DEMOS[arg][1], title=DEMOS[arg])
    elif kind == "compare":
        layer = draw_drums(ROLLS["flat"], (60, 130, 940, 720), RED, title=("NO BOUNCE", RED))
        layer.alpha_composite(draw_drums(ROLLS["bounce"], (980, 130, 1860, 720), GREEN, title=("BOUNCE · Complete Beat 13", GREEN)))
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
    box = (120, 200, 1800, 900)  # the Jazz demos' frame
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
                ImageDraw.Draw(frame).text((W / 2, 980), r["file"], font=J.font(28, 5), fill=DIM, anchor="ms")
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
    """1920x1080 in the Jazz poster's way: the promise alone in the captions' type, one line above Wistia's play button, one below."""
    frame = Image.new("RGB", (W, H), J.INK)
    d = ImageDraw.Draw(frame)
    f = J.font(124, 0)
    space = f.getlength(" ")
    for y, words in ((250, ["Same", "drums."]), (820, ["This", "one", "bounces."])):
        widths = [f.getlength(w) for w in words]
        x = (W - sum(widths) - space * (len(words) - 1)) / 2
        for w, wd in zip(words, widths):
            if w == "bounces.":
                d.rounded_rectangle((x - 18, y - f.size * 0.82, x + wd + 18, y + f.size * 0.28), 10, fill=YELLOW)
            d.text((x, y), w, font=f, fill=J.INK if w == "bounces." else CREAM, anchor="ls")
            x += wd + space
    frame.save(f"{work}/poster.png")
    print(f"{work}/poster.png")


if __name__ == "__main__":
    {"voice": J.voice, "render": render, "poster": poster}[sys.argv[1]](sys.argv[2])
