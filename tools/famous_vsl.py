"""The Famous Beats Bundle VSL, from its script to an mp4 (2026-11-10, "metti la VSL").

Same voice, captions and encoder as the Jazz VSL (tools/jazz_vsl.py, imported). What differs:
  - before / after: four bars of Polo G "Martin And Gina" (Famous Beats Vol.20) played on the same
    kit (Grind Studio's own Hit-Making Drums one-shots): `after` = the file's notes as they are,
    `before` = the same bars "copied by eye": hats on straight eighths, every hit at one velocity,
    no rolls, no ghost notes. The picture is the drum roll the page draws (lanes, height = velocity,
    yellow = off the 16th grid) with a playhead.
  - the other demos are the pack's own previews (public/funnels/famous-beats-bundle/beats), with
    that file's own notes on screen bar by bar.

  prep    reads the notes out of the bundle zip (on the T7 drive) and renders before/after -> <work>/demo
  voice   ElevenLabs, cached in <work>/voice (needs ELEVENLABS_API_KEY)
  render  <work>/famous-vsl-en.mp4

usage: /usr/bin/python3 tools/famous_vsl.py prep|voice|render <work dir>
"""
import json, os, struct, subprocess, sys, zipfile
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jazz_vsl as J  # noqa: E402

ROOT = J.ROOT
PUB = os.path.join(ROOT, "public", "funnels", "famous-beats-bundle")
JPUB = os.path.join(ROOT, "public", "funnels", "jazz-midi-pack")
J.SCRIPT = os.path.join(ROOT, "app", "(funnels)", "famous-beats-bundle", "vsl", "script-en.md")
# Longest first: "320" before "32".
J.SPOKEN = {
    "4,360": "four thousand, three hundred and sixty",
    "2,847": "two thousand, eight hundred and forty-seven",
    "2,304": "two thousand, three hundred and four",
    "2,067": "two thousand and sixty-seven",
    "1,548": "one thousand, five hundred and forty-eight",
    "320": "three hundred and twenty",
    "305": "three hundred and five",
    "163": "one hundred and sixty-three",
    "808": "eight-oh-eight",
}
W, H, FPS, SR = J.W, J.H, J.FPS, J.SR
INK, CREAM, DIM, Y, RULE = J.INK, J.CREAM, J.DIM, J.BRASS, J.RULE
RED, GREEN = (216, 53, 42), (47, 191, 91)

ZIP = "/Volumes/T7/fbb-build/Famous Beats Bundle (320 MIDI Beats).zip"
KIT = ("/Volumes/T7/Dropbox/FFUNK/Tripwires Companies/Grind Studio/02. All products/"
       "2. MIDI Drum Kit PRO MAX Bundle (1050 Drum Patterns)/4. BONUS - Hit-Making Drums - Drumkit")
SAMPLES = {"k": "kick/GRKick01.wav", "s": "clap/CLAP 1.wav", "r": "rim/GRRim01.wav",
           "h": "hihat/ClosedHat05.wav", "o": "hihat/OPEN HAT 1.wav"}
LANES = [("h", "HATS"), ("o", "OPEN HAT"), ("s", "CLAP"), ("r", "RIM"), ("k", "KICK")]
MG = "FamousBeats20_94_PoloG_MartinAndGina.mid"
FILES = {"01-01154drakegodsplan": "FamousBeats01_154_Drake_GodsPlan.mid",
         "01-01117roddyricchthebox": "FamousBeats01_117_RoddyRicch_TheBox.mid"}
