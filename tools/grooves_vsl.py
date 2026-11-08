"""The Drunk Swing Grooves VSL, from its script to an mp4 (2026-11-08).

Same voice, captions and encoder as the Jazz VSL (tools/jazz_vsl.py, imported);
what differs: the demos are the page's own renders (public/funnels/drunk-swing-grooves/
audio/v2, fluidsynth, not the sine synth) and the pictures are the drum grid the page
draws (hats / snare / kick lanes, quantized or drunk) with a playhead.

  voice   each paragraph of app/(funnels)/drunk-swing-grooves/vsl/script-en.md
          through ElevenLabs, cached in <work>/voice (needs ELEVENLABS_API_KEY)
  render  <work>/grooves-vsl-en.mp4
  poster  <work>/poster.png (not used: the thumbnail is a frame of the video)

usage: /usr/bin/python3 tools/grooves_vsl.py voice|render <work dir>
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jazz_vsl as J  # noqa: E402

ROOT = J.ROOT
PUB = os.path.join(ROOT, "public", "funnels", "drunk-swing-grooves")
J.SCRIPT = os.path.join(ROOT, "app", "(funnels)", "drunk-swing-grooves", "vsl", "script-en.md")
J.SPOKEN = {
    "2,847": "two thousand, eight hundred and forty-seven",
    "211": "two hundred and eleven",
}
W, H, FPS, SR = J.W, J.H, J.FPS, J.SR
INK, CREAM, DIM, Y, RED, GREEN, RULE = J.INK, J.CREAM, J.DIM, J.BRASS, (216, 53, 42), (47, 191, 91), J.RULE
BPM = 90  # Neo Soul Pocket, the beat in every demo
BAR = 4 * 60 / BPM

DEMOS = {  # file: (title, colour, drunk grid?)
    "ab-straight": ("QUANTIZED · Neo Soul Pocket", RED, False),
    "ab-drunk": ("DRUNK · the same 8 bars, Heavy Drunk", GREEN, True),
    "feel-light": ("LIGHT DRUNK · Neo Soul Pocket", Y, True),
    "feel-medium": ("MEDIUM DRUNK · Neo Soul Pocket", Y, True),
    "feel-heavy": ("HEAVY DRUNK · Neo Soul Pocket", Y, True),
    "feel-quintuplet": ("QUINTUPLET SWING · Neo Soul Pocket", Y, True),
    "bonus": ("BONUS · Royal Road keys + bass, Quintuplet Swing", Y, True),
}

# One bar, as the page's GrooveGrid ([currency]/page.tsx): the snare on the grid,
# the hats and the kick moved by a fraction of a 16th.
HATS = [0, 2, 4, 6, 8, 10, 12, 14]
HAT_OFF = [-0.03, 0.26, -0.02, 0.3, -0.04, 0.24, -0.01, 0.28]
KICKS, KICK_OFF = [0, 10], [0.04, 0.2]


def lanes(drunk):
    return [
        ("HATS", [(s + (HAT_OFF[i] if drunk else 0), False) for i, s in enumerate(HATS)]),
        ("SNARE", [(4, True), (12, True)]),
        ("KICK", [(s + (KICK_OFF[i] if drunk else 0), False) for i, s in enumerate(KICKS)]),
    ]


def draw_grid(layer, box, drunk, title=None, color=None, now=None):
    """The grid inside box on layer. now = playhead, 0..1 of the bar."""
    x0, y0, x1, y1 = box
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, 10, fill=(20, 19, 22, 255))
    lx = x0 + 190
    lw = x1 - 30 - lx
    rows = lanes(drunk)
    rh = (y1 - y0 - 60) / len(rows)
    for r, (name, hits) in enumerate(rows):
        top = y0 + 30 + r * rh
        mid = top + rh / 2
        d.text((x0 + 30, mid), name, font=J.font(30, 0), fill=CREAM if name == "SNARE" else DIM, anchor="lm")
        for i in range(17):
            x = lx + lw * i / 16
            d.line((x, top + 8, x, top + rh - 8), fill=(78, 69, 55) if i % 4 == 0 else RULE, width=3 if i % 4 == 0 else 1)
        for step, snare in hits:
            x = lx + lw * step / 16
            lit = now is not None and 0 <= now * 16 - step < 0.9
            fill = (255, 255, 255) if snare else (Y if drunk else (150, 150, 150))
            if now is not None and not lit:
                fill = tuple(int(c * 0.7) for c in fill)
            w = 26 if lit else 20
            d.rounded_rectangle((x - w / 2 + 12, mid - rh * 0.3, x + w / 2 + 12, mid + rh * 0.3), 5, fill=fill)
    if now is not None:
        x = lx + lw * now
        d.line((x, y0 + 20, x, y1 - 20), fill=CREAM, width=3)
    if title:
        d.text(((x0 + x1) / 2, y0 - 30), title, font=J.font(38, 0), fill=color or CREAM, anchor="ms")


def visual(show):
    kind, _, arg = show.partition(" ")
    if kind == "none":
        return None
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if kind == "grid":
        if arg == "both":
            draw_grid(layer, (160, 110, 1760, 430), False, "QUANTIZED", RED)
            draw_grid(layer, (160, 520, 1760, 840), True, "DRUNK · the snare stays put", GREEN)
            return ("small", layer)
        draw_grid(layer, (160, 150, 1760, 720), arg == "drunk",
                  "DRUNK · the snare stays put" if arg == "drunk" else "QUANTIZED", GREEN if arg == "drunk" else RED)
    elif kind == "image":
        img = J.fit(Image.open(f"{PUB}/{arg}.webp").convert("RGBA"), 900, 780)
        layer.alpha_composite(img, ((W - img.width) // 2, 40))
    elif kind == "card":
        d = ImageDraw.Draw(layer)
        d.text((W / 2, 440), arg, font=J.font(120, 0), fill=Y, anchor="ms")
    return ("small", layer)


def demo_pcm(name):
    return np.frombuffer(J.run("ffmpeg", "-v", "error", "-i", f"{PUB}/audio/v2/{name}.mp3", "-f", "f32le", "-ac", "1",
                               "-ar", str(SR), "-"), np.float32)


def timeline(work):
    t, parts = 0.6, []
    for item in J.parse():
        if item[0] == "talk":
            pcm, words = J.voiced(work, item[1])
            parts.append({"kind": "talk", "start": t, "dur": len(pcm) / SR, "pcm": pcm, "words": words, "show": item[2]})
            t += len(pcm) / SR + J.GAP
        else:
            pcm = demo_pcm(item[1])
            t += J.DEMO_GAP - J.GAP
            parts.append({"kind": "demo", "start": t, "dur": len(pcm) / SR, "pcm": pcm, "id": item[1]})
            t += len(pcm) / SR + J.DEMO_GAP
    total = t + 0.8
    voice_track = np.zeros(int(total * SR) + SR, np.float32)
    demo_track = np.zeros_like(voice_track)
    for p in parts:
        i = int(p["start"] * SR)
        (voice_track if p["kind"] == "talk" else demo_track)[i:i + len(p["pcm"])] += p["pcm"]
    mix = voice_track / max(1e-6, np.abs(voice_track).max()) * 0.7 + demo_track / max(1e-6, np.abs(demo_track).max()) * 0.62
    return parts, total, mix


def render(work):
    parts, total, mix = timeline(work)
    np.clip(mix, -1, 1).astype(np.float32).tofile(f"{work}/mix.f32")
    out = f"{work}/grooves-vsl-en.mp4"
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
            st = t - part["start"]
            key = ("demo", part["id"], round((st / BAR % 1) * 64) if 0 <= st < part["dur"] - 0.8 else None)
        else:
            st = t - part["start"]
            cur = max([i for i, w in enumerate(part["words"]) if w[1] <= st] or [0])
            key = ("talk", id(part), cur)
        if key not in cache:
            cache.clear()
            frame = bg.copy()
            if key[0] == "demo":
                title, color, drunk = DEMOS[key[1]]
                draw_grid(frame, (120, 220, 1800, 860), drunk, title, color, None if key[2] is None else key[2] / 64)
            elif key[0] == "talk":
                if part["show"] not in visuals:
                    visuals[part["show"]] = visual(part["show"])
                v = visuals[part["show"]]
                if v is not None:
                    frame.alpha_composite(v[1])
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
    {"voice": J.voice, "render": render}[sys.argv[1]](sys.argv[2])
