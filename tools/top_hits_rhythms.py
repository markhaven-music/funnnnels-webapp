#!/usr/bin/env python3
"""TOP HITS MIDI Bundle: every progression of the pack in 12 rhythms, each in all 12 keys
(2026-11-18, "give the progressions in various rhythms, not just the ones in the song or in
blocks", "and in all 12 keys too").

Pure Python, no deps. Reads the 1,000 transcriptions of "1. Hitmaker MIDI Pack" (four genre
folders). For every file it finds where the harmony changes (tools/top_hits_variants.py
`chords_of`) and takes, for each chord, THE NOTES THE TRANSCRIPTION PLAYS (its first full strike:
the pack's own voicing, bass and inversion; nothing is re-harmonised or re-voiced). Chord changes
are moved to the nearest beat (a push an 8th early goes to the beat it anticipates), then the
same chords are played in 12 rhythms, and each rhythm is written in the 12 keys (-5 to +6
semitones, as tools/top_hits_keys.py does).

  <out>/<genre>/<Artist - Song (BPM - Key)>/<Key>/<Artist - Song (BPM - Key)> - 03 Trap Stabs.mid

Songs at 140 BPM or more are written in half time (their bar is felt as two), so a 16th-note
stab at 172 BPM doesn't turn into a machine gun.

    /usr/bin/python3 tools/top_hits_rhythms.py <pack dir> <out dir> [--only "Blinding"] [--orig]
    /usr/bin/python3 tools/top_hits_rhythms.py <pack dir> --rolls "Kill Bill" <out.json>   (the landing's player)
    --orig   only the original key (for listening checks)
"""
import json
import os
import sys
from multiprocessing import Pool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import top_hits_keys as K  # noqa: E402
import top_hits_variants as V  # noqa: E402

Q = 1 / 8


# ───────────────────────────── the chords, as the pack voices them ─────────────────────────────


