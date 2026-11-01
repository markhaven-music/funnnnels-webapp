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

# The free bonuses: a few real files each, to pick and play on the landing's
# bonus cards (BonusPlayer.tsx). Sources: the bonus zips in private/ and
# Mark's bonus folder. Written to bonus-rolls.json, one list per bonus, so the
# pack's rolls.json (loaded with every page) stays small. Empty bars at the
# start are cut ("c'è un silenzio all'inizio"), then 8 bars at most.
PRIV = os.path.join(os.path.dirname(__file__), "..", "private", "jazz-midi-pack")
BON = os.path.expanduser("~/Desktop/midi jazz pack bonuses/bonuses")
BONUS_OUT = os.path.join(os.path.dirname(__file__), "..", "app", "(funnels)", "jazz-midi-pack", "bonus-rolls.json")
CP = (f"{PRIV}/Jazz MIDI Chord Pack.zip", "Jazz MIDI Chord Pack/1 - C Major - A Minor/6 Progressions")
BI = (f"{BON}/2. BONUS #1 - The Chord Progressions Bible/The Chord Progressions Bible/MIDI Files", "")
AN = (f"{PRIV}/Anime & Video Game MIDI Chord Pack.zip", "Anime & Video Game MIDI Chord Pack/1 - C Major - A Minor/6 Progressions")
EK = (f"{BON}/3. BONUS #2 - Emotional Keys MIDI Bundle", "")
BONUS = [
    [  # 1 MIDI Chord Pack (Jazz Edition), C major / A minor
        (CP, "1 Jazz Essentials/Major Progressions/Major Prog 1 (ii-V-I-I).mid", "ii-V-I"),
        (CP, "2 Advanced Jazz/Major Progressions/Major Prog 4 (I-bIII7-bVI-bII7 Lady Bird).mid", "Lady Bird"),
        (CP, "2 Advanced Jazz/Major Progressions/Major Prog 1 (ii-bII7-I Tritone Sub).mid", "Tritone sub"),
        (CP, "2 Advanced Jazz/Major Progressions/Major Prog 2 (iv-bVII7-I Backdoor).mid", "Backdoor"),
        (CP, "2 Advanced Jazz/Major Progressions/Major Prog 7 (ii-bIII7-bVI-VII7-III-V7-I Coltrane).mid", "Coltrane changes"),
        (CP, "1 Jazz Essentials/Minor Progressions/Minor Prog 6 (i-i(maj7)-i7-i6 Line Cliche).mid", "Minor line cliché"),
    ],
    [  # 2 The Chord Progressions Bible: one progression three ways, then more
        (BI, "Major/Base/I-V-vi-IV.mid", "I-V-vi-IV, block chords"),
        (BI, "Major/Arpeggio/I-V-vi-IV_arpeggio.mid", "I-V-vi-IV, arpeggio"),
        (BI, "Major/Arrangement/I-V-vi-IV_arrangement.mid", "I-V-vi-IV, arrangement"),
        (BI, "Major/Arrangement/vi-IV-I-V_arrangement.mid", "vi-IV-I-V, arrangement"),
        (BI, "Minor/Arrangement/i-VI-VII-VII_arrangement.mid", "i-VI-VII, arrangement"),
    ],
    [  # 3 Anime & Video Games MIDI Pack, C major / A minor
        (AN, "1 Anime/Major Progressions/Major Prog 1 (IV-V-iii-vi Royal Road).mid", "Royal Road"),
        (AN, "1 Anime/Major Progressions/Major Prog 3 (IV-III7-vi-I7 Marusa).mid", "Marusa"),
        (AN, "1 Anime/Major Progressions/Major Prog 4 (vi-IV-V-I Komuro).mid", "Komuro"),
        (AN, "1 Anime/Minor Progressions/Minor Prog 1 (i-VI-III-VII Sad Anime).mid", "Sad anime"),
        (AN, "2 Video Game/Major Progressions/Major Prog 1 (I-bVI-bVII-I Victory Fanfare).mid", "Victory fanfare"),
        (AN, "2 Video Game/Minor Progressions/Minor Prog 4 (i-VI-iv-V Final Boss).mid", "Final boss"),
    ],
    [  # 4 Emotional Keys MIDI Bundle: songstarters from the three volumes
        (EK, "Emotional Keys Vol.1/01 - Songstarters/EmotionalKeys01_Em_141_Ocean.mid", "Ocean"),
        (EK, "Emotional Keys Vol.1/01 - Songstarters/EmotionalKeys01_C_104_LikeAStar.mid", "Like A Star"),
        (EK, "Emotional Keys Vol.2/01 - Songstarters/EmotionalKeys02_D_91_WhiteRose.mid", "White Rose"),
        (EK, "Emotional Keys Vol.2/01 - Songstarters/EmotionalKeys02_Bbm_133_BlueMood.mid", "Blue Mood"),
        (EK, "Emotional Keys Vol.3/01 - Songstarters/EmotionalKeys03_Am_86_AloneAgain.mid", "Alone Again"),
        (EK, "Emotional Keys Vol.3/01 - Songstarters/EmotionalKeys03_G_76_FlowersInTheSky.mid", "Flowers In The Sky"),
    ],
]


