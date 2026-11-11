#!/usr/bin/env python3
"""TOP HITS MIDI Bundle: every progression of the pack in more versions ("salse diverse").

Pure Python, no deps. Reads the 1,000 transcriptions of "1. Hitmaker MIDI Pack" (four genre
folders), names the chord of every change (root, quality, bass), then writes them again:

  1. Original Transcriptions        the files as they are in the pack (copied, names cleaned)
  2. Best Voicing (Piano)           bass + 3/4 upper voices, chosen for the whole song at once
                                    (dynamic programming) by the voice-leading rules below
  3. Easy Triads                    three notes, one hand, the nearest inversion each time
  4. Neo-Soul & R&B Voicings        7ths and 9ths from the key, rootless right hand + bass
  5. Open Voicings (Pads & Strings) wide spread chords, held through repeated chords
  6. Arpeggios                      the Best Voicing broken in 8ths (16ths under 90 BPM)
  7. Bass Lines                     the bass of every chord, in the song's rhythm
  8. All 12 Keys (Best Voicing)     one folder per song, the Best Voicing in all 12 keys

Every written file keeps the song's rhythm (the onsets and lengths of its chords), its BPM and
time signature, and carries the chord names as markers (DAWs show them over the clip).

Voice-leading rules of the Best Voicing (classical four-part writing, adapted to piano):
  - complete chords: 3rd always, 7th always in 7th chords, 5th the first tone left out;
    in triads the root is the doubled note, never the 3rd
  - bass: the chord's bass (root, or the inversion / slash bass the song uses), E1–D3,
    the octave nearest the previous bass
  - right hand E3–A5, no gap over an octave between neighbouring upper voices,
    no 2nds at the bottom of the hand, bass at least a 4th under the right hand
  - no parallel 5ths or octaves between any two voices, no hidden 5ths/8ves into the
    outer voices by leap, no voice crossing
  - common tones held, every other voice by the smallest step; top voice leaps over a
    4th penalised; 7ths resolve down by step when the next chord allows; register kept
    around middle C
  - repeated chords keep the same voicing

    /usr/bin/python3 tools/top_hits_variants.py <pack dir> <out dir> [--only "Blinding"]
"""
import json
import os
import re
import shutil
import struct
import sys
import unicodedata

SONGS = os.path.expanduser("~/Desktop/Code Projects/grind-studio-landing-pages/src/data/top-hits-songs.json")
GENRES = ["Modern Pop & Ballads", "Hiphop, Trap & Urban", "Dance & Electronic", "Vintage Classics, Rock & Country"]
TPB = 480

# ───────────────────────────── MIDI read / write ─────────────────────────────


def vlq(data, i):
    v = 0
    while True:
        b = data[i]
        i += 1
        v = (v << 7) | (b & 0x7F)
        if not b & 0x80:
            return v, i


def parse(path):
    """→ dict(tpb, bpm, ts=(num, den), notes=[(start, dur, pitch, vel)] in beats)"""
    data = open(path, "rb").read()
    hlen = struct.unpack(">I", data[4:8])[0]
    _, ntracks, tpb = struct.unpack(">HHH", data[8:14])
    i, tempo, ts, notes = 8 + hlen, None, None, []
    for _ in range(ntracks):
        if i + 8 > len(data):
            break
        cid = data[i:i + 4]
        length = struct.unpack(">I", data[i + 4:i + 8])[0]
        i += 8
        end = min(i + length, len(data))
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
                if mtype == 0x51 and tempo is None and mlen == 3:
                    tempo = 60_000_000 / int.from_bytes(data[j:j + 3], "big")
                if mtype == 0x58 and ts is None and mlen >= 2:
                    ts = (data[j], 2 ** data[j + 1])
                i = j + mlen
                continue
            if b in (0xF0, 0xF7):
                slen, j = vlq(data, i + 1)
                i = j + slen
                continue
            if b & 0x80:
                status = b
                i += 1
            kind = status & 0xF0
            if kind in (0x80, 0x90):
                pitch, vel = data[i], data[i + 1]
                i += 2
                key = (status & 0x0F, pitch)
                if kind == 0x90 and vel > 0:
                    if key in open_:  # retrigger: close the old one
                        s, v = open_.pop(key)
                        if tick > s:
                            notes.append((s, tick, pitch, v))
                    open_[key] = (tick, vel)
                elif key in open_:
                    s, v = open_.pop(key)
                    if tick > s:
                        notes.append((s, tick, pitch, v))
            elif kind in (0xC0, 0xD0):
                i += 1
            else:
                i += 2
        i = end
    out = [(s / tpb, (e - s) / tpb, p, v) for s, e, p, v in notes]
    out.sort()
    return {"tpb": tpb, "bpm": tempo, "ts": ts or (4, 4), "notes": out}


