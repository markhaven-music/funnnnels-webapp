"""The Jazz MIDI Pack VSL, from its script to an mp4.

  voice   each paragraph of app/(funnels)/jazz-midi-pack/vsl/script-en.md
          through ElevenLabs (with word timings), cached in <work>/voice
  render  the soundtrack (voice + the [DEMO] files played on the warm sine
          synth the page uses, piano.ts) and the picture (captions in the style
          of the Drum Kit VSL: the word being said in a box, the coming ones
          dim; the [SHOW] visuals above them; full-screen piano rolls with a
          playhead during the demos), encoded with ffmpeg
  poster  the thumbnail shown on the page until the player loads

usage: python tools/jazz_vsl.py voice|render|poster <work dir>
Needs Pillow, numpy and ffmpeg; `voice` needs ELEVENLABS_API_KEY.
"""
import base64, hashlib, json, os, re, subprocess, sys, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
JAZZ = os.path.join(ROOT, "app", "(funnels)", "jazz-midi-pack")
PUB = os.path.join(ROOT, "public", "funnels", "jazz-midi-pack")
SCRIPT = os.path.join(JAZZ, "vsl", "script-en.md")
# "Aaron Sage - Friendly & Conversational", picked by the user on 2026-11-01 over the
# generated "Matter of fact Producer" (xAsWBWOYOkb6aUNS79oD), which sounded "robotic and weird"
VOICE = "ZEBslWM12xCQWILoQtiP"
MODEL = "eleven_v4"
SETTINGS = {"stability": 0.5, "similarity_boost": 0.75}

SR = 44100
FPS = 30
W, H = 1920, 1080
GAP, DEMO_GAP = 0.4, 0.7
DEMO_BEATS = 16  # longer files are cut to their first 16 beats

INK = (14, 12, 9)
CREAM = (243, 235, 220)
DIM = (90, 82, 70)
BRASS = (226, 169, 59)
BRASS_HI = (246, 213, 138)
RED = (196, 85, 60)
GREEN = (63, 209, 107)
RULE = (51, 45, 36)

AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
DIDOT = "/System/Library/Fonts/Supplemental/Didot.ttc"
font = lambda size, i=0: ImageFont.truetype(AVENIR, size, index=i)  # 0 Bold, 2 Demi Bold, 5 Medium
serif = lambda size, i=2: ImageFont.truetype(DIDOT, size, index=i)

DEMOS = {
    "before": ("BEFORE · Root position", RED),
    "after": ("AFTER · Best Voicing", GREEN),
    "neosoul": ("Neo Soul loop · I–vi–ii–V · C · 88 bpm", BRASS),
    "lofi": ("Lofi loop · Autumn Leaves type · Gm · 82 bpm", BRASS),
    "bossa": ("Bossa Nova · Tritone Turnaround · C · 135 bpm", BRASS),
}
# Numbers the voice misreads as digits ("2,847" came out "two thousand and
# forty-seven"): it gets these words, the captions show the digits again.
SPOKEN = {
    "2,847": "two thousand, eight hundred and forty-seven",
    "3,536": "three thousand, five hundred and thirty-six",
    "2,304": "two thousand, three hundred and four",
    "1,548": "one thousand, five hundred and forty-eight",
}
BONUSES = ["MIDI Chord Pack (Jazz Edition)", "The Chord Progressions Bible", "Anime & Video Games MIDI Pack",
           "Emotional Keys MIDI Bundle", "Drum Loops for Songwriting"]


def parse():
    """The script as a list of ('talk', text, show) and ('demo', id)."""
    body = open(SCRIPT).read().split("\n---\n", 1)[1]
    items, show = [], "none"
    for block in [b.strip() for b in body.split("\n\n") if b.strip()]:
        if m := re.fullmatch(r"\[DEMO: (\w+)\]", block):
            items.append(("demo", m[1]))
        elif m := re.fullmatch(r"\[SHOW: (.+)\]", block):
            show = m[1]
        else:
            items.append(("talk", " ".join(block.split()), show))
    return items


def spoken(text):
    for digits, words in SPOKEN.items():
        text = text.replace(digits, words)
    return text


def run(*cmd, data=None):
    return subprocess.run(cmd, input=data, capture_output=True, check=True).stdout


# ---------------------------------------------------------------- voice

