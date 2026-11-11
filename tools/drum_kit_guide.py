#!/usr/bin/env python3
"""The MIDI Drum Kit guide: a PDF bonus (2026-11-12, "mi pare che c'è un PDF in jazz midi pack, fai una
cosa simile per midi drum kit bundle"). Like the Jazz MIDI Pack's guide (~/Desktop/Jazz MIDI Pack Tools/
make_guide.py): written as HTML and printed by headless Google Chrome.

Only what the bundle's zip shows (R2 midi-drum-kit/MIDI Drum Kit - Bundle.zip, read 2026-11-12): its folders,
its "READ ME - Meaning of words and labels.txt", its file names (the number at the end is the tempo the file
was written at, checked in the MIDI), and the landing's three steps. No file counts: the page states its own.

    /usr/bin/python3 tools/drum_kit_guide.py out.pdf
Then upload to R2 as midi-drum-kit/MIDI Drum Kit - Guide.pdf (funnel.ts files.guide).
"""
import html
import os
import subprocess
import sys
import tempfile

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

FOLDERS = [
    ("1. 808", "Patterns and Fragments", "Bass lines for the 808. Files marked (C) are written on C: move the notes to your beat's key."),
    ("2. Hihat Closed", "Basic, Complex, Hyper-Complex, Roll Up, Roll Down", "The biggest folder. Start in Basic, then swap bars for Complex ones. Roll Up and Roll Down are short runs that climb or fall."),
    ("3. Hihat Open", "Patterns", "Where the open hat lands. Layer one over a closed-hat pattern."),
    ("4. Kick", "Patterns and Fragments", "Kick rhythms from simple to busy. A file ending in a number was written at that tempo."),
    ("5. Snare or Clap", "Patterns and Fragments", "Backbeats, and the fills and rolls that lead into them."),
    ("6. Accents (clap, rim, perc)", "Patterns", "The small hits around the snare that make a loop feel played."),
    ("7. Kick and Snare (Multi-Track)", "MIDI and MP3 previews", "Kick and snare already working together, each on its own track. Listen to the MP3 first."),
    ("8. Kick and 808 (Multi-Track)", "MIDI", "Kick and 808 written as a pair, so they never fight."),
    ("9. Complete Beats (Multi-Track)", "MIDI and MP3 previews", "Every drum in one file, one track per drum. The fastest start: drop one in and change what you like."),
    ("10. Rolls", "MIDI", "An extra folder of rolls, named by tempo: Roll_150_02 was written at 150 BPM."),
    ("11. Base Rhythms", "MIDI", "Plain 4-bar hi-hat grids (4th, 8th, 16th, 32nd notes and triplets) to build on."),
]

LEVELS = [
    ("Basic", "Rhythms that stay mostly on the same note. Your vocabulary, the building blocks."),
    ("Complex", "Play on different notes, with rolls and velocity changes."),
    ("Hyper-Complex", "Stranger combinations, cicadas included. They push what is possible."),
    ("Roll Up", "A clear motion from low to high."),
    ("Roll Down", "A clear motion from high to low."),
]

NAME_PARTS = [
    ("MDK", "MIDI Drum Kit"),
    ("Kick", "the drum the file is for"),
    ("Complex", "how busy it is: Basic, Complex or Hyper-Complex"),
    ("Pattern", "Pattern (1 to 4 bars) or Fragment (a smaller rhythm)"),
    ("25", "its number in the folder"),
    ("180", "the tempo it was written at, in BPM, when there is one"),
]

NOTES = [
    ("(4 bars)", "the pattern is 4 bars long"),
    ("(fill)", "made to end a section"),
    ("(triplets), (32th-triplets)", "built on triplets"),
    ("(cicada)", "the fast buzzing hat roll"),
    ("(weird)", "unusual on purpose: listen before you commit"),
    ("(low), (very low)", "sits low in the piano roll"),
    ("(C)", "808 files: written on C"),
]

STEPS = [
    ("Open the folder of the drum you need.", "The library is organised by drum hit, so you always know where to look."),
    ("Drag a MIDI file onto a track in your DAW.", "No programming and no setup. It plays whatever drum sound is on that track, so the kit works with the sounds you already have."),
    ("Change it, layer it, arrange it.", "Swap a bar for a Fragment, add a roll before the snare, mute a hit. All fragments can go anywhere and are interchangeable: if one sounds good on a beat, it will usually sound good on any beat."),
]

BONUSES = [
    ("Famous Beats MIDI Bundle", "5 volumes, each with 10 multi-track MIDI patterns and an MP3 of every one."),
    ("Beat Starters MIDI Bundle", "7 packs of musical MIDI: chord progressions, emotional pianos, guitars, melodies, strings, trap pianos, trap plucks. Each with MP3 previews."),
    ("Hit-Maker Drums", "WAV one-shots in six folders: clap, hihat, kick, perc, rim, snare. Royalty-free."),
    ("Drunk Swing Grooves", "211 MIDI files: groove templates, drum grooves and neo soul keys. Its own PDF guide is inside."),
    ("MYSTERY Hooks Pack", "17 WAV hooks. The key and the tempo are in every file name."),
    ("This guide", "The page you are reading."),
]


def esc(s):
    return html.escape(s, quote=True)


