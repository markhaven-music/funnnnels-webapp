#!/usr/bin/env python3
"""The pack's real files the blog posts play (app/blog/rolls.json).

Picks files out of the landing's pack player data
(public/funnels/jazz-midi-pack/browse-v6, written by tools/extract_browse.py)
by their place in the pack, so a post's piano roll is a file a buyer gets.
Run again after a new pack (and a new browse folder): the names below are
matched by text, not by number.

    python3 tools/blog_rolls.py
"""
import json
import os

HERE = os.path.dirname(__file__)
BROWSE = os.path.join(HERE, "..", "public", "funnels", "jazz-midi-pack", "browse-v6")
OUT = os.path.join(HERE, "..", "app", "blog", "rolls.json")

# id: (folder label, [a piece of each choice's name, in the folder's order])
PICKS = {
    # ii-V-I, the same three chords in six voicings
    "iiVI": ("Progressions", ["ii-V-I Major", "Best Voicing", "Pads"]),
    "iiVI_root": ("Progressions", ["ii-V-I Major", "Root Position", "Pads"]),
    "iiVI_shell": ("Progressions", ["ii-V-I Major", "Shell", "Pads"]),
    "iiVI_rootless": ("Progressions", ["ii-V-I Major", "Rootless", "Pads"]),
    "iiVI_drop2": ("Progressions", ["ii-V-I Major", "Drop 2", "Pads"]),
    "iiVI_quartal": ("Progressions", ["ii-V-I Major", "Quartal", "Pads"]),
    "iiVI_charleston": ("Progressions", ["ii-V-I Major", "Best Voicing", "Charleston"]),
    "iiVI_walking": ("Bass lines", ["ii-V-I Major", "Walking"]),
    "iiVi_minor": ("Progressions", ["ii-V-i Minor", "Best Voicing", "Pads"]),
    # the turnaround, before and after
    "turn_root": ("Progressions", ["I-vi-ii-V Turnaround", "Root Position", "Pads"]),
    "turn_best": ("Progressions", ["I-vi-ii-V Turnaround", "Best Voicing", "Pads"]),
    # the rest, Best Voicing as pads
    "autumn": ("Progressions", ["Autumn Leaves Type", "Best Voicing", "Pads"]),
    "circle": ("Progressions", ["Minor Circle of Fifths", "Best Voicing", "Pads"]),
    "tritone": ("Progressions", ["Tritone Substitution", "Best Voicing", "Pads"]),
    "backdoor": ("Progressions", ["Backdoor ii-V", "Best Voicing", "Pads"]),
    "passing": ("Progressions", ["Passing Diminished", "Best Voicing", "Pads"]),
    "cliche": ("Progressions", ["Minor Line Clich", "Best Voicing", "Pads"]),
    "dorian": ("Progressions", ["Dorian Vamp", "Best Voicing", "Pads"]),
    "royal": ("Progressions", ["Royal Road", "Best Voicing", "Pads"]),
    "jttou": ("Progressions", ["Just the Two of Us", "Best Voicing", "Pads"]),
    "sadlofi": ("Progressions", ["Sad Lofi", "Best Voicing", "Pads"]),
    "lofiballad": ("Progressions", ["Minor Lofi Ballad", "Best Voicing", "Pads"]),
    "neo4321": ("Progressions", ["Neo Soul 4-3-2-1", "Best Voicing", "Pads"]),
    "neominor": ("Progressions", ["Neo Soul Minor Loop", "Best Voicing", "Pads"]),
    "minorturn": ("Progressions", ["Minor Turnaround", "Best Voicing", "Pads"]),
    "I_III7": ("Progressions", ["I-III7-IV-iv", "Best Voicing", "Pads"]),
    "plagal": ("Progressions", ["Minor Plagal", "Best Voicing", "Pads"]),
    # full loops (chords + bass; the drums are drawn in the pack player, not here)
    "loop_lofi_sad": ("Genre loops", ["Lofi Hip Hop", "Sad Lofi", "Full"]),
    "loop_lofi_autumn": ("Genre loops", ["Lofi Hip Hop", "Autumn Leaves Type", "Full"]),
    "loop_neo_4321": ("Genre loops", ["Neo Soul", "Neo Soul 4-3-2-1", "Full"]),
    "loop_neo_minor": ("Genre loops", ["Neo Soul", "Neo Soul Minor Loop", "Full"]),
    "loop_trap_jttou": ("Genre loops", ["Trap Soul", "Just the Two of Us", "Full"]),
}


def main():
    pack = json.load(open(os.path.join(BROWSE, "pack.json")))
    folders = {f["label"]: f for f in pack["folders"]}
    chunks = {}
    out = {}
    for rid, (label, names) in PICKS.items():
        folder = folders[label]
        idx = []
        for dim, name in zip(folder["dims"], names):
            hits = [i for i, o in enumerate(dim["opts"]) if name in o]
            if not hits:
                raise SystemExit(f"{rid}: no {dim['label']} named {name!r}")
            idx.append(str(hits[0]))
        chunk, i = folder["files"][".".join(idx)]
        if chunk not in chunks:
            chunks[chunk] = json.load(open(os.path.join(BROWSE, f"{chunk}.json")))
        f = chunks[chunk][i]
        # as rolls.json has them: no drums (the roll draws notes, the synth plays them)
        out[rid] = {k: f[k] for k in ("file", "bpm", "beats", "notes", "chords")}
        print(f"{rid:18} {f['file']}  ({len(f['notes'])} notes)")
    with open(OUT, "w") as fh:
        json.dump(out, fh, separators=(",", ":"))
    print(f"{len(out)} rolls, {os.path.getsize(OUT) / 1024:.0f} KB → {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()