def voice(work):
    key = os.environ["ELEVENLABS_API_KEY"]
    os.makedirs(f"{work}/voice", exist_ok=True)
    talks = [i[1] for i in parse() if i[0] == "talk"]
    for n, text in enumerate(talks):
        h = hashlib.sha1(f"{VOICE}{MODEL}{SETTINGS}{spoken(text)}".encode()).hexdigest()[:10]
        out = f"{work}/voice/{h}.json"
        if os.path.exists(out):
            continue
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
            json.dumps({"text": spoken(text), "model_id": MODEL, "voice_settings": SETTINGS,
                        "previous_text": spoken(talks[n - 1]) if n else None,
                        "next_text": spoken(talks[n + 1]) if n + 1 < len(talks) else None}).encode(),
            {"xi-api-key": key, "Content-Type": "application/json"})
        d = json.load(urllib.request.urlopen(req, timeout=300))
        open(f"{work}/voice/{h}.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
        json.dump({"text": text, "alignment": d["alignment"]}, open(out, "w"))
        print(f"voiced {n + 1}/{len(talks)}: {text[:50]}")


def voiced(work, text):
    h = hashlib.sha1(f"{VOICE}{MODEL}{SETTINGS}{spoken(text)}".encode()).hexdigest()[:10]
    a = json.load(open(f"{work}/voice/{h}.json"))["alignment"]
    pcm = np.frombuffer(run("ffmpeg", "-v", "error", "-i", f"{work}/voice/{h}.mp3", "-f", "f32le", "-ac", "1",
                            "-ar", str(SR), "-"), np.float32)
    words, cur = [], None
    for ch, s, e in zip(a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]):
        if ch.isspace():
            cur = None
        elif cur is None:
            cur = [ch, s, e]
            words.append(cur)
        else:
            cur[0] += ch
            cur[2] = e
    for digits, said in SPOKEN.items():  # back to digits, one caption word
        said = said.split()
        for i in range(len(words) - len(said) + 1):
            got = [w[0] for w in words[i:i + len(said)]]
            if got[:-1] == said[:-1] and got[-1].startswith(said[-1]):
                words[i:i + len(said)] = [[digits + got[-1][len(said[-1]):], words[i][1], words[i + len(said) - 1][2]]]
                break
    return pcm, words


# ---------------------------------------------------------------- piano

ROLLS = json.load(open(os.path.join(JAZZ, "rolls.json")))


def roll(rid):
    """The demo's notes cut to DEMO_BEATS, with unisons merged as the page's player does."""
    r = ROLLS[rid]
    beats = min(r["beats"], DEMO_BEATS)
    notes = []
    for s, l, p in r["notes"]:
        if s >= beats:
            continue
        l = min(l, beats - s)
        twin = next((m for m in notes if m[2] == p and abs(m[0] - s) < 0.06), None)
        if twin:
            twin[1] = max(twin[1], l)
        else:
            notes.append([s, l, p])
    chords = [c for c in r["chords"] if c[0] < beats]
    return {"bpm": r["bpm"], "beats": beats, "notes": notes, "chords": chords, "file": r["file"]}


# The page's synth (piano.ts): per note two sines 5 cents apart, under C3 a
# quiet 2nd and 3rd; 18 ms attack, a slow fall to 62 %, a 0.11 s release.
UPPER = [(1, 0.5), (2 ** (5 / 1200), 0.5)]
BASS = [(1, 0.42), (2 ** (5 / 1200), 0.42), (2, 0.12), (3, 0.04)]


def piano(rid):
    r = roll(rid)
    spb = 60 / r["bpm"]
    dur = r["beats"] * spb
    out = np.zeros(int((dur + 1.2) * SR), np.float32)
    for s, l, p in r["notes"]:
        hold = max(l * spb, 0.12)
        n = int((hold + 0.8) * SR)
        t = np.arange(n) / SR
        f = 440 * 2 ** ((p - 69) / 12)
        tone = sum(lv * np.sin(2 * np.pi * f * ratio * t) for ratio, lv in (BASS if p < 48 else UPPER))
        vel = 0.3 if p < 48 else 0.2
        env = vel * (0.62 + 0.38 * np.exp(-np.maximum(t - 0.018, 0) / 0.4))
        env = np.where(t < 0.018, vel * t / 0.018, env)
        k = int(hold * SR)
        env[k:] = env[k] * np.exp(-(t[k:] - t[k]) / 0.11)
        i = int(s * spb * SR)
        out[i:i + n] += (tone * env).astype(np.float32)[: len(out) - i]
    return out, dur


# ---------------------------------------------------------------- pictures

def fit(img, bw, bh):
    r = min(bw / img.width, bh / img.height)
    return img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)


