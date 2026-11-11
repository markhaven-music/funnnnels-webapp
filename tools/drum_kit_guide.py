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
    """The Jazz MIDI Pack guide's look (make_guide.py), so the two guides are one family: a black cover with the
    name in Bebas Neue and the brand's one yellow (#f5b800), chapters with a yellow rule, IBM Plex for text and labels."""
    rows = "".join(f"<li><b>{esc(n)}</b><span class='sub'>{esc(sub)}</span><span>{esc(what)}</span></li>" for n, sub, what in FOLDERS)
    levels = "".join(f"<li><b>{esc(n)}</b><span>{esc(t)}</span></li>" for n, t in LEVELS)
    parts = "".join(f"<li><b class='mono'>{esc(n)}</b><span>{esc(t)}</span></li>" for n, t in NAME_PARTS)
    notes = "".join(f"<li><b class='mono'>{esc(n)}</b><span>{esc(t)}</span></li>" for n, t in NOTES)
    steps = "".join(f"<li><div><b>{esc(h)}</b><br>{esc(t)}</div></li>" for h, t in STEPS)
    bonuses = "".join(f"<li><b>{esc(n)}</b><span>{esc(t)}</span></li>" for n, t in BONUSES if n != "This guide")
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MIDI Drum Kit - Guide</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=block">
<style>
:root {{ --ink:#111; --mute:#5c5a54; --gold:#f5b800; --line:#e7e3d8; --display:"Bebas Neue",Impact,sans-serif;
  --body:"IBM Plex Sans",Helvetica,Arial,sans-serif; --mono:"IBM Plex Mono",Menlo,monospace; }}
