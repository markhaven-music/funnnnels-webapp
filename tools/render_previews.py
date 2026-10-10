#!/usr/bin/env python3
"""Render audio previews for a MIDI-pack funnel.

Pure Python (no deps) + ffmpeg for the MP3 step. A tiny synth: FM electric
piano, round bass, synthesized drums on channel 10. These are placeholders —
real Ableton bounces dropped into the output folder with the same names win.

    python3 tools/render_previews.py

Writes <slug>.mp3 and <slug>.json (piano-roll notes for the page) into
public/funnels/jazz-midi-pack/audio/.
"""
import json
import math
import os
import struct
import subprocess
import sys
import wave
from array import array

PACK = os.path.expanduser("~/Desktop/Jazz MIDI Pack")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "funnels", "jazz-midi-pack", "audio")
SR = 32000
MAX_SECONDS = 30  # previews loop the file up to twice, capped here

GL = "5 Genre Loops (chords bass drums)"
PREVIEWS = [
    ("neo-soul-turnaround", "Neo Soul · I–vi–ii–V Turnaround", "C · 88 bpm",
     f"{GL}/2 Neo Soul/05 I-vi-ii-V Turnaround - Neo Soul - C - 88bpm/05 I-vi-ii-V Turnaround - Neo Soul - C - 88bpm - Full.mid"),
    ("lofi-autumn-leaves", "Lofi Hip Hop · Autumn Leaves type", "Gm · 82 bpm",
     f"{GL}/1 Lofi Hip Hop/15 Autumn Leaves Type (relative major-minor) - Lofi Hip Hop - Gm - 82bpm/15 Autumn Leaves Type (relative major-minor) - Lofi Hip Hop - Gm - 82bpm - Full.mid"),
    ("ballad-ii-v-i", "Ballad Arpeggios · ii–V–I, Best Voicing", "C · 70 bpm",
     "1 Chords in Original Key/01 ii-V-I Major/01 Best Voicing/01 Ballad Arpeggios - 01 ii-V-I Major - Best Voicing - 70bpm.mid"),
    ("trap-soul-so-what", "Trap Soul · Modal So What", "Dm",
     None),  # resolved below by glob (bpm in the name)
    ("combo-jazz-blues", "Combo · Jazz Blues in F (piano, bass, ride)", "F · 150 bpm",
     "4 Combo Loops (piano bass ride)/16 Jazz Blues in F - Combo 150bpm.mid"),
]


# ---------------------------------------------------------------- MIDI parse

def read_vlq(data, i):
    v = 0
    while True:
        b = data[i]
        i += 1
        v = (v << 7) | (b & 0x7F)
        if not b & 0x80:
            return v, i


def parse_midi(path):
    """-> (ticks_per_beat, tempo_us, notes[(start_tick, end_tick, pitch, vel, ch, track)])"""
    data = open(path, "rb").read()
    assert data[:4] == b"MThd"
    _, ntracks, tpb = struct.unpack(">HHH", data[8:14])
    i = 14
    tempo = 500000
    notes = []
    for t in range(ntracks):
        assert data[i:i + 4] == b"MTrk", path
        length = struct.unpack(">I", data[i + 4:i + 8])[0]
        i += 8
        end = i + length
        tick = 0
        status = 0
        open_notes = {}
        while i < end:
            delta, i = read_vlq(data, i)
            tick += delta
            b = data[i]
            if b == 0xFF:
                mtype = data[i + 1]
                mlen, j = read_vlq(data, i + 2)
                if mtype == 0x51:
                    tempo = int.from_bytes(data[j:j + 3], "big")
                i = j + mlen
                continue
            if b in (0xF0, 0xF7):
                slen, j = read_vlq(data, i + 1)
                i = j + slen
                continue
            if b & 0x80:
                status = b
                i += 1
            kind, ch = status & 0xF0, status & 0x0F
            if kind in (0xC0, 0xD0):
                i += 1
                continue
            d1, d2 = data[i], data[i + 1]
            i += 2
            if kind == 0x90 and d2 > 0:
                open_notes.setdefault((ch, d1), []).append((tick, d2))
            elif kind in (0x80, 0x90):
                stack = open_notes.get((ch, d1))
                if stack:
                    s, v = stack.pop(0)
                    notes.append((s, tick, d1, v, ch, t))
        i = end
    return tpb, tempo, notes