def cover(img):
    """img filling the frame, cropped from the left (the box sits on the right)."""
    r = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    return img.crop((img.width - W, (img.height - H) // 2, img.width, (img.height - H) // 2 + H))


def pub(name):
    return Image.open(f"{PUB}/{name}.webp").convert("RGBA")


def draw_roll(r, box, color=BRASS, trace=None, title=None, now=None):
    """A piano roll of r inside box on a new RGBA layer. now = playhead in beats."""
    x0, y0, x1, y1 = box
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, 10, fill=(22, 19, 15, 255), outline=RULE, width=2)
    lo = min(p for _, _, p in r["notes"]) - 2
    hi = max(p for _, _, p in r["notes"]) + 2
    top = y0 + 70
    rh = (y1 - 20 - top) / (hi - lo + 1)
    bx = lambda b: x0 + 20 + (x1 - x0 - 40) * b / r["beats"]
    py = lambda p: top + (hi - p) * rh
    for p in range(lo, hi + 1):  # black-key rows a shade darker
        if p % 12 in (1, 3, 6, 8, 10):
            d.rectangle((x0 + 20, py(p), x1 - 20, py(p) + rh), fill=(17, 15, 12, 255))
    for b in range(r["beats"] + 1):
        d.line((bx(b), top, bx(b), y1 - 20), fill=RULE if b % 4 else (78, 69, 55), width=1 if b % 4 else 2)
    cf = font(30, 2)
    for i, (b, name) in enumerate(r["chords"]):
        nb = r["chords"][i + 1][0] if i + 1 < len(r["chords"]) else r["beats"]
        on = now is not None and b <= now < nb
        d.text((bx(b) + 10, y0 + 18), str(name), font=cf, fill=BRASS_HI if on else (CREAM if now is None else DIM))
    for s, l, p in r["notes"]:
        on = now is not None and s <= now < s + l
        fill = (255, 236, 190) if on else (color if now is None or now >= s else tuple(int(c * 0.55) for c in color))
        d.rounded_rectangle((bx(s) + 1, py(p) + 1, max(bx(s + l) - 1, bx(s) + 4), py(p) + rh - 1), 3, fill=fill)
    if trace:  # the top note of each chord, joined
        pts = []
        for i, (b, _) in enumerate(r["chords"]):
            nb = r["chords"][i + 1][0] if i + 1 < len(r["chords"]) else r["beats"]
            topn = max(p for s, l, p in r["notes"] if b <= s < nb)
            pts.append(((bx(b) + bx(nb)) / 2, py(topn) + rh / 2))
        d.line(pts, fill=trace, width=6, joint="curve")
        for x, y in pts:
            d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=trace)
    if now is not None:
        x = bx(now)
        d.line((x, top - 6, x, y1 - 20), fill=CREAM, width=3)
    if title:
        d.text(((x0 + x1) / 2, y0 - 34), title[0], font=font(34, 0), fill=title[1], anchor="ms")
    return layer


