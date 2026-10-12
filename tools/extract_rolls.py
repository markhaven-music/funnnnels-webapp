#!/usr/bin/env python3
"""Extract real notes + chord names from the Jazz MIDI Pack for the landing page.

Pure Python, no deps. Writes app/(funnels)/jazz-midi-pack/rolls.json:
  { "<id>": { "file", "bpm", "beats", "notes": [[startBeat, lenBeat, pitch]],
              "chords": [[beat, "Dm7"]] }, ... }
The page draws piano rolls from it and plays the notes on a real piano sample
(Salamander Grand). Drums (channel 10) are skipped: piano only.

    python3 tools/extract_rolls.py
"""
import json
import os
import struct

PACK = os.path.expanduser("~/Desktop/Jazz MIDI Pack")
OUT = os.path.join(os.path.dirname(__file__), "..", "app", "(funnels)", "jazz-midi-pack", "rolls.json")

C = "1 Chords in Original Key"
G = "5 Genre Loops (chords bass drums)"
FILES = {
    # before / after: the same progression, same rhythm, two voicings
    "before": f"{C}/05 I-vi-ii-V Turnaround/10 Root Position/02 Pads - 05 I-vi-ii-V Turnaround - Root Position - 90bpm.mid",
    "after": f"{C}/05 I-vi-ii-V Turnaround/01 Best Voicing/02 Pads - 05 I-vi-ii-V Turnaround - Best Voicing - 90bpm.mid",
    # previews, best-sounding first
    "ballad": f"{C}/01 ii-V-I Major/01 Best Voicing/01 Ballad Arpeggios - 01 ii-V-I Major - Best Voicing - 70bpm.mid",
    "neosoul": f"{G}/2 Neo Soul/05 I-vi-ii-V Turnaround - Neo Soul - C - 88bpm/05 I-vi-ii-V Turnaround - Neo Soul - C - 88bpm - Full.mid",
    "lofi": f"{G}/1 Lofi Hip Hop/15 Autumn Leaves Type (relative major-minor) - Lofi Hip Hop - Gm - 82bpm/15 Autumn Leaves Type (relative major-minor) - Lofi Hip Hop - Gm - 82bpm - Full.mid",
    "bossa": f"{C}/09 Tritone Turnaround/01 Best Voicing/04 Bossa Nova - 09 Tritone Turnaround - Best Voicing - 135bpm.mid",
    "blues": f"{C}/16 Jazz Blues in F/01 Best Voicing/03 Swing Comping - 16 Jazz Blues in F - Best Voicing - 150bpm.mid",
}


def vlq(data, i):
    v = 0
    while True:
        b = data[i]
        i += 1
        v = (v << 7) | (b & 0x7F)
        if not b & 0x80:
            return v, i


def parse(path):
    data = open(path, "rb").read()
    _, ntracks, tpb = struct.unpack(">HHH", data[8:14])
    i, tempo, notes, markers = 14, 500000, [], []
    for _ in range(ntracks):
        length = struct.unpack(">I", data[i + 4:i + 8])[0]
        i += 8
        end, tick, status, open_ = i + length, 0, 0, {}
        while i < end:
            delta, i = vlq(data, i)
            tick += delta
            b = data[i]
            if b == 0xFF:
                mtype = data[i + 1]
                mlen, j = vlq(data, i + 2)
                if mtype == 0x51:
                    tempo = int.from_bytes(data[j:j + 3], "big")
                elif mtype in (0x06, 0x01):  # marker / text: chord symbols
                    markers.append((tick, data[j:j + mlen].decode("latin-1").strip()))
                i = j + mlen
                continue
            if b in (0xF0, 0xF7):
                slen, j = vlq(data, i + 1)
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
            if ch == 9:
                continue
            if kind == 0x90 and d2 > 0:
                open_.setdefault(d1, []).append(tick)
            elif kind in (0x80, 0x90) and open_.get(d1):
                notes.append((open_[d1].pop(0), tick, d1))
        i = end
    bar = tpb * 4
    last = max(e for _, e, _ in notes)
    beats = -(-last // bar) * 4
    return {
        "bpm": round(60_000_000 / tempo),
        "beats": beats,
        "notes": [[round(s / tpb, 3), round((e - s) / tpb, 3), p] for s, e, p in sorted(notes)],
        "chords": [[round(t / tpb, 3), m] for t, m in sorted(markers) if m],
    }


def main():
    out = {}
    for key, rel in FILES.items():
        roll = parse(os.path.join(PACK, rel))
        roll["file"] = os.path.basename(rel)
        out[key] = roll
        print(f"{key:8} {roll['bpm']:>3} bpm {roll['beats']:>3} beats {len(roll['notes']):>4} notes "
              f"{len(roll['chords']):>3} chords  {roll['chords'][:4]}")
    with open(OUT, "w") as f:
        json.dump(out, f, separators=(",", ":"))


if __name__ == "__main__":
    main()