# ------------------------------------------------------------------- voices

class Noise:
    """Deterministic LCG noise so renders are reproducible."""
    def __init__(self, seed=1):
        self.s = seed

    def __call__(self):
        self.s = (self.s * 1103515245 + 12345) & 0x7FFFFFFF
        return self.s / 0x3FFFFFFF - 1.0


def mtof(p):
    return 440.0 * 2 ** ((p - 69) / 12)


def add_ep(buf, start, dur, pitch, vel):
    f = mtof(pitch)
    a = (vel / 127) ** 1.4 * 0.16
    rel = 0.12
    n = int((dur + rel) * SR)
    w = 2 * math.pi * f / SR
    i0 = 1.2 + 1.8 * vel / 127
    decay = 1.8 if pitch < 60 else 1.2
    for k in range(n):
        t = k / SR
        if start + k >= len(buf):
            break
        env = math.exp(-t / decay) * min(1.0, t / 0.003)
        if t > dur:
            env *= math.exp(-(t - dur) / 0.05)
        idx = i0 * math.exp(-t / 0.18) + 0.25
        ph = w * k
        s = math.sin(ph + idx * math.sin(ph)) + 0.12 * math.sin(ph * 7.0) * math.exp(-t / 0.05)
        buf[start + k] += a * env * s


def add_bass(buf, start, dur, pitch, vel):
    f = mtof(pitch)
    a = (vel / 127) * 0.32
    n = int((dur + 0.06) * SR)
    w = 2 * math.pi * f / SR
    for k in range(n):
        t = k / SR
        if start + k >= len(buf):
            break
        env = math.exp(-t / 0.9) * min(1.0, t / 0.006)
        if t > dur:
            env *= math.exp(-(t - dur) / 0.025)
        ph = w * k
        s = math.tanh(1.6 * (math.sin(ph) + 0.25 * math.sin(2 * ph)))
        buf[start + k] += a * env * s


NZ = Noise(7)


def add_drum(buf, start, pitch, vel):
    a = vel / 127
    if pitch in (35, 36):  # kick
        n, ph = int(0.45 * SR), 0.0
        for k in range(n):
            t = k / SR
            if start + k >= len(buf):
                break
            f = 45 + 95 * math.exp(-t / 0.035)
            ph += 2 * math.pi * f / SR
            buf[start + k] += 0.55 * a * math.exp(-t / 0.28) * math.sin(ph)
    elif pitch in (38, 40, 39):  # snare / clap
        n = int(0.25 * SR)
        prev = 0.0
        for k in range(n):
            t = k / SR
            if start + k >= len(buf):
                break
            x = NZ()
            hp = x - prev
            prev = x
            tone = math.sin(2 * math.pi * 185 * t) * math.exp(-t / 0.05)
            buf[start + k] += 0.18 * a * (hp * math.exp(-t / 0.11) + 0.7 * tone)
    elif pitch in (42, 44, 46, 51, 59, 53):  # hats / ride
        long = pitch in (46, 51, 59, 53)
        n = int((0.7 if long else 0.08) * SR)
        tau = 0.35 if pitch in (51, 59, 53) else (0.18 if pitch == 46 else 0.025)
        gain = 0.05 if pitch in (51, 59, 53) else 0.07
        prev = 0.0
        for k in range(n):
            t = k / SR
            if start + k >= len(buf):
                break
            x = NZ()
            hp = x - prev
            prev = x
            metal = 0.0
            if pitch in (51, 59, 53):
                metal = 0.5 * (math.sin(2 * math.pi * 3150 * t) + math.sin(2 * math.pi * 4870 * t))
            buf[start + k] += gain * a * math.exp(-t / tau) * (hp + metal)


