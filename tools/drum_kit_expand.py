#!/usr/bin/env python3
"""MIDI Drum Kit: the kit's own 1,040 patterns in every key and in ready combinations (10,000+ files).

2026-11-12, "let's get them to 10k+" (as the Jazz MIDI Pack and TOP HITS were: tools/top_hits_variants.py).
Pure Python, no deps. Reads "MIDI Drum Kit Bundle V1.1.zip" and writes a new zip with everything that
zip has, untouched, plus seven folders made only from the kit's own files:

  12. 808 in All 12 Keys                    every 808 pattern and fragment (their names say C) in the 11 other keys
  13. Kick and 808 in All 12 Keys           every Kick and 808 beat, its 808 on the 11 other notes
  14. Complete Beats in All 12 Keys         every Complete Beat that has an 808, its 808 on the 11 other notes
  15. Kick + Snare Combos                   every kick pattern with every snare pattern, two tracks
  16. Kick, 808 + Snare Combos              every Kick and 808 beat with every snare pattern, three tracks
  17. Beats with Hi-Hats                    every Kick and Snare beat with every basic 4-bar hi-hat pattern

A transposed file is its source event for event (pitch bends, pressure and controllers stay: the 808s
glide), only the note numbers of the 808 move, by the shortest way (5 semitones down to 6 up). Folder 1's
files are named in C by who wrote them, so folder 12's are named by key. The beats of folders 8 and 9 say no
key and are in several: there the name says the note the 808 starts on (in folder 1 that is the key in
153 files of 178), which is true of every file, where a guessed key would be wrong in some. A combination is the note tracks of its sources, each on its own track and channel
with the source's track name, at 960 ticks a quarter, with the first source's tempo.

    /usr/bin/python3 tools/drum_kit_expand.py KIT.zip OUT.zip     # prints what it made and checks every file
"""
import collections
import hashlib
import os
import re
import struct
import sys
import zipfile

KIT = "1 - MIDI Drum Kit/"
KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
FLATS = {"C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"}
PPQ = 960


def key_dir(k):
    return f"Key of {k} ({FLATS[k]})" if k in FLATS else f"Key of {k}"


def start_dir(k):
    return f"808 starts on {k} ({FLATS[k]})" if k in FLATS else f"808 starts on {k}"


# ───────────────────────────── MIDI read / write ─────────────────────────────


def vlq(b, i):
    v = 0
    while True:
        c = b[i]
        i += 1
        v = (v << 7) | (c & 0x7F)
        if c < 0x80:
            return v, i


def to_vlq(n):
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(out))


def parse(data):
    """A file as {fmt, ppq, tracks}: each track a list of events (tick, kind, a, b):
    ("meta", type, payload) · ("sysex", status, payload) · ("ch", status, data bytes)."""
    assert data[:4] == b"MThd", "not a MIDI file"
    fmt, ntr, ppq = struct.unpack(">HHH", data[8:14])
    i, tracks = 14, []
    for _ in range(ntr):
        assert data[i:i + 4] == b"MTrk"
        ln = struct.unpack(">I", data[i + 4:i + 8])[0]
        b = data[i + 8:i + 8 + ln]
        i += 8 + ln
        t = j = 0
        st, events = None, []
        while j < len(b):
            d, j = vlq(b, j)
            t += d
            c = b[j]
            if c == 0xFF:
                typ = b[j + 1]
                l, k = vlq(b, j + 2)
                events.append((t, "meta", typ, bytes(b[k:k + l])))
                j = k + l
                continue
            if c in (0xF0, 0xF7):
                l, k = vlq(b, j + 1)
                events.append((t, "sysex", c, bytes(b[k:k + l])))
                j = k + l
                continue
            if c & 0x80:
                st = c
                j += 1
            n = 1 if (st & 0xF0) in (0xC0, 0xD0) else 2
            events.append((t, "ch", st, bytes(b[j:j + n])))
            j += n
        tracks.append(events)
    return {"fmt": fmt, "ppq": ppq, "tracks": tracks}


