"""Translated upsell VSLs of the MIDI Drum Kit funnel (Famous Beats, TOP HITS): captions on
black in the style of each English video, over a new voiceover.

  python tools/upsell_vsl.py voice  <work dir> <script.md> famous|tophits   (ELEVENLABS_API_KEY in env)
  python tools/upsell_vsl.py check  <work dir> <script.md> famous|tophits   (scribe_v1 of each paragraph)
  python tools/upsell_vsl.py render <work dir> <script.md> famous|tophits <font.ttf> [--redraw]

voice: one ElevenLabs request per paragraph of the script (the text after its "---"), with
previous_text / next_text, loudness-normalised (-16 LUFS), forced alignment per paragraph,
then full.wav with 0.45 s between paragraphs. render: one frame per word (Pillow), timed at
30 fps, muxed with full.wav -> <work dir>/VSL-<style>-<lang>.mp4.

Styles, measured on the English videos:
  famous  (Wistia t1dx0gv5tg): Bebas Neue capitals, 3 words at a time, the word being said
          in orange #fc4200, the others white. font = BebasNeue-Regular.ttf
  tophits (Wistia 8s55snt7vw): Roboto Medium, a line of up to ~1150 px, the word being said
          in a purple box #7e007e, all white. font = Roboto variable TTF
Needs Pillow and ffmpeg. The voice is the Italian landing VSL's (MarcoTrox) unless --voice.
"""
import json, os, re, subprocess, sys, urllib.request

CMD, D, SCRIPT, STYLE = sys.argv[1:5]
LANG = sys.argv[sys.argv.index("--lang") + 1] if "--lang" in sys.argv else "it"
VOICE = sys.argv[sys.argv.index("--voice") + 1] if "--voice" in sys.argv else "W71zT1VwIFFx3mMGH2uZ"  # MarcoTrox
MODEL = "eleven_v4"
GAP = 0.45
os.makedirs(D, exist_ok=True)

# Written → spoken, word for word (one spoken word per written word, so the captions can
# show the written words on the aligner's timings), so the voice reads numbers and names right.
SPOKEN = {
    "it": {"FL": "Effe-Elle", "31": "trentun", "310": "trecentodieci", "496": "quattrocentonovantasei", "808,": "ottozerotto,",
           "BPM": "bi-pi-em", "BeatStars.": "Beat-Stars.", "hi-hat": "hai-het"},
}[LANG]


def paragraphs():
    body = open(SCRIPT).read().split("\n---\n", 1)[1]
    return [p.strip() for p in body.split("\n\n") if p.strip() and not p.strip().startswith("[")]


def speak(t):
    return " ".join(SPOKEN.get(w, w) for w in t.split(" "))


run = lambda *a: subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)
dur = lambda f: float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
key = lambda: os.environ["ELEVENLABS_API_KEY"]