DEMOS = {
    "before": ("BEFORE · copied by eye · Martin And Gina · 94 BPM", RED),
    "after": ("AFTER · the file from the pack · Martin And Gina · 94 BPM", GREEN),
    "01-01154drakegodsplan": ("Gods Plan · Drake · 154 BPM", Y),
    "01-01117roddyricchthebox": ("The Box · Roddy Ricch · 117 BPM", Y),
}
BONUS = [  # the page's order (_v2/words.ts) and covers
    ("ESSENTIAL MIDI Drum Patterns", f"{PUB}/bonus-essential-640.webp"),
    ("MIDI Chord Pack (Jazz Edition)", f"{JPUB}/bonus-1-640.webp"),
    ("Emotional Keys MIDI Bundle", f"{JPUB}/bonus-4-640.webp"),
    ("Drum Loops for Songwriting", f"{JPUB}/bonus-5-640.webp"),
    ("The Chord Progressions Bible", f"{JPUB}/bonus-2-640.webp"),
    ("Anime & Video Games MIDI Pack", f"{JPUB}/bonus-3-640.webp"),
]


# ---------------------------------------------------------------- MIDI

def vlq(b, i):
    v = 0
    while True:
        c = b[i]; i += 1; v = (v << 7) | (c & 0x7F)
        if not c & 0x80: return v, i


def lane(name):
    n = name.upper()
    if "KICK" in n: return "k"
    if "OPEN" in n: return "o"
    if "RIM" in n or "SNARE" in n: return "r" if "CLAP" not in n or "RIM" in n else "s"
    if "CLAP" in n: return "s"
    if "HAT" in n or n in ("HH",): return "h"
    return "r"


def notes_of(name):
    """[beat, lane, velocity] of every hit in the multi-track file."""
    zf = zipfile.ZipFile(ZIP)
    path = next(n for n in zf.namelist() if n.endswith("/" + name) and "/03 - " not in n and "/04 - " not in n)
    d = zf.read(path)
    _, ntr, div = struct.unpack(">HHH", d[8:14]); i = 14; out = []
    for _ in range(ntr):
        L = struct.unpack(">I", d[i + 4:i + 8])[0]; b = d[i + 8:i + 8 + L]; i += 8 + L
        j = tick = 0; rs = None; nm = ""
        while j < len(b):
            dt, j = vlq(b, j); tick += dt; st = b[j]
            if st == 0xFF:
                ty = b[j + 1]; ln, k = vlq(b, j + 2)
                if ty == 3: nm = b[k:k + ln].decode("latin1")
                j = k + ln; continue
            if st in (0xF0, 0xF7): ln, k = vlq(b, j + 1); j = k + ln; continue
            if st & 0x80: rs = st; j += 1
            if rs & 0xF0 in (0xC0, 0xD0): j += 1; continue
            a, v = b[j], b[j + 1]; j += 2
            if rs & 0xF0 == 0x90 and v > 0: out.append([round(tick / div, 4), lane(nm), v])
    return sorted(out)


def by_eye(notes):
    """What a copy from a paused video keeps: hats as straight eighths, the big hits on the
    16th grid, one velocity, no rolls, no rim ghosts."""
    out = [[b / 2, "h", 100] for b in range(int(max(n[0] for n in notes) * 2) + 1)]
    for b, l, v in notes:
        if l in ("k", "s", "o"):
            q = round(b * 4) / 4
            if not any(x[0] == q and x[1] == l for x in out):
                out.append([q, l, 100])
    return sorted(out)


