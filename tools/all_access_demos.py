"""Audio demos for the All Access upsell's "Press play" (2026-11-16: "le demo Jazz MIDI Pack non mi piacciono,
mostra i file migliori lofi, trap soul", "usa un suono che si sente meglio da mobile").

Real files from the packs, rendered to mp3 so they play loud and full on a phone speaker (the page's sine
synth was too thin): chords on the Salamander grand the Jazz page uses (public/funnels/jazz-midi-pack/piano,
one sample every 3 semitones, pitched by resampling), bass as a warm synth with upper harmonics (phones
can't play the fundamental) or, in Trap Soul, Grind Studio's own 808; drums from the file's own drum track on
Grind Studio's own one-shots (the same kit as tools/drum_kit_wav.py). Genre loop files carry no tempo: the
bpm is the one in the file name. A light bus compressor, then normalised to -1 dBFS.

Run:  <python with mido soundfile numpy scipy> -I tools/all_access_demos.py <out dir>
      (needs the packs on the Desktop, the T7 drive for the drum sounds, and ffmpeg)
"""
import glob
import os
import re
import subprocess
import sys
import tempfile

import mido
import numpy as np
import soundfile as sf

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
PIANO = os.path.join(HERE, "..", "public", "funnels", "jazz-midi-pack", "piano")
GR = "/Volumes/T7/Dropbox/FFUNK/Tripwires Companies/Grind Studio/02. All products"
HM = f"{GR}/1. MIDI Drum Kit - Bundle 1.1 (Updated)/4 - BONUS - Hit-Making Drums - Drumkit"
DB = f"{GR}/5. DopaBounce™ Ultimate Drums (Launch)/1. DopaBounce™ Ultimate Drums/selezione da drums mie, soundmasters e blackcotopus/1. How It would look like in folders/11. Neuro-808s"
KIT = {
    36: (f"{HM}/kick/GRKick01.wav", 0.95),
    38: (f"{HM}/snare/GRSnare01.wav", 0.75),
    40: (f"{HM}/snare/GRSnare01.wav", 0.75),
    39: (f"{HM}/clap/CLAP 1.wav", 0.65),
    37: (f"{HM}/rim/GRRim01.wav", 0.5),
    42: (f"{HM}/hihat/GRhihat01.wav", 0.38),
    44: (f"{HM}/hihat/GRhihat01.wav", 0.38),
    46: (f"{HM}/hihat/OPEN HAT 1.wav", 0.35),
}
EIGHT08 = f"{DB}/MRK_808_C_001.wav"  # C1 = MIDI 36

V1 = os.path.expanduser("~/Desktop/Jazz MIDI Pack/5 Genre Loops (chords bass drums)")
V2 = os.path.expanduser("~/Desktop/Jazz MIDI Pack Vol. 2/5 Genre Loops (chords bass drums)")
# (out name, folder glob) — the packs number their progressions best-sounding first.
LOOPS = [
    ("jazz-lofi", f"{V1}/1 Lofi Hip Hop/01 *"),
    ("jazz-trapsoul", f"{V1}/3 Trap Soul/12 *"),
    ("vol2-lofi", f"{V2}/*Lofi*/01 *"),
    ("vol2-trapsoul", f"{V2}/*Trap Soul/04 *"),
]


def load(path):
    a, sr = sf.read(path, dtype="float32", always_2d=True)
    a = a.mean(axis=1)
    if sr != SR:
        a = np.interp(np.arange(0, len(a) * SR / sr) * sr / SR, np.arange(len(a)), a).astype(np.float32)
    return a


def mp3(path):
    with tempfile.NamedTemporaryFile(suffix=".wav") as t:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), t.name], check=True)
        return load(t.name)


_piano = {}


def piano_note(p, vel, hold):
    names = ["C", "Ds", "Fs", "A"]
    base = 21 + round((min(max(p, 21), 93) - 21) / 3) * 3
    name = f"{names[[0, 3, 6, 9].index(base % 12)]}{base // 12 - 1}"
    if name not in _piano:
        _piano[name] = mp3(os.path.join(PIANO, f"{name}.mp3"))
    s = _piano[name]
    ratio = 2 ** ((p - base) / 12)
    n = int(min(len(s) / ratio, (hold + 0.9) * SR))
    out = np.interp(np.arange(n) * ratio, np.arange(len(s)), s).astype(np.float32)
    k = int(hold * SR)
    if k < n:
        out[k:] *= np.exp(-np.arange(n - k) / SR / 0.18)
    return out * (vel / 127) ** 1.3


def synth_bass(p, vel, hold):
    n = int((hold + 0.25) * SR)
    t = np.arange(n) / SR
    f = 440 * 2 ** ((p - 69) / 12)
    tone = sum(a * np.sin(2 * np.pi * f * h * t) for h, a in ((1, 1.0), (2, 0.55), (3, 0.3), (4, 0.15)))
    env = np.minimum(1, t / 0.006) * (0.55 + 0.45 * np.exp(-t / 0.25))
    k = int(hold * SR)
    env[k:] *= np.exp(-(t[k:] - t[k]) / 0.06)
    return np.tanh(1.4 * tone * env).astype(np.float32) * 0.5 * (vel / 127)


