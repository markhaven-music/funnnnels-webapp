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
import zipfile

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

# The free bonuses: one real file each, drawn and played on the landing's
# bonus cards. Sources: the bonus zips in private/ and Mark's bonus folder.
PRIV = os.path.join(os.path.dirname(__file__), "..", "private", "jazz-midi-pack")
BON = os.path.expanduser("~/Desktop/midi jazz pack bonuses/bonuses")
BONUS = {
    # (zip or folder, path inside it, beats kept or None)
    "bonus1": (f"{PRIV}/Jazz MIDI Chord Pack.zip",
               "Jazz MIDI Chord Pack/1 - C Major - A Minor/6 Progressions/2 Advanced Jazz/Major Progressions/Major Prog 4 (I-bIII7-bVI-bII7 Lady Bird).mid", 32),
    "bonus2": (f"{BON}/2. BONUS #1 - The Chord Progressions Bible/The Chord Progressions Bible/MIDI Files",
               "Major/Arrangement/I-V-vi-IV_arrangement.mid", 32),
    "bonus3": (f"{PRIV}/Anime & Video Game MIDI Chord Pack.zip",
               "Anime & Video Game MIDI Chord Pack/1 - C Major - A Minor/6 Progressions/1 Anime/Major Progressions/Major Prog 1 (IV-V-iii-vi Royal Road).mid", 32),
    "bonus4": (f"{BON}/3. BONUS #2 - Emotional Keys MIDI Bundle/Emotional Keys Vol.1",
               "01 - Songstarters/EmotionalKeys01_Em_141_Ocean.mid", 32),
}


def read(src, rel):
    if src.endswith(".zip"):
        with zipfile.ZipFile(src) as z:
            return z.read(rel)
    return open(os.path.join(src, rel), "rb").read()


def vlq(data, i):
    v = 0
    while True:
        b = data[i]
        i += 1
        v = (v << 7) | (b & 0x7F)
        if not b & 0x80:
            return v, i


def parse(path, data=None, max_beats=None):
    data = data if data is not None else open(path, "rb").read()
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
    if max_beats:  # a long file: its first bars only
        cut = max_beats * tpb
        notes = [(s, min(e, cut), p) for s, e, p in notes if s < cut]
        markers = [(t, m) for t, m in markers if t < cut]
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
    for key, (src, rel, beats) in BONUS.items():
        roll = parse(rel, read(src, rel), beats)
        roll["file"] = os.path.basename(rel)
        out[key] = roll
        print(f"{key:8} {roll['bpm']:>3} bpm {roll['beats']:>3} beats {len(roll['notes']):>4} notes "
              f"{len(roll['chords']):>3} chords  {roll['chords'][:4]}")
    with open(OUT, "w") as f:
        json.dump(out, f, separators=(",", ":"))


if __name__ == "__main__":
    main()
