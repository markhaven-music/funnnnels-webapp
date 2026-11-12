#!/usr/bin/env python3
"""The Jazz MIDI Pack page's styles, for the new MIDI Drum Kit landing (landing B).

2026-11-12: "make the hero like the MIDI Jazz Pack one", "make the button more like the MIDI Jazz Pack
button", "add comparison table section", "make the summary section like the MIDI Jazz Pack landing page",
the reviews "more in MIDI JAZZ PACK style", "footer and section before make it like MIDI Jazz Pack".
The Jazz page is React with CSS modules; the Drum Kit landing is one static HTML document. So the rules
of the Jazz sections that landing B copies are taken from the modules as they are, each class renamed
(jazz.module.css .hero → .jz-hero, value → .jzv-, reviews → .jzr-, btn → .jzb-) and the page's yellow
set to the Drum Kit button's orange:

    /usr/bin/python3 tools/port_jazz_css.py     # writes app/(funnels)/midi-drum-kit/jazzCss.ts

Run it again when the Jazz page's look changes and landing B should follow. Everything sits under one
root class, .jz, which carries the Jazz page's variables and the reset its rules count on.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JAZZ = os.path.join(ROOT, "app", "(funnels)", "jazz-midi-pack")
OUT = os.path.join(ROOT, "app", "(funnels)", "midi-drum-kit", "jazzCss.ts")

# file → (prefix, the classes to take; None = all of them)
FILES = {
    "jazz.module.css": ("jz-", set("""hero heroBg topband topbar logo tag dot wrap heroCenter heroPre heroHead heroSub vsl heroBullets heroCta
        proofRow dawStrip mono dawLogos proof tick shield sec band secHead h2 hl hl2 sub chart chWinBg chRow chCorner chHead chWin chBox
        chLabel chCell chAlt mark markYes markNo markMeh chNote ctaBlock order payList stack guarantee panel two twoBody twoHead license
        licenseArt sealWrap seal sealRing sealDays sealUnit col faq micro final finalBg finalIn finalBare footer legal""".split())),
    "btn.module.css": ("jzb-", None),
    "value.module.css": ("jzv-", None),
    "reviews.module.css": ("jzr-", None),
}
ROOTS = {"page", "jazz"}  # the Jazz page's root classes: both become .jz

# The Drum Kit button's orange (abtest.ts COLORS.orange) where the Jazz page has its yellow.
ORANGE = "--y:#f5851f;--y-gloss:#ffa13d;--y-deep:#dd6408;--y-lip:#7a3303;--y-glow:rgb(236 106 12 / .55);--y-rgb:245 133 31;--b-rgb:245 133 31;--brass:var(--y);--brass-hi:var(--y);--brass-deep:var(--y-deep)"
FONTS = '--font-display:Poppins,"Poppins Fallback";--font-sans:Inter,"Inter Fallback",sans-serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,monospace'


def statements(css):
    """Top-level statements of a stylesheet: (prelude, body or None)."""
    out, i, n = [], 0, len(css)
    while i < n:
        j = i
        while j < n and css[j] not in "{;":
            j += 1
        if j >= n:
            break
        if css[j] == ";":
            i = j + 1
            continue
        depth, k = 1, j + 1
        while k < n and depth:
            depth += {"{": 1, "}": -1}.get(css[k], 0)
            k += 1
        out.append((css[i:j].strip(), css[j + 1:k - 1]))
        i = k
    return out


CLASS = re.compile(r"\.([A-Za-z_][\w-]*)")


def port(css, prefix, wanted, frames):
    """The rules whose classes are all wanted, renamed. frames: the file's @keyframes names."""
    out = []
    for prelude, body in statements(css):
        if prelude.startswith("@keyframes"):
            name = prelude.split()[1]
            out.append(("kf", name, f"@keyframes {prefix}{name}{{{squash(body)}}}"))
            continue
        if prelude.startswith("@"):
            inner = port(body, prefix, wanted, frames)
            rules = "".join(r[2] for r in inner if r[0] == "rule")
            if rules:
                out.append(("rule", None, f"{squash(prelude)}{{{rules}}}"))
            continue
        keep = []
        for sel in re.split(r",(?![^()]*\))", prelude):  # the commas between selectors, not those inside :where(…)
            sel = " ".join(sel.split())
            classes = CLASS.findall(sel)
            if sel in (".page", ".jazz") or not classes:
                continue
            if all(c in ROOTS or wanted is None or c in wanted for c in classes):
                keep.append(CLASS.sub(lambda m: ".jz" if m.group(1) in ROOTS else f".{prefix}{m.group(1)}", sel))
        if keep:
            decl = squash(body)
            for name in frames:  # animation: breathe 2.8s … → jzb-breathe
                decl = re.sub(rf"(animation(?:-name)?:[^;]*?)(?<![\w-]){name}(?![\w-])", rf"\1{prefix}{name}", decl)
            out.append(("rule", None, f"{','.join(keep)}{{{decl}}}"))
    return out


