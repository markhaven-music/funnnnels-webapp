"""The TOP HITS MIDI Bundle VSL, from its script to an mp4 (2026-11-10, "crea nuovo funnel
per TOP HITS MIDI Bundle con TUTTO").

Same voice, captions, synth and encoder as the Jazz VSL (tools/jazz_vsl.py, imported and
pointed at this funnel). What differs:
  - the demos are four real files of the bundle (app/(funnels)/top-hits-chords/rolls.json,
    read from the pack by tools/extract_top_hits.py), their first bars on the page's sine, with
    the file's piano roll, a playhead and the file name on screen;
  - the pictures are this funnel's (public/funnels/top-hits-midi-bundle), the bonus covers the
    page's, and "list" is a page of real songs from the bundle's own list (browse-v1/songs.json).

  voice   ElevenLabs, cached in <work>/voice (needs ELEVENLABS_API_KEY)
  render  <work>/top-hits-vsl-en.mp4

usage: /usr/bin/python3 tools/top_hits_vsl.py voice|render <work dir>
"""
import json, os, sys
from PIL import Image, ImageChops, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jazz_vsl as J  # noqa: E402

ROOT = J.ROOT
TH = os.path.join(ROOT, "app", "(funnels)", "top-hits-chords")
PUB = os.path.join(ROOT, "public", "funnels", "top-hits-midi-bundle")
JPUB = os.path.join(ROOT, "public", "funnels", "jazz-midi-pack")
FPUB = os.path.join(ROOT, "public", "funnels", "famous-beats-bundle")
W, H = J.W, J.H
Y, CREAM, DIM = J.BRASS, J.CREAM, J.DIM

J.SCRIPT = os.path.join(TH, "vsl", "script-en.md")
J.PUB = PUB
# What the voice reads for what the captions show. Longest numbers first.
J.SPOKEN = {
    "2,304": "two thousand, three hundred and four",
    "1,548": "one thousand, five hundred and forty-eight",
    "1,000": "one thousand",
    "470": "four hundred and seventy",
    "808": "eight-oh-eight",
    "R&B": "R and B",
    "EDM": "E D M",
    "BPM": "B P M",
    "SZA": "Sizza",
    "The Weeknd": "The Weekend",
}
J.ROLLS = json.load(open(os.path.join(TH, "rolls.json")))
# How much of each file plays: about 10 seconds.
BEATS = {"blinding": 32, "killbill": 16, "lucid": 16, "someone": 16}
J.DEMOS = {
    "blinding": ("Blinding Lights · The Weeknd · 172 BPM · Fm", Y),
    "killbill": ("Kill Bill · SZA · 89 BPM · Ab", Y),
    "lucid": ("Lucid Dreams · Juice WRLD · 84 BPM · F#m", Y),
    "someone": ("Someone Like You · Adele · 134 BPM · A", Y),
}
BONUS = [  # the page's order (words.ts) and covers
    ("The Chord Progressions Bible", f"{JPUB}/bonus-2-640.webp"),
    ("MIDI Chord Pack (Jazz Edition)", f"{JPUB}/bonus-1-640.webp"),
    ("Anime & Video Games MIDI Pack", f"{JPUB}/bonus-3-640.webp"),
    ("Emotional Keys MIDI Bundle", f"{JPUB}/bonus-4-640.webp"),
    ("Drum Loops for Songwriting", f"{JPUB}/bonus-5-640.webp"),
    ("ESSENTIAL MIDI Drum Patterns", f"{FPUB}/bonus-essential-640.webp"),
]


def roll(rid):
    """The demo's notes cut to its beats, unisons merged as the page's player does."""
    r = J.ROLLS[rid]
    beats = min(r["beats"], BEATS[rid])
    notes = []
    for s, l, p in r["notes"]:
        if s >= beats:
            continue
        l = min(l, beats - s)
        twin = next((m for m in notes if m[2] == p and abs(m[0] - s) < 0.06), None)
        if twin:
            twin[1] = max(twin[1], l)
        else:
            notes.append([s, l, p])
    return {"bpm": r["bpm"], "beats": beats, "notes": notes, "chords": [], "file": r["file"]}


def song_list():
    """Real songs of the bundle, one in thirty of its list, three columns."""
    data = json.load(open(f"{PUB}/browse-v1/songs.json"))
    rude = ("fuck", "shit", "bitch", "wap", "ass", "sex")
    songs = [s for s in data["songs"] if s[0] and s[2] and s[3] and len(s[1]) <= 20 and len(s[0]) <= 16
             and not any(w in s[1].lower().split() or w in s[1].lower() and len(w) > 3 for w in rude)]
    pick = songs[5::max(1, len(songs) // 33)][:33]
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((W / 2, 110), "1,000 songs · 470+ artists · 4 folders", font=J.font(54, 0), fill=Y, anchor="ms")
    for i, s in enumerate(pick):
        c, r = divmod(i, 11)
        x, y = 110 + c * 590, 180 + r * 56
        d.text((x, y), s[1], font=J.font(30, 0), fill=CREAM)
        tw = d.textlength(s[1], font=J.font(30, 0))
        d.text((x + tw + 14, y + 5), f"{s[0]} · {s[2]} · {s[3]}", font=J.font(22, 5), fill=DIM)
    return layer


def visual(show):
    kind, _, arg = show.partition(" ")
    if kind == "none":
        return None
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if kind == "image":
        img = Image.open(f"{PUB}/{arg}.webp").convert("RGBA")
        img = J.fit(img, 1400 if img.width > img.height else 900, 760)
        if img.getextrema()[3][0] == 255:  # a render on pure black: black takes the frame's colour, no box around it
            img = ImageChops.lighter(img.convert("RGB"), Image.new("RGB", img.size, J.INK)).convert("RGBA")
        layer.alpha_composite(img, ((W - img.width) // 2, 50))
    elif kind == "bonus":
        name, path = BONUS[int(arg) - 1]
        img = J.fit(Image.open(path).convert("RGBA"), 560, 640)
        layer.alpha_composite(img, ((W - img.width) // 2, 60))
        d.text((W / 2, 760), f"BONUS {arg} · {name}", font=J.font(40, 0), fill=Y, anchor="ms")
    elif kind == "list":
        return song_list()
    elif kind == "card":
        d.text((W / 2, 440), arg, font=J.font(110, 0), fill=Y, anchor="ms")
    return layer


J.roll = roll
J.visual = visual


def render(work):
    J.render(work)
    os.replace(f"{work}/jazz-vsl-en.mp4", f"{work}/top-hits-vsl-en.mp4")
    print(f"{work}/top-hits-vsl-en.mp4")


if __name__ == "__main__":
    {"voice": J.voice, "render": render}[sys.argv[1]](sys.argv[2])