def reverb(buf, mix=0.18):
    out = array("d", buf)
    for delay_ms, fb in ((29.7, 0.78), (37.1, 0.76), (41.1, 0.74), (43.7, 0.72)):
        d = int(delay_ms * SR / 1000)
        line = array("d", buf)
        for k in range(d, len(line)):
            line[k] += fb * line[k - d]
        for k in range(len(out)):
            out[k] += mix * 0.25 * line[k]
    return out


# ------------------------------------------------------------------- render

def render(path):
    tpb, tempo, notes = parse_midi(path)
    sec_per_tick = tempo / 1e6 / tpb
    loop_ticks = max(e for _, e, *_ in notes)
    # round loop length up to a whole bar
    bar = tpb * 4
    loop_ticks = -(-loop_ticks // bar) * bar
    loop_s = loop_ticks * sec_per_tick
    loops = 2 if loop_s * 2 <= MAX_SECONDS else 1
    total = min(loop_s * loops, MAX_SECONDS) + 1.5
    buf = array("d", bytes(8 * int(total * SR)))
    drum_ch = 9
    pitched = [n for n in notes if n[4] != drum_ch]
    # bass = lowest-average track/channel among pitched parts, if there are several
    groups = {}
    for n in pitched:
        groups.setdefault((n[5], n[4]), []).append(n[2])
    bass_key = None
    if len(groups) > 1:
        bass_key = min(groups, key=lambda g: sum(groups[g]) / len(groups[g]))
    for rep in range(loops):
        off = rep * loop_ticks
        for s, e, p, v, ch, tr in notes:
            start = int((s + off) * sec_per_tick * SR)
            dur = (e - s) * sec_per_tick
            if ch == drum_ch:
                add_drum(buf, start, p, v)
            elif (tr, ch) == bass_key:
                add_bass(buf, start, dur, p, v)
            else:
                add_ep(buf, start, dur, p, v)
    buf = reverb(buf)
    peak = max(abs(x) for x in buf) or 1.0
    g = 0.89 / peak
    fade = int(1.2 * SR)
    pcm = array("h")
    for k, x in enumerate(buf):
        if k > len(buf) - fade:
            x *= (len(buf) - k) / fade
        pcm.append(int(max(-1.0, min(1.0, x * g)) * 32767))
    roll = {
        "beats": loop_ticks / tpb,
        "seconds_per_loop": loop_ticks * sec_per_tick,
        "loops": loops,
        "duration": total,
        "notes": [
            [round(s / tpb, 3), round((e - s) / tpb, 3), p, "b" if (tr, ch) == bass_key else "c"]
            for s, e, p, v, ch, tr in sorted(pitched)
        ],
    }
    return pcm, roll


def main():
    os.makedirs(OUT, exist_ok=True)
    index = []
    for slug, title, meta, rel in PREVIEWS:
        if rel is None:
            folder = os.path.join(PACK, GL, "3 Trap Soul")
            sub = next(d for d in sorted(os.listdir(folder)) if d.startswith("23 "))
            rel = os.path.join(GL, "3 Trap Soul", sub, sub + " - Full.mid")
            meta = sub.split(" - ")[2] + " · " + sub.split(" - ")[3].replace("bpm", " bpm")
        src = os.path.join(PACK, rel)
        print("render", slug, "<-", rel, file=sys.stderr)
        pcm, roll = render(src)
        wav = os.path.join(OUT, slug + ".wav")
        with wave.open(wav, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        mp3 = os.path.join(OUT, slug + ".mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "128k", mp3], check=True)
        os.remove(wav)
        with open(os.path.join(OUT, slug + ".json"), "w") as f:
            json.dump(roll, f, separators=(",", ":"))
        index.append({"slug": slug, "title": title, "meta": meta, "file": os.path.basename(rel)})
    with open(os.path.join(OUT, "index.json"), "w") as f:
        json.dump(index, f, indent=2)


if __name__ == "__main__":
    main()
