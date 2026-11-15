// Cut a product box render from its black background: node tools/cut_box.cjs <png> <out dir> <name>
// (Higgsfield's remover eats black boxes on black), soften the edge, crop, write webp sizes.
const sharp = require("sharp");
const [src, outDir, name] = process.argv.slice(2);
(async () => {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info, T = 9;
  const dark = (i) => Math.max(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) <= T;
  const bg = new Uint8Array(w * h), stack = [];
  const push = (x, y) => { const i = y * w + x; if (!bg[i] && dark(i)) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) { const i = stack.pop(), x = i % w, y = (i / w) | 0; if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1); }
  // The box's spine is as black as the background, so the fill eats it: keep everything inside the
  // convex outline of what survived (a box seen from one side is a convex shape).
  const pts = [];
  for (let y = 0; y < h; y++) { let lo = -1, hi = -1; for (let x = 0; x < w; x++) if (!bg[y * w + x]) { if (lo < 0) lo = x; hi = x; } if (lo >= 0) { pts.push([lo, y]); if (hi !== lo) pts.push([hi, y]); } }
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const half = (list) => { const out = []; for (const p of list) { while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop(); out.push(p); } out.pop(); return out; };
  const hull = half(pts).concat(half(pts.slice().reverse()));
  for (let y = 0; y < h; y++) {
    const xs = [];
    for (let k = 0; k < hull.length; k++) { const [ax, ay] = hull[k], [bx, by] = hull[(k + 1) % hull.length]; if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax)); }
    if (xs.length >= 2) { const lo = Math.ceil(Math.min(...xs)), hi = Math.floor(Math.max(...xs)); for (let x = lo; x <= hi; x++) bg[y * w + x] = 0; }
  }
  let n = 0, x0 = w, x1 = 0, y0 = h, y1 = 0;
  for (let i = 0; i < w * h; i++) { if (bg[i]) { data[i * 4 + 3] = 0; n++; } else { const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  // one-pixel soften: a kept pixel touching the background gets half alpha
  const a = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) a[i] = data[i * 4 + 3];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (a[i] && (!a[i - 1] || !a[i + 1] || !a[i - w] || !a[i + w])) data[i * 4 + 3] = 128; }
  console.log(`size ${w}x${h}, background ${(100 * n / (w * h)).toFixed(1)}%, box ${x0},${y0} to ${x1},${y1}`);
  const cut = sharp(data, { raw: { width: w, height: h, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
  const png = await cut.png().toBuffer();
  for (const size of [340, 520, 680]) {
    const out = `${outDir}/${name}-${size}.webp`;
    const r = await sharp(png).resize({ width: size }).webp({ quality: 86 }).toFile(out);
    console.log(out.split("/").pop(), r.width + "x" + r.height, r.size + " bytes");
  }
  await sharp(png).resize({ width: 520 }).flatten({ background: "#3a6" }).jpeg().toFile(`${outDir}/${name}-check.jpg`);
})();
