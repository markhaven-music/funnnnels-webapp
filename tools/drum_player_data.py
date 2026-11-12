#!/usr/bin/env python3
"""What the new MIDI Drum Kit landing plays (landing B, app/(funnels)/midi-drum-kit/landingNew.ts).

2026-11-12, "implementare anche il player che ti fa sentire i midi", then "find a clever way to also
let the users audition the fragments and other files on the pack" and "i want them to audition the
bonuses, just like MIDI Jazz Pack". Everything comes from the zips buyers download, so the page plays
exactly what is in them:

    /usr/bin/python3 tools/drum_player_data.py KIT.zip [DSG.zip] [HOOKS.zip]
    # KIT   = MIDI Drum Kit Bundle V1.1.zip (the kit and bonuses 1-3)
    # DSG   = Drunk Swing Grooves.zip (bonus 4), HOOKS = MYSTERY Hooks Pack.zip (bonus 5)
    # writes public/funnels/midi-drum-kit/player/v3/

  kit.json            the 11 folders and their groups, and the base beat single parts play over
  <group>.json        every file of a group: its path in the zip, tempo, length, notes
  bonus.json          a few files of Famous Beats and Drunk Swing Grooves, as notes
  clips/*.m4a         10-second clips of the Beat Starters' MP3 samples and of the MYSTERY hooks,
                      and Hit-Maker Drums one-shots for the pads (clips.json: names, tempo, waveform)

Times are in beats (quarter notes). A note is five numbers, t, length, sound, pitch, velocity, one
after the other in "n". sound is an index of INST. pitch: the 808's MIDI note; for the others the
semitones from the file's middle C (0 in the kit's multi-track folders, as the first player had them).
A new layout of these files goes in a new folder (v4…); v3 because v2's first files were asked for before their deploy and the brand domain kept the 404s for a week: browsers keep /funnels/* for a week.
"""
import json
import os
import re
import struct
import subprocess
import sys
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "funnels", "midi-drum-kit", "player", "v3")

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
    for fid, fname, groups in FOLDERS:
        out_groups = []
        for gid, gname, folder, sound in groups:
            files = sorted(n for n in z.namelist() if n.startswith(KIT_ROOT + folder + "/") and n.lower().endswith(".mid"))
            entries = [entry(n[len(KIT_ROOT):], z.read(n), sound) for n in files]
            size = write(f"{gid}.json", entries)
            out_groups.append({"id": gid, "name": gname, "n": len(entries), "inst": -1 if sound is None else sound})
            total += len(entries)
            print(f"  {gid}: {len(entries)} files, {size} bytes")
        index["folders"].append({"id": fid, "name": fname, "groups": out_groups})
    for part, path in BASE.items():
        e = entry(path, z.read(KIT_ROOT + path), {"kick": KICK, "snare": SNARE, "hat": HAT}[part])
        index["base"][part] = {"f": e["f"], "n": e["n"]}
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
    for vol in sorted(by_vol):
        n = by_vol[vol][0]
        e = entry(n.split("/", 1)[1], z.read(n), pitched=True, cap=16)
        e["t"] = title(os.path.basename(n)[:-4])
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
        for name, n in seen[::step][:5]:
            e = entry(n.split("/", 1)[1], dsg.read(n), gm=True)
            e["t"] = name
            out["dsg"].append(e)
    for k, v in out.items():
        print(" ", k, [(e["t"], e["bpm"], e["len"], len(e["n"]) // 5) for e in v])
    print("bonus.json", write("bonus.json", out), "bytes")


def clip(src_bytes, ext, dst, seconds=None, mono=False):
    """A short AAC clip (fades out) and 56 peaks of its waveform, 0-100."""
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=ext) as src:
        src.write(src_bytes)
        src.flush()
        cut = ["-t", str(seconds), "-af", f"afade=t=out:st={seconds - 0.6}:d=0.6"] if seconds else []
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src.name, *cut, "-ac", "1" if mono else "2", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", dst], check=True)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", dst, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], check=True, capture_output=True).stdout
    samples = struct.unpack(f"<{len(raw) // 2}h", raw[: len(raw) // 2 * 2])
    n = 56
    size = max(1, len(samples) // n)
    peaks = [max((abs(s) for s in samples[i * size:(i + 1) * size]), default=0) for i in range(n)]
    top = max(peaks) or 1
    return [round(p * 100 / top) for p in peaks]


# One clip per Beat Starters pack, and four hooks at different tempos; the pads' one-shots.
STARTERS = [
    ("Chord Progressions", "Chord Progressions MIDI Pack/02 - MP3 Previews/"),
    ("Emotional Pianos", "Emotional Pianos MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
    ("Guitars", "Guitars MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
    ("Melodies", "Melodies MIDI Pack/02 - MP3 Samples/"),
    ("Strings", "Strings MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
    ("Trap Plucks", "Trap Plucks MIDI Pack/03 - MP3 Samples/01 - Beat Starters/"),
]
HOOKS = ["Hook03", "Hook05", "Hook08", "Hook13"]
PADS = [
    ("Kick 1", "kick/GRKick01.wav"), ("Kick 2", "kick/Kick05.wav"), ("Snare 1", "snare/GRSnare01.wav"), ("Snare 2", "snare/Snare10.wav"),
    ("Clap 1", "clap/Clap01.wav"), ("Clap 2", "clap/GRClap08.wav"), ("Hat 1", "hihat/ClosedHat02.wav"), ("Hat 2", "hihat/GRhihat08.wav"),
    ("Open hat", "hihat/OPEN HAT 1.wav"), ("Rim", "rim/GRRim02.wav"), ("Perc 1", "perc/GRPerc01.wav"), ("Perc 2", "perc/PERC 3.wav"),
]


def clips(z, hooks):
    out = {"starters": [], "hooks": [], "pads": []}
    for label, folder in STARTERS:
        files = sorted(n for n in z.namelist() if n.startswith("3 - BONUS - Beat Starters MIDI Bundle/" + folder) and n.lower().endswith(".mp3"))
        n = files[len(files) // 2]
        stem = os.path.basename(n)[:-4]
        bpm = re.search(r"_(\d{2,3})_", stem)
        i = len(out["starters"]) + 1
        peaks = clip(z.read(n), ".mp3", os.path.join(OUT, "clips", f"starter-{i}.m4a"), 10)
        out["starters"].append({"name": label, "file": os.path.basename(n), "bpm": int(bpm.group(1)) if bpm else 0, "peaks": peaks})
    if hooks:
        for k, tag in enumerate(HOOKS, 1):
            n = next(x for x in hooks.namelist() if tag in x and x.lower().endswith(".wav"))
            stem = os.path.basename(n)[:-4]
            key, bpm = stem.split("_")[-2:]
            peaks = clip(hooks.read(n), ".wav", os.path.join(OUT, "clips", f"hook-{k}.m4a"), 10)
            out["hooks"].append({"name": f"Hook {tag[-2:]}", "file": os.path.basename(n), "key": key, "bpm": int(bpm), "peaks": peaks})
    for k, (label, path) in enumerate(PADS, 1):
        clip(z.read("4 - BONUS - Hit-Making Drums - Drumkit/" + path), ".wav", os.path.join(OUT, "clips", f"pad-{k}.m4a"), mono=True)
        out["pads"].append({"name": label, "file": os.path.basename(path)})
    print("clips.json", write("clips.json", out), "bytes")
    for k, v in out.items():
        print(" ", k, [c["file"] for c in v])


def main(argv):
    z = zipfile.ZipFile(os.path.expanduser(argv[0]))
    dsg = zipfile.ZipFile(os.path.expanduser(argv[1])) if len(argv) > 1 else None
    hooks = zipfile.ZipFile(os.path.expanduser(argv[2])) if len(argv) > 2 else None
    kit(z)
    bonus(z, dsg)
    clips(z, hooks)


if __name__ == "__main__":
    main(sys.argv[1:] or ["~/Downloads/MIDI Drum Kit Bundle V1.1.zip"])