def visual(show):
    """The still layer for a [SHOW], above the captions (None for 'none')."""
    kind, _, arg = show.partition(" ")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if kind == "none":
        return None
    if kind == "image":
        img = pub(arg)
        if img.width > img.height:  # a scene: fill the frame, darken where the captions sit
            layer.paste(cover(img), (0, 0))
            fade = np.zeros((H, W, 4), np.uint8)
            fade[..., 3] = np.clip((np.arange(H)[:, None] - 560) * 0.9, 0, 235).astype(np.uint8)
            layer = Image.alpha_composite(layer, Image.fromarray(fade))
        else:
            img = fit(img, 900, 700)
            layer.alpha_composite(img, ((W - img.width) // 2, 50))
    elif kind == "bonus":
        img = fit(pub(f"bonus-{arg}-640"), 600, 640)
        layer.alpha_composite(img, ((W - img.width) // 2, 80))
        d = ImageDraw.Draw(layer)
        d.text((W / 2, 64), f"BONUS {arg} · {BONUSES[int(arg) - 1]}", font=font(36, 0), fill=BRASS, anchor="ms")
    elif kind == "card":
        d = ImageDraw.Draw(layer)
        d.text((W / 2, 420), arg, font=serif(132), fill=BRASS_HI, anchor="ms")
        d.line((W / 2 - 160, 480, W / 2 + 160, 480), fill=BRASS, width=3)
    elif kind == "roll":
        layer = draw_roll(roll(arg), (260, 110, 1660, 720), RED if arg == "before" else GREEN,
                          title=DEMOS[arg])
    elif kind == "compare":
        layer = draw_roll(roll("before"), (60, 130, 940, 720), RED, trace=CREAM, title=DEMOS["before"])
        layer.alpha_composite(draw_roll(roll("after"), (980, 130, 1860, 720), GREEN, trace=CREAM, title=DEMOS["after"]))
    return layer


def chunks(words):
    """Caption lines: up to 4 words / 22 characters, broken after punctuation (a comma only after 2+ words)."""
    out, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        text = " ".join(words[j][0] for j in cur)
        if len(cur) >= 4 or len(text) > 22 or (w[0][-1] in ".:?!;" or w[0][-1] == "," and len(cur) > 1) or i == len(words) - 1:
            out.append(cur)
            cur = []
    return out


def caption(words, line, current, big):
    """The caption layer: line = word indices, current = the one being said."""
    f = font(92 if big else 66, 0)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    space = f.getlength(" ")
    widths = [f.getlength(words[j][0]) for j in line]
    x = (W - sum(widths) - space * (len(line) - 1)) / 2
    y = H / 2 + 30 if big else 940
    pad = 14
    for j, w in zip(line, widths):
        if j == current:
            d.rounded_rectangle((x - pad, y - f.size * 0.82, x + w + pad, y + f.size * 0.28), 8, fill=BRASS)
            d.text((x, y), words[j][0], font=f, fill=INK, anchor="ls")
        else:
            d.text((x, y), words[j][0], font=f, fill=CREAM if j < current else DIM, anchor="ls")
        x += w + space
    return layer


# ---------------------------------------------------------------- render

def timeline(work):
    """Every item with its start time and audio, and the whole soundtrack."""
    t, parts = 0.6, []
    for item in parse():
        if item[0] == "talk":
            pcm, words = voiced(work, item[1])
            parts.append({"kind": "talk", "start": t, "dur": len(pcm) / SR, "pcm": pcm, "words": words,
                          "show": item[2]})
            t += len(pcm) / SR + GAP
        else:
            pcm, dur = piano(item[1])
            t += DEMO_GAP - GAP
            parts.append({"kind": "demo", "start": t, "dur": dur + 0.6, "pcm": pcm, "id": item[1]})
            t += dur + 0.6 + DEMO_GAP
    total = t + 0.8
    voice_track = np.zeros(int(total * SR) + SR, np.float32)
    piano_track = np.zeros_like(voice_track)
    for p in parts:
        i = int(p["start"] * SR)
        (voice_track if p["kind"] == "talk" else piano_track)[i:i + len(p["pcm"])] += p["pcm"]
    # each at its own loudness: the voice's peak at -3 dB, the piano a little under it
    mix = voice_track / max(1e-6, np.abs(voice_track).max()) * 0.7 + piano_track / max(1e-6, np.abs(piano_track).max()) * 0.6
    return parts, total, mix


def render(work):
    parts, total, mix = timeline(work)
    np.clip(mix, -1, 1).astype(np.float32).tofile(f"{work}/mix.f32")
    out = f"{work}/jazz-vsl-en.mp4"
    enc = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", f"{work}/mix.f32",
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-movflags", "+faststart",
         "-shortest", out], stdin=subprocess.PIPE)
    bg = Image.new("RGBA", (W, H), INK + (255,))
    visuals, cache = {}, {}
    rolls = {p["id"]: roll(p["id"]) for p in parts if p["kind"] == "demo"}
    static_demo = {rid: draw_roll(r, (120, 200, 1800, 900), DEMOS[rid][1], title=DEMOS[rid]) for rid, r in rolls.items()}
    for n in range(int(total * FPS)):
        t = n / FPS
        part = next((p for p in parts if p["start"] - GAP / 2 <= t < p["start"] + p["dur"] + GAP / 2), None)
        if part is None:
            key = ("blank",)
        elif part["kind"] == "demo":
            r = rolls[part["id"]]
            now = (t - part["start"]) * r["bpm"] / 60
            key = ("demo", part["id"], round(now * 8) if 0 <= now < r["beats"] else None)
        else:
            words = part["words"]
            st = t - part["start"]
            cur = max([i for i, w in enumerate(words) if w[1] <= st] or [0])
            key = ("talk", id(part), cur)
        if key not in cache:
            cache.clear()
            frame = bg.copy()
            if key[0] == "demo":
                r = rolls[key[1]]
                if key[2] is None:
                    frame.alpha_composite(static_demo[key[1]])
                else:
                    frame.alpha_composite(draw_roll(r, (120, 200, 1800, 900), DEMOS[key[1]][1], title=DEMOS[key[1]],
                                                    now=key[2] / 8))
                ImageDraw.Draw(frame).text((W / 2, 980), r["file"], font=font(28, 5), fill=DIM, anchor="ms")
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
        if n % (FPS * 30) == 0:
            print(f"{t:6.1f}s / {total:.1f}s")
    enc.stdin.close()
    enc.wait()
    print(out, f"{total:.1f}s")


def poster(work):
    """1920×1080: the stage scene and the promise, above where the page puts its play button."""
    frame = Image.new("RGBA", (W, H), INK + (255,))
    stage = pub("stage-2200")
    frame.alpha_composite(cover(stage))
    d = ImageDraw.Draw(frame)
    d.text((110, 200), "Same chords.", font=serif(124), fill=CREAM, anchor="ls")
    d.text((110, 336), "Played like a pianist.", font=serif(116, 1), fill=BRASS_HI, anchor="ls")
    frame.convert("RGB").save(f"{work}/poster.png")
    print(f"{work}/poster.png")


if __name__ == "__main__":
    {"voice": voice, "render": render, "poster": poster}[sys.argv[1]](sys.argv[2])