@page {{ size: A4; margin: 16mm 15mm 18mm; }}
@page :first {{ margin: 0; }}
* {{ box-sizing: border-box; }}
body {{ margin:0; color:var(--ink); font:10.4pt/1.5 var(--body); -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
h1,h2,h3 {{ font-family:var(--display); font-weight:400; letter-spacing:.02em; margin:0; }}
.cover {{ height:297mm; background:#000; color:#fff; margin:0; padding:26mm 18mm; display:flex; flex-direction:column; justify-content:space-between; page-break-after:always; }}
.cover .brand {{ font:500 10pt var(--mono); letter-spacing:.3em; color:var(--gold); }}
.cover h1 {{ font-size:92pt; line-height:.86; }}
.cover h1 em {{ font-style:normal; color:var(--gold); }}
.cover .sub {{ font-size:13pt; max-width:125mm; color:#d8d4c8; margin-top:8mm; }}
.cover .stats {{ display:flex; gap:12mm; font:500 9pt var(--mono); color:#d8d4c8; }}
.cover .stats b {{ display:block; font:400 30pt var(--display); color:#fff; }}
.chapter {{ page-break-before:always; }}
.chapter.first {{ page-break-before:auto; }}
h2 {{ font-size:34pt; line-height:1; margin:0 0 4mm; break-after:avoid; }}
h2::after {{ content:""; display:block; width:18mm; height:3px; background:var(--gold); margin-top:3mm; }}
h2.next {{ margin-top:9mm; }}
.first h2 {{ font-size:28pt; margin-bottom:3mm; }}
.first h2.next {{ margin-top:6mm; }}
.first .steps {{ margin:3mm 0; gap:2.5mm; }}
.first .defs {{ margin:3mm 0; }}
.lead {{ font-size:12pt; line-height:1.55; max-width:150mm; }}
p {{ margin:0 0 3mm; max-width:160mm; }}
.steps {{ counter-reset:s; list-style:none; padding:0; margin:5mm 0; display:grid; gap:4mm; }}
.steps li {{ counter-increment:s; display:grid; grid-template-columns:12mm 1fr; break-inside:avoid; }}
.steps li::before {{ content:counter(s); font:400 26pt/1 var(--display); color:var(--gold); }}
.steps b {{ font-weight:600; }}
.defs {{ list-style:none; padding:0; margin:4mm 0; display:grid; gap:2.2mm; }}
.defs li {{ display:grid; grid-template-columns:52mm 1fr; gap:1mm 6mm; padding-bottom:2.2mm; border-bottom:1px solid var(--line); break-inside:avoid; }}
.defs b {{ font-weight:600; }}
.defs .sub {{ grid-column:1; font:400 8.5pt var(--mono); color:var(--mute); }}
.defs.three li span:last-child {{ grid-column:2; grid-row:1 / span 2; }}
.mono {{ font-family:var(--mono); font-weight:500; font-size:9.4pt; }}
.name {{ font:500 12pt var(--mono); background:#f6f3ea; padding:4mm 5mm; margin:3mm 0 5mm; border-left:3px solid var(--gold); }}
.name i {{ font-style:normal; color:#9a7400; }}
.close {{ margin-top:10mm; padding:6mm 7mm; background:#000; color:#fff; break-inside:avoid; }}
.close b {{ color:var(--gold); font-weight:600; }}
.close p {{ margin:0; max-width:none; }}
.small {{ font-size:8.5pt; color:var(--mute); margin-top:6mm; }}
</style></head><body>
<section class="cover">
  <div class="brand">GRIND ◆ STUDIO</div>
  <div>
    <h1>MIDI<br><em>DRUM</em><br>KIT</h1>
    <p class="sub">The guide: what is in every folder, how to read a file name, and a way to go from an empty project to a beat that bounces.</p>
  </div>
  <div class="stats"><div><b>11</b>folders, one per drum</div><div><b>3</b>steps to a beat</div><div><b>6</b>bonuses</div></div>
</section>

<section class="chapter first">
<h2>The idea</h2>
<p class="lead">Bounce comes from the rhythm, not from the sound. Two producers with the same kick and the same 808 get two different beats, because one of them knows where to put the notes.</p>
<p>This kit is those rhythms, as MIDI. That is why the files are patterns and not samples: drop one on any track and it plays the drum that is loaded there. You bring the sounds.</p>

<h2 class="next">Three steps</h2>
<ol class="steps">{steps}</ol>

<h2 class="next">Patterns and Fragments</h2>
<ul class="defs"><li><b>Pattern</b><span>1 to 4 bars long. The body of the beat.</span></li>
<li><b>Fragment</b><span>A smaller rhythm: usually fills, rolls, syncopations. Use it to end a section, to change one bar, or to add movement where the loop repeats.</span></li></ul>

<h2 class="next">How busy</h2>
<p>Inside a folder, the sub-folders tell you how much is going on.</p>
<ul class="defs">{levels}</ul>
</section>

<section class="chapter">
<h2>The folders</h2>
<ul class="defs three">{rows}</ul>
</section>

<section class="chapter">
<h2>Reading a file name</h2>
<div class="name">MDK_<i>Kick</i>_Complex_<i>Pattern</i>_25_<i>180</i>.mid</div>
<ul class="defs">{parts}</ul>
<p>Some names end with a short note in brackets. It tells you something useful before you drag the file in.</p>
<ul class="defs">{notes}</ul>
<p>The tempo in a name is where the file was written, not a limit. MIDI follows your project's tempo.</p>
</section>

<section class="chapter">
<h2>A way to start</h2>
<ol class="steps">
<li><div><b>Pick a Complete Beat or a Kick and Snare file.</b><br>Play the MP3 preview, then drag the MIDI in. Each drum lands on its own track.</div></li>
<li><div><b>Put your own sounds on the tracks.</b><br>Your kick, your snare, your hats. The bonus one-shots are there if you need some.</div></li>
<li><div><b>Change the hats.</b><br>Replace the hi-hat track with a pattern from Hihat Closed, then drop a Roll Up or Roll Down before a snare.</div></li>
<li><div><b>Add the 808.</b><br>Use a file from Kick and 808 so the two are written together, and move the 808 notes to your key.</div></li>
<li><div><b>End every 4 or 8 bars with a Fragment.</b><br>A fill on the snare, a roll on the hats, a gap in the kick. That is where a loop starts to sound like a record.</div></li>
</ol>
<p>Always follow your ears and taste.</p>

<h2 class="next">Your bonuses</h2>
<ul class="defs">{bonuses}</ul>

<div class="close"><p><b>Licence.</b> Your purchase includes a commercial licence: release and sell the beats you make with these files, with no royalties to pay.</p>
<p style="margin-top:3mm"><b>Help.</b> A file does not open, or something is missing? Write to support@thegrind.studio and we fix it.</p></div>
</section>
</body></html>"""


def build(out):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(page())
        src = f.name
    try:
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000", f"--print-to-pdf={out}", f"file://{src}"], check=True, capture_output=True)
    finally:
        os.unlink(src)


if __name__ == "__main__":
    build(os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "MIDI Drum Kit - Guide.pdf"))
