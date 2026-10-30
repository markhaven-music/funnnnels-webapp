#!/usr/bin/env python3
"""Every file of the Jazz MIDI Pack, for the landing page's pack browser.

Pure Python, no deps. Walks ~/Desktop/Jazz MIDI Pack and writes
public/funnels/jazz-midi-pack/browse/:
  index.json   the folder tree: {"n": name, "c": [children]} for a folder of
               folders, {"n": name, "k": chunk, "f": file count} for a folder
               of files
  <chunk>.json the files of one such folder, in the pack's order:
               [{"file", "bpm", "beats", "notes": [[startBeat, lenBeat, pitch]],
                 "chords": [[beat, "Dm7"]], "drums": [[beat, pitch]]}]
The page fetches the index when the browser comes into view and a folder's
chunk when it's opened, so the page itself carries none of it. Notes are read
like tools/extract_rolls.py does; drums (channel 10) are kept apart: the page
draws them but plays only the piano notes.

    python3 tools/extract_browse.py
"""
import json
import os
import shutil
import struct

from extract_rolls import vlq

PACK = os.path.expanduser("~/Desktop/Jazz MIDI Pack")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "funnels", "jazz-midi-pack", "browse")


def parse(path):
    data = open(path, "rb").read()
    _, ntracks, tpb = struct.unpack(">HHH", data[8:14])
    i, tempo, notes, drums, markers = 14, 500000, [], [], []
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
                elif mtype in (0x06, 0x01):
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
                if kind == 0x90 and d2 > 0:
                    drums.append((tick, d1))
                continue
            if kind == 0x90 and d2 > 0:
                open_.setdefault(d1, []).append(tick)
            elif kind in (0x80, 0x90) and open_.get(d1):
                notes.append((open_[d1].pop(0), tick, d1))
        i = end
    bar = tpb * 4
    last = max([e for _, e, _ in notes] + [t + tpb // 4 for t, _ in drums])
    return {
        "bpm": round(60_000_000 / tempo),
        "beats": -(-last // bar) * 4,
        "notes": [[round(s / tpb, 3), round((e - s) / tpb, 3), p] for s, e, p in sorted(notes)],
        "chords": [[round(t / tpb, 3), m] for t, m in sorted(markers) if m],
        "drums": [[round(t / tpb, 3), p] for t, p in sorted(drums)],
    }


def entries(path):
    return sorted(e for e in os.listdir(path) if not e.startswith("."))


def walk(path, chunks):
    names = entries(path)
    mids = [n for n in names if n.endswith(".mid")]
    if mids:
        k = len(chunks)
        chunks.append([{"file": n, **parse(os.path.join(path, n))} for n in mids])
        return {"n": os.path.basename(path), "k": k, "f": len(mids)}
    dirs = [n for n in names if os.path.isdir(os.path.join(path, n))]
    return {"n": os.path.basename(path), "c": [walk(os.path.join(path, d), chunks) for d in dirs]}


def main():
    chunks = []
    tree = walk(PACK, chunks)
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    with open(os.path.join(OUT, "index.json"), "w") as f:
        json.dump(tree, f, separators=(",", ":"), ensure_ascii=False)
    for k, files in enumerate(chunks):
        with open(os.path.join(OUT, f"{k}.json"), "w") as f:
            json.dump(files, f, separators=(",", ":"), ensure_ascii=False)
    total = sum(len(c) for c in chunks)
    size = sum(os.path.getsize(os.path.join(OUT, n)) for n in os.listdir(OUT))
    print(f"{total} files in {len(chunks)} folders, {size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
