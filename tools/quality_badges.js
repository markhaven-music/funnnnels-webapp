// Rewrites the words on the Drum Kit's gold guarantee seal: "100% MONEY BACK /
// GUARANTEE" becomes the quality guarantee the copy now promises, per language.
// Same seal, same black ring; only the ring's words change.
// usage: node tools/quality_badges.js . public/funnels/midi-drum-kit (made badge-quality*.webp, 2026-11-06)
const path = require("path");
const sharp = require(path.join(process.argv[2], "node_modules/sharp"));

const SRC = path.join(process.argv[2], "public/funnels/midi-drum-kit");
const OUT = process.argv[3];

// top arc, bottom arc
const WORDS = {
  en: ["14-DAY QUALITY", "GUARANTEE"],
  fr: ["GARANTIE QUALITÉ", "14 JOURS"],
  es: ["GARANTÍA DE CALIDAD", "14 DÍAS"],
  de: ["QUALITÄTSGARANTIE", "14 TAGE"],
  it: ["GARANZIA DI QUALITÀ", "14 GIORNI"],
};

// The two pictures: the landing's (green square) and the order page's (transparent).
const BADGES = [
  { file: "badge-dont-overthink.webp", out: "badge-quality", cx: 253, cy: 256, rIn: 74.5, rOut: 113, font: 21 },
  { file: "badge-guarantee.webp", out: "badge-quality-sm", cx: 87, cy: 91, rIn: 39.5, rOut: 59, font: 11 },
];

// Arial Black's advances per 100px (measured with canvas measureText in Chromium).
const ADV = {"1":66.7,"4":66.7,"-":33.3,"D":77.8,"A":77.8,"Y":77.8," ":33.3,"Q":83.3,"U":83.3,"L":66.7,"I":38.9,"T":72.2,"G":83.3,"R":77.8,"N":83.3,"E":72.2,"É":72.2,"J":66.7,"O":83.3,"S":72.2,"Í":38.9,"C":77.8,"Ä":77.8,"Z":72.2,"À":77.8};
const adv = (ch, size) => ((ADV[ch] ?? 75) * size) / 100;
const width = (text, size, track) => [...text].reduce((n, ch) => n + adv(ch, size), 0) + ([...text].length - 1) * track;
const esc = (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch] ?? ch;

// librsvg has no textPath: each letter is placed and turned on its own.
function arcText(b, text, top) {
  const mid = (b.rIn + b.rOut) / 2;
  const maxArc = mid * ((140 * Math.PI) / 180);
  let size = b.font;
  while (width(text, size, size * 0.06) > maxArc && size > b.font * 0.6) size -= 0.25;
  const track = size * 0.06;
  const cap = size * 0.716;
  // Top: clockwise, letters pointing outward, baseline inside the middle.
  // Bottom: left to right along the bottom, letters pointing inward.
  const r = top ? mid - cap / 2 : mid + cap / 2;
  const total = width(text, size, track);
  const span = total / r;
  let s = 0;
  const out = [];
  for (const ch of text) {
    const w = adv(ch, size);
    const at = s + w / 2;
    s += w + track;
    if (ch === " ") continue;
    const th = top ? Math.PI / 2 + span / 2 - at / r : (3 * Math.PI) / 2 - span / 2 + at / r;
    const x = b.cx + r * Math.cos(th);
    const y = b.cy - r * Math.sin(th);
    const rot = top ? 90 - (th * 180) / Math.PI : -((th * 180) / Math.PI + 90);
    out.push(
      `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" transform="rotate(${rot.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})" text-anchor="middle" font-family="Arial Black" font-size="${size}" fill="#fff">${esc(ch)}</text>`,
    );
  }
  return out.join("\n  ");
}

async function ringColor(b, img) {
  const { data, info } = await img.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const mid = (b.rIn + b.rOut) / 2;
  const vals = [];
  // Between the words, where the ring is plain black: around 2 and 4 o'clock... take the darkest.
  for (let deg = 0; deg < 360; deg += 3) {
    const a = (deg * Math.PI) / 180;
    const x = Math.round(b.cx + mid * Math.cos(a));
    const y = Math.round(b.cy - mid * Math.sin(a));
    const i = (y * info.width + x) * 3;
    vals.push([data[i], data[i + 1], data[i + 2]]);
  }
  vals.sort((p, q) => p[0] + p[1] + p[2] - (q[0] + q[1] + q[2]));
  const k = vals[Math.floor(vals.length * 0.25)];
  return `rgb(${k.join(",")})`;
}

(async () => {
  for (const b of BADGES) {
    const img = sharp(path.join(SRC, b.file));
    const meta = await img.metadata();
    const fill = await ringColor(b, img);
    for (const [lang, [top, bottom]] of Object.entries(WORDS)) {
      const mid = (b.rIn + b.rOut) / 2;
      const dot = (b.rOut - b.rIn) * 0.11;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${meta.width}" height="${meta.height}">
  <circle cx="${b.cx}" cy="${b.cy}" r="${mid}" fill="none" stroke="${fill}" stroke-width="${b.rOut - b.rIn}"/>
  <circle cx="${b.cx - mid}" cy="${b.cy}" r="${dot}" fill="#fff"/>
  <circle cx="${b.cx + mid}" cy="${b.cy}" r="${dot}" fill="#fff"/>
  ${arcText(b, top, true)}
  ${arcText(b, bottom, false)}
</svg>`;
      const name = lang === "en" ? b.out : `${b.out}-${lang}`;
      await img
        .clone()
        .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
        .webp({ quality: 90 })
        .toFile(path.join(OUT, `${name}.webp`));
      await sharp(path.join(OUT, `${name}.webp`)).png().toFile(path.join(OUT, `${name}.png`));
      console.log(name, fill);
    }
  }
})();