def strike(notes, a, b, mono):
    """The pitches of the first full strike in [a, b): the chord as the transcription plays it."""
    grp = {}
    for s, d, p, v in notes:
        if a - Q / 2 <= s < b - Q / 2:
            grp.setdefault(round(s / Q) * Q, []).append(p)
    if not grp:
        return sorted({p for s, d, p, v in notes if s < b and s + d > a})
    times = sorted(grp)
    multi = [t for t in times if len(set(grp[t])) >= 2]
    if mono or not multi:
        # an arpeggiated or single-line file: the notes of the region are the chord
        ps = sorted({p for t in times for p in grp[t]})
        while len(ps) > 6:  # keep the frame: bass, top and the notes between, drop doubled pitch classes first
            pcs = [p % 12 for p in ps]
            dup = [i for i in range(1, len(ps) - 1) if pcs.count(pcs[i]) > 1]
            ps.pop(dup[0] if dup else len(ps) // 2)
        return ps
    first = multi[0]
    ps = set(grp[first])
    low = min(ps)
    # a bass struck alone in the region (before or after the chord) is the chord's bass
    lone = [grp[t][0] for t in times if len(set(grp[t])) == 1 and grp[t][0] < 55 and grp[t][0] <= low - 5]
    if lone and low >= 48:
        ps.add(lone[0])
    return sorted(ps)


def clusters(notes):
    """Notes struck together (a rolled chord's notes are up to a 32nd apart). → [(time, [(pitch, end)])]"""
    out = []
    for s, d, p, v in notes:  # sorted by start
        if out and s - out[-1][2] <= 0.13 and s - out[-1][0] <= 0.5:
            out[-1][1].append((p, s + d))
            out[-1][2] = s
        else:
            out.append([s, [(p, s + d)], s])
    return [(t, sorted(ps)) for t, ps, _ in out]


def chordal(notes):
    cl = clusters(notes)
    n = sum(1 for _, ps in cl if len({p % 12 for p, _ in ps}) >= 2)
    length = max(s + d for s, d, _, _ in notes)
    return n >= 2 and (n / len(cl) >= 0.1 or n >= length / 8.5)


def played(notes):
    """Follow the file: the chord that sounds (the notes struck together, with the notes still held
    under them) and its bass. A lone high note is melody and changes nothing; a lone low note is
    the bass moving, unless it only walks through the chord's own notes."""
    raw, upper, bass = [], {}, None  # upper: pitch → end; bass: (pitch, end)
    for t, ps in clusters(notes):
        pitches = [p for p, _ in ps]
        ends = dict(ps)
        low_only = max(pitches) < 55 and upper and len({p % 12 for p in pitches}) == 1
        if len(set(pitches)) == 1 or low_only:
            p = pitches[0]
            if p >= 55 or not upper:
                if upper or len(pitches) == 1:
                    continue  # melody over the chord (or a lone note before any chord)
            pcs_up = {x % 12 for x in upper}
            if bass and p % 12 == bass[0] % 12:
                bass = (bass[0], max(bass[1], ends[p]))
                continue
            if p % 12 in pcs_up and bass:
                continue
            bass = (p, ends[p])
        else:
            if pitches[0] < 55 and pitches[1] - pitches[0] >= 5:
                bass = (pitches[0], ends[pitches[0]])
                up = pitches[1:]
            else:
                up = pitches
                if bass and bass[1] <= t + 0.05:
                    bass = None  # the bass rests: the chord stands on its own lowest note
            held = {p: e for p, e in upper.items() if e > t + 0.5 and p not in up}
            upper = dict(held)
            upper.update({p: ends[p] for p in up})
        now = sorted(set(([bass[0]] if bass else []) + list(upper)))
        if raw and raw[-1]["ps"] == now:
            continue
        if raw:
            raw[-1]["end"] = t
        raw.append({"id": tuple(now), "start": t, "end": t, "ps": now})
    if raw:
        raw[-1]["end"] = max(s + d for s, d, _, _ in notes)
    return raw


def explained(notes, segs):
    """How much of the file's sounding time is a note of the chord we read there (0-1)."""
    tot = ok = 0.0
    for s, d, p, v in notes:
        tot += d
        for sg in segs:
            ov = min(s + d, sg["end"]) - max(s, sg["start"])
            if ov > 0 and p % 12 in sg["pcs"]:
                ok += ov
    return ok / tot if tot else 0


def arpeggiated(notes, chords):
    """An arpeggiated file: the notes of each stretch of harmony are the chord."""
    raw = []
    for c in chords:
        ident = (c["root"], c["q"], c["bass"])
        if raw and raw[-1]["id"] == ident:
            raw[-1]["end"] = c["start"] + c["slot"]
            continue
        raw.append({"id": ident, "start": c["start"], "end": c["start"] + c["slot"]})
    for r in raw:
        r["ps"] = strike(notes, r["start"], r["end"], True)
    return raw


def line(notes, onsets):
    """A riff or a bass line (single notes, or a line doubled in octaves): the line is the harmony."""
    raw, times = [], sorted(onsets)
    end_song = max(s + d for s, d, _, _ in notes)
    for i, t in enumerate(times):
        ps = sorted({n[2] for n in onsets[t]})
        ident = tuple(sorted({p % 12 for p in ps}))
        nxt = times[i + 1] if i + 1 < len(times) else end_song
        if raw and raw[-1]["id"] == ident:
            raw[-1]["end"] = nxt
            continue
        raw.append({"id": ident, "start": t, "end": nxt, "ps": ps})
    return raw


def finish(raw, notes):
    """Changes on the beat, chords shorter than a beat dropped, bass and upper notes split."""
    def snapper(half_up):
        def snap(x):
            x = round(x / Q) * Q
            f = x - int(x)
            return float(int(x) + (1 if f > 0.5 or (half_up and f == 0.5) else 0))
        return snap

    # a chord struck on the "and": pushed (it belongs to the next beat) or late (to the beat before)?
    # whichever puts more of the song's changes on bar lines and half bars
    def weight(snap):
        return sum(1 if snap(r["start"]) % 4 == 0 else 0.5 if snap(r["start"]) % 2 == 0 else 0 for r in raw)
    snap = snapper(True) if weight(snapper(True)) >= weight(snapper(False)) else snapper(False)

    song_end = max(s + d for s, d, _, _ in notes)
    out = []
    for i, r in enumerate(raw):
        a = snap(r["start"])
        b = snap(raw[i + 1]["start"]) if i + 1 < len(raw) else max(a + 1, float(round(song_end)))
        if b - a < 1 or len(r["ps"]) < 1:
            continue  # a passing chord shorter than a beat can't carry a rhythm
        if out and out[-1]["ps"] == r["ps"]:
            out[-1]["end"] = b
            continue
        if out:
            out[-1]["end"] = a
        out.append({"start": a, "end": b, "ps": r["ps"]})
    out = [s for s in out if s["end"] - s["start"] >= 1]
    for s in out:
        ps = s["ps"]
        low = ps[0]
        apart = len(ps) >= 3 and low < 55 and ps[1] - low >= 5
        s["upper"] = ps[1:] if apart else ps[:]
        bass = low
        while bass > 50:
            bass -= 12
        s["bass"] = bass
        s["pcs"] = {p % 12 for p in ps}
    return out


def segments(midi):
    """→ [dict(start, end, bass, upper)] in beats: one per chord, changes on the beat, bar 1 at 0."""
    notes = midi["notes"]
    chords = V.chords_of(notes, midi["ts"])
    if not chords:
        return []
    onsets = {}
    for n in notes:
        onsets.setdefault(round(n[0] / Q) * Q, []).append(n)
    times = sorted(onsets)
    one_pc = sum(1 for t in times if len({n[2] % 12 for n in onsets[t]}) == 1) / len(times)
    octaves = sum(1 for t in times if len(onsets[t]) >= 2) / len(times)
    gaps = sorted(b - a for a, b in zip(times, times[1:])) or [4]
    if one_pc > 0.8 and (octaves > 0.5 or gaps[len(gaps) // 2] >= 2):
        out = finish(line(notes, onsets), notes)
    elif chordal(notes):
        out = finish(played(notes), notes)
        if not out or out[0]["start"] >= 4 or explained(notes, out) < 0.6:
            alt = finish(arpeggiated(notes, chords), notes)
            if alt and (not out or explained(notes, alt) > explained(notes, out)):
                out = alt
    else:
        out = finish(arpeggiated(notes, chords), notes)
    if out:
        shift = out[0]["start"] - out[0]["start"] % 4
        for s in out:
            s["start"] -= shift
            s["end"] -= shift
        out[0]["shift"] = shift
    return out


# ───────────────────────────── the 12 rhythms ─────────────────────────────
# A bar of hits per part: (beat in the bar, length in beats, velocity). C = the chord, B = the bass.

GRID = {
    "Pop Eighths": {
        "C": [(k * 0.5, 0.45, 100 if k % 2 == 0 else 84) for k in range(8)],
        "B": [(0, 1.95, 100), (2, 1.95, 96)],
    },
    "Trap Stabs": {
        "C": [(0, 1.0, 100), (1.5, 0.25, 86), (2.5, 0.25, 92), (3.25, 0.5, 84)],
        "B": [(0, 1.25, 104), (1.5, 1.0, 92), (2.75, 0.7, 98), (3.5, 0.45, 90)],
    },
    "House Offbeat": {
        "C": [(0.5, 0.3, 100), (1.5, 0.3, 96), (2.5, 0.3, 100), (3.5, 0.3, 96)],
        "B": [(0.5, 0.4, 100), (1.5, 0.4, 96), (2.5, 0.4, 100), (3.5, 0.4, 96)],
    },
    "Piano House": {
        "C": [(0, 0.4, 104), (0.75, 0.4, 90), (1.5, 0.4, 98), (2.5, 0.4, 100), (3.25, 0.4, 90)],
        "B": [(0, 0.7, 104), (1.5, 0.45, 94), (2.5, 0.7, 100), (3.25, 0.45, 92)],
    },
    "Reggaeton": {
        "C": [(0, 0.5, 102), (0.75, 0.5, 88), (1.5, 0.4, 96), (2, 0.5, 100), (2.75, 0.5, 88), (3.5, 0.4, 96)],
        "B": [(0, 0.7, 104), (0.75, 0.7, 92), (1.5, 0.45, 98), (2, 0.7, 102), (2.75, 0.7, 92), (3.5, 0.45, 98)],
    },
    "Lo-Fi Lazy": {
        "C": [(0, 1.3, 84), (1.5, 0.9, 72), (2.5, 1.4, 80)],
        "B": [(0, 2.4, 88), (2.5, 1.4, 80)],
    },
    "Funk Stabs": {
        "C": [(0, 0.2, 104), (0.75, 0.2, 86), (1.0, 0.15, 70), (1.5, 0.3, 98), (2.25, 0.2, 84), (2.75, 0.2, 92), (3.5, 0.4, 100)],
        "B": [(0, 0.45, 104), (0.75, 0.2, 88), (1.5, 0.45, 98), (2.5, 0.2, 84), (2.75, 0.4, 96), (3.5, 0.4, 100)],
    },
    "Dotted Plucks": {
        "C": [(0, 0.35, 104), (0.75, 0.35, 90), (1.5, 0.35, 96), (2.25, 0.35, 90), (3.0, 0.3, 100), (3.5, 0.3, 92)],
        "B": [(0, 3.95, 100)],
    },
}
ENSURE = {"House Offbeat": ()}  # the off-beat is the point: no hit added on a chord's first beat
ROLL = {"Lo-Fi Lazy": (0.03, 0.02)}  # (strum per note, everything late), in beats

ORDER = ["Held Chords", "Pop Eighths", "Ballad Arpeggio", "Trap Stabs", "House Offbeat", "Piano House",
         "Reggaeton", "Lo-Fi Lazy", "Funk Stabs", "Dotted Plucks", "Synth Arp", "Soul Push"]


def seg_at(segs, t):
    for s in segs:
        if s["start"] - 1e-6 <= t < s["end"] - 1e-6:
            return s
    return None


def grid(name, segs, sc):
    pat, ensure = GRID[name], ENSURE.get(name, ("C", "B"))
    roll, late = ROLL.get(name, (0, 0))
    first, total, bar = segs[0]["start"], segs[-1]["end"], 4 * sc
    notes = []
    for part, hits in pat.items():
        ons = []
        b0 = first - (first % bar)
        while b0 < total:
            for o, d, v in hits:
                t = b0 + o * sc
                if first - 1e-6 <= t < total - 1e-6:
                    ons.append((t, d * sc, v))
            b0 += bar
        if part in ensure:
            have = {round(t, 3) for t, _, _ in ons}
            ons += [(s["start"], hits[0][1] * sc, hits[0][2]) for s in segs if round(s["start"], 3) not in have]
        ons.sort()
        for i, (t, d, v) in enumerate(ons):
            sg = seg_at(segs, t)
            if sg is None:
                continue
            end = min(t + d, sg["end"])
            if i + 1 < len(ons):
                end = min(end, ons[i + 1][0])
            ps = sg["upper"] if part == "C" else [sg["bass"]]
            for k, p in enumerate(ps):
                st = t + late + k * roll
                if end - st > 0.04:
                    notes.append((st, end - st - 0.02, p, v))
    return notes


def held(segs, sc):
    notes = []
    for s in segs:
        d = s["end"] - s["start"] - 0.02
        notes.append((s["start"], d, s["bass"], 96))
        notes += [(s["start"], d, p, 92) for p in s["upper"]]
    return notes


def bar_starts(s, bar):
    """The segment's start and every bar line inside it."""
    out, t = [s["start"]], s["start"] - (s["start"] % bar) + bar
    while t < s["end"] - 1e-6:
        out.append(t)
        t += bar
    return out


def ballad(segs, sc):
    step, notes = 0.5 * sc, []
    for s in segs:
        hits = bar_starts(s, 4 * sc)
        for i, t in enumerate(hits):
            e = hits[i + 1] if i + 1 < len(hits) else s["end"]
            notes.append((t, e - t - 0.02, s["bass"], 92))
        u = s["upper"]
        seq = u + u[-2:0:-1] if len(u) > 2 else u
        t, i = s["start"], 0
        while t < s["end"] - 1e-6:
            d = min(2 * step, s["end"] - t)
            notes.append((t, d - 0.02, seq[i % len(seq)], 90 if abs(t % sc) < 1e-6 else 78))
            t += step
            i += 1
    return notes


def synth_arp(segs, sc):
    step, notes = 0.25 * sc, []
    for s in segs:
        hits = bar_starts(s, 4 * sc)
        for i, t in enumerate(hits):
            e = hits[i + 1] if i + 1 < len(hits) else s["end"]
            notes.append((t, e - t - 0.02, s["bass"], 96))
        u = s["upper"]
        seq = sorted(set(u + [p + 12 for p in u if p + 12 <= 96]))
        t, i = s["start"], 0
        while t < s["end"] - 1e-6:
            d = min(step, s["end"] - t) * 0.8
            notes.append((t, d, seq[i % len(seq)], 100 if i % len(seq) == 0 else 84))
            t += step
            i += 1
    return notes


def soul_push(segs, sc):
    """Every chord lands an 8th early and is struck again on the "and" of 2; the bass stays on the beat."""
    notes, push = [], 0.5 * sc
    on = [s["start"] - (push if i else 0) for i, s in enumerate(segs)]
    for i, s in enumerate(segs):
        nxt = on[i + 1] if i + 1 < len(segs) else s["end"]
        again = s["start"] + 1.5 * sc
        long_ = s["end"] - s["start"] >= 3 * sc and again < nxt - 0.2
        e1 = again if long_ else nxt
        notes += [(on[i], e1 - on[i] - 0.02, p, 96) for p in s["upper"]]
        notes.append((s["start"], (again if long_ else s["end"]) - s["start"] - 0.02, s["bass"], 100))
        if long_:
            notes += [(again, nxt - again - 0.02, p, 84) for p in s["upper"]]
            notes.append((again, s["end"] - again - 0.02, s["bass"], 90))
    return notes


SPECIAL = {"Held Chords": held, "Ballad Arpeggio": ballad, "Synth Arp": synth_arp, "Soul Push": soul_push}


def rhythm(name, segs, sc):
    notes = SPECIAL[name](segs, sc) if name in SPECIAL else grid(name, segs, sc)
    # one note per pitch at a time
    by = {}
    for n in notes:
        by.setdefault(n[2], []).append(list(n))
    out = []
    for p, ns in by.items():
        ns.sort()
        keep = []
        for n in ns:
            if keep and abs(keep[-1][0] - n[0]) < 1e-4:
                keep[-1][1] = max(keep[-1][1], n[1])
                keep[-1][3] = max(keep[-1][3], n[3])
                continue
            if keep and keep[-1][0] + keep[-1][1] > n[0] - 0.01:
                keep[-1][1] = n[0] - keep[-1][0] - 0.01
            keep.append(n)
        out += [tuple(n) for n in keep if n[1] > 0.03]
    out.sort()
    return out


# ───────────────────────────── files ─────────────────────────────


def one(job):
    path, genre, name, out, orig_only = job
    stem = os.path.splitext(name)[0]
    midi = V.parse(path)
    if not midi["notes"]:
        return {"file": name, "made": 0, "why": "no notes"}
    segs = segments(midi)
    if not segs:
        return {"file": name, "made": 0, "why": "no chords"}
    bpm = midi["bpm"] or 120
    sc = 2 if bpm >= 140 else 1
    found = K.key_of(stem)
    base = {r: rhythm(r, segs, sc) for r in ORDER}
    made = 0
    for by in ([0] if orig_only else K.MOVES):
        lo = min(n[2] for r in ORDER for n in base[r]) + by
        hi = max(n[2] for r in ORDER for n in base[r]) + by
        if lo < 0 or hi > 127:
            by = by - 12 if by > 0 else by + 12
        if found:
            fstem = stem if not by else K.named(found, by)
            _, pc, minor, _, _ = found
            kname = (K.ROOTS_MINOR if minor else K.MAJOR)[(pc + by) % 12] + ("m" if minor else "")
            if not by:
                kname += " (original key)"
        else:
            fstem = stem if not by else f"{stem} ({by:+d} semitones)"
            kname = "Original key" if not by else f"{by:+d} semitones"
        folder = os.path.join(out, genre, stem, kname)
        os.makedirs(folder, exist_ok=True)
        for i, r in enumerate(ORDER):
            notes = [(s, d, p + by, v) for s, d, p, v in base[r]]
            V.write(os.path.join(folder, f"{fstem} - {i + 1:02d} {r}.mid"), bpm, midi["ts"], notes, f"{fstem} - {r}")
            made += 1
    return {"file": name, "genre": genre, "made": made, "bpm": round(bpm, 1), "half": sc == 2, "chords": len(segs),
            "bars": round((segs[-1]["end"]) / 4, 1),
            "explained": round(explained([(s - segs[0].get("shift", 0), d, p, v) for s, d, p, v in midi["notes"]], segs), 2),
            "pcs": sorted({p % 12 for s in segs for p in s["ps"]})}


def page_rolls(pack, name, out, beats=16):
    """The landing's "twelve ways" player: one song's first bars in the 12 rhythms, original key
    (app/(funnels)/top-hits-chords/rhythm-rolls.json, the Roll shape of jazz-midi-pack/piano.ts)."""
    if pack.endswith(".json"):  # the page's rolls.json (the file's first 8 bars) when the drive is away
        src = json.load(open(pack))[name]
        files = [(None, src["file"], {"notes": [(x[0], x[1], x[2], 100) for x in src["notes"]], "ts": (4, 4), "bpm": src["bpm"]})]
    else:
        files = [(os.path.join(pack, g), fn, None) for g in sorted(os.listdir(pack)) if os.path.isdir(os.path.join(pack, g))
                 for fn in sorted(os.listdir(os.path.join(pack, g)))]
    for gdir, fn, midi in files:
        if True:
            if midi or (name.lower() in fn.lower() and fn.lower().endswith((".mid", ".midi"))):
                midi = midi or V.parse(os.path.join(gdir, fn))
                segs = segments(midi)
                bpm = round(midi["bpm"] or 120)
                sc = 2 if bpm >= 140 else 1
                rows = []
                for i, r in enumerate(ORDER):
                    notes = [[round(s, 3), round(min(d, beats - s), 3), p] for s, d, p, v in rhythm(r, segs, sc) if s < beats - 0.01]
                    rows.append({"name": r, "file": f"{os.path.splitext(fn)[0]} - {i + 1:02d} {r}.mid", "bpm": bpm, "beats": beats, "notes": notes, "chords": []})
                json.dump({"source": fn, "rhythms": rows}, open(out, "w"), separators=(",", ":"), ensure_ascii=False)
                print(out, [len(r["notes"]) for r in rows], os.path.getsize(out), "bytes")
                return


def main():
    if "--rolls" in sys.argv:  # top_hits_rhythms.py <pack dir> --rolls "Kill Bill" <out.json>
        i = sys.argv.index("--rolls")
        return page_rolls(sys.argv[1], sys.argv[i + 1], sys.argv[i + 2])
    pack, out = sys.argv[1], sys.argv[2]
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    orig = "--orig" in sys.argv
    jobs, seen = [], {}
    for genre in sorted(os.listdir(pack)):
        gdir = os.path.join(pack, genre)
        if not os.path.isdir(gdir):
            continue
        for name in sorted(os.listdir(gdir)):
            if os.path.splitext(name)[1].lower() not in (".mid", ".midi") or name.startswith("."):
                continue
            if only and not any(o.lower() in name.lower() for o in only.split("|")):
                continue
            data = open(os.path.join(gdir, name), "rb").read()
            if data in seen:
                print("left out (same file as", seen[data] + "):", name)
                continue
            seen[data] = name
            jobs.append((os.path.join(gdir, name), genre, name, out, orig))
    os.makedirs(out, exist_ok=True)
    with Pool(8) as pool:
        rows = pool.map(one, jobs, chunksize=4)
    made = sum(r["made"] for r in rows)
    json.dump(rows, open(os.path.join(out, "_report.json"), "w"), indent=1, ensure_ascii=False)
    print(f"{sum(1 for r in rows if r['made'])} songs, {made} MIDI files in {out}")
    for r in rows:
        if not r["made"]:
            print("left out:", r["file"], r["why"])


if __name__ == "__main__":
    main()
