#!/usr/bin/env python3
"""What the new MIDI Drum Kit landing plays (landing B, app/(funnels)/midi-drum-kit/landingNew.ts).

2026-11-12, "implementare anche il player che ti fa sentire i midi", then "find a clever way to also
let the users audition the fragments and other files on the pack" and "i want them to audition the
bonuses, just like MIDI Jazz Pack". Everything comes from the zips buyers download, so the page plays
exactly what is in them:

    /usr/bin/python3 tools/drum_player_data.py KIT.zip [DSG.zip] [HOOKS.zip]
    # KIT   = MIDI Drum Kit Bundle V1.1.zip (the kit and bonuses 1-3)
    # DSG   = Drunk Swing Grooves.zip (bonus 4), HOOKS = MYSTERY Hooks Pack.zip (bonus 5)
    # writes public/funnels/midi-drum-kit/player/v5/

  kit.json            the 11 folders and their groups, and the base beat single parts play over
  <group>.json        every file of a group: its path in the zip, tempo, length, notes
  tree.json           the kit's folders as they are in the zip: names, files, two file names each (the page's folder tree)
  bonus.json          a few files of Famous Beats and Drunk Swing Grooves, as notes
  bounce.json         one Complete Beat of the kit and a plain beat at its tempo ("NO BOUNCE VS BOUNCE")
  kits/k<n>-*.m4a     a set of Hit-Maker Drums one-shots for each Famous Beats file after the first
  clips/*.m4a         the Beat Starters' MP3 samples and the MYSTERY hooks, whole,
                      and Hit-Maker Drums one-shots for the pads (clips.json: names, tempo, waveform)

Times are in beats (quarter notes). A note is five numbers, t, length, sound, pitch, velocity, one
after the other in "n". sound is an index of INST. pitch: the 808's MIDI note; for the others the
semitones from the file's middle C (0 in the kit's multi-track folders, as the first player had them).
A new layout of these files goes in a new folder (v7…): v6 (2026-11-12, late: "mostriamo più demo numero pari",
"più drum pads", the hooks "i primi sono più belli", Drunk Swing Grooves "qualche file più estremo come primo", the
plain beat's kicks an 8th before snares 2 and 4) has 6 Famous Beats, 6 grooves (a Heavy Drunk one first), 8 Beat
Starters, the first 6 hooks, 24 pads and bounce.json; v5 (2026-11-12, "le demo in beatstarters si fermano
a metà? falle suonare tutte", "nelle demo di famous beats bundle metti suoni diversi per ogni demo", "una sezione
che te lo fa sentire. NO BOUNCE VS BOUNCE") has the whole clips, the sound sets, the bounce pair and the tree; v4 has the beat styles and the Drunk Swing Grooves clips; v3 because v2's first files were asked for before their deploy and the brand domain kept the 404s for a week: browsers keep /funnels/* for a week.
"""
import json
import math
import os
import re
import struct
import subprocess
import sys
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "funnels", "midi-drum-kit", "player", "v6")

INST = ["808", "kick", "snare", "clap", "rim", "hat", "ohat", "perc"]
I808, KICK, SNARE, CLAP, RIM, HAT, OHAT, PERC = range(8)

