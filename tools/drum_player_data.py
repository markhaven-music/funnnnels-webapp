#!/usr/bin/env python3
"""The notes the new MIDI Drum Kit landing's player plays (landing B, 2026-11-12: "implementare anche il
player che ti fa sentire i midi"). Reads the kit's real MIDI files from the bundle zip buyers download and
writes them as small JSON, so the page plays exactly what is in the kit:

    /usr/bin/python3 tools/drum_player_data.py "~/Downloads/MIDI Drum Kit Bundle V1.1.zip"
    # writes public/funnels/midi-drum-kit/player/beats.json

Only the multi-track folders (Complete Beats, Kick and Snare, Kick and 808): one file there is a whole groove.
Times are in beats (quarter notes). Each track goes to one of the player's sounds (INST below), by its name;
the 808 keeps its MIDI pitch, the drums don't need one.
"""
import json
import os
import re
import struct
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "funnels", "midi-drum-kit", "player", "beats.json")

INST = ["808", "kick", "snare", "clap", "rim", "hat", "ohat", "perc"]
FOLDERS = [("9. Complete Beats", "beats", "Complete Beats"),
           ("7. Kick and Snare", "kick-snare", "Kick & Snare"),
           ("8. Kick and 808", "kick-808", "Kick & 808")]


def inst_for(track):
    t = track.lower()
    if t.startswith("808"):
        return 0
    if "kick" in t:
        return 1
    if t.startswith("clap"):
        return 3
    if "snare" in t:
        return 2
    if "open" in t or "cymbal" in t:
        return 6
    if "hihat" in t or "hat" in t or "fragment" in t:
        return 5
    if "rim" in t or "accent" in t:
        return 4
    return 7


def vlq(b, i):
    v = 0
    while True:
        c = b[i]
        i += 1
        v = (v << 7) | (c & 0x7F)
        if c < 0x80:
            return v, i


def read(data):
    """Tracks with names and notes (tick, dur, pitch, vel), ppq, first tempo."""
    assert data[:4] == b"MThd"
    _, ntr, ppq = struct.unpack(">HHH", data[8:14])
    i, tracks, tempo = 14, [], None
    for _ in range(ntr):
        ln = struct.unpack(">I", data[i + 4:i + 8])[0]
        b = data[i + 8:i + 8 + ln]
        i += 8 + ln
        t = j = 0
        st, name, on, notes = None, "", {}, []
        while j < len(b):
            d, j = vlq(b, j)
            t += d
            c = b[j]
            if c == 0xFF:
                typ = b[j + 1]
                l, k = vlq(b, j + 2)
                payload = b[k:k + l]
                j = k + l
                if typ == 0x03:
                    name = payload.decode("latin1")
                if typ == 0x51 and tempo is None:
                    tempo = 60e6 / int.from_bytes(payload, "big")
                continue
            if c in (0xF0, 0xF7):
                l, k = vlq(b, j + 1)
                j = k + l
                continue
            if c & 0x80:
                st = c
                j += 1
            hi = st & 0xF0
            n = 1 if hi in (0xC0, 0xD0) else 2
            p = b[j:j + n]
            j += n
            if hi == 0x90 and p[1] > 0:
                on.setdefault(p[0], []).append((t, p[1]))
            elif hi == 0x80 or (hi == 0x90 and p[1] == 0):
                if on.get(p[0]):
                    t0, v = on[p[0]].pop(0)
                    notes.append((t0, t - t0, p[0], v))
        tracks.append({"name": name, "notes": sorted(notes)})
    return {"ppq": ppq, "tempo": tempo, "tracks": tracks}


def beat(name, data):
    m = read(data)
    ppq = m["ppq"]
    bpm = m["tempo"]
    tail = re.search(r"_(\d{2,3})\.mid$", name)
    if tail:  # the file name says the tempo the beat was made at
        bpm = float(tail.group(1))
    notes = []
    for tr in m["tracks"]:
        if not tr["notes"]:
            continue
        ins = inst_for(tr["name"])
        for t, d, p, v in tr["notes"]:
            notes.append([round(t / ppq, 3), round(max(d, 1) / ppq, 3), ins, p if ins == 0 else 0, v])
    notes.sort()
    end = max(n[0] + n[1] for n in notes)
    length = max(4, -(-end // 4) * 4)  # whole bars of 4/4
    return {"bpm": round(bpm or 120), "len": int(length), "notes": notes}


def main(zip_path):
    z = zipfile.ZipFile(os.path.expanduser(zip_path))
    out = {"inst": INST, "folders": []}
    for folder, key, title in FOLDERS:
        files = sorted(n for n in z.namelist() if f"/{folder}" in n and n.lower().endswith(".mid"))
        beats = []
        for k, n in enumerate(files, 1):
            b = beat(n, z.read(n))
            b["name"] = f"{title} {k:02d}"
            b["file"] = n.split("/", 1)[-1]  # its path in the zip, under "1 - MIDI Drum Kit/"
            beats.append(b)
        out["folders"].append({"id": key, "name": title, "beats": beats})
        print(title, len(beats), "files")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "~/Downloads/MIDI Drum Kit Bundle V1.1.zip")