def wvlq(v):
    b = [v & 0x7F]
    v >>= 7
    while v:
        b.append((v & 0x7F) | 0x80)
        v >>= 7
    return bytes(reversed(b))


def write(path, bpm, ts, notes, name, markers=()):
    """notes: [(start, dur, pitch, vel)] in beats; markers: [(beat, text)]. Format 0, channel 1."""
    ev = []  # (tick, order, bytes)
    ev.append((0, 0, b"\xff\x03" + wvlq(len(name.encode())) + name.encode()))
    ev.append((0, 0, b"\xff\x51\x03" + int(round(60_000_000 / bpm)).to_bytes(3, "big")))
    num, den = ts
    ev.append((0, 0, bytes([0xFF, 0x58, 0x04, num, max(0, den.bit_length() - 1), 24, 8])))
    for beat, text in markers:
        t = text.encode("utf-8")
        ev.append((int(round(beat * TPB)), 1, b"\xff\x06" + wvlq(len(t)) + t))
    for s, d, p, v in notes:
        a = int(round(s * TPB))
        b = max(a + 1, int(round((s + d) * TPB)))
        if not 0 <= p <= 127:
            continue
        ev.append((a, 3, bytes([0x90, p, max(1, min(127, int(v)))])))
        ev.append((b, 2, bytes([0x80, p, 0])))
    ev.sort(key=lambda e: (e[0], e[1]))
    trk, last = bytearray(), 0
    for t, _, data in ev:
        trk += wvlq(t - last) + data
        last = t
    trk += b"\x00\xff\x2f\x00"
    with open(path, "wb") as f:
        f.write(b"MThd" + struct.pack(">IHHH", 6, 0, 1, TPB))
        f.write(b"MTrk" + struct.pack(">I", len(trk)) + trk)


# ───────────────────────────── chords ─────────────────────────────