# The kit's folders in the page's order, each with its groups: (id, name, folder in the zip, sound).
# sound None = multi-track (each track goes to its sound by name).
FOLDERS = [
    ("beats", "Complete Beats", [("beats", "", "9. Complete Beats (Multi-Track)", None)]),
    ("kick-snare", "Kick & Snare", [("kick-snare", "", "7. Kick and Snare (Multi-Track)", None)]),
    ("kick-808", "Kick & 808", [("kick-808", "", "8. Kick and 808 (Multi-Track)", None)]),
    ("kick", "Kick", [("kick-patterns", "Patterns", "4. Kick/1. Patterns", KICK), ("kick-fragments", "Fragments", "4. Kick/2. Fragments", KICK)]),
    ("snare", "Snare", [("snare-patterns", "Patterns", "5. Snare or Clap/1. Patterns", SNARE), ("snare-fragments", "Fragments", "5. Snare or Clap/2. Fragments", SNARE)]),
    ("hats", "Closed Hats", [
        ("hats-basic", "Basic", "2. Hihat Closed/Basic", HAT),
        ("hats-complex", "Complex", "2. Hihat Closed/Complex", HAT),
        ("hats-hyper", "Hyper-Complex", "2. Hihat Closed/Hyper-Complex", HAT),
        ("hats-roll-up", "Roll Up", "2. Hihat Closed/Roll Up", HAT),
        ("hats-roll-down", "Roll Down", "2. Hihat Closed/Roll Down", HAT),
    ]),
    ("open-hats", "Open Hats", [("open-hats", "", "3. Hihat Open", OHAT)]),
    ("808", "808", [("808-patterns", "Patterns", "1. 808/1. Patterns", I808), ("808-fragments", "Fragments", "1. 808/2. Fragments", I808)]),
    ("accents", "Accents", [("accents", "", "6. Accents (clap, rim, perc)", PERC)]),
    ("rolls", "Rolls", [("rolls", "", "10. Rolls", HAT)]),
    ("base-rhythms", "Base Rhythms", [("base-rhythms", "", "11. Base Rhythms", HAT)]),
]
# The beat a single part plays over until the visitor picks their own: the kit's simplest files.
BASE = {
    "kick": "4. Kick/1. Patterns/MDK_Kick_Basic_Pattern_01_150.mid",
    "snare": "5. Snare or Clap/1. Patterns/MDK_Snare_Basic_Pattern_01_150.mid",
    "hat": "11. Base Rhythms/Basic_4_bars_8th_Hats.mid",
}
# The beats a visitor can pick for a single part to play over ("lascia che l'utente possa scegliere tra varie
# velocità e stili di beats", 2026-11-12): kick and snare from one of the kit's Kick and Snare files (or the
# two basic patterns), hats from a Base Rhythms file. Named by what they are: where the snare falls, how the
# hats run. (id, name, the kick's file, the snare's file or None = the same multi-track file, the hats' file)
KS = "7. Kick and Snare (Multi-Track)/MDK_Kickandsnare_Beat{}.mid"
HATS = "11. Base Rhythms/Basic_4_bars_{}_Hats.mid"
STYLES = [
    ("simple", "Simple", BASE["kick"], BASE["snare"], HATS.format("8th")),
    ("half", "Half-time", KS.format("21_150"), None, HATS.format("8th")),
    ("two-four", "2 and 4", KS.format("25_95"), None, HATS.format("8th")),
    ("triplets", "Triplet hats", KS.format("37_151"), None, HATS.format("Triplets_8th")),
    ("sixteenths", "16th hats", KS.format("42_157"), None, HATS.format("16th")),
]
KIT_ROOT = "1 - MIDI Drum Kit/"

GM = {35: KICK, 36: KICK, 37: RIM, 38: SNARE, 40: SNARE, 39: CLAP, 42: HAT, 44: HAT, 46: OHAT}


def inst_for(track):
    t = track.lower()
    if t.startswith("808"):
        return I808
    if "kick" in t:
        return KICK
    if t.startswith("clap"):
        return CLAP
    if "snare" in t:
        return SNARE
    if "open" in t or "cymbal" in t:
        return OHAT
    if "hihat" in t or "hat" in t or t == "hh" or "fragment" in t:
        return HAT
    if "rim" in t or "accent" in t:
        return RIM
    return PERC


def vlq(b, i):
    v = 0
    while True:
        c = b[i]
        i += 1
        v = (v << 7) | (c & 0x7F)
        if c < 0x80:
            return v, i


