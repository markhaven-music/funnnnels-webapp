#!/usr/bin/env python3
"""The landing's value-stack picture (the offer box's top: the kit, its bonuses, total value, the price),
remade for six bonuses (2026-11-12, "anche questa immagine andrebbe rifatta"). The old ones were AI-made
and said three bonuses and 988. Built as HTML from the page's own pictures and numbers and printed by
headless Google Chrome, one per language:

    /usr/bin/python3 tools/value_stack.py            # writes public/funnels/midi-drum-kit/value-stack-6*.webp

Numbers: the kit 497 and the first three bonuses 197, 197, 97 are the old picture's (they add up to its
988); the three new ones 37, 27, 17 (midi-drum-kit/stackSwitch.ts STACK_VALUES); was 297, now 27 (funnel.ts).
The price in the picture is in euros in every language, as it was.
"""
import os
import subprocess
import tempfile

from PIL import Image

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "public", "funnels", "midi-drum-kit")

KIT, WAS, NOW = 497, 297, 27
BONUSES = [("famous", "Famous Beats Bundle", 197), ("starters", "Beat Starters Bundle", 197), ("drums", "Hit-Maker Drums", 97),
           ("grooves", "Drunk Swing Grooves", 37), ("hooks", "MYSTERY Hooks Pack", 27), ("guide", None, 17)]
TOTAL = KIT + sum(v for _, _, v in BONUSES)

LANGS = {
    "": dict(bonus="Bonus #{n}:", value="€{v} Value", total="TOTAL VALUE: €{t}", week="BLACK FRIDAY WEEK", save="YOU SAVE €{s}", guide="MIDI Drum Kit Guide", money="€{v}", thousands=","),
    "-fr": dict(bonus="Bonus n°{n} :", value="Valeur {v} €", total="VALEUR TOTALE : {t} €", week="SEMAINE DU BLACK FRIDAY", save="TU ÉCONOMISES {s} €", guide="Guide du MIDI Drum Kit", money="{v} €", thousands=""),
    "-es": dict(bonus="Bono #{n}:", value="Valor {v} €", total="VALOR TOTAL: {t} €", week="SEMANA DEL BLACK FRIDAY", save="AHORRAS {s} €", guide="Guía del MIDI Drum Kit", money="{v} €", thousands=""),
    "-de": dict(bonus="Bonus #{n}:", value="Wert: {v} €", total="GESAMTWERT: {t} €", week="BLACK-FRIDAY-WOCHE", save="DU SPARST {s} €", guide="MIDI Drum Kit Guide", money="{v} €", thousands=""),
    "-it": dict(bonus="Bonus #{n}:", value="Valore {v} €", total="VALORE TOTALE: {t} €", week="SETTIMANA DEL BLACK FRIDAY", save="RISPARMI {s} €", guide="Guida al MIDI Drum Kit", money="{v} €", thousands=""),
}


def page(w):
    num = lambda n: f"{n:,}".replace(",", w["thousands"])
    cards = "".join(
        f"""<div class="card"><img src="file://{DIR}/bonus-{key}.webp"><div><div class="n">{w['bonus'].format(n=i + 1)}</div>
<div class="name">{name or w['guide']}</div><div class="v">{w['value'].format(v=v)}</div></div></div>"""
        for i, (key, name, v) in enumerate(BONUSES)
    )
    return f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&display=block">