def dump(fmt, ppq, tracks):
    """The file's bytes. Each track's events in tick order (their own order kept within a tick), one End of Track last."""
    out = [b"MThd", struct.pack(">IHHH", 6, fmt, len(tracks), ppq)]
    for events in tracks:
        end = max((e[0] for e in events), default=0)
        body = [e for e in events if not (e[1] == "meta" and e[2] == 0x2F)]
        body.sort(key=lambda e: e[0])  # stable
        b, t = bytearray(), 0
        for tick, kind, a, payload in body:
            b += to_vlq(tick - t)
            t = tick
            if kind == "meta":
                b += bytes([0xFF, a]) + to_vlq(len(payload)) + payload
            elif kind == "sysex":
                b += bytes([a]) + to_vlq(len(payload)) + payload
            else:
                b += bytes([a]) + payload
        b += to_vlq(end - t) + b"\xFF\x2F\x00"
        out += [b"MTrk", struct.pack(">I", len(b)), bytes(b)]
    return b"".join(out)


def is_note(e):
    return e[1] == "ch" and (e[2] & 0xF0) in (0x80, 0x90, 0xA0)


def name_of(events):
    return next((e[3].decode("latin1") for e in events if e[1] == "meta" and e[2] == 0x03), "")


def tempo_of(mid):
    for tr in mid["tracks"]:
        for e in tr:
            if e[1] == "meta" and e[2] == 0x51:
                return 60e6 / int.from_bytes(e[3], "big")
    return None


def notes(events):
    """(start, length, pitch, velocity) of a track's notes, in ticks."""
    on, out = {}, []
    for t, kind, st, d in events:
        if kind != "ch":
            continue
        hi = st & 0xF0
        if hi == 0x90 and d[1] > 0:
            on.setdefault((st & 15, d[0]), []).append((t, d[1]))
        elif hi == 0x80 or (hi == 0x90 and d[1] == 0):
            if on.get((st & 15, d[0])):
                t0, v = on[(st & 15, d[0])].pop(0)
                out.append((t0, t - t0, d[0], v))
    return sorted(out)


# ───────────────────────────── every key ─────────────────────────────


def first_note(events):
    """The pitch class an 808 line starts on."""
    ns = notes(events)
    return ns[0][2] % 12 if ns else 0


def shifted(events, semis, new_name=None):
    """The track with its notes moved by `semis` (an octave back in if one would leave 0-127), renamed if asked."""
    ps = [e[3][0] for e in events if is_note(e)]
    if ps and (max(ps) + semis > 127 or min(ps) + semis < 0):
        semis += -12 if semis > 0 else 12
    out = []
    for e in events:
        if is_note(e):
            out.append((e[0], e[1], e[2], bytes([e[3][0] + semis]) + e[3][1:]))
        elif new_name and e[1] == "meta" and e[2] == 0x03:
            out.append((e[0], e[1], e[2], new_name.encode("latin1", "replace")))
        else:
            out.append(e)
    return out


def in_keys(data, pick, rename, home=None):
    """The file on the 11 notes it isn't on: [(note name, bytes)]. pick(track name, events) says which tracks are the 808;
    rename(old track name, key) gives a track's new name (None: keep it); home: the note it is on (0 = C), or None for
    the one its 808 starts on."""
    mid = parse(data)
    subs = [i for i, tr in enumerate(mid["tracks"]) if any(is_note(e) for e in tr) and pick(name_of(tr), tr)]
    if not subs:
        return None, []
    if home is None:
        home = first_note([e for i in subs for e in mid["tracks"][i]])
    out = []
    for k in range(12):
        if k == home:
            continue
        semis = (k - home) % 12
        if semis > 6:
            semis -= 12
        tracks = [shifted(tr, semis, rename(name_of(tr), KEYS[k])) if i in subs else tr for i, tr in enumerate(mid["tracks"])]
        out.append((KEYS[k], dump(mid["fmt"], mid["ppq"], tracks)))
    return KEYS[home], out


# ───────────────────────────── combinations ─────────────────────────────