def squash(s):
    s = re.sub(r"\s*([{};:,])\s*", r"\1", re.sub(r"\s+", " ", s)).strip().rstrip(";")
    # rem → px at the Jazz page's 16px: the old Drum Kit page's root font size is not 16px, so a rem there is another length
    return re.sub(r"(?<![\w.])(\d*\.?\d+)rem\b", lambda m: f"{round(float(m.group(1)) * 16, 2):g}px", s)


def variables(css, cls):
    body = next(b for p, b in statements(css) if p.strip() == f".{cls}")
    return [squash(d) for d in body.split(";") if d.strip().startswith("--")]


def main():
    parts, used_frames = [], []
    for name, (prefix, wanted) in FILES.items():
        css = re.sub(r"/\*.*?\*/", "", open(os.path.join(JAZZ, name)).read(), flags=re.S)
        frames = [p.split()[1] for p, _ in statements(css) if p.startswith("@keyframes")]
        if name == "jazz.module.css":
            vars_ = variables(css, "page") + variables(css, "jazz")
        ported = port(css, prefix, wanted, frames)
        rules = "".join(r[2] for r in ported if r[0] == "rule")
        kfs = "".join(r[2] for r in ported if r[0] == "kf" and f"{prefix}{r[1]}" in rules)
        parts.append(rules + kfs)
    root = (
        f".jz{{{';'.join(vars_)};{ORANGE};{FONTS};display:block;width:100%;color:var(--cream);font-family:var(--font-sans);font-size:17px;line-height:1.6;text-align:left}}"
        ".jz,.jz *,.jz *::before,.jz *::after{box-sizing:border-box}"
        # the old page's reset gives every element margin: 0 auto; the Jazz rules count on Tailwind's (margin 0, lists bare, pictures block)
        ".jz *{margin:0;padding:0}"
        ".jz :where(ul,ol){list-style:none}"
        ".jz :where(img,svg,canvas){display:block;max-width:100%}"
        ".jz :where(img){height:auto}"
        ".jz :where(h1,h2,h3,h4){font-size:inherit;font-weight:inherit}"
        ".jz :where(a){color:inherit;text-decoration:inherit}"
        ".jz :where(b,strong){font-weight:bolder}"
        ".jz :where(button){font:inherit;color:inherit;background:none;border:0;cursor:pointer}"
    )
    css = root + "".join(parts)
    assert "`" not in css and "${" not in css
    with open(OUT, "w") as f:
        f.write("// Made by tools/port_jazz_css.py from the Jazz MIDI Pack page's CSS modules: don't edit, run the tool.\n")
        f.write("// The Jazz sections' styles for the new MIDI Drum Kit landing (./landingNew.ts), under the root class .jz.\n")
        f.write("export const JAZZ_CSS = String.raw`" + css + "`;\n")
    print(OUT, len(css), "bytes")


if __name__ == "__main__":
    main()
