#!/usr/bin/env python3
"""Reads the real TOP HITS MIDI Bundle and writes what the sales page plays.

Pure Python, no deps. Source: the pack's folder "1. Hitmaker MIDI Pack" (four genre
folders, 1,000 .mid/.midi files) and the song list the Astro page made from its file
names (grind-studio-landing-pages/src/data/top-hits-songs.json: artist, title, BPM, key,
folder, file; typos in the file names fixed for display, the files untouched).

Writes
  public/funnels/top-hits-midi-bundle/browse-v1/songs.json
      { total, folders: [name], songs: [[artist, title, bpm, key, folder, chunk, index]] }
  public/funnels/top-hits-midi-bundle/browse-v1/<chunk>.json
      [ { file, bpm, beats, notes: [[startBeat, lenBeat, pitch]], chords: [] } ]   (50 songs each; chords: the Jazz roll type, unused)
  app/(funnels)/top-hits-midi-bundle/_v2/rolls.json
      the files the page shows before anything is fetched (hero, letter, steps)

The page plays the FIRST 8 BARS of each file (the whole file when it's shorter), empty
bars at the start cut. A new pack: a new folder name (browse-v2), the old one is cached a week.

    /usr/bin/python3 tools/extract_top_hits.py "<…/11. TOP HITS MIDI Bundle/1. Hitmaker MIDI Pack>"
"""
import json
import os
import struct
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SONGS = os.path.expanduser("~/Desktop/Code Projects/grind-studio-landing-pages/src/data/top-hits-songs.json")
PUB = os.path.join(HERE, "..", "public", "funnels", "top-hits-midi-bundle", "browse-v1")
ROLLS = os.path.join(HERE, "..", "app", "(funnels)", "top-hits-midi-bundle", "_v2", "rolls.json")
FOLDERS = ["Modern Pop & Ballads", "Hiphop, Trap & Urban", "Dance & Electronic", "Vintage Classics, Rock & Country"]
BARS = 8
CHUNK = 50
# The files the page itself carries: [id, artist, title]
FIRST = [
    ("blinding", "The Weeknd", "Blinding Lights"),
    ("killbill", "SZA", "Kill Bill"),
    ("lucid", "Juice WRLD", "Lucid Dreams"),
    ("someone", "Adele", "Someone Like You"),
]


def vlq(data, i):
    v = 0
    while True:
        b = data[i]
        i += 1
        v = (v << 7) | (b & 0x7F)
        if not b & 0x80:
            return v, i


def parse(path):
    """→ (ticks per beat, tempo bpm or None, [[startTick, endTick, pitch]])"""
    data = open(path, "rb").read()
    if data[:4] != b"MThd":
        raise ValueError("not a MIDI file")
    hlen = struct.unpack(">I", data[4:8])[0]
    _, ntracks, tpb = struct.unpack(">HHH", data[8:14])
    i, tempo, notes = 8 + hlen, None, []
    for _ in range(ntracks):
        if i + 8 > len(data):
            break
        cid = data[i:i + 4]
        length = struct.unpack(">I", data[i + 4:i + 8])[0]
        i += 8
        end = i + length
        if cid != b"MTrk":
            i = end
            continue
        tick, status, open_ = 0, 0, {}
        while i < end:
            delta, i = vlq(data, i)
            tick += delta
            b = data[i]
            if b == 0xFF:
                mtype = data[i + 1]
                mlen, j = vlq(data, i + 2)
                if mtype == 0x51 and tempo is None:
                    tempo = 60000000 / int.from_bytes(data[j:j + 3], "big")
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
            elif kind == 0x80 or (kind == 0x90 and d2 == 0):
                st = open_.get(d1)
                if st:
                    notes.append([st.pop(0), tick, d1])
        i = end
    return tpb, tempo, notes


def roll(path, file, bpm):
    tpb, tempo, notes = parse(path)
    if not notes:
        return None
    notes.sort()
    # empty bars at the start are cut
    first = min(n[0] for n in notes) / tpb
    off = int(first // 4) * 4
    out = []
    for s, e, p in notes:
        s, e = s / tpb - off, e / tpb - off
        if s >= BARS * 4 - 0.01:
            continue
        e = min(e, BARS * 4)
        if e - s < 0.02:
            continue
        out.append([round(s, 2), round(e - s, 2), p])
    if not out:
        return None
    last = max(s + l for s, l, _ in out)
    beats = min(BARS * 4, max(4, int(-(-last // 4)) * 4))
    return {"file": file, "bpm": int(bpm or round(tempo or 120)), "beats": beats, "notes": out, "chords": []}


def nfc(s):
    return unicodedata.normalize("NFC", s)


def main():
    root = sys.argv[1]
    songs = json.load(open(SONGS))
    # every file on disk, by folder name + file name (NFC: the drive stores NFD)
    disk = {}
    for d in sorted(os.listdir(root)):
        full = os.path.join(root, d)
        if not os.path.isdir(full):
            continue
        genre = d.split(". ", 1)[-1]
        for dirpath, _, files in os.walk(full):
            for f in files:
                if f.lower().endswith((".mid", ".midi")) and not f.startswith("."):
                    disk[(nfc(genre), nfc(f))] = os.path.join(dirpath, f)
    print("files on disk:", len(disk), "· songs in the list:", len(songs))

    songs.sort(key=lambda s: (FOLDERS.index(s["g"]), (s["a"] or "~").lower(), s["t"].lower()))
    index, chunks, missing, empty = [], [], [], []
    by_name = {}
    for s in songs:
        path = disk.get((nfc(s["g"]), nfc(s["f"])))
        if not path:
            missing.append(s["f"])
            continue
        try:
            r = roll(path, s["f"], s["b"])
        except Exception as e:  # noqa: BLE001
            print("  unreadable:", s["f"], e)
            r = None
        if not r:
            empty.append(s["f"])
            continue
        if not chunks or len(chunks[-1]) >= CHUNK:
            chunks.append([])
        chunks[-1].append(r)
        index.append([s["a"], s["t"], s["b"], s["k"], FOLDERS.index(s["g"]), len(chunks) - 1, len(chunks[-1]) - 1])
        by_name[(s["a"], s["t"])] = r

    os.makedirs(PUB, exist_ok=True)
    for old in os.listdir(PUB):
        os.remove(os.path.join(PUB, old))
    dump = lambda o: json.dumps(o, separators=(",", ":"), ensure_ascii=False)  # noqa: E731
    for k, c in enumerate(chunks):
        open(os.path.join(PUB, f"{k}.json"), "w").write(dump(c))
    open(os.path.join(PUB, "songs.json"), "w").write(dump({"total": len(songs), "folders": FOLDERS, "songs": index}))

    first = {}
    for key, artist, title in FIRST:
        r = by_name[(artist, title)]
        first[key] = {"artist": artist, "song": title, **r}
    os.makedirs(os.path.dirname(ROLLS), exist_ok=True)
    open(ROLLS, "w").write(dump(first))

    per = [sum(1 for x in index if x[4] == i) for i in range(len(FOLDERS))]
    print("playable:", len(index), "in", len(chunks), "chunks ·", dict(zip(FOLDERS, per)))
    print("not found on disk:", len(missing), missing[:10])
    print("no notes:", len(empty), empty[:10])
    print("artists:", len({x[0] for x in index if x[0]}))
    size = sum(os.path.getsize(os.path.join(PUB, f)) for f in os.listdir(PUB))
    print("bytes written:", size)


if __name__ == "__main__":
    main()