NOTE_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
NOTE_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
PC = {n: i for i, n in enumerate(NOTE_SHARP)}
PC.update({n: i for i, n in enumerate(NOTE_FLAT)})
PC.update({"Cb": 11, "Fb": 4, "E#": 5, "B#": 0})
# key names for the 12 keys folder (the usual spelling of each key)
MAJOR_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
MINOR_NAMES = ["Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "Bbm", "Bm"]
FLAT_KEYS = {(5, 0), (10, 0), (3, 0), (8, 0), (1, 0), (6, 0),  # F Bb Eb Ab Db Gb major
             (2, 1), (7, 1), (0, 1), (5, 1), (10, 1), (3, 1)}  # Dm Gm Cm Fm Bbm Ebm

# quality: (intervals, symbol, complexity). Intervals in the order tones are kept (3rd, 7th, ...).
QUAL = {
    "maj": ((0, 4, 7), "", 0.0),
    "min": ((0, 3, 7), "m", 0.0),
    "dim": ((0, 3, 6), "dim", 0.25),
    "aug": ((0, 4, 8), "aug", 0.35),
    "sus2": ((0, 2, 7), "sus2", 0.2),
    "sus4": ((0, 5, 7), "sus4", 0.2),
    "5": ((0, 7), "5", 0.15),
    "7": ((0, 4, 7, 10), "7", 0.12),
    "maj7": ((0, 4, 7, 11), "maj7", 0.12),
    "m7": ((0, 3, 7, 10), "m7", 0.12),
    "m7b5": ((0, 3, 6, 10), "m7b5", 0.2),
    "dim7": ((0, 3, 6, 9), "dim7", 0.3),
    "mmaj7": ((0, 3, 7, 11), "m(maj7)", 0.35),
    "6": ((0, 4, 7, 9), "6", 0.2),
    "m6": ((0, 3, 7, 9), "m6", 0.22),
    "add9": ((0, 4, 7, 2), "add9", 0.15),
    "madd9": ((0, 3, 7, 2), "m(add9)", 0.15),
    "7sus4": ((0, 5, 7, 10), "7sus4", 0.25),
    "9": ((0, 4, 7, 10, 2), "9", 0.3),
    "maj9": ((0, 4, 7, 11, 2), "maj9", 0.3),
    "m9": ((0, 3, 7, 10, 2), "m9", 0.3),
    "m11": ((0, 3, 7, 10, 5), "m11", 0.4),
    "add11": ((0, 4, 7, 5), "add11", 0.45),
}
THIRD = {"maj": 4, "min": 3, "dim": 3, "aug": 4, "7": 4, "maj7": 4, "m7": 3, "m7b5": 3, "dim7": 3,
         "mmaj7": 3, "6": 4, "m6": 3, "add9": 4, "madd9": 3, "9": 4, "maj9": 4, "m9": 3, "m11": 3, "add11": 4}
MINORISH = {"min", "m7", "m7b5", "dim", "dim7", "mmaj7", "m6", "madd9", "m9", "m11"}


def key_of(name):
    """'Fm' → (5, 1); 'Bb' → (10, 0); None when there's no key."""
    if not name:
        return None
    m = re.match(r"^([A-G][#b]?)(m?)$", name.strip())
    if not m:
        return None
    return PC[m.group(1)], 1 if m.group(2) else 0


def spell(pc, key):
    flats = key is not None and ((key[0], key[1]) in FLAT_KEYS)
    return (NOTE_FLAT if flats else NOTE_SHARP)[pc % 12]


def chord_name(ch, key):
    root, q, bass = ch["root"], ch["q"], ch["bass"]
    s = spell(root, key) + QUAL[q][1]
    if bass != root:
        s += "/" + spell(bass, key)
    return s


def identify(weights, bass_pc, prev=None):
    """weights: 12 floats (time-weighted presence). → (root, quality) or None."""
    total = sum(weights)
    if total <= 0:
        return None
    w = [x / total for x in weights]
    present = [i for i in range(12) if w[i] > 0.04]
    best, best_s = None, -9
    for root in range(12):
        for q, (iv, _, cx) in QUAL.items():
            tones = {(root + x) % 12 for x in iv}
            cov = sum(w[p] for p in tones)
            extra = sum(w[p] for p in range(12) if p not in tones)
            miss = 0.0
            for x in iv:
                p = (root + x) % 12
                if w[p] < 0.02:
                    miss += 0.12 if x == 7 else (0.45 if x in (3, 4) else 0.3)
            s = cov - 1.2 * extra - miss - cx * 0.5
            if root == bass_pc:
                s += 0.18
            if prev and prev[0] == root and prev[1] == q:
                s += 0.03
            if s > best_s:
                best_s, best = s, (root, q)
    # two notes a 5th apart: power chord; one note: nothing to name
    if len(present) <= 1:
        return None
    return best


def chords_of(notes, ts):
    """Cut the song where the harmony changes. → [dict(start, dur, end_note, root, q, bass, vel)]"""
    if not notes:
        return []
    Q = 1 / 8
    groups = {}
    for n in notes:
        k = round(n[0] / Q) * Q
        groups.setdefault(k, []).append(n)
    onsets = sorted(groups)
    multi = [t for t in onsets if len(groups[t]) >= 2]
    mono_share = 1 - len(multi) / len(onsets)
    end_song = max(s + d for s, d, _, _ in notes)
    bar = ts[0] * 4 / ts[1]
    if mono_share > 0.6 or len(multi) < 2:
        # arpeggiated or single-line files: the harmony changes on half bars at most
        step = bar / 2
        cuts = sorted({round(t / step) * step for t in onsets})
    else:
        cuts = multi[:]
        if onsets[0] < cuts[0]:
            cuts.insert(0, onsets[0])
    cuts = [c for c in cuts if c < end_song]
    regions = []
    for i, c in enumerate(cuts):
        nxt = cuts[i + 1] if i + 1 < len(cuts) else end_song
        if nxt - c < 1e-6:
            continue
        w = [0.0] * 12
        low = None
        lastend, vels = c, []
        for s, d, p, v in notes:
            e = s + d
            ov = min(e, nxt) - max(s, c)
            if ov <= 1e-6:
                continue
            starts_here = c - Q / 2 <= s < nxt
            weight = ov * (1.0 if starts_here else 0.6)
            w[p % 12] += weight
            # the bass: the lowest note struck in the region (a bass on the off-beat counts)
            if starts_here and (low is None or p < low):
                low = p
            if starts_here:
                lastend = max(lastend, min(e, nxt))
                vels.append(v)
        if low is None:
            sounding = [p for s, d, p, v in notes if s < nxt and s + d > c]
            if not sounding:
                continue
            low = min(sounding)
        # a chord struck high while the bass rests: no bass of its own (inherits, see below)
        held = regions and low >= 55 and regions[-1]["low"] < 55 and low - regions[-1]["low"] >= 12
        if not held:
            w[low % 12] += 0.5 * (nxt - c)  # the bass counts double
        # the rhythm: bass hits (each with its own note: walking basses stay) and chord hits
        grp = {}
        for n in notes:
            if c - Q / 2 <= n[0] < nxt - Q / 2:
                grp.setdefault(round(n[0] / Q) * Q, []).append(n)
        bh, uh = [], []
        for t in sorted(grp):
            g = sorted(grp[t], key=lambda n: n[2])
            if len(g) == 1:
                if g[0][2] < 55:
                    bh.append((g[0][0], g[0][1], g[0][2], g[0][3]))
                continue  # a lone upper note (melody, arpeggio) rings inside the chord
            if g[0][2] < 55 and g[1][2] - g[0][2] >= 5:
                bh.append((g[0][0], g[0][1], g[0][2], g[0][3]))
                g = g[1:]
            if len(g) >= 2 or not bh or bh[-1][0] != g[0][0]:
                uh.append((max(c, g[0][0]), max(n[1] for n in g), sum(n[3] for n in g) / len(g)))
        if mono_share > 0.6 or not uh:
            uh = [(c, (lastend if lastend > c else nxt) - c, sum(vels) / len(vels) if vels else 90)]
        regions.append({"start": c, "next": nxt, "end": lastend if lastend > c else nxt, "w": w,
                        "bass": None if held else low % 12, "low": regions[-1]["low"] if held else low,
                        "vel": sum(vels) / len(vels) if vels else 90, "uh": uh, "bh": bh})
    out, prev = [], None
    for r in regions:
        rb = r["bass"] if r["bass"] is not None else (out[-1]["bass"] if out else None)
        idn = identify(r["w"], rb if r["bass"] is not None else -1, prev)
        if idn is None:
            if out:  # a lone note: the previous chord goes on (a passing bass)
                out[-1]["bh"] += r["bh"]
                continue
            # nothing named yet: power chord on the bass
            idn = (r["low"] % 12, "5")
        root, q = idn
        tones = {(root + x) % 12 for x in QUAL[q][0]}
        bass = rb if rb is not None and rb in tones else root
        out.append({"start": r["start"], "dur": r["end"] - r["start"], "slot": r["next"] - r["start"],
                    "root": root, "q": q, "bass": bass, "vel": r["vel"], "uh": r["uh"], "bh": r["bh"]})
        prev = idn
    # a chord swallowed a following lone note: let it ring until the next change
    for i, ch in enumerate(out):
        nxt = out[i + 1]["start"] if i + 1 < len(out) else end_song
        ch["slot"] = nxt - ch["start"]
        if ch["dur"] > ch["slot"]:
            ch["dur"] = ch["slot"]
        end = ch["start"] + ch["slot"]
        hits = sorted(ch["uh"])
        ch["uh"] = [(t, max(0.05, min(d, (hits[k + 1][0] if k + 1 < len(hits) else end) - t)), v)
                    for k, (t, d, v) in enumerate(hits)]
    # a song without any bass part: the chords' bass on the chords' rhythm
    if not any(ch["bh"] for ch in out):
        for ch in out:
            ch["bh"] = [(t, d, None, v) for t, d, v in ch["uh"]]
    return out


# ───────────────────────────── voicings ─────────────────────────────


def diatonic(key):
    if key is None:
        return None
    t, minor = key
    steps = (0, 2, 3, 5, 7, 8, 10) if minor else (0, 2, 4, 5, 7, 9, 11)
    return {(t + s) % 12 for s in steps}


def simplify(q):
    """Easy Triads: every chord as a triad."""
    if q in ("maj", "7", "maj7", "6", "add9", "9", "maj9", "add11"):
        return "maj"
    if q in ("min", "m7", "mmaj7", "m6", "madd9", "m9", "m11"):
        return "min"
    if q in ("m7b5", "dim7"):
        return "dim"
    if q == "7sus4":
        return "sus4"
    return q


def enrich(ch, key):
    """Neo-Soul: add the 7th and the 9th the key allows. → quality"""
    q, root = ch["q"], ch["root"]
    scale = diatonic(key)

    def ok(iv):
        return scale is None or (root + iv) % 12 in scale
    if q in ("maj", "add9", "6"):
        if ok(11) and ok(2):
            return "maj9"
        if ok(10) and ok(2):
            return "9"
        if ok(10):
            return "7"
        return "add9"
    if q in ("min", "madd9", "m6"):
        if ok(10) and ok(2):
            return "m9"
        return "m7"
    if q == "7":
        return "9" if ok(2) or scale is None else "7"
    if q == "maj7":
        return "maj9" if ok(2) else "maj7"
    if q == "m7":
        return "m9" if ok(2) else "m7"
    if q == "dim":
        return "m7b5" if ok(10) else "dim7"
    if q == "sus4":
        return "7sus4"
    if q == "sus2":
        return "add9"
    if q == "5":
        return "5"
    return q


def upper_tones(q, root, style):
    """Pitch classes for the right hand, in order of importance, and how many voices."""
    iv = QUAL[q][0]
    third = THIRD.get(q)
    pcs = []
    if style == "easy":
        return [(root + x) % 12 for x in iv], len(iv)
    if q == "5":
        return [root, (root + 7) % 12], 3
    if len(iv) == 3:  # triad: root doubled, all three tones
        return [(root + x) % 12 for x in (iv[1], iv[2], 0)], 3
    # 7ths / 6ths / add9: 3rd (or sus tone), the colour tones, root, 5th last
    order = []
    if third is not None:
        order.append(third)
    order += [x for x in iv if x not in (0, 7, third)]
    if style == "neo":  # rootless: 3rd, 7th, 9th, 5th
        order += [7]
        n = min(4, len(order))
        return [(root + x) % 12 for x in order], n
    order += [0, 7]
    n = 4 if len(iv) >= 4 else 3
    return [(root + x) % 12 for x in order], n


def candidates(tones, n, lo, hi, open_=False, max_gap=12):
    """Every right-hand voicing of n notes in [lo, hi] using the first n tones (the most important),
    tones beyond allowed to drop. Sorted tuples."""
    need = tones[:n]
    # the n most important tones; when fewer distinct tones than n, double the first (root / 3rd rule handled by caller)
    pool = []
    for pc in need:
        pool.append([p for p in range(lo, hi + 1) if p % 12 == pc])
    out = set()

    def rec(i, chosen):
        if i == len(pool):
            v = tuple(sorted(chosen))
            if len(set(v)) != len(v):
                return
            gaps = [b - a for a, b in zip(v, v[1:])]
            if gaps and max(gaps) > max_gap:
                return
            if gaps and gaps[0] <= 2 and v[0] < 60:  # no 2nd at the bottom of the hand
                return
            if open_:
                if v[-1] - v[0] < 14 or (gaps and min(gaps) < 3):
                    return
            else:
                if v[-1] - v[0] > 19:
                    return
            out.add(v)
            return
        for p in pool[i]:
            rec(i + 1, chosen + [p])
    rec(0, [])
    return list(out)


def pair_motion(a, b):
    """Voices a → b (sorted, maybe different sizes): matched in order. → list of (from, to)."""
    if len(a) == len(b):
        return list(zip(a, b))
    if len(a) > len(b):
        # the extra voice of a goes to the nearest note of b
        return [(x, min(b, key=lambda y: abs(y - x))) for x in a]
    return [(min(a, key=lambda y: abs(y - x)), x) for x in b]


def trans_cost(pa, pb, ba, bb, prevq_tones=None):
    """Cost of moving voicing pa (+bass ba) to pb (+bass bb)."""
    c = 0.0
    if pa == pb and ba == bb:
        return 0.0
    moves = pair_motion(pa, pb)
    for x, y in moves:
        d = abs(x - y)
        c += d if d <= 2 else d * 1.4
    # top voice
    dt = abs(pa[-1] - pb[-1])
    if dt > 5:
        c += (dt - 5) * 1.5
    # parallels: any two voices incl. bass, same interval class 0 or 7, both moving same direction
    va = [ba] + list(pa) if len(pa) == len(pb) else None
    vb = [bb] + list(pb) if va else None
    if va:
        for i in range(len(va)):
            for j in range(i + 1, len(va)):
                ia, ib = (va[j] - va[i]) % 12, (vb[j] - vb[i]) % 12
                if ia == ib and ia in (0, 7) and va[i] != vb[i] and va[j] != vb[j]:
                    c += 60
        # hidden 5ths / 8ves into the outer voices: similar motion, top leaps
        sb, st = vb[0] - va[0], vb[-1] - va[-1]
        if sb * st > 0 and (vb[-1] - vb[0]) % 12 in (0, 7) and abs(st) > 2:
            c += 4
    return c


def static_cost(v, bass, center):
    c = abs(sum(v) / len(v) - center) * 0.25
    if bass < 36:
        c += (36 - bass) * 1.0
    if v[0] - bass < 5:
        c += 8
    if v[0] < 55 and len(v) > 1 and v[1] - v[0] <= 4:  # low thirds get muddy
        c += 3
    return c


def period_of(chords):
    sig = [(c["root"], c["vq"], c["bass"], round(c["slot"], 2)) for c in chords]
    n = len(sig)
    for p in range(1, n // 2 + 1):
        if all(sig[i] == sig[i % p] for i in range(n)):
            return p
    return n


def voice_song(chords, style, transpose=0):
    """→ list of (rh tuple, bass) per chord. A looped progression is voiced once, as a loop:
    the last chord leads back into the first by the same rules, and every pass is identical."""
    p = period_of(chords)
    if p < len(chords) and p > 1:
        loop = chords[:p]
        free, _ = voice_seq(loop * 3, style, transpose)
        pins = []
        for x in (free[p], free[2 * p], free[0]) + tuple(first_states(loop[0], style, transpose)[:5]):
            if x not in pins:
                pins.append(x)
        best, best_c = None, float("inf")
        for x in pins:  # the loop closed on each candidate first voicing: the cheapest wins
            path, c = voice_seq(loop + [loop[0]], style, transpose, pin=x)
            if c < best_c:
                best, best_c = path[:p], c
        return [best[i % p] for i in range(len(chords))]
    return voice_seq(chords, style, transpose)[0]


def chord_states(ch, style, transpose, lo, hi, open_):
    root = (ch["root"] + transpose) % 12
    tones, n = upper_tones(ch["vq"], root, style)
    if style == "open":
        # wide: 5th, 3rd/7th/9th spread over two octaves, root on top allowed
        iv = QUAL[ch["vq"]][0]
        tones = [(root + x) % 12 for x in ([7] + [x for x in iv if x not in (0, 7)] + [0])]
        n = min(4, len(set(tones)))
    cands = candidates(tones, n, lo, hi, open_=open_, max_gap=12 if not open_ else 10)
    if not cands and n > 3:
        cands = candidates(tones, 3, lo, hi, open_=open_)
    if not cands:
        cands = candidates(tones, min(3, len(tones)), lo, hi + 5, open_=False, max_gap=14)
    bass_pc = (ch["bass"] + transpose) % 12
    basses = [p for p in range(33, 51) if p % 12 == bass_pc]
    return [(v, b) for v in cands for b in basses]


RANGES = {"easy": (55, 76, 64, False), "neo": (52, 81, 65, False), "open": (48, 86, 66, True), "best": (52, 81, 65, False)}


def first_states(ch, style, transpose):
    lo, hi, center, open_ = RANGES[style]
    st = chord_states(ch, style, transpose, lo, hi, open_)
    return sorted(st, key=lambda x: static_cost(x[0], x[1], center) + abs(x[1] - 40) * 0.15)


def voice_seq(chords, style, transpose=0, pin=None):
    """→ (list of (rh tuple, bass) per chord, total cost). pin: the first and the last chord
    must take this voicing (a loop closed on itself)."""
    lo, hi, center, open_ = RANGES[style]
    states = [chord_states(ch, style, transpose, lo, hi, open_) for ch in chords]
    if pin is not None:
        states[0] = [pin]
        states[-1] = [pin]
    # Viterbi
    INF = float("inf")
    cost = [static_cost(v, b, center) + abs(b - 40) * 0.15 for v, b in states[0]]
    back = []
    for k in range(1, len(states)):
        prevs, cur = states[k - 1], states[k]
        same = chords[k]["root"] == chords[k - 1]["root"] and chords[k]["vq"] == chords[k - 1]["vq"] and chords[k]["bass"] == chords[k - 1]["bass"]
        nc, bk = [], []
        for v, b in cur:
            sc = static_cost(v, b, center)
            best, bi = INF, 0
            for j, (pv, pb) in enumerate(prevs):
                t = cost[j] + trans_cost(pv, v, pb, b)
                bd = abs(b - pb)
                t += 0 if bd == 0 else (bd * 0.25 if bd <= 7 else bd * 0.6)
                if same and (pv != v or pb != b):
                    t += 20
                # 7th resolves down by step
                pch = chords[k - 1]
                if QUAL[pch["vq"]][0][-1] in (10, 11) or pch["vq"] in ("7", "m7", "maj7", "m7b5", "9", "m9", "maj9"):
                    sev = ((pch["root"] + transpose) + (10 if pch["vq"] in ("7", "m7", "m7b5", "9", "m9") else 11)) % 12
                    for x in pv:
                        if x % 12 == sev and x not in v and not any(y in (x - 1, x - 2) for y in v):
                            t += 1.5
                if t < best:
                    best, bi = t, j
            nc.append(best + sc)
            bk.append(bi)
        cost = nc
        back.append(bk)
    i = min(range(len(cost)), key=lambda j: cost[j])
    total = cost[i]
    path = [i]
    for bk in reversed(back):
        i = bk[i]
        path.append(i)
    path.reverse()
    return [states[k][path[k]] for k in range(len(states))], total


# ───────────────────────────── styles ─────────────────────────────


def humanless(v):
    return max(60, min(110, int(v)))


def bass_hits(chords, vs, transpose, drop=0):
    """The song's bass part on the chosen bass notes: every hit keeps its rhythm and its own note
    (a passing or walking bass stays), placed in the octave nearest the chord's bass."""
    out = []
    for ch, (v, b) in zip(chords, vs):
        b -= drop
        for t, d, p, vel in ch["bh"]:
            pc = (ch["bass"] + transpose) % 12 if p is None else (p + transpose) % 12
            q = min((x for x in range(b - 6, b + 7) if x % 12 == pc), key=lambda x: (abs(x - b), x))
            out.append([t, d, q, humanless(vel)])
    out.sort()
    for k in range(len(out) - 1):  # one bass note at a time
        out[k][1] = max(0.05, min(out[k][1], out[k + 1][0] - out[k][0]))
    return [tuple(n) for n in out]


def render(style, chords, bpm, ts, transpose=0):
    """→ notes [(start, dur, pitch, vel)]"""
    notes = []
    vstyle = {"best": "best", "arp": "best", "easy": "easy", "neo": "neo", "open": "open", "bass": "best"}[style]
    for ch in chords:
        ch["vq"] = {"easy": simplify(ch["q"]), "neo": ch.get("nq", ch["q"])}.get(vstyle, ch["q"])
    vs = voice_song(chords, vstyle, transpose)
    if style == "bass":
        # bass guitar register: roots between E1 and D#2 when the piano's bass is higher
        drop = 12 if sum(b for _, b in vs) / len(vs) >= 40 else 0
        return bass_hits(chords, vs, transpose, drop)
    if style == "open":
        # merge repeated chords into one held chord
        k = 0
        while k < len(chords):
            j = k
            while j + 1 < len(chords) and vs[j + 1] == vs[k]:
                j += 1
            start = chords[k]["start"]
            end = chords[j]["start"] + max(chords[j]["dur"], chords[j]["slot"] * 0.98)
            v, b = vs[k]
            vel = humanless(chords[k]["vel"]) - 10
            notes.append((start, end - start, b, vel))
            notes.append((start, end - start, b + 12, vel - 8))
            for p in v:
                notes.append((start, end - start, p, vel))
            k = j + 1
        return notes
    if style == "arp":
        step = 0.25 if bpm < 90 else 0.5
        notes += bass_hits(chords, vs, transpose)
        for ch, (v, b) in zip(chords, vs):
            vel = humanless(ch["vel"])
            last = max(t + d for t, d, _ in ch["uh"]) - ch["start"]
            span = ch["slot"] if last >= ch["slot"] * 0.85 else max(last, step)
            seq = list(v) + list(v[-2:0:-1]) if len(v) > 2 else list(v)
            t, i = 0.0, 0
            while t < span - 1e-6:
                d = min(step, span - t)
                acc = 8 if abs((ch["start"] + t) % 1) < 1e-6 else 0
                notes.append((ch["start"] + t, d * 0.95, seq[i % len(seq)], vel - 12 + acc))
                t += step
                i += 1
        return notes
    if style != "easy":
        notes += bass_hits(chords, vs, transpose)
    for ch, (v, b) in zip(chords, vs):
        for t, d, vel in ch["uh"]:
            for p in v:
                notes.append((t, d, p, humanless(vel) - 4))
    return notes


STYLES = [
    ("best", "2. Best Voicing (Piano)", "Best Voicing"),
    ("easy", "3. Easy Triads", "Easy Triads"),
    ("neo", "4. Neo-Soul & R&B Voicings", "Neo-Soul"),
    ("open", "5. Open Voicings (Pads & Strings)", "Open Voicing"),
    ("arp", "6. Arpeggios", "Arpeggio"),
    ("bass", "7. Bass Lines", "Bass Line"),
]
KEYS_DIR = "8. All 12 Keys (Best Voicing)"
ORIG_DIR = "1. Original Transcriptions"


def safe(s):
    s = unicodedata.normalize("NFC", s)
    return re.sub(r'[\\/:*?"<>|]', "-", s).strip()


def norm(s):
    return unicodedata.normalize("NFC", s)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    songs = {norm(s["f"]): s for s in json.load(open(SONGS))}
    report = {"files": 0, "songs": [], "skipped": []}
    for genre in GENRES:
        gdir = None
        for d in os.listdir(src):
            if d.split(". ", 1)[-1] == genre:
                gdir = os.path.join(src, d)
        if not gdir:
            continue
        gi = GENRES.index(genre) + 1
        gname = f"{gi}. {genre}"
        for fn in sorted(os.listdir(gdir)):
            if not fn.lower().endswith((".mid", ".midi")) or fn.startswith("._"):
                continue
            if only and not any(o.lower() in fn.lower() for o in only.split("|")):
                continue
            meta = songs.get(norm(fn))
            if meta:
                artist, title, bpm_n, kname = meta["a"], meta["t"], meta["b"], meta["k"]
            else:
                artist, title, bpm_n, kname = "", os.path.splitext(fn)[0], None, None
            midi = parse(os.path.join(gdir, fn))
            bpm = bpm_n or midi["bpm"] or 120
            key = key_of(kname)
            base = safe(f"{artist} - {title}" if artist else title)
            tag = f"{bpm} BPM - {kname}" if kname else f"{bpm} BPM"
            if not midi["notes"]:
                report["skipped"].append(fn)
                continue
            # 1. the original, copied
            od = os.path.join(dst, ORIG_DIR, gname)
            os.makedirs(od, exist_ok=True)
            shutil.copyfile(os.path.join(gdir, fn), os.path.join(od, f"{base} ({tag}).mid"))
            report["files"] += 1
            chords = chords_of(midi["notes"], midi["ts"])
            if len(chords) < 1:
                report["skipped"].append(fn)
                continue
            scale = diatonic(key)
            for ch in chords:
                # a chord without a 3rd (a power chord, or the 3rd left out): the key's 3rd
                if ch["q"] == "5" and scale:
                    if (ch["root"] + 4) % 12 in scale:
                        ch["q"] = "maj"
                    elif (ch["root"] + 3) % 12 in scale:
                        ch["q"] = "min"
                ch["nq"] = enrich(ch, key)
            names = [chord_name(c, key) for c in chords]
            ts = midi["ts"]
            for sid, sdir, sname in STYLES:
                sd = os.path.join(dst, sdir, gname)
                os.makedirs(sd, exist_ok=True)
                notes = render(sid, chords, bpm, ts)
                qkey = {"easy": lambda c: simplify(c["q"]), "neo": lambda c: c["nq"]}.get(sid, lambda c: c["q"])
                marks = [(c["start"], chord_name({**c, "q": qkey(c)}, key)) for c in chords]
                write(os.path.join(sd, f"{base} ({tag}) [{sname}].mid"), bpm, ts, notes,
                      f"{base} - {sname}", dedupe(marks))
                report["files"] += 1
            # 8. all 12 keys of the Best Voicing
            if key is not None:
                kd = os.path.join(dst, KEYS_DIR, gname, safe(f"{base} ({bpm} BPM)"))
                os.makedirs(kd, exist_ok=True)
                for t in range(12):
                    nk = ((key[0] + t) % 12, key[1])
                    kn = (MINOR_NAMES if key[1] else MAJOR_NAMES)[nk[0]]
                    tch = [{**c, "root": (c["root"] + t) % 12, "bass": (c["bass"] + t) % 12} for c in chords]
                    for c in tch:
                        c["vq"] = c["q"]
                    notes = render("best", [dict(c) for c in chords], bpm, ts, transpose=t)
                    marks = [(c["start"], chord_name(c, nk)) for c in tch]
                    write(os.path.join(kd, f"{base} ({bpm} BPM - {kn}) [Best Voicing].mid"), bpm, ts, notes,
                          f"{base} - {kn}", dedupe(marks))
                    report["files"] += 1
            report["songs"].append({"file": fn, "genre": genre, "key": kname, "chords": names})
    json.dump(report, open(os.path.join(dst, "_report.json"), "w"), indent=1, ensure_ascii=False)
    print("files", report["files"], "songs", len(report["songs"]), "skipped", report["skipped"])


def dedupe(marks):
    out = []
    for b, t in marks:
        if out and out[-1][1] == t:
            continue
        out.append((b, t))
    return out


if __name__ == "__main__":
    main()
