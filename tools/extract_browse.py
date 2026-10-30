#!/usr/bin/env python3
"""Every file of the Jazz MIDI Pack, for the landing page's pack player.

Pure Python, no deps. Walks ~/Desktop/Jazz MIDI Pack and writes
public/funnels/jazz-midi-pack/browse/:
  pack.json    the five folders as the player shows them: per folder its
               choices ("dims", e.g. Progression · Voicing · Rhythm) and
               "files": {"<choice indices joined by .>": [chunk, file index]};
               "paths": each chunk's folder inside the pack
  <chunk>.json the files of one folder of files, in the pack's order:
               [{"file", "bpm", "beats", "notes": [[startBeat, lenBeat, pitch]],
                 "chords": [[beat, "Dm7"]], "drums": [[beat, pitch]]}]
The page fetches pack.json when the player nears the screen and a chunk when
one of its files is picked, so the page itself carries none of it. Notes are read
like tools/extract_rolls.py does; drums (channel 10) are kept apart: the page
draws them but plays only the piano notes.

    python3 tools/extract_browse.py
"""
import json
import os
import re
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


def dirs(path):
    return [n for n in entries(path) if os.path.isdir(os.path.join(path, n))]


def walk(path, chunks, leaves):
    names = entries(path)
    mids = [n for n in names if n.endswith(".mid")]
    if mids:
        leaves[os.path.relpath(path, PACK)] = len(chunks)
        chunks.append([{"file": n, **parse(os.path.join(path, n))} for n in mids])
    for d in dirs(path):
        walk(os.path.join(path, d), chunks, leaves)


def bare(name):
    """"05 I-vi-ii-V Turnaround" -> "I-vi-ii-V Turnaround"."""
    return re.sub(r"^\d+ ", "", name)


def parts(file):
    return file[:-4].split(" - ")


def folders(chunks, leaves):
    """The five top folders as choices. Progressions are numbered 01-26 the
    same way in every folder, so their number ties the folders together."""
    top = dirs(PACK)
    chords, keys, bass, combo, genre = top
    progs = dirs(os.path.join(PACK, chords))
    pid = {p[:2]: i for i, p in enumerate(progs)}
    prog_dim = {"label": "Progression", "opts": [bare(p) for p in progs]}
    out = []

    # 1: progression / voicing / 8 rhythms
    voicings = dirs(os.path.join(PACK, chords, progs[0]))
    first = chunks[leaves[os.path.join(chords, progs[0], voicings[0])]]
    rhythms = [bare(parts(f["file"])[0]) for f in first]
    files = {}
    for pi, p in enumerate(progs):
        for vi, v in enumerate(dirs(os.path.join(PACK, chords, p))):
            k = leaves[os.path.join(chords, p, v)]
            for fi, f in enumerate(chunks[k]):
                files[f"{pi}.{vi}.{rhythms.index(bare(parts(f['file'])[0]))}"] = [k, fi]
    out.append({"label": "Chords", "folder": chords,
                "what": "Every progression in its original key, in 13 voicings and 8 rhythms.",
                "dims": [prog_dim, {"label": "Voicing", "opts": [bare(v) for v in voicings]},
                         {"label": "Rhythm", "opts": rhythms}], "files": files})

    # 2: progression / 12 keys
    key_names, files = [], {}
    for p in dirs(os.path.join(PACK, keys)):
        k = leaves[os.path.join(keys, p)]
        for fi, f in enumerate(chunks[k]):
            # minor progressions are in "Cm" etc.: one choice per root
            key = next(x for x in parts(f["file"]) if x.startswith("in "))[3:].replace("s", "#").rstrip("m")
            if key not in key_names:
                key_names.append(key)
            files[f"{pid[p[:2]]}.{key_names.index(key)}"] = [k, fi]
    out.append({"label": "All 12 keys", "folder": keys,
                "what": "Every progression in all 12 keys, as voice-led pads.",
                "dims": [prog_dim, {"label": "Key", "opts": key_names}], "files": files})

    # 3: progression / bass style
    k = leaves[bass]
    styles = ["Walking Bass", "Two-Feel Bass", "Bossa Nova Bass"]
    files = {f"{pid[f['file'][:2]]}.{styles.index(parts(f['file'])[1])}": [k, fi] for fi, f in enumerate(chunks[k])}
    out.append({"label": "Bass lines", "folder": bass,
                "what": "A bass line for every progression: walking, two-feel or bossa nova.",
                "dims": [prog_dim, {"label": "Bass", "opts": [x.replace(" Bass", "") for x in styles]}], "files": files})

    # 4: progression
    k = leaves[combo]
    files = {f"{pid[f['file'][:2]]}": [k, fi] for fi, f in enumerate(chunks[k])}
    out.append({"label": "Combo loops", "folder": combo,
                "what": "Piano, walking bass and ride cymbal together, one loop per progression.",
                "dims": [prog_dim], "files": files})

    # 5: genre / progression / part
    genres = dirs(os.path.join(PACK, genre))
    part_names, files = ["Full", "Chords", "Bass", "Drums"], {}
    for gi, g in enumerate(genres):
        for p in dirs(os.path.join(PACK, genre, g)):
            k = leaves[os.path.join(genre, g, p)]
            for fi, f in enumerate(chunks[k]):
                files[f"{gi}.{pid[p[:2]]}.{part_names.index(parts(f['file'])[-1])}"] = [k, fi]
    out.append({"label": "Genre loops", "folder": genre,
                "what": "Every progression as a lofi, neo soul, trap soul or deep house loop: chords, bass and drums as separate files, plus the full loop.",
                "dims": [{"label": "Genre", "opts": [bare(g) for g in genres]}, prog_dim,
                         {"label": "Part", "opts": part_names}], "files": files})
    return out


def main():
    chunks, leaves = [], {}
    walk(PACK, chunks, leaves)
    tabs = folders(chunks, leaves)
    paths = [""] * len(chunks)
    for rel, k in leaves.items():
        paths[k] = rel
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    with open(os.path.join(OUT, "pack.json"), "w") as f:
        json.dump({"total": sum(len(c) for c in chunks), "folders": tabs, "paths": paths}, f,
                  separators=(",", ":"), ensure_ascii=False)
    for k, files in enumerate(chunks):
        with open(os.path.join(OUT, f"{k}.json"), "w") as f:
            json.dump(files, f, separators=(",", ":"), ensure_ascii=False)
    mapped = sum(len(t["files"]) for t in tabs)
    size = sum(os.path.getsize(os.path.join(OUT, n)) for n in os.listdir(OUT))
    print(f"{sum(len(c) for c in chunks)} files ({mapped} mapped to choices) in {len(chunks)} folders, {size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