def page():
    rows = "".join(f"<tr><td class='f'>{esc(n)}</td><td class='s'>{esc(sub)}</td><td>{esc(what)}</td></tr>" for n, sub, what in FOLDERS)
    levels = "".join(f"<tr><td class='f'>{esc(n)}</td><td>{esc(t)}</td></tr>" for n, t in LEVELS)
    parts = "".join(f"<tr><td class='f mono'>{esc(n)}</td><td>{esc(t)}</td></tr>" for n, t in NAME_PARTS)
    notes = "".join(f"<tr><td class='f mono'>{esc(n)}</td><td>{esc(t)}</td></tr>" for n, t in NOTES)
    steps = "".join(f"<li><b>{esc(h)}</b><br>{esc(t)}</li>" for h, t in STEPS)
    bonuses = "".join(f"<tr><td class='f'>{esc(n)}</td><td>{esc(t)}</td></tr>" for n, t in BONUSES)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MIDI Drum Kit - Guide</title><style>
@page {{ size: A4; margin: 18mm 17mm 18mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #141414; font-size: 10.6pt; line-height: 1.45; margin: 0; }}
.cover {{ background: #0a0a0a; color: #fff; padding: 18mm 12mm 16mm; margin: 0 0 9mm; }}
.cover .brand {{ letter-spacing: .28em; font-size: 9pt; font-weight: 700; color: #f5b800; }}
.cover h1 {{ font-size: 34pt; line-height: 1.05; margin: 5mm 0 4mm; font-weight: 800; }}
.cover p {{ font-size: 12.5pt; margin: 0; color: rgba(255,255,255,.88); max-width: 150mm; }}
h2 {{ font-size: 15pt; margin: 9mm 0 3mm; padding-left: 3.2mm; border-left: 1.6mm solid #f5b800; break-after: avoid; }}
p {{ margin: 0 0 3mm; }}
table {{ width: 100%; border-collapse: collapse; margin: 0 0 3mm; }}
td {{ vertical-align: top; padding: 2.2mm 2.5mm 2.2mm 0; border-bottom: .2mm solid #e3e3e3; }}
tr {{ break-inside: avoid; }}
td.f {{ font-weight: 700; width: 47mm; }}
td.s {{ width: 40mm; color: #555; font-size: 9.6pt; }}
.mono {{ font-family: Menlo, Consolas, monospace; font-size: 9.6pt; }}
.name {{ font-family: Menlo, Consolas, monospace; font-size: 12pt; background: #f4f4f4; padding: 3mm 4mm; margin: 0 0 3mm; }}
ol {{ margin: 0 0 3mm; padding-left: 6mm; }}
li {{ margin: 0 0 3mm; break-inside: avoid; }}
.foot {{ margin-top: 8mm; color: #555; font-size: 9.6pt; }}
.break {{ break-before: page; }}
</style></head><body>
<div class="cover"><div class="brand">GRIND STUDIO</div><h1>MIDI Drum Kit<br>Guide</h1>
<p>What is in every folder, how to read a file name, and how to get from an empty project to a beat that bounces.</p></div>

<h2>The idea</h2>
<p>Bounce comes from the rhythm, not from the sound. Two producers with the same kick and the same 808 get two different beats, because one of them knows where to put the notes. This kit is those rhythms, as MIDI: you bring the sounds.</p>
<p>That is why the files are patterns and not samples. Drop one on any track and it plays the drum that is loaded there.</p>

<h2>Three steps</h2>
<ol>{steps}</ol>

<h2>Patterns and Fragments</h2>
<table><tr><td class="f">Pattern</td><td>1 to 4 bars long. The body of the beat.</td></tr>
<tr><td class="f">Fragment</td><td>A smaller rhythm: usually fills, rolls, syncopations. Use it to end a section, to change one bar, or to add movement where the loop repeats.</td></tr></table>

<h2 class="break">The folders</h2>
<table>{rows}</table>

<h2>How busy: the sub-folders</h2>
<table>{levels}</table>

<h2 class="break">Reading a file name</h2>
<div class="name">MDK_Kick_Complex_Pattern_25_180.mid</div>
<table>{parts}</table>
<p>Some names end with a short note in brackets. It tells you something useful before you drag the file in:</p>
<table>{notes}</table>
<p>The tempo in a name is where the file was written, not a limit. MIDI follows your project's tempo.</p>

<h2>A way to start</h2>
<ol>
<li><b>Pick a Complete Beat or a Kick and Snare file.</b><br>Play the MP3 preview, then drag the MIDI in. Each drum lands on its own track.</li>
<li><b>Put your own sounds on the tracks.</b><br>Your kick, your snare, your hats. The bonus one-shots are there if you need some.</li>
<li><b>Change the hats.</b><br>Replace the hi-hat track with a pattern from Hihat Closed, then drop a Roll Up or Roll Down before a snare.</li>
<li><b>Add the 808.</b><br>Use a file from Kick and 808 so the two are written together, and move the 808 notes to your key.</li>
<li><b>End every 4 or 8 bars with a Fragment.</b><br>A fill on the snare, a roll on the hats, a gap in the kick. That is where a loop starts to sound like a record.</li>
</ol>
<p>Always follow your ears and taste.</p>

<h2 class="break">Your bonuses</h2>
<table>{bonuses}</table>

<h2>Licence</h2>
<p>Your purchase includes a commercial licence: release and sell the beats you make with these files, with no royalties to pay.</p>

<p class="foot">A file does not open, or something is missing? Write to support@thegrind.studio and we fix it.<br>GRIND STUDIO</p>
</body></html>"""


def build(out):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(page())
        src = f.name
    try:
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={out}", f"file://{src}"], check=True, capture_output=True)
    finally:
        os.unlink(src)


if __name__ == "__main__":
    build(os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "MIDI Drum Kit - Guide.pdf"))