def render_kit(notes, bpm, beats):
    kit = {k: np.frombuffer(J.run("ffmpeg", "-v", "error", "-i", f"{KIT}/{f}", "-f", "f32le", "-ac", "1",
                                  "-ar", str(SR), "-"), np.float32) for k, f in SAMPLES.items()}
    spb = 60 / bpm
    out = np.zeros(int((beats * spb + 1.5) * SR), np.float32)
    for b, l, v in notes:
        if b >= beats: continue
        s = kit[l] * (v / 127) ** 1.6 * (0.55 if l in ("h", "o") else 1.0)
        i = int(b * spb * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out / max(1e-6, np.abs(out).max()) * 0.9


def prep(work):
    os.makedirs(f"{work}/demo", exist_ok=True)
    mg = [[b - 4, l, v] for b, l, v in notes_of(MG) if 4 <= b < 20]  # bars 2-5: the kick comes in at beat 4
    data = {"after": {"bpm": 94, "beats": 16, "notes": mg}, "before": {"bpm": 94, "beats": 16, "notes": by_eye(mg)}}
    for k in ("before", "after"):
        render_kit(data[k]["notes"], 94, 16).tofile(f"{work}/demo/{k}.f32")
    for bid, f in FILES.items():
        data[bid] = {"bpm": int(f.split("_")[1]), "beats": 64, "notes": notes_of(f)}
    json.dump(data, open(f"{work}/demo/notes.json", "w"))
    print("prep:", {k: len(v["notes"]) for k, v in data.items()})


# ---------------------------------------------------------------- pictures

def draw_roll(layer, box, notes, bar, title=None, color=None, now=None):
    """One bar (4 beats from `bar` * 4) of `notes` inside box. now = playhead, 0..1 of the bar."""
    x0, y0, x1, y1 = box
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, 10, fill=(20, 19, 22, 255))
    seen = [l for l, _ in LANES if any(n[1] == l for n in notes)]
    lx, lw = x0 + 210, x1 - 40 - (x0 + 210)
    rh = (y1 - y0 - 50) / max(1, len(seen))
    for r, l in enumerate(seen):
        top = y0 + 25 + r * rh
        d.text((x0 + 30, top + rh / 2), dict(LANES)[l], font=J.font(28, 0), fill=DIM, anchor="lm")
        d.rectangle((lx, top + 6, lx + lw, top + rh - 6), fill=(8, 8, 9))
        for i in range(17):
            x = lx + lw * i / 16
            d.line((x, top + 6, x, top + rh - 6), fill=(70, 70, 70) if i % 4 == 0 else (34, 34, 36), width=2 if i % 4 == 0 else 1)
        for b, ln, v in notes:
            at = b - bar * 4
            if ln != l or not 0 <= at < 4: continue
            x = lx + lw * at / 4
            off = abs(b * 4 - round(b * 4)) > 0.04
            h = (rh - 16) * max(0.15, v / 127)
            lit = now is not None and 0 <= now * 4 - at < 0.12
            fill = Y if off else (255, 255, 255) if lit else (200, 200, 200)
            d.rectangle((x, top + rh - 6 - h, x + (14 if lit else 10), top + rh - 6), fill=fill)
    if now is not None:
        x = lx + lw * now
        d.line((x, y0 + 14, x, y1 - 14), fill=CREAM, width=3)
    if title:
        d.text(((x0 + x1) / 2, y0 - 26), title, font=J.font(36, 0), fill=color or CREAM, anchor="ms")


def song_list():
    beats = json.load(open(f"{PUB}/beats/beats.json"))
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((W / 2, 110), "320 songs · 76 artists · 32 packs", font=J.font(54, 0), fill=Y, anchor="ms")
    pick = [b for i, b in enumerate(beats) if i % 9 == 0][:33]
    for i, b in enumerate(pick):
        c, r = divmod(i, 11)
        x, y = 140 + c * 560, 180 + r * 50
        d.text((x, y), f"{b['song']}", font=J.font(30, 0), fill=CREAM)
        d.text((x, y + 30), "", font=J.font(1, 0))
        tw = d.textlength(b["song"], font=J.font(30, 0))
        d.text((x + tw + 14, y + 4), f"{b['artist']} · {b['bpm']}", font=J.font(24, 5), fill=DIM)
    return layer


