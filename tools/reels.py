"""Instagram reels for GRIND STUDIO: infotainment, one-sentence product plug at the end.

Voice: ElevenLabs "Aaron Sage" (eleven_v4) through tools/jazz_vsl.py, the VSLs' voice.
Picture: animated in Remotion, in ~/Desktop/Code Projects/grindstudio-shorts/src/reels
(this tool only makes the soundtrack and the timeline the animation reads).

Script (docs/reels/<name>.md, after the first ---): one paragraph = one voice take, and
  [SHOW: scene]   the scene for the next lines (the Remotion side draws it by name;
                  `product <public/funnels path>` = the end card with that image)
  [DEMO: id]      play a demo with its own animated picture
  [SFX: name]     a sound at the start of the next line (scratch)
  [BED: id]       that demo loops quietly under everything after it
  *word*          a punch-in on that word (zoom, shake, yellow)

Demos: hats-flat / hats-rolled (trap hats synthesized here, 140 bpm, 2 bars),
       ab-straight / ab-drunk (the Drunk Swing Grooves page renders, 2 bars),
       before / after (the Jazz page rolls, 8 beats, the page's sine synth).

usage: /usr/bin/python3 tools/reels.py voice|export <name> <work dir>
  export writes <shorts>/public-reels/<name>.wav, <name>.json and the product image.
"""
import json, os, re, shutil, subprocess, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jazz_vsl as J  # noqa: E402
import grooves_vsl as G  # noqa: E402

ROOT, FPS, SR = J.ROOT, 30, J.SR
SHORTS = os.path.expanduser("~/Desktop/Code Projects/grindstudio-shorts")
OUT = os.path.join(SHORTS, "public-reels")
J.SPOKEN = {
    "2,847": "two thousand, eight hundred and forty-seven",
    "1050": "ten fifty",
    "2 a.m.": "two A M",
}
J.DEMO_BEATS = 8


def parse():
    """[('talk', text, show, sfx, emph word indices) | ('demo', id) | ('bed', id)]"""
    body = open(J.SCRIPT).read().split("\n---\n", 1)[1]
    items, show, sfx = [], "none", None
    for block in [b.strip() for b in body.split("\n\n") if b.strip()]:
        if m := re.fullmatch(r"\[(SHOW|DEMO|SFX|BED): (.+)\]", block):
            kind, arg = m[1], m[2]
            if kind == "SHOW":
                show = arg
            elif kind == "SFX":
                sfx = arg
            else:
                items.append((kind.lower(), arg))
        else:
            words = block.split()
            emph = [i for i, w in enumerate(words) if w.startswith("*")]
            text = " ".join(w.replace("*", "") for w in words)
            items.append(("talk", text, show, sfx, emph))
            sfx = None
    return items


J.parse = lambda: [(i[0], i[1], i[2]) if i[0] == "talk" else i for i in parse() if i[0] != "bed"]

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


def _norm(x):
    return (x / max(1e-9, np.abs(x).max())).astype(np.float32)


def _sounds():
    t = np.arange(int(0.06 * SR)) / SR
    hat = _norm(_hp(_noise(len(t), 1), 3) * np.exp(-t / 0.012))
    t = np.arange(int(0.7 * SR)) / SR
    f = 48 + 90 * np.exp(-t / 0.025)
    kick = _norm(np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t / 0.32))
    t = np.arange(int(0.3 * SR)) / SR
    env = sum(np.where(t >= d, np.exp(-(t - d) / (0.012 if d < 0.02 else 0.09)), 0) for d in (0, 0.009, 0.018))
    clap = _norm(_band(_noise(len(t), 2), 900, 4500) * env)
    return hat, kick, clap


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
        put(s, hat, 0.32 * ((v if rolled else 100) / 127) ** 1.6)
    return out


# ---------------------------------------------------------------- demos

def demo(name):
    """(pcm, seconds of music, picture data) for a demo."""
    if name.startswith("hats-"):
        rolled = name == "hats-rolled"
        hats = ROLLED if rolled else FLAT
        data = {"type": "hats", "len": 32 * STEP, "step": STEP,
                "hats": [[s * STEP, v, s] for s, v in hats], "kicks": [[s * STEP, s] for s in KICKS],
                "claps": [[s * STEP, s] for s in CLAPS]}
        return hats_pcm(rolled), 32 * STEP, data
    if name in G.DEMOS:
        pcm = G.demo_pcm(name)[: int(2 * G.BAR * SR + 0.6 * SR)].copy()
        fade = int(0.6 * SR)
        pcm[-fade:] *= np.linspace(1, 0, fade)
        drunk = G.DEMOS[name][2]
        sx = G.BAR / 16
        lanes = [{"name": n, "hits": [[(b * 16 + s) * sx, b * 16 + s, sn] for b in (0, 1) for s, sn in hits]}
                 for n, hits in G.lanes(drunk)]
        return pcm, 2 * G.BAR, {"type": "grid", "len": 2 * G.BAR, "step": sx, "drunk": drunk, "lanes": lanes}
    pcm, dur = J.piano(name)
    r = J.roll(name)
    spb = 60 / r["bpm"]
    return pcm, dur, {"type": "roll", "len": dur, "spb": spb, "beats": r["beats"],
                      "notes": [[s, l, p] for s, l, p in r["notes"]], "chords": r["chords"]}


# ---------------------------------------------------------------- sound effects

