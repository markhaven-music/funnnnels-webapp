"""The Jazz MIDI Pack Vol. 2 upsell video, from its script to an mp4 (2026-11-16, "Sì, vai live").

tools/jazz_vsl.py, imported and pointed at Vol. 2 (as tools/drum_kit_vsl.py does for the Drum Kit): the same warm
black, cream captions with the word being said in the yellow box, the same voice. What differs: the demos are
Vol. 2's genre loops (public/funnels/jazz-midi-pack/vol2-v1), played with their bass and their own drums
(synthesised like piano.ts' beat), and the poster says the page's promise.

usage: /usr/bin/python3 tools/jazz_vol2_vsl.py voice|render|poster <work dir>    (voice needs ELEVENLABS_API_KEY)
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jazz_vsl as J  # noqa: E402

J.SCRIPT = os.path.join(J.JAZZ, "vsl", "script-upsell-vol2-en.md")
PREVIEWS = os.path.join(J.PUB, "vol2-v1")
J.SPOKEN = {"Vol. 2": "Volume Two", "82": "eighty-two", "12": "twelve", "lofi": "lo-fi"}

# id: (progression number, preview, caption over the roll)
PICKS = {
    "neosoul": (2, "neosoul", "Neo Soul loop · Rhodes Ballad · F · 88 bpm"),
    "gospel": (23, "neosoul", "Gospel · 7-3-6-2-5-1 · C · 88 bpm"),
    "citypop": (61, "lofihiphop", "City pop · Sunset · D · 82 bpm"),
    "blues": (43, "lofihiphop", "Blues · 12 bars with ninths · A · 82 bpm"),
}
J.DEMOS = {k: (v[2], J.BRASS) for k, v in PICKS.items()}
J.ROLLS = {k: json.load(open(os.path.join(PREVIEWS, f"{n:02d}.json")))[style] for k, (n, style, _) in PICKS.items()}

_roll = J.roll


def roll(rid):
    r = _roll(rid)
    r["drums"] = [d for d in J.ROLLS[rid].get("drums", []) if d[0] < r["beats"]]
    return r


J.roll = roll
_piano = J.piano
NOISE = np.random.default_rng(7).uniform(-1, 1, J.SR).astype(np.float32)


def hit(out, at, pitch):
    """One drum hit, as piano.ts synthesises the beat: a falling sine for the kick, shaped noise for the rest."""
    sr = J.SR
    if pitch in (35, 36):
        n = int(0.3 * sr)
        t = np.arange(n) / sr
        f = 48 + (140 - 48) * np.exp(-t / 0.04)
        x = np.sin(2 * np.pi * np.cumsum(f) / sr) * 0.8 * np.exp(-t / 0.07)
    else:
        long_ = {38: 0.14, 37: 0.07, 39: 0.12, 40: 0.14, 42: 0.035, 44: 0.035, 46: 0.22}.get(pitch)
        if long_ is None:
            return
        n = int((long_ + 0.02) * sr)
        t = np.arange(n) / sr
        x = NOISE[:n].copy()
        if pitch in (42, 44, 46):  # hats: the highs only
            x = x - np.convolve(x, np.ones(4) / 4, mode="same")
            amp = 0.22 if pitch == 46 else 0.18
        else:  # snare, rim, clap: the body
            x = np.convolve(x, np.ones(3) / 3, mode="same")
            amp = 0.42
        x = x * amp * np.exp(-t / (long_ / 3))
    i = int(at * sr)
    out[i:i + len(x)] += x[: max(0, len(out) - i)].astype(np.float32)


def piano(rid):
    out, dur = _piano(rid)
    r = roll(rid)
    spb = 60 / r["bpm"]
    for b, p in r["drums"]:
        hit(out, b * spb, p)
    return out, dur


J.piano = piano


def poster(work):
    """The page's promise in the captions' type: one line above Wistia's play button, one below."""
    frame = Image.new("RGB", (J.W, J.H), J.INK)
    d = ImageDraw.Draw(frame)
    f = J.font(118, 0)
    space = f.getlength(" ")
    for y, words in ((250, ["82", "more", "chords"]), (820, ["that", "give", "you", "chills."])):
        widths = [f.getlength(w) for w in words]
        x = (J.W - sum(widths) - space * (len(words) - 1)) / 2
        for w, wd in zip(words, widths):
            if w == "chills.":
                d.rounded_rectangle((x - 18, y - f.size * 0.82, x + wd + 18, y + f.size * 0.28), 10, fill=J.BRASS)
            d.text((x, y), w, font=f, fill=J.INK if w == "chills." else J.CREAM, anchor="ls")
            x += wd + space
    frame.save(f"{work}/poster.png")
    print(f"{work}/poster.png")


_render = J.render


def render(work):
    _render(work)
    os.replace(f"{work}/jazz-vsl-en.mp4", f"{work}/jazz-vol2-vsl-en.mp4")
    print(f"{work}/jazz-vol2-vsl-en.mp4")


if __name__ == "__main__":
    {"voice": J.voice, "render": render, "poster": poster}[sys.argv[1]](sys.argv[2])