# The landing's "songs you know": for each song, the bundle file with its
# progression, in the song's key (chords checked on Hooktheory 2026-11-01,
# BRIEF.md "Songs"). Written to song-rolls.json, keyed by the song.
SONG_OUT = os.path.join(os.path.dirname(__file__), "..", "app", "(funnels)", "jazz-midi-pack", "song-rolls.json")
CP_AB = (f"{PRIV}/Jazz MIDI Chord Pack.zip", "Jazz MIDI Chord Pack/9 - Ab Major - F Minor/6 Progressions")
CP_D = (f"{PRIV}/Jazz MIDI Chord Pack.zip", "Jazz MIDI Chord Pack/3 - D Major - B Minor/6 Progressions")
AN_AB = (f"{PRIV}/Anime & Video Game MIDI Chord Pack.zip", "Anime & Video Game MIDI Chord Pack/9 - Ab Major - F Minor/6 Progressions")
SONGS = {
    "kill-bill": (CP_AB, "1 Jazz Essentials/Major Progressions/Major Prog 5 (ii-V-I-VI).mid"),
    "say-so": (CP_D, "1 Jazz Essentials/Major Progressions/Major Prog 1 (ii-V-I-I).mid"),
    "leave-the-door-open": (AN, "1 Anime/Major Progressions/Major Prog 1 (IV-V-iii-vi Royal Road).mid"),
    "just-the-two-of-us": (AN_AB, "1 Anime/Major Progressions/Major Prog 3 (IV-III7-vi-I7 Marusa).mid"),
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


def parse(path, data=None, max_beats=None, trim=False):
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
    if trim:  # empty bars at the start: cut, so play sounds at once
        shift = min(s for s, _, _ in notes) // bar * bar
        if shift:
            notes = [(s - shift, e - shift, p) for s, e, p in notes]
            before = [m for t, m in markers if t <= shift]
            markers = [(t - shift, m) for t, m in markers if t > shift]
            if before:
                markers.insert(0, (0, before[-1]))
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
    with open(OUT, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    bonuses = []
    for files in BONUS:
        rolls = []
        for (src, base), rel, title in files:
            path = f"{base}/{rel}" if base else rel
            roll = parse(path, read(src, path), 32, trim=True)
            roll["file"] = os.path.basename(rel)
            roll["title"] = title
            rolls.append(roll)
            print(f"  {title:22} {roll['bpm']:>3} bpm {roll['beats']:>3} beats {len(roll['notes']):>4} notes "
                  f"first {roll['notes'][0][0]}  {[c[1] for c in roll['chords'][:4]]}")
        bonuses.append(rolls)
    with open(BONUS_OUT, "w") as f:
        json.dump(bonuses, f, separators=(",", ":"))
    songs = {}
    for key, ((src, base), rel) in SONGS.items():
        path = f"{base}/{rel}"
        roll = parse(path, read(src, path), 32, trim=True)
        roll["file"] = os.path.basename(rel)
        songs[key] = roll
        print(f"  {key:22} {roll['bpm']:>3} bpm {roll['beats']:>3} beats  {[c[1] for c in roll['chords']]}")
    with open(SONG_OUT, "w") as f:
        json.dump(songs, f, separators=(",", ":"))


if __name__ == "__main__":
    main()