def sfx(name):
    rng = np.random.default_rng(len(name))
    if name == "whoosh":
        n = int(0.32 * SR)
        t = np.arange(n) / SR
        x = rng.standard_normal(n).astype(np.float32)
        # a band sweeping up, done by mixing two crude filters along the way
        lo = np.cumsum(x) / 40
        lo -= np.convolve(lo, np.ones(400) / 400, "same")
        hi = _hp(x, 1)
        mix = lo * (1 - t / t[-1]) + hi * (t / t[-1]) * 0.6
        return _norm(mix * np.sin(np.pi * t / t[-1]) ** 2) * 0.22
    if name == "thump":
        t = np.arange(int(0.18 * SR)) / SR
        f = 70 + 120 * np.exp(-t / 0.02)
        return _norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.06)) * 0.45
    if name == "pop":
        t = np.arange(int(0.08 * SR)) / SR
        f = 900 - 500 * t / t[-1]
        return _norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.02)) * 0.16
    if name == "scratch":
        t = np.arange(int(0.5 * SR)) / SR
        rate = 1 + 0.9 * np.sin(2 * np.pi * 7 * t)
        x = rng.standard_normal(len(t)).astype(np.float32)
        y = _band(x, 300, 3000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * t))) * rate
        return _norm(y * np.exp(-t / 0.35)) * 0.5
    if name == "ding":
        t = np.arange(int(1.2 * SR)) / SR
        y = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((1318, 1), (1976, 0.5), (2637, 0.25)))
        return _norm(y * np.exp(-t / 0.35)) * 0.22
    raise KeyError(name)


# ---------------------------------------------------------------- export

def export(name, work):
    items = parse()
    t, parts, demos, beds, fx = 0.12, [], {}, [], []
    last_show = None
    for item in items:
        if item[0] == "talk":
            text, show, sfx_name, emph = item[1], item[2], item[3], item[4]
            pcm, words = J.voiced(work, text)
            if show != last_show:
                fx.append(("ding" if show.startswith("product") else "whoosh", max(0, t - 0.12)))
                last_show = show
            if sfx_name:
                fx.append((sfx_name, t))
            ws = [{"w": w[0], "s": round(t + w[1], 3), "e": round(t + w[2], 3), "emph": i in emph}
                  for i, w in enumerate(words)]
            for w in ws:
                if w["emph"]:
                    fx.append(("thump", w["s"]))
            parts.append({"kind": "talk", "start": t, "dur": len(pcm) / SR, "show": show, "words": ws, "pcm": pcm})
            t += len(pcm) / SR + 0.18
        elif item[0] == "demo":
            pcm, dur, data = demo(item[1])
            demos[item[1]] = data
            fx.append(("whoosh", max(0, t - 0.1)))
            last_show = None
            t += 0.12
            parts.append({"kind": "demo", "id": item[1], "start": t, "dur": dur, "pcm": pcm})
            t += dur + 0.3
        else:
            pcm, dur, data = demo(item[1])
            demos[item[1]] = data
            beds.append({"id": item[1], "start": t, "period": dur, "pcm": pcm})
    total = t + 1.6
    # pictures for the comparison scenes need both sides
    for a, b in (("hats-flat", "hats-rolled"), ("ab-straight", "ab-drunk"), ("before", "after")):
        if a in demos or b in demos:
            for x in (a, b):
                demos.setdefault(x, demo(x)[2])
    n = int(total * SR) + SR
    voice_t, demo_t, fx_t = (np.zeros(n, np.float32) for _ in range(3))
    for p in parts:
        i = int(p["start"] * SR)
        (voice_t if p["kind"] == "talk" else demo_t)[i:i + len(p["pcm"])] += p["pcm"]
    peak = max(1e-6, np.abs(demo_t).max())
    for b in beds:
        loop = b["pcm"][: int(b["period"] * SR)]
        i = int(b["start"] * SR)
        while i < n:
            seg = loop[: n - i]
            demo_t[i:i + len(seg)] += seg * 0.3
            i += len(loop)
        fade = int(1.2 * SR)
        end = int(total * SR)
        demo_t[end - fade:end] *= np.linspace(1, 0, fade)
        demo_t[end:] = 0
        b["end"] = total
    for kind, at in fx:
        x = sfx(kind)
        i = int(at * SR)
        fx_t[i:i + len(x)] += x[: n - i]
    mix = voice_t / max(1e-6, np.abs(voice_t).max()) * 0.7 + demo_t / peak * 0.6 + fx_t
    mix = mix[: int(total * SR)]
    os.makedirs(OUT, exist_ok=True)
    raw = f"{work}/mix.f32"
    np.clip(mix, -1, 1).astype(np.float32).tofile(raw)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", f"{OUT}/{name}.wav"], check=True)
    product = None
    for p in parts:
        if p["kind"] == "talk" and p["show"].startswith("product "):
            path = p["show"].split(" ", 1)[1]
            product = f"{name}-product.webp"
            shutil.copy(os.path.join(ROOT, "public", "funnels", path + ".webp"), f"{OUT}/{product}")
            p["show"] = "product"
    for p in parts:
        p.pop("pcm")
    for b in beds:
        b.pop("pcm")
    json.dump({"name": name, "total": total, "frames": int(total * FPS), "parts": parts, "demos": demos,
               "beds": beds, "product": product}, open(f"{OUT}/{name}.json", "w"), indent=1)
    print(f"{OUT}/{name}.json", f"{total:.1f}s")


if __name__ == "__main__":
    cmd, name, work = sys.argv[1:4]
    J.SCRIPT = os.path.join(ROOT, "docs", "reels", f"{name}.md")
    os.makedirs(work, exist_ok=True)
    {"voice": lambda: J.voice(work), "export": lambda: export(name, work)}[cmd]()
