"""French / Italian VSL caption video, in the style of the English one: black screen,
2-4 words centred, the word being said in a red box, the coming ones dim.
Frames are drawn once per word (Pillow), then timed with ffmpeg's concat
demuxer; the Travis Scott clip is the original video; audio = full.wav.

usage: python tools/vsl_captions.py <work dir> <Roboto.ttf> public/funnels/midi-drum-kit [--lang fr|it] [--redraw]

The work dir holds what the voiceover step made (see
app/(funnels)/midi-drum-kit/vsl/script-fr.md / script-it.md): segments.json (written and
spoken text per paragraph, clip_after), wav/NN.wav (each paragraph,
loudness-normalised), align/NN.json (ElevenLabs forced alignment of each),
full.wav (the whole track, clip included) and original-1080p.mp4 (the
English VSL from Wistia, for the Travis Scott clip). Needs Pillow and ffmpeg.
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

D, FONT, IMG = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 1920, 1080
BG = (11, 11, 11)
WHITE = (245, 245, 245)
DIM = (62, 62, 62)
RED = (208, 2, 27)
SIZE = 76
GAP, CLIP_GAP = 0.45, 0.3
CLIP_FROM, CLIP_TO = 149.95, 165.82
LANG = sys.argv[sys.argv.index("--lang") + 1] if "--lang" in sys.argv else "fr"
FRAMES = f"{D}/frames-{LANG}"
os.makedirs(FRAMES, exist_ok=True)

font = ImageFont.truetype(FONT, SIZE)
font.set_variation_by_name("Bold")
space = font.getlength(" ")

seg = json.load(open(f"{D}/segments.json"))
clip_after = seg["clip_after"]
dur = lambda f: float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))

# Spoken spellings back to the written words on screen.
BACK = {
    "fr": {"Graïnde": "GRIND", "huit-zéro-huit,": "808,", "A-Sap": "A$AP"},
    "it": {"Grind": "GRIND", "Twentyone": "21", "quattrocentonovantasette": "497", "milleduecentocinquanta": "1.250", "A-Sap": "A$AP"},
}[LANG]
# Where the product pictures come in: (paragraph, its first words, picture) per language.
# Italian has no picture of the kit itself (2026-11-04, "non la far vedere proprio questa
# immagine del midi drum kit"): the bonuses and the closing boxes only.
ANCHORS = {
    "fr": [(11, ["la", "sortie"], "product"), (12, ["Bonus", "numéro", "un"], "bonus-famous"), (13, ["Bonus", "numéro", "deux"], "bonus-starters"),
           (14, ["bonus", "numéro", "trois"], "bonus-drums"), (16, ["Mais"], "boxes-all")],
    "it": [(12, ["Bonus", "numero", "uno"], "bonus-famous"), (13, ["Bonus", "numero", "due"], "bonus-starters"),
           (14, ["bonus", "numero", "tre"], "bonus-drums"), (16, ["Ma"], "boxes-all")],
}[LANG]
OUT = {"fr": "VSL-FR-Anatole.mp4", "it": "VSL-IT-MarcoTrox.mp4"}[LANG]

# ── words with absolute times ─────────────────────────────────
words = []  # {t, s, e, seg}
t0 = 0.0
clip_start = None
for i in range(len(seg["spoken"])):
    al = json.load(open(f"{D}/align/{i:02d}.json"))["words"]
    toks = []
    for w in al:
        txt = w["text"].strip()
        if not txt:
            continue
        # French spaces before ? ! : ; » : glue the mark to the word before it.
        if toks and all(c in "?!:;»…" for c in txt):
            toks[-1]["t"] += " " + txt
            toks[-1]["e"] = t0 + w["end"]
            continue
        toks.append({"t": txt, "s": t0 + w["start"], "e": t0 + w["end"], "seg": i})
    for k, w in enumerate(toks):
        w["t"] = BACK.get(w["t"], w["t"])
        if w["t"].rstrip(",.") == "Studio" and k and toks[k - 1]["t"] == "GRIND":
            w["t"] = "STUDIO" + w["t"][6:]
    words += toks
    t0 += dur(f"{D}/wav/{i:02d}.wav")
    if i == clip_after:
        clip_start = t0 + CLIP_GAP
        t0 = clip_start + (CLIP_TO - CLIP_FROM) + CLIP_GAP
    elif i + 1 < len(seg["spoken"]):
        t0 += GAP
total = dur(f"{D}/full.wav")

# ── chunks of 2-4 words, broken at punctuation ───────────────
def width(ws):
    return sum(font.getlength(w["t"]) for w in ws) + space * (len(ws) - 1)

chunks, cur = [], []
for w in words:
    if cur and (len(cur) >= 4 or width(cur + [w]) > 1500 or w["seg"] != cur[-1]["seg"]):
        chunks.append(cur)
        cur = []
    cur.append(w)
    if w["t"][-1] in ".,?!:;»" and len(cur) >= 2 or w["t"][-1] in ".?!":
        chunks.append(cur)
        cur = []
if cur:
    chunks.append(cur)

# ── product pictures at the bottom (offer and bonuses) ───────
def first(seg_i, starts_with):
    for k, w in enumerate(words):
        norm = lambda t: "".join(c for c in t.lower() if c.isalnum())
        if w["seg"] == seg_i and [norm(x["t"]) for x in words[k:k + len(starts_with)]] == [norm(x) for x in starts_with]:
            return w["s"]
    raise SystemExit(f"not found: {starts_with} in {seg_i}")

PICS = sorted((first(s, ws), name) for s, ws, name in ANCHORS)
pic_cache = {}

def picture(t):
    name = None
    for at, n in PICS:
        if t >= at:
            name = n
    if not name:
        return None
    if name not in pic_cache:
        im = Image.open(f"{IMG}/{name}.webp").convert("RGBA")
        h = 330 if name != "boxes-all" else 300
        im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
        if im.width > 1700:
            im = im.resize((1700, int(im.height * 1700 / im.width)), Image.LANCZOS)
        pic_cache[name] = im
    return pic_cache[name]

# ── frames ────────────────────────────────────────────────────
def frame(chunk, k, t, path):
    img = Image.new("RGB", (W, H), BG)
    pic = picture(t)
    y = H // 2 - SIZE // 2 - (70 if pic else 0)
    dr = ImageDraw.Draw(img)
    x = (W - width(chunk)) / 2
    for j, w in enumerate(chunk):
        wl = font.getlength(w["t"])
        if j == k:
            asc, desc = font.getmetrics()
            dr.rounded_rectangle([x - 12, y - 6, x + wl + 12, y + asc + desc - 4], radius=6, fill=RED)
        dr.text((x, y), w["t"], font=font, fill=WHITE if j <= k else DIM)
        x += wl + space
    if pic:
        img.paste(pic, ((W - pic.width) // 2, H - pic.height - 60), pic)
    img.save(path)

# One state per word: from its start to the next word's start (or the clip / the end).
states = []  # (start, end, file)
n = 0
for c, chunk in enumerate(chunks):
    for k, w in enumerate(chunk):
        nxt = chunk[k + 1]["s"] if k + 1 < len(chunk) else (chunks[c + 1][0]["s"] if c + 1 < len(chunks) else total)
        if w["s"] < clip_start <= nxt:
            nxt = clip_start
        f = f"{FRAMES}/{n:05d}.png"
        n += 1
        if not os.path.exists(f) or "--redraw" in sys.argv:
            frame(chunk, k, w["s"], f)
        states.append((w["s"], nxt, f))

blank = f"{FRAMES}/blank.png"
Image.new("RGB", (W, H), BG).save(blank)

FPS = 30
clip_end = clip_start + (CLIP_TO - CLIP_FROM)
fa, fb = round(clip_start * FPS), round(clip_end * FPS)  # first clip frame, first frame after it
fz = round(total * FPS)

def sequence(name, first_frame, last_frame):
    """One symlinked PNG per output frame (30 fps): the word state on screen at that instant."""
    seq = f"{D}/{name}"
    subprocess.run(["rm", "-rf", seq])
    os.makedirs(seq)
    j = 0
    for fr in range(first_frame, last_frame):
        t = fr / FPS
        while j + 1 < len(states) and states[j + 1][0] <= t:
            j += 1
        f = states[j][2] if states[j][0] <= t < states[j][1] else blank
        os.symlink(f, f"{seq}/{fr - first_frame:06d}.png")
    return seq

enc = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS)]
run = lambda *args: subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)
run("-framerate", str(FPS), "-i", f"{sequence('seqA', 0, fa)}/%06d.png", *enc, f"{D}/partA.mp4")
# The original cuts to the Travis video at 150.1 s, a little after his audio
# starts: hold its first frame until then. Only its vertical panel (x 634-1286),
# so no English caption shows at the sides.
CUT = 150.1
run("-ss", f"{CUT}", "-i", f"{D}/original-1080p.mp4", "-an", "-frames:v", str(fb - fa),
    "-vf", f"crop=652:1080:634:0,pad=1920:1080:634:0:color=0x0b0b0b,tpad=start_mode=clone:start_duration={CUT - CLIP_FROM:.3f}",
    *enc, f"{D}/clip.mp4")
run("-framerate", str(FPS), "-i", f"{sequence('seqB', fb, fz)}/%06d.png", *enc, f"{D}/partB.mp4")
with open(f"{D}/parts.txt", "w") as fh:
    fh.write(f"file '{D}/partA.mp4'\nfile '{D}/clip.mp4'\nfile '{D}/partB.mp4'\n")
out = f"{D}/{OUT}"
run("-f", "concat", "-safe", "0", "-i", f"{D}/parts.txt", "-i", f"{D}/full.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out)
print("chunks", len(chunks), "frames", n, "clip at", round(clip_start, 2), "total", round(total, 2), "->", out)