def parts(data):
    """A file's note tracks, ready to go in a combination: [(track name, events at PPQ without tempo, meter or end)], its tempo, its length in beats."""
    mid = parse(data)
    scale = PPQ / mid["ppq"]
    out, end = [], 0
    for tr in mid["tracks"]:
        end = max(end, max((e[0] for e in tr), default=0))
        if not any(is_note(e) for e in tr):
            continue
        ev = [(round(t * scale), kind, a, d) for t, kind, a, d in tr if not (kind == "meta" and a in (0x2F, 0x51, 0x58, 0x59, 0x54))]
        out.append((name_of(tr), ev))
    beats = end / mid["ppq"]
    return out, tempo_of(mid), int(-(-beats // 4) * 4) or 4


def combo(sources, names):
    """One multi-track file from several files: every note track of each, in order, each on its own channel.
    sources: bytes of each file; names: the track name to give a single-track source (None: its own, as multi-track files have)."""
    tracks, tempo, beats = [], None, 0
    for data, name in zip(sources, names):
        ps, tp, ln = parts(data)
        tempo = tempo or tp
        beats = max(beats, ln)
        for own, ev in ps:
            tracks.append((name if name and len(ps) == 1 else own, ev))
    end = beats * PPQ
    out = [[(0, "meta", 0x58, bytes([4, 2, 24, 8])), (0, "meta", 0x51, round(60e6 / (tempo or 140)).to_bytes(3, "big")), (end, "meta", 0x2F, b"")]]
    for ch, (name, ev) in enumerate(tracks):
        body = [(0, "meta", 0x03, name.encode("latin1", "replace"))]
        for t, kind, a, d in ev:
            if kind == "meta" and a == 0x03:
                continue
            body.append((t, kind, (a & 0xF0) | ch, d) if kind == "ch" else (t, kind, a, d))
        body.append((max(end, max((e[0] for e in body), default=0)), "meta", 0x2F, b""))
        out.append(body)
    return dump(1, PPQ, out)


# ───────────────────────────── the folders ─────────────────────────────

NUM = re.compile(r"(\d+)")


def number(stem, word):
    """MDK_Kick_Complex_Pattern_33_130 → 33 (the number after `word`)."""
    m = re.search(rf"{word}_?(\d+)", stem)
    return int(m.group(1)) if m else 0


def build(z):
    """{path in the zip: bytes} of the new folders, and a line per folder for the read-me."""
    files = sorted(n for n in z.namelist() if n.startswith(KIT) and n.lower().endswith(".mid"))
    inside = lambda folder: [n for n in files if n.startswith(KIT + folder + "/")]
    stem = lambda n: os.path.basename(n)[:-4]
    out, made = {}, []

    def add(folder, path, data):
        out[f"{KIT}{folder}/{path}"] = data

    # 12 · the 808s in every key: the name's C becomes the key
    folder, n0 = "12. 808 in All 12 Keys", len(out)
    for sub in ("1. Patterns", "2. Fragments"):
        for n in inside("1. 808/" + sub):
            keyed = lambda name, k: re.sub(r"_\(?C\)?$", f"_{k}", name) if re.search(r"_\(?C\)?$", name) else f"{name}_{k}"
            home, versions = in_keys(z.read(n), lambda name, tr: True, keyed, home=0)
            for k, data in versions:
                add(folder, f"{key_dir(k)}/{sub}/{keyed(stem(n), k)}.mid", data)
    made.append((folder, len(out) - n0, "Every 808 pattern and fragment of folder 1 (they are in C) in the 11 other keys. The name ends with the key. Glides are kept."))

    # 13 · Kick and 808 beats, the 808 in every key
    folder, n0 = "13. Kick and 808 in All 12 Keys (Multi-Track)", len(out)
    for n in inside("8. Kick and 808 (Multi-Track)"):
        home, versions = in_keys(z.read(n), lambda name, tr: name.strip().lower().startswith("808"), lambda name, k: None)
        for k, data in versions:
            add(folder, f"{start_dir(k)}/{stem(n)}_808on{k}.mid", data)
    made.append((folder, len(out) - n0, "Every beat of folder 8 with its 808 moved to the 11 other notes (the kick stays where it is). The folder and the name say the note the 808 starts on: most of the time that is the key."))

    # 14 · Complete Beats that have an 808, in every key
    folder, n0 = "14. Complete Beats in All 12 Keys (Multi-Track)", len(out)
    for n in inside("9. Complete Beats (Multi-Track)"):
        home, versions = in_keys(z.read(n), lambda name, tr: name.strip().lower().startswith("808"), lambda name, k: None)
        for k, data in versions:
            add(folder, f"{start_dir(k)}/{stem(n)}_808on{k}.mid", data)
    made.append((folder, len(out) - n0, "Every Complete Beat of folder 9 that has an 808, with the 808 moved to the 11 other notes (the drums stay where they are). The folder and the name say the note the 808 starts on."))

    kicks = inside("4. Kick/1. Patterns")
    snares = inside("5. Snare or Clap/1. Patterns")
    k808 = inside("8. Kick and 808 (Multi-Track)")
    ks = inside("7. Kick and Snare (Multi-Track)")
    hats = [n for n in inside("2. Hihat Closed/Basic") if "Pattern" in n and parts(z.read(n))[2] == 16]
    read = {n: z.read(n) for n in kicks + snares + k808 + ks + hats}

    # 15 · every kick pattern with every snare pattern
    folder, n0 = "15. Kick + Snare Combos (Multi-Track)", len(out)
    for i, k in enumerate(kicks, 1):
        for j, s in enumerate(snares, 1):
            add(folder, f"Kick {i:02d} - {stem(k)}/MDK_KickSnare_K{i:02d}_S{j:02d}.mid", combo([read[k], read[s]], ["Kick", "Snare"]))
    made.append((folder, len(out) - n0, f"Each of the {len(kicks)} kick patterns of folder 4 with each of the {len(snares)} snare patterns of folder 5: two tracks, Kick and Snare. K = the kick pattern, S = the snare pattern, in the order of their folders."))

    # 16 · every Kick and 808 beat with every snare pattern
    folder, n0 = "16. Kick, 808 + Snare Combos (Multi-Track)", len(out)
    for i, b in enumerate(k808, 1):
        for j, s in enumerate(snares, 1):
            add(folder, f"Beat {i:02d} - {stem(b)}/MDK_Kick808Snare_B{i:02d}_S{j:02d}.mid", combo([read[b], read[s]], [None, "Snare"]))
    made.append((folder, len(out) - n0, f"Each of the {len(k808)} beats of folder 8 with each of the {len(snares)} snare patterns of folder 5: three tracks. B = the Kick and 808 beat, S = the snare pattern."))

    # 17 · every Kick and Snare beat with every basic 4-bar hi-hat pattern
    folder, n0 = "17. Beats with Hi-Hats (Multi-Track)", len(out)
    for i, b in enumerate(ks, 1):
        for j, h in enumerate(hats, 1):
            add(folder, f"Beat {i:02d} - {stem(b)}/MDK_Beat{i:02d}_Hats{j:02d}.mid", combo([read[b], read[h]], [None, "Closed Hihat"]))
    made.append((folder, len(out) - n0, f"Each of the {len(ks)} beats of folder 7 with each of the {len(hats)} basic 4-bar hi-hat patterns of folder 2: three tracks. Hats = the hi-hat pattern, in the order of its folder."))
    return out, made, len(files)


README = """THE NEW FOLDERS (12 to 17)

Folders 1 to 11 are the kit as it always was: {kit} MIDI files, written one by one.
Folders 12 to 17 are those same patterns, ready in more ways, so you don't have to
build them yourself:

{lines}

That makes {total} MIDI files in the kit.

Every file in folders 12 to 17 comes from a file of folders 1 to 11. Nothing in them
is random and nothing was generated from outside the kit. Multi-track files open with
one track per drum, as the files of folders 7, 8 and 9 do.

GRIND STUDIO
"""


def check(out):
    """Every new file opens again, has notes, and its folder has no two files with the same notes."""
    twins = collections.Counter()
    for folder in sorted({p.split("/")[1] for p in out}):
        seen = {}
        for p, data in out.items():
            if p.split("/")[1] != folder:
                continue
            mid = parse(data)
            ns = [n for tr in mid["tracks"] for n in notes(tr)]
            assert ns, p
            assert len(p) < 200, p
            sig = hashlib.md5(repr([(tuple(notes(tr))) for tr in mid["tracks"]]).encode() + str(mid["ppq"]).encode()).hexdigest()
            if sig in seen:
                twins[folder] += 1
            seen[sig] = p
    return twins


def main(src, dst):
    z = zipfile.ZipFile(os.path.expanduser(src))
    out, made, kit = build(z)
    twins = check(out)
    total = kit + len(out)
    lines = "\n\n".join(f"{folder}  ({n} files)\n{text}" for folder, n, text in made)
    readme = README.format(kit=f"{kit:,}", lines=lines, total=f"{total:,}")
    with zipfile.ZipFile(os.path.expanduser(dst), "w", zipfile.ZIP_DEFLATED, compresslevel=9) as w:
        for info in z.infolist():
            w.writestr(info, z.read(info.filename))
        w.writestr(KIT + "READ ME - The new folders (12 to 17).txt", readme)
        for p in sorted(out):
            w.writestr(p, out[p])
    for folder, n, _ in made:
        print(f"  {n:>5}  {folder}" + (f"   ({twins[folder]} with the same notes as another)" if twins[folder] else ""))
    print(f"  {kit:>5}  the kit's own (folders 1 to 11)")
    print(f"  {total:>5}  MIDI files in the kit · {os.path.getsize(os.path.expanduser(dst)) / 1e6:.1f} MB · {dst}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
