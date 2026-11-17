#!/usr/bin/env python3
"""MIDI Drum Kit Expansions (House, Lo-Fi, Afrobeat): each expansion's own patterns as complete beats (12,000+ files).

2026-11-17, "puoi espandere ogni expansions all'interno delle 3 expansions ... cosi che siano worth more e le vendiamo
tutte e 3 a 27". Same method as tools/drum_kit_expand.py (the kit's 10,296 files): pure Python, no deps, nothing random,
nothing from outside the pack. Reads the Expansions zip and writes a new zip with everything it has, untouched, plus:

  House Grooves Ready-To-Use Vol.1
    03 - Single Drums                       each beat's drums (kick, clap, open hat, hat, snare) as their own file
    04 - Kick x Clap x Open Hat Grooves     every kick with every clap with every open hat of the 12 beats
    05 - Complete Beats Remixed             each beat with the kick, then the clap, then the open hat of each other beat

  MIDI Drum Kit - Afrobeat Expansion
    4. Complete Grooves (Kick + Snare + Shekere)   every kick with every backbeat with every shekere pattern
    5. Complete Beats Remixed                      the 5 beats with each kick, each backbeat, each shekere, each perc

  MIDI Drum Kit - Lofi Expansion/1. MIDI Files
    4. Complete Beats (Kick + Clap + Hi-Hat)       every kick with every clap with every hi-hat pattern
    5. Complete Beats Remixed                      the beats with each kick, each clap, each hi-hat, each perc

Sources of different lengths loop together: the file is as long as the shortest length all of them fit in whole times
(a 2-bar kick under a 3-bar shekere: 6 bars). Files whose notes are the same as another's in the same pack are left out.

    /usr/bin/python3 tools/expansions_expand.py IN.zip OUT.zip     # prints what it made and checks every file
"""
import collections
import hashlib
import math
import os
import re
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from drum_kit_expand import PPQ, dump, is_note, name_of, notes, parse, tempo_of  # noqa: E402

HOUSE = "House Grooves Ready-To-Use Vol.1/"
AFRO = "MIDI Drum Kit - Afrobeat Expansion/"
LOFI = "MIDI Drum Kit - Lofi Expansion/1. MIDI Files/"


def stem(n):
    return os.path.basename(n)[:-4]


def bpm_in_name(n):
    m = re.search(r"_(\d{2,3})$", stem(n))
    return int(m.group(1)) if m and 60 <= int(m.group(1)) <= 180 else None