<style>
* {{ box-sizing: border-box; }}
body {{ margin: 0; width: 1000px; background: #fff; font-family: Montserrat, Helvetica, Arial, sans-serif; color: #111; }}
.wrap {{ padding: 34px 44px 40px; }}
.kit {{ position: relative; width: 290px; margin: 0 auto 30px; }}
.kit img {{ display: block; width: 100%; filter: drop-shadow(0 18px 26px rgba(0,0,0,.28)); }}
.ribbon {{ position: absolute; left: -84px; top: 6px; width: 220px; padding: 7px 0; transform: rotate(-38deg); background: #f26a1b; color: #fff;
  font-weight: 800; font-size: 19px; text-align: center; box-shadow: 0 6px 14px rgba(0,0,0,.25); }}
.grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px 18px; }}
.card {{ display: flex; align-items: center; gap: 16px; height: 128px; padding: 10px 16px 10px 10px; border-radius: 12px; background: #1c1c1c; color: #fff; }}
.card img {{ flex: none; width: 108px; height: 108px; object-fit: contain; }}
.n {{ font-weight: 700; font-size: 19px; color: #f58a3c; }}
.name {{ margin: 3px 0 4px; font-weight: 800; font-size: 25px; line-height: 1.1; }}
.v {{ font-weight: 800; font-size: 21px; color: #f26a1b; }}
.total {{ display: flex; align-items: center; gap: 22px; margin: 34px 4px 0; font-weight: 800; font-size: 34px; white-space: nowrap; }}
.total::before, .total::after {{ content: ""; flex: 1; height: 22px; border: 4px solid #111; border-top: 0; margin-top: -22px; }}
.total::before {{ border-right: 0; border-radius: 0 0 0 18px; }}
.total::after {{ border-left: 0; border-radius: 0 0 18px 0; }}
.week {{ margin-top: 14px; text-align: center; font-weight: 800; font-size: 32px; }}
.price {{ display: flex; align-items: center; justify-content: center; gap: 22px; margin-top: 18px; font-weight: 800; }}
.was {{ position: relative; font-size: 56px; color: #222; }}
.was::after {{ content: ""; position: absolute; left: -8px; right: -8px; top: 52%; height: 7px; background: #f26a1b; transform: rotate(-9deg); border-radius: 4px; }}
.now {{ padding: 12px 30px; border: 7px solid #f26a1b; border-radius: 999px; font-size: 62px; line-height: 1; box-shadow: 0 0 22px rgba(242,106,27,.55); }}
.save {{ width: fit-content; margin: 22px auto 0; padding: 10px 26px 10px 34px; background: #f26a1b; color: #fff; font-weight: 800; font-size: 27px;
  clip-path: polygon(22px 0, 100% 0, 100% 100%, 22px 100%, 0 50%); }}
</style></head><body><div class="wrap">
<div class="kit"><img src="file://{DIR}/kit-box.webp"><div class="ribbon">{w['value'].format(v=KIT)}</div></div>
<div class="grid">{cards}</div>
<div class="total">{w['total'].format(t=num(TOTAL))}</div>
<div class="week">{w['week']}</div>
<div class="price"><span class="was">{w['money'].format(v=WAS)}</span><span class="now">{w['money'].format(v=NOW)}</span></div>
<div class="save">{w['save'].format(s=WAS - NOW)}</div>
</div></body></html>"""


def build():
    for suffix, w in LANGS.items():
        with tempfile.TemporaryDirectory() as tmp:
            src, png = os.path.join(tmp, "v.html"), os.path.join(tmp, "v.png")
            open(src, "w", encoding="utf-8").write(page(w))
            subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2", "--window-size=1000,1500",
                            "--virtual-time-budget=8000", f"--screenshot={png}", f"file://{src}"], check=True, capture_output=True)
            im = Image.open(png).convert("RGB")
            # Cut the empty white under the last line (the window is taller than the picture).
            px = im.load()
            bottom = im.height - 1
            while bottom > 0 and all(px[x, bottom] == (255, 255, 255) for x in range(0, im.width, 7)):
                bottom -= 1
            im = im.crop((0, 0, im.width, min(im.height, bottom + 80))).resize((1000, round(min(im.height, bottom + 80) / 2)), Image.LANCZOS)
            # A new name, not value-stack*-w.webp: browsers keep /funnels/* for a week and would show the old picture.
            out = os.path.join(DIR, f"value-stack-6{suffix}.webp")
            im.save(out, quality=86, method=6)
            print(os.path.basename(out), im.size, os.path.getsize(out))


if __name__ == "__main__":
    build()