def visual(show, demo):
    kind, _, arg = show.partition(" ")
    if kind == "none":
        return None
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if kind == "roll":
        draw_roll(layer, (160, 140, 1760, 720), demo[arg]["notes"], 1, *DEMOS[arg])
    elif kind == "compare":
        draw_roll(layer, (160, 90, 1760, 410), demo["before"]["notes"], 1, "BEFORE · copied by eye", RED)
        draw_roll(layer, (160, 500, 1760, 820), demo["after"]["notes"], 1, "AFTER · the file: rolls, velocity, off-grid hats", GREEN)
    elif kind == "image":
        img = J.fit(Image.open(f"{PUB}/{arg}.webp").convert("RGBA"), 1500 if arg.startswith("daw") else 900, 780)
        layer.alpha_composite(img, ((W - img.width) // 2, 40))
    elif kind == "bonus":
        name, path = BONUS[int(arg) - 1]
        img = J.fit(Image.open(path).convert("RGBA"), 560, 640)
        layer.alpha_composite(img, ((W - img.width) // 2, 60))
        d.text((W / 2, 760), f"BONUS {arg} · {name}", font=J.font(40, 0), fill=Y, anchor="ms")
    elif kind == "list":
        return song_list()
    elif kind == "card":
        d.text((W / 2, 440), arg, font=J.font(120, 0), fill=Y, anchor="ms")
    return layer


# ---------------------------------------------------------------- render

def demo_pcm(work, name):
    if name in ("before", "after"):
        return np.fromfile(f"{work}/demo/{name}.f32", np.float32)
    return np.frombuffer(J.run("ffmpeg", "-v", "error", "-i", f"{PUB}/beats/{name}.mp3", "-f", "f32le", "-ac", "1",
                               "-ar", str(SR), "-"), np.float32)


def timeline(work):
    t, parts = 0.6, []
    for item in J.parse():
        if item[0] == "talk":
            pcm, words = J.voiced(work, item[1])
            parts.append({"kind": "talk", "start": t, "dur": len(pcm) / SR, "pcm": pcm, "words": words, "show": item[2]})
            t += len(pcm) / SR + J.GAP
        else:
            pcm = demo_pcm(work, item[1])
            t += J.DEMO_GAP - J.GAP
            parts.append({"kind": "demo", "start": t, "dur": len(pcm) / SR, "pcm": pcm, "id": item[1]})
            t += len(pcm) / SR + J.DEMO_GAP
    total = t + 0.8
    voice_track = np.zeros(int(total * SR) + SR, np.float32)
    demo_track = np.zeros_like(voice_track)
    for p in parts:
        i = int(p["start"] * SR)
        (voice_track if p["kind"] == "talk" else demo_track)[i:i + len(p["pcm"])] += p["pcm"]
    mix = voice_track / max(1e-6, np.abs(voice_track).max()) * 0.7 + demo_track / max(1e-6, np.abs(demo_track).max()) * 0.6
    return parts, total, mix


def render(work):
    demo = json.load(open(f"{work}/demo/notes.json"))
    parts, total, mix = timeline(work)
    np.clip(mix, -1, 1).astype(np.float32).tofile(f"{work}/mix.f32")
    out = f"{work}/famous-vsl-en.mp4"
    enc = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", f"{work}/mix.f32",
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-movflags", "+faststart",
         "-shortest", out], stdin=subprocess.PIPE)
    bg = Image.new("RGBA", (W, H), INK + (255,))
    visuals, cache = {}, {}
    for n in range(int(total * FPS)):
        t = n / FPS
        part = next((p for p in parts if p["start"] - J.GAP / 2 <= t < p["start"] + p["dur"] + J.GAP / 2), None)
        if part is None:
            key = ("blank",)
        elif part["kind"] == "demo":
            dm = demo[part["id"]]
            bar_s = 4 * 60 / dm["bpm"]
            st = max(0.0, t - part["start"])
            bar = min(int(st // bar_s), dm["beats"] // 4 - 1)
            key = ("demo", part["id"], bar, round((st / bar_s % 1) * 64))
        else:
            st = t - part["start"]
            cur = max([i for i, w in enumerate(part["words"]) if w[1] <= st] or [0])
            key = ("talk", id(part), cur)
        if key not in cache:
            cache.clear()
            frame = bg.copy()
            if key[0] == "demo":
                title, color = DEMOS[key[1]]
                draw_roll(frame, (120, 200, 1800, 880), demo[key[1]]["notes"], key[2], title, color, key[3] / 64)
            elif key[0] == "talk":
                if part["show"] not in visuals:
                    visuals[part["show"]] = visual(part["show"], demo)
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


if __name__ == "__main__":
    {"prep": prep, "voice": J.voice, "render": render}[sys.argv[1]](sys.argv[2])
