#!/usr/bin/env python3
"""TOP HITS MIDI Bundle: every progression of the pack in all 12 keys (2026-11-15, "trascribe
them in any key so they become 12000 MIDI Files").

Pure Python, no deps. Reads the transcriptions of "1. Hitmaker MIDI Pack" (four genre folders)
and writes, for each file that has notes, a folder with the same file in the 12 keys: the notes
moved by -5 to +6 semitones (the nearest way to each key, so the register stays the song's),
everything else in the file byte for byte (rhythm, lengths, velocities, tempo, markers). The
original key is one of the twelve, as the pack has it.

  <out>/<genre folder>/<Artist - Song>/<Artist - Song (BPM - Key)>.mid   x 12

Files with no key in their name are named by the move instead ("+3 semitones"). A file without
notes is left out (said at the end).

    /usr/bin/python3 tools/top_hits_keys.py <pack dir> <out dir>
"""
import os
import re
import sys

MAJOR = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
MINOR = ["Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "Bbm", "Bm"]
PC = {"C": 0, "B#": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "Fb": 4, "F": 5, "E#": 5, "F#": 6, "Gb": 6,
      "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11, "Cb": 11}
# Where the key is in a file name. Most are "(172 BPM - Fm)"; some say "(79 BPM - F minor)",
# "(98 BPM - Gb Major)", "(160 BPM - C#M)"; the newest are "… - Dm - 122BPM", with "-" for a
# sharp ("C-m" is C#m, "F-" is F#). Anything after the key (") copy", ")4") stays.
KEYS = [
    re.compile(r"^(?P<head>.*BPM\s*-\s*)(?P<root>[A-G][#b]?)(?P<q>m| ?[Mm]inor|M| ?[Mm]ajor)?(?P<tail>\).*)$"),
    re.compile(r"^(?P<head>.*-\s*)(?P<root>[A-G](?:[#b]|-(?=m?\s*-))?)(?P<q>m)?(?P<tail>\s*-\s*\d+\s*(?:BPM)?\s*)$"),
]
ROOTS_MINOR = [k[:-1] for k in MINOR]


def key_of(stem):
    """(head, pitch class, minor?, how the name says minor/major, tail) or None."""
    for rx in KEYS:
        m = rx.match(stem)
        if m:
            q = m["q"] or ""
            return m["head"], PC[m["root"].replace("-", "#")], q == "m" or q.strip().lower() == "minor", q, m["tail"]
    return None


def named(found, by):
    head, pc, minor, q, tail = found
    root = (ROOTS_MINOR if minor else MAJOR)[(pc + by) % 12]
    return f"{head}{root}{'' if q == 'M' else q}{tail}"


MOVES = [0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1]


def vlq(data, i):
    v = 0
    while True:
        b = data[i]
        i += 1
        v = (v << 7) | (b & 0x7F)
        if not b & 0x80:
            return v, i


def moved(data, by):
    """The file with every note of every channel but 10 moved by `by` semitones; None if a note leaves 0-127."""
    out = bytearray(data)
    notes = 0
    assert data[:4] == b"MThd"
    i = 8 + int.from_bytes(data[4:8], "big")
    while i < len(data):
        if data[i:i + 4] != b"MTrk":  # an unknown chunk: skipped as it is
            i += 8 + int.from_bytes(data[i + 4:i + 8], "big")
            continue
        end = i + 8 + int.from_bytes(data[i + 4:i + 8], "big")
        i += 8
        status = 0
        while i < end:
            _, i = vlq(data, i)
            b = data[i]
            if b == 0xFF:  # meta
                n, j = vlq(data, i + 2)
                i = j + n
                continue
            if b in (0xF0, 0xF7):  # sysex
                n, j = vlq(data, i + 1)
                i = j + n
                continue
            if b & 0x80:
                status = b
                i += 1
            kind, ch = status & 0xF0, status & 0x0F
            if kind in (0x80, 0x90, 0xA0):
                if ch != 9:
                    p = data[i] + by
                    if not 0 <= p <= 127:
                        return None, 0
                    out[i] = p
                    if kind == 0x90 and data[i + 1]:
                        notes += 1
                i += 2
            elif kind in (0xB0, 0xE0):
                i += 2
            elif kind in (0xC0, 0xD0):
                i += 1
            else:
                raise ValueError(f"status {status:#x}")
        i = end
    return bytes(out), notes


def main(pack, out):
    made = songs = 0
    left = []
    seen = {}
    for genre in sorted(os.listdir(pack)):
        gdir = os.path.join(pack, genre)
        if not os.path.isdir(gdir):
            continue
        for name in sorted(os.listdir(gdir), key=lambda n: (" copy" in n, n)):
            stem, ext = os.path.splitext(name)
            if ext.lower() not in (".mid", ".midi") or name.startswith("."):
                continue
            data = open(os.path.join(gdir, name), "rb").read()
            if data in seen:  # the same file twice in the pack ("… copy.mid"): once here
                left.append(f"{genre}/{name} (same file as {seen[data]})")
                continue
            seen[data] = name
            _, notes = moved(data, 0)
            if not notes:
                left.append(f"{genre}/{name} (no notes)")
                continue
            found = key_of(stem)
            folder = os.path.join(out, genre, stem)
            os.makedirs(folder, exist_ok=True)
            names = set()
            for by in MOVES:
                new, _ = moved(data, by)
                if new is None:  # out of the MIDI range that way: the other way round the octave
                    by = by - 12 if by > 0 else by + 12
                    new, _ = moved(data, by)
                if not by:
                    fname = stem  # the original key, named as the pack names it
                elif found:
                    fname = named(found, by)
                else:
                    fname = f"{stem} ({by:+d} semitones)"
                assert fname not in names, fname
                names.add(fname)
                open(os.path.join(folder, fname + ".mid"), "wb").write(new)
                made += 1
            songs += 1
    print(f"{songs} files in 12 keys: {made} MIDI files in {out}")
    for x in left:
        print("left out:", x)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
