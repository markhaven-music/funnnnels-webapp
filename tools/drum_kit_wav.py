"""MIDI Drum Kit → WAV loops (2026-11-16, "MIDI Drum Kit wav version", the landing pop-up add-on).

Renders every MIDI file of the kit (1 - MIDI Drum Kit, 1,040 files) with Grind Studio's own one-shots
into a WAV loop with the same name and folder: 44.1 kHz, 24-bit, stereo, whole bars, the tail of the
last hits wrapped round to the start so the loop plays seamlessly, peak at -1 dBFS.

Each MIDI track is one instrument, told by its name (Kick, Snare/Rim/Clap, Close Hihat, Open Hihat,
808…) or, for one-track files, by the kit folder. Note 60 plays the sample as it is; other notes pitch it
by semitones (the kit's hats rolls and 808 lines). The 808 follows the notes' lengths and is
monophonic; a closed hat chokes the open hat.

  venv/bin/python -I tools/drum_kit_wav.py <kit "1 - MIDI Drum Kit" dir> <out dir> [--only N] [--files a.mid,b.mid]
"""

import argparse
import os
import sys

import mido
import numpy as np
import soundfile as sf
from scipy.signal import resample

SR = 44100
GR = "/Volumes/T7/Dropbox/FFUNK/Tripwires Companies/Grind Studio/02. All products"
HM = f"{GR}/1. MIDI Drum Kit - Bundle 1.1 (Updated)/4 - BONUS - Hit-Making Drums - Drumkit"
DB = f"{GR}/5. DopaBounce™ Ultimate Drums (Launch)/1. DopaBounce™ Ultimate Drums/selezione da drums mie, soundmasters e blackcotopus/1. How It would look like in folders/11. Neuro-808s"

# The kit: Grind Studio's own sounds only (GR…/MRK_… and the Hit-Making Drums bonus).
KIT = {
    "kick": (f"{HM}/kick/GRKick01.wav", 1.0),
    "snare": (f"{HM}/snare/GRSnare01.wav", 0.8),
    "clap": (f"{HM}/clap/CLAP 1.wav", 0.7),
    "hat": (f"{HM}/hihat/GRhihat01.wav", 0.42),
    "open": (f"{HM}/hihat/OPEN HAT 1.wav", 0.4),
    "perc": (f"{HM}/perc/GRPerc01.wav", 0.5),
    "rim": (f"{HM}/rim/GRRim01.wav", 0.55),
    "808": (f"{DB}/MRK_808_C_001.wav", 0.85),
}

# One-track files: the instrument by the kit folder.
FOLDER = {
    "1. 808": "808",
    "2. Hihat Closed": "hat",
    "3. Hihat Open": "open",
    "4. Kick": "kick",
    "5. Snare or Clap": "snare",
    "6. Accents (clap, rim, perc)": "clap",
    "10. Rolls": "hat",
    "11. Base Rhythms": "hat",
}


def instrument(track_name: str, folder: str) -> str | None:
    n = track_name.lower()
    if "808" in n or "bass" in n:
        return "808"
    if "open" in n:
        return "open"
    if "hat" in n or "hh" in n:
        return "hat"
    if "kick" in n:
        return "kick"
    if "clap" in n and "snare" not in n:
        return "clap"
    if "rim" in n and "snare" not in n:
        return "rim"
    if "snare" in n:
        return "snare"
    if "perc" in n or "accent" in n or "fragment" in n or "tom" in n:
        return "perc"
    # No crash among Grind Studio's own sounds: the open hat plays the cymbal lines.
    if "cymbal" in n or "crash" in n or "ride" in n:
        return "open"
    if "piano" in n:
        return None
    return FOLDER.get(folder)


def load(path: str) -> np.ndarray:
    a, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != SR:
        a = resample(a, int(len(a) * SR / sr))
    if a.shape[1] == 1:
        a = np.repeat(a, 2, axis=1)
    return a[:, :2]


SAMPLES = {}


def sample(inst: str) -> np.ndarray:
    if inst not in SAMPLES:
        SAMPLES[inst] = load(KIT[inst][0])
    return SAMPLES[inst]


def pitched(a: np.ndarray, semis: int) -> np.ndarray:
    if semis == 0:
        return a
    return resample(a, max(1, int(round(len(a) / 2 ** (semis / 12)))))