_808 = None


def bass_808(p, vel, hold):
    global _808
    if _808 is None:
        _808 = load(EIGHT08)
    ratio = 2 ** ((p - 36) / 12)
    n = int(min(len(_808) / ratio, (hold + 0.15) * SR))
    out = np.interp(np.arange(n) * ratio, np.arange(len(_808)), _808).astype(np.float32)
    # the 808's upper harmonics, so a phone hears the note
    out = np.tanh(2.2 * out) * 0.7
    k = int(hold * SR)
    if k < n:
        out[k:] *= np.exp(-np.arange(n - k) / SR / 0.05)
    return out * (vel / 127)


_kit = {}


def hit(p, vel):
    path, g = KIT.get(p, KIT[37])
    if path not in _kit:
        _kit[path] = load(path)
    return _kit[path] * g * (vel / 127)


def notes(track, tpb):
    """[(start beat, length beats, pitch, velocity)] of a track."""
    t, on, out = 0, {}, []
    for m in track:
        t += m.time
        if m.type == "note_on" and m.velocity:
            on[m.note] = (t, m.velocity)
        elif m.type in ("note_off", "note_on") and m.note in on:
            s, v = on.pop(m.note)
            out.append((s / tpb, (t - s) / tpb, m.note, v))
    return out


def place(buf, x, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i]
    buf[i : i + len(x)] += x


def render(full_mid, bpm, trap):
    mid = mido.MidiFile(full_mid)
    spb = 60 / bpm
    beats = max(max((s + l for s, l, _, _ in notes(t, mid.ticks_per_beat)), default=0) for t in mid.tracks)
    beats = min(int(np.ceil(beats / 4) * 4), 32)  # 8 bars at most: a demo, not the file
    out = np.zeros(int((beats * spb + 2) * SR), np.float32)
    chords, bass, drums = (np.zeros_like(out) for _ in range(3))
    for tr in mid.tracks:
        name = tr.name.lower()
        for s, l, p, v in notes(tr, mid.ticks_per_beat):
            if "drum" in name:
                place(drums, hit(p, v), s * spb)
            elif "bass" in name:
                place(bass, (bass_808 if trap else synth_bass)(p, v, l * spb), s * spb)
            else:
                place(chords, piano_note(p, v, l * spb), s * spb)
    mix = 0.9 * chords + 0.75 * bass + 0.8 * drums
    return mix[: int((beats * spb + 1.5) * SR)]


def master(x):
    # gentle bus compression (RMS follower), then -1 dBFS
    env = np.sqrt(np.convolve(x**2, np.ones(1024) / 1024, mode="same")) + 1e-6
    thr = np.percentile(env, 70)
    gain = np.where(env > thr, (thr / env) ** 0.5, 1.0)
    y = np.tanh(1.2 * x * gain)
    fade = int(1.2 * SR)
    y[-fade:] *= np.linspace(1, 0, fade)
    return (y / np.max(np.abs(y)) * 0.89).astype(np.float32)


def write(name, y, out_dir):
    wav = os.path.join(out_dir, f"{name}.wav")
    sf.write(wav, y, SR)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-af", "loudnorm=I=-13:TP=-1:LRA=9", "-ar", "44100", "-ac", "1", "-b:a", "112k", os.path.join(out_dir, f"{name}.mp3")], check=True)
    os.remove(wav)
    print(name, f"{len(y) / SR:.1f}s")


TOP_HITS = os.path.join(HERE, "..", "app", "(funnels)", "top-hits-chords", "rolls.json")


def render_roll(roll):
    """A TOP HITS file as the page has it (rolls.json: first 8 bars, notes [beat, length, pitch]) on the
    piano, its lowest note of each chord doubled by the synth bass an octave down."""
    spb = 60 / roll["bpm"]
    beats = min(roll["beats"], 32)
    out = np.zeros(int((beats * spb + 2) * SR), np.float32)
    starts = {}
    for s, l, p in roll["notes"]:
        if s >= beats:
            continue
        place(out, 0.9 * piano_note(p, 92, min(l, beats - s) * spb), s * spb)
        if s not in starts or p < starts[s][1]:
            starts[s] = (min(l, beats - s), p)
    for s, (l, p) in starts.items():
        place(out, 0.7 * synth_bass(p - 12, 100, l * spb), s * spb)
    return out[: int((beats * spb + 1.5) * SR)]


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for name, pattern in LOOPS:
        folder = sorted(glob.glob(pattern))[0]
        full = glob.glob(os.path.join(folder, "*Full.mid"))[0]
        bpm = int(re.search(r"(\d+)bpm", folder).group(1))
        print(os.path.basename(folder))
        write(name, master(render(full, bpm, "Trap Soul" in folder)), out_dir)
    import json
    rolls = json.load(open(TOP_HITS))
    for key in ("blinding", "killbill"):
        write(f"tophits-{key}", master(render_roll(rolls[key])), out_dir)


if __name__ == "__main__":
    main(sys.argv[1])