def read(data):
    """Tracks with names and notes (tick, dur, pitch, vel), ppq, first tempo."""
    assert data[:4] == b"MThd"
    _, ntr, ppq = struct.unpack(">HHH", data[8:14])
    i, tracks, tempo = 14, [], None
    for _ in range(ntr):
        ln = struct.unpack(">I", data[i + 4:i + 8])[0]
        b = data[i + 8:i + 8 + ln]
        i += 8 + ln
        t = j = 0
        st, name, on, notes = None, "", {}, []
        while j < len(b):
            d, j = vlq(b, j)
            t += d
            c = b[j]
            if c == 0xFF:
                typ = b[j + 1]
                l, k = vlq(b, j + 2)
                payload = b[k:k + l]
                j = k + l
                if typ == 0x03:
                    name = payload.decode("latin1")
                if typ == 0x51 and tempo is None:
                    tempo = 60e6 / int.from_bytes(payload, "big")
                continue
            if c in (0xF0, 0xF7):
                l, k = vlq(b, j + 1)
                j = k + l
                continue
            if c & 0x80:
                st = c
                j += 1
            hi = st & 0xF0
            n = 1 if hi in (0xC0, 0xD0) else 2
            p = b[j:j + n]
            j += n
            if hi == 0x90 and p[1] > 0:
                on.setdefault(p[0], []).append((t, p[1]))
            elif hi == 0x80 or (hi == 0x90 and p[1] == 0):
                if on.get(p[0]):
                    t0, v = on[p[0]].pop(0)
                    notes.append((t0, t - t0, p[0], v))
        tracks.append({"name": name, "notes": sorted(notes)})
    return {"ppq": ppq, "tempo": tempo, "tracks": tracks}


def num(x):
    """3 decimals, and 2 for 2.0: shorter JSON."""
    r = round(x, 3)
    return int(r) if r == int(r) else r