if CMD == "voice":
    written = paragraphs()
    spoken = [speak(p) for p in written]
    json.dump({"written": written, "spoken": spoken}, open(f"{D}/segments.json", "w"), ensure_ascii=False, indent=1)
    for sub in ("mp3", "wav", "align"):
        os.makedirs(f"{D}/{sub}", exist_ok=True)
    for i, t in enumerate(spoken):
        mp3, wav, al = f"{D}/mp3/{i:02d}.mp3", f"{D}/wav/{i:02d}.wav", f"{D}/align/{i:02d}.json"
        if not os.path.exists(mp3):
            req = {"text": t, "model_id": MODEL, "language_code": LANG, "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                   "previous_text": spoken[i - 1] if i else None, "next_text": spoken[i + 1] if i + 1 < len(spoken) else None}
            r = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
                                       data=json.dumps(req).encode(), headers={"xi-api-key": key(), "Content-Type": "application/json"})
            open(mp3, "wb").write(urllib.request.urlopen(r, timeout=300).read())
            for f in (wav, al):
                if os.path.exists(f):
                    os.remove(f)
        if not os.path.exists(wav):
            run("-i", mp3, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100", "-ac", "1", "-ar", "44100", wav)
        if not os.path.exists(al):
            out = subprocess.check_output(["curl", "-s", "-H", f"xi-api-key: {key()}", "-F", f"file=@{wav}", "-F", f"text={t}",
                                           "https://api.elevenlabs.io/v1/forced-alignment"])
            a = json.loads(out)
            assert "words" in a, out[:300]
            json.dump(a, open(al, "w"), ensure_ascii=False)
        print(i, "ok", round(dur(wav), 1), "s", flush=True)
    run("-f", "lavfi", "-t", str(GAP), "-i", "anullsrc=r=44100:cl=mono", f"{D}/gap.wav")
    parts = []
    for i in range(len(spoken)):
        parts.append(f"{D}/wav/{i:02d}.wav")
        if i + 1 < len(spoken):
            parts.append(f"{D}/gap.wav")
    open(f"{D}/full.txt", "w").write("".join(f"file '{p}'\n" for p in parts))
    run("-f", "concat", "-safe", "0", "-i", f"{D}/full.txt", "-c:a", "pcm_s16le", f"{D}/full.wav")
    print("paragraphs", len(spoken), "total", round(dur(f"{D}/full.wav"), 1), "s")

elif CMD == "check":
    os.makedirs(f"{D}/stt", exist_ok=True)
    seg = json.load(open(f"{D}/segments.json"))
    for i in range(len(seg["spoken"])):
        f = f"{D}/stt/{i:02d}.json"
        if not os.path.exists(f):
            out = subprocess.check_output(["curl", "-s", "-H", f"xi-api-key: {key()}", "-F", "model_id=scribe_v1", "-F", f"language_code={LANG}",
                                           "-F", f"file=@{D}/wav/{i:02d}.wav", "https://api.elevenlabs.io/v1/speech-to-text"])
            open(f, "wb").write(out)
        print(f"── {i:02d}\nSCRIPT {seg['spoken'][i]}\nHEARD  {json.load(open(f))['text']}\n")

elif CMD == "render":
    from PIL import Image, ImageDraw, ImageFont

    FONT = sys.argv[5]
    W, H, FPS = 1920, 1080, 30
    BG, WHITE = (0, 0, 0), (253, 253, 253)
    if STYLE == "famous":
        SIZE, HOT, MAXW, MAXN, BOX, CAPS = 160, (252, 66, 0), 1500, 3, None, True
    else:
        SIZE, HOT, MAXW, MAXN, BOX, CAPS = 78, (126, 0, 126), 1160, 8, (126, 0, 126), False
    font = ImageFont.truetype(FONT, SIZE)
    if STYLE == "tophits":
        font.set_variation_by_name("Medium")
    space = font.getlength(" ")
    seg = json.load(open(f"{D}/segments.json"))
    frames = f"{D}/frames-{STYLE}"
    os.makedirs(frames, exist_ok=True)

    # Words with absolute times.
    words, t0 = [], 0.0
    for i in range(len(seg["spoken"])):
        al = [w for w in json.load(open(f"{D}/align/{i:02d}.json"))["words"] if w["text"].strip()]
        written = seg["written"][i].split()
        if len(al) != len(written):
            raise SystemExit(f"paragraph {i}: {len(al)} aligned words, {len(written)} written")
        toks = [{"t": txt, "s": t0 + w["start"], "e": t0 + w["end"], "seg": i} for txt, w in zip(written, al)]
        words += toks
        t0 += dur(f"{D}/wav/{i:02d}.wav") + GAP
    total = dur(f"{D}/full.wav")
    if CAPS:
        for w in words:
            w["t"] = w["t"].upper()

    def width(ws):
        return sum(font.getlength(w["t"]) for w in ws) + space * (len(ws) - 1)

    # Chunks: famous = 3 words (2-4 at punctuation), tophits = a line broken at punctuation.
    chunks, cur = [], []
    for w in words:
        if cur and (len(cur) >= MAXN or width(cur + [w]) > MAXW or w["seg"] != cur[-1]["seg"]):
            chunks.append(cur)
            cur = []
        cur.append(w)
        if w["t"][-1] in ".?!" or (w["t"][-1] in ",:;" and len(cur) >= (2 if STYLE == "famous" else 4)):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)

    def frame(chunk, k, path):
        img = Image.new("RGB", (W, H), BG)
        dr = ImageDraw.Draw(img)
        asc, desc = font.getmetrics()
        if STYLE == "famous":
            cap = SIZE * 0.7  # Bebas Neue's cap height: centre the capitals
            y = H / 2 - (asc - cap) - cap / 2
        else:
            y = H / 2 - (asc + desc) / 2
        x = (W - width(chunk)) / 2
        for j, w in enumerate(chunk):
            wl = font.getlength(w["t"])
            if j == k and BOX:
                dr.rounded_rectangle([x - 12, y - 4, x + wl + 12, y + asc + desc + 2], radius=8, fill=BOX)
            dr.text((x, y), w["t"], font=font, fill=HOT if (j == k and not BOX) else WHITE)
            x += wl + space
        img.save(path)

    states, n = [], 0
    for c, chunk in enumerate(chunks):
        for k, w in enumerate(chunk):
            nxt = chunk[k + 1]["s"] if k + 1 < len(chunk) else (chunks[c + 1][0]["s"] if c + 1 < len(chunks) else total)
            # Between paragraphs the last line stays until the next starts, at most 0.6 s past its end.
            if k + 1 == len(chunk):
                nxt = min(nxt, max(w["e"] + 0.6, w["s"] + 0.3))
            f = f"{frames}/{n:05d}.png"
            n += 1
            if not os.path.exists(f) or "--redraw" in sys.argv:
                frame(chunk, k, f)
            states.append((w["s"], nxt, f))
    blank = f"{frames}/blank.png"
    Image.new("RGB", (W, H), BG).save(blank)

    seq = f"{D}/seq-{STYLE}"
    subprocess.run(["rm", "-rf", seq])
    os.makedirs(seq)
    j = 0
    for fr in range(round(total * FPS)):
        t = fr / FPS
        while j + 1 < len(states) and states[j + 1][0] <= t:
            j += 1
        f = states[j][2] if states[j][0] <= t < states[j][1] else blank
        os.symlink(f, f"{seq}/{fr:06d}.png")
    out = f"{D}/VSL-{STYLE}-{LANG}.mp4"
    run("-framerate", str(FPS), "-i", f"{seq}/%06d.png", "-i", f"{D}/full.wav", "-map", "0:v", "-map", "1:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out)
    print("chunks", len(chunks), "frames", n, "total", round(total, 2), "->", out)