def notes_of(mid: mido.MidiFile):
    """(start_s, end_s, note, vel, track_index, track_name) and the file's length in seconds and ticks."""
    tempo_map = []  # (tick, tempo)
    for t in mid.tracks:
        tick = 0
        for m in t:
            tick += m.time
            if m.type == "set_tempo":
                tempo_map.append((tick, m.tempo))
    tempo_map.sort()
    if not tempo_map or tempo_map[0][0] > 0:
        tempo_map.insert(0, (0, tempo_map[0][1] if tempo_map else 500000))
    tpb = mid.ticks_per_beat

    def secs(tick):
        s, last_tick, last_tempo = 0.0, 0, tempo_map[0][1]
        for tt, tempo in tempo_map:
            if tt >= tick:
                break
            s += (tt - last_tick) * last_tempo / 1e6 / tpb
            last_tick, last_tempo = tt, tempo
        return s + (tick - last_tick) * last_tempo / 1e6 / tpb

    out, max_tick = [], 0
    for ti, t in enumerate(mid.tracks):
        name = next((m.name for m in t if m.type == "track_name"), "")
        tick, on = 0, {}
        for m in t:
            tick += m.time
            if m.type == "note_on" and m.velocity > 0:
                on.setdefault(m.note, []).append((tick, m.velocity))
            elif m.type in ("note_off", "note_on") and m.note in on and on[m.note]:
                st, v = on[m.note].pop(0)
                out.append((st, tick, m.note, v, ti, name))
                max_tick = max(max_tick, tick)
        for n, lst in on.items():
            for st, v in lst:
                out.append((st, st + tpb // 4, n, v, ti, name))
                max_tick = max(max_tick, st + tpb // 4)
    bar = tpb * 4
    loop_ticks = max(bar, -(-max_tick // bar) * bar)
    # A pattern that ends a hair past the bar line (a late note-off) keeps its bars.
    if max_tick - (loop_ticks - bar) <= tpb // 8 and loop_ticks > bar:
        loop_ticks -= bar
    starts = [(secs(a), secs(b), n, v, ti, nm) for a, b, n, v, ti, nm in out]
    return starts, secs(loop_ticks), tempo_map[0][1]


def render(path: str, folder: str) -> np.ndarray | None:
    mid = mido.MidiFile(path)
    notes, length, _ = notes_of(mid)
    if not notes:
        return None
    n = int(round(length * SR))
    buf = np.zeros((n * 2, 2), dtype=np.float32)  # room for tails, wrapped after
    by_inst: dict[str, list] = {}
    for st, en, note, vel, ti, name in notes:
        inst = instrument(name, folder)
        if inst:
            by_inst.setdefault(inst, []).append((st, en, note, vel))
    opens = sorted(st for st, *_ in by_inst.get("open", []))
    closes = sorted(st for st, *_ in by_inst.get("hat", []))
    for inst, lst in by_inst.items():
        lst.sort()
        gain = KIT[inst][1]
        for i, (st, en, note, vel) in enumerate(lst):
            s = pitched(sample(inst), note - 60) * gain * (vel / 127) ** 1.1
            a = int(round(st * SR))
            stop = None
            if inst == "808":
                nxt = lst[i + 1][0] if i + 1 < len(lst) else None
                stop = min(en, nxt) if nxt is not None else en
            elif inst == "open":
                nxt = next((c for c in closes if c > st), None)
                stop = nxt
            elif inst == "hat":
                pass
            seg = s
            if stop is not None:
                k = max(1, int(round((stop - st) * SR)))
                if k < len(seg):
                    seg = seg[:k].copy()
                    f = min(len(seg), int(0.012 * SR))
                    seg[-f:] *= np.linspace(1, 0, f)[:, None]
            seg = seg[: len(buf) - a]
            buf[a : a + len(seg)] += seg
    out = buf[:n].copy()
    out[: n] += buf[n : 2 * n]  # wrap the tails to the start: a seamless loop
    peak = float(np.max(np.abs(out))) or 1.0
    return out * (10 ** (-1 / 20) / peak)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("kit")
    p.add_argument("out")
    p.add_argument("--files", default="")
    a = p.parse_args()
    want = set(f for f in a.files.split(",") if f)
    done = 0
    for dp, _, fs in os.walk(a.kit):
        for f in sorted(fs):
            if not f.endswith(".mid") or (want and f not in want):
                continue
            rel = os.path.relpath(dp, a.kit)
            folder = rel.split(os.sep)[0]
            wav = render(os.path.join(dp, f), folder)
            if wav is None:
                print("skip (no notes)", rel, f)
                continue
            od = os.path.join(a.out, rel)
            os.makedirs(od, exist_ok=True)
            sf.write(os.path.join(od, f[:-4] + ".wav"), wav, SR, subtype="PCM_24")
            done += 1
    print("rendered", done)


if __name__ == "__main__":
    sys.exit(main())