def tracks_of(data):
    """[(track name, events at PPQ without tempo/meter/end)], tempo, length in beats (whole bars)."""
    mid = parse(data)
    scale = PPQ / mid["ppq"]
    out, end = [], 0
    for tr in mid["tracks"]:
        end = max(end, max((e[0] for e in tr), default=0))
        if not any(is_note(e) for e in tr):
            continue
        ev = [(round(t * scale), kind, a, d) for t, kind, a, d in tr if not (kind == "meta" and a in (0x2F, 0x51, 0x58, 0x59, 0x54, 0x03))]
        out.append((name_of(tr), ev))
    beats = end / mid["ppq"]
    return out, tempo_of(mid), int(-(-round(beats, 2) // 4) * 4) or 4


class Part:
    """One drum line: its name in the new file, its events, its length in beats."""

    def __init__(self, name, events, beats):
        self.name, self.events, self.beats = name, events, beats


def period(ev, beats):
    """The shortest whole-bar loop the line really repeats on (a 16th-note shaker written over 2.5 bars loops every bar):
    every note from that point on is a note one loop earlier. None if it doesn't repeat inside its own length."""
    on = [(t, kind, a, d) for t, kind, a, d in ev if kind == "ch" and (a & 0xF0) == 0x90 and d[1] > 0]
    tol = PPQ // 24
    for L in (4, 8, 12, 16):
        if L >= beats:
            return None
        span = L * PPQ
        if not any(t < span for t, *_ in on):
            continue
        if all(t < span or any(abs(t - span - u) <= tol and d[0] == e[0] for u, _, _, e in on) for t, _, _, d in on):
            return L
    return None


def single(data, name):
    trs, tempo, beats = tracks_of(data)
    ev = sorted((e for _, evs in trs for e in evs), key=lambda e: e[0])
    L = period(ev, beats)
    if L:
        kept = [n for n in notes(ev) if n[0] < L * PPQ]
        ev = sorted([(s, "ch", 0x90, bytes([p, v])) for s, l, p, v in kept] + [(s + l, "ch", 0x80, bytes([p, 0])) for s, l, p, v in kept], key=lambda e: e[0])
        beats = L
    return Part(name, ev, beats), tempo


def write(parts, tempo):
    """One multi-track file: each part on its own track and channel, all looped to a length every part fits in whole."""
    total = 4
    for p in parts:
        total = total * p.beats // math.gcd(total, p.beats)
    total = min(total, 64)
    end = total * PPQ
    out = [[(0, "meta", 0x58, bytes([4, 2, 24, 8])), (0, "meta", 0x51, round(60e6 / tempo).to_bytes(3, "big")), (end, "meta", 0x2F, b"")]]
    for ch, p in enumerate(parts):
        body = [(0, "meta", 0x03, p.name.encode("latin1", "replace"))]
        span = p.beats * PPQ
        for r in range(max(1, total // p.beats)):
            for t, kind, a, d in p.events:
                if kind == "meta":
                    if r == 0:
                        body.append((t, kind, a, d))
                    continue
                if t + r * span >= end and (a & 0xF0) == 0x90 and d[1] > 0:
                    continue
                body.append((t + r * span, kind, (a & 0xF0) | ch if kind == "ch" else a, d))
        body = fix_offs(body, end)
        body.append((max([end] + [e[0] for e in body]), "meta", 0x2F, b""))
        out.append(body)
    return dump(1, PPQ, out)


def fix_offs(body, end):
    """Drop note-offs left without their note-on (the loop cut it), and clip notes past the end."""
    on = collections.Counter()
    kept = []
    for e in sorted(body, key=lambda e: e[0]):
        t, kind, st, d = e
        if kind == "ch" and (st & 0xF0) in (0x80, 0x90):
            key = (st & 15, d[0])
            if (st & 0xF0) == 0x90 and d[1] > 0:
                on[key] += 1
            else:
                if not on[key]:
                    continue
                on[key] -= 1
                e = (min(t, end), kind, st, d)
        kept.append(e)
    return kept


def signature(data):
    mid = parse(data)
    return hashlib.md5(repr([tuple((s, l, p) for s, l, p, v in notes(tr)) for tr in mid["tracks"]]).encode()).hexdigest()


class Pack:
    def __init__(self, root):
        self.root, self.out, self.made, self.seen, self.twins = root, {}, [], set(), 0

    def add(self, path, data):
        sig = signature(data)
        if sig in self.seen:
            self.twins += 1
            return
        self.seen.add(sig)
        self.out[self.root + path] = data

    def folder(self, name, text, fn):
        n0 = len(self.out)
        fn(name)
        self.made.append((self.root + name, len(self.out) - n0, text))


def house(z, mids):
    pk = Pack(HOUSE)
    beats = sorted(n for n in mids if n.startswith(HOUSE + "01 - Complete Beats/"))
    drums = {}  # beat number → {role: Part}, tempo
    order = ["KICK", "CLAP", "OPEN HH", "HH", "SNARE"]
    label = {"KICK": "Kick", "CLAP": "Clap", "OPEN HH": "Open Hat", "HH": "Hat", "SNARE": "Snare"}
    for i, n in enumerate(beats, 1):
        trs, tempo, ln = tracks_of(z.read(n))
        drums[i] = ({name.strip().upper(): Part(label.get(name.strip().upper(), name), ev, ln) for name, ev in trs}, tempo or bpm_in_name(n) or 124, stem(n))

    def f3(folder):
        for i, (d, tempo, s) in drums.items():
            for role in order:
                if role in d:
                    pk.add(f"{folder}/{label[role]}/{s}_{label[role].replace(' ', '')}.mid", write([d[role]], tempo))

    def f4(folder):
        for i, (dk, tempo, _) in drums.items():
            for j, (dc, _, _) in drums.items():
                for k, (do, _, _) in drums.items():
                    pk.add(f"{folder}/Kick {i:02d}/HouseGroove_K{i:02d}_C{j:02d}_O{k:02d}_{tempo:.0f}.mid", write([dk["KICK"], dc["CLAP"], do["OPEN HH"]], tempo))

    def f5(folder):
        for i, (d, tempo, s) in drums.items():
            for role, word in (("KICK", "Kick"), ("CLAP", "Clap"), ("OPEN HH", "OpenHat")):
                for j, (o, _, _) in drums.items():
                    if j == i:
                        continue
                    parts = [o[r] if r == role else d[r] for r in order if r in d]
                    pk.add(f"{folder}/{s}/{s}_{word}From{j:02d}.mid", write(parts, tempo))

    pk.folder("03 - Single Drums", "Each drum of the 12 beats on its own: kick, clap, open hat, hat and snare, ready to mix with anything.", f3)
    pk.folder("04 - Kick x Clap x Open Hat Grooves", "Every kick of the 12 beats with every clap and every open hat. K, C and O say which beat each drum comes from, the tempo is the kick's beat.", f4)
    pk.folder("05 - Complete Beats Remixed", "Each beat with the kick, then the clap, then the open hat of each of the 11 other beats. Its other drums stay.", f5)
    return pk


def afro(z, mids):
    pk = Pack(AFRO)
    inside = lambda f: sorted(n for n in mids if n.startswith(AFRO + f + "/"))
    kicks = inside("1. Patterns/4. Kick")
    snares = inside("1. Patterns/1. Snare : Clap : Rim (Backbeat)")
    shekeres = inside("1. Patterns/2. Shekere : Hats")
    percs = inside("1. Patterns/3. Conga : Agogo : Percs")
    beats = inside("3. Complete Beats (Multi-Track)")
    P = {}
    for n, word in [(n, "Kick") for n in kicks] + [(n, "Snare, Clap") for n in snares] + [(n, "Shekere") for n in shekeres] + [(n, "Perc") for n in percs]:
        P[n] = single(z.read(n), word)
    tempo_of_ = lambda *ns: next((t for n in ns for t in (P[n][1], bpm_in_name(n)) if t), 100)

    def f4(folder):
        for i, k in enumerate(kicks, 1):
            for j, s in enumerate(snares, 1):
                for h, sh in enumerate(shekeres, 1):
                    t = tempo_of_(k, s, sh)
                    pk.add(f"{folder}/Kick {i:02d}/MDK_Afrobeat_Groove_K{i:02d}_S{j:02d}_Sh{h:02d}_{t:.0f}.mid", write([P[k][0], P[s][0], P[sh][0]], t))

    def f5(folder):
        for b in beats:
            trs, tempo, ln = tracks_of(z.read(b))
            own = [Part(name, ev, ln) for name, ev in trs]
            role = lambda p: p.name.split(",")[0].strip().lower()
            for src, r, word in [(kicks, "kick", "Kick"), (snares, "snare", "Snare"), (shekeres, "shekere", "Shekere"), (percs, "perc", "Perc")]:
                for j, n in enumerate(src, 1):
                    new = P[n][0]
                    parts = [Part(p.name, new.events, new.beats) if role(p) == r or (r == "perc" and role(p) in ("fill", "perc")) else p for p in own]
                    pk.add(f"{folder}/{stem(b)}/{stem(b)}_{word}{j:02d}.mid", write(parts, tempo or 100))

    pk.folder("4. Complete Grooves (Kick + Snare + Shekere)", f"Each of the {len(kicks)} kicks with each of the {len(snares)} backbeats (snare, clap, rim) and each of the {len(shekeres)} shekere patterns. K, S and Sh are their numbers in folder 1, the last number is the tempo.", f4)
    pk.folder("5. Complete Beats Remixed", "The 5 complete beats with each kick, each backbeat, each shekere and each perc pattern of folder 1 in place of their own. Their other drums stay.", f5)
    return pk


def lofi(z, mids):
    pk = Pack(LOFI)
    inside = lambda f: sorted(n for n in mids if n.startswith(LOFI + f + "/"))
    kicks = inside("1. Patterns/2. Kick")
    claps = inside("1. Patterns/1. Clap")
    hats = inside("1. Patterns/3. HitHat")
    percs = inside("1. Patterns/4. Percussions")
    beats = inside("3. Complete Beats (Multi-Track)")
    P = {}
    for n, word in [(n, "Kick") for n in kicks] + [(n, "Clap") for n in claps] + [(n, "Hi-Hat") for n in hats] + [(n, "Perc") for n in percs]:
        P[n] = single(z.read(n), word)

    def f4(folder):
        for i, k in enumerate(kicks, 1):
            for j, c in enumerate(claps, 1):
                for h, hh in enumerate(hats, 1):
                    t = P[k][1] or 75
                    pk.add(f"{folder}/Kick {i:02d}/MDK_Lofi_Beat_K{i:02d}_C{j:02d}_H{h:02d}_{t:.0f}.mid", write([P[k][0], P[c][0], P[hh][0]], t))

    def f5(folder):
        for b in beats:
            trs, tempo, ln = tracks_of(z.read(b))
            own = [Part(name, ev, ln) for name, ev in trs]
            for src, r, word in [(kicks, "KICK", "Kick"), (claps, "CLAP", "Clap"), (hats, "HITHAT", "HiHat"), (percs, "PERC", "Perc")]:
                for j, n in enumerate(src, 1):
                    new = P[n][0]
                    if any(p.name.strip().upper() == r for p in own):
                        parts = [Part(p.name, new.events, new.beats) if p.name.strip().upper() == r else p for p in own]
                    else:
                        parts = own + [Part("PERC", new.events, new.beats)]
                    pk.add(f"{folder}/{stem(b)}/{stem(b)}_{word}{j:02d}.mid", write(parts, tempo or 75))

    pk.folder("4. Complete Beats (Kick + Clap + Hi-Hat)", f"Each of the {len(kicks)} kicks with each of the {len(claps)} claps and each of the {len(hats)} hi-hat patterns. K, C and H are their numbers in folder 1, the last number is the tempo.", f4)
    pk.folder("5. Complete Beats Remixed", "The complete beats with each kick, each clap, each hi-hat and each perc pattern of folder 1 in place of their own. Their other drums stay.", f5)
    return pk


README = """{title}

{own} MIDI files were in this expansion. The new folders are those same patterns,
put together into complete beats for you:

{lines}

That makes {total} MIDI files in this expansion.

Every new file comes from the expansion's own patterns. Nothing in them is random
and nothing was generated from outside the pack. Each drum is on its own track,
like the expansion's Complete Beats.

GRIND STUDIO
"""


def check(out):
    for p, data in out.items():
        mid = parse(data)
        assert any(notes(tr) for tr in mid["tracks"]), p
        assert len(p) < 200, p
        for tr in mid["tracks"]:
            for s, l, pitch, v in notes(tr):
                assert l >= 0, p


def main(src, dst):
    z = zipfile.ZipFile(os.path.expanduser(src))
    mids = [n for n in z.namelist() if n.lower().endswith(".mid") and "__MACOSX" not in n]
    packs = [("HOUSE GROOVES", house(z, mids)), ("AFROBEAT EXPANSION", afro(z, mids)), ("LO-FI EXPANSION", lofi(z, mids))]
    grand = 0
    with zipfile.ZipFile(os.path.expanduser(dst), "w", zipfile.ZIP_DEFLATED, compresslevel=9) as w:
        for info in z.infolist():
            if "__MACOSX" in info.filename or info.filename.endswith(".DS_Store"):
                continue
            w.writestr(info, z.read(info.filename))
        for title, pk in packs:
            check(pk.out)
            own = len([n for n in mids if n.startswith(pk.root.split("/")[0] + "/")])
            total = own + len(pk.out)
            grand += total
            lines = "\n\n".join(f"{f.split('/')[-1]}  ({n:,} files)\n{t}" for f, n, t in pk.made)
            w.writestr(pk.root + "READ ME - The new folders.txt", README.format(title=title, own=own, lines=lines, total=f"{total:,}"))
            for p in sorted(pk.out):
                w.writestr(p, pk.out[p])
            for f, n, _ in pk.made:
                print(f"  {n:>5}  {f}")
            print(f"  {own:>5}  {title}: its own ({pk.twins} same-note files left out) → {total:,}")
    print(f"  {grand:,} MIDI files · {os.path.getsize(os.path.expanduser(dst)) / 1e6:.1f} MB · {dst}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