def span(end):
    """The length a file takes in a beat: the next of half a beat, 1, 2, 4, 8, 16 beats, then whole bars."""
    for s in (0.5, 1, 2, 4, 8, 16):
        if end <= s + 0.02:
            return s
    return int(-(-end // 4) * 4)


def entry(name, data, sound=None, pitched=False, gm=False, cap=None):
    """One file as {f, bpm, len, n}. sound: every note goes to it (a single part); else by track name (or GM note)."""
    m = read(data)
    ppq = m["ppq"]
    bpm = m["tempo"]
    # The tempo: what the file's name says (the tempo it was made at), else the file's own. "… - 88bpm.mid"
    # says it outright. In "MDK_Kick_Basic_Pattern_01_150.mid" and "Roll_150_55.mid" one number is the
    # file's number and the other the tempo (the larger); in "MDK_CompleteBeat01_164.mid" the file's number
    # is glued to a word, so the number alone is the tempo; "…_Fragment_80.mid" only numbers the file.
    stem = os.path.basename(name)[:-4]
    tokens = re.split(r"[_ ]", stem)
    nums = [int(t) for t in tokens if t.isdigit()]
    said = re.search(r"(\d{2,3})\s?bpm", stem, re.I)
    named = int(said.group(1)) if said else max(nums) if len(nums) > 1 else nums[0] if nums and any(re.search(r"[A-Za-z]\d+$", t) for t in tokens) else 0
    if 60 <= named <= 250:
        bpm = float(named)
    notes = []
    for tr in m["tracks"]:
        ins = sound if sound is not None else inst_for(tr["name"])
        for t, d, p, v in tr["notes"]:
            i = GM.get(p, PERC) if gm else ins
            pitch = p if i == I808 else (p - 60 if (pitched or sound is not None) and not gm else 0)
            if cap is not None and t / ppq >= cap:
                continue
            notes.append((num(t / ppq), num(max(d, 1) / ppq), i, pitch, v))
    notes.sort()
    end = max(n[0] + n[1] for n in notes)
    length = span(min(end, cap) if cap else end)
    flat = [x for n in notes for x in n]
    return {"f": name, "bpm": round(bpm) if bpm else 0, "len": length, "n": flat}


def write(name, obj):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(obj, f, separators=(",", ":"), ensure_ascii=False)
    return os.path.getsize(path)


def kit(z):
    index = {"inst": INST, "folders": [], "base": {}}
    total = 0
    tree = []
    for fid, fname, groups in FOLDERS:
        out_groups = []
        subs = []
        for gid, gname, folder, sound in groups:
            files = sorted(n for n in z.namelist() if n.startswith(KIT_ROOT + folder + "/") and n.lower().endswith(".mid"))
            entries = [entry(n[len(KIT_ROOT):], z.read(n), sound) for n in files]
            size = write(f"{gid}.json", entries)
            out_groups.append({"id": gid, "name": gname, "n": len(entries), "inst": -1 if sound is None else sound})
            subs.append({"id": gid, "dir": folder.split("/", 1)[1] if "/" in folder else "", "n": len(entries), "ex": [os.path.basename(n) for n in files[:2]]})
            total += len(entries)
            print(f"  {gid}: {len(entries)} files, {size} bytes")
        index["folders"].append({"id": fid, "name": fname, "groups": out_groups})
        tree.append({"id": fid, "dir": groups[0][2].split("/")[0], "n": sum(g["n"] for g in subs), "groups": subs})
    # the page lists the folders as the zip numbers them
    tree.sort(key=lambda f: int(f["dir"].split(".")[0]))
    print("tree.json", write("tree.json", tree), "bytes")
    for part, path in BASE.items():
        e = entry(path, z.read(KIT_ROOT + path), {"kick": KICK, "snare": SNARE, "hat": HAT}[part])
        index["base"][part] = {"f": e["f"], "n": e["n"]}
    for sid, name, kick, snare, hat in STYLES:
        k = entry(kick, z.read(KIT_ROOT + kick), KICK if snare else None)
        notes = [k["n"][i:i + 5] for i in range(0, len(k["n"]), 5)]
        parts = {"kick": [x for n in notes if n[2] == KICK for x in n]}
        if snare:
            parts["snare"] = entry(snare, z.read(KIT_ROOT + snare), SNARE)["n"]
        else:  # a Kick and Snare file: its other track (snare, rim or clap)
            parts["snare"] = [x for n in notes if n[2] != KICK for x in n]
        parts["hat"] = entry(hat, z.read(KIT_ROOT + hat), HAT)["n"]
        index.setdefault("styles", []).append({"id": sid, "name": name, "bpm": k["bpm"] or 140, "parts": parts,
                                               "files": [os.path.basename(f) for f in ([kick] + ([snare] if snare else []) + [hat])]})
    index["total"] = total
    print("kit.json", write("kit.json", index), "bytes ·", total, "files")


def title(stem):
    """FamousBeats01_117_RoddyRicch_TheBox → Roddy Ricch · The Box."""
    parts = stem.split("_")[2:]
    words = [re.sub(r"(?<=[a-z])(?=[A-Z])", " ", p) for p in parts]
    return " · ".join(words)


def bonus(z, dsg):
    out = {"famous": [], "dsg": []}
    famous = sorted(n for n in z.namelist() if n.startswith("2 - BONUS") and n.lower().endswith(".mid"))
    by_vol = {}
    for n in famous:
        by_vol.setdefault(n.split("/")[1], []).append(n)
    # one file of each volume, then a second of Vol.1: an even number, two columns on a computer
    picks = [by_vol[vol][0] for vol in sorted(by_vol)] + [by_vol[sorted(by_vol)[0]][1]]
    for n in picks:
        vol = n.split("/")[1]
        e = entry(n.split("/", 1)[1], z.read(n), pitched=True, cap=16)
        e["t"] = title(os.path.basename(n)[:-4])
        e["v"] = vol.replace("Famous Beats ", "")  # "Vol.1"
        # its sounds: the player's own for the first, a set of its own for each of the others (KITS)
        if len(out["famous"]) % len(KITS):
            e["k"] = len(out["famous"]) % len(KITS)
        out["famous"].append(e)
    if dsg:
        grooves = sorted(n for n in dsg.namelist() if "/2 Drum Grooves/Drum Rack (GM map)/" in n and "Medium Drunk" in n and n.lower().endswith(".mid"))
        seen = []
        for n in grooves:
            base = os.path.basename(n)
            name = re.sub(r"^\d+ ", "", base.split(" - ")[0])
            if name in [s[0] for s in seen]:
                continue
            seen.append((name, n))
        step = max(1, len(seen) // 5)
        # first the most drunk one, Jazzy Hop half-time at Heavy Drunk, then five at Medium Drunk
        heavy = next(n for n in dsg.namelist() if "/2 Drum Grooves/Drum Rack (GM map)/" in n and "09 Jazzy Hop (Half-Time) - Heavy Drunk" in n)
        pool = [x for x in seen if x[0] != "Jazzy Hop (Half-Time)"]
        for name, n in [("Jazzy Hop (Half-Time), Heavy Drunk", heavy)] + pool[::step][:5]:
            e = entry(n.split("/", 1)[1], dsg.read(n), gm=True)
            e["t"] = name
            # Its sound on the page: the groove as the Drunk Swing Grooves page plays it, a hip hop kit, not the
            # Drum Kit's trap sounds ("should be hiphop more than trap", 2026-11-12). public/funnels/drunk-swing-grooves/audio/all.
            num = os.path.basename(n)[:2]
            clip = f"{num}-{'ht' if 'Half-Time' in n else '24'}-{'heavy' if 'Heavy Drunk' in n else 'medium'}.mp3"
            assert os.path.exists(os.path.join(ROOT, "public", "funnels", "drunk-swing-grooves", "audio", "all", clip)), clip
            e["a"] = f"/funnels/drunk-swing-grooves/audio/all/{clip}"
            out["dsg"].append(e)
    for k, v in out.items():
        print(" ", k, [(e["t"], e["bpm"], e["len"], len(e["n"]) // 5) for e in v])
    print("bonus.json", write("bonus.json", out), "bytes")


AAC = None


def aac(src, dst, filters=None, seconds=None, mono=False):
    """src (a file) as AAC at dst. In two steps: 16-bit PCM first (cut, filters, channels), then the encoder.
    In one step ffmpeg's own AAC encoder gave the 24-bit stereo one-shots back some 3 dB louder and clipped
    when it also had to fold them to mono (2026-11-12). Apple's encoder when ffmpeg has it: cleaner on drums."""
    global AAC
    if AAC is None:
        AAC = "aac_at" if " aac_at " in subprocess.run(["ffmpeg", "-v", "error", "-encoders"], capture_output=True, text=True).stdout else "aac"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav") as pcm:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, *(["-t", str(seconds)] if seconds else []), *(["-af", ",".join(filters)] if filters else []),
                        "-ac", "1" if mono else "2", "-ar", "44100", "-c:a", "pcm_s16le", pcm.name], check=True)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", pcm.name, "-c:a", AAC, "-b:a", "96k", "-movflags", "+faststart", dst], check=True)


def clip(src_bytes, ext, dst, seconds=None, mono=False):
    """An AAC clip (cut to `seconds` with a fade out, when given) and 56 peaks of its waveform, 0-100."""
    with tempfile.NamedTemporaryFile(suffix=ext) as src:
        src.write(src_bytes)
        src.flush()
        aac(src.name, dst, [f"afade=t=out:st={seconds - 0.6}:d=0.6"] if seconds else None, seconds, mono)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", dst, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], check=True, capture_output=True).stdout
    samples = struct.unpack(f"<{len(raw) // 2}h", raw[: len(raw) // 2 * 2])
    n = 56
    size = max(1, len(samples) // n)
    peaks = [max((abs(s) for s in samples[i * size:(i + 1) * size]), default=0) for i in range(n)]
    top = max(peaks) or 1
    return [round(p * 100 / top) for p in peaks]


# One sample per Beat Starters pack (all seven), whole, and four hooks at different tempos, whole; the pads' one-shots.
STARTERS = [
    ("Chord Progressions", "Chord Progressions MIDI Pack/02 - MP3 Previews/"),
    ("Chord Progressions 2", "Chord Progressions MIDI Pack/02 - MP3 Previews/"),  # 8, an even number
    ("Emotional Pianos", "Emotional Pianos MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
    ("Guitars", "Guitars MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
    ("Melodies", "Melodies MIDI Pack/02 - MP3 Samples/"),
    ("Strings", "Strings MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
    ("Trap Pianos", "Trap Pianos MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
    ("Trap Plucks", "Trap Plucks MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
]
HOOKS = ["Hook01", "Hook02", "Hook03", "Hook04", "Hook05", "Hook06"]  # the first of the pack ("i primi sono più belli")
PADS = [
    ("Kick 1", "kick/GRKick01.wav"), ("Kick 2", "kick/Kick05.wav"), ("Snare 1", "snare/GRSnare01.wav"), ("Snare 2", "snare/Snare10.wav"),
    ("Clap 1", "clap/Clap01.wav"), ("Clap 2", "clap/GRClap08.wav"), ("Hat 1", "hihat/ClosedHat02.wav"), ("Hat 2", "hihat/GRhihat08.wav"),
    ("Open hat", "hihat/OPEN HAT 1.wav"), ("Rim", "rim/GRRim02.wav"), ("Perc 1", "perc/GRPerc01.wav"), ("Perc 2", "perc/PERC 3.wav"),
    # 24 since 2026-11-12 ("più drum pads"): 3 rows of 8 on a phone, 6 of 4 on a computer
    ("Kick 3", "kick/GRKick03.wav"), ("Kick 4", "kick/KickC15.wav"), ("Snare 3", "snare/GRSnare12.wav"), ("Snare 4", "snare/SnareF01.wav"),
    ("Clap 3", "clap/GRClap03.wav"), ("Clap 4", "clap/Clap06.wav"), ("Hat 3", "hihat/ClosedHat20.wav"), ("Hat 4", "hihat/GRhihat11.wav"),
    ("Open hat 2", "hihat/OPEN HAT 4.wav"), ("Rim 2", "rim/GRRim01.wav"), ("Perc 3", "perc/GRPerc02.wav"), ("Perc 4", "perc/PERC 17.wav"),
]


def clips(z, hooks):
    out = {"starters": [], "hooks": [], "pads": []}
    for label, folder in STARTERS:
        files = sorted(n for n in z.namelist() if n.startswith("3 - BONUS - Beat Starters MIDI Bundle/" + folder) and n.lower().endswith(".mp3"))
        # the middle file of the pack, or the next whose song isn't on the page already (two packs share some songs)
        song = lambda x: re.sub(r"^.*?_\d{2,3}_", "", os.path.basename(x)[:-4]).split("_")[0]
        used = {song(c["file"]) for c in out["starters"]}
        n = next(x for x in files[len(files) // 2:] + files if song(x) not in used)
        stem = os.path.basename(n)[:-4]
        bpm = re.search(r"_(\d{2,3})_", stem)
        i = len(out["starters"]) + 1
        peaks = clip(z.read(n), ".mp3", os.path.join(OUT, "clips", f"starter-{i}.m4a"))
        out["starters"].append({"name": label, "file": os.path.basename(n), "bpm": int(bpm.group(1)) if bpm else 0, "peaks": peaks})
    if hooks:
        for k, tag in enumerate(HOOKS, 1):
            n = next(x for x in hooks.namelist() if tag in x and x.lower().endswith(".wav"))
            stem = os.path.basename(n)[:-4]
            key, bpm = stem.split("_")[-2:]
            peaks = clip(hooks.read(n), ".wav", os.path.join(OUT, "clips", f"hook-{k}.m4a"))
            out["hooks"].append({"name": f"Hook {tag[-2:]}", "file": os.path.basename(n), "key": key, "bpm": int(bpm), "peaks": peaks})
    order = ["Kick", "Snare", "Clap", "Hat", "Open", "Rim", "Perc"]  # the pads grouped by drum
    for k, (label, path) in enumerate(sorted(PADS, key=lambda p: next(i for i, w in enumerate(order) if p[0].startswith(w))), 1):
        clip(z.read("4 - BONUS - Hit-Making Drums - Drumkit/" + path), ".wav", os.path.join(OUT, "clips", f"pad-{k}.m4a"), mono=True)
        out["pads"].append({"name": label, "file": os.path.basename(path)})
    print("clips.json", write("clips.json", out), "bytes")
    for k, v in out.items():
        print(" ", k, [c["file"] for c in v])


# A set of Hit-Maker Drums one-shots for each Famous Beats file on the page after the first, which plays the
# player's own ("metti suoni diversi per ogni demo"). Picked by measuring the kit's files (length, brightness,
# level): a deep, a long, a punchy and a round kick, bright and dark snares, short hats, different open hats.
DRUMS = "4 - BONUS - Hit-Making Drums - Drumkit/"
KITS = [
    None,
    {"kick": "kick/GRKick03.wav", "snare": "snare/GRSnare12.wav", "clap": "clap/GRClap03.wav", "rim": "rim/GRRim01.wav", "hat": "hihat/GRhihat03.wav", "ohat": "hihat/OPEN HAT 4.wav", "perc": "perc/GRPerc02.wav"},
    {"kick": "kick/Kick17.wav", "snare": "snare/Snare10.wav", "clap": "clap/Clap06.wav", "rim": "rim/GRRim04.wav", "hat": "hihat/ClosedHat20.wav", "ohat": "hihat/OPEN HAT 8.wav", "perc": "perc/GRPerc03.wav"},
    {"kick": "kick/KickC15.wav", "snare": "snare/SnareF01.wav", "clap": "clap/GRClap08.wav", "rim": "rim/GRRim03.wav", "hat": "hihat/ClosedHat01.wav", "ohat": "hihat/OPEN HAT 3.wav", "perc": "perc/PERC 17.wav"},
    {"kick": "kick/GRKick14.wav", "snare": "snare/GRSnare10.wav", "clap": "clap/Clap07.wav", "rim": "rim/GRRim02.wav", "hat": "hihat/GRhihat11.wav", "ohat": "hihat/OPEN HAT 11.wav", "perc": "perc/PERC 6.wav"},
]
# how much of each one-shot the page keeps (seconds): a hat must be gone before the next one of a roll
KEEP = {"kick": 0.5, "snare": 0.4, "clap": 0.4, "rim": 0.3, "hat": 0.2, "ohat": 0.6, "perc": 0.5}


def level(path_or_bytes, ext=None):
    """(peak, loudness of the first 100 ms), in dB, of a sound: a file's path, or bytes with their extension."""
    if ext:
        with tempfile.NamedTemporaryFile(suffix=ext) as f:
            f.write(path_or_bytes)
            f.flush()
            return level(f.name)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path_or_bytes, "-ac", "1", "-ar", "44100", "-f", "s16le", "-"], check=True, capture_output=True).stdout
    s = struct.unpack(f"<{len(raw) // 2}h", raw[: len(raw) // 2 * 2])
    head = s[:4410] or (0,)
    db = lambda x: 20 * math.log10(max(x, 1) / 32768)
    return db(max(abs(x) for x in s) if s else 0), db(math.sqrt(sum(x * x for x in head) / len(head)))


def kits(z):
    """Each set's one-shots, cut short and brought to the level of the player's own sound of that kind."""
    base = os.path.dirname(OUT)
    for k, kit_ in enumerate(KITS):
        if not kit_:
            continue
        for name, path in kit_.items():
            data = z.read(DRUMS + path)
            peak, loud = level(data, ".wav")
            _, want = level(os.path.join(base, f"{name}.m4a"))
            gain = min(want - loud, -0.5 - peak)  # as loud as the player's, and never over full scale
            keep = KEEP[name]
            dst = os.path.join(OUT, "kits", f"k{k}-{name}.m4a")
            with tempfile.NamedTemporaryFile(suffix=".wav") as src:
                src.write(data)
                src.flush()
                aac(src.name, dst, [f"volume={gain:.1f}dB", f"afade=t=out:st={keep - 0.04}:d=0.04"], keep, mono=True)
            got = level(dst)
            print(f"  k{k}-{name}: {os.path.basename(path)} {gain:+.1f} dB → peak {got[0]:.1f}, first 100 ms {got[1]:.1f} (the player's {want:.1f}), {os.path.getsize(dst)} bytes")


# "NO BOUNCE VS BOUNCE": a Complete Beat of the kit as it is, and a plain beat with the same sounds at the same
# tempo: a kick and an 808 on the one of every bar, the snare where the kit's beat has it, straight eighth hats
# all as loud as each other. Nothing else differs, so what is heard is the pattern.
# Complete Beat 13 since the night of 2026-11-12 (it was 01, then: "for the 'with bounce' beat example use the midi you
# used later, COMPLETE BEAT 13 OF THE KIT 140BPM, it works better"). The plain side is a beat someone would really
# write, not a straw man ("nobody puts the kick just on the 1st beat… at least the second kick should be
# syncopated, otherwise it feels disingenuous"). A kick on every "and" of two was then "troppo complesso": it is the
# first plain beat again (a kick and the 808 on the one, the snare on the three, straight 8th hats) with its second
# kick "un po' prima", on the "and" of four before bar 2 ("il beat no bounce di prima era quasi perfetto
# semplicemente la seconda cassa spostala un po' prima"): kicks on 1 and 4-and, every two bars.
BOUNCE = "9. Complete Beats (Multi-Track)/MDK_CompleteBeat13_140.mid"


def bounce(z):
    e = entry(BOUNCE, z.read(KIT_ROOT + BOUNCE))
    notes = [e["n"][i:i + 5] for i in range(0, len(e["n"]), 5)]
    bars = e["len"] // 4
    snare = [n for n in notes if n[2] in (SNARE, CLAP) and n[0] == int(n[0])]
    sub = next((n[3] for n in notes if n[2] == I808), 36)
    plain = []
    # then (same night) "la cassa/808 sul secondo movimento della seconda e quarta battuta, 1/8 prima del secondo e
    # quarto rullante": kicks on the one of bars 1 and 3, and on the "and" of two in bars 2 and 4 (5.5, 13.5)
    for b in range(0, bars, 2):
        for at, held in ((0, 1.5), (5.5, 2)):
            plain.append((num(b * 4 + at), held, I808, sub, 100))
            plain.append((num(b * 4 + at), 0.25, KICK, 0, 100))
    plain += [(n[0], 0.25, n[2], 0, 100) for n in snare]
    plain += [(num(i * 0.5), 0.25, HAT, 0, 80) for i in range(e["len"] * 2)]
    plain.sort()
    out = {"f": e["f"], "bpm": e["bpm"], "len": e["len"], "on": e["n"], "off": [x for n in plain for x in n]}
    # a new name: browsers keep /funnels/* for a week
    print("bounce.json", write("bounce.json", out), "bytes ·", e["f"], e["bpm"], "bpm ·", len(notes), "notes against", len(plain))


def main(argv):
    z = zipfile.ZipFile(os.path.expanduser(argv[0]))
    dsg = zipfile.ZipFile(os.path.expanduser(argv[1])) if len(argv) > 1 else None
    hooks = zipfile.ZipFile(os.path.expanduser(argv[2])) if len(argv) > 2 else None
    kit(z)
    bonus(z, dsg)
    bounce(z)
    kits(z)
    clips(z, hooks)


if __name__ == "__main__":
    main(sys.argv[1:] or ["~/Downloads/MIDI Drum Kit Bundle V1.1.zip"])
